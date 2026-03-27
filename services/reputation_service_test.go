// Package services - Unit tests for ReputationService
package services

import (
	"testing"
	
	"p2p-library/models"
	"p2p-library/store"
)

func setupReputationTest() (*ReputationService, *UserService, *store.MemoryStore) {
	memStore := store.NewMemoryStore()
	userService := NewUserService(memStore)
	repService := NewReputationService(memStore)
	return repService, userService, memStore
}

func TestGetClassificationForScore(t *testing.T) {
	tests := []struct {
		score    int
		expected models.UserClassification
	}{
		{100, models.ClassContributor},
		{51, models.ClassContributor},
		{50, models.ClassNeutral},
		{25, models.ClassNeutral},
		{0, models.ClassNeutral},
		{-1, models.ClassLeecher},
		{-50, models.ClassLeecher},
	}
	
	for _, tt := range tests {
		got := GetClassificationForScore(tt.score)
		if got != tt.expected {
			t.Errorf("GetClassificationForScore(%d) = %s; want %s",
				tt.score, got, tt.expected)
		}
	}
}

func TestGetThrottleMultiplier(t *testing.T) {
	tests := []struct {
		class    models.UserClassification
		expected float64
	}{
		{models.ClassContributor, 1.0},
		{models.ClassNeutral, 0.7},
		{models.ClassLeecher, 0.3},
	}
	
	for _, tt := range tests {
		got := GetThrottleMultiplier(tt.class)
		if got != tt.expected {
			t.Errorf("GetThrottleMultiplier(%s) = %.1f; want %.1f",
				tt.class, got, tt.expected)
		}
	}
}

func TestCalculateUserReputation(t *testing.T) {
	repService, userService, _ := setupReputationTest()
	
	user, _ := userService.CreateUser("user", "u@test.com", "pass")
	
	// Initial reputation
	score, err := repService.Calculate(user.ID)
	if err != nil {
		t.Fatalf("Calculate failed: %v", err)
	}
	
	if score != 0 {
		t.Errorf("Initial score = %d; want 0", score)
	}
	
	// Add uploads
	for i := 0; i < 5; i++ {
		userService.RecordUpload(user.ID)
	}
	
	score, _ = repService.Calculate(user.ID)
	if score <= 0 {
		t.Errorf("Score after uploads should be positive: %d", score)
	}
}

func TestGetUserReputation(t *testing.T) {
	repService, userService, _ := setupReputationTest()
	
	user, _ := userService.CreateUser("user", "u@test.com", "pass")
	
	// Add activity
	for i := 0; i < 30; i++ {
		userService.RecordUpload(user.ID)
	}
	
	info, err := repService.GetUserReputation(user.ID)
	if err != nil {
		t.Fatalf("GetUserReputation failed: %v", err)
	}
	
	if info.Uploads != 30 {
		t.Errorf("Uploads = %d; want 30", info.Uploads)
	}
	
	if info.Classification != models.ClassContributor {
		t.Errorf("Classification = %s; want Contributor", info.Classification)
	}
}

func TestNetworkStats(t *testing.T) {
	repService, userService, _ := setupReputationTest()
	
	// Create users with different activities
	u1, _ := userService.CreateUser("contrib", "c@test.com", "pass")
	u2, _ := userService.CreateUser("neutral", "n@test.com", "pass")
	u3, _ := userService.CreateUser("leech", "l@test.com", "pass")
	
	// Make u1 a contributor
	for i := 0; i < 30; i++ {
		userService.RecordUpload(u1.ID)
	}
	
	// u2 stays neutral
	for i := 0; i < 10; i++ {
		userService.RecordUpload(u2.ID)
	}
	
	// Make u3 a leecher
	for i := 0; i < 50; i++ {
		userService.RecordDownload(u3.ID)
	}
	
	stats, err := repService.GetNetworkStats()
	if err != nil {
		t.Fatalf("GetNetworkStats failed: %v", err)
	}
	
	if stats.TotalUsers != 3 {
		t.Errorf("TotalUsers = %d; want 3", stats.TotalUsers)
	}
	
	if stats.Contributors < 1 {
		t.Error("Should have at least 1 contributor")
	}
}
