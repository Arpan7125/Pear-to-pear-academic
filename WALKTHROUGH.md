# The Knowledge Exchange — Complete Project Walkthrough

> **A Peer-to-Peer Academic Library** — a full-stack decentralized resource-sharing platform built with **Go** (backend) and **Next.js 16 + React 19** (frontend).

---

## 1. What This Project Is

This is a **two-phase** educational project that simulates a university peer-to-peer file-sharing network. Students upload academic resources (PDFs, slides, assignments), download from each other, rate content, and earn reputation scores that govern their download speed.

| | Phase 1 — Core Logic (CLI) | Phase 2 — Full-Stack Web App |
|---|---|---|
| **Location** | `cmd/main.go` + `models/` | `peer_to_peer_lib/` |
| **Purpose** | Demonstrate Go fundamentals via a CLI demo | Production-style REST API + SPA frontend |
| **Runtime** | Runs once, prints to console | Long-running HTTP server + React dev server |

---

## 2. High-Level Architecture

```
┌──────────────────────────┐          ┌────────────────────────────┐
│    Next.js Frontend      │  HTTP    │       Go Backend           │
│    localhost:3000         │ ◄──────► │       localhost:8080       │
│                          │  /api/*  │                            │
│  Pages:                  │          │  Services:                 │
│  • Dashboard (home)      │          │  • UserService             │
│  • Library               │          │  • LibraryService          │
│  • Search                │          │  • ReputationService       │
│  • Peers                 │          │  • SearchService           │
│  • Leaderboard           │          │  • TransferService         │
│  • Analytics             │          │                            │
│  • My Files              │          │  Storage:                  │
│  • Upload                │          │  • MemoryStore (in-RAM)    │
│  • Admin panel           │          │                            │
└──────────────────────────┘          └────────────────────────────┘
```

The frontend proxies API requests to the backend via Next.js rewrites (`/api/*` → `http://localhost:8080/api/*`).

---

## 3. Phase 1 — Core Logic (`cmd/` + `models/`)

**Entry point:** `cmd/main.go`

This phase is a standalone CLI program that demonstrates fundamental Go concepts using the academic library domain. No HTTP server — it creates sample data and prints results to the terminal.

### 3.1 Data Models (`models/`)

#### `student.go` — The Peer/User
- Struct with fields: `ID`, `Name`, `Email`, `ReputationScore`, `IsLeecher`, `IsOnline`, `FilesShared`, `FilesDownloaded`, timestamps.
- **Constants**: `MinReputation` (3.0), `MaxReputation` (5.0), `DefaultReputation` (3.5), `LeecherThreshold` (2.0).
- **Key methods**: `CanDownload()` (checks reputation >= 3.0), `UpdateReputation()` (clamps score and toggles leecher flag), `GetContributionRatio()` (shared/downloaded).
- Uses both **value receivers** (read-only methods like `String()`) and **pointer receivers** (mutating methods like `UpdateReputation()`).

#### `academicFile.go` — The Shared Resource
- Struct with fields: `CID` (SHA-256 content ID), `FileName`, `OwnerID`, `Size`, `Category`, `Tags` (slice), `Description`, `Subject`, `Downloads`, `AverageRating`.
- **CID generation**: hashes `filename:ownerID:size:timestamp` with SHA-256.
- **Categories**: notes, textbook, slides, assignment, research, other.
- **Key methods**: `HasTag()`, `AddTag()` (enforces max 10), `MatchesSearch()` (multi-field text search), `GetFormattedSize()` (human-readable bytes).

#### `rating.go` — The Rating System
- `Rating` struct: `ID`, `RaterID`, `RateeID`, `FileID`, `Score` (1.0–5.0), `Comment`, `CreatedAt`.
- `RatingCollection` wraps a `[]Rating` slice and provides aggregation: `GetAverageScore()`, `CountPositiveRatings()`, `GetScoreDistribution()`, `CalculateStudentReputation()`.
- Self-rating prevention (`RaterID != RateeID`).

