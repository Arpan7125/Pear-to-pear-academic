// Package models - Peer model definition
//
// GO CONCEPT 3: ARRAYS AND SLICES
// This file demonstrates peer management with slice operations
package models

import (
	"time"
)

// ============================================================================
// PEER STRUCT
// ============================================================================

// Peer represents a node in the P2P network
type Peer struct {
	ID            PeerID     `json:"id"`
	UserID        UserID     `json:"user_id"`
	IPAddress     string     `json:"ip_address"`
	Port          int        `json:"port"`
	Status        PeerStatus `json:"status"`
	
	// Statistics
	SharedResources int   `json:"shared_resources"` // Count of shared files
	Latency         int64 `json:"latency"`          // Ping in milliseconds
	
	// Connection info
	ConnectedAt    time.Time `json:"connected_at"`
	LastPingAt     time.Time `json:"last_ping_at"`
	
	// Reputation from user
	Reputation     ReputationScore    `json:"reputation"`
	Classification UserClassification `json:"classification"`
}

// ============================================================================
// PEER CONNECTION MANAGEMENT
// ============================================================================

// PeerConnection represents an active P2P connection
type PeerConnection struct {
	LocalPeer   PeerID      `json:"local_peer"`
	RemotePeer  PeerID      `json:"remote_peer"`
	Status      PeerStatus  `json:"status"`
	
	// Transfer stats
	BytesSent     int64 `json:"bytes_sent"`
	BytesReceived int64 `json:"bytes_received"`
	
	// Active transfers (slice of resource IDs)
	ActiveTransfers []ContentID `json:"active_transfers"`
	
	EstablishedAt time.Time `json:"established_at"`
}

// ============================================================================
// PEER LIST (Slice Operations)
// ============================================================================

// PeerList manages a collection of peers using slices
type PeerList struct {
	Peers    []Peer `json:"peers"`
	Capacity int    `json:"capacity"`
}

// NewPeerList creates a new peer list with initial capacity
func NewPeerList(capacity int) *PeerList {
	return &PeerList{
		// make([]T, length, capacity) - creates slice with capacity
		Peers:    make([]Peer, 0, capacity),
		Capacity: capacity,
	}
}

// Add adds a peer to the list
func (pl *PeerList) Add(peer Peer) {
	pl.Peers = append(pl.Peers, peer)
}

// Remove removes a peer by ID
func (pl *PeerList) Remove(peerID PeerID) {
	newPeers := make([]Peer, 0, len(pl.Peers))
	for _, p := range pl.Peers {
		if p.ID != peerID {
			newPeers = append(newPeers, p)
		}
	}
	pl.Peers = newPeers
}

// FindByID finds a peer by ID
func (pl *PeerList) FindByID(peerID PeerID) *Peer {
	for i := range pl.Peers {
		if pl.Peers[i].ID == peerID {
			return &pl.Peers[i]
		}
	}
	return nil
}

// GetOnlinePeers returns only online peers (slice filtering)
func (pl *PeerList) GetOnlinePeers() []Peer {
	online := make([]Peer, 0)
	for _, p := range pl.Peers {
		if p.Status == StatusOnline {
			online = append(online, p)
		}
	}
	return online
}

// GetByClassification filters peers by classification
func (pl *PeerList) GetByClassification(class UserClassification) []Peer {
	filtered := make([]Peer, 0)
	for _, p := range pl.Peers {
		if p.Classification == class {
			filtered = append(filtered, p)
		}
	}
	return filtered
}

// Count returns the number of peers
func (pl *PeerList) Count() int {
	return len(pl.Peers)
}

// ============================================================================
// PEER CONSTRUCTOR
// ============================================================================

// NewPeer creates a new peer instance
func NewPeer(id PeerID, userID UserID, ip string, port int) *Peer {
	now := TimeNow()
	return &Peer{
		ID:              id,
		UserID:          userID,
		IPAddress:       ip,
		Port:            port,
		Status:          StatusOffline,
		SharedResources: 0,
		Latency:         0,
		ConnectedAt:     now,
		LastPingAt:      now,
		Reputation:      0,
		Classification:  ClassNeutral,
	}
}

// UpdatePing updates the last ping time and latency
func (p *Peer) UpdatePing(latency int64) {
	p.LastPingAt = TimeNow()
	p.Latency = latency
}

// SetOnline marks the peer as online
func (p *Peer) SetOnline() {
	p.Status = StatusOnline
	p.ConnectedAt = TimeNow()
}

// SetOffline marks the peer as offline
func (p *Peer) SetOffline() {
	p.Status = StatusOffline
}
