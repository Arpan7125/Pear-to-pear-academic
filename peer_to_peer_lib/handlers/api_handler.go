// Package handlers provides HTTP API handlers.
//
// GO CONCEPT 8: JSON MARSHAL AND UNMARSHAL
// This file demonstrates:
// - JSON encoding/decoding for API requests/responses
// - HTTP request handling
// - Error response formatting
package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	"p2p-library/models"
	"p2p-library/services"
)

// APIHandler handles HTTP requests
type APIHandler struct {
	userService       *services.UserService
	libraryService    *services.LibraryService
	reputationService *services.ReputationService
	searchService     *services.SearchService
}

// NewAPIHandler creates a new API handler
func NewAPIHandler(
	userService *services.UserService,
	libraryService *services.LibraryService,
	reputationService *services.ReputationService,
	searchService *services.SearchService,
) *APIHandler {
	return &APIHandler{
		userService:       userService,
		libraryService:    libraryService,
		reputationService: reputationService,
		searchService:     searchService,
	}
}

// Response types for JSON marshaling
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateResourceRequest struct {
	Filename    string   `json:"filename"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Subject     string   `json:"subject"`
	Tags        []string `json:"tags"`
	Size        int64    `json:"size"`
}

type RateResourceRequest struct {
	UserID  string  `json:"user_id"`
	Rating  float64 `json:"rating"`
	Comment string  `json:"comment"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// writeJSON is a helper for JSON responses
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeSuccess(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusOK, APIResponse{Success: true, Data: data})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, APIResponse{Success: false, Error: msg})
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// Login handles POST /api/auth/login
func (h *APIHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}

	users, err := h.userService.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	for _, user := range users {
		if user.Username == req.Username {
			writeSuccess(w, map[string]interface{}{
				"user":  user,
				"token": "demo-jwt-token-" + string(user.ID),
			})
			return
		}
	}

	writeError(w, http.StatusUnauthorized, "Invalid username or password")
}

// ============================================================================
// USER ENDPOINTS
// ============================================================================

// CreateUser handles POST /api/users
func (h *APIHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
		return
	}

	user, err := h.userService.CreateUser(req.Username, req.Email, req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, user)
}

// GetUser handles GET /api/users/{id}
func (h *APIHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := models.UserID(vars["id"])

	user, err := h.userService.GetUser(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeSuccess(w, user)
}

// GetAllUsers handles GET /api/users
func (h *APIHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, users)
}

// GetLeaderboard handles GET /api/leaderboard
func (h *APIHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	limitStr := r.URL.Query().Get("limit")
	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	users, err := h.userService.GetLeaderboard(limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, users)
}

// ============================================================================
// RESOURCE ENDPOINTS
// ============================================================================

// CreateResource handles POST /api/resources
func (h *APIHandler) CreateResource(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	if err := r.ParseMultipartForm(50 << 20); err != nil { // 50 MB max
		writeError(w, http.StatusBadRequest, "Error parsing form: "+err.Error())
		return
	}

	// Get user ID from header
	userID := models.UserID(r.Header.Get("X-User-ID"))
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "User ID required")
		return
	}

	// Get file from form
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "File is required")
		return
	}
	defer file.Close()

	// Create resource model
	resource := models.NewResource(header.Filename, header.Size, userID)
	resource.Title = r.FormValue("title")
	resource.Description = r.FormValue("description")
	resource.Preview = r.FormValue("preview")
	resource.Subject = r.FormValue("subject")
	
	tagsStr := r.FormValue("tags")
	if tagsStr != "" {
		rawTags := strings.Split(tagsStr, ",")
		for _, t := range rawTags {
			trimmed := strings.TrimSpace(t)
			if trimmed != "" {
				resource.Tags = append(resource.Tags, trimmed)
			}
		}
	}

	// Ensure uploads directory exists
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Create physical file
	filePath := filepath.Join(uploadDir, string(resource.ID)+filepath.Ext(header.Filename))
	outFile, err := os.Create(filePath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save file: "+err.Error())
		return
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, file); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to save file content: "+err.Error())
		return
	}

	if err := h.libraryService.Upload(resource); err != nil {
		os.Remove(filePath) // Clean up
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeSuccess(w, resource)
}

// GetResource handles GET /api/resources/{id}
func (h *APIHandler) GetResource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := models.ContentID(vars["id"])

	resource, err := h.libraryService.GetResource(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeSuccess(w, resource)
}

