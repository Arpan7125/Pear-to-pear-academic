package services

import (
	"context"
	"testing"
	"time"

	"p2p-library/models"
)

func TestStreamDownloadCompletes(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	result, err := svc.StreamDownload(ctx, models.ContentID("res-1"), 3*models.ChunkSize, models.ClassNeutral)
	if err != nil {
		t.Fatalf("StreamDownload failed: %v", err)
	}

	if result.TotalChunks != 3 {
		t.Fatalf("TotalChunks=%d want=3", result.TotalChunks)
	}
	if result.SentChunks != 3 {
		t.Fatalf("SentChunks=%d want=3", result.SentChunks)
	}
	if result.Elapsed <= 0 {
		t.Fatalf("elapsed should be > 0")
	}
}

func TestStreamDownloadHonorsContextCancellation(t *testing.T) {
	svc := NewTransferService()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Millisecond)
	defer cancel()

	_, err := svc.StreamDownload(ctx, models.ContentID("res-2"), 100*models.ChunkSize, models.ClassLeecher)
	if err == nil {
		t.Fatalf("expected cancellation error")
	}
}

func TestStreamDownloadThrottleDifference(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	contributor, err := svc.StreamDownload(ctx, models.ContentID("res-fast"), 5*models.ChunkSize, models.ClassContributor)
	if err != nil {
		t.Fatalf("contributor transfer failed: %v", err)
	}

	leecher, err := svc.StreamDownload(ctx, models.ContentID("res-slow"), 5*models.ChunkSize, models.ClassLeecher)
	if err != nil {
		t.Fatalf("leecher transfer failed: %v", err)
	}

	if leecher.Elapsed <= contributor.Elapsed {
		t.Fatalf("leecher should be throttled; leecher=%v contributor=%v", leecher.Elapsed, contributor.Elapsed)
	}
}

func TestStreamDownloadRejectsInvalidFileSize(t *testing.T) {
	svc := NewTransferService()
	_, err := svc.StreamDownload(context.Background(), models.ContentID("res-invalid"), -1, models.ClassContributor)
	if err == nil {
		t.Fatalf("expected invalid file size error")
	}
}

// ============================================================================
// WORKER POOL TESTS
// ============================================================================

func TestWorkerPoolCompletesAllChunks(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	result, _, err := svc.StreamDownloadWithWorkers(
		ctx,
		models.ContentID("res-wp-1"),
		5*models.ChunkSize,
		models.ClassContributor,
		3, // 3 workers
	)
	if err != nil {
		t.Fatalf("StreamDownloadWithWorkers failed: %v", err)
	}

	if result.TotalChunks != 5 {
		t.Fatalf("TotalChunks=%d want=5", result.TotalChunks)
	}
	if result.SentChunks != 5 {
		t.Fatalf("SentChunks=%d want=5", result.SentChunks)
	}
}

func TestWorkerPoolWithSingleWorker(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	result, _, err := svc.StreamDownloadWithWorkers(
		ctx,
		models.ContentID("res-wp-single"),
		3*models.ChunkSize,
		models.ClassNeutral,
		1, // single worker
	)
	if err != nil {
		t.Fatalf("single-worker failed: %v", err)
	}

	if result.SentChunks != 3 {
		t.Fatalf("SentChunks=%d want=3", result.SentChunks)
	}
}

func TestWorkerPoolDefaultsWorkerCount(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	// numWorkers <= 0 should default to 3
	result, _, err := svc.StreamDownloadWithWorkers(
		ctx,
		models.ContentID("res-wp-default"),
		2*models.ChunkSize,
		models.ClassContributor,
		0,
	)
	if err != nil {
		t.Fatalf("default workers failed: %v", err)
	}

	if result.SentChunks != 2 {
		t.Fatalf("SentChunks=%d want=2", result.SentChunks)
	}
}

func TestWorkerPoolRejectsInvalidFileSize(t *testing.T) {
	svc := NewTransferService()
	_, _, err := svc.StreamDownloadWithWorkers(
		context.Background(),
		models.ContentID("res-wp-invalid"),
		-1,
		models.ClassContributor,
		3,
	)
	if err == nil {
		t.Fatalf("expected invalid file size error")
	}
}

func TestWorkerPoolContextCancellation(t *testing.T) {
	svc := NewTransferService()
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	result, _, err := svc.StreamDownloadWithWorkers(
		ctx,
		models.ContentID("res-wp-cancel"),
		100*models.ChunkSize,
		models.ClassLeecher,
		3,
	)
	// Either an error or incomplete transfer is acceptable
	if err == nil && result.SentChunks == 100 {
		t.Fatalf("expected incomplete transfer under cancellation")
	}
}

// ============================================================================
// BATCH VALIDATION TESTS
// ============================================================================

func TestValidateBatchAllValid(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	ids := []models.ContentID{"res-a", "res-b", "res-c", "res-d"}

	results := svc.ValidateBatch(ctx, ids)

	if len(results) != len(ids) {
		t.Fatalf("got %d results; want %d", len(results), len(ids))
	}

	for _, r := range results {
		if !r.Valid {
			t.Errorf("resource %s should be valid", r.ResourceID)
		}
	}
}

func TestValidateBatchWithEmptyID(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	ids := []models.ContentID{"res-ok", ""}

	results := svc.ValidateBatch(ctx, ids)

	if len(results) != 2 {
		t.Fatalf("got %d results; want 2", len(results))
	}

	invalidCount := 0
	for _, r := range results {
		if !r.Valid {
			invalidCount++
		}
	}

	if invalidCount != 1 {
		t.Errorf("expected 1 invalid; got %d", invalidCount)
	}
}

func TestValidateBatchEmptyInput(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	results := svc.ValidateBatch(ctx, []models.ContentID{})

	if len(results) != 0 {
		t.Fatalf("got %d results for empty input; want 0", len(results))
	}
}

func TestValidateBatchConcurrentExecution(t *testing.T) {
	svc := NewTransferService()
	ctx := context.Background()

	// Large batch to ensure multiple goroutines run concurrently
	ids := make([]models.ContentID, 20)
	for i := range ids {
		ids[i] = models.ContentID("res-" + string(rune('a'+i)))
	}

	start := time.Now()
	results := svc.ValidateBatch(ctx, ids)
	elapsed := time.Since(start)

	if len(results) != 20 {
		t.Fatalf("got %d results; want 20", len(results))
	}

	// If concurrent, 20 × 1ms should take much less than 20ms
	if elapsed > 15*time.Millisecond {
		t.Errorf("batch took %v; should be faster with concurrency", elapsed)
	}
}
