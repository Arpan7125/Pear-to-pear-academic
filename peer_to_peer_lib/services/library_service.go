// Package services - Library service implementation
//
// GO CONCEPT 2: LOOPING STRUCTURES AND CONTROL FLOW
// GO CONCEPT 3: ARRAYS AND SLICES
// GO CONCEPT 5: FUNCTIONS AND ERROR HANDLING
// This file demonstrates:
// - For loops with different forms
// - Range loops over slices
// - Slice operations (append, filter, sort)
// - Switch statements for control flow
package services

import (
	"sort"
	"strings"

	"p2p-library/errors"
	"p2p-library/models"
	"p2p-library/store"
)

// ============================================================================
// LIBRARY SERVICE
// ============================================================================

// LibraryService handles resource management operations
type LibraryService struct {
	store       *store.MemoryStore
	userService *UserService
}

// NewLibraryService creates a new LibraryService
func NewLibraryService(store *store.MemoryStore, userService *UserService) *LibraryService {
	return &LibraryService{
		store:       store,
		userService: userService,
	}
}

// ============================================================================
// RESOURCE OPERATIONS
// ============================================================================

// Upload adds a new resource to the library
func (s *LibraryService) Upload(resource *models.Resource) error {
	// Validate resource
	if err := validateResource(resource); err != nil {
		return err
	}

	// Store the resource
	if err := s.store.Store(resource); err != nil {
		return errors.NewOperationError("Upload", "failed to store resource", err)
	}

	// Update uploader's stats
	if err := s.userService.RecordUpload(resource.UploadedBy); err != nil {
		// Log error but don't fail the upload
		_ = err
	}

	return nil
}

// Download retrieves a resource and updates statistics
func (s *LibraryService) Download(resourceID models.ContentID, userID models.UserID) (*models.Resource, error) {
	resource, err := s.store.Get(resourceID)
	if err != nil {
		return nil, err
	}

	// Update download count
	resource.DownloadCount++

	// Update downloader's stats
	if err := s.userService.RecordDownload(userID); err != nil {
		// Log error but don't fail the download
		_ = err
	}

	return resource, nil
}

// GetResource retrieves a resource by ID
func (s *LibraryService) GetResource(resourceID models.ContentID) (*models.Resource, error) {
	return s.store.Get(resourceID)
}

// DeleteResource removes a resource from the library
func (s *LibraryService) DeleteResource(resourceID models.ContentID) error {
	return s.store.Delete(resourceID)
}

// GetUserLibrary returns all resources uploaded by a user
func (s *LibraryService) GetUserLibrary(userID models.UserID) ([]*models.Resource, error) {
	return s.store.GetByUser(userID)
}

// ============================================================================
// GO CONCEPT 2: LOOPING AND CONTROL FLOW
// ============================================================================

// GetPopular returns the most popular resources
// Demonstrates: slice sorting and limiting with loops
func (s *LibraryService) GetPopular(limit int) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	// Sort by download count (descending)
	// GO CONCEPT 2: Using sort.Slice with comparison function
	sort.Slice(all, func(i, j int) bool {
		return all[i].DownloadCount > all[j].DownloadCount
	})

	// Limit results using slice expression
	// GO CONCEPT 3: Slice slicing
	if limit > len(all) {
		limit = len(all)
	}

	return all[:limit], nil
}

// GetRecent returns recently added resources
// Demonstrates: range loop with index
func (s *LibraryService) GetRecent(limit int) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	// Sort by creation time (descending - newest first)
	sort.Slice(all, func(i, j int) bool {
		return all[i].CreatedAt.After(all[j].CreatedAt)
	})

	// GO CONCEPT 2: Traditional for loop with counter
	result := make([]*models.Resource, 0, limit)
	for i := 0; i < len(all) && i < limit; i++ {
		result = append(result, all[i])
	}

	return result, nil
}

// GetTopRated returns highest rated resources
func (s *LibraryService) GetTopRated(limit int) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	// Filter resources with at least one rating
	rated := make([]*models.Resource, 0)

	// GO CONCEPT 2: Range loop - iterating over slice
	for _, resource := range all {
		if resource.TotalRatings > 0 {
			rated = append(rated, resource)
		}
	}

	// Sort by average rating
	sort.Slice(rated, func(i, j int) bool {
		return rated[i].AverageRating > rated[j].AverageRating
	})

	if limit > len(rated) {
		limit = len(rated)
	}

	return rated[:limit], nil
}

// FilterBySubject returns resources in a specific subject
// Demonstrates: range loop with filtering
func (s *LibraryService) FilterBySubject(subject string) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	// GO CONCEPT 3: Building new slice with filtered elements
	filtered := make([]*models.Resource, 0)

	// GO CONCEPT 2: Range loop - value only (ignoring index with _)
	for _, resource := range all {
		// GO CONCEPT 2: Control flow - if statement
		if strings.EqualFold(resource.Subject, subject) {
			filtered = append(filtered, resource)
		}
	}

	return filtered, nil
}

