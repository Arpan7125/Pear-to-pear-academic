// Package main is the entry point for the Knowledge Exchange P2P Academic Library
package main

import (
	
	"fmt"
	"project/models"
)

// Global registries for the application
var (
	peerRegistry     *models.PeerRegistry
	fileIndex        *models.FileIndex
	ratingCollection *models.RatingCollection
)

// initializeSampleData creates sample data to demonstrate Phase 1 concepts
func initializeSampleData() {
	// ========================================
	// Demonstrating: Variables, Types, Struct Creation
	// ========================================
	
	// Create sample students using type inference (:=)
	student1 := models.NewStudent("001", "Alice Johnson", "alice@university.edu")
	student2 := models.NewStudent("002", "Bob Smith", "bob@university.edu")
	student3 := models.NewStudent("003", "Carol Williams", "carol@university.edu")
	student4 := models.NewStudent("004", "David Brown", "david@university.edu")
	student5 := models.NewStudent("005", "Eve Davis", "eve@university.edu")
	
	// Update reputations to show variety
	student1.UpdateReputation(4.5)
	student2.UpdateReputation(3.8)
	student3.UpdateReputation(4.2)
	student4.UpdateReputation(1.5) // This will make David a leecher
	student5.UpdateReputation(3.0)
	
	// Demonstrate file sharing counts
	student1.FilesShared = 15
	student1.FilesDownloaded = 5
	student2.FilesShared = 8
	student2.FilesDownloaded = 12
	student3.FilesShared = 20
	student3.FilesDownloaded = 10
	
	// ========================================
	// Demonstrating: Maps (PeerRegistry)
	// ========================================
	
	// Add all students to registry
	peerRegistry.Add(student1)
	peerRegistry.Add(student2)
	peerRegistry.Add(student3)
	peerRegistry.Add(student4)
	peerRegistry.Add(student5)
	
	fmt.Println("=== Peer Registry Initialized ===")
	fmt.Printf("Total Peers: %d\n", peerRegistry.Size())
	
	// ========================================
	// Demonstrating: Slices, Arrays
	// ========================================
	
	// Create sample academic files with tags (slices)
	file1Tags := []string{"algorithms", "data-structures", "computer-science"}
	file1 := models.NewAcademicFile(
		"Algorithms_Notes.pdf",
		"node_001",
		"Comprehensive notes on sorting and searching algorithms",
		"Computer Science",
		2048000, // ~2MB
		models.CategoryNotes,
		file1Tags,
	)
	
	file2Tags := []string{"operating-systems", "linux", "kernel"}
	file2 := models.NewAcademicFile(
		"OS_Concepts.pdf",
		"node_001",
		"Operating System concepts covering process management and memory",
		"Computer Science",
		5120000, // ~5MB
		models.CategoryTextbook,
		file2Tags,
	)
	
	file3Tags := []string{"database", "sql", "normalization"}
	file3 := models.NewAcademicFile(
		"DBMS_Slides.pptx",
		"node_002",
		"Database Management System presentation slides",
		"Database Systems",
		1024000, // ~1MB
		models.CategorySlides,
		file3Tags,
	)
	
	file4Tags := []string{"machine-learning", "neural-networks", "ai"}
	file4 := models.NewAcademicFile(
		"ML_Research_Paper.pdf",
		"node_003",
		"Research paper on deep learning techniques",
		"Artificial Intelligence",
		3072000, // ~3MB
		models.CategoryResearch,
		file4Tags,
	)
	
	file5Tags := []string{"networking", "tcp-ip", "protocols"}
	file5 := models.NewAcademicFile(
		"CN_Assignment_Solutions.pdf",
		"node_003",
		"Computer Networks assignment solutions",
		"Networking",
		512000, // ~0.5MB
		models.CategoryAssignment,
		file5Tags,
	)
	
	// ========================================
	// Demonstrating: Maps (FileIndex)
	// ========================================
	
	// Add all files to index
	fileIndex.Add(file1)
	fileIndex.Add(file2)
	fileIndex.Add(file3)
	fileIndex.Add(file4)
	fileIndex.Add(file5)
	
	// Simulate some downloads
	f1, _ := fileIndex.Get(file1.CID)
	f1.Downloads = 25
	f1.AverageRating = 4.5
	fileIndex.Update(f1)
	
	f2, _ := fileIndex.Get(file2.CID)
	f2.Downloads = 18
	f2.AverageRating = 4.2
	fileIndex.Update(f2)
	
	f3, _ := fileIndex.Get(file3.CID)
	f3.Downloads = 30
	f3.AverageRating = 4.8
	fileIndex.Update(f3)
	
	fmt.Println("\n=== File Index Initialized ===")
	fmt.Printf("Total Files: %d\n", fileIndex.Size())
	
	// ========================================
	// Demonstrating: Control Flow & Looping
	// ========================================
	
	fmt.Println("\n=== Demonstrating Control Flow ===")
	
	// For loop to iterate over all peers
	allPeers := peerRegistry.GetAll()
	for i, peer := range allPeers {
		fmt.Printf("%d. %s\n", i+1, peer.String())
		
		// If/else control flow
		if peer.CanDownload() {
			fmt.Printf("   ✓ Can download files\n")
		} else {
			fmt.Printf("   ✗ Cannot download (low reputation)\n")
		}
	}
	
	// Demonstrate leecher detection
	fmt.Println("\n=== Leecher Detection ===")
	leechers := peerRegistry.GetLeecherPeers()
	if len(leechers) > 0 {
		fmt.Printf("Found %d leecher(s):\n", len(leechers))
		for _, leecher := range leechers {
			fmt.Printf("  - %s (Reputation: %.2f)\n", leecher.Name, leecher.ReputationScore)
		}
	} else {
		fmt.Println("No leechers in the network")
	}
	
	// Demonstrate search functionality
	fmt.Println("\n=== Search Demo ===")
	searchResults := fileIndex.Search("algorithms")
	fmt.Printf("Search for 'algorithms' returned %d result(s):\n", len(searchResults))
	for _, file := range searchResults {
		fmt.Printf("  - %s\n", file.String())
	}
	
	// Demonstrate category stats using map
	fmt.Println("\n=== Category Statistics ===")
	stats := fileIndex.GetCategoryStats()
	for category, count := range stats {
		if count > 0 {
			fmt.Printf("  %s: %d file(s)\n", category, count)
		}
	}
	
	// ========================================
	// Sample Ratings
	// ========================================
	
	rating1, _ := models.NewRating("r001", "node_002", "node_001", file1.CID, 5.0, "Excellent notes!")
	rating2, _ := models.NewRating("r002", "node_003", "node_001", file1.CID, 4.0, "Very helpful")
	rating3, _ := models.NewRating("r003", "node_001", "node_002", file3.CID, 4.5, "Great slides")
	rating4, _ := models.NewRating("r004", "node_003", "node_002", file3.CID, 5.0, "Best DBMS content")
	rating5, _ := models.NewRating("r005", "node_001", "node_003", file4.CID, 4.8, "Amazing research")
	
	ratingCollection.Add(rating1)
	ratingCollection.Add(rating2)
	ratingCollection.Add(rating3)
	ratingCollection.Add(rating4)
	ratingCollection.Add(rating5)
	
	fmt.Println("\n=== Rating Statistics ===")
	fmt.Printf("Total Ratings: %d\n", ratingCollection.Size())
	fmt.Printf("Average Score: %.2f\n", ratingCollection.GetAverageScore())
	fmt.Printf("Positive Ratings: %d\n", ratingCollection.CountPositiveRatings())
}

func main() {
	fmt.Println("╔════════════════════════════════════════════════════╗")
	fmt.Println("║     The Knowledge Exchange - P2P Academic Library  ║")
	fmt.Println("║                   Phase 1: Core Logic              ║")
	fmt.Println("╚════════════════════════════════════════════════════╝")
	fmt.Println()
	
	// Initialize global registries
	peerRegistry = models.NewPeerRegistry()
	fileIndex = models.NewFileIndex()
	ratingCollection = models.NewRatingCollection()
	
	// Initialize sample data
	initializeSampleData()
}
