// Package models - Resource model definition
//
// GO CONCEPT 3: ARRAYS AND SLICES
// GO CONCEPT 4: MAPS AND STRUCTS
// This file demonstrates:
// - Complex struct with nested types
// - Slices for dynamic collections
// - Fixed-size arrays
// - Slice operations (append, capacity)
package models

import (
	"crypto/sha256"
	"encoding/hex"
	"path/filepath"
	"strings"
	"time"
)

// ============================================================================
// RESOURCE STRUCT
// ============================================================================

// Resource represents an academic file shared in the network
type Resource struct {
	// Identification
	ID         ContentID `json:"id"`          // Content-based ID (CID)
	OriginalID string    `json:"original_id"` // Original filename hash
	
	// File metadata
	Filename    string       `json:"filename"`
	Extension   string       `json:"extension"`
	Size        int64        `json:"size"`         // File size in bytes
	Type        ResourceType `json:"type"`         // pdf, document, etc.
	MimeType    string       `json:"mime_type"`
	
	// Academic metadata
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Subject     string   `json:"subject"`
	Tags        []string `json:"tags"`           // Slice of tags (dynamic)
	
	// P2P information
	UploadedBy  UserID   `json:"uploaded_by"`
	AvailableOn []PeerID `json:"available_on"`   // Slice of peers having this file
	ChunkCount  int      `json:"chunk_count"`    // Number of chunks
	
	// Rating information
	TotalRatings  int     `json:"total_ratings"`
	AverageRating float64 `json:"average_rating"`
	RatingSum     float64 `json:"rating_sum"`     // For calculating average
	
	// Timestamps
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	DownloadCount int     `json:"download_count"`
}

// ============================================================================
// RESOURCE CHUNK (For P2P Transfer)
// ============================================================================

// ResourceChunk represents a portion of a file for chunked transfers
type ResourceChunk struct {
	ResourceID  ContentID `json:"resource_id"`
	ChunkIndex  int       `json:"chunk_index"`
	TotalChunks int       `json:"total_chunks"`
	Data        []byte    `json:"data"`         // Slice of bytes
	Checksum    string    `json:"checksum"`     // Chunk verification
}

// ============================================================================
// SEARCH RESULTS WITH SLICES
// ============================================================================

// SearchResult contains a resource with availability info
type SearchResult struct {
	Resource      *Resource `json:"resource"`
	AvailablePeers int      `json:"available_peers"`
	Relevance     float64   `json:"relevance"`
}

// SearchResults demonstrates slice usage for collections
type SearchResults struct {
	Query      string          `json:"query"`
	Results    []*SearchResult `json:"results"`     // Slice of pointers
	TotalCount int             `json:"total_count"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
}

// ============================================================================
// ARRAY EXAMPLE - Top Resources
// ============================================================================

// TopResources uses a fixed-size array for leaderboard
// Arrays have fixed size, unlike slices
type TopResources struct {
	// Fixed-size array - size is part of the type
	Top10 [10]*Resource `json:"top_10"`
	
	// Slice for dynamic content
	Recent []Resource `json:"recent"`
}

// ============================================================================
// CONSTRUCTOR AND METHODS
// ============================================================================

// NewResource creates a new resource with generated CID
func NewResource(filename string, size int64, uploadedBy UserID) *Resource {
	now := TimeNow()
	ext := strings.ToLower(filepath.Ext(filename))
	
	// Generate Content ID from filename and timestamp
	hash := sha256.Sum256([]byte(filename + now.String()))
	cid := ContentID(hex.EncodeToString(hash[:16]))
	
	return &Resource{
		ID:            cid,
		Filename:      filename,
		Extension:     ext,
		Size:          size,
		Type:          getResourceType(ext),
		UploadedBy:    uploadedBy,
		Tags:          make([]string, 0),        // Initialize empty slice
		AvailableOn:   make([]PeerID, 0),        // Initialize empty slice
		TotalRatings:  0,
		AverageRating: 0,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// getResourceType maps file extension to resource type
func getResourceType(ext string) ResourceType {
	switch ext {
	case ".pdf":
		return TypePDF
	case ".doc", ".docx":
		return TypeDocument
	case ".ppt", ".pptx":
		return TypePresentation
	case ".xls", ".xlsx":
		return TypeSpreadsheet
	default:
		return TypeOther
	}
}

// ============================================================================
// SLICE OPERATIONS METHODS
// ============================================================================

// AddTag demonstrates slice append operation
func (r *Resource) AddTag(tag string) {
	// Check if tag already exists
	for _, existingTag := range r.Tags {
		if existingTag == tag {
			return
		}
	}
	// Append creates a new slice if capacity is exceeded
	r.Tags = append(r.Tags, tag)
}

// RemoveTag demonstrates slice manipulation
func (r *Resource) RemoveTag(tag string) {
	// Create new slice without the tag
	newTags := make([]string, 0, len(r.Tags))
	for _, t := range r.Tags {
		if t != tag {
			newTags = append(newTags, t)
		}
	}
	r.Tags = newTags
}

// AddPeer adds a peer to availability list
func (r *Resource) AddPeer(peerID PeerID) {
	// Check if peer already listed
	for _, p := range r.AvailableOn {
		if p == peerID {
			return
		}
	}
	r.AvailableOn = append(r.AvailableOn, peerID)
}

// RemovePeer removes a peer from availability list
func (r *Resource) RemovePeer(peerID PeerID) {
	newPeers := make([]PeerID, 0, len(r.AvailableOn))
	for _, p := range r.AvailableOn {
		if p != peerID {
			newPeers = append(newPeers, p)
		}
	}
	r.AvailableOn = newPeers
}

// AddRating adds a new rating and recalculates average
func (r *Resource) AddRating(rating Rating) {
	if !IsValidRating(rating) {
		return
	}
	r.TotalRatings++
	r.RatingSum += float64(rating)
	r.AverageRating = r.RatingSum / float64(r.TotalRatings)
	r.UpdatedAt = TimeNow()
}

// GetPeerCount returns the number of available peers
func (r *Resource) GetPeerCount() int {
	return len(r.AvailableOn)
}

// HasTag checks if resource has a specific tag
func (r *Resource) HasTag(tag string) bool {
	for _, t := range r.Tags {
		if strings.EqualFold(t, tag) {
			return true
		}
	}
	return false
}
