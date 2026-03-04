// Package services - Reputation service implementation
//
// GO CONCEPT 2: LOOPING STRUCTURES AND CONTROL FLOW
// GO CONCEPT 5: FUNCTIONS AND ERROR HANDLING
// This file demonstrates:
// - Reputation calculation algorithm
// - Switch statements for classification
// - Control flow for throttling logic
package services

import (
	"p2p-library/errors"
	"p2p-library/models"
	"p2p-library/store"
)

// ============================================================================
// REPUTATION SERVICE
// ============================================================================

// ReputationService handles reputation-related operations
type ReputationService struct {
	store *store.MemoryStore
}

// NewReputationService creates a new ReputationService
func NewReputationService(store *store.MemoryStore) *ReputationService {
	return &ReputationService{store: store}
}

// ============================================================================
// GO CONCEPT 2: CONTROL FLOW - REPUTATION CALCULATION
// ============================================================================

// CalculateReputation computes a user's reputation score
// Formula: (Uploads × 2) - Downloads + (AvgRating × 10)
// This is a pure function demonstrating calculation logic
func CalculateReputation(uploads, downloads int, avgRating float64) int {
	uploadScore := uploads * models.UploadWeight      // Uploads count double
	downloadPenalty := downloads * models.DownloadWeight // Downloads subtract
	ratingBonus := int(avgRating * float64(models.RatingWeight)) // Rating bonus
	
	score := uploadScore - downloadPenalty + ratingBonus
	
	// GO CONCEPT 2: Control flow with if-else for bounds
	if score < models.LowReputation {
		return models.LowReputation
	}
	
	return score
}

// GetClassification returns the classification for a score
// GO CONCEPT 2: Switch statement for classification
func GetClassificationForScore(score int) models.UserClassification {
	// GO CONCEPT 2: Switch with expression-less form
	switch {
	case score > models.ContributorThreshold:
		return models.ClassContributor
	case score >= models.NeutralThreshold:
		return models.ClassNeutral
	default:
		return models.ClassLeecher
	}
}

// GetThrottleMultiplier returns speed multiplier based on classification
// GO CONCEPT 2: Switch on value
func GetThrottleMultiplier(classification models.UserClassification) float64 {
	switch classification {
	case models.ClassContributor:
		return 1.0 // Full speed
	case models.ClassNeutral:
		return 0.7 // 70% speed
	case models.ClassLeecher:
		return 0.3 // 30% speed
	default:
		return 0.5 // Unknown classification
	}
}

// ============================================================================
// REPUTATION SERVICE METHODS
// ============================================================================

// Calculate computes and returns the reputation score for a user
func (s *ReputationService) Calculate(userID models.UserID) (models.ReputationScore, error) {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return 0, err
	}
	
	score := CalculateReputation(
		user.TotalUploads,
		user.TotalDownloads,
		user.AverageRating,
	)
	
	return models.ReputationScore(score), nil
}

// RecalculateAll recalculates reputation for all users
// GO CONCEPT 2: Loop through all users
func (s *ReputationService) RecalculateAll() error {
	users, err := s.store.GetAllUsers()
	if err != nil {
		return err
	}
	
	// GO CONCEPT 2: Range loop
	for _, user := range users {
		score := CalculateReputation(
			user.TotalUploads,
			user.TotalDownloads,
			user.AverageRating,
		)
		
		user.Reputation = models.ReputationScore(score)
		user.Classification = GetClassificationForScore(score)
		
		if err := s.store.UpdateUser(user); err != nil {
			// Continue with next user even if one fails
			continue
		}
	}
	
	return nil
}

// GetUserReputation returns reputation info for a user
func (s *ReputationService) GetUserReputation(userID models.UserID) (*ReputationInfo, error) {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return nil, err
	}
	
	return &ReputationInfo{
		UserID:         userID,
		Score:          user.Reputation,
		Classification: user.Classification,
		Uploads:        user.TotalUploads,
		Downloads:      user.TotalDownloads,
		AverageRating:  user.AverageRating,
		Throttle:       GetThrottleMultiplier(user.Classification),
	}, nil
}

// CheckAccessAllowed checks if user has sufficient reputation for an action
// GO CONCEPT 2: Control flow with error handling
func (s *ReputationService) CheckAccessAllowed(userID models.UserID, requiredScore int) error {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return err
	}
	
	// GO CONCEPT 2: Conditional check
	if int(user.Reputation) < requiredScore {
		return errors.NewReputationError(
			string(userID),
			requiredScore,
			int(user.Reputation),
			"access resource",
		)
	}
	
	return nil
}

// GetThrottleSpeed returns download speed for a user
func (s *ReputationService) GetThrottleSpeed(userID models.UserID) (float64, error) {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return 0, err
	}
	
	return GetThrottleMultiplier(user.Classification), nil
}

// ============================================================================
// STATISTICS AND ANALYTICS
// ============================================================================

// GetNetworkStats returns network-wide reputation statistics
func (s *ReputationService) GetNetworkStats() (*NetworkStats, error) {
	users, err := s.store.GetAllUsers()
	if err != nil {
		return nil, err
	}
	
	stats := &NetworkStats{
		TotalUsers:   len(users),
		Contributors: 0,
		Neutral:      0,
		Leechers:     0,
	}
	
	totalScore := 0
	
	// GO CONCEPT 2: Loop with accumulation
	for _, user := range users {
		totalScore += int(user.Reputation)
		
		// GO CONCEPT 2: Switch for counting
		switch user.Classification {
		case models.ClassContributor:
			stats.Contributors++
		case models.ClassNeutral:
			stats.Neutral++
		case models.ClassLeecher:
			stats.Leechers++
		}
	}
	
	// Calculate average
	if len(users) > 0 {
		stats.AverageScore = float64(totalScore) / float64(len(users))
	}
	
	return stats, nil
}

// ============================================================================
// DATA TYPES
// ============================================================================

// ReputationInfo contains reputation details for a user
type ReputationInfo struct {
	UserID         models.UserID             `json:"user_id"`
	Score          models.ReputationScore    `json:"score"`
	Classification models.UserClassification `json:"classification"`
	Uploads        int                       `json:"uploads"`
	Downloads      int                       `json:"downloads"`
	AverageRating  float64                   `json:"average_rating"`
	Throttle       float64                   `json:"throttle"`
}

// NetworkStats contains network-wide statistics
type NetworkStats struct {
	TotalUsers   int     `json:"total_users"`
	Contributors int     `json:"contributors"`
	Neutral      int     `json:"neutral"`
	Leechers     int     `json:"leechers"`
	AverageScore float64 `json:"average_score"`
}
