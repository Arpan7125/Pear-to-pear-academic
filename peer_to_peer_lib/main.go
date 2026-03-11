// P2P Academic Library - Main Entry Point
//
// This is the main entry point for the P2P Academic Library application.
// It demonstrates the initialization and wiring of all services.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"

	"p2p-library/handlers"
	"p2p-library/models"
	"p2p-library/services"
	"p2p-library/store"
)

func main() {
	// Initialize storage
	memoryStore := store.NewMemoryStore()

	// Initialize services
	userService := services.NewUserService(memoryStore)
	libraryService := services.NewLibraryService(memoryStore, userService)
	reputationService := services.NewReputationService(memoryStore)
	searchService := services.NewSearchService(memoryStore)

	// Seed demo data
	seedDemoData(memoryStore, userService, libraryService)

	// Recalculate all reputations after seeding
	reputationService.RecalculateAll()

	// Initialize handlers
	apiHandler := handlers.NewAPIHandler(
		userService,
		libraryService,
		reputationService,
		searchService,
	)

	// Setup router
	router := mux.NewRouter()

	// API routes
	apiHandler.SetupRoutes(router)

	// Serve static files for frontend
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./frontend/dist")))

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:8080",
			"https://frontend-one-lake-66.vercel.app",
			"https://*.vercel.app",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(router)

	// Get port from environment or default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 P2P Academic Library Server running on http://localhost:%s\n", port)
	fmt.Println("📚 API endpoints available at /api")
	fmt.Println("📖 Documentation: See P2P_Academic_Library_Documentation.md")

	log.Fatal(http.ListenAndServe(":"+port, handler))
}

// seedDemoData creates sample data for testing
func seedDemoData(store *store.MemoryStore, userService *services.UserService, libService *services.LibraryService) {
	// Create demo users with peer info
	alice, _ := userService.CreateUser("alice", "alice@university.edu", "password")
	alice.Role = "admin"
	alice.PeerID = "peer-alice-001"
	alice.IPAddress = "192.168.1.10"
	alice.Status = models.StatusOnline

	bob, _ := userService.CreateUser("bob", "bob@university.edu", "password")
	bob.PeerID = "peer-bob-002"
	bob.IPAddress = "192.168.1.11"
	bob.Status = models.StatusOnline

	charlie, _ := userService.CreateUser("charlie", "charlie@university.edu", "password")
	charlie.PeerID = "peer-charlie-003"
	charlie.IPAddress = "192.168.1.12"
	charlie.Status = models.StatusOffline

	diana, _ := userService.CreateUser("diana", "diana@university.edu", "password")
	diana.PeerID = "peer-diana-004"
	diana.IPAddress = "192.168.1.13"
	diana.Status = models.StatusOnline

	eve, _ := userService.CreateUser("eve", "eve@university.edu", "password")
	eve.PeerID = "peer-eve-005"
	eve.IPAddress = "192.168.1.14"
	eve.Status = models.StatusOffline

	// Make Alice a top contributor
	for i := 0; i < 50; i++ {
		userService.RecordUpload(alice.ID)
	}
	for i := 0; i < 10; i++ {
		userService.RecordDownload(alice.ID)
	}

	// Make Bob a contributor
	for i := 0; i < 25; i++ {
		userService.RecordUpload(bob.ID)
	}
	for i := 0; i < 10; i++ {
		userService.RecordDownload(bob.ID)
	}

	// Diana is neutral
	for i := 0; i < 12; i++ {
		userService.RecordUpload(diana.ID)
	}
	for i := 0; i < 12; i++ {
		userService.RecordDownload(diana.ID)
	}

	// Charlie is a leecher
	for i := 0; i < 3; i++ {
		userService.RecordUpload(charlie.ID)
	}
	for i := 0; i < 30; i++ {
		userService.RecordDownload(charlie.ID)
	}

	// Eve is neutral
	for i := 0; i < 8; i++ {
		userService.RecordUpload(eve.ID)
	}
	for i := 0; i < 15; i++ {
		userService.RecordDownload(eve.ID)
	}

	// Create demo resources
	resources := []struct {
		filename string
		title    string
		subject  string
		uploader models.UserID
		tags     []string
		size     int64
	}{
		{"golang_tutorial.pdf", "Go Programming Fundamentals", "Computer Science", alice.ID, []string{"golang", "programming", "tutorial"}, 2500000},
		{"data_structures.pdf", "Data Structures and Algorithms", "Computer Science", alice.ID, []string{"algorithms", "dsa", "programming"}, 3200000},
		{"calculus_notes.pdf", "Calculus Complete Notes", "Mathematics", bob.ID, []string{"calculus", "math", "notes"}, 1800000},
		{"physics_mechanics.pdf", "Classical Mechanics", "Physics", alice.ID, []string{"physics", "mechanics"}, 4100000},
		{"database_design.pdf", "Database Design Principles", "Computer Science", bob.ID, []string{"database", "sql", "design"}, 2800000},
		{"linear_algebra.pdf", "Linear Algebra Essentials", "Mathematics", alice.ID, []string{"algebra", "math", "linear"}, 2100000},
		{"networking_basics.pdf", "Computer Networks Basics", "Computer Science", charlie.ID, []string{"networking", "tcp", "protocols"}, 1900000},
		{"chemistry_organic.pdf", "Organic Chemistry Guide", "Chemistry", bob.ID, []string{"chemistry", "organic"}, 3500000},
		{"os_concepts.pdf", "Operating Systems Concepts", "Computer Science", diana.ID, []string{"os", "kernel", "processes"}, 4200000},
		{"discrete_math.pdf", "Discrete Mathematics", "Mathematics", diana.ID, []string{"discrete", "math", "logic"}, 2600000},
		{"ml_basics.pdf", "Machine Learning Fundamentals", "Computer Science", alice.ID, []string{"ml", "ai", "python"}, 5100000},
		{"statistics.pdf", "Statistics for Engineers", "Mathematics", bob.ID, []string{"statistics", "probability", "math"}, 3100000},
		{"web_dev.pdf", "Full Stack Web Development", "Computer Science", eve.ID, []string{"web", "javascript", "react"}, 4800000},
		{"signals_systems.pdf", "Signals and Systems", "Electronics", diana.ID, []string{"signals", "dsp", "electronics"}, 3700000},
		{"thermodynamics.pdf", "Engineering Thermodynamics", "Physics", eve.ID, []string{"thermo", "physics", "energy"}, 2900000},
	}

	for _, r := range resources {
		resource := models.NewResource(r.filename, r.size, r.uploader)
		resource.Title = r.title
		resource.Subject = r.subject
		resource.Tags = r.tags
		resource.Description = "Comprehensive academic resource for " + r.title

		// Add peers
		resource.AddPeer(models.PeerID("peer-alice-001"))
		if r.uploader != alice.ID {
			resource.AddPeer(models.PeerID("peer-bob-002"))
		}

		libService.Upload(resource)

		// Add varied ratings
		resource.AddRating(models.Rating(4.0))
		resource.AddRating(models.Rating(4.5))
		resource.AddRating(models.Rating(3.5))

		// Add some downloads
		resource.DownloadCount = int(r.size / 100000)
	}

	fmt.Println("✅ Demo data seeded: 5 users, 15 resources")
}
