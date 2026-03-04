// Package store provides in-memory storage implementations.
//
// GO CONCEPT 4: MAPS AND STRUCTS
// GO CONCEPT 6: INTERFACES (Implementation)
// GO CONCEPT 7: POINTERS, CALL BY VALUE AND REFERENCE
// This file demonstrates:
// - Maps for data storage
// - Implementing interfaces
// - Pointer usage for shared state
// - Mutex for thread-safe operations
package store

import (
	"sort"
	"strings"
	"sync"
	
	"p2p-library/errors"
	"p2p-library/models"
)

// ============================================================================
// MEMORY STORE
// ============================================================================
// MemoryStore implements the storage interfaces using in-memory maps.
// This demonstrates how a concrete type can implement multiple interfaces.

// MemoryStore provides in-memory storage for all data types
type MemoryStore struct {
	// Maps for storage - using pointers for efficient lookups
	resources map[models.ContentID]*models.Resource
	users     map[models.UserID]*models.User
	ratings   map[string]*models.ResourceRating
	
	// Mutex for thread-safe operations
	// This prevents race conditions when multiple goroutines access the store
	mu sync.RWMutex
}

// NewMemoryStore creates a new in-memory store
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		resources: make(map[models.ContentID]*models.Resource),
		users:     make(map[models.UserID]*models.User),
		ratings:   make(map[string]*models.ResourceRating),
	}
}

// ============================================================================
// RESOURCE STORAGE IMPLEMENTATION
// ============================================================================
// These methods implement the ResourceStorage interface.

// Store adds a new resource to storage
// GO CONCEPT 7: Takes pointer to avoid copying large struct
func (m *MemoryStore) Store(resource *models.Resource) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	// Check if already exists
	if _, exists := m.resources[resource.ID]; exists {
		return errors.ErrAlreadyExists
	}
	
	// Store pointer to resource
	m.resources[resource.ID] = resource
	return nil
}

// Get retrieves a resource by ID
// Returns pointer to allow modification of original
func (m *MemoryStore) Get(id models.ContentID) (*models.Resource, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	resource, exists := m.resources[id]
	if !exists {
		return nil, errors.NewNotFoundError("resource", string(id))
	}
	
	return resource, nil
}

// Update modifies an existing resource
func (m *MemoryStore) Update(resource *models.Resource) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.resources[resource.ID]; !exists {
		return errors.ErrResourceNotFound
	}
	
	m.resources[resource.ID] = resource
	return nil
}

// Delete removes a resource from storage
func (m *MemoryStore) Delete(id models.ContentID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.resources[id]; !exists {
		return errors.ErrResourceNotFound
	}
	
	delete(m.resources, id)
	return nil
}

// GetAll returns all resources
func (m *MemoryStore) GetAll() ([]*models.Resource, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	// Create slice with capacity for efficiency
	result := make([]*models.Resource, 0, len(m.resources))
	
	for _, resource := range m.resources {
		result = append(result, resource)
	}
	
	return result, nil
}

// Search finds resources matching a query
// GO CONCEPT 2: LOOPING STRUCTURES
func (m *MemoryStore) Search(query string) ([]*models.Resource, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	query = strings.ToLower(query)
	result := make([]*models.Resource, 0)
	
	// Linear search through all resources
	for _, resource := range m.resources {
		// Check if query matches filename, title, or subject
		if strings.Contains(strings.ToLower(resource.Filename), query) ||
		   strings.Contains(strings.ToLower(resource.Title), query) ||
		   strings.Contains(strings.ToLower(resource.Subject), query) ||
		   strings.Contains(strings.ToLower(resource.Description), query) {
			result = append(result, resource)
		}
		
		// Check tags
		for _, tag := range resource.Tags {
			if strings.Contains(strings.ToLower(tag), query) {
				result = append(result, resource)
				break
			}
		}
	}
	
	return result, nil
}

// GetByUser returns resources uploaded by a specific user
func (m *MemoryStore) GetByUser(userID models.UserID) ([]*models.Resource, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	result := make([]*models.Resource, 0)
	
	for _, resource := range m.resources {
		if resource.UploadedBy == userID {
			result = append(result, resource)
		}
	}
	
	return result, nil
}

// ============================================================================
// USER STORAGE IMPLEMENTATION
// ============================================================================

