# API Quick Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints (except `/auth/login`) require authentication via session cookie.

---

## Auth Endpoints

### POST /auth/login
Login with credentials
```json
Request:
{
  "email": "admin@archibus.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@archibus.com",
      "name": "Admin User",
      "roles": ["ADMIN"]
    }
  }
}
```

### POST /auth/logout
Logout current user
```json
Response:
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

### GET /auth/me
Get current user info
```json
Response:
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@archibus.com",
      "name": "Admin User",
      "roles": ["ADMIN"]
    }
  }
}
```

---

## Service Request Endpoints

### POST /service-requests
Create new service request (REQUESTOR+)
```json
Request:
{
  "title": "Broken light in Room 101",
  "description": "The ceiling light is not working",
  "priority": "MEDIUM",
  "siteId": 1,
  "buildingId": 1,
  "floorId": 1,
  "roomId": 1,
  "problemTypeId": 2,
  "requestedForUserId": 5  // optional
}

Response:
{
  "success": true,
  "data": {
    "serviceRequest": {
      "id": 1,
      "srNumber": "SR-202412-00001",
      "title": "Broken light in Room 101",
      "status": "DRAFT",
      ...
    }
  }
}
```

### GET /service-requests
List service requests with optional filters
```
Query Parameters:
  ?page=1
  &pageSize=20
  &status=SUBMITTED
  &priority=HIGH
  &siteId=1
  &buildingId=1
  &srNumber=SR-202412
  &keyword=light
  &dateFrom=2024-01-01T00:00:00Z
  &dateTo=2024-12-31T23:59:59Z

Response:
{
  "success": true,
  "data": {
    "serviceRequests": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### GET /service-requests/:id
Get service request details
```json
Response:
{
  "success": true,
  "data": {
    "serviceRequest": {
      "id": 1,
      "srNumber": "SR-202412-00001",
      "title": "...",
      "site": {...},
      "building": {...},
      "requestedBy": {...},
      "isResponseOverdue": false,
      "isResolveOverdue": false,
      ...
    }
  }
}
```

### PATCH /service-requests/:id
Update service request (DRAFT only, by creator or ADMIN)
```json
Request:
{
  "title": "Updated title",
  "priority": "HIGH"
}
```

### POST /service-requests/:id/submit
Submit request (DRAFT → SUBMITTED)
```json
Response:
{
  "success": true,
  "data": {
    "serviceRequest": {
      "status": "SUBMITTED",
      "responseDueAt": "2024-12-24T16:00:00Z",
      "resolveDueAt": "2024-12-31T12:00:00Z",
      ...
    }
  }
}
```

### POST /service-requests/:id/triage
Triage request (SUBMITTED → TRIAGED) - SUPERVISOR/ADMIN only
```json
Response:
{
  "success": true,
  "data": {
    "serviceRequest": {
      "status": "TRIAGED",
      ...
    }
  }
}
```

### POST /service-requests/:id/assign
Assign request (TRIAGED → ASSIGNED) - SUPERVISOR/ADMIN only
```json
Request:
{
  "assignedTradeId": 1,  // optional
  "assignedTechnicianId": 3  // optional, at least one required
}

Response:
{
  "success": true,
  "data": {
    "serviceRequest": {
      "status": "ASSIGNED",
      "assignedTechnician": {...},
      ...
    }
  }
}
```

### POST /service-requests/:id/start
Start work (ASSIGNED → IN_PROGRESS) - TECHNICIAN/ADMIN only

### POST /service-requests/:id/complete
Complete work (IN_PROGRESS → COMPLETED) - TECHNICIAN/ADMIN only

### POST /service-requests/:id/close
Close request (COMPLETED → CLOSED) - SUPERVISOR/ADMIN only

### POST /service-requests/:id/cancel
Cancel request (from SUBMITTED/TRIAGED/ASSIGNED) - Creator or SUPERVISOR/ADMIN

---

## Comments

### GET /service-requests/:id/comments
Get all comments for a service request
```json
Response:
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "body": "Working on this now",
        "user": { "name": "John Technician" },
        "createdAt": "2024-12-24T10:30:00Z"
      }
    ]
  }
}
```

### POST /service-requests/:id/comments
Add a comment
```json
Request:
{
  "body": "This has been fixed"
}
```

---

## Attachments

### GET /service-requests/:id/attachments
Get all attachments (metadata only)

### POST /service-requests/:id/attachments
Add attachment metadata
```json
Request:
{
  "fileName": "photo.jpg",
  "fileUrl": "https://example.com/uploads/photo.jpg"
}
```

---

## Audit Trail

### GET /service-requests/:id/audit
Get complete audit trail
```json
Response:
{
  "success": true,
  "data": {
    "auditLogs": [
      {
        "id": 1,
        "action": "CREATED",
        "fromStatus": null,
        "toStatus": "DRAFT",
        "user": { "name": "Jane Requestor" },
        "createdAt": "2024-12-24T09:00:00Z"
      },
      {
        "id": 2,
        "action": "STATUS_CHANGED",
        "fromStatus": "DRAFT",
        "toStatus": "SUBMITTED",
        "user": { "name": "Jane Requestor" },
        "createdAt": "2024-12-24T09:05:00Z"
      }
    ]
  }
}
```

---

## Reference Data

### GET /reference/sites
List all sites

### GET /reference/buildings?siteId=1
List buildings (optionally filter by site)

### GET /reference/floors?buildingId=1
List floors (optionally filter by building)

### GET /reference/rooms?floorId=1
List rooms (optionally filter by floor)

### GET /reference/problem-types
List all problem types

### GET /reference/trades
List all trades

### GET /reference/technicians?tradeId=1
List technicians (optionally filter by trade)

### GET /reference/users
List all active users

---

## Error Response Format

All error responses follow this structure:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": {}  // optional
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `INVALID_STATUS` - Invalid status transition
- `INTERNAL_ERROR` - Server error

---

## Status Machine

```
DRAFT ──────────► SUBMITTED ──────► TRIAGED ──────► ASSIGNED ──────► IN_PROGRESS ──────► COMPLETED ──────► CLOSED
                      │                 │                │
                      │                 │                │
                      ▼                 ▼                ▼
                  CANCELLED         CANCELLED        CANCELLED
```

## Priority Levels & SLA

| Priority | Response Time | Resolution Time |
|----------|---------------|-----------------|
| URGENT   | 2 hours       | 1 day           |
| HIGH     | 4 hours       | 3 days          |
| MEDIUM   | 8 hours       | 7 days          |
| LOW      | 1 day         | 14 days         |

## Role Permissions

| Action | ADMIN | SUPERVISOR | TECHNICIAN | REQUESTOR |
|--------|-------|------------|------------|-----------|
| Create SR | ✓ | ✓ | ✓ | ✓ |
| Submit SR | ✓ (any) | ✓ (any) | ✓ (own) | ✓ (own) |
| Triage | ✓ | ✓ | ✗ | ✗ |
| Assign | ✓ | ✓ | ✗ | ✗ |
| Start Work | ✓ | ✓ | ✓ | ✗ |
| Complete | ✓ | ✓ | ✓ | ✗ |
| Close | ✓ | ✓ | ✗ | ✗ |
| Cancel | ✓ | ✓ | ✗ | ✓ (own) |
| Comment | ✓ | ✓ | ✓ | ✓ |