#### `registry.go` — Thread-Safe Registries
- **`PeerRegistry`**: `map[string]Student` protected by `sync.RWMutex`. O(1) add/get/remove. Provides `GetOnlinePeers()`, `GetLeecherPeers()`, `GetTopContributors(limit)`, `SearchByName()`.
- **`FileIndex`**: `map[string]AcademicFile` with same mutex pattern. CID-based lookups. Provides `GetByOwner()`, `GetByCategory()`, `Search()`, `SearchByTags()`, `GetMostDownloaded()`, `GetTopRated()`, `GetCategoryStats()`.

### 3.2 What `main.go` Does
1. Creates 5 sample students with varying reputations (one is a leecher at 1.5).
2. Creates 5 academic files across different categories with tags.
3. Adds them all to the registries.
4. Simulates downloads and ratings.
5. Demonstrates:
   - **For-range loops** iterating over all peers.
   - **If/else** checking download permission.
   - **Leecher detection** via registry filtering.
   - **Search** by keyword ("algorithms").
   - **Category statistics** via map aggregation.
   - **Rating aggregation** (average, positive count).

### 3.3 Go Concepts Demonstrated (Phase 1)
| Concept | Where |
|---------|-------|
| Type inference (`:=`) | All `student := NewStudent(...)` declarations |
| Structs & methods | `Student`, `AcademicFile`, `Rating` |
| Pointer vs value receivers | `*Student.UpdateReputation()` vs `Student.String()` |
| Maps for O(1) lookup | `PeerRegistry.peers`, `FileIndex.files` |
| Slices | `Tags []string`, `GetAll()` returns `[]Student` |
| `sync.RWMutex` | All registry operations |
| Multiple return values | `Get(id)` returns `(Student, error)` |
| Custom types | `FileCategory string` |
| SHA-256 hashing | CID generation in `academicFile.go` |

---

## 4. Phase 2 — Full-Stack Web App (`peer_to_peer_lib/`)

This is the complete application with an HTTP API backend and a rich React frontend.

### 4.1 Backend Architecture

#### Entry Point: `main.go`
```
main() →
  1. Create MemoryStore (in-memory database)
  2. Create services (UserService, LibraryService, ReputationService, SearchService)
  3. Seed 5 demo users + 15 academic resources
  4. Recalculate all reputations
  5. Wire up APIHandler with gorilla/mux router
  6. Enable CORS (ports 3000, 5173, 8080)
  7. Listen on :8080
```

#### Type System (`models/types.go`)
Custom types provide **type safety** throughout the codebase:
- `UserID`, `ContentID`, `PeerID` — all `string` aliases but type-distinct.
- `ReputationScore` (`int`), `Rating` (`float64`).
- `UserClassification`: Contributor / Neutral / Leecher.
- `PeerStatus`: online / offline / connecting / transferring.
- Constants for file limits (`MaxFileSize = 100MB`), reputation thresholds, scoring weights.

#### Data Models (`models/`)
| File | What it defines |
|------|----------------|
| `user.go` | `User` struct (ID, username, email, reputation, classification, upload/download counts, peer info, timestamps). Also `UserProfile` (embedded struct example) and `UserStats`. |
| `resource.go` | `Resource` struct (CID, filename, metadata, tags slice, peer availability list, ratings, download count). Also `ResourceChunk` (for P2P transfer), `SearchResult`, `SearchResults`, `TopResources` (fixed-size `[10]*Resource` array). |
| `rating.go` | `ResourceRating` struct for per-resource ratings. |
| `peer.go` | `PeerInfo` for network peer data (IP, port, latency, bandwidth). |
| `json_codec.go` | Custom JSON marshaling/unmarshaling helpers. |
| `validation_errors.go` / `json_errors.go` | Structured error types for validation and JSON parsing. |

#### Storage Layer (`store/memory.go`)
`MemoryStore` is a single struct implementing **three interfaces** simultaneously:
- `ResourceStorage` — CRUD + search for resources.
- `UserStorage` — CRUD + leaderboard for users.
- `RatingStorage` — CRUD + aggregation for ratings.

Uses `map` collections with `sync.RWMutex` for thread safety. Demonstrates that Go interfaces are **implicitly satisfied** — no `implements` keyword.

