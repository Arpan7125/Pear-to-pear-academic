// Package models contains the core data structures for the P2P Academic Library
package models

import (
	"fmt"
	"time"
)

// Constants for reputation thresholds and system limits
const (
	MinReputation     float64 = 3.0 // Minimum reputation score to download files
	MaxReputation     float64 = 5.0 // Maximum reputation score
	DefaultReputation float64 = 3.5 // Default reputation for new students
	LeecherThreshold  float64 = 2.0 // Below this score, student is marked as leecher
)

// Student represents a peer in the P2P Academic network
// This struct demonstrates: struct definition, multiple field types, and tags
type Student struct {
	ID              string                   // Unique node identifier
	Name            string                   // Student's display name
	Email           string                   // Contact email
	ReputationScore float64                  // Current reputation (0.0 - 5.0)
	IsLeecher       bool                     // True if student downloads more than uploads
	IsOnline        bool                     // Current online status
	FilesShared     int                      // Count of files shared
	FilesDownloaded int                      // Count of files downloaded
	JoinedAt        time.Time                // When the student joined the network
	LastActive      time.Time                // Last activity timestamp
}

// NewStudent creates a new Student with default values
// Demonstrates: function with multiple parameters, struct initialization, type inference
func NewStudent(id, name, email string) Student {
	// Using := for type inference (short variable declaration)
	now := time.Now()

	// Struct literal initialization
	student := Student{
		ID:              id,
		Name:            name,
		Email:           email,
		ReputationScore: DefaultReputation,
		IsLeecher:       false,
		IsOnline:        true,
		FilesShared:     0,
		FilesDownloaded: 0,
		JoinedAt:        now,
		LastActive:      now,
	}

	return student
}

// CanDownload checks if a student has enough reputation to download files
// Demonstrates: method on struct, control flow with if/else, boolean return
func (s *Student) CanDownload() bool {
	// Control flow: checking reputation threshold
	if s.ReputationScore >= MinReputation {
		return true
	}
	return false
}

// UpdateReputation updates the student's reputation and leecher status
// Demonstrates: method with pointer receiver, control flow, variable assignment
func (s *Student) UpdateReputation(newScore float64) {
	// Validate score range using control flow
	if newScore < 0 {
		s.ReputationScore = 0
	} else if newScore > MaxReputation {
		s.ReputationScore = MaxReputation
	} else {
		s.ReputationScore = newScore
	}

	// Update leecher status based on threshold
	s.IsLeecher = s.ReputationScore < LeecherThreshold
	s.LastActive = time.Now()
}

// IncrementFilesShared increments the files shared counter
func (s *Student) IncrementFilesShared() {
	s.FilesShared++
	s.LastActive = time.Now()
}

// IncrementFilesDownloaded increments the files downloaded counter
func (s *Student) IncrementFilesDownloaded() {
	s.FilesDownloaded++
	s.LastActive = time.Now()
}

// GetContributionRatio returns the ratio of shared to downloaded files
// Demonstrates: arithmetic operations, control flow for division by zero
func (s *Student) GetContributionRatio() float64 {
	if s.FilesDownloaded == 0 {
		if s.FilesShared > 0 {
			return float64(s.FilesShared) // Infinite contribution (only sharing)
		}
		return 1.0 // No activity yet
	}
	return float64(s.FilesShared) / float64(s.FilesDownloaded)
}

// SetOnlineStatus updates the student's online status
func (s *Student) SetOnlineStatus(online bool) {
	s.IsOnline = online
	if online {
		s.LastActive = time.Now()
	}
}

// String returns a formatted string representation of the student
// Demonstrates: method implementation, string formatting
func (s Student) String() string {
	status := "Offline"
	if s.IsOnline {
		status = "Online"
	}

	leecherStatus := ""
	if s.IsLeecher {
		leecherStatus = " [LEECHER]"
	}

	return fmt.Sprintf("Student{ID: %s, Name: %s, Reputation: %.2f, Status: %s%s}",
		s.ID, s.Name, s.ReputationScore, status, leecherStatus)
}

// ValidateStudent checks if a student has valid data
// Demonstrates: multiple return values, error handling pattern, control flow
func ValidateStudent(s Student) (bool, string) {
	if s.ID == "" {
		return false, "Student ID cannot be empty"
	}
	if s.Name == "" {
		return false, "Student name cannot be empty"
	}
	if s.ReputationScore < 0 || s.ReputationScore > MaxReputation {
		return false, "Reputation score must be between 0 and 5"
	}
	return true, ""
}
