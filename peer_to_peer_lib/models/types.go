// Package models contains type definitions for the P2P Academic Library.
// 
// GO CONCEPT 1: VARIABLES, VALUES AND TYPES
// This file demonstrates:
// - Type aliases (creating new types from existing types)
// - Constants (immutable values defined at compile time)
// - Package-level variables
// - Different Go data types (string, int, float64, etc.)
package models

import "time"

// ============================================================================
// TYPE ALIASES AND CUSTOM TYPES
// ============================================================================
// Type aliases create new types based on underlying types.
// This provides type safety and self-documenting code.

// UserID is a custom type for user identifiers
// Using a custom type instead of string provides type safety
type UserID string

// ContentID is a hash-based identifier for resources (CID)
// This is used for file integrity verification
type ContentID string

// PeerID uniquely identifies a peer in the network
type PeerID string

// ReputationScore represents a user's reputation value
type ReputationScore int

// Rating represents a 1-5 star rating
type Rating float64

// ============================================================================
// CONSTANTS
// ============================================================================
// Constants are immutable values known at compile time.
// Using iota for enumeration and const blocks for related values.

// File size limits
const (
	MaxFileSize     = 100 << 20 // 100MB using bit shifting
	MinFileSize     = 1024      // 1KB minimum
	ChunkSize       = 1 << 20   // 1MB chunks for transfer
	DefaultRating   = 3.0       // Default rating for new resources
	MaxRating       = 5.0       // Maximum rating value
	MinRating       = 1.0       // Minimum rating value
)

// Reputation thresholds and calculations
const (
	ContributorThreshold = 50   // Score > 50 = Contributor
	NeutralThreshold     = 0    // Score 0-50 = Neutral
	LowReputation        = -100 // Minimum reputation
	UploadWeight         = 2    // Uploads count double
	DownloadWeight       = 1    // Downloads subtract
	RatingWeight         = 10   // Rating multiplier
)

// UserClassification represents the user's contribution status
type UserClassification string

// User classification constants using iota pattern
const (
	ClassContributor UserClassification = "Contributor"
	ClassNeutral     UserClassification = "Neutral"
	ClassLeecher     UserClassification = "Leecher"
)

// ResourceType categorizes academic resources
type ResourceType string

const (
	TypePDF        ResourceType = "pdf"
	TypeDocument   ResourceType = "document"
	TypePresentation ResourceType = "presentation"
	TypeSpreadsheet ResourceType = "spreadsheet"
	TypeOther      ResourceType = "other"
)

// PeerStatus represents the connection status of a peer
type PeerStatus string

const (
	StatusOnline      PeerStatus = "online"
	StatusOffline     PeerStatus = "offline"
	StatusConnecting  PeerStatus = "connecting"
	StatusTransferring PeerStatus = "transferring"
)

// ============================================================================
// PACKAGE VARIABLES
// ============================================================================
// Package-level variables that can be used across the package.
// These demonstrate different Go variable types.

// AllowedFileTypes defines accepted file extensions for upload
var AllowedFileTypes = []string{".pdf", ".doc", ".docx", ".pptx", ".xlsx", ".txt", ".md"}

// SubjectCategories defines academic subjects for classification
var SubjectCategories = []string{
	"Mathematics",
	"Physics",
	"Chemistry",
	"Biology",
	"Computer Science",
	"Electronics",
	"Mechanical",
	"Civil",
	"Literature",
	"History",
	"Economics",
	"Other",
}

// ============================================================================
// HELPER FUNCTIONS FOR TYPE VALIDATION
// ============================================================================

// IsValidRating checks if a rating is within valid bounds
func IsValidRating(r Rating) bool {
	return r >= MinRating && r <= MaxRating
}

// IsValidFileType checks if a file extension is allowed
func IsValidFileType(ext string) bool {
	for _, allowed := range AllowedFileTypes {
		if ext == allowed {
			return true
		}
	}
	return false
}

// GetClassification returns the user classification based on reputation score
func GetClassification(score ReputationScore) UserClassification {
	switch {
	case int(score) > ContributorThreshold:
		return ClassContributor
	case int(score) >= NeutralThreshold:
		return ClassNeutral
	default:
		return ClassLeecher
	}
}

// TimeNow returns the current time (useful for testing)
var TimeNow = func() time.Time {
	return time.Now()
}
