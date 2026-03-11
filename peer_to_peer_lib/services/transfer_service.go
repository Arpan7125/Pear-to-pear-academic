package services

import (
	"context"
	"sync"
	"time"

	"p2p-library/models"
)

// TransferResult captures the outcome of a simulated chunked transfer.
type TransferResult struct {
	ResourceID    models.ContentID
	TotalChunks   int
	SentChunks    int
	Elapsed       time.Duration
	ThrottleClass models.UserClassification
}

// ChunkProgress reports the status of a single chunk transfer.
// GO CONCEPT 9: Sent over a channel to report progress from goroutines.
type ChunkProgress struct {
	ChunkIndex int
	WorkerID   int
	Status     string // "sent", "failed"
}

// BatchResult captures the outcome of a concurrent batch integrity check.
type BatchResult struct {
	ResourceID models.ContentID
	Valid      bool
	WorkerID   int
}

// TransferService simulates throttled P2P transfers using goroutines/channels.
type TransferService struct{}

// NewTransferService creates a transfer service.
func NewTransferService() *TransferService {
	return &TransferService{}
}

// ============================================================================
// GO CONCEPT 9: GOROUTINES AND CHANNELS
// ============================================================================
//
// Goroutines are lightweight threads managed by the Go runtime.
//   - Launched with the `go` keyword: go func() { ... }()
//   - Much cheaper than OS threads (~2 KB stack vs ~1 MB)
//
// Channels are typed conduits for communication between goroutines.
//   - Unbuffered: sender blocks until receiver is ready (synchronous handoff)
//   - Buffered:   sender blocks only when the buffer is full
//   - Directional: chan<- (send-only), <-chan (receive-only)
//
// Select lets a goroutine wait on multiple channel operations.
//
// sync.WaitGroup coordinates completion of a set of goroutines.
// ============================================================================

// StreamDownload simulates chunk transfer with class-based throttling.
// Demonstrates: goroutines, unbuffered channels, select, ticker-based flow.
func (s *TransferService) StreamDownload(
	ctx context.Context,
	resourceID models.ContentID,
	fileSize int64,
	classification models.UserClassification,
) (*TransferResult, error) {
	if fileSize < 0 {
		return nil, models.ErrInvalidFileSize
	}

	totalChunks := int(fileSize / models.ChunkSize)
	if fileSize%models.ChunkSize != 0 || fileSize == 0 {
		totalChunks++
	}

	speed := GetThrottleMultiplier(classification)
	if speed <= 0 {
		speed = 0.1
	}

	baseTick := 10 * time.Millisecond
	interval := time.Duration(float64(baseTick) / speed)
	if interval < time.Millisecond {
		interval = time.Millisecond
	}

	// Unbuffered channel: sender blocks until receiver reads (synchronous handoff)
	chunkQueue := make(chan int)

	// Signalling channels: struct{} costs zero bytes
	done := make(chan struct{})

	// Buffered channel (capacity 1): non-blocking send for first error
	errCh := make(chan error, 1)

	start := time.Now()

	// GOROUTINE 1 — Producer: emits chunk indices at throttled intervals
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		defer close(chunkQueue) // closing signals the consumer to stop

		for chunkIndex := 0; chunkIndex < totalChunks; chunkIndex++ {
			// SELECT: wait on whichever channel is ready first
			select {
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			case <-ticker.C:
				chunkQueue <- chunkIndex // blocks until consumer reads
			}
		}
	}()

	// GOROUTINE 2 — Consumer: counts chunks as they arrive
	sent := 0
	go func() {
		// range over channel: loops until channel is closed
		for range chunkQueue {
			sent++
		}
		close(done)
	}()

	// SELECT: wait for completion, error, or context cancellation
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case err := <-errCh:
		return nil, err
	case <-done:
		return &TransferResult{
			ResourceID:    resourceID,
			TotalChunks:   totalChunks,
			SentChunks:    sent,
			Elapsed:       time.Since(start),
			ThrottleClass: classification,
		}, nil
	}
}

// ============================================================================
// GO CONCEPT 9: WORKER POOL PATTERN (Fan-Out / Fan-In)
// ============================================================================
// Multiple goroutines (workers) read from a single jobs channel and write
// results to a single results channel. This distributes work across N workers.
//
//   jobs channel ──► worker 1 ──┐
//                ──► worker 2 ──┼──► results channel
//                ──► worker 3 ──┘

