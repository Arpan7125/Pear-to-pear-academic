// Package models - User model definition
//
// GO CONCEPT 4: MAPS AND STRUCTS
// This file demonstrates:
// - Struct definition with typed fields
// - JSON tags for serialization
// - Embedded structs
// - Struct methods
package models

import (
	"time"
)

// ============================================================================
// USER STRUCT
// ============================================================================
// Structs are Go's way of creating custom data types that group related fields.
// JSON tags define how the struct serializes to/from JSON.

// User represents a participant in the P2P network
type User struct {
	// Basic identification
	ID       UserID `json:"id"`       // Unique identifier
	Username string `json:"username"` // Display name
	Email    string `json:"email"`    // Email address
	Password string `json:"-"`        // Password (excluded from JSON with "-")
	Role     string `json:"role"`     // "admin" or "user"

	// Reputation system fields
	Reputation     ReputationScore    `json:"reputation"`     // Current score
	Classification UserClassification `json:"classification"` // Contributor/Neutral/Leecher

	// Activity statistics
	TotalUploads   int     `json:"total_uploads"`   // Number of resources uploaded
	TotalDownloads int     `json:"total_downloads"` // Number of resources downloaded
	AverageRating  float64 `json:"average_rating"`  // Average rating received

	// Timestamps
	CreatedAt    time.Time `json:"created_at"`     // Account creation
	LastActiveAt time.Time `json:"last_active_at"` // Last activity

	// P2P Network info
	PeerID    PeerID     `json:"peer_id"`    // Network peer identifier
	Status    PeerStatus `json:"status"`     // Online/Offline status
	IPAddress string     `json:"ip_address"` // Current IP (for P2P)
}

// ============================================================================
// USER PROFILE (Embedded Struct Example)
// ============================================================================
// Go supports struct embedding for composition over inheritance.

// UserProfile contains extended user information
type UserProfile struct {
	User                   // Embedded User struct (composition)
	Bio           string   `json:"bio"`
	Department    string   `json:"department"`
	University    string   `json:"university"`
	Interests     []string `json:"interests"`
	SharedCount   int      `json:"shared_count"`
	ReceivedCount int      `json:"received_count"`
}

// ============================================================================
// USER STATISTICS
// ============================================================================

// UserStats contains aggregated statistics for analytics
type UserStats struct {
	UserID          UserID             `json:"user_id"`
	UploadHistory   []ActivityRecord   `json:"upload_history"`
	DownloadHistory []ActivityRecord   `json:"download_history"`
	RatingHistory   []RatingRecord     `json:"rating_history"`
	ReputationTrend []ReputationPoint  `json:"reputation_trend"`
	Classification  UserClassification `json:"classification"`
}

// ActivityRecord tracks a single activity event
type ActivityRecord struct {
	ResourceID ContentID `json:"resource_id"`
	Timestamp  time.Time `json:"timestamp"`
	Size       int64     `json:"size"`
}

// RatingRecord tracks a rating given or received
type RatingRecord struct {
	ResourceID ContentID `json:"resource_id"`
	Rating     Rating    `json:"rating"`
	Comment    string    `json:"comment,omitempty"`
	Timestamp  time.Time `json:"timestamp"`
	GivenBy    UserID    `json:"given_by,omitempty"`
}

// ReputationPoint tracks reputation over time
type ReputationPoint struct {
	Score     ReputationScore `json:"score"`
	Timestamp time.Time       `json:"timestamp"`
}

// ============================================================================
// STRUCT METHODS
// ============================================================================
// Methods are functions associated with a type.

// NewUser creates a new user with default values
func NewUser(id UserID, username, email string) *User {
	now := TimeNow()
	return &User{
		ID:             id,
		Username:       username,
		Email:          email,
		Role:           "user",
		Reputation:     0,
		Classification: ClassNeutral,
		TotalUploads:   0,
		TotalDownloads: 0,
		AverageRating:  0,
		CreatedAt:      now,
		LastActiveAt:   now,
		Status:         StatusOffline,
	}
}

// IsAdmin checks if user has admin role
func (u *User) IsAdmin() bool {
	return u.Role == "admin"
}

// IsContributor checks if user is a contributor
func (u *User) IsContributor() bool {
	return u.Classification == ClassContributor
}

// IsLeecher checks if user is a leecher
func (u *User) IsLeecher() bool {
	return u.Classification == ClassLeecher
}

// GetThrottleMultiplier returns download speed multiplier based on classification
func (u *User) GetThrottleMultiplier() float64 {
	switch u.Classification {
	case ClassContributor:
		return 1.0 // Full speed
	case ClassNeutral:
		return 0.7 // 70% speed
	case ClassLeecher:
		return 0.3 // 30% speed
	default:
		return 0.5
	}
}

// UpdateActivity updates the last active timestamp
func (u *User) UpdateActivity() {
	u.LastActiveAt = TimeNow()
}
