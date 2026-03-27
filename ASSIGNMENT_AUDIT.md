# Assignment Audit — P2P Academic Library (Go)

> **Project:** The Knowledge Exchange — P2P Academic Library  
> **Stack:** Go 1.21+ (backend) · Next.js 16 / React (frontend)  
> **Audit Date:** 2026-03-27

---

## Summary Scorecard

| Criterion | Marks | Status |
|---|---|---|
| HTTP Server with efficient routing & request management | 4 | ✅ Fully implemented |
| bcrypt for credential handling | 4 | ✅ Implemented (added `golang.org/x/crypto/bcrypt`) |
| Concurrency techniques (`sync.RWMutex`, channels) | 4 | ✅ Fully implemented |
| Goroutines for asynchronous workflows | 3 | ✅ Fully implemented |
| Functional UI interacting with backend endpoints | 3 | ✅ Next.js frontend wired to Go API |
| Well-organised, readable, modular codebase | 2 | ✅ Fully demonstrated |
| Architecture design | 10 | ✅ Diagram below |
| **Total** | **30** | ✅ |

---

## 1. HTTP Server with Efficient Routing & Request Management (4 marks)

**File:** [`handlers/api_handler.go`](handlers/api_handler.go) · [`main.go`](main.go)

The server uses **gorilla/mux** for explicit, efficient path-based routing with method constraints:

```go
// main.go — server bootstrap
router := mux.NewRouter()
apiHandler.SetupRoutes(router)
c := cors.New(cors.Options{ AllowedOrigins: []string{...} })
handler := c.Handler(router)
log.Fatal(http.ListenAndServe(":"+port, handler))
```

```go
// handlers/api_handler.go — route registration
api := r.PathPrefix("/api").Subrouter()
api.HandleFunc("/auth/login",              h.Login).Methods("POST")
api.HandleFunc("/users",                   h.CreateUser).Methods("POST")
api.HandleFunc("/users/{id}",              h.GetUser).Methods("GET")
api.HandleFunc("/resources",               h.GetAllResources).Methods("GET")
api.HandleFunc("/resources",               h.CreateResource).Methods("POST")
api.HandleFunc("/resources/{id}/download", h.DownloadResource).Methods("GET","POST")
api.HandleFunc("/resources/{id}/rate",     h.RateResource).Methods("POST")
api.HandleFunc("/search",                  h.SearchResources).Methods("GET")
api.HandleFunc("/admin/users/{id}",        h.AdminDeleteUser).Methods("DELETE")
// ... 14 total endpoints
```

Each handler follows a clean **decode → validate → service call → respond** pattern using helpers:

```go
func writeSuccess(w http.ResponseWriter, data interface{}) {
    writeJSON(w, http.StatusOK, APIResponse{Success: true, Data: data})
}
func writeError(w http.ResponseWriter, status int, msg string) {
    writeJSON(w, status, APIResponse{Success: false, Error: msg})
}
```

CORS is handled centrally via `rs/cors`. Multipart file uploads are supported (`r.ParseMultipartForm(50 << 20)`). Files are served as proper `Content-Disposition: attachment` downloads with `http.ServeFile`.

---

## 2. bcrypt for Credential Handling (4 marks)

**File:** [`services/user_service.go`](services/user_service.go)  
**Dependency:** `golang.org/x/crypto/bcrypt`

Passwords are **never stored as plain text**. bcrypt is used at both creation and verification:

```go
// CreateUser — hashes the password before storage
hashed, err := bcrypt.GenerateFromPassword([]byte(password), 12) // cost = 12
user.Password = string(hashed)
```

```go
// AuthenticateUser — verifies a candidate password against the stored hash
func (s *UserService) AuthenticateUser(username, password string) (*models.User, error) {
    for _, user := range users {
        if user.Username == username {
            if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
                return nil, errors.NewOperationError("AuthenticateUser", "invalid credentials", err)
            }
            return user, nil
        }
    }
    return nil, errors.NewNotFoundError("user", username)
}
```

The `Login` handler calls `AuthenticateUser`, so all login attempts go through bcrypt verification. A cost factor of **12** (above the minimum of 10) provides strong resistance to brute-force and rainbow-table attacks.

---

## 3. Concurrency Techniques — `sync.RWMutex` & Channels (4 marks)

**File:** [`store/memory.go`](store/memory.go) · [`services/transfer_service.go`](services/transfer_service.go)

### Thread-Safe Store with `sync.RWMutex`