// StreamDownloadWithWorkers performs a chunked download using a worker pool.
// Demonstrates: worker pool, sync.WaitGroup, buffered channels, directional channels.
func (s *TransferService) StreamDownloadWithWorkers(
	ctx context.Context,
	resourceID models.ContentID,
	fileSize int64,
	classification models.UserClassification,
	numWorkers int,
) (*TransferResult, <-chan ChunkProgress, error) {
	if fileSize < 0 {
		return nil, nil, models.ErrInvalidFileSize
	}
	if numWorkers <= 0 {
		numWorkers = 3
	}

	totalChunks := int(fileSize / models.ChunkSize)
	if fileSize%models.ChunkSize != 0 || fileSize == 0 {
		totalChunks++
	}

	speed := GetThrottleMultiplier(classification)
	if speed <= 0 {
		speed = 0.1
	}

	// BUFFERED CHANNELS: capacity = totalChunks so producers don't block
	jobs := make(chan int, totalChunks)

	// DIRECTIONAL CHANNEL: progress is returned as receive-only (<-chan)
	progress := make(chan ChunkProgress, totalChunks)

	start := time.Now()

	// WAITGROUP: tracks when all workers finish
	var wg sync.WaitGroup

	// FAN-OUT: launch N worker goroutines, all reading from the same `jobs` channel
	for w := 0; w < numWorkers; w++ {
		wg.Add(1)
		workerID := w

		go func() {
			defer wg.Done()

			// Each worker processes jobs until the channel is closed
			for chunkIndex := range jobs {
				// Simulate work with throttle-based delay
				delay := time.Duration(float64(time.Millisecond) / speed)
				select {
				case <-ctx.Done():
					progress <- ChunkProgress{
						ChunkIndex: chunkIndex,
						WorkerID:   workerID,
						Status:     "failed",
					}
					return
				case <-time.After(delay):
					// FAN-IN: all workers write to the same progress channel
					progress <- ChunkProgress{
						ChunkIndex: chunkIndex,
						WorkerID:   workerID,
						Status:     "sent",
					}
				}
			}
		}()
	}

	// Producer: enqueue all chunk indices then close the jobs channel
	go func() {
		for i := 0; i < totalChunks; i++ {
			select {
			case <-ctx.Done():
				break
			case jobs <- i:
			}
		}
		close(jobs) // signals workers that no more jobs are coming
	}()

	// Collector goroutine: waits for all workers, then closes progress
	go func() {
		wg.Wait()
		close(progress)
	}()

	// Drain the progress channel and count successes
	sentCount := 0
	for p := range progress {
		if p.Status == "sent" {
			sentCount++
		}
	}

	return &TransferResult{
		ResourceID:    resourceID,
		TotalChunks:   totalChunks,
		SentChunks:    sentCount,
		Elapsed:       time.Since(start),
		ThrottleClass: classification,
	}, nil, nil
}

// ============================================================================
// GO CONCEPT 9: CONCURRENT BATCH PROCESSING WITH WAITGROUP
// ============================================================================

// ValidateBatch concurrently validates a batch of resource IDs.
// Demonstrates: goroutines, WaitGroup, buffered result channel.
func (s *TransferService) ValidateBatch(
	ctx context.Context,
	resourceIDs []models.ContentID,
) []BatchResult {
	// Buffered channel: capacity = number of resources to avoid goroutine blocking
	resultsCh := make(chan BatchResult, len(resourceIDs))

	var wg sync.WaitGroup

	// Launch one goroutine per resource (fan-out)
	for i, id := range resourceIDs {
		wg.Add(1)
		workerID := i
		resID := id // capture loop variable for goroutine closure

		go func() {
			defer wg.Done()

			// Simulate validation work
			select {
			case <-ctx.Done():
				resultsCh <- BatchResult{ResourceID: resID, Valid: false, WorkerID: workerID}
			case <-time.After(time.Millisecond):
				// Simple validation: ID must not be empty
				valid := string(resID) != ""
				resultsCh <- BatchResult{ResourceID: resID, Valid: valid, WorkerID: workerID}
			}
		}()
	}

	// Close results channel after all goroutines complete
	go func() {
		wg.Wait()
		close(resultsCh)
	}()

	// Collect results (fan-in)
	results := make([]BatchResult, 0, len(resourceIDs))
	for r := range resultsCh {
		results = append(results, r)
	}

	return results
}
