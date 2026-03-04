// Package models contains the core data structures for the P2P Academic Library
package models

import (
	"fmt"
	"strings"
	"sync"
)

// PeerRegistry manages all students/peers in the network
// Demonstrates: map usage for O(1) lookups, struct with map field
type PeerRegistry struct {
	peers map[string]Student // Map with Node ID as key
	mu    sync.RWMutex       // For concurrent access (Phase 4)
}

// NewPeerRegistry creates a new empty peer registry
// Demonstrates: map initialization with make
func NewPeerRegistry() *PeerRegistry {
	return &PeerRegistry{
		peers: make(map[string]Student),
	}
}

// Add adds a new student to the registry
// Demonstrates: map insertion, control flow for duplicate check
func (pr *PeerRegistry) Add(student Student) error {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	// Check if peer already exists
	if _, exists := pr.peers[student.ID]; exists {
		return fmt.Errorf("peer with ID %s already exists", student.ID)
	}

	pr.peers[student.ID] = student
	return nil
}

// Get retrieves a student by ID
// Demonstrates: map lookup with ok pattern
func (pr *PeerRegistry) Get(id string) (Student, bool) {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	student, exists := pr.peers[id]
	return student, exists
}

// Update updates an existing student
// Demonstrates: map update
func (pr *PeerRegistry) Update(student Student) error {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	if _, exists := pr.peers[student.ID]; !exists {
		return fmt.Errorf("peer with ID %s not found", student.ID)
	}

	pr.peers[student.ID] = student
	return nil
}

// Remove removes a student from the registry
// Demonstrates: map delete
func (pr *PeerRegistry) Remove(id string) error {
	pr.mu.Lock()
	defer pr.mu.Unlock()

	if _, exists := pr.peers[id]; !exists {
		return fmt.Errorf("peer with ID %s not found", id)
	}

	delete(pr.peers, id)
	return nil
}

// GetAll returns all students as a slice
// Demonstrates: for loop over map, slice building
func (pr *PeerRegistry) GetAll() []Student {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	students := make([]Student, 0, len(pr.peers))
	for _, student := range pr.peers {
		students = append(students, student)
	}
	return students
}

// GetOnlinePeers returns all online students
// Demonstrates: filtering with for loop and control flow
func (pr *PeerRegistry) GetOnlinePeers() []Student {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	online := make([]Student, 0)
	for _, student := range pr.peers {
		if student.IsOnline {
			online = append(online, student)
		}
	}
	return online
}

// GetLeecherPeers returns all leecher students
func (pr *PeerRegistry) GetLeecherPeers() []Student {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	leechers := make([]Student, 0)
	for _, student := range pr.peers {
		if student.IsLeecher {
			leechers = append(leechers, student)
		}
	}
	return leechers
}

// GetTopContributors returns students sorted by reputation (simplified)
// Demonstrates: array declaration, for loop with index
func (pr *PeerRegistry) GetTopContributors(limit int) []Student {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	all := pr.GetAll()

	// Simple bubble sort for demonstration
	// Demonstrates: nested for loops, array swapping
	n := len(all)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if all[j].ReputationScore < all[j+1].ReputationScore {
				all[j], all[j+1] = all[j+1], all[j]
			}
		}
	}

	// Return limited results
	if limit > len(all) {
		limit = len(all)
	}
	return all[:limit]
}

// SearchByName searches students by name (partial match)
// Demonstrates: string matching in for loop
func (pr *PeerRegistry) SearchByName(query string) []Student {
	pr.mu.RLock()
	defer pr.mu.RUnlock()

	results := make([]Student, 0)
	queryLower := strings.ToLower(query)

	for _, student := range pr.peers {
		if strings.Contains(strings.ToLower(student.Name), queryLower) {
			results = append(results, student)
		}
	}
	return results
}

// Size returns the number of registered peers
func (pr *PeerRegistry) Size() int {
	pr.mu.RLock()
	defer pr.mu.RUnlock()
	return len(pr.peers)
}

// Exists checks if a peer exists
func (pr *PeerRegistry) Exists(id string) bool {
	pr.mu.RLock()
	defer pr.mu.RUnlock()
	_, exists := pr.peers[id]
	return exists
}

// ========================================
// FileIndex - Academic File Registry
// ========================================

// FileIndex manages all academic files in the network
// Demonstrates: another map-based registry
type FileIndex struct {
	files map[string]AcademicFile // Map with CID as key
	mu    sync.RWMutex
}

// NewFileIndex creates a new empty file index
func NewFileIndex() *FileIndex {
	return &FileIndex{
		files: make(map[string]AcademicFile),
	}
}

// Add adds a new file to the index
func (fi *FileIndex) Add(file AcademicFile) error {
	fi.mu.Lock()
	defer fi.mu.Unlock()

	if _, exists := fi.files[file.CID]; exists {
		return fmt.Errorf("file with CID %s already exists", file.CID)
	}

	fi.files[file.CID] = file
	return nil
}