// Create adds a new user
func (m *MemoryStore) Create(user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.users[user.ID]; exists {
		return errors.ErrUserAlreadyExists
	}
	
	m.users[user.ID] = user
	return nil
}

// GetUser retrieves a user by ID (renamed to avoid conflict)
func (m *MemoryStore) GetUser(id models.UserID) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	user, exists := m.users[id]
	if !exists {
		return nil, errors.NewNotFoundError("user", string(id))
	}
	
	return user, nil
}

// GetByEmail retrieves a user by email
func (m *MemoryStore) GetByEmail(email string) (*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	for _, user := range m.users {
		if user.Email == email {
			return user, nil
		}
	}
	
	return nil, errors.NewNotFoundError("user", email)
}

// UpdateUser modifies user data
func (m *MemoryStore) UpdateUser(user *models.User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.users[user.ID]; !exists {
		return errors.ErrUserNotFound
	}
	
	m.users[user.ID] = user
	return nil
}

// DeleteUser removes a user
func (m *MemoryStore) DeleteUser(id models.UserID) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.users[id]; !exists {
		return errors.ErrUserNotFound
	}
	
	delete(m.users, id)
	return nil
}

// GetAllUsers returns all users
func (m *MemoryStore) GetAllUsers() ([]*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	result := make([]*models.User, 0, len(m.users))
	
	for _, user := range m.users {
		result = append(result, user)
	}
	
	return result, nil
}

// GetLeaderboard returns top users by reputation
func (m *MemoryStore) GetLeaderboard(limit int) ([]*models.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	// Get all users
	users := make([]*models.User, 0, len(m.users))
	for _, user := range m.users {
		users = append(users, user)
	}
	
	// Sort by reputation (descending)
	sort.Slice(users, func(i, j int) bool {
		return users[i].Reputation > users[j].Reputation
	})
	
	// Return top N
	if limit > len(users) {
		limit = len(users)
	}
	
	return users[:limit], nil
}

// ============================================================================
// RATING STORAGE IMPLEMENTATION
// ============================================================================

// CreateRating adds a new rating
func (m *MemoryStore) CreateRating(rating *models.ResourceRating) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.ratings[rating.ID]; exists {
		return errors.ErrAlreadyExists
	}
	
	m.ratings[rating.ID] = rating
	return nil
}

// GetRating retrieves a rating by ID
func (m *MemoryStore) GetRating(id string) (*models.ResourceRating, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	rating, exists := m.ratings[id]
	if !exists {
		return nil, errors.ErrRatingNotFound
	}
	
	return rating, nil
}

// GetByResource returns all ratings for a resource
func (m *MemoryStore) GetByResource(resourceID models.ContentID) ([]*models.ResourceRating, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	result := make([]*models.ResourceRating, 0)
	
	for _, rating := range m.ratings {
		if rating.ResourceID == resourceID {
			result = append(result, rating)
		}
	}
	
	return result, nil
}

// GetRatingsByUser returns all ratings by a user
func (m *MemoryStore) GetRatingsByUser(userID models.UserID) ([]*models.ResourceRating, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	result := make([]*models.ResourceRating, 0)
	
	for _, rating := range m.ratings {
		if rating.UserID == userID {
			result = append(result, rating)
		}
	}
	
	return result, nil
}

// UpdateRating modifies a rating
func (m *MemoryStore) UpdateRating(rating *models.ResourceRating) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.ratings[rating.ID]; !exists {
		return errors.ErrRatingNotFound
	}
	
	m.ratings[rating.ID] = rating
	return nil
}

// DeleteRating removes a rating
func (m *MemoryStore) DeleteRating(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	if _, exists := m.ratings[id]; !exists {
		return errors.ErrRatingNotFound
	}
	
	delete(m.ratings, id)
	return nil
}

// ============================================================================
// UTILITY METHODS
// ============================================================================

// Count returns the count of all items
func (m *MemoryStore) Count() (resources, users, ratings int) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	return len(m.resources), len(m.users), len(m.ratings)
}

// Clear removes all data (useful for testing)
func (m *MemoryStore) Clear() {
	m.mu.Lock()
	defer m.mu.Unlock()
	
	m.resources = make(map[models.ContentID]*models.Resource)
	m.users = make(map[models.UserID]*models.User)
	m.ratings = make(map[string]*models.ResourceRating)
}
