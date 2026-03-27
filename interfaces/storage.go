// Package interfaces defines the service interfaces for the application.
//
// GO CONCEPT 6: INTERFACES
// This file demonstrates:
// - Interface definitions for abstraction
// - Interface composition
// - Implicit interface implementation (no "implements" keyword)
package interfaces

import (
	"p2p-library/models"
)

// ============================================================================
// STORAGE INTERFACE
// ============================================================================
// Interfaces define behavior. Any type that implements all methods
// of an interface automatically satisfies that interface.
// Go uses implicit interface satisfaction - no "implements" keyword needed.

// ResourceStorage defines operations for resource storage
type ResourceStorage interface {
	// Create adds a new resource to storage
	Store(resource *models.Resource) error

	// Read retrieves a resource by ID
	Get(id models.ContentID) (*models.Resource, error)

	// Update modifies an existing resource
	Update(resource *models.Resource) error

	// Delete removes a resource from storage
	Delete(id models.ContentID) error

	// List returns all resources
	GetAll() ([]*models.Resource, error)

	// Search finds resources matching a query
	Search(query string) ([]*models.Resource, error)

	// GetByUser returns resources uploaded by a specific user
	GetByUser(userID models.UserID) ([]*models.Resource, error)
}

// UserStorage defines operations for user storage
type UserStorage interface {
	// Create adds a new user
	Create(user *models.User) error

	// Get retrieves a user by ID
	Get(id models.UserID) (*models.User, error)

	// GetByEmail retrieves a user by email
	GetByEmail(email string) (*models.User, error)

	// Update modifies user data
	Update(user *models.User) error

	// Delete removes a user
	Delete(id models.UserID) error

	// GetAll returns all users
	GetAll() ([]*models.User, error)

	// GetLeaderboard returns top users by reputation
	GetLeaderboard(limit int) ([]*models.User, error)
}

// RatingStorage defines operations for rating storage
type RatingStorage interface {
	// Create adds a new rating
	Create(rating *models.ResourceRating) error

	// Get retrieves a rating by ID
	Get(id string) (*models.ResourceRating, error)

	// GetByResource returns all ratings for a resource
	GetByResource(resourceID models.ContentID) ([]*models.ResourceRating, error)

	// GetByUser returns all ratings by a user
	GetByUser(userID models.UserID) ([]*models.ResourceRating, error)

	// Update modifies a rating
	Update(rating *models.ResourceRating) error

	// Delete removes a rating
	Delete(id string) error
}

// ============================================================================
// INTERFACE COMPOSITION NOTE
// ============================================================================
// In Go, interface composition combines interfaces. However, when embedded
// interfaces have methods with the same name but different signatures (e.g.,
// Get, Delete), they cannot be composed directly. In this project, each
// storage interface (ResourceStorage, UserStorage, RatingStorage) is used
// independently, demonstrating how Go interfaces enable flexible abstraction.

// ============================================================================
// PEER INTERFACE
// ============================================================================

// PeerManager defines peer connection operations
type PeerManager interface {
	// Register adds a new peer to the network
	Register(peer *models.Peer) error

	// Unregister removes a peer
	Unregister(peerID models.PeerID) error

	// GetOnline returns all online peers
	GetOnline() ([]*models.Peer, error)

	// Connect establishes connection to a peer
	Connect(peerID models.PeerID) error

	// Disconnect closes connection to a peer
	Disconnect(peerID models.PeerID) error

	// Ping checks if a peer is alive
	Ping(peerID models.PeerID) (int64, error)
}