// DownloadResource handles GET and POST /api/resources/{id}/download
func (h *APIHandler) DownloadResource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resourceID := models.ContentID(vars["id"])
	
	// Support both header and query param for user_id allowing straight browser downloads
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		userIDStr = r.URL.Query().Get("user_id")
	}
	userID := models.UserID(userIDStr)

	resource, err := h.libraryService.Download(resourceID, userID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	// Determine file path
	filePath := filepath.Join("./uploads", string(resource.ID)+resource.Extension)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		writeError(w, http.StatusNotFound, "File not found on disk")
		return
	}

	// Serve the actual file as an attachment
	w.Header().Set("Content-Disposition", "attachment; filename=\""+resource.Filename+"\"")
	http.ServeFile(w, r, filePath)
}

// GetPopularResources handles GET /api/resources/popular
func (h *APIHandler) GetPopularResources(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil {
			limit = n
		}
	}

	resources, err := h.libraryService.GetPopular(limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, resources)
}

// GetRecentResources handles GET /api/resources/recent
func (h *APIHandler) GetRecentResources(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil {
			limit = n
		}
	}

	resources, err := h.libraryService.GetRecent(limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, resources)
}

// ============================================================================
// SEARCH ENDPOINTS
// ============================================================================

// SearchResources handles GET /api/search
func (h *APIHandler) SearchResources(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")

	filters := services.SearchFilters{
		Subject:   r.URL.Query().Get("subject"),
		SortBy:    r.URL.Query().Get("sort_by"),
		SortOrder: r.URL.Query().Get("sort_order"),
		Page:      1,
		PageSize:  10,
	}

	if p := r.URL.Query().Get("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil {
			filters.Page = n
		}
	}

	results, err := h.searchService.Search(query, filters)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, results)
}

// GetSuggestions handles GET /api/search/suggestions
func (h *APIHandler) GetSuggestions(w http.ResponseWriter, r *http.Request) {
	partial := r.URL.Query().Get("q")
	suggestions, err := h.searchService.GetSuggestions(partial)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, suggestions)
}

// ============================================================================
// REPUTATION ENDPOINTS
// ============================================================================

// GetReputation handles GET /api/users/{id}/reputation
func (h *APIHandler) GetReputation(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := models.UserID(vars["id"])

	info, err := h.reputationService.GetUserReputation(userID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeSuccess(w, info)
}

// GetNetworkStats handles GET /api/stats
func (h *APIHandler) GetNetworkStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.reputationService.GetNetworkStats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, stats)
}

// RateResource handles POST /api/resources/{id}/rate
func (h *APIHandler) RateResource(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	resourceID := models.ContentID(vars["id"])

	var req RateResourceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.UserID == "" {
		writeError(w, http.StatusBadRequest, "user_id is required")
		return
	}

	resource, err := h.libraryService.GetResource(resourceID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	// Validate user cannot rate their own content
	if string(resource.UploadedBy) == req.UserID {
		writeError(w, http.StatusForbidden, "Users cannot rate their own uploaded content")
		return
	}

	resource.AddRating(models.Rating(req.Rating))

	// Update uploader reputation based on rating
	h.reputationService.RecalculateAll()

	writeSuccess(w, map[string]interface{}{
		"resource_id": resourceID,
		"new_rating":  resource.AverageRating,
	})
}

// GetAllResources handles GET /api/resources
func (h *APIHandler) GetAllResources(w http.ResponseWriter, r *http.Request) {
	results, err := h.searchService.Search("", services.SearchFilters{Page: 1, PageSize: 100})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, results)
}

// GetLibraryStats handles GET /api/library/stats
func (h *APIHandler) GetLibraryStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.libraryService.GetStatistics()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, stats)
}

// GetPeers handles GET /api/peers
func (h *APIHandler) GetPeers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	peers := make([]map[string]interface{}, 0)
	for _, u := range users {
		peers = append(peers, map[string]interface{}{
			"id":               u.PeerID,
			"user_id":          u.ID,
			"username":         u.Username,
			"status":           u.Status,
			"reputation":       u.Reputation,
			"classification":   u.Classification,
			"shared_resources": u.TotalUploads,
			"ip_address":       u.IPAddress,
		})
	}
	writeSuccess(w, peers)
}