```go
type MemoryStore struct {
    resources map[models.ContentID]*models.Resource
    users     map[models.UserID]*models.User
    mu        sync.RWMutex   // Allows concurrent reads; blocks on writes
}

// Read — multiple goroutines can read simultaneously
func (m *MemoryStore) Get(id models.ContentID) (*models.Resource, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    ...
}

// Write — exclusive lock; all readers/writers blocked
func (m *MemoryStore) Store(resource *models.Resource) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    ...
}
```

Every read/write operation on `users`, `resources`, and `ratings` holds the appropriate lock, making the store safe for concurrent request handling.

### Unbuffered & Buffered Channels

```go
chunkQueue := make(chan int)       // unbuffered — sender blocks until receiver reads
errCh      := make(chan error, 1)  // buffered — non-blocking first error capture
```

---

## 4. Goroutines for Asynchronous Workflows (3 marks)

**File:** [`services/transfer_service.go`](services/transfer_service.go)

### Pattern 1 — Producer/Consumer with Select

```go
// GOROUTINE 1 — Producer: emits chunk indices at throttled intervals
go func() {
    ticker := time.NewTicker(interval)
    defer ticker.Stop()
    defer close(chunkQueue)
    for chunkIndex := 0; chunkIndex < totalChunks; chunkIndex++ {
        select {
        case <-ctx.Done():    // context cancellation
            errCh <- ctx.Err()
            return
        case <-ticker.C:
            chunkQueue <- chunkIndex
        }
    }
}()

// GOROUTINE 2 — Consumer: counts chunks as they arrive
go func() {
    for range chunkQueue { sent++ }
    close(done)
}()
```

### Pattern 2 — Worker Pool (Fan-Out / Fan-In) with `sync.WaitGroup`

```go
var wg sync.WaitGroup

// Fan-out: N worker goroutines all reading from one jobs channel
for w := 0; w < numWorkers; w++ {
    wg.Add(1)
    go func() {
        defer wg.Done()
        for chunkIndex := range jobs {
            // ... process chunk, write to progress channel (fan-in)
        }
    }()
}

// Collector: waits for all workers, then closes progress channel
go func() {
    wg.Wait()
    close(progress)
}()
```

### Pattern 3 — Concurrent Batch Validation

```go
// One goroutine per resource ID
for i, id := range resourceIDs {
    wg.Add(1)
    go func() {
        defer wg.Done()
        // validate and send result...
    }()
}
```

---

## 5. Functional UI Interacting with Backend Endpoints (3 marks)

**Directory:** [`frontend/src/`](frontend/src/)

The Next.js frontend interacts with **all major API endpoints**:

| UI Feature | API Endpoint |
|---|---|
| Login / Fast Access Nodes | `POST /api/auth/login` (bcrypt-verified) |
| Sign Up | `POST /api/users` |
| Dashboard / Stats | `GET /api/stats`, `GET /api/library/stats` |
| Library browser | `GET /api/resources`, `GET /api/resources/popular` |
| Search with filters | `GET /api/search?q=...&subject=...` |
| Peers view | `GET /api/peers` |
| Leaderboard | `GET /api/leaderboard` |
| File upload | `POST /api/resources` (multipart form) |
| File download | `GET /api/resources/{id}/download` |
| Rate resource | `POST /api/resources/{id}/rate` |
| Admin panel | `DELETE /api/admin/users/{id}`, `PUT /api/admin/users/{id}/role` |

Frontend is configured to call the Go backend via `NEXT_PUBLIC_API_URL=http://localhost:8080/api` set in `.env.local`.

---

## 6. Well-Organised, Readable, Modular Codebase (2 marks)

```
peer_to_peer_lib/
├── main.go               — Entry point, wiring, seeding
├── go.mod                — Module definition + dependencies
├── handlers/             — HTTP layer (request/response only)
│   └── api_handler.go
├── services/             — Business logic (pure, no HTTP)
│   ├── user_service.go
│   ├── library_service.go
│   ├── reputation_service.go
│   ├── search_service.go
│   └── transfer_service.go   ← goroutines & channels
├── models/               — Domain types (User, Resource, Rating)
├── store/                — In-memory storage with sync.RWMutex
│   └── memory.go
├── interfaces/           — Storage interface contracts
│   └── storage.go
├── errors/               — Typed, domain-specific errors
│   └── errors.go
└── frontend/             — Next.js UI (TypeScript / React)
    └── src/
        ├── app/api/      — Next.js server actions
        ├── components/   — React UI components
        └── lib/          — API client, types, auth context
```

Each package has a **single responsibility**. Services have no knowledge of HTTP; handlers have no business logic. Interfaces decouple the store from service layer (testable). Unit tests are present for `user_service`, `library_service`, and `transfer_service`.

