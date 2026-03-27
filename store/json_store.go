// Package store — JSON file persistence for users.
// Reads users from data/users.json on startup and writes back on every change.
// This means user accounts survive server restarts.
package store

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"p2p-library/models"
)

const usersFilePath = "./data/users.json"

// userRecord is a flat JSON-serialisable view of a user (safe to write to disk).
type userRecord struct {
	ID             string  `json:"id"`
	PeerID         string  `json:"peer_id"`
	Username       string  `json:"username"`
	Email          string  `json:"email"`
	Password       string  `json:"password"` // bcrypt hash — never plain text
	Role           string  `json:"role"`
	Reputation     int     `json:"reputation"`
	Classification string  `json:"classification"`
	TotalUploads   int     `json:"total_uploads"`
	TotalDownloads int     `json:"total_downloads"`
	AverageRating  float64 `json:"average_rating"`
	Status         string  `json:"status"`
	IPAddress      string  `json:"ip_address"`
	CreatedAt      string  `json:"created_at"`
	LastActiveAt   string  `json:"last_active_at"`
}

// saveUsers writes all users in the store to data/users.json (called under lock).
// It blocks on the write but is fast for typical user counts.
func (m *MemoryStore) saveUsers() {
	records := make([]userRecord, 0, len(m.users))
	for _, u := range m.users {
		records = append(records, userRecord{
			ID:             string(u.ID),
			PeerID:         string(u.PeerID),
			Username:       u.Username,
			Email:          u.Email,
			Password:       u.Password,
			Role:           u.Role,
			Reputation:     int(u.Reputation),
			Classification: string(u.Classification),
			TotalUploads:   u.TotalUploads,
			TotalDownloads: u.TotalDownloads,
			AverageRating:  u.AverageRating,
			Status:         string(u.Status),
			IPAddress:      u.IPAddress,
			CreatedAt:      u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			LastActiveAt:   u.LastActiveAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	data, err := json.MarshalIndent(records, "", "  ")
	if err != nil {
		log.Printf("[json_store] failed to marshal users: %v", err)
		return
	}

	if err := os.MkdirAll(filepath.Dir(usersFilePath), os.ModePerm); err != nil {
		log.Printf("[json_store] failed to create data dir: %v", err)
		return
	}

	if err := os.WriteFile(usersFilePath, data, 0644); err != nil {
		log.Printf("[json_store] failed to write users.json: %v", err)
	}
}

// loadUsers reads data/users.json and populates m.users.
// Returns the number of users loaded (0 is fine — file may not exist yet).
func (m *MemoryStore) loadUsers() int {
	data, err := os.ReadFile(usersFilePath)
	if os.IsNotExist(err) {
		return 0 // first boot — will be seeded by main.go
	}
	if err != nil {
		log.Printf("[json_store] failed to read users.json: %v", err)
		return 0
	}

	var records []userRecord
	if err := json.Unmarshal(data, &records); err != nil {
		log.Printf("[json_store] failed to parse users.json: %v", err)
		return 0
	}

	for _, rec := range records {
		u := &models.User{
			ID:             models.UserID(rec.ID),
			PeerID:         models.PeerID(rec.PeerID),
			Username:       rec.Username,
			Email:          rec.Email,
			Password:       rec.Password,
			Role:           rec.Role,
			Reputation:     models.ReputationScore(rec.Reputation),
			Classification: models.UserClassification(rec.Classification),
			TotalUploads:   rec.TotalUploads,
			TotalDownloads: rec.TotalDownloads,
			AverageRating:  rec.AverageRating,
			Status:         models.PeerStatus(rec.Status),
			IPAddress:      rec.IPAddress,
		}
		// Parse timestamps
		u.CreatedAt, _ = parseTime(rec.CreatedAt)
		u.LastActiveAt, _ = parseTime(rec.LastActiveAt)
		m.users[u.ID] = u
	}

	log.Printf("[json_store] loaded %d users from %s", len(records), usersFilePath)
	return len(records)
}
