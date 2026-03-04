// Type definitions for the P2P Academic Library
// Mirrors the Go backend types for TypeScript

export type UserID = string;
export type ContentID = string;
export type PeerID = string;

export type UserClassification = 'Contributor' | 'Neutral' | 'Leecher';
export type ResourceType = 'pdf' | 'document' | 'presentation' | 'spreadsheet' | 'other';
export type PeerStatus = 'online' | 'offline' | 'connecting' | 'transferring';

export interface User {
    id: UserID;
    username: string;
    email: string;
    role: 'admin' | 'user';
    reputation: number;
    classification: UserClassification;
    total_uploads: number;
    total_downloads: number;
    average_rating: number;
    created_at: string;
    last_active_at: string;
    peer_id: PeerID;
    status: PeerStatus;
}

export interface Resource {
    id: ContentID;
    filename: string;
    extension: string;
    size: number;
    type: ResourceType;
    title: string;
    description: string;
    subject: string;
    tags: string[];
    uploaded_by: UserID;
    available_on: PeerID[];
    total_ratings: number;
    average_rating: number;
    created_at: string;
    updated_at: string;
    download_count: number;
}

export interface SearchResult {
    resource: Resource;
    available_peers: number;
    relevance: number;
}

export interface SearchResults {
    query: string;
    results: SearchResult[];
    total_count: number;
    page: number;
    page_size: number;
}

export interface ReputationInfo {
    user_id: UserID;
    score: number;
    classification: UserClassification;
    uploads: number;
    downloads: number;
    average_rating: number;
    throttle: number;
}

export interface NetworkStats {
    total_users: number;
    contributors: number;
    neutral: number;
    leechers: number;
    average_score: number;
}

export interface LibraryStats {
    total_resources: number;
    total_downloads: number;
    total_ratings: number;
    by_subject: Record<string, number>;
    by_type: Record<ResourceType, number>;
}

// Go Concept definitions for learning section
export interface GoConcept {
    id: number;
    title: string;
    description: string;
    icon: string;
    codeExample: string;
    explanation: string;
    fileLocations: string[];
}