#### Interfaces (`interfaces/`)
- `storage.go` — Defines `ResourceStorage`, `UserStorage`, `RatingStorage` interfaces.
- `reputation.go` — Defines `ReputationCalculator` interface.

This is the **abstraction layer** that decouples services from the concrete `MemoryStore`. You could swap in a PostgreSQL store without changing any service code.

#### Error Handling (`errors/errors.go`)
Demonstrates three Go error patterns:
1. **Sentinel errors**: `var ErrNotFound = fmt.Errorf("resource not found")` — pre-defined, comparable with `==`.
2. **Custom error types**: `ValidationError{Field, Message}` — implements `error` interface with `Error() string`.
3. **Error wrapping**: `OperationError` wraps an underlying cause with context.

Also includes `NotFoundError`, `TransferError`, and helper functions like `IsNotFound(err)` for type assertion.

#### Services (`services/`)

| Service | Responsibility | Key Go Concepts |
|---------|---------------|-----------------|
| **UserService** | Create users, record uploads/downloads, look up by ID/email, leaderboard | Pointers, call-by-reference, error handling |
| **LibraryService** | Upload/download resources, list popular/recent, filter by subject | For loops, range, slice operations (append, filter, sort), switch statements |
| **ReputationService** | Calculate reputation score, classify users, determine throttle speed | Reputation formula: `(Uploads×2) - Downloads + (AvgRating×10)`. Switch for classification. |
| **SearchService** | Full-text search across title/description/subject/tags, filtering, sorting, pagination | String matching, relevance scoring, slice sorting |
| **TransferService** | Simulate P2P file chunking and transfer | Resource chunks, peer availability |

**Reputation system in detail:**
| Classification | Score Range | Download Speed |
|---|---|---|
| Contributor | > 50 | 100% |
| Neutral | 0 – 50 | 70% |
| Leecher | < 0 | 30% |

#### API Layer (`handlers/api_handler.go`)
602 lines of HTTP handlers using `gorilla/mux`. Every response wraps in `APIResponse{Success, Data, Error}`.

