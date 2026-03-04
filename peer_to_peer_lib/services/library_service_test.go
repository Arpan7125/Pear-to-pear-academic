// Package services - Unit tests for LibraryService
package services

import (
	"testing"
	
	"p2p-library/models"
	"p2p-library/store"
)

func setupLibraryTest() (*LibraryService, *UserService, *store.MemoryStore) {
	memStore := store.NewMemoryStore()
	userService := NewUserService(memStore)
	libraryService := NewLibraryService(memStore, userService)
	return libraryService, userService, memStore
}

func TestUploadResource(t *testing.T) {
	libService, userService, _ := setupLibraryTest()
	
	// Create a user
	user, _ := userService.CreateUser("uploader", "up@test.com", "pass")
	
	// Create resource
	resource := models.NewResource("test.pdf", 1024*1024, user.ID)
	resource.Title = "Test Document"
	resource.Subject = "Computer Science"
	
	err := libService.Upload(resource)
	if err != nil {
		t.Fatalf("Upload failed: %v", err)
	}
	
	// Verify resource stored
	got, err := libService.GetResource(resource.ID)
	if err != nil {
		t.Fatalf("GetResource failed: %v", err)
	}
	
	if got.Title != "Test Document" {
		t.Errorf("Title = %s; want Test Document", got.Title)
	}
}

func TestDownloadResource(t *testing.T) {
	libService, userService, _ := setupLibraryTest()
	
	uploader, _ := userService.CreateUser("uploader", "up@test.com", "pass")
	downloader, _ := userService.CreateUser("downloader", "down@test.com", "pass")
	
	resource := models.NewResource("test.pdf", 1024, uploader.ID)
	libService.Upload(resource)
	
	// Download
	downloaded, err := libService.Download(resource.ID, downloader.ID)
	if err != nil {
		t.Fatalf("Download failed: %v", err)
	}
	
	if downloaded.DownloadCount != 1 {
		t.Errorf("DownloadCount = %d; want 1", downloaded.DownloadCount)
	}
}

func TestGetPopular(t *testing.T) {
	libService, userService, _ := setupLibraryTest()
	
	user, _ := userService.CreateUser("user", "u@test.com", "pass")
	
	// Create resources
	r1 := models.NewResource("pop1.pdf", 1024, user.ID)
	r2 := models.NewResource("pop2.pdf", 1024, user.ID)
	r3 := models.NewResource("pop3.pdf", 1024, user.ID)
	
	libService.Upload(r1)
	libService.Upload(r2)
	libService.Upload(r3)
	
	// Download r2 multiple times
	for i := 0; i < 5; i++ {
		libService.Download(r2.ID, user.ID)
	}
	// Download r1 once
	libService.Download(r1.ID, user.ID)
	
	popular, err := libService.GetPopular(2)
	if err != nil {
		t.Fatalf("GetPopular failed: %v", err)
	}
	
	if len(popular) != 2 {
		t.Errorf("Got %d results; want 2", len(popular))
	}
	
	// r2 should be first (most downloads)
	if popular[0].ID != r2.ID {
		t.Error("Most popular resource not first")
	}
}

func TestFilterBySubject(t *testing.T) {
	libService, userService, _ := setupLibraryTest()
	
	user, _ := userService.CreateUser("user", "u@test.com", "pass")
	
	r1 := models.NewResource("math.pdf", 1024, user.ID)
	r1.Subject = "Mathematics"
	
	r2 := models.NewResource("cs.pdf", 1024, user.ID)
	r2.Subject = "Computer Science"
	
	r3 := models.NewResource("math2.pdf", 1024, user.ID)
	r3.Subject = "Mathematics"
	
	libService.Upload(r1)
	libService.Upload(r2)
	libService.Upload(r3)
	
	mathResources, err := libService.FilterBySubject("Mathematics")
	if err != nil {
		t.Fatalf("FilterBySubject failed: %v", err)
	}
	
	if len(mathResources) != 2 {
		t.Errorf("Got %d resources; want 2", len(mathResources))
	}
}

func TestSearchWithFilters(t *testing.T) {
	libService, userService, _ := setupLibraryTest()
	
	user, _ := userService.CreateUser("user", "u@test.com", "pass")
	
	r1 := models.NewResource("golang.pdf", 1024, user.ID)
	r1.Title = "Go Programming"
	r1.Subject = "Computer Science"
	
	r2 := models.NewResource("python.pdf", 1024, user.ID)
	r2.Title = "Python Basics"
	r2.Subject = "Computer Science"
	
	r3 := models.NewResource("calculus.pdf", 1024, user.ID)
	r3.Title = "Calculus Fundamentals"
	r3.Subject = "Mathematics"
	
	libService.Upload(r1)
	libService.Upload(r2)
	libService.Upload(r3)
	
	// Search for "go" in CS
	results, err := libService.SearchWithFilters("go", "Computer Science", 0, "")
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
	
	if len(results) != 1 {
		t.Errorf("Got %d results; want 1", len(results))
	}
	
	if len(results) > 0 && results[0].ID != r1.ID {
		t.Error("Wrong resource returned")
	}
}