export const GO_CONCEPTS: GoConcept[] = [
    {
        id: 1,
        title: "Variables, Values & Types",
        description: "Type definitions, constants, custom types, and type aliases",
        icon: "📦",
        codeExample: `// Type aliases and custom types
type UserID string
type ReputationScore int
type ContentID string

// Constants with iota
const (
    MaxFileSize   = 100 << 20  // 100MB
    DefaultRating = 3.0
    UploadWeight  = 2
)

// Variables
var AllowedTypes = []string{".pdf", ".doc"}`,
        explanation: "Go is statically typed. We use custom types for type safety (UserID vs string) and constants for immutable values.",
        fileLocations: ["models/types.go", "models/user.go"]
    },
    {
        id: 2,
        title: "Looping & Control Flow",
        description: "For loops, range, if-else, switch statements, and labeled breaks",
        icon: "🔄",
        codeExample: `// For loop with range
for _, resource := range resources {
    if matchesQuery(resource, query) {
        results = append(results, resource)
    }
}

// Switch for classification
switch {
case score > 50:
    return "Contributor"
case score >= 0:
    return "Neutral"
default:
    return "Leecher"
}`,
        explanation: "Go has only 'for' loops (no while). Range iterates over slices/maps. Switch doesn't need break statements.",
        fileLocations: ["services/library_service.go", "services/reputation_service.go"]
    },
    {
        id: 3,
        title: "Arrays & Slices",
        description: "Fixed arrays, dynamic slices, append, slice operations",
        icon: "📚",
        codeExample: `// Fixed array (size is part of type)
var topResources [10]*Resource

// Dynamic slice with make
peers := make([]Peer, 0, 100)
peers = append(peers, newPeer)

// Slice operations
activePeers := peers[:activeCount]  // Slicing
filtered := peers[1:5]              // Sub-slice`,
        explanation: "Arrays have fixed size. Slices are dynamic, backed by arrays. Use make() to pre-allocate capacity.",
        fileLocations: ["models/resource.go", "models/peer.go"]
    },
    {
        id: 4,
        title: "Maps & Structs",
        description: "Struct definitions, JSON tags, maps for key-value storage",
        icon: "🗺️",
        codeExample: `// Struct with JSON tags
type Resource struct {
    ID       ContentID \`json:"id"\`
    Filename string    \`json:"filename"\`
    Rating   float64   \`json:"rating"\`
}

// Map for storage
var store = make(map[ContentID]*Resource)
store[resource.ID] = resource`,
        explanation: "Structs group related fields. JSON tags control serialization. Maps provide O(1) key lookups.",
        fileLocations: ["models/user.go", "store/memory.go"]
    },
    {
        id: 5,
        title: "Functions & Error Handling",
        description: "Multiple return values, custom errors, error wrapping",
        icon: "⚙️",
        codeExample: `// Multiple returns with error
func GetResource(id ContentID) (*Resource, error) {
    resource, exists := store[id]
    if !exists {
        return nil, ErrNotFound
    }
    return resource, nil
}

// Custom error type
type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return e.Field + ": " + e.Message
}`,
        explanation: "Go uses explicit error returns instead of exceptions. Custom errors implement the error interface.",
        fileLocations: ["errors/errors.go", "services/user_service.go"]
    },
    {
        id: 6,
        title: "Interfaces",
        description: "Interface definitions, implicit implementation, polymorphism",
        icon: "🔌",
        codeExample: `// Interface definition
type StorageService interface {
    Store(r *Resource) error
    Get(id ContentID) (*Resource, error)
    Delete(id ContentID) error
}

// Implicit implementation
type MemoryStore struct {
    data map[ContentID]*Resource
}

func (m *MemoryStore) Store(r *Resource) error {
    m.data[r.ID] = r
    return nil
}`,
        explanation: "Interfaces define behavior. Types implicitly implement interfaces - no 'implements' keyword needed.",
        fileLocations: ["interfaces/storage.go", "store/memory.go"]
    },
    {
        id: 7,
        title: "Pointers & Call Semantics",
        description: "Pointers, call by value vs reference, dereferencing",
        icon: "👆",
        codeExample: `// Call by VALUE - copy is modified
func UpdateByValue(user User, delta int) User {
    user.Reputation += delta  // Original unchanged
    return user
}

// Call by REFERENCE - original modified
func UpdateByPointer(user *User, delta int) {
    user.Reputation += delta  // Original changed!
}

// Usage
user := User{Reputation: 0}
UpdateByPointer(&user, 10)  // user.Reputation is now 10`,
        explanation: "Pointers allow modifying original data. Use * for pointer type, & to get address, *ptr to dereference.",
        fileLocations: ["services/user_service.go"]
    },
    {
        id: 8,
        title: "JSON & Unit Tests",
        description: "Marshal/unmarshal, HTTP handlers, table-driven tests",
        icon: "🧪",
        codeExample: `// JSON Marshal (struct → JSON)
json.NewEncoder(w).Encode(user)

// JSON Unmarshal (JSON → struct)
var req CreateUserRequest
json.NewDecoder(r.Body).Decode(&req)

// Table-driven test
func TestCalcReputation(t *testing.T) {
    tests := []struct {
        uploads, downloads int
        expected           int
    }{
        {50, 30, 70},
        {5, 50, -35},
    }
    for _, tt := range tests {
        got := Calculate(tt.uploads, tt.downloads)
        if got != tt.expected {
            t.Errorf("got %d, want %d", got, tt.expected)
        }
    }
}`,
        explanation: "JSON tags control field names. Table-driven tests run same logic with different inputs.",
        fileLocations: ["handlers/api_handler.go", "services/*_test.go"]
    }
];
