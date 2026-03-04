// Package services provides business logic implementations.
//
// GO CONCEPT 5: FUNCTIONS AND ERROR HANDLING
// GO CONCEPT 7: POINTERS, CALL BY VALUE AND REFERENCE
// This file demonstrates:
// - Service functions with error returns
// - Pointer receivers for methods
// - Call by value vs call by reference
package services

import (
	"github.com/google/uuid"

	"p2p-library/errors"
	"p2p-library/models"
	"p2p-library/store"
)

// ============================================================================
// USER SERVICE
// ============================================================================

// UserService handles user-related operations
type UserService struct {
	store *store.MemoryStore
}

// NewUserService creates a new UserService
func NewUserService(store *store.MemoryStore) *UserService {
	return &UserService{store: store}
}

// ============================================================================
// GO CONCEPT 7: POINTERS - CALL BY VALUE VS CALL BY REFERENCE
// ============================================================================

// UpdateReputationByValue demonstrates CALL BY VALUE
// The user parameter is a COPY - changes don't affect the original
func UpdateReputationByValue(user models.User, delta int) models.User {
	// This modifies the COPY, not the original
	user.Reputation += models.ReputationScore(delta)
	user.Classification = models.GetClassification(user.Reputation)
	return user // Must return the modified copy
}

// UpdateReputationByPointer demonstrates CALL BY REFERENCE
// The user parameter is a POINTER - changes affect the original
func UpdateReputationByPointer(user *models.User, delta int) {
	// This modifies the ORIGINAL through the pointer
	user.Reputation += models.ReputationScore(delta)
	user.Classification = models.GetClassification(user.Reputation)
	// No return needed - original is modified
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

// CreateUser creates a new user
func (s *UserService) CreateUser(username, email, password string) (*models.User, error) {
	// Generate UUID for user ID
	id := models.UserID(uuid.New().String())

	// Create user with constructor
	user := models.NewUser(id, username, email)
	user.Password = password // In real app, this would be hashed

	// Store user
	if err := s.store.Create(user); err != nil {
		return nil, errors.NewOperationError("CreateUser", "failed to store user", err)
	}

	return user, nil
}

// GetUser retrieves a user by ID
func (s *UserService) GetUser(id models.UserID) (*models.User, error) {
	user, err := s.store.GetUser(id)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(email string) (*models.User, error) {
	return s.store.GetByEmail(email)
}

// UpdateUser updates user information
// GO CONCEPT 7: Uses pointer to modify user in place
func (s *UserService) UpdateUser(user *models.User) error {
	user.UpdateActivity() // Updates LastActiveAt timestamp
	return s.store.UpdateUser(user)
}

// RecordUpload records that a user uploaded a resource
// Demonstrates modifying struct through pointer
func (s *UserService) RecordUpload(userID models.UserID) error {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return err
	}

	// Modify through pointer - changes persist
	user.TotalUploads++

	// Update reputation using pointer method
	delta := models.UploadWeight
	UpdateReputationByPointer(user, delta)

	return s.store.UpdateUser(user)
}

// RecordDownload records that a user downloaded a resource
func (s *UserService) RecordDownload(userID models.UserID) error {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return err
	}

	// Modify through pointer
	user.TotalDownloads++

	// Downloads decrease reputation
	delta := -models.DownloadWeight
	UpdateReputationByPointer(user, delta)

	return s.store.UpdateUser(user)
}

// UpdateRatingReceived updates user stats when they receive a rating
func (s *UserService) UpdateRatingReceived(userID models.UserID, rating models.Rating) error {
	user, err := s.store.GetUser(userID)
	if err != nil {
		return err
	}

	// Recalculate average rating
	totalRatings := float64(user.TotalUploads)
	if totalRatings == 0 {
		totalRatings = 1
	}
	currentSum := user.AverageRating * totalRatings
	newSum := currentSum + float64(rating)
	user.AverageRating = newSum / (totalRatings + 1)

	// Update reputation based on rating
	delta := int(float64(rating) * float64(models.RatingWeight) / 5.0)
	UpdateReputationByPointer(user, delta)

	return s.store.UpdateUser(user)
}

// GetAllUsers returns all users
func (s *UserService) GetAllUsers() ([]*models.User, error) {
	return s.store.GetAllUsers()
}

// GetLeaderboard returns top users by reputation
func (s *UserService) GetLeaderboard(limit int) ([]*models.User, error) {
	return s.store.GetLeaderboard(limit)
}

// DeleteUser removes a user from the system
func (s *UserService) DeleteUser(id models.UserID) error {
	return s.store.DeleteUser(id)
}

// ============================================================================
// POINTER DEMONSTRATION FUNCTIONS
// ============================================================================

// CompareValueVsPointer demonstrates the difference between
// call by value and call by pointer
func CompareValueVsPointer() {
	// Create a user
	user := models.User{
		ID:         "test-user",
		Username:   "TestUser",
		Reputation: 0,
	}

	// Call by value - returns modified copy, original unchanged
	modified := UpdateReputationByValue(user, 10)
	// user.Reputation is still 0
	// modified.Reputation is 10
	_ = modified

	// Call by pointer - modifies original directly
	UpdateReputationByPointer(&user, 10)
	// user.Reputation is now 10
}

// SwapByValue demonstrates that value parameters are copies
func SwapByValue(a, b int) {
	a, b = b, a
	// Original variables are unchanged
}

// SwapByPointer demonstrates that pointer parameters modify originals
func SwapByPointer(a, b *int) {
	*a, *b = *b, *a
	// Original variables are swapped
}
