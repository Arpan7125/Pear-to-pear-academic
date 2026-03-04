package services

import (
	"context"
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

// TransferService simulates throttled P2P transfers using goroutines/channels.
type TransferService struct{}

// NewTransferService creates a transfer service.
func NewTransferService() *TransferService {
	return &TransferService{}
}

// StreamDownload simulates chunk transfer with class-based throttling.
// It demonstrates goroutines, channels, select, and ticker-based flow control.
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

	chunkQueue := make(chan int)
	done := make(chan struct{})
	errCh := make(chan error, 1)

	start := time.Now()

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		defer close(chunkQueue)

		for chunkIndex := 0; chunkIndex < totalChunks; chunkIndex++ {
			select {
			case <-ctx.Done():
				errCh <- ctx.Err()
				return
			case <-ticker.C:
				chunkQueue <- chunkIndex
			}
		}
	}()

	sent := 0
	go func() {
		for range chunkQueue {
			sent++
		}
		close(done)
	}()

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
