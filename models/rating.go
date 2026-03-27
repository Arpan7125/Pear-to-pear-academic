// Package models - Rating model definition
//
// This file contains rating-related structures
package models

import (
	"time"
)

// ============================================================================
// RATING STRUCT
// ============================================================================

// ResourceRating represents a user's rating for a resource
type ResourceRating struct {
	ID         string    `json:"id"`
	ResourceID ContentID `json:"resource_id"`
	UserID     UserID    `json:"user_id"`
	Rating     Rating    `json:"rating"`      // 1-5 stars
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

// RatingRequest is used for API requests
type RatingRequest struct {
	ResourceID ContentID `json:"resource_id"`
	Rating     Rating    `json:"rating"`
	Comment    string    `json:"comment,omitempty"`
}

// RatingSummary provides aggregated rating information
type RatingSummary struct {
	ResourceID    ContentID `json:"resource_id"`
	AverageRating float64   `json:"average_rating"`
	TotalRatings  int       `json:"total_ratings"`
	Distribution  [5]int    `json:"distribution"` // Fixed array: count of 1,2,3,4,5 stars
}

// ============================================================================
// CONSTRUCTOR
// ============================================================================

// NewResourceRating creates a new rating
func NewResourceRating(resourceID ContentID, userID UserID, rating Rating, comment string) *ResourceRating {
	return &ResourceRating{
		ID:         string(resourceID) + "-" + string(userID),
		ResourceID: resourceID,
		UserID:     userID,
		Rating:     rating,
		Comment:    comment,
		CreatedAt:  TimeNow(),
	}
}

// IsValid checks if the rating is valid
func (r *ResourceRating) IsValid() bool {
	return IsValidRating(r.Rating)
}