---

## 7. Architecture Design (10 marks)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend  (Port 3000)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐  │   │
│  │  │LoginPage │ │ Library  │ │ Search  │ │  Peers   │ │ Admin  │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬────┘ └────┬─────┘ └───┬────┘  │   │
│  │       │             │            │             │           │        │   │
│  │  lib/api.ts  (fetch wrapper — BASE_URL = http://localhost:8080/api)│   │
│  └──────────────────────────────┬────────────────────────────────────┘   │
│                ▲ HTTP JSON       │ HTTP Requests                          │
└────────────────│─────────────────│────────────────────────────────────────┘
                 │                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        GO BACKEND  (Port 8080)                             │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  main.go  (bootstrap, CORS, gorilla/mux router, seed demo data)     │  │
│  └──────────────────┬───────────────────────────────────────────────────┘  │
│                     │                                                       │
│  ┌──────────────────▼───────────────────────────────────────────────────┐  │
│  │              handlers/api_handler.go  (HTTP Layer)                   │  │
│  │  POST /auth/login ──────────────────────────────────────── bcrypt ✓ │  │
│  │  GET|POST /resources, /users, /search, /peers, /stats, /admin/*     │  │
│  └──┬───────────────┬───────────────┬───────────────┬───────────────────┘  │
│     │               │               │               │                       │
│  ┌──▼───────┐ ┌─────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐               │
│  │  User    │ │  Library   │ │  Search   │ │ Reputation  │               │
│  │  Service │ │  Service   │ │  Service  │ │  Service    │               │
│  │ bcrypt   │ │upload/down │ │ full-text │ │ score calc  │               │
│  └──┬───────┘ └─────┬──────┘ └─────┬─────┘ └──────┬──────┘               │
│     │               │               │               │                       │
│  ┌──▼───────────────▼───────────────▼───────────────▼──────────────────┐  │
│  │              store/memory.go  (Storage Layer)                        │  │
│  │                                                                      │  │
│  │   sync.RWMutex ── goroutine-safe reads (RLock) & writes (Lock)      │  │
│  │                                                                      │  │
│  │   map[UserID]*User    map[ContentID]*Resource    map[string]*Rating  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │         services/transfer_service.go  (Concurrency Demo)            │  │
│  │                                                                      │  │
│  │   goroutine Producer ──chan int── goroutine Consumer                 │  │
│  │                                                                      │  │
│  │   Worker Pool (Fan-Out):                                             │  │
│  │   go worker[0] ──┐                                                   │  │
│  │   go worker[1] ──┼── jobs chan ──► progress chan ── Collector wg    │  │
│  │   go worker[2] ──┘                                                   │  │
│  │                                                                      │  │
│  │   ValidateBatch: one goroutine per resource + WaitGroup              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow — Login with bcrypt

```
Browser → POST /api/auth/login {username, password}
       → handlers/api_handler.go: Login()
       → services/user_service.go: AuthenticateUser()
           ↳ find user by username in store
           ↳ bcrypt.CompareHashAndPassword(storedHash, candidatePassword)
           ↳ returns user or error
       → JSON response {success, user, token}
```

### Data Flow — File Upload

```
Browser → POST /api/resources (multipart, X-User-ID header)
       → CreateResource()
           ↳ Parse form, extract file
           ↳ Write to ./uploads/<uuid>.ext  (disk)
           ↳ libraryService.Upload(resource)
           ↳ store.Store(resource) → mu.Lock()
       → JSON response {success, resource}
```

### Concurrency Flow — Chunked Download

```
StreamDownload(ctx, resourceID, fileSize, classification)
  ├── go Producer()  → ticker → chunkQueue (unbuffered chan)
  ├── go Consumer()  ← chunkQueue → increments sent → closes done
  └── select { <-done | <-errCh | <-ctx.Done() }
```

---

## Changes Made to Satisfy All Criteria

| Change | File | Reason |
|---|---|---|
| Added `golang.org/x/crypto/bcrypt` | `go.mod` | bcrypt was not in dependency list |
| `bcrypt.GenerateFromPassword` (cost 12) | `services/user_service.go` | Passwords were stored as plain text |
| `AuthenticateUser()` using `bcrypt.CompareHashAndPassword` | `services/user_service.go` | No secure verification existed |
| `Login()` rewritten to call `AuthenticateUser` | `handlers/api_handler.go` | Previously skipped password check entirely |

All other criteria (routing, concurrency, goroutines, UI, modular structure) were already fully implemented in the original project.
