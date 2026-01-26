# Plays & Flashcards API Refactoring - Completed

## Overview

This document summarizes the refactored Plays and Flashcards API endpoints that follow the new org-scoped architecture with proper RBAC enforcement.

---

## New API Endpoints

### Plays Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/plays` | Coach/Admin | Create new play record |
| GET | `/api/plays` | Player+ | List plays (filtered by role) |
| GET | `/api/plays/:id` | Player+ | Get single play with details |
| PATCH | `/api/plays/:id/status` | Coach/Admin | Update play status (approve/reject/publish) |
| POST | `/api/plays/:id/process` | Coach/Admin | Trigger background AI processing |

### Flashcards (Question Bank)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/flashcards` | Player+ | List flashcards from question bank |
| POST | `/api/flashcards/regenerate/:playId` | Coach/Admin | Deactivate existing flashcards for regeneration |

---

## Key Features Implemented

### 1. **Organization-Scoped Access**
All endpoints require `orgId` and verify the user belongs to that organization. Data is isolated by org_id at the database level.

### 2. **Role-Based Filtering**
- **Players**: See only published, approved plays and their flashcards
- **Coaches/Admins**: See all plays regardless of status, can create and manage plays

### 3. **Proper Status Workflow**
```
draft → generating → approved/rejected → published
```
- Coaches create plays in `draft` status
- Background processing sets status to `generating`
- After AI analysis, status becomes `draft` (ready for review)
- Coaches approve or reject plays
- Only approved plays can be published
- Only published plays are visible to players

### 4. **Flashcard Management**
- Coaches can view the "question bank" of all flashcards across plays
- Filter by position, category, difficulty, card type
- Regenerate flashcards by deactivating old ones (maintains history)
- Flashcards are automatically created during background processing

### 5. **Background Processing**
- Trigger AI analysis and flashcard generation
- Status tracking: `generating` → `draft`
- Fire-and-forget pattern for long-running operations

---

## API Usage Examples

### 1. Coach Creates a New Play

```bash
curl -X POST http://localhost:8888/.netlify/functions/plays-create \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org-uuid",
    "teamId": "team-uuid",
    "playbookMetadataId": "metadata-uuid",
    "name": "Mesh Concept",
    "playType": "PASS",
    "formationName": "Shotgun Spread",
    "concept": "Mesh",
    "triggerProcessing": true
  }'
```

**Response (201):**
```json
{
  "success": true,
  "playId": "new-play-uuid",
  "status": "generating",
  "message": "Play created, ready for processing"
}
```

### 2. List Plays (Coach View)

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-list?orgId=org-uuid' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Response (200):**
```json
{
  "plays": [
    {
      "id": "play-uuid",
      "name": "Mesh Concept",
      "shortName": "Mesh",
      "formationName": "Shotgun Spread",
      "concept": "Mesh",
      "playType": "PASS",
      "contentStatus": "draft",
      "isPublished": false,
      "createdAt": "2024-02-10T15:30:00Z",
      "updatedAt": "2024-02-10T15:45:00Z",
      "playbook_metadata": {
        "id": "metadata-uuid",
        "formationName": "Shotgun Spread",
        "conceptName": "Mesh",
        "sideOfBall": "offense",
        "contentType": "play",
        "level": "high_school",
        "positionRelevance": ["QB", "X", "Z", "H"]
      }
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

### 3. List Plays (Player View)

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-list?orgId=org-uuid' \
  -H "Authorization: Bearer YOUR_PLAYER_JWT_TOKEN"
```

**Response (200):**
```json
{
  "plays": [
    {
      "id": "play-uuid",
      "name": "Mesh Concept",
      "contentStatus": "approved",
      "isPublished": true
    }
  ],
  "total": 8,
  "limit": 50,
  "offset": 0
}
```

*Note: Players only see published, approved plays*

