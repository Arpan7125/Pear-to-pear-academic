// Package models contains the core data structures for the P2P Academic Library
package models

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"
)

// Constants for file handling
const (
	MaxFileSize    int64 = 100 * 1024 * 1024 // 100 MB max file size
	MinFileSize    int64 = 1                 // Minimum 1 byte
	MaxTagsPerFile int   = 10                // Maximum tags allowed per file
	MaxFileNameLen int   = 255               // Maximum filename length
)

// FileCategory represents the type of academic resource
type FileCategory string

// Predefined file categories
const (
	CategoryNotes      FileCategory = "notes"
	CategoryTextbook   FileCategory = "textbook"
	CategorySlides     FileCategory = "slides"
	CategoryAssignment FileCategory = "assignment"
	CategoryResearch   FileCategory = "research"
	CategoryOther      FileCategory = "other"
)

// AcademicFile represents a resource being shared in the P2P network
// Demonstrates: struct with various field types, slices, custom types
type AcademicFile struct {
	CID           string       `json:"cid"`            // Content Identifier (hash-based)
	FileName      string       `json:"file_name"`      // Original file name
	OwnerID       string       `json:"owner_id"`       // ID of the peer who shared this file
	Size          int64        `json:"size"`           // File size in bytes
	Category      FileCategory `json:"category"`       // Type of academic resource
	Tags          []string     `json:"tags"`           // Searchable tags (slice)
	Description   string       `json:"description"`    // Brief description of content
	Subject       string       `json:"subject"`        // Academic subject
	UploadedAt    time.Time    `json:"uploaded_at"`    // Upload timestamp
	Downloads     int          `json:"downloads"`      // Download count
	AverageRating float64      `json:"average_rating"` // Average user rating
	IsAvailable   bool         `json:"is_available"`   // Whether the file is currently available
}

// NewAcademicFile creates a new AcademicFile with generated CID
// Demonstrates: function with multiple params, slice initialization, struct literal
func NewAcademicFile(fileName, ownerID, description, subject string, size int64, category FileCategory, tags []string) AcademicFile {
	// Generate CID based on content hash
	cid := generateCID(fileName, ownerID, size)

	// Create a copy of tags slice to avoid external modifications
	tagsCopy := make([]string, len(tags))
	copy(tagsCopy, tags)

	// Limit tags to maximum allowed
	if len(tagsCopy) > MaxTagsPerFile {
		tagsCopy = tagsCopy[:MaxTagsPerFile]
	}

	return AcademicFile{
		CID:           cid,
		FileName:      fileName,
		OwnerID:       ownerID,
		Size:          size,
		Category:      category,
		Tags:          tagsCopy,
		Description:   description,
		Subject:       subject,
		UploadedAt:    time.Now(),
		Downloads:     0,
		AverageRating: 0.0,
		IsAvailable:   true,
	}
}

// generateCID creates a Content Identifier using SHA-256 hash
// Demonstrates: byte slices, hashing, string concatenation
func generateCID(fileName, ownerID string, size int64) string {
	// Create input data for hashing
	data := fmt.Sprintf("%s:%s:%d:%d", fileName, ownerID, size, time.Now().UnixNano())

	// Create SHA-256 hash
	hash := sha256.New()
	hash.Write([]byte(data)) // Converting string to byte slice

	// Return hex-encoded hash
	return hex.EncodeToString(hash.Sum(nil))
}

// IncrementDownloads increments the download counter
func (f *AcademicFile) IncrementDownloads() {
	f.Downloads++
}

// UpdateRating updates the average rating
// Demonstrates: arithmetic operations, method with pointer receiver
func (f *AcademicFile) UpdateRating(totalRatings int, sumRatings float64) {
	if totalRatings > 0 {
		f.AverageRating = sumRatings / float64(totalRatings)
	}
}

// SetAvailability updates the file availability status
func (f *AcademicFile) SetAvailability(available bool) {
	f.IsAvailable = available
}

// HasTag checks if the file has a specific tag
// Demonstrates: for loop iteration over slice, string comparison
func (f *AcademicFile) HasTag(tag string) bool {
	tagLower := strings.ToLower(tag)
	for _, t := range f.Tags {
		if strings.ToLower(t) == tagLower {
			return true
		}
	}
	return false
}

// AddTag adds a new tag to the file
// Demonstrates: slice append, control flow
func (f *AcademicFile) AddTag(tag string) bool {
	// Check if already at max tags
	if len(f.Tags) >= MaxTagsPerFile {
		return false
	}

	// Check if tag already exists
	if f.HasTag(tag) {
		return false
	}

	// Append to slice
	f.Tags = append(f.Tags, tag)
	return true
}

// RemoveTag removes a tag from the file
// Demonstrates: slice manipulation, for loop with index
func (f *AcademicFile) RemoveTag(tag string) bool {
	tagLower := strings.ToLower(tag)
	for i, t := range f.Tags {
		if strings.ToLower(t) == tagLower {
			// Remove element by slicing
			f.Tags = append(f.Tags[:i], f.Tags[i+1:]...)
			return true
		}
	}
	return false
}

// MatchesSearch checks if the file matches a search query
// Demonstrates: complex control flow, string operations, for loops
func (f *AcademicFile) MatchesSearch(query string) bool {
	queryLower := strings.ToLower(query)

	// Check filename
	if strings.Contains(strings.ToLower(f.FileName), queryLower) {
		return true
	}

	// Check description
	if strings.Contains(strings.ToLower(f.Description), queryLower) {
		return true
	}

	// Check subject
	if strings.Contains(strings.ToLower(f.Subject), queryLower) {
		return true
	}

	// Check all tags
	for _, tag := range f.Tags {
		if strings.Contains(strings.ToLower(tag), queryLower) {
			return true
		}
	}

	return false
}

// GetFormattedSize returns human-readable file size
// Demonstrates: control flow with multiple conditions, type conversion
func (f *AcademicFile) GetFormattedSize() string {
	size := float64(f.Size)

	if size < 1024 {
		return fmt.Sprintf("%.0f B", size)
	} else if size < 1024*1024 {
		return fmt.Sprintf("%.2f KB", size/1024)
	} else if size < 1024*1024*1024 {
		return fmt.Sprintf("%.2f MB", size/(1024*1024))
	}
	return fmt.Sprintf("%.2f GB", size/(1024*1024*1024))
}

// String returns a formatted string representation
func (f AcademicFile) String() string {
	return fmt.Sprintf("File{CID: %s..., Name: %s, Size: %s, Category: %s, Downloads: %d}",
		f.CID[:8], f.FileName, f.GetFormattedSize(), f.Category, f.Downloads)
}

// ValidateFile checks if the file has valid data
// Demonstrates: validation logic, multiple return values
func ValidateFile(f AcademicFile) (bool, string) {
	if f.CID == "" {
		return false, "CID cannot be empty"
	}
	if f.FileName == "" {
		return false, "File name cannot be empty"
	}
	if len(f.FileName) > MaxFileNameLen {
		return false, "File name too long"
	}
	if f.Size < MinFileSize {
		return false, "File size must be at least 1 byte"
	}
	if f.Size > MaxFileSize {
		return false, "File size exceeds maximum allowed"
	}
	if f.OwnerID == "" {
		return false, "Owner ID cannot be empty"
	}
	return true, ""
}

// GetAllCategories returns all available file categories
// Demonstrates: array/slice initialization with values
func GetAllCategories() []FileCategory {
	return []FileCategory{
		CategoryNotes,
		CategoryTextbook,
		CategorySlides,
		CategoryAssignment,
		CategoryResearch,
		CategoryOther,
	}
}
