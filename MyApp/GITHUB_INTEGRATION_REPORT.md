# GitHub Integration Report — Gwen AI MVP

**Date:** August 16, 2026  
**Project:** Gwen AI (MyApp - React Native Expo)  
**Backend:** https://jskarthik45-gwenaibackend.hf.space  
**Status:** ✅ Contract-Aligned Frontend Implementation Complete

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Design Principles](#design-principles)
4. [Components & Implementation](#components--implementation)
5. [API Contract](#api-contract)
6. [Data Models](#data-models)
7. [User Workflows](#user-workflows)
8. [AsyncStorage Persistence](#asyncstorage-persistence)
9. [State Management](#state-management)
10. [Error Handling](#error-handling)
11. [Code Quality & Validation](#code-quality--validation)
12. [Known Limitations](#known-limitations)
13. [Next Steps](#next-steps)

---

## Executive Summary

The Gwen AI frontend has been updated to implement a **3-phase GitHub integration** aligned with the backend's device-flow authentication model:

- **Phase 1: GitHub App Installation** — User authorizes the GitHub App before any OAuth flow
- **Phase 2: Device Code Flow** — Backend-owned OAuth 2.0 device authorization
- **Phase 3: Automatic Repo Creation** — Backend creates one repository per MVP generation with persistent metadata

**Key Achievement:** Frontend contract now matches backend requirements with single `user_id` persisted across init → auth → prompt → result lifecycle, enabling backend token storage and repo creation per user.

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Gwen AI Frontend (React Native)           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │   HomeScreen     │      │   ConfigSheet    │             │
│  │  (Prompt Input)  │      │ (GitHub Connect) │             │
│  └────────┬─────────┘      └────────┬─────────┘             │
│           │                         │                       │
│           ├────────────────┬────────┤                       │
│           │                │        │                       │
│           v                v        v                       │
│  ┌────────────────────────────────────────┐                │
│  │         App.js State Management        │                │
│  │  - userId (persisted)                  │                │
│  │  - githubStatus (IDLE → SUCCESS)       │                │
│  │  - githubAuthData (token + metadata)   │                │
│  │  - promptResult (repo_url + metadata)  │                │
│  └────────────────────────────────────────┘                │
│           │                     │                           │
│           ├─────────────┬───────┴─────────┐                │
│           v             v                 v                 │
│  ┌─────────────┐ ┌────────────┐  ┌──────────────┐          │
│  │ AsyncStorage│ │   GitHub   │  │  QRScreen    │          │
│  │  Persistence│ │ Service API│  │  (Result UI) │          │
│  └─────────────┘ └────────────┘  └──────────────┘          │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                    ┌─────v─────┐
                    │   Backend  │
                    │   (Hugging │
                    │    Face)   │
                    └───────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Framework** | React Native / Expo | Cross-platform mobile app |
| **Auth Flow** | OAuth 2.0 Device Code | Backend-friendly authentication |
| **State Persistence** | AsyncStorage | Local user/auth/project data |
| **GitHub Integration** | GitHub REST API v3 | Repo creation & push |
| **Backend Communication** | Fetch API (HTTP/REST) | All API calls |

### Key Design Decisions

1. **Backend-Owned GitHub Auth**
   - Frontend displays device code UI only
   - Backend handles GitHub OAuth token exchange
   - Eliminates need for redirect-based flows in mobile
   - Single source of truth for GitHub credentials

2. **User-Linked Token Storage**
   - Same `user_id` sent across init → auth → prompt → result
   - Backend maps token to user_id, not global
   - Enables per-user GitHub connection

3. **Repo Per Prompt, Not Per User**
   - One GitHub connection per user
   - One repository per MVP generation
   - Each repo is fresh and independent
   - Repo metadata attached to result payload

4. **Separation of Concerns**
   - GitHub App Installation ≠ OAuth Authorization
   - Installation happens first (app permission boundary)
   - Then device-flow OAuth (user authorization)

---

## Components & Implementation

### 1. App.js (Main Shell)

**Location:** [d:\GwenAI\MyApp\App.js](d:\GwenAI\MyApp\App.js)

**Responsibilities:**
- User bootstrap and persistent `user_id` management
- GitHub auth state machine (IDLE → PENDING → SUCCESS / ERROR)
- Prompt submission with optional GitHub token
- Project CRUD and result caching
- Screen routing (home ↔ QR)

**Key Exports & Functions:**

| Function | Purpose |
|----------|---------|
| `bootstrapUserAndProjects()` | Fetch/restore user_id and projects from backend/storage |
| `handleGitHubConnectSuccess()` | Persist GitHub auth record to AsyncStorage after token receipt |
| `pollGithubAuthUntilSuccess()` | Poll device-auth status endpoint with user_id |
| `startGitHubDeviceAuthFlow()` | Initiate device-code request with user_id |
| `onSend()` | Submit prompt with optional github_access_token |
| `handleViewQR()` | Fetch & display result, including repo metadata |
| `persistProjectResult()` | Cache repo_url & github_repo with project |

**State Variables:**

```javascript
const [userId, setUserId] = useState(null);  // UUID, persisted
const [githubStatus, setGithubStatus] = useState(GITHUB_STATE.IDLE);
const [githubAuthData, setGithubAuthData] = useState(null);  // { access_token, login, avatar_url, ... }
const [githubRepoData, setGithubRepoData] = useState(null);  // { name, html_url, owner, ... }
const [promptResult, setPromptResult] = useState(null);  // { data: { github_repo_url, qr_code, ... }, ... }
const [myProjects, setMyProjects] = useState([]);  // Local project list
```

---

### 2. githubDeviceAuth.js (Service Layer)

**Location:** [d:\GwenAI\MyApp\src\services\githubDeviceAuth.js](d:\GwenAI\MyApp\src\services\githubDeviceAuth.js)

**Responsibilities:**
- GitHub OAuth 2.0 device-flow request/response handling
- Device code polling with user_id
- GitHub App installation URL management
- Error message normalization
- Response parsing and validation

**Key Exports & Functions:**

| Function | Signature | Purpose |
|----------|-----------|---------|
| `startGitHubDeviceAuth()` | `({ baseUrl, clientId, userId, fetchImpl })` | POST device-auth, return { device_code, user_code, verification_uri, interval } |
| `pollGitHubAuthStatus()` | `({ baseUrl, deviceCode, userId, fetchImpl })` | POST device-auth/status with user_id, return { status, access_token, login, ... } |
| `normalizeGithubDeviceAuthResponse()` | `(payload)` | Map backend response keys to frontend conventions |
| `normalizeGithubPollResponse()` | `(payload)` | Parse status field and extract token data |
| `getGithubFriendlyErrorMessage()` | `(code, fallback)` | Convert error codes to user-friendly text |

**Constants:**

```javascript
const GITHUB_CLIENT_ID = 'Iv23lioxhi4h5AOWArq8';
const GITHUB_APP_INSTALL_URL = 'https://github.com/apps/gwen-mvp-generator/installations/new';
const DEVICE_AUTH_ENDPOINTS = [
  '/api/github/device-auth',
  '/github/device-auth',
];
const GITHUB_STATE = {
  IDLE: 'IDLE',
  WAITING_FOR_GITHUB_USER_CODE: 'WAITING_FOR_GITHUB_USER_CODE',
  GITHUB_AUTH_PENDING: 'GITHUB_AUTH_PENDING',
  GITHUB_AUTH_SUCCESS: 'GITHUB_AUTH_SUCCESS',
  ERROR: 'ERROR',
};
```

---

### 3. ConfigSheet.js (GitHub Config Modal)

**Location:** [d:\GwenAI\MyApp\src\components\modals\ConfigSheet.js](d:\GwenAI\MyApp\src\components\modals\ConfigSheet.js)

**Responsibilities:**
- GitHub connection UI & CTA flow
- Device code display (user_code + verification_uri)
- GitHub App installation button
- Auth success/error message display
- Connection status badge

**Key Props:**

```javascript
{
  githubStatus,      // GITHUB_STATE enum
  githubAuth,        // { access_token, login, avatar_url, verification_uri, user_code, ... }
  githubError,       // Error message string
  githubRepo,        // { name, html_url, owner, ... } (legacy, not used in current flow)
  onConnectGitHub,   // Trigger startGitHubDeviceAuthFlow
  onOpenGitHubVerification,  // Open verification_uri in browser
  onDoneGitHubSuccess,  // Close sheet & reset GitHub state
}
```

**User Flow:**
1. User taps "Install GitHub App" → Opens GITHUB_APP_INSTALL_URL
2. User completes GitHub App installation on github.com
3. User returns and taps "Continue to GitHub"
4. Frontend calls `onConnectGitHub()` → startGitHubDeviceAuthFlow
5. Device code displayed (user_code + verification_uri)
6. User enters code at github.com/login/device
7. Backend polls GitHub, exchanges token
8. Frontend polls backend status until success
9. Token persisted, sheet closes

---

### 4. QRScreen.js (Result & Repo Display)

**Location:** [d:\GwenAI\MyApp\src\components\qr/QRScreen.js](d:\GwenAI\MyApp\src/components/qr/QRScreen.js)

**Responsibilities:**
- Display QR code & Expo Go link
- Show GitHub repo link if available
- Fallback to GitHub install flow if repo missing
- Handle QR fetching & caching

**Key Props:**

```javascript
{
  result,       // { data: { github_repo_url, qr_code, ... }, status, ... }
  qrContent,    // QR image URL or Snack URL
  qrMessage,    // Processing/error message
  project,      // { id, name, ... }
  onConnectGitHub,  // Fallback if no repo
}
```

**Repo URL Resolution Chain:**
```javascript
result?.data?.github_repo_url
  || result?.data?.github_repo
  || result?.github_repo_url
  || (fallback: show GitHub install button)
```

---

## API Contract

### Backend Endpoints

#### 1. `/api/init-user` (GET)
Initialize new user or return stored user_id.

**Request:**
```http
GET /api/init-user
```

**Response (Success 200):**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "initialized"
}
```

---

#### 2. `/api/github/device-auth` (POST)
Start OAuth 2.0 device-flow authorization.

**Request:**
```http
POST /api/github/device-auth
Content-Type: application/json

{
  "client_id": "Iv23lioxhi4h5AOWArq8",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Success 200):**
```json
{
  "device_code": "ABC123DEF456ABC123DEF456ABC123DEF456",
  "user_code": "ABCD-1234",
  "verification_uri": "https://github.com/login/device",
  "interval": 5,
  "expires_in": 900
}
```

---

#### 3. `/api/github/device-auth/status` (POST)
Poll device-auth status for token receipt.

**Request:**
```http
POST /api/github/device-auth/status
Content-Type: application/json

{
  "device_code": "ABC123DEF456ABC123DEF456ABC123DEF456",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Success 200 - Still Pending):**
```json
{
  "status": "authorization_pending"
}
```

**Response (Success 200 - Token Received):**
```json
{
  "status": "success",
  "access_token": "ghu_1234567890abcdefghijklmnopqrstuvwxyz",
  "login": "octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/1?v=4",
  "token_type": "bearer"
}
```

**Response (Other Statuses):**
```json
{
  "status": "expired_token" | "access_denied" | "slow_down"
}
```

---

#### 4. `/api/prompt` (POST)
Submit MVP generation prompt.

**Request:**
```http
POST /api/prompt
Content-Type: application/json

{
  "prompt": "Build a todo app with authentication",
  "project_name": "Todo App",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "github_access_token": "ghu_1234567890abcdefghijklmnopqrstuvwxyz"
}
```

**Response (Success 200):**
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "data": {
    "qr_code": {
      "qr_image_url": "https://...",
      "snack_url": "https://snack.expo.dev/...",
      "project_id": "550e8400-e29b-41d4-a716-446655440001"
    },
    "github_repo": "gwen-mvp-001",
    "github_repo_url": "https://github.com/octocat/gwen-mvp-001",
    "commit_hash": "abc123def456..."
  }
}
```

---

#### 5. `/api/get-qr` (POST)
Fetch QR/result for a project (polling for async completion).

**Request:**
```http
POST /api/get-qr
Content-Type: application/json

{
  "project_id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Completed 200):**
```json
{
  "status": "completed",
  "data": {
    "qr_code": { ... },
    "github_repo_url": "https://github.com/octocat/gwen-mvp-001"
  }
}
```

**Response (Processing 200):**
```json
{
  "status": "processing",
  "message": "Generating MVP, this may take a few minutes..."
}
```

---

### Critical Contract Rules

| Rule | Rationale |
|------|-----------|
| **Same `user_id` across init → auth → prompt** | Backend maps GitHub token to user_id; token is not global |
| **Device-auth/status must include `user_id`** | Backend uses user_id to look up pending auth & stored token |
| **Prompt includes `github_access_token` if available** | Backend uses token to create repo under user's GitHub account |
| **Result includes `github_repo_url` in `data` object** | Frontend reads url for repo link display on QR page |
| **Repo creation is per-prompt, not per-user** | Each MVP generation creates a fresh repository |

---

## Data Models

### User Record (AsyncStorage)

**Key:** `stored_user_id`  
**Value:** UUID string

```javascript
"550e8400-e29b-41d4-a716-446655440000"
```

**Key:** `gwen_user`  
**Value:** JSON object

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### GitHub Auth Record (AsyncStorage)

**Key:** `gwen_github_auth`  
**Value:** JSON object

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "githubConnected": true,
  "accessToken": "ghu_1234567890abcdefghijklmnopqrstuvwxyz",
  "login": "octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
  "connectedAt": "2026-08-16T12:34:56.789Z"
}
```

---

### Project Record (AsyncStorage)

**Key:** `my_projects`  
**Value:** JSON array

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Todo App",
    "updatedAt": "2026-08-16T12:34:56.789Z"
  }
]
```

**Key:** `gwen_project_<projectId>`  
**Value:** JSON object

```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "githubRepo": "gwen-mvp-001",
  "githubRepoUrl": "https://github.com/octocat/gwen-mvp-001",
  "qrCode": {
    "qr_image_url": "https://...",
    "snack_url": "https://snack.expo.dev/..."
  }
}
```

---

### GitHub Auth State (React State)

```javascript
githubStatus:
  IDLE
  | WAITING_FOR_GITHUB_USER_CODE
  | GITHUB_AUTH_PENDING
  | GITHUB_AUTH_SUCCESS
  | ERROR

githubAuthData: {
  device_code: string,
  user_code: string,  // Displayed to user (e.g., "ABCD-1234")
  verification_uri: string,  // github.com/login/device
  interval: number,  // Polling interval in seconds
  access_token: string,  // After success
  login: string,  // GitHub username
  avatar_url: string,  // GitHub avatar URL
}

githubRepoData: {
  name: string,
  html_url: string,
  private: boolean,
  owner: { login: string, ... },
  raw: object,  // Full GitHub API response
}
```

---

## User Workflows

### Workflow 1: Bootstrap User on App Launch

```
┌─────────────────────────────────────────┐
│ App Mounts                              │
└──────────────────┬──────────────────────┘
                   │
                   ├─ Load STORED_USER_ID from AsyncStorage
                   │
                   ├─ If valid UUID found:
                   │  └─→ Restore userId, done
                   │
                   └─ If missing or invalid:
                      ├─ POST /api/init-user
                      ├─ Extract user_id from response
                      ├─ Save to AsyncStorage (STORED_USER_ID_KEY + GWEN_USER_KEY)
                      └─ Set state.userId
```

**Code Location:** [App.js:bootstrapUserAndProjects()](d:\GwenAI\MyApp\App.js#L115)

---

### Workflow 2: Connect GitHub (Device Flow)

```
┌────────────────────────────────────────────┐
│ User Taps "Install GitHub App"             │
└─────────────────────┬──────────────────────┘
                      │
                      ├─ Open GITHUB_APP_INSTALL_URL in browser
                      ├─ User completes installation
                      ├─ Returns to app
                      │
      ┌───────────────┴──────────────────┐
      │ User Taps "Continue to GitHub"   │
      └───────────────┬──────────────────┘
                      │
                      ├─ Call startGitHubDeviceAuthFlow()
                      │  └─ POST /api/github/device-auth
                      │     Body: { client_id, user_id }
                      │
                      ├─ Display user_code + verification_uri
                      ├─ Start polling /api/github/device-auth/status
                      │  └─ Poll every 5s, include user_id
                      │
                      ├─ User enters code at github.com/login/device
                      ├─ User grants permission
                      │
                      ├─ Backend exchanges code for access_token
                      ├─ Backend stores token linked to user_id
                      │
                      ├─ Poll detects success
                      ├─ Frontend receives access_token
                      │
                      ├─ Persist to AsyncStorage (GWEN_GITHUB_AUTH_KEY)
                      ├─ Set githubStatus = GITHUB_AUTH_SUCCESS
                      └─ Close modal
```

**Code Locations:**
- Phase Start: [App.js:startGitHubDeviceAuthFlow()](d:\GwenAI\MyApp\App.js#L386)
- Phase Poll: [App.js:pollGithubAuthUntilSuccess()](d:\GwenAI\MyApp\App.js#L340)
- Phase Success: [App.js:handleGitHubConnectSuccess()](d:\GwenAI\MyApp\App.js#L305)
- Service: [githubDeviceAuth.js:startGitHubDeviceAuth()](d:\GwenAI\MyApp\src\services\githubDeviceAuth.js#L70)
- Service: [githubDeviceAuth.js:pollGitHubAuthStatus()](d:\GwenAI\MyApp\src\services\githubDeviceAuth.js#L88)
- UI: [ConfigSheet.js](d:\GwenAI\MyApp\src\components\modals\ConfigSheet.js)

---

### Workflow 3: Generate MVP (Prompt Submission)

```
┌──────────────────────────────┐
│ User Types Prompt            │
│ Taps Send                    │
└──────────────┬───────────────┘
               │
               ├─ Validate: non-empty prompt, userId ready
               ├─ Extract project_name from first line
               │
               ├─ POST /api/prompt
               │  Body: {
               │    prompt,
               │    project_name,
               │    user_id,  // ← Same as device-auth flow
               │    github_access_token  // ← If auth succeeded
               │  }
               │
               ├─ Response received
               │  ├─ Extract project_id, github_repo_url
               │  ├─ Upsert local project list
               │  └─ Persist result metadata (gwen_project_<id>)
               │
               ├─ Navigate to QR screen
               └─ Fetch & display QR + repo link
```

**Code Location:** [App.js:onSend()](d:\GwenAI\MyApp\App.js#L430)

---

### Workflow 4: View Result with GitHub Repo

```
┌─────────────────────────────────┐
│ User Views Project in QR Screen │
└────────────────┬────────────────┘
                 │
                 ├─ Try cached local result
                 │
                 ├─ If not cached: POST /api/get-qr
                 │  Body: { project_id, user_id }
                 │
                 ├─ If processing: show spinner + message
                 ├─ If completed: display QR + repo link
                 ├─ If error: show error message
                 │
                 ├─ Parse github_repo_url from result.data
                 │
                 ├─ If repo exists:
                 │  └─ Show "Open Repository" button
                 │     → Linking.openURL(github_repo_url)
                 │
                 └─ If repo missing:
                    └─ Show "Connect GitHub" button
                       → Open ConfigSheet, start device flow
```

**Code Location:** [App.js:handleViewQR()](d:\GwenAI\MyApp\App.js#L220)  
**UI:** [QRScreen.js](d:\GwenAI\MyApp\src\components\qr\QRScreen.js)

---

## AsyncStorage Persistence

### Storage Keys & Values

| Key | Type | Purpose | Example |
|-----|------|---------|---------|
| `stored_user_id` | string (UUID) | User identity across sessions | `"550e8400-e29b-41d4-a716-446655440000"` |
| `gwen_user` | JSON object | User metadata wrapper | `{ "userId": "550e8400..." }` |
| `gwen_github_auth` | JSON object | GitHub token & user info | `{ "userId": "...", "accessToken": "ghu_...", "login": "octocat" }` |
| `my_projects` | JSON array | Project list | `[{ "id": "...", "name": "..." }]` |
| `gwen_project_<id>` | JSON object | Project result metadata | `{ "projectId": "...", "githubRepoUrl": "..." }` |
| `qr_content_<id>` | string (legacy) | QR image URL cache | `"https://api.qrserver.com/v1/create-qr-code/..."` |
| `qr_result_<id>` | JSON object | Full result object cache | `{ "status": "completed", "data": { ... } }` |

### Persistence Guarantees

- **User ID:** Persisted after init, restored on app launch
- **GitHub Auth:** Persisted after successful device-flow completion
- **Projects:** Persisted after each prompt submission
- **Results:** Persisted only when status is `"completed"`, not during processing
- **QR Content:** Persisted for fast display on re-visit

---

## State Management

### Redux-Free Design

The app uses React hooks + AsyncStorage (no Redux/MobX):

**Advantages:**
- Minimal dependencies
- Direct AsyncStorage integration
- Simpler debugging
- Faster initial implementation

**State Layers:**

1. **User Identity (Root Level)**
   ```javascript
   const [userId, setUserId] = useState(null);
   ```
   - Persisted to AsyncStorage
   - Used in all API calls
   - Restored on app launch

2. **GitHub Auth (Feature Level)**
   ```javascript
   const [githubStatus, setGithubStatus] = useState(GITHUB_STATE.IDLE);
   const [githubAuthData, setGithubAuthData] = useState(null);
   const [githubError, setGithubError] = useState('');
   ```
   - Polling state managed via `githubPollTimerRef`
   - Token persisted to AsyncStorage
   - Cleared on error or logout

3. **Prompt & Results (Feature Level)**
   ```javascript
   const [prompt, setPrompt] = useState('');
   const [promptResult, setPromptResult] = useState(null);
   const [qrContent, setQrContent] = useState(null);
   const [myProjects, setMyProjects] = useState([]);
   ```
   - Projects persisted to AsyncStorage
   - Results cached per project_id
   - Restored on QR screen visit

---

## Error Handling

### Error Classification

| Error | Source | Handler | User Message |
|-------|--------|---------|--------------|
| **Network Error** | API fetch fail | Try-catch + Alert | "Unable to send prompt. Please try again." |
| **Invalid User ID** | Missing/corrupted UUID | Fallback to init-user | "Please wait, still initializing..." |
| **GitHub App Not Installed** | Missing app permission | Prompt install flow | "Install GitHub App" button |
| **Device Code Expired** | >15 min no user input | Set ERROR status | "GitHub authorization expired. Please reconnect." |
| **Access Denied** | User denied permission | Set ERROR status | "GitHub authorization was denied." |
| **Slow Down** | GitHub rate limit | Increase poll interval | "GitHub is asking for slower polling..." |
| **QR Not Ready** | Still processing | Show spinner | "Your MVP is being generated..." |
| **Repo Not Created** | Backend error | Show result without link | Result page with no repo CTA |

### Error Recovery

```javascript
// Example: Retry on transient network error
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error(...);
} catch (error) {
  console.warn('Request failed', error);
  setGithubError(getGithubFriendlyErrorMessage('network_error', fallback));
  // User can retry from UI
}
```

### Friendly Error Messages

Errors are mapped via `getGithubFriendlyErrorMessage(code, fallback)`:

```javascript
const GITHUB_ERROR_MESSAGES = {
  'network_error': 'Network error while checking GitHub authorization.',
  'expired_token': 'GitHub authorization expired. Please reconnect.',
  'access_denied': 'GitHub authorization was denied.',
  'slow_down': 'GitHub is asking for a slower polling cadence.',
  'repo_creation_failed': 'Repository creation failed. Please try again.',
};
```

---

## Code Quality & Validation

### Editor Diagnostics

Ran TypeScript/ESLint diagnostics on modified files:

✅ **[App.js](d:\GwenAI\MyApp\App.js)** — No errors  
✅ **[githubDeviceAuth.js](d:\GwenAI\MyApp\src\services\githubDeviceAuth.js)** — No errors  
✅ **[ConfigSheet.js](d:\GwenAI\MyApp\src\components\modals\ConfigSheet.js)** — No errors  
✅ **[QRScreen.js](d:\GwenAI\MyApp\src\components\qr\QRScreen.js)** — No errors

### Testing Approach

| Test Type | Status | Notes |
|-----------|--------|-------|
| **Unit** | Manual review | Service functions validated for API contract |
| **Integration** | Code walkthrough | User workflows traced end-to-end |
| **E2E** | Pending | Requires live backend + GitHub App installation |
| **Diagnostics** | ✅ Passing | No TypeScript/ESLint errors |

### Code Patterns

- **Error Boundaries:** Try-catch in async functions + user Alert feedback
- **State Cleanup:** Timer refs cleared on unmount or error
- **Async Operations:** All API calls wrapped in try-catch with error states
- **Data Validation:** UUID regex validation, null checks, key fallbacks
- **Storage Safety:** JSON parse/stringify wrapped in try-catch

---

## Known Limitations

### Current Constraints

1. **Device Flow UX in Mobile**
   - User must manually enter device code or scan QR
   - No direct browser handoff (differs from web OAuth)
   - Mitigation: ConfigSheet guides user step-by-step

2. **Expo Go Limited**
   - QR code links Expo Go projects only
   - No native binary support yet
   - Mitigation: Full build process documented separately

3. **No Offline Support**
   - All operations require backend connectivity
   - Failed network calls not retried automatically
   - Mitigation: User can retry via UI

4. **Single GitHub Account Per App Install**
   - App cannot switch GitHub accounts without reinstalling GitHub App
   - Mitigation: Clear GitHub auth from settings and reinstall app

5. **No GitHub Token Refresh**
   - Token expiration not handled (GitHub tokens are long-lived)
   - Mitigation: Device flow run again to refresh

---

## Next Steps

### Phase 1: Live Testing (Immediate)
- [ ] Deploy frontend to physical device or emulator
- [ ] Install GitHub App (https://github.com/apps/gwen-mvp-generator)
- [ ] Test complete device-flow → repo creation workflow
- [ ] Validate repo URL appears in QR result page

### Phase 2: Robustness (Short Term)
- [ ] Add retry logic for transient network errors
- [ ] Implement token refresh on 401 responses
- [ ] Add progress tracking for long-running prompt generation
- [ ] Enhance error messages based on real-world failure modes

### Phase 3: UX Polish (Medium Term)
- [ ] Add haptic feedback on GitHub connect success
- [ ] Implement GitHub account switching (app reinstall vs. token swap)
- [ ] Add project sharing (GitHub repo link in share sheet)
- [ ] Display GitHub usage stats / remaining API calls

### Phase 4: Scale & Security (Long Term)
- [ ] Implement GitHub OAuth app rotation (security best practice)
- [ ] Add audit logging (who connected GitHub, when, result)
- [ ] Support multiple GitHub accounts per user (app re-install per account)
- [ ] Migrate to GitHub Apps instead of OAuth app (better security model)

---

## Summary

The **Gwen AI GitHub integration** is now **contract-aligned** with the backend, implementing:

✅ **Device-flow OAuth** (not redirect-based)  
✅ **User-linked token storage** (same user_id across flows)  
✅ **Per-prompt repo creation** (not per-user)  
✅ **Persistent metadata** (repo URL in result payload)  
✅ **Separation of installation & auth** (GitHub App first, then OAuth)  
✅ **Robust error handling** (user-friendly messages + recovery)  
✅ **Clean code** (no diagnostics errors, patterns validated)

The frontend is ready for live end-to-end testing with a real GitHub App installation and backend instance.

---

**Document Version:** 1.0  
**Last Updated:** August 16, 2026  
**Author:** Gwen AI Development Team