### 4. Get Play Details with Assignments

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/plays-get/play-uuid?includeAssignments=true&includeFlashcards=true&position=QB' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Response (200):**
```json
{
  "play": {
    "id": "play-uuid",
    "name": "Mesh Concept",
    "shortName": "Mesh",
    "formationName": "Shotgun Spread",
    "concept": "Mesh",
    "playType": "PASS",
    "contentStatus": "approved",
    "isPublished": true,
    "aiInsights": "This is a high-percentage passing concept...",
    "createdAt": "2024-02-10T15:30:00Z",
    "updatedAt": "2024-02-10T16:00:00Z",
    "metadata": { ... }
  },
  "assignments": [
    {
      "id": "assignment-uuid",
      "playId": "play-uuid",
      "position": "QB",
      "alignment": "Shotgun",
      "landmark": "Center",
      "assignment": "Read high-low progression",
      "keyRead": "Middle linebacker",
      "category": "formation",
      "coverageAdjustments": {
        "vsMan": "Check to slant",
        "vsZone": "Work mesh area",
        "vsBlitz": "Hot route to RB"
      }
    },
    {
      "id": "assignment-uuid-2",
      "position": "X",
      "alignment": "Split left 12 yards",
      "assignment": "15-yard dig",
      "category": "route",
      "routeId": "dig",
      "depth": 15
    }
  ],
  "flashcards": [
    {
      "id": "flashcard-uuid",
      "playId": "play-uuid",
      "position": "QB",
      "category": "assignment",
      "cardType": "assignment",
      "questionPrompt": "What is your assignment as the QB?",
      "correctAnswer": "Read high-low progression",
      "hints": ["Read high-low progression", "Check down", "Scramble", "Throw away"],
      "difficulty": "intermediate",
      "isAutoGenerated": true,
      "isActive": true
    }
  ]
}
```

### 5. Approve and Publish a Play