| Method | Endpoint | Handler |
|--------|----------|---------|
| POST | `/api/auth/login` | Authenticate by username |
| GET/POST | `/api/users` | List all / Create user |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/users/:id/reputation` | Get reputation detail |
| GET/POST | `/api/resources` | List all / Upload resource |
| GET | `/api/resources/popular` | Top by downloads |
| GET | `/api/resources/recent` | Newest uploads |
| POST | `/api/resources/:id/download` | Download (increments counter) |
| POST | `/api/resources/:id/rate` | Rate (1–5 stars) |
| GET | `/api/search?q=...` | Full-text search with filters |
| GET | `/api/search/suggestions?q=...` | Autocomplete suggestions |
| GET | `/api/leaderboard` | Top users by reputation |
| GET | `/api/stats` | Network statistics |
| GET | `/api/library/stats` | Library statistics |
| GET | `/api/peers` | Connected peers list |
| GET | `/api/admin/users` | Admin user management |
| GET | `/api/admin/resources` | Admin resource management |
| GET | `/api/admin/stats` | Admin dashboard stats |

#### Testing (`services/*_test.go`, `models/json_codec_test.go`)
Unit tests for all services and the JSON codec. Run with:
```bash
cd peer_to_peer_lib && go test ./...
```

---

### 4.2 Frontend Architecture

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Recharts, Lucide icons.

#### App Structure (`frontend/src/app/`)
Uses Next.js **App Router** with file-based routing. Every page is a client component (`'use client'`).

| Route | Page | What It Shows |
|-------|------|---------------|
| `/` | Dashboard | Stat cards (users, files, downloads, avg rating), popular resources grid, recent uploads, subject distribution pie chart |
| `/library` | Library | Browse all resources with search/filter |
| `/search` | Search | Full-text search with filters (subject, type, min rating) + autocomplete suggestions |
| `/my-files` | My Files | Resources uploaded by the logged-in user |
| `/upload` | Upload | Form to create a new resource |
| `/peers` | Peers | View all connected peers with status indicators |
| `/leaderboard` | Leaderboard | Top users ranked by reputation |
| `/analytics` | Analytics | Charts and stats about the network |
| `/admin` | Admin Dashboard | Overview stats (admin only) |
| `/admin/users` | Admin Users | User management |
| `/admin/resources` | Admin Resources | Resource management |
| `/admin/stats` | Admin Stats | Detailed platform metrics |

#### Key Components (`frontend/src/components/`)
| Component | Purpose |
|-----------|---------|
| `AppShell.tsx` | Layout wrapper — shows `LoginPage` if unauthenticated, else `Sidebar` + animated page content |
| `Sidebar.tsx` | Navigation sidebar with links to all pages, user info, logout |
| `LoginPage.tsx` | Login/signup form |
| `StatCard.tsx` | Animated stat card with icon, value, label, and trend |
| `ResourceCard.tsx` | Resource display card with rating, download count, tags |
| `ReputationBadge.tsx` | Color-coded badge showing Contributor/Neutral/Leecher status |
| `RatingModal.tsx` | Star-rating modal for rating resources |
| `UploadModal.tsx` | Resource upload form modal |
| `ConceptCard.tsx` | Card displaying a Go programming concept |
| `LoadingSkeleton.tsx` | Animated placeholder while data loads |

#### Client Libraries (`frontend/src/lib/`)
| File | Purpose |
|------|---------|
| `api.ts` | HTTP client wrapping all backend endpoints. Uses `fetch` with JSON responses. |
| `auth.tsx` | React context provider for authentication. Stores user in `localStorage`. Provides `login()`, `signup()`, `logout()`, `useAuth()` hook. |
| `types.ts` | TypeScript interfaces mirroring Go structs. Also exports `GO_CONCEPTS` array with code examples for the learning section. |

#### Auth Flow
1. User enters username + password on `LoginPage`.
2. `api.login()` calls `POST /api/auth/login`.
3. Backend finds user by username, returns user object + token.
4. Frontend stores user in React context + `localStorage`.
5. `AppShell` checks `useAuth()` — if no user, shows login; otherwise shows the sidebar + page content.
6. API calls pass user ID via `X-User-ID` header for operations like upload/download.

---

## 5. Go Concepts Mapped to Files

The project is explicitly structured to teach 8 core Go concepts:

| # | Concept | Primary Files | What to Look For |
|---|---------|---------------|-----------------|
| 1 | **Variables, Values & Types** | `models/types.go` | Custom types (`UserID`, `ContentID`), constants with bit shifting (`100 << 20`), `iota`-style enums |
| 2 | **Looping & Control Flow** | `services/search_service.go`, `services/reputation_service.go` | `for-range` loops, `switch` with no expression, `if-else` chains, early returns |
| 3 | **Arrays & Slices** | `models/resource.go`, `models/peer.go` | Fixed-size `[10]*Resource` array, dynamic `[]string` tags, `append()`, slice filtering |
| 4 | **Maps & Structs** | `store/memory.go`, `models/user.go` | `map[ContentID]*Resource`, `struct` with JSON tags, embedded structs (`UserProfile`), ok-pattern (`val, ok := m[key]`) |
| 5 | **Functions & Error Handling** | `errors/errors.go`, `services/user_service.go` | Multiple return values `(T, error)`, sentinel errors, custom error types, error wrapping |
| 6 | **Interfaces** | `interfaces/storage.go`, `store/memory.go` | Interface definitions, implicit satisfaction, one struct implementing 3 interfaces |
| 7 | **Pointers & Call Semantics** | `services/user_service.go`, `store/memory.go` | Pointer receivers `(m *MemoryStore)`, passing `*Resource` to avoid copies, `sync.RWMutex` |
| 8 | **JSON & Unit Tests** | `handlers/api_handler.go`, `services/*_test.go`, `models/json_codec.go` | `json:"field_name"`, `json:"-"`, `json.Marshal/Unmarshal`, `testing.T`, table-driven tests |

---

## 6. How to Run

### Backend (Go API Server)
```bash
cd peer_to_peer_lib
go mod download
go run main.go
# → http://localhost:8080
```

### Frontend (Next.js Dev Server)
```bash
cd peer_to_peer_lib/frontend
npm install
npm run dev
# → http://localhost:3000
```

### Phase 1 CLI Demo
```bash
cd ..   # back to project root
go run ./cmd/main.go
# Prints demo output to console
```

### Run Tests
```bash
cd peer_to_peer_lib
go test ./... -v
```

### Docker (Both Services)
```bash
cd peer_to_peer_lib
docker-compose up --build
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

---

## 7. Demo Users (Pre-Seeded)

| Username | Role | Reputation | Classification |
|----------|------|-----------|----------------|
| **alice** | Admin | High | Contributor (50 uploads, 10 downloads) |
| **bob** | User | Medium | Contributor (25 uploads, 10 downloads) |
| **charlie** | User | Negative | Leecher (3 uploads, 30 downloads) |
| **diana** | User | Moderate | Neutral (12 uploads, 12 downloads) |
| **eve** | User | Moderate | Neutral (8 uploads, 15 downloads) |

**Login with any username** (e.g., `alice`) and password `password`.

---

## 8. Data Flow Example: Uploading a Resource

```
Frontend                          Backend
───────                           ───────
1. User fills upload form
2. POST /api/resources    ───►    3. APIHandler.CreateResource()
   {filename, title, ...}             │
   Header: X-User-ID                  ▼
                                  4. LibraryService.Upload()
                                       │
                                       ├── validateResource()
                                       ├── MemoryStore.Store()
                                       │     └── map[CID] = resource
                                       └── UserService.RecordUpload()
                                             └── user.TotalUploads++
                                  5. ReputationService.Recalculate()
                                       └── score = (uploads×2) - downloads + (rating×10)
                                  6. Return resource JSON
                              ◄───
7. Update UI with new resource
```

---

## 9. Project Directory Summary

```
project/
├── DOCUMENTATION.md              # Phase 1 documentation
├── WALKTHROUGH.md                # This file
├── go.mod                        # Phase 1 Go module
├── cmd/
│   └── main.go                   # Phase 1 CLI entry point
├── models/                       # Phase 1 data models
│   ├── student.go                #   Student/Peer model
│   ├── academicFile.go           #   Academic file model
│   ├── rating.go                 #   Rating model
│   └── registry.go               #   Thread-safe registries
│
└── peer_to_peer_lib/             # Phase 2 — Full-stack app
    ├── main.go                   # HTTP server entry point
    ├── go.mod                    # Go module (gorilla/mux, cors, uuid)
    ├── docker-compose.yml        # Docker orchestration
    ├── Dockerfile                # Backend container
    ├── errors/
    │   └── errors.go             # Custom error types (Concept 5)
    ├── interfaces/
    │   ├── storage.go            # Storage interfaces (Concept 6)
    │   └── reputation.go         # Reputation interface
    ├── models/
    │   ├── types.go              # Type aliases & constants (Concept 1)
    │   ├── user.go               # User struct (Concept 4)
    │   ├── resource.go           # Resource struct (Concept 3)
    │   ├── peer.go               # Peer info struct
    │   ├── rating.go             # Rating struct
    │   ├── json_codec.go         # JSON helpers (Concept 8)
    │   ├── json_codec_test.go    # JSON tests
    │   ├── json_errors.go        # JSON error types
    │   └── validation_errors.go  # Validation error types
    ├── services/
    │   ├── user_service.go       # User operations (Concept 7)
    │   ├── library_service.go    # Resource CRUD (Concept 2, 3)
    │   ├── reputation_service.go # Reputation calc (Concept 2)
    │   ├── search_service.go     # Search engine (Concept 2)
    │   ├── transfer_service.go   # P2P transfer simulation
    │   └── *_test.go             # Unit tests (Concept 8)
    ├── store/
    │   └── memory.go             # In-memory store (Concept 4, 6, 7)
    ├── handlers/
    │   └── api_handler.go        # REST API (Concept 8)
    └── frontend/                 # Next.js 16 + React 19
        ├── src/
        │   ├── app/              # File-based routing (10 pages)
        │   ├── components/       # Reusable UI components (10)
        │   └── lib/              # API client, auth, types
        ├── package.json          # Dependencies
        └── tailwind.config.ts    # Tailwind CSS config
```