// Get retrieves a file by CID
func (fi *FileIndex) Get(cid string) (AcademicFile, bool) {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	file, exists := fi.files[cid]
	return file, exists
}

// Update updates an existing file
func (fi *FileIndex) Update(file AcademicFile) error {
	fi.mu.Lock()
	defer fi.mu.Unlock()

	if _, exists := fi.files[file.CID]; !exists {
		return fmt.Errorf("file with CID %s not found", file.CID)
	}

	fi.files[file.CID] = file
	return nil
}

// Remove removes a file from the index
func (fi *FileIndex) Remove(cid string) error {
	fi.mu.Lock()
	defer fi.mu.Unlock()

	if _, exists := fi.files[cid]; !exists {
		return fmt.Errorf("file with CID %s not found", cid)
	}

	delete(fi.files, cid)
	return nil
}

// GetAll returns all files as a slice
func (fi *FileIndex) GetAll() []AcademicFile {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	files := make([]AcademicFile, 0, len(fi.files))
	for _, file := range fi.files {
		files = append(files, file)
	}
	return files
}

// GetByOwner returns all files owned by a specific student
// Demonstrates: filtering files by owner
func (fi *FileIndex) GetByOwner(ownerID string) []AcademicFile {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	result := make([]AcademicFile, 0)
	for _, file := range fi.files {
		if file.OwnerID == ownerID {
			result = append(result, file)
		}
	}
	return result
}

// GetByCategory returns files of a specific category
func (fi *FileIndex) GetByCategory(category FileCategory) []AcademicFile {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	result := make([]AcademicFile, 0)
	for _, file := range fi.files {
		if file.Category == category {
			result = append(result, file)
		}
	}
	return result
}

// GetAvailableFiles returns only available files
func (fi *FileIndex) GetAvailableFiles() []AcademicFile {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	available := make([]AcademicFile, 0)
	for _, file := range fi.files {
		if file.IsAvailable {
			available = append(available, file)
		}
	}
	return available
}

// Search searches files by query (matches name, description, subject, tags)
// Demonstrates: complex search using for loop with method call
func (fi *FileIndex) Search(query string) []AcademicFile {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	results := make([]AcademicFile, 0)
	for _, file := range fi.files {
		if file.IsAvailable && file.MatchesSearch(query) {
			results = append(results, file)
		}
	}
	return results
}

// SearchByTags returns files that have any of the specified tags
// Demonstrates: nested for loops over slices
func (fi *FileIndex) SearchByTags(tags []string) []AcademicFile {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	results := make([]AcademicFile, 0)

	for _, file := range fi.files {
		if !file.IsAvailable {
			continue
		}

		// Check if file has any of the tags
		for _, tag := range tags {
			if file.HasTag(tag) {
				results = append(results, file)
				break // Found match, no need to check other tags
			}
		}
	}
	return results
}

// GetMostDownloaded returns the most downloaded files
// Demonstrates: sorting for ranking
func (fi *FileIndex) GetMostDownloaded(limit int) []AcademicFile {
	all := fi.GetAll()

	// Bubble sort by downloads
	n := len(all)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if all[j].Downloads < all[j+1].Downloads {
				all[j], all[j+1] = all[j+1], all[j]
			}
		}
	}

	if limit > len(all) {
		limit = len(all)
	}
	return all[:limit]
}

// GetTopRated returns the highest rated files
func (fi *FileIndex) GetTopRated(limit int) []AcademicFile {
	all := fi.GetAll()

	// Bubble sort by rating
	n := len(all)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if all[j].AverageRating < all[j+1].AverageRating {
				all[j], all[j+1] = all[j+1], all[j]
			}
		}
	}

	if limit > len(all) {
		limit = len(all)
	}
	return all[:limit]
}

// GetTotalSize calculates total size of all files
// Demonstrates: accumulation with for loop
func (fi *FileIndex) GetTotalSize() int64 {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	var total int64 = 0
	for _, file := range fi.files {
		total += file.Size
	}
	return total
}

// GetCategoryStats returns file count per category
// Demonstrates: map for aggregation
func (fi *FileIndex) GetCategoryStats() map[FileCategory]int {
	fi.mu.RLock()
	defer fi.mu.RUnlock()

	stats := make(map[FileCategory]int)

	// Initialize all categories
	for _, cat := range GetAllCategories() {
		stats[cat] = 0
	}

	// Count files per category
	for _, file := range fi.files {
		stats[file.Category]++
	}

	return stats
}

// Size returns the number of indexed files
func (fi *FileIndex) Size() int {
	fi.mu.RLock()
	defer fi.mu.RUnlock()
	return len(fi.files)
}

// Exists checks if a file exists
func (fi *FileIndex) Exists(cid string) bool {
	fi.mu.RLock()
	defer fi.mu.RUnlock()
	_, exists := fi.files[cid]
	return exists
}
