# Go Lab Concepts — P2P Academic Library

> A comprehensive guide to all Go programming concepts implemented in this project.  
> Each concept includes its definition, where it is used, and relevant code snippets.

---

## Table of Contents

1. [Variables, Values and Types](#1-variables-values-and-types)
2. [Control Flow](#2-control-flow)
3. [Arrays and Slices](#3-arrays-and-slices)
4. [Maps and Structs](#4-maps-and-structs)
5. [Functions and Error Handling](#5-functions-and-error-handling)
6. [Interfaces](#6-interfaces)
7. [Pointers, Call by Value and Call by Reference](#7-pointers-call-by-value-and-call-by-reference)
8. [JSON Marshal and Unmarshal (with Unit Tests)](#8-json-marshal-and-unmarshal)
9. [Concurrency — Goroutines and Channels](#9-concurrency--goroutines-and-channels)

---

## 1. Variables, Values and Types

**File:** `models/types.go`

### Concept

Go is statically typed. Every variable has a type known at compile time. Go offers:

- **Basic types**: `string`, `int`, `float64`, `bool`, `byte`, `time.Time`
- **Type aliases / custom types**: Create named types from underlying types for type safety
- **Constants**: Immutable values defined at compile time with `const`
- **Package-level variables**: Variables declared outside functions, accessible across the package
- **Zero values**: Every type has a default zero value (`0`, `""`, `false`, `nil`)

### Implementation

#### Custom Types (Type Aliases)

```go
// models/types.go

// Custom types provide type safety — you can't accidentally pass a UserID where a ContentID is expected
type UserID string
type ContentID string
type PeerID string
type ReputationScore int
type Rating float64
```

#### Constants with Bit Shifting and Grouping

```go
// File size limits — using bit shifting for readability
const (
    MaxFileSize   = 100 << 20 // 100MB (bit shift: 100 * 2^20)
    MinFileSize   = 1024      // 1KB minimum
    ChunkSize     = 1 << 20   // 1MB chunks for transfer
    DefaultRating = 3.0       // float64 constant
    MaxRating     = 5.0
    MinRating     = 1.0
)

// Reputation thresholds
const (
    ContributorThreshold = 50
    NeutralThreshold     = 0
    LowReputation        = -100
    UploadWeight         = 2
    DownloadWeight       = 1
    RatingWeight         = 10
)
```

#### Typed String Constants (Enum-like Pattern)

```go
type UserClassification string

const (
    ClassContributor UserClassification = "Contributor"
    ClassNeutral     UserClassification = "Neutral"
    ClassLeecher     UserClassification = "Leecher"
)

type ResourceType string

const (
    TypePDF          ResourceType = "pdf"
    TypeDocument     ResourceType = "document"
    TypePresentation ResourceType = "presentation"
    TypeSpreadsheet  ResourceType = "spreadsheet"
    TypeOther        ResourceType = "other"
)

type PeerStatus string

const (
    StatusOnline       PeerStatus = "online"
    StatusOffline      PeerStatus = "offline"
    StatusConnecting   PeerStatus = "connecting"
    StatusTransferring PeerStatus = "transferring"
)
```

#### Package-Level Variables

```go
// Slice of allowed file types
var AllowedFileTypes = []string{".pdf", ".doc", ".docx", ".pptx", ".xlsx", ".txt", ".md"}

// Slice of subject categories
var SubjectCategories = []string{
    "Mathematics", "Physics", "Chemistry", "Biology",
    "Computer Science", "Electronics", "Mechanical",
    "Civil", "Literature", "History", "Economics", "Other",
}

// Function variable (first-class function)
var TimeNow = func() time.Time {
    return time.Now()
}
```

---

## 2. Control Flow

**Files:** `services/reputation_service.go`, `services/library_service.go`

### Concept

Go provides:

- **if / else if / else** — conditional branching
- **switch** — value-based and expression-less forms
- **for** — the only loop keyword (3 forms: traditional, while-like, range)
- **range** — iterates over slices, maps, channels, strings
- **break / continue** — with optional labels for nested loops

### Implementation

#### If-Else with Bounds Checking

```go
// services/reputation_service.go
func CalculateReputation(uploads, downloads int, avgRating float64) int {
    uploadScore := uploads * models.UploadWeight
    downloadPenalty := downloads * models.DownloadWeight
    ratingBonus := int(avgRating * float64(models.RatingWeight))

    score := uploadScore - downloadPenalty + ratingBonus

    // Bounds checking with if-else
    if score < models.LowReputation {
        return models.LowReputation
    }

    return score
}
```

#### Switch — Expression-less Form

```go
// services/reputation_service.go
func GetClassificationForScore(score int) models.UserClassification {
    switch {
    case score > models.ContributorThreshold:
        return models.ClassContributor
    case score >= models.NeutralThreshold:
        return models.ClassNeutral
    default:
        return models.ClassLeecher
    }
}
```

#### Switch — Value-based Form

```go
// services/reputation_service.go
func GetThrottleMultiplier(classification models.UserClassification) float64 {
    switch classification {
    case models.ClassContributor:
        return 1.0
    case models.ClassNeutral:
        return 0.7
    case models.ClassLeecher:
        return 0.3
    default:
        return 0.5
    }
}
```

#### For Loop — Traditional Counter

```go
// services/library_service.go
func (s *LibraryService) GetRecent(limit int) ([]*models.Resource, error) {
    all, _ := s.store.GetAll()
    sort.Slice(all, func(i, j int) bool {
        return all[i].CreatedAt.After(all[j].CreatedAt)
    })

    result := make([]*models.Resource, 0, limit)
    for i := 0; i < len(all) && i < limit; i++ {
        result = append(result, all[i])
    }
    return result, nil
}
```

#### For-Range Loop over Slices

```go
// services/library_service.go
for _, resource := range all {
    if resource.TotalRatings > 0 {
        rated = append(rated, resource)
    }
}
```

#### Continue with Labels

```go
// services/library_service.go
resourceLoop:
    for _, resource := range all {
        if query != "" {
            matched := false
            if strings.Contains(strings.ToLower(resource.Title), query) {
                matched = true
            }
            if !matched {
                continue resourceLoop // skip to next iteration using label
            }
        }
        results = append(results, resource)
    }
```

#### Compound Conditions

```go
// services/library_service.go
if resource.TotalRatings > 0 && resource.AverageRating >= minRating {
    filtered = append(filtered, resource)
}
```

---

## 3. Arrays and Slices

**Files:** `models/resource.go`, `models/peer.go`, `models/rating.go`

### Concept

- **Arrays**: Fixed-size, value types. Size is part of the type: `[10]int` ≠ `[5]int`
- **Slices**: Dynamic-size, reference types backed by arrays. Created with `make()` or literals
- **Key operations**: `append()`, `len()`, `cap()`, slice expressions (`a[1:3]`), `copy()`

### Implementation

#### Fixed-Size Array

```go
// models/resource.go — Top 10 leaderboard
type TopResources struct {
    Top10  [10]*Resource `json:"top_10"` // Fixed-size array
    Recent []Resource    `json:"recent"` // Dynamic slice
}

// models/rating.go — Star distribution
type RatingSummary struct {
    ResourceID    ContentID `json:"resource_id"`
    AverageRating float64   `json:"average_rating"`
    TotalRatings  int       `json:"total_ratings"`
    Distribution  [5]int    `json:"distribution"` // Fixed array: count of 1,2,3,4,5 stars
}
```

#### Slice Creation with make()

```go
// models/peer.go — Creating a slice with initial capacity
func NewPeerList(capacity int) *PeerList {
    return &PeerList{
        Peers:    make([]Peer, 0, capacity), // length=0, capacity=capacity
        Capacity: capacity,
    }
}

// models/resource.go — Empty slices
Tags:      make([]string, 0)    // Initialize empty slice
AvailableOn: make([]PeerID, 0)  // Initialize empty slice
```

#### Append Operation

```go
// models/resource.go
func (r *Resource) AddTag(tag string) {
    for _, existingTag := range r.Tags {
        if existingTag == tag {
            return // avoid duplicates
        }
    }
    r.Tags = append(r.Tags, tag) // append grows the slice
}
```

#### Slice Filtering (Removal)

```go
// models/resource.go
func (r *Resource) RemoveTag(tag string) {
    newTags := make([]string, 0, len(r.Tags))
    for _, t := range r.Tags {
        if t != tag {
            newTags = append(newTags, t)
        }
    }
    r.Tags = newTags
}
```

#### Slice Expressions (Slicing)

```go
// services/library_service.go
func (s *LibraryService) GetPopular(limit int) ([]*models.Resource, error) {
    all, _ := s.store.GetAll()
    sort.Slice(all, func(i, j int) bool {
        return all[i].DownloadCount > all[j].DownloadCount
    })
    if limit > len(all) {
        limit = len(all)
    }
    return all[:limit], nil // slice expression
}
```

#### Slice of Pointers and Byte Slices

```go
// models/resource.go
type SearchResults struct {
    Results []*SearchResult `json:"results"` // Slice of pointers
}

type ResourceChunk struct {
    Data []byte `json:"data"` // Byte slice for file data
}
```

---

## 4. Maps and Structs

**Files:** `models/user.go`, `models/resource.go`, `store/memory.go`

### Concept

- **Structs**: Composite types grouping related fields. Go's primary data modelling tool.
- **JSON tags**: Control serialization/deserialization behaviour
- **Struct embedding**: Composition over inheritance
- **Struct methods**: Functions associated with a type via receiver
- **Maps**: Key-value hash tables. `map[KeyType]ValueType`

### Implementation

#### Struct Definition with JSON Tags

```go
// models/user.go
type User struct {
    ID             UserID             `json:"id"`
    Username       string             `json:"username"`
    Email          string             `json:"email"`
    Password       string             `json:"-"`        // "-" excludes from JSON
    Role           string             `json:"role"`
    Reputation     ReputationScore    `json:"reputation"`
    Classification UserClassification `json:"classification"`
    TotalUploads   int                `json:"total_uploads"`
    TotalDownloads int                `json:"total_downloads"`
    AverageRating  float64            `json:"average_rating"`
    CreatedAt      time.Time          `json:"created_at"`
    LastActiveAt   time.Time          `json:"last_active_at"`
    PeerID         PeerID             `json:"peer_id"`
    Status         PeerStatus         `json:"status"`
    IPAddress      string             `json:"ip_address"`
}
```

#### Struct Embedding (Composition)

```go
// models/user.go
type UserProfile struct {
    User                    // Embedded — UserProfile "inherits" all User fields
    Bio           string   `json:"bio"`
    Department    string   `json:"department"`
    University    string   `json:"university"`
    Interests     []string `json:"interests"`
}
```

#### Struct Constructor

```go
// models/user.go
func NewUser(id UserID, username, email string) *User {
    now := TimeNow()
    return &User{
        ID:             id,
        Username:       username,
        Email:          email,
        Role:           "user",
        Reputation:     0,
        Classification: ClassNeutral,
        CreatedAt:      now,
        LastActiveAt:   now,
        Status:         StatusOffline,
    }
}
```

#### Struct Methods

```go
// models/user.go
func (u *User) IsAdmin() bool       { return u.Role == "admin" }
func (u *User) IsContributor() bool { return u.Classification == ClassContributor }
func (u *User) UpdateActivity()     { u.LastActiveAt = TimeNow() }

func (u *User) GetThrottleMultiplier() float64 {
    switch u.Classification {
    case ClassContributor: return 1.0
    case ClassNeutral:     return 0.7
    case ClassLeecher:     return 0.3
    default:               return 0.5
    }
}
```

#### Maps for In-Memory Storage

```go
// store/memory.go
type MemoryStore struct {
    resources map[models.ContentID]*models.Resource  // Map: ContentID → *Resource
    users     map[models.UserID]*models.User         // Map: UserID → *User
    ratings   map[string]*models.ResourceRating      // Map: string → *ResourceRating
    mu        sync.RWMutex                           // Mutex for thread safety
}

func NewMemoryStore() *MemoryStore {
    return &MemoryStore{
        resources: make(map[models.ContentID]*models.Resource),
        users:     make(map[models.UserID]*models.User),
        ratings:   make(map[string]*models.ResourceRating),
    }
}
```

#### Map Operations (Lookup, Insert, Delete, Iterate)

```go
// store/memory.go

// Lookup with comma-ok idiom
resource, exists := m.resources[resource.ID]
if !exists {
    return nil, errors.NewNotFoundError("resource", string(id))
}

// Insert
m.resources[resource.ID] = resource

// Delete
delete(m.resources, id)

// Iterate
for _, resource := range m.resources {
    result = append(result, resource)
}
```

#### Maps for Aggregation

```go
// services/library_service.go
type LibraryStats struct {
    BySubject map[string]int              `json:"by_subject"`
    ByType    map[models.ResourceType]int `json:"by_type"`
}

for _, resource := range all {
    stats.BySubject[resource.Subject]++
    stats.ByType[resource.Type]++
}
```

---

## 5. Functions and Error Handling

**Files:** `errors/errors.go`, `services/user_service.go`, `services/library_service.go`

### Concept

- **Multiple return values**: Idiomatic `(value, error)` pattern
- **Sentinel errors**: Predefined error values (`var ErrNotFound = ...`)
- **Custom error types**: Structs implementing `error` interface
- **Error wrapping**: `Unwrap()` method for error chains
- **Type assertions**: Check error type at runtime
- **`defer`**: Execute cleanup code when function returns
- **First-class functions**: Functions as values and arguments

### Implementation

#### Sentinel Errors

```go
// errors/errors.go
var (
    ErrNotFound         = fmt.Errorf("resource not found")
    ErrUserNotFound     = fmt.Errorf("user not found")
    ErrAlreadyExists    = fmt.Errorf("resource already exists")
    ErrInvalidRating    = fmt.Errorf("rating must be between 1 and 5")
    ErrInvalidFileType  = fmt.Errorf("file type not allowed")
    ErrFileTooLarge     = fmt.Errorf("file exceeds maximum size")
    ErrUnauthorized     = fmt.Errorf("unauthorized access")
    ErrConnectionFailed = fmt.Errorf("peer connection failed")
)
```

#### Custom Error Types (Implementing error Interface)

```go
// errors/errors.go
type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
}

type NotFoundError struct {
    ResourceType string
    Identifier   string
}

func (e NotFoundError) Error() string {
    return fmt.Sprintf("%s with identifier '%s' not found", e.ResourceType, e.Identifier)
}

type OperationError struct {
    Operation string
    Reason    string
    Err       error // Wrapped error
}

func (e OperationError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("operation '%s' failed: %s (caused by: %v)", e.Operation, e.Reason, e.Err)
    }
    return fmt.Sprintf("operation '%s' failed: %s", e.Operation, e.Reason)
}

// Unwrap enables errors.Is() / errors.As() on the chain
func (e OperationError) Unwrap() error {
    return e.Err
}
```

#### Multiple Return Values (value, error)

```go
// services/user_service.go
func (s *UserService) CreateUser(username, email, password string) (*models.User, error) {
    id := models.UserID(uuid.New().String())
    user := models.NewUser(id, username, email)
    user.Password = password

    if err := s.store.Create(user); err != nil {
        return nil, errors.NewOperationError("CreateUser", "failed to store user", err)
    }
    return user, nil
}
```

#### Error Type Assertions

```go
// errors/errors.go
func IsNotFound(err error) bool {
    _, ok := err.(NotFoundError) // type assertion
    if ok {
        return true
    }
    return err == ErrNotFound || err == ErrUserNotFound || err == ErrResourceNotFound
}

func IsValidationError(err error) bool {
    _, ok := err.(ValidationError)
    return ok
}
```

#### Defer for Cleanup

```go
// store/memory.go
func (m *MemoryStore) Store(resource *models.Resource) error {
    m.mu.Lock()
    defer m.mu.Unlock() // always unlocks, even on panic

    m.resources[resource.ID] = resource
    return nil
}
```

#### First-Class Functions (Sort Callback)

```go
// services/library_service.go
sort.Slice(all, func(i, j int) bool {
    return all[i].DownloadCount > all[j].DownloadCount
})
```

---

## 6. Interfaces

**Files:** `interfaces/storage.go`, `interfaces/reputation.go`

### Concept

- **Interface**: A set of method signatures. Any type that implements all methods satisfies the interface.
- **Implicit implementation**: No `implements` keyword — satisfaction is structural.
- **Interface composition**: Combine smaller interfaces into larger ones.
- **Standard library interfaces**: `error` interface (`Error() string`).

### Implementation

#### Storage Interfaces

```go
// interfaces/storage.go
type ResourceStorage interface {
    Store(resource *models.Resource) error
    Get(id models.ContentID) (*models.Resource, error)
    Update(resource *models.Resource) error
    Delete(id models.ContentID) error
    GetAll() ([]*models.Resource, error)
    Search(query string) ([]*models.Resource, error)
    GetByUser(userID models.UserID) ([]*models.Resource, error)
}

type UserStorage interface {
    Create(user *models.User) error
    Get(id models.UserID) (*models.User, error)
    GetByEmail(email string) (*models.User, error)
    Update(user *models.User) error
    Delete(id models.UserID) error
    GetAll() ([]*models.User, error)
    GetLeaderboard(limit int) ([]*models.User, error)
}

type RatingStorage interface {
    Create(rating *models.ResourceRating) error
    Get(id string) (*models.ResourceRating, error)
    GetByResource(resourceID models.ContentID) ([]*models.ResourceRating, error)
    GetByUser(userID models.UserID) ([]*models.ResourceRating, error)
    Update(rating *models.ResourceRating) error
    Delete(id string) error
}
```

#### Service Interfaces

```go
// interfaces/reputation.go
type ReputationService interface {
    Calculate(userID models.UserID) (models.ReputationScore, error)
    UpdateOnUpload(userID models.UserID) error
    UpdateOnDownload(userID models.UserID) error
    UpdateOnRating(userID models.UserID, rating models.Rating) error
    GetClassification(userID models.UserID) (models.UserClassification, error)
    GetThrottleSpeed(userID models.UserID) (float64, error)
    GetStats(userID models.UserID) (*models.UserStats, error)
}

type LibraryService interface {
    Upload(resource *models.Resource) error
    Download(resourceID models.ContentID, userID models.UserID) (*models.Resource, error)
    Rate(resourceID models.ContentID, userID models.UserID, rating models.Rating, comment string) error
    GetResource(resourceID models.ContentID) (*models.Resource, error)
    GetUserLibrary(userID models.UserID) ([]*models.Resource, error)
    GetPopular(limit int) ([]*models.Resource, error)
    GetRecent(limit int) ([]*models.Resource, error)
}
```

#### Implicit Interface Implementation

```go
// store/memory.go
// MemoryStore implements ResourceStorage, UserStorage, and RatingStorage
// WITHOUT any "implements" declaration — just by having the right methods.

type MemoryStore struct {
    resources map[models.ContentID]*models.Resource
    users     map[models.UserID]*models.User
    ratings   map[string]*models.ResourceRating
    mu        sync.RWMutex
}

func (m *MemoryStore) Store(resource *models.Resource) error { /* ... */ }
func (m *MemoryStore) Get(id models.ContentID) (*models.Resource, error) { /* ... */ }
// ... all other interface methods
```

#### Implementing the `error` Interface

```go
// errors/errors.go
// Any type with an Error() string method satisfies the built-in error interface
type ReputationError struct {
    UserID   string
    Required int
    Current  int
    Action   string
}

func (e ReputationError) Error() string {
    return fmt.Sprintf("user '%s' has insufficient reputation for '%s': required %d, current %d",
        e.UserID, e.Action, e.Required, e.Current)
}
```

---

## 7. Pointers, Call by Value and Call by Reference

**File:** `services/user_service.go`

### Concept

- **Pointer**: A variable that holds the memory address of another variable (`*T`)
- **Address-of operator**: `&x` gets the address of `x`
- **Dereference operator**: `*p` accesses the value at pointer `p`
- **Call by value**: Function receives a copy — modifications don't affect the original
- **Call by reference (pointer)**: Function receives a pointer — modifications affect the original
- **Pointer receivers**: Methods that can modify the receiver struct

### Implementation

#### Call by Value — Original NOT Modified

```go
// services/user_service.go
func UpdateReputationByValue(user models.User, delta int) models.User {
    // `user` is a COPY of the original
    user.Reputation += models.ReputationScore(delta)
    user.Classification = models.GetClassification(user.Reputation)
    return user // must return modified copy
}
```

#### Call by Reference (Pointer) — Original IS Modified

```go
// services/user_service.go
func UpdateReputationByPointer(user *models.User, delta int) {
    // `user` is a POINTER — changes affect the original
    user.Reputation += models.ReputationScore(delta)
    user.Classification = models.GetClassification(user.Reputation)
    // No return needed
}
```

#### Side-by-Side Comparison

```go
// services/user_service.go
func CompareValueVsPointer() {
    user := models.User{ID: "test-user", Username: "TestUser", Reputation: 0}

    // Call by value — original unchanged
    modified := UpdateReputationByValue(user, 10)
    // user.Reputation == 0 (unchanged)
    // modified.Reputation == 10

    // Call by pointer — original modified
    UpdateReputationByPointer(&user, 10)
    // user.Reputation == 10 (modified!)
}
```

#### Swap Functions — Classic Demo

```go
// services/user_service.go

// By value: originals NOT swapped
func SwapByValue(a, b int) {
    a, b = b, a // only local copies are swapped
}

// By pointer: originals ARE swapped
func SwapByPointer(a, b *int) {
    *a, *b = *b, *a // dereference and swap
}
```

#### Pointer Receivers on Methods

```go
// models/user.go
func (u *User) UpdateActivity() {
    u.LastActiveAt = TimeNow() // modifies the original User
}

// models/resource.go
func (r *Resource) AddTag(tag string) {
    r.Tags = append(r.Tags, tag) // modifies the original Resource
}
```

#### Constructors Returning Pointers

```go
// models/user.go
func NewUser(id UserID, username, email string) *User {
    return &User{  // &User{...} creates a User and returns its pointer
        ID:       id,
        Username: username,
        Email:    email,
    }
}
```

#### Unit Tests Proving the Difference

```go
// services/user_service_test.go
func TestUpdateReputationByValue(t *testing.T) {
    original := models.User{ID: "test-user", Reputation: 0}
    modified := UpdateReputationByValue(original, 10)

    if original.Reputation != 0 {
        t.Errorf("Original changed! got %d, want 0", original.Reputation)
    }
    if modified.Reputation != 10 {
        t.Errorf("Modified wrong, got %d, want 10", modified.Reputation)
    }
}

func TestUpdateReputationByPointer(t *testing.T) {
    user := &models.User{ID: "test-user", Reputation: 0}
    UpdateReputationByPointer(user, 10)

    if user.Reputation != 10 {
        t.Errorf("User not modified! got %d, want 10", user.Reputation)
    }
}
```

---

## 8. JSON Marshal and Unmarshal

**Files:** `models/json_codec.go`, `models/json_codec_test.go`

### Concept

- **Marshal** (`json.Marshal`): Convert a Go struct → JSON bytes
- **Unmarshal** (`json.Unmarshal`): Convert JSON bytes → Go struct
- **JSON tags**: Control field names, omission, and exclusion (`json:"-"`, `json:",omitempty"`)
- **Round-trip**: Marshal then Unmarshal to verify data integrity

### Implementation

#### Marshal Functions

```go
// models/json_codec.go
func ResourceToJSON(resource *Resource) ([]byte, error) {
    if resource == nil {
        return nil, ErrNilResource // guard against nil
    }
    return json.Marshal(resource) // struct → JSON bytes
}

func UserToJSON(user *User) ([]byte, error) {
    if user == nil {
        return nil, ErrNilUser
    }
    return json.Marshal(user)
}
```

#### Unmarshal Functions

```go
// models/json_codec.go
func ResourceFromJSON(data []byte) (*Resource, error) {
    var resource Resource
    if err := json.Unmarshal(data, &resource); err != nil {
        return nil, err // returns unmarshal error
    }
    return &resource, nil
}

func UserFromJSON(data []byte) (*User, error) {
    var user User
    if err := json.Unmarshal(data, &user); err != nil {
        return nil, err
    }
    return &user, nil
}
```

#### JSON Tags in Structs

```go
// models/user.go
type User struct {
    ID       UserID `json:"id"`        // maps to "id" in JSON
    Username string `json:"username"`  // maps to "username"
    Password string `json:"-"`         // EXCLUDED from JSON output
    Email    string `json:"email"`
}

// models/rating.go
type RatingRequest struct {
    Rating  Rating `json:"rating"`
    Comment string `json:"comment,omitempty"` // omitted if empty
}
```

#### Sentinel Errors for Nil Guards

```go
// models/json_errors.go
var (
    ErrNilResource = errors.New("resource is nil")
    ErrNilUser     = errors.New("user is nil")
)
```

### Unit Tests

```go
// models/json_codec_test.go

// Test 1: Resource round-trip (marshal → unmarshal → verify)
func TestResourceJSONRoundTrip(t *testing.T) {
    resource := NewResource("distributed_systems.pdf", 2*ChunkSize, UserID("user-1"))
    resource.Title = "Distributed Systems"
    resource.Tags = []string{"p2p", "systems"}

    data, err := ResourceToJSON(resource)
    if err != nil { t.Fatalf("marshal failed: %v", err) }

    decoded, err := ResourceFromJSON(data)
    if err != nil { t.Fatalf("unmarshal failed: %v", err) }

    if decoded.ID != resource.ID { t.Fatalf("ID mismatch") }
    if decoded.Title != resource.Title { t.Fatalf("Title mismatch") }
    if len(decoded.Tags) != len(resource.Tags) { t.Fatalf("Tags length mismatch") }
}

// Test 2: Password excluded from JSON (json:"-" tag)
func TestUserJSONRoundTripAndPasswordOmitted(t *testing.T) {
    user := NewUser(UserID("user-2"), "alice", "alice@uni.edu")
    user.Password = "super-secret"

    data, _ := UserToJSON(user)

    if strings.Contains(string(data), "super-secret") {
        t.Fatalf("password should not appear in JSON")
    }

    decoded, _ := UserFromJSON(data)
    if decoded.Password != "" {
        t.Fatalf("password should be empty after unmarshal")
    }
}

// Test 3: Invalid JSON input
func TestResourceFromJSONInvalidInput(t *testing.T) {
    _, err := ResourceFromJSON([]byte(`{"id":`))
    if err == nil { t.Fatalf("expected error for invalid JSON") }
}

// Test 4: Nil guard errors
func TestJSONNilGuards(t *testing.T) {
    _, err := ResourceToJSON(nil)
    if err == nil { t.Fatalf("expected error for nil resource") }

    _, err = UserToJSON(nil)
    if err == nil { t.Fatalf("expected error for nil user") }
}
```

---

## 9. Concurrency — Goroutines and Channels

**Files:** `services/transfer_service.go`, `store/memory.go`

### Concept

- **Goroutines**: Lightweight threads launched with `go func() { ... }()`
- **Channels**: Typed conduits for goroutine communication
  - **Unbuffered** (`make(chan int)`): Sender blocks until receiver is ready
  - **Buffered** (`make(chan int, 10)`): Sender blocks only when buffer is full
  - **Directional** (`<-chan` receive-only, `chan<-` send-only)
- **Select**: Wait on multiple channel operations
- **sync.WaitGroup**: Coordinate completion of multiple goroutines
- **sync.RWMutex**: Read-write lock for thread-safe shared state
- **context.Context**: Cancellation and timeout propagation
- **Worker Pool**: Fan-out/fan-in pattern for parallel processing

### Implementation

#### Goroutines + Unbuffered Channel + Select (Producer/Consumer)

```go
// services/transfer_service.go — StreamDownload
func (s *TransferService) StreamDownload(ctx context.Context, ...) (*TransferResult, error) {
    chunkQueue := make(chan int)       // UNBUFFERED: synchronous handoff
    done := make(chan struct{})        // Signal channel (zero-byte struct)
    errCh := make(chan error, 1)       // BUFFERED (capacity 1): non-blocking first send

    // GOROUTINE 1 — Producer
    go func() {
        ticker := time.NewTicker(interval)
        defer ticker.Stop()
        defer close(chunkQueue) // closing signals consumer to stop

        for chunkIndex := 0; chunkIndex < totalChunks; chunkIndex++ {
            select {                   // SELECT: wait on whichever is ready
            case <-ctx.Done():
                errCh <- ctx.Err()
                return
            case <-ticker.C:
                chunkQueue <- chunkIndex // blocks until consumer reads
            }
        }
    }()

    // GOROUTINE 2 — Consumer
    sent := 0
    go func() {
        for range chunkQueue { // range loops until channel closes
            sent++
        }
        close(done)
    }()

    // Main goroutine waits
    select {
    case <-ctx.Done(): return nil, ctx.Err()
    case err := <-errCh: return nil, err
    case <-done: return &TransferResult{SentChunks: sent}, nil
    }
}
```

#### Worker Pool Pattern (Fan-Out / Fan-In) + WaitGroup

```go
// services/transfer_service.go — StreamDownloadWithWorkers

//   jobs channel ──► worker 1 ──┐
//                ──► worker 2 ──┼──► results channel
//                ──► worker 3 ──┘

func (s *TransferService) StreamDownloadWithWorkers(
    ctx context.Context, ..., numWorkers int,
) (*TransferResult, <-chan ChunkProgress, error) {

    jobs := make(chan int, totalChunks)              // BUFFERED jobs channel
    progress := make(chan ChunkProgress, totalChunks) // BUFFERED progress channel

    var wg sync.WaitGroup // WAITGROUP: tracks worker completion

    // FAN-OUT: launch N workers reading from same channel
    for w := 0; w < numWorkers; w++ {
        wg.Add(1)
        workerID := w
        go func() {
            defer wg.Done()
            for chunkIndex := range jobs { // each worker pulls from jobs
                select {
                case <-ctx.Done():
                    progress <- ChunkProgress{ChunkIndex: chunkIndex, Status: "failed"}
                    return
                case <-time.After(delay):
                    // FAN-IN: all workers write to same progress channel
                    progress <- ChunkProgress{ChunkIndex: chunkIndex, WorkerID: workerID, Status: "sent"}
                }
            }
        }()
    }

    // Producer goroutine
    go func() {
        for i := 0; i < totalChunks; i++ {
            jobs <- i
        }
        close(jobs) // no more jobs
    }()

    // Collector: wait for workers, then close progress
    go func() {
        wg.Wait()
        close(progress)
    }()

    // Drain results
    sentCount := 0
    for p := range progress {
        if p.Status == "sent" { sentCount++ }
    }

    return &TransferResult{SentChunks: sentCount}, nil, nil
}
```

#### Concurrent Batch Processing

```go
// services/transfer_service.go — ValidateBatch
func (s *TransferService) ValidateBatch(ctx context.Context, resourceIDs []models.ContentID) []BatchResult {
    resultsCh := make(chan BatchResult, len(resourceIDs)) // buffered
    var wg sync.WaitGroup

    // One goroutine per resource
    for i, id := range resourceIDs {
        wg.Add(1)
        go func() {
            defer wg.Done()
            valid := string(resID) != ""
            resultsCh <- BatchResult{ResourceID: resID, Valid: valid, WorkerID: workerID}
        }()
    }

    go func() { wg.Wait(); close(resultsCh) }()

    results := make([]BatchResult, 0, len(resourceIDs))
    for r := range resultsCh { results = append(results, r) }
    return results
}
```

#### sync.RWMutex for Thread-Safe Maps

```go
// store/memory.go
type MemoryStore struct {
    resources map[models.ContentID]*models.Resource
    mu        sync.RWMutex // Read-Write Mutex
}

func (m *MemoryStore) Get(id models.ContentID) (*models.Resource, error) {
    m.mu.RLock()           // Multiple goroutines can read simultaneously
    defer m.mu.RUnlock()
    // ...
}

func (m *MemoryStore) Store(resource *models.Resource) error {
    m.mu.Lock()            // Only one goroutine can write at a time
    defer m.mu.Unlock()
    // ...
}
```

### Unit Tests for Concurrency

```go
// services/transfer_service_test.go

func TestWorkerPoolCompletesAllChunks(t *testing.T)   { /* 3 workers, 5 chunks → all sent */ }
func TestWorkerPoolWithSingleWorker(t *testing.T)     { /* 1 worker processes all chunks */ }
func TestWorkerPoolContextCancellation(t *testing.T)   { /* cancelled context → incomplete */ }
func TestValidateBatchAllValid(t *testing.T)           { /* 4 IDs → all valid */ }
func TestValidateBatchWithEmptyID(t *testing.T)        { /* "" ID → marked invalid */ }
func TestValidateBatchConcurrentExecution(t *testing.T) { /* 20 items in < 15ms proves concurrency */ }
```

---

## Running All Tests

```bash
cd peer_to_peer_lib
go test ./...
```

Expected output:

```
ok  p2p-library/models    ~1.4s
ok  p2p-library/services  ~2.1s
```

---

## Project File Map

| Concept | Primary File(s) |
|---|---|
| Variables, Values, Types | `models/types.go` |
| Control Flow | `services/reputation_service.go`, `services/library_service.go` |
| Arrays and Slices | `models/resource.go`, `models/peer.go`, `models/rating.go` |
| Maps and Structs | `models/user.go`, `store/memory.go`, `services/library_service.go` |
| Functions and Error Handling | `errors/errors.go`, `services/user_service.go` |
| Interfaces | `interfaces/storage.go`, `interfaces/reputation.go` |
| Pointers, Call by Value/Ref | `services/user_service.go` |
| JSON Marshal/Unmarshal | `models/json_codec.go`, `models/json_codec_test.go` |
| Concurrency | `services/transfer_service.go`, `store/memory.go` |
