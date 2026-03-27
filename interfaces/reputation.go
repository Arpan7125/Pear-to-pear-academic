// Package interfaces - Reputation service interface
//
// GO CONCEPT 6: INTERFACES
// This demonstrates service abstraction through interfaces
package interfaces

import (
	"p2p-library/models"
)

// ============================================================================
// REPUTATION SERVICE INTERFACE
// ============================================================================

// ReputationService defines reputation management operations
type ReputationService interface {
	// Calculate computes reputation score for a user
	Calculate(userID models.UserID) (models.ReputationScore, error)
	
	// UpdateOnUpload updates reputation when user uploads
	UpdateOnUpload(userID models.UserID) error
	
	// UpdateOnDownload updates reputation when user downloads
	UpdateOnDownload(userID models.UserID) error
	
	// UpdateOnRating updates reputation when resource is rated
	UpdateOnRating(userID models.UserID, rating models.Rating) error
	
	// GetClassification returns user's classification
	GetClassification(userID models.UserID) (models.UserClassification, error)
	
	// GetThrottleSpeed returns allowed download speed based on reputation
	GetThrottleSpeed(userID models.UserID) (float64, error)
	
	// GetStats returns reputation statistics
	GetStats(userID models.UserID) (*models.UserStats, error)
}

// ============================================================================
// SEARCH SERVICE INTERFACE
// ============================================================================

// SearchService defines search operations
type SearchService interface {
	// Search finds resources matching query and filters
	Search(query string, filters SearchFilters) (*models.SearchResults, error)
	
	// SearchBySubject finds resources in a specific subject
	SearchBySubject(subject string) ([]*models.Resource, error)
	
	// SearchByTag finds resources with a specific tag
	SearchByTag(tag string) ([]*models.Resource, error)
	
	// GetSuggestions returns auto-complete suggestions
	GetSuggestions(partial string) ([]string, error)
}

// SearchFilters contains search filter options
type SearchFilters struct {
	Subject     string              `json:"subject,omitempty"`
	Type        models.ResourceType `json:"type,omitempty"`
	MinRating   float64             `json:"min_rating,omitempty"`
	Tags        []string            `json:"tags,omitempty"`
	SortBy      string              `json:"sort_by,omitempty"`
	SortOrder   string              `json:"sort_order,omitempty"`
	Page        int                 `json:"page,omitempty"`
	PageSize    int                 `json:"page_size,omitempty"`
}

// ============================================================================
// LIBRARY SERVICE INTERFACE
// ============================================================================

// LibraryService defines library management operations
type LibraryService interface {
	// Upload adds a new resource to the library
	Upload(resource *models.Resource) error
	
	// Download retrieves a resource (updates stats)
	Download(resourceID models.ContentID, userID models.UserID) (*models.Resource, error)
	
	// Rate adds a rating to a resource
	Rate(resourceID models.ContentID, userID models.UserID, rating models.Rating, comment string) error
	
	// GetResource retrieves resource metadata
	GetResource(resourceID models.ContentID) (*models.Resource, error)
	
	// GetUserLibrary returns user's uploaded resources
	GetUserLibrary(userID models.UserID) ([]*models.Resource, error)
	
	// GetPopular returns most popular resources
	GetPopular(limit int) ([]*models.Resource, error)
	
	// GetRecent returns recently added resources
	GetRecent(limit int) ([]*models.Resource, error)
}
