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