// FilterByType returns resources of a specific type
// Demonstrates: switch statement
func (s *LibraryService) FilterByType(resourceType models.ResourceType) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	filtered := make([]*models.Resource, 0)

	for _, resource := range all {
		// GO CONCEPT 2: Switch statement for control flow
		switch resourceType {
		case models.TypePDF:
			if resource.Type == models.TypePDF {
				filtered = append(filtered, resource)
			}
		case models.TypeDocument:
			if resource.Type == models.TypeDocument {
				filtered = append(filtered, resource)
			}
		case models.TypePresentation:
			if resource.Type == models.TypePresentation {
				filtered = append(filtered, resource)
			}
		case models.TypeSpreadsheet:
			if resource.Type == models.TypeSpreadsheet {
				filtered = append(filtered, resource)
			}
		default:
			// Match any type if TypeOther or unknown
			if resource.Type == models.TypeOther {
				filtered = append(filtered, resource)
			}
		}
	}

	return filtered, nil
}

// FilterByRating returns resources above a minimum rating
// Demonstrates: comparison operators in loops
func (s *LibraryService) FilterByRating(minRating float64) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	filtered := make([]*models.Resource, 0)

	// GO CONCEPT 2: For loop with condition
	for i := 0; i < len(all); i++ {
		resource := all[i]

		// GO CONCEPT 2: Control flow - compound condition
		if resource.TotalRatings > 0 && resource.AverageRating >= minRating {
			filtered = append(filtered, resource)
		}
	}

	return filtered, nil
}

// SearchWithFilters performs filtered search
// Demonstrates: multiple control flow constructs
func (s *LibraryService) SearchWithFilters(query string, subject string, minRating float64, resourceType models.ResourceType) ([]*models.Resource, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	query = strings.ToLower(query)
	results := make([]*models.Resource, 0)

	// GO CONCEPT 2: Complex filtering loop
resourceLoop:
	for _, resource := range all {
		// Filter by query (if provided)
		if query != "" {
			matched := false

			// Check multiple fields
			if strings.Contains(strings.ToLower(resource.Title), query) {
				matched = true
			} else if strings.Contains(strings.ToLower(resource.Filename), query) {
				matched = true
			} else if strings.Contains(strings.ToLower(resource.Description), query) {
				matched = true
			} else {
				// Check tags
				for _, tag := range resource.Tags {
					if strings.Contains(strings.ToLower(tag), query) {
						matched = true
						break
					}
				}
			}

			if !matched {
				continue resourceLoop // GO CONCEPT 2: Continue with label
			}
		}

		// Filter by subject (if provided)
		if subject != "" && !strings.EqualFold(resource.Subject, subject) {
			continue
		}

		// Filter by type (if provided)
		if resourceType != "" && resource.Type != resourceType {
			continue
		}

		// Filter by rating (if provided)
		if minRating > 0 && resource.AverageRating < minRating {
			continue
		}

		results = append(results, resource)
	}

	return results, nil
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// validateResource validates resource data
// GO CONCEPT 5: Error handling with custom errors
func validateResource(resource *models.Resource) error {
	// GO CONCEPT 2: Multiple conditions with if-else
	if resource.Filename == "" {
		return errors.NewValidationError("filename", "filename is required")
	}

	if resource.Size <= 0 {
		return errors.NewValidationError("size", "invalid file size")
	}

	if resource.Size > models.MaxFileSize {
		return errors.ErrFileTooLarge
	}

	if !models.IsValidFileType(resource.Extension) {
		return errors.ErrInvalidFileType
	}

	return nil
}

// GetStatistics returns library statistics
func (s *LibraryService) GetStatistics() (*LibraryStats, error) {
	all, err := s.store.GetAll()
	if err != nil {
		return nil, err
	}

	stats := &LibraryStats{
		TotalResources: len(all),
		BySubject:      make(map[string]int),
		ByType:         make(map[models.ResourceType]int),
	}

	// GO CONCEPT 2: Loop to aggregate statistics
	for _, resource := range all {
		stats.TotalDownloads += resource.DownloadCount
		stats.TotalRatings += resource.TotalRatings
		stats.BySubject[resource.Subject]++
		stats.ByType[resource.Type]++
	}

	return stats, nil
}

// LibraryStats contains aggregated library statistics
type LibraryStats struct {
	TotalResources int                         `json:"total_resources"`
	TotalDownloads int                         `json:"total_downloads"`
	TotalRatings   int                         `json:"total_ratings"`
	BySubject      map[string]int              `json:"by_subject"`
	ByType         map[models.ResourceType]int `json:"by_type"`
}