```bash
# Step 1: Approve the play
curl -X PATCH http://localhost:8888/.netlify/functions/plays-update-status/play-uuid \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentStatus": "approved"
  }'

# Step 2: Publish the play
curl -X PATCH http://localhost:8888/.netlify/functions/plays-update-status/play-uuid \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

**Response (200):**
```json
{
  "success": true,
  "play": {
    "id": "play-uuid",
    "contentStatus": "approved",
    "isPublished": true
  }
}
```

### 6. Trigger Background Processing

```bash
curl -X POST http://localhost:8888/.netlify/functions/plays-process/play-uuid \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generateInsights": true,
    "generateAssignments": true,
    "generateKnowledge": true
  }'
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "playId": "play-uuid",
  "status": "generating",
  "message": "Background processing started. Check play status for completion."
}
```

### 7. List Flashcards (Question Bank)

```bash
curl -X GET 'http://localhost:8888/.netlify/functions/flashcards-list?orgId=org-uuid&position=QB&difficulty=intermediate' \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Response (200):**
```json
{
  "flashcards": [
    {
      "id": "flashcard-uuid",
      "playId": "play-uuid",
      "assignmentId": "assignment-uuid",
      "position": "QB",
      "category": "assignment",
      "cardType": "assignment",
      "questionPrompt": "What is your assignment as the QB?",
      "correctAnswer": "Read high-low progression",
      "hints": ["Read high-low progression", "Check down", "Scramble", "Throw away"],
      "difficulty": "intermediate",
      "isAutoGenerated": true,
      "isActive": true,
      "createdAt": "2024-02-10T15:45:00Z",
      "play": {
        "id": "play-uuid",
        "name": "Mesh Concept",
        "formationName": "Shotgun Spread",
        "concept": "Mesh",
        "playType": "PASS"
      }
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

### 8. Regenerate Flashcards

```bash
curl -X POST http://localhost:8888/.netlify/functions/flashcards-regenerate/play-uuid \
  -H "Authorization: Bearer YOUR_COACH_JWT_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Existing flashcards deactivated. Trigger play processing to regenerate.",
  "playId": "play-uuid"
}
```

---

## Error Handling

All endpoints use the shared error handling system:

### Example: Access Denied
```json
{
  "error": "Access denied to this play",
  "code": "FORBIDDEN"
}
```

### Example: Validation Error
```json
{
  "error": "orgId must match your organization",
  "code": "VALIDATION_ERROR"
}
```

### Example: Not Found
```json
{
  "error": "Play not found",
  "code": "NOT_FOUND"
}
```

---

## Integration with Quiz System

The flashcards endpoint provides the "question bank" for creating quiz assignments:

1. **Coach browses flashcards**: `GET /api/flashcards?position=QB&difficulty=intermediate`
2. **Coach selects flashcards**: Client stores selected flashcard IDs
3. **Coach creates quiz**: `POST /api/quizzes/assignments` with selected flashcard IDs
4. **Players take quiz**: Quiz system (already implemented) handles the rest

---

## File Structure

```
netlify/functions/
├── shared/                        (Already created)
│   ├── supabase.ts               ✅ Supabase client utilities
│   ├── auth.ts                   ✅ RBAC middleware
│   ├── errors.ts                 ✅ Error handling
│   └── validators.ts             ✅ Request validation
│
├── plays-create.ts               ✅ Create play
├── plays-list.ts                 ✅ List plays
├── plays-get.ts                  ✅ Get play details
├── plays-update-status.ts        ✅ Update play status
├── plays-process.ts              ✅ Trigger background processing
├── flashcards-list.ts            ✅ List flashcards
├── flashcards-regenerate.ts      ✅ Regenerate flashcards
│
└── process-play-content-background.ts  ⚠️ Needs minor updates for org_id
```

---

## Migration Notes

### Old Endpoints → New Endpoints

| Old Endpoint | New Endpoint | Notes |
|--------------|--------------|-------|
| `create-play-record` | `plays-create` | Now includes org_id, RBAC, validation |
| `get-approved-plays` | `plays-list` + `plays-get` | Split into list and detail endpoints |
| `review-play-content` | `plays-update-status` | Simplified status updates |
| `analyze-plays` | Removed | Functionality in `plays-process` |
| `check-play-status` | Use `plays-get` | Status included in play details |
| `flashcard-templates` | `flashcards-list` | Now a proper endpoint with filters |

### Still Needs Update

The following file still uses the old pattern and should be updated:
- **`process-play-content-background.ts`**: Update to use org_id instead of team_id when creating records

---

## Testing Checklist

- [ ] Create play as coach
- [ ] List plays as coach (see all)
- [ ] List plays as player (see published only)
- [ ] Get play details with assignments
- [ ] Approve play as coach
- [ ] Publish play as coach
- [ ] Player attempts to access unpublished play (should fail)
- [ ] Trigger background processing
- [ ] Check play status transitions: draft → generating → draft
- [ ] List flashcards with filters
- [ ] Regenerate flashcards
- [ ] Create quiz using flashcards from question bank

---

## Next Steps

1. **Update Background Function**: Modify `process-play-content-background.ts` to use the new org-scoped schema
2. **Deprecate Old Endpoints**: Mark old endpoints as deprecated or remove them
3. **Frontend Integration**: Update frontend to use new endpoints
4. **Testing**: Run through complete workflow end-to-end

---

## Summary

**New Endpoints Created**: 7 endpoints
- 5 Plays endpoints
- 2 Flashcards endpoints

**Key Improvements**:
- ✅ Organization-scoped multi-tenancy
- ✅ Role-based access control
- ✅ Standardized error handling
- ✅ Proper status workflow
- ✅ Shared utilities (no code duplication)
- ✅ Type-safe validation
- ✅ Consistent API patterns

The Plays and Flashcards API is now aligned with the Quiz API architecture and ready for frontend integration! 🚀
