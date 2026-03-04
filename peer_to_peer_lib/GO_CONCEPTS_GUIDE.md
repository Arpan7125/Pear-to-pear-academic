# Go Concepts Guide — P2P Academic Library

A complete reference to where and how every core Go concept is implemented in this project, with actual code snippets and file locations.

---

## Table of Contents

1. [Variables, Values & Types](#1-variables-values--types)
2. [Looping & Control Flow](#2-looping--control-flow)
3. [Arrays & Slices](#3-arrays--slices)
4. [Maps & Structs](#4-maps--structs)
5. [Functions & Error Handling](#5-functions--error-handling)
6. [Interfaces](#6-interfaces)
7. [Pointers — Call by Value vs Reference](#7-pointers--call-by-value-vs-reference)
8. [JSON Marshal/Unmarshal & Unit Tests](#8-json-marshalunmarshal--unit-tests)

---

## 1. Variables, Values & Types

> **File:** [`models/types.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/types.go)

### 1.1 Custom Types (Type Aliases)

Go lets you create new types from existing types for **type safety** and self-documenting code. Instead of using plain `string` everywhere, we define purpose-specific types:

```go
// models/types.go — Lines 21–34

type UserID string          // A user identifier (not just any string)
type ContentID string       // A hash-based resource identifier
type PeerID string          // A peer in the P2P network
type ReputationScore int    // A reputation value (not just any int)
type Rating float64         // A 1–5 star rating
```

**Why this matters:** If a function expects `UserID`, you can't accidentally pass a `ContentID` — the compiler will catch it.

### 1.2 Constants

Constants are immutable values known at compile time. The project uses `const` blocks for related values:

```go
// models/types.go — Lines 43–60

// File size limits
const (
    MaxFileSize     = 100 << 20   // 100MB using bit shifting
    MinFileSize     = 1024        // 1KB minimum
    ChunkSize       = 1 << 20     // 1MB chunks for transfer
    DefaultRating   = 3.0         // Default rating for new resources
    MaxRating       = 5.0
    MinRating       = 1.0
)

// Reputation thresholds and calculations
const (
    ContributorThreshold = 50   // Score > 50 = Contributor
    NeutralThreshold     = 0    // Score 0–50 = Neutral
    LowReputation        = -100 // Minimum reputation
    UploadWeight         = 2    // Uploads count double
    DownloadWeight       = 1    // Downloads subtract
    RatingWeight         = 10   // Rating multiplier
)
```

### 1.3 Typed Constants with String Values

```go
// models/types.go — Lines 63–91

type UserClassification string  // Custom type for string constants

const (
    ClassContributor UserClassification = "Contributor"
    ClassNeutral     UserClassification = "Neutral"
    ClassLeecher     UserClassification = "Leecher"
)

type PeerStatus string

const (
    StatusOnline       PeerStatus = "online"
    StatusOffline      PeerStatus = "offline"
    StatusConnecting   PeerStatus = "connecting"
    StatusTransferring PeerStatus = "transferring"
)
```

### 1.4 Package-Level Variables

```go
// models/types.go — Lines 100–116

var AllowedFileTypes = []string{".pdf", ".doc", ".docx", ".pptx", ".xlsx", ".txt", ".md"}

var SubjectCategories = []string{
    "Mathematics", "Physics", "Chemistry", "Biology",
    "Computer Science", "Electronics", "Mechanical", "Civil",
    "Literature", "History", "Economics", "Other",
}
```

---

## 2. Looping & Control Flow

> **Files:** [`services/library_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/library_service.go), [`services/reputation_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/reputation_service.go), [`services/search_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/search_service.go)

### 2.1 Range Loop — Iterating Over Slices

The most common loop pattern. `range` gives you both index and value:

```go
// services/library_service.go — Lines 153–158

// Filter resources with at least one rating
rated := make([]*models.Resource, 0)
for _, resource := range all {          // _ ignores the index
    if resource.TotalRatings > 0 {
        rated = append(rated, resource)
    }
}
```

### 2.2 Traditional For Loop with Counter

```go
// services/library_service.go — Lines 134–138

// Traditional C-style for loop
result := make([]*models.Resource, 0, limit)
for i := 0; i < len(all) && i < limit; i++ {
    result = append(result, all[i])
}
```

### 2.3 For Loop with Compound Condition

```go
// services/library_service.go — Lines 244–252

for i := 0; i < len(all); i++ {
    resource := all[i]
    // Compound condition with &&
    if resource.TotalRatings > 0 && resource.AverageRating >= minRating {
        filtered = append(filtered, resource)
    }
}
```

### 2.4 Labeled Loop with Continue

A labeled loop allows you to `continue` to an outer loop from inside a nested block:

```go
// services/library_service.go — Lines 269–313

resourceLoop:                           // Label for the outer loop
    for _, resource := range all {
        if query != "" {
            matched := false
            if strings.Contains(strings.ToLower(resource.Title), query) {
                matched = true
            } else {
                for _, tag := range resource.Tags {
                    if strings.Contains(strings.ToLower(tag), query) {
                        matched = true
                        break           // Break inner loop
                    }
                }
            }
            if !matched {
                continue resourceLoop   // Skip to next iteration of outer loop
            }
        }
        results = append(results, resource)
    }
```

### 2.5 Switch Statement (Expression-less Form)

```go
// services/reputation_service.go — Lines 55–65

func GetClassificationForScore(score int) models.UserClassification {
    switch {                                          // No expression = switch on true
    case score > models.ContributorThreshold:
        return models.ClassContributor
    case score >= models.NeutralThreshold:
        return models.ClassNeutral
    default:
        return models.ClassLeecher
    }
}
```

### 2.6 Switch on Value

```go
// services/reputation_service.go — Lines 69–80

func GetThrottleMultiplier(classification models.UserClassification) float64 {
    switch classification {               // Switch on the value of classification
    case models.ClassContributor:
        return 1.0                        // Full speed
    case models.ClassNeutral:
        return 0.7                        // 70% speed
    case models.ClassLeecher:
        return 0.3                        // 30% speed
    default:
        return 0.5
    }
}
```

### 2.7 Loop with Accumulation (Statistics)

```go
// services/reputation_service.go — Lines 199–212

totalScore := 0
for _, user := range users {
    totalScore += int(user.Reputation)
    switch user.Classification {          // Switch inside loop for counting
    case models.ClassContributor:
        stats.Contributors++
    case models.ClassNeutral:
        stats.Neutral++
    case models.ClassLeecher:
        stats.Leechers++
    }
}
```

---

## 3. Arrays & Slices

> **Files:** [`models/resource.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/resource.go), [`models/peer.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/peer.go)

### 3.1 Fixed-Size Array

Arrays in Go have a **fixed size** that is part of the type. `[10]*Resource` is a different type from `[5]*Resource`:

```go
// models/resource.go — Lines 98–104

type TopResources struct {
    Top10  [10]*Resource `json:"top_10"`   // Fixed-size array — always 10 slots
    Recent []Resource    `json:"recent"`   // Dynamic slice — can grow
}
```

### 3.2 Slice Initialization with `make()`

Slices are dynamic and backed by arrays. Use `make(type, length, capacity)`:

```go
// models/peer.go — Lines 67–73

func NewPeerList(capacity int) *PeerList {
    return &PeerList{
        Peers:    make([]Peer, 0, capacity),  // length=0, pre-allocated capacity
        Capacity: capacity,
    }
}
```

```go
// models/resource.go — Lines 126–127  (inside NewResource)

Tags:        make([]string, 0),        // Empty slice for tags
AvailableOn: make([]PeerID, 0),        // Empty slice for peer availability
```

### 3.3 Slice Append

`append()` adds elements and grows the slice automatically:

```go
// models/resource.go — Lines 156–165

func (r *Resource) AddTag(tag string) {
    for _, existingTag := range r.Tags {  // Check duplicates first
        if existingTag == tag {
            return
        }
    }
    r.Tags = append(r.Tags, tag)          // Append creates new slice if capacity exceeded
}
```

```go
// models/peer.go — Lines 76–78

func (pl *PeerList) Add(peer Peer) {
    pl.Peers = append(pl.Peers, peer)
}
```

### 3.4 Slice Filtering (Remove Element)

Go doesn't have a built-in `remove`. You build a new slice without the unwanted element:

```go
// models/resource.go — Lines 168–177

func (r *Resource) RemoveTag(tag string) {
    newTags := make([]string, 0, len(r.Tags))   // Pre-allocate same capacity
    for _, t := range r.Tags {
        if t != tag {
            newTags = append(newTags, t)
        }
    }
    r.Tags = newTags
}
```

```go
// models/peer.go — Lines 81–89

func (pl *PeerList) Remove(peerID PeerID) {
    newPeers := make([]Peer, 0, len(pl.Peers))
    for _, p := range pl.Peers {
        if p.ID != peerID {
            newPeers = append(newPeers, p)
        }
    }
    pl.Peers = newPeers
}
```

### 3.5 Slice Slicing (Sub-slices)

```go
// services/library_service.go — Lines 114–118

if limit > len(all) {
    limit = len(all)
}
return all[:limit], nil                // Slice expression: first `limit` elements
```

```go
// services/search_service.go — Lines 179–187

func (s *SearchService) paginate(results []*models.SearchResult, page, size int) []*models.SearchResult {
    offset := (page - 1) * size
    end := offset + size
    if end > len(results) {
        end = len(results)
    }
    return results[offset:end]          // Sub-slice from offset to end
}
```

### 3.6 `len()` on Slices

```go
// models/resource.go — Lines 213–215

func (r *Resource) GetPeerCount() int {
    return len(r.AvailableOn)           // len() returns slice length
}
```

---

## 4. Maps & Structs

> **Files:** [`models/user.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/user.go), [`store/memory.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/store/memory.go), [`services/library_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/library_service.go)

### 4.1 Struct Definition with JSON Tags

Structs group related fields. JSON tags control how fields serialize:

```go
// models/user.go — Lines 22–46

type User struct {
    ID       UserID `json:"id"`          // Maps to "id" in JSON
    Username string `json:"username"`
    Email    string `json:"email"`
    Password string `json:"-"`           // "-" means EXCLUDED from JSON output

    Reputation     ReputationScore    `json:"reputation"`
    Classification UserClassification `json:"classification"`
    TotalUploads   int                `json:"total_uploads"`
    TotalDownloads int                `json:"total_downloads"`
    AverageRating  float64            `json:"average_rating"`

    CreatedAt    time.Time  `json:"created_at"`
    LastActiveAt time.Time  `json:"last_active_at"`
    PeerID       PeerID     `json:"peer_id"`
    Status       PeerStatus `json:"status"`
    IPAddress    string     `json:"ip_address"`
}
```

### 4.2 Struct Embedding (Composition)

Go uses struct embedding instead of inheritance:

```go
// models/user.go — Lines 54–62

type UserProfile struct {
    User                          // Embedded — inherits all User fields & methods
    Bio           string          `json:"bio"`
    Department    string          `json:"department"`
    University    string          `json:"university"`
    Interests     []string        `json:"interests"`
}
```

### 4.3 Struct Methods (Receiver Functions)

```go
// models/user.go — Lines 134–145

func (u *User) GetThrottleMultiplier() float64 {  // Pointer receiver
    switch u.Classification {
    case ClassContributor:
        return 1.0
    case ClassNeutral:
        return 0.7
    case ClassLeecher:
        return 0.3
    default:
        return 0.5
    }
}
```

### 4.4 Maps for Data Storage

Maps provide O(1) key-value lookups. The in-memory store uses maps as the core data structure:

```go
// store/memory.go — Lines 28–35

type MemoryStore struct {
    mu        sync.RWMutex                     // Thread-safe access
    users     map[models.UserID]*models.User           // UserID → *User
    resources map[models.ContentID]*models.Resource    // ContentID → *Resource
    emails    map[string]models.UserID                 // email → UserID
}
```

### 4.5 Map Initialization with `make()`

```go
// store/memory.go — Lines 38–44

func NewMemoryStore() *MemoryStore {
    return &MemoryStore{
        users:     make(map[models.UserID]*models.User),
        resources: make(map[models.ContentID]*models.Resource),
        emails:    make(map[string]models.UserID),
    }
}
```

### 4.6 Map Read, Write, and Check-Existence

```go
// store/memory.go (paraphrased pattern used throughout)

// WRITE: Store a value
s.users[user.ID] = user

// READ + CHECK: The "comma ok" idiom
user, exists := s.users[id]
if !exists {
    return nil, errors.ErrUserNotFound
}
return user, nil

// DELETE: Remove a key
delete(s.users, id)
```

### 4.7 Map for Aggregation

```go
// services/library_service.go — Lines 352–364

stats := &LibraryStats{
    BySubject: make(map[string]int),             // subject → count
    ByType:    make(map[models.ResourceType]int), // type → count
}

for _, resource := range all {
    stats.BySubject[resource.Subject]++           // Increment counter in map
    stats.ByType[resource.Type]++
}
```

### 4.8 Map for Deduplication

```go
// services/search_service.go — Lines 104–121

seen := make(map[string]bool)              // Track already-seen strings
for _, r := range all {
    if strings.Contains(strings.ToLower(r.Title), partial) {
        seen[r.Title] = true               // Add to set
    }
}
result := make([]string, 0, len(seen))
for s := range seen {                      // Iterate over map keys
    result = append(result, s)
}
```

---

## 5. Functions & Error Handling

> **Files:** [`errors/errors.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/errors/errors.go), [`services/user_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/user_service.go), [`services/library_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/library_service.go)

### 5.1 Multiple Return Values with Error

Go functions return results **and** an error. The caller must check:

```go
// services/user_service.go — Lines 60–74

func (s *UserService) CreateUser(username, email, password string) (*models.User, error) {
    id := models.UserID(uuid.New().String())
    user := models.NewUser(id, username, email)
    user.Password = password

    if err := s.store.Create(user); err != nil {
        return nil, errors.NewOperationError("CreateUser", "failed to store user", err)
    }
    return user, nil    // Success: return user, nil error
}
```

### 5.2 Sentinel Errors (Pre-defined Errors)

```go
// errors/errors.go (selected lines)

var (
    ErrUserNotFound    = &AppError{Code: 404, Message: "user not found"}
    ErrResourceNotFound = &AppError{Code: 404, Message: "resource not found"}
    ErrFileTooLarge    = &AppError{Code: 400, Message: "file exceeds maximum size"}
    ErrInvalidFileType = &AppError{Code: 400, Message: "file type not allowed"}
    ErrDuplicateUser   = &AppError{Code: 409, Message: "user already exists"}
)
```

### 5.3 Custom Error Types

Custom error types implement the `error` interface (`Error() string`):

```go
// errors/errors.go (selected lines)

type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Err     error  `json:"-"`
}

func (e *AppError) Error() string {     // Implements error interface
    if e.Err != nil {
        return fmt.Sprintf("[%d] %s: %v", e.Code, e.Message, e.Err)
    }
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// Specialized error constructors:
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error - %s: %s", e.Field, e.Message)
}

type ReputationError struct {
    UserID   string `json:"user_id"`
    Required int    `json:"required"`
    Current  int    `json:"current"`
    Action   string `json:"action"`
}
func (e *ReputationError) Error() string {
    return fmt.Sprintf("insufficient reputation for %s: need %d, have %d",
        e.Action, e.Required, e.Current)
}
```

### 5.4 Error Wrapping with Context

```go
// errors/errors.go

type OperationError struct {
    Operation string
    Message   string
    Err       error                      // Wraps the original error
}
func (e *OperationError) Error() string {
    return fmt.Sprintf("operation %s failed: %s (%v)", e.Operation, e.Message, e.Err)
}
func (e *OperationError) Unwrap() error {  // Allows errors.Is() and errors.As()
    return e.Err
}
```

### 5.5 Validation Functions Returning Errors

```go
// services/library_service.go — Lines 324–343

func validateResource(resource *models.Resource) error {
    if resource.Filename == "" {
        return errors.NewValidationError("filename", "filename is required")
    }
    if resource.Size <= 0 {
        return errors.NewValidationError("size", "invalid file size")
    }
    if resource.Size > models.MaxFileSize {
        return errors.ErrFileTooLarge           // Return sentinel error
    }
    if !models.IsValidFileType(resource.Extension) {
        return errors.ErrInvalidFileType
    }
    return nil                                   // nil = no error = success
}
```

### 5.6 Pure Functions

```go
// services/reputation_service.go — Lines 38–51

// Pure function: no side effects, same input → same output
func CalculateReputation(uploads, downloads int, avgRating float64) int {
    uploadScore := uploads * models.UploadWeight
    downloadPenalty := downloads * models.DownloadWeight
    ratingBonus := int(avgRating * float64(models.RatingWeight))
    score := uploadScore - downloadPenalty + ratingBonus
    if score < models.LowReputation {
        return models.LowReputation
    }
    return score
}
```

---

## 6. Interfaces

> **Files:** [`interfaces/storage.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/interfaces/storage.go), [`interfaces/reputation.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/interfaces/reputation.go), [`store/memory.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/store/memory.go)

### 6.1 Interface Definition

Interfaces define **behavior contracts** — a set of method signatures:

```go
// interfaces/storage.go — Lines 19–33

type ResourceStorage interface {
    Store(resource *models.Resource) error
    Get(id models.ContentID) (*models.Resource, error)
    GetAll() ([]*models.Resource, error)
    GetByUser(userID models.UserID) ([]*models.Resource, error)
    Update(resource *models.Resource) error
    Delete(id models.ContentID) error
}
```

```go
// interfaces/storage.go — Lines 39–52

type UserStorage interface {
    Create(user *models.User) error
    GetUser(id models.UserID) (*models.User, error)
    GetByEmail(email string) (*models.User, error)
    GetAllUsers() ([]*models.User, error)
    UpdateUser(user *models.User) error
    Delete(id models.UserID) error
    GetLeaderboard(limit int) ([]*models.User, error)
}
```

### 6.2 Implicit Interface Implementation

In Go, types implement interfaces **implicitly** — no `implements` keyword. If `MemoryStore` has all the methods defined in `ResourceStorage`, it automatically satisfies that interface:

```go
// store/memory.go — implements ResourceStorage

func (s *MemoryStore) Store(resource *models.Resource) error {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.resources[resource.ID] = resource
    return nil
}

func (s *MemoryStore) Get(id models.ContentID) (*models.Resource, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    resource, exists := s.resources[id]
    if !exists {
        return nil, errors.ErrResourceNotFound
    }
    return resource, nil
}

func (s *MemoryStore) GetAll() ([]*models.Resource, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    result := make([]*models.Resource, 0, len(s.resources))
    for _, r := range s.resources {
        result = append(result, r)
    }
    return result, nil
}
```

### 6.3 Service Interface (Reputation)

```go
// interfaces/reputation.go — Lines 16–32

type ReputationService interface {
    Calculate(userID models.UserID) (models.ReputationScore, error)
    RecalculateAll() error
    GetUserReputation(userID models.UserID) (*services.ReputationInfo, error)
    CheckAccessAllowed(userID models.UserID, requiredScore int) error
    GetThrottleSpeed(userID models.UserID) (float64, error)
    GetNetworkStats() (*services.NetworkStats, error)
}
```

### 6.4 Thread-Safety with `sync.RWMutex`

```go
// store/memory.go — Thread-safe pattern

func (s *MemoryStore) GetUser(id models.UserID) (*models.User, error) {
    s.mu.RLock()            // Read lock — multiple readers allowed
    defer s.mu.RUnlock()    // Deferred unlock ensures it runs even on error
    user, exists := s.users[id]
    if !exists {
        return nil, errors.ErrUserNotFound
    }
    return user, nil
}

func (s *MemoryStore) Create(user *models.User) error {
    s.mu.Lock()             // Write lock — exclusive access
    defer s.mu.Unlock()
    s.users[user.ID] = user
    s.emails[user.Email] = user.ID
    return nil
}
```

---

## 7. Pointers — Call by Value vs Reference

> **File:** [`services/user_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/user_service.go)

### 7.1 Call by Value (Copy)

The parameter is a **copy**. Changes do NOT affect the original:

```go
// services/user_service.go — Lines 39–44

func UpdateReputationByValue(user models.User, delta int) models.User {
    user.Reputation += models.ReputationScore(delta)  // Modifies the COPY
    user.Classification = models.GetClassification(user.Reputation)
    return user   // Must RETURN the modified copy
}
```

### 7.2 Call by Reference (Pointer)

The parameter is a **pointer** (`*User`). Changes DO affect the original:

```go
// services/user_service.go — Lines 48–53

func UpdateReputationByPointer(user *models.User, delta int) {
    user.Reputation += models.ReputationScore(delta)  // Modifies the ORIGINAL
    user.Classification = models.GetClassification(user.Reputation)
    // No return needed — original is modified through the pointer
}
```

### 7.3 Side-by-Side Comparison

```go
// services/user_service.go — Lines 171–188

func CompareValueVsPointer() {
    user := models.User{
        ID:         "test-user",
        Username:   "TestUser",
        Reputation: 0,
    }

    // CALL BY VALUE — returns a modified copy, original unchanged
    modified := UpdateReputationByValue(user, 10)
    // user.Reputation is still 0
    // modified.Reputation is 10

    // CALL BY POINTER — modifies original directly
    UpdateReputationByPointer(&user, 10)   // & takes the address
    // user.Reputation is now 10
}
```

### 7.4 Pointer Swap Functions

```go
// services/user_service.go — Lines 191–200

func SwapByValue(a, b int) {
    a, b = b, a
    // Original variables are UNCHANGED (copies only)
}

func SwapByPointer(a, b *int) {
    *a, *b = *b, *a       // * dereferences the pointer
    // Original variables ARE SWAPPED
}
```

### 7.5 Pointer Usage in Services

Every service method that modifies data uses pointer receivers and pointer parameters:

```go
// services/user_service.go — Lines 99–113

func (s *UserService) RecordUpload(userID models.UserID) error {
    user, err := s.store.GetUser(userID)  // Returns *models.User (pointer)
    if err != nil {
        return err
    }
    user.TotalUploads++                    // Modify through pointer — persists

    delta := models.UploadWeight
    UpdateReputationByPointer(user, delta) // Pass pointer — changes original

    return s.store.UpdateUser(user)
}
```

---

## 8. JSON Marshal/Unmarshal & Unit Tests

> **Files:** [`handlers/api_handler.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/handlers/api_handler.go), [`services/user_service_test.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/user_service_test.go), [`services/library_service_test.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/library_service_test.go), [`services/reputation_service_test.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/reputation_service_test.go)

### 8.1 JSON Unmarshal (Decode Request Body)

```go
// handlers/api_handler.go — CreateUser handler

func (h *APIHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {   // JSON → struct
        writeError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
        return
    }
    user, err := h.userService.CreateUser(req.Username, req.Email, req.Password)
    // ...
    writeSuccess(w, user)
}
```

### 8.2 JSON Marshal (Encode Response)

```go
// handlers/api_handler.go — Helper function

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)     // struct → JSON output
}
```

### 8.3 JSON Tags Control Serialization

```go
// models/user.go
Password string `json:"-"`              // EXCLUDED from JSON (sensitive data)
// models/user.go
Comment  string `json:"comment,omitempty"` // Omitted if empty string
```

### 8.4 Table-Driven Tests

The most idiomatic Go testing pattern — define test cases as a slice of structs:

```go
// services/user_service_test.go — Lines 32–87

func TestCalculateReputation(t *testing.T) {
    tests := []struct {
        name      string
        uploads   int
        downloads int
        avgRating float64
        expected  int
    }{
        {
            name: "zero_activity",
            uploads: 0, downloads: 0, avgRating: 0,
            expected: 0,
        },
        {
            name: "contributor",
            uploads: 50, downloads: 30, avgRating: 4.5,
            expected: 50*2 - 30 + int(4.5*10),  // 100 - 30 + 45 = 115
        },
        {
            name: "leecher",
            uploads: 5, downloads: 50, avgRating: 2.0,
            expected: 5*2 - 50 + int(2.0*10),   // 10 - 50 + 20 = -20
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {      // Subtests with t.Run
            got := CalculateReputation(tt.uploads, tt.downloads, tt.avgRating)
            if got != tt.expected {
                t.Errorf("CalculateReputation(%d, %d, %.1f) = %d; want %d",
                    tt.uploads, tt.downloads, tt.avgRating, got, tt.expected)
            }
        })
    }
}
```

### 8.5 Test Setup Function

```go
// services/user_service_test.go — Lines 22–26

func setupUserTest() (*UserService, *store.MemoryStore) {
    memStore := store.NewMemoryStore()
    userService := NewUserService(memStore)
    return userService, memStore
}
```

### 8.6 Testing Call by Value vs Pointer

```go
// services/user_service_test.go — Lines 89–119

func TestUpdateReputationByValue(t *testing.T) {
    original := models.User{ID: "test-user", Reputation: 0}
    modified := UpdateReputationByValue(original, 10)

    if original.Reputation != 0 {
        t.Errorf("Original changed, got %d, want 0", original.Reputation)
    }
    if modified.Reputation != 10 {
        t.Errorf("Modified wrong, got %d, want 10", modified.Reputation)
    }
}

func TestUpdateReputationByPointer(t *testing.T) {
    user := &models.User{ID: "test-user", Reputation: 0}
    UpdateReputationByPointer(user, 10)

    if user.Reputation != 10 {
        t.Errorf("User not modified, got %d, want 10", user.Reputation)
    }
}
```

### 8.7 Running Tests

```bash
# Run all tests
go test ./...

# Run with verbose output
go test -v ./services/

# Run a specific test
go test -run TestCalculateReputation ./services/
```

---

## Quick Reference: File → Concept Mapping

| File | Concepts |
|------|----------|
| [`models/types.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/types.go) | Variables, Types, Constants |
| [`models/user.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/user.go) | Structs, JSON Tags, Embedding, Methods |
| [`models/resource.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/resource.go) | Arrays, Slices, Append, Remove |
| [`models/peer.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/models/peer.go) | Slices, `make()`, Filtering |
| [`services/user_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/user_service.go) | Pointers, Call by Value/Reference, Functions |
| [`services/library_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/library_service.go) | Loops, Control Flow, Error Handling, Maps |
| [`services/reputation_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/reputation_service.go) | Switch, Pure Functions, Loops |
| [`services/search_service.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/search_service.go) | Maps (dedup), Slices, Sorting |
| [`store/memory.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/store/memory.go) | Maps, Interfaces (impl), Mutex |
| [`interfaces/storage.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/interfaces/storage.go) | Interface Definition |
| [`errors/errors.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/errors/errors.go) | Custom Errors, Error Interface |
| [`handlers/api_handler.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/handlers/api_handler.go) | JSON Marshal/Unmarshal, HTTP |
| [`services/*_test.go`](file:///home/yanish24/Documents/MCA/3rd_trimester/Go_Lang/p2p-library/services/user_service_test.go) | Table-Driven Tests, Subtests |