// SetupRoutes configures all API routes
func (h *APIHandler) SetupRoutes(r *mux.Router) {
	api := r.PathPrefix("/api").Subrouter()

	// Auth
	api.HandleFunc("/auth/login", h.Login).Methods("POST")

	// Users
	api.HandleFunc("/users", h.CreateUser).Methods("POST")
	api.HandleFunc("/users", h.GetAllUsers).Methods("GET")
	api.HandleFunc("/users/{id}", h.GetUser).Methods("GET")
	api.HandleFunc("/users/{id}/reputation", h.GetReputation).Methods("GET")
	api.HandleFunc("/users/{id}/resources", h.GetUserResources).Methods("GET")
	api.HandleFunc("/leaderboard", h.GetLeaderboard).Methods("GET")

	// Resources
	api.HandleFunc("/resources", h.GetAllResources).Methods("GET")
	api.HandleFunc("/resources", h.CreateResource).Methods("POST")
	api.HandleFunc("/resources/popular", h.GetPopularResources).Methods("GET")
	api.HandleFunc("/resources/recent", h.GetRecentResources).Methods("GET")
	api.HandleFunc("/resources/{id}", h.GetResource).Methods("GET")
	api.HandleFunc("/resources/{id}/download", h.DownloadResource).Methods("GET", "POST")
	api.HandleFunc("/resources/{id}/rate", h.RateResource).Methods("POST")

	// Search
	api.HandleFunc("/search", h.SearchResources).Methods("GET")
	api.HandleFunc("/search/suggestions", h.GetSuggestions).Methods("GET")

	// Stats
	api.HandleFunc("/stats", h.GetNetworkStats).Methods("GET")
	api.HandleFunc("/library/stats", h.GetLibraryStats).Methods("GET")

	// Peers
	api.HandleFunc("/peers", h.GetPeers).Methods("GET")

	// Admin endpoints
	api.HandleFunc("/admin/users/{id}", h.AdminDeleteUser).Methods("DELETE")
	api.HandleFunc("/admin/users/{id}/role", h.AdminUpdateRole).Methods("PUT")
	api.HandleFunc("/admin/resources/{id}", h.AdminDeleteResource).Methods("DELETE")
	api.HandleFunc("/admin/stats", h.AdminDashboardStats).Methods("GET")
}

// ============================================================================
// USER-SPECIFIC ENDPOINTS
// ============================================================================

// GetUserResources handles GET /api/users/{id}/resources
func (h *APIHandler) GetUserResources(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := models.UserID(vars["id"])

	results, err := h.searchService.Search("", services.SearchFilters{Page: 1, PageSize: 200})
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	userResources := make([]*models.Resource, 0)
	for _, sr := range results.Results {
		if sr.Resource.UploadedBy == userID {
			userResources = append(userResources, sr.Resource)
		}
	}

	writeSuccess(w, userResources)
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

type UpdateRoleRequest struct {
	Role string `json:"role"`
}

// AdminDeleteUser handles DELETE /api/admin/users/{id}
func (h *APIHandler) AdminDeleteUser(w http.ResponseWriter, r *http.Request) {
	adminID := models.UserID(r.Header.Get("X-User-ID"))
	if !h.isAdmin(adminID) {
		writeError(w, http.StatusForbidden, "Admin access required")
		return
	}

	vars := mux.Vars(r)
	targetID := models.UserID(vars["id"])

	if adminID == targetID {
		writeError(w, http.StatusBadRequest, "Cannot delete yourself")
		return
	}

	if err := h.userService.DeleteUser(targetID); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeSuccess(w, map[string]string{"deleted": string(targetID)})
}

// AdminUpdateRole handles PUT /api/admin/users/{id}/role
func (h *APIHandler) AdminUpdateRole(w http.ResponseWriter, r *http.Request) {
	adminID := models.UserID(r.Header.Get("X-User-ID"))
	if !h.isAdmin(adminID) {
		writeError(w, http.StatusForbidden, "Admin access required")
		return
	}

	vars := mux.Vars(r)
	targetID := models.UserID(vars["id"])

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	if req.Role != "admin" && req.Role != "user" {
		writeError(w, http.StatusBadRequest, "Role must be 'admin' or 'user'")
		return
	}

	user, err := h.userService.GetUser(targetID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	user.Role = req.Role
	writeSuccess(w, user)
}

// AdminDeleteResource handles DELETE /api/admin/resources/{id}
func (h *APIHandler) AdminDeleteResource(w http.ResponseWriter, r *http.Request) {
	adminID := models.UserID(r.Header.Get("X-User-ID"))
	if !h.isAdmin(adminID) {
		writeError(w, http.StatusForbidden, "Admin access required")
		return
	}

	vars := mux.Vars(r)
	resourceID := models.ContentID(vars["id"])

	if err := h.libraryService.DeleteResource(resourceID); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	writeSuccess(w, map[string]string{"deleted": string(resourceID)})
}

// AdminDashboardStats handles GET /api/admin/stats
func (h *APIHandler) AdminDashboardStats(w http.ResponseWriter, r *http.Request) {
	netStats, err := h.reputationService.GetNetworkStats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	libStats, err := h.libraryService.GetStatistics()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeSuccess(w, map[string]interface{}{
		"network": netStats,
		"library": libStats,
	})
}

// isAdmin checks if a user has admin role
func (h *APIHandler) isAdmin(userID models.UserID) bool {
	user, err := h.userService.GetUser(userID)
	if err != nil {
		return false
	}
	return user.IsAdmin()
}
