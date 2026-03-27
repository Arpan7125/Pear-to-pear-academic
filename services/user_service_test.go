// Package services - Unit tests for UserService
//
// GO CONCEPT 8: UNIT TEST CASES
// This file demonstrates:
// - Table-driven tests
// - Test setup and teardown
// - Subtests with t.Run
// - Test assertions
package services

import (
	"testing"

	"p2p-library/models"
	"p2p-library/store"
)

// ============================================================================
// TEST SETUP
// ============================================================================

func setupUserTest() (*UserService, *store.MemoryStore) {
	memStore := store.NewMemoryStore()
	userService := NewUserService(memStore)
	return userService, memStore
}

// ============================================================================
// TABLE-DRIVEN TESTS
// ============================================================================

func TestCalculateReputation(t *testing.T) {
	// Table-driven test cases
	tests := []struct {
		name      string
		uploads   int
		downloads int
		avgRating float64
		expected  int
	}{
		{
			name:      "zero_activity",
			uploads:   0,
			downloads: 0,
			avgRating: 0,
			expected:  0,
		},
		{
			name:      "contributor",
			uploads:   50,
			downloads: 30,
			avgRating: 4.5,
			expected:  50*2 - 30 + int(4.5*10), // 100 - 30 + 45 = 115
		},
		{
			name:      "leecher",
			uploads:   5,
			downloads: 50,
			avgRating: 2.0,
			expected:  5*2 - 50 + int(2.0*10), // 10 - 50 + 20 = -20
		},
		{
			name:      "neutral",
			uploads:   20,
			downloads: 20,
			avgRating: 3.0,
			expected:  20*2 - 20 + int(3.0*10), // 40 - 20 + 30 = 50
		},
		{
			name:      "high_contributor",
			uploads:   100,
			downloads: 10,
			avgRating: 5.0,
			expected:  100*2 - 10 + int(5.0*10), // 200 - 10 + 50 = 240
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateReputation(tt.uploads, tt.downloads, tt.avgRating)
			if got != tt.expected {
				t.Errorf("CalculateReputation(%d, %d, %.1f) = %d; want %d",
					tt.uploads, tt.downloads, tt.avgRating, got, tt.expected)
			}
		})
	}
}

func TestUpdateReputationByValue(t *testing.T) {
	original := models.User{
		ID:         "test-user",
		Reputation: 0,
	}

	// Call by value - original should NOT change
	modified := UpdateReputationByValue(original, 10)

	if original.Reputation != 0 {
		t.Errorf("Original changed, got %d, want 0", original.Reputation)
	}

	if modified.Reputation != 10 {
		t.Errorf("Modified wrong, got %d, want 10", modified.Reputation)
	}
}

func TestUpdateReputationByPointer(t *testing.T) {
	user := &models.User{
		ID:         "test-user",
		Reputation: 0,
	}

	// Call by reference - original SHOULD change
	UpdateReputationByPointer(user, 10)

	if user.Reputation != 10 {
		t.Errorf("User not modified, got %d, want 10", user.Reputation)
	}
}

// ============================================================================
// USER SERVICE TESTS
// ============================================================================

func TestCreateUser(t *testing.T) {
	service, _ := setupUserTest()

	user, err := service.CreateUser("testuser", "test@example.com", "password123")

	if err != nil {
		t.Fatalf("CreateUser failed: %v", err)
	}

	if user.Username != "testuser" {
		t.Errorf("Username = %s; want testuser", user.Username)
	}

	if user.Email != "test@example.com" {
		t.Errorf("Email = %s; want test@example.com", user.Email)
	}

	if user.Classification != models.ClassNeutral {
		t.Errorf("Classification = %s; want Neutral", user.Classification)
	}
}

func TestGetUser(t *testing.T) {
	service, _ := setupUserTest()

	// Create a user first
	created, _ := service.CreateUser("testuser", "test@example.com", "password")

	// Get the user
	got, err := service.GetUser(created.ID)

	if err != nil {
		t.Fatalf("GetUser failed: %v", err)
	}

	if got.ID != created.ID {
		t.Errorf("ID mismatch: got %s, want %s", got.ID, created.ID)
	}
}

func TestRecordUpload(t *testing.T) {
	service, _ := setupUserTest()

	user, _ := service.CreateUser("uploader", "up@test.com", "pass")

	err := service.RecordUpload(user.ID)
	if err != nil {
		t.Fatalf("RecordUpload failed: %v", err)
	}

	updated, _ := service.GetUser(user.ID)

	if updated.TotalUploads != 1 {
		t.Errorf("TotalUploads = %d; want 1", updated.TotalUploads)
	}

	if updated.Reputation <= 0 {
		t.Errorf("Reputation should increase after upload: %d", updated.Reputation)
	}
}

func TestRecordDownload(t *testing.T) {
	service, _ := setupUserTest()

	// Create user with some uploads first
	user, _ := service.CreateUser("downloader", "down@test.com", "pass")
	service.RecordUpload(user.ID)
	service.RecordUpload(user.ID)

	initialUser, _ := service.GetUser(user.ID)
	initialRep := initialUser.Reputation // capture value, not pointer

	err := service.RecordDownload(user.ID)
	if err != nil {
		t.Fatalf("RecordDownload failed: %v", err)
	}

	updated, _ := service.GetUser(user.ID)

	if updated.TotalDownloads != 1 {
		t.Errorf("TotalDownloads = %d; want 1", updated.TotalDownloads)
	}

	if updated.Reputation >= initialRep {
		t.Errorf("Reputation should decrease after download: was %d, now %d", initialRep, updated.Reputation)
	}
}

func TestGetLeaderboard(t *testing.T) {
	service, _ := setupUserTest()

	// Create users with different reputations
	u1, _ := service.CreateUser("user1", "u1@test.com", "pass")
	u2, _ := service.CreateUser("user2", "u2@test.com", "pass")
	u3, _ := service.CreateUser("user3", "u3@test.com", "pass")

	// Give them different upload counts
	for i := 0; i < 5; i++ {
		service.RecordUpload(u1.ID)
	}
	for i := 0; i < 3; i++ {
		service.RecordUpload(u2.ID)
	}
	service.RecordUpload(u3.ID)

	leaders, err := service.GetLeaderboard(3)
	if err != nil {
		t.Fatalf("GetLeaderboard failed: %v", err)
	}

	if len(leaders) != 3 {
		t.Errorf("Leaderboard size = %d; want 3", len(leaders))
	}

	// Check order (highest first)
	if leaders[0].TotalUploads < leaders[1].TotalUploads {
		t.Error("Leaderboard not sorted correctly")
	}
}
