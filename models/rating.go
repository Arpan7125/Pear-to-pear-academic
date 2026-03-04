// Package models contains the core data structures for the P2P Academic Library
package models

import (
	"fmt"
	"time"
)

// Rating score constants
const (
	MinRatingScore float64 = 1.0
	MaxRatingScore float64 = 5.0
)

// Rating represents a peer-to-peer rating in the network
// Demonstrates: struct definition for relationship data
type Rating struct {
	ID        string    `json:"id"`         // Unique rating identifier
	RaterID   string    `json:"rater_id"`   // ID of the student giving the rating
	RateeID   string    `json:"ratee_id"`   // ID of the student receiving the rating
	FileID    string    `json:"file_id"`    // Related file CID (optional)
	Score     float64   `json:"score"`      // Rating score (1.0 - 5.0)
	Comment   string    `json:"comment"`    // Optional feedback comment
	CreatedAt time.Time `json:"created_at"` // When the rating was given
}

// NewRating creates a new Rating with validation
// Demonstrates: function with multiple parameters, control flow
func NewRating(id, raterID, rateeID, fileID string, score float64, comment string) (Rating, error) {
	// Validate score range
	if score < MinRatingScore || score > MaxRatingScore {
		return Rating{}, fmt.Errorf("score must be between %.1f and %.1f", MinRatingScore, MaxRatingScore)
	}

	// Create and return the rating
	rating := Rating{
		ID:        id,
		RaterID:   raterID,
		RateeID:   rateeID,
		FileID:    fileID,
		Score:     score,
		Comment:   comment,
		CreatedAt: time.Now(),
	}

	return rating, nil
}

// IsPositive returns true if the rating is above average (3.0)
// Demonstrates: simple control flow
func (r *Rating) IsPositive() bool {
	return r.Score >= 3.0
}

// IsNegative returns true if the rating is below average
func (r *Rating) IsNegative() bool {
	return r.Score < 3.0
}

// String returns a formatted string representation
func (r Rating) String() string {
	return fmt.Sprintf("Rating{From: %s, To: %s, Score: %.1f}", r.RaterID, r.RateeID, r.Score)
}

// RatingCollection manages a collection of ratings
// Demonstrates: struct with slice field for aggregation
type RatingCollection struct {
	Ratings []Rating `json:"ratings"`
}

// NewRatingCollection creates a new empty rating collection
func NewRatingCollection() *RatingCollection {
	return &RatingCollection{
		Ratings: make([]Rating, 0),
	}
}

// Add adds a rating to the collection
// Demonstrates: append to slice
func (rc *RatingCollection) Add(rating Rating) {
	rc.Ratings = append(rc.Ratings, rating)
}

// GetAverageScore calculates the average score across all ratings
// Demonstrates: for loop, arithmetic operations, control flow
func (rc *RatingCollection) GetAverageScore() float64 {
	if len(rc.Ratings) == 0 {
		return 0.0
	}

	var sum float64 = 0.0
	for _, rating := range rc.Ratings {
		sum += rating.Score
	}

	return sum / float64(len(rc.Ratings))
}

// GetRatingsForStudent returns all ratings for a specific student
// Demonstrates: filtering with for loop, slice building
func (rc *RatingCollection) GetRatingsForStudent(studentID string) []Rating {
	// Pre-allocate slice with zero length but some capacity
	result := make([]Rating, 0)

	// Iterate and filter
	for _, rating := range rc.Ratings {
		if rating.RateeID == studentID {
			result = append(result, rating)
		}
	}

	return result
}

// GetRatingsByStudent returns all ratings given by a specific student
// Demonstrates: similar filtering pattern
func (rc *RatingCollection) GetRatingsByStudent(studentID string) []Rating {
	result := make([]Rating, 0)

	for _, rating := range rc.Ratings {
		if rating.RaterID == studentID {
			result = append(result, rating)
		}
	}

	return result
}

// GetRatingsForFile returns all ratings for a specific file
func (rc *RatingCollection) GetRatingsForFile(fileID string) []Rating {
	result := make([]Rating, 0)

	for _, rating := range rc.Ratings {
		if rating.FileID == fileID {
			result = append(result, rating)
		}
	}

	return result
}

// CountPositiveRatings counts ratings with score >= 3.0
// Demonstrates: counting with for loop
func (rc *RatingCollection) CountPositiveRatings() int {
	count := 0
	for _, rating := range rc.Ratings {
		if rating.IsPositive() {
			count++
		}
	}
	return count
}

// CountNegativeRatings counts ratings with score < 3.0
func (rc *RatingCollection) CountNegativeRatings() int {
	count := 0
	for _, rating := range rc.Ratings {
		if rating.IsNegative() {
			count++
		}
	}
	return count
}

// GetScoreDistribution returns a map of score counts
// Demonstrates: map creation and population, type conversion
func (rc *RatingCollection) GetScoreDistribution() map[int]int {
	// Map to store count for each integer score (1-5)
	distribution := make(map[int]int)

	// Initialize all scores to 0
	for i := 1; i <= 5; i++ {
		distribution[i] = 0
	}

	// Count occurrences
	for _, rating := range rc.Ratings {
		// Round score to nearest integer
		roundedScore := int(rating.Score + 0.5)
		if roundedScore < 1 {
			roundedScore = 1
		} else if roundedScore > 5 {
			roundedScore = 5
		}
		distribution[roundedScore]++
	}

	return distribution
}

// CalculateStudentReputation calculates reputation score for a student
// Demonstrates: complex aggregation, weighted average calculation
func (rc *RatingCollection) CalculateStudentReputation(studentID string) float64 {
	ratings := rc.GetRatingsForStudent(studentID)

	if len(ratings) == 0 {
		return DefaultReputation // Return default for new students
	}

	var sum float64 = 0.0
	for _, rating := range ratings {
		sum += rating.Score
	}

	return sum / float64(len(ratings))
}

// Size returns the total number of ratings
func (rc *RatingCollection) Size() int {
	return len(rc.Ratings)
}

// Clear removes all ratings from the collection
func (rc *RatingCollection) Clear() {
	rc.Ratings = make([]Rating, 0)
}

// ValidateRating checks if a rating has valid data
func ValidateRating(r Rating) (bool, string) {
	if r.ID == "" {
		return false, "Rating ID cannot be empty"
	}
	if r.RaterID == "" {
		return false, "Rater ID cannot be empty"
	}
	if r.RateeID == "" {
		return false, "Ratee ID cannot be empty"
	}
	if r.RaterID == r.RateeID {
		return false, "Cannot rate yourself"
	}
	if r.Score < MinRatingScore || r.Score > MaxRatingScore {
		return false, fmt.Sprintf("Score must be between %.1f and %.1f", MinRatingScore, MaxRatingScore)
	}
	return true, ""
}
