# ARCHIBUS Service Desk System

A modern, full-stack facility management service desk system built with Next.js, Fastify, TypeScript, and PostgreSQL.

## 🏗️ Architecture

### Backend
- **Framework**: Fastify + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Session-based auth with httpOnly cookies
- **API**: RESTful JSON API with Zod validation
- **RBAC**: Role-based access control (ADMIN, SUPERVISOR, TECHNICIAN, REQUESTOR)

### Frontend
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: 
  - TanStack Query for server state
  - Zustand for UI state
- **Forms**: React Hook Form + Zod validation

## 📋 Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+
- Git

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb archibus_dev

# Or using psql
psql -U postgres
CREATE DATABASE archibus_dev;
\q
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/archibus_dev?schema=public"
# SESSION_SECRET="your-secret-key-change-in-production"

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local if needed
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 👤 Sample Users

After seeding, you can login with these credentials:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@archibus.com | password123 | Full system access |
| Supervisor | supervisor@archibus.com | password123 | Triage, assign, close requests |
| Technician | technician@archibus.com | password123 | Work on assigned requests |
| Requestor | requestor@archibus.com | password123 | Create and view own requests |

## 📊 Database Schema

### Core Tables

- **users** - System users with authentication
- **roles** - RBAC roles (ADMIN, SUPERVISOR, TECHNICIAN, REQUESTOR)
- **user_roles** - Many-to-many user-role assignments

### Location Hierarchy

- **sites** - Top-level locations (campuses)
- **buildings** - Buildings within sites
- **floors** - Floors within buildings
- **rooms** - Rooms within floors

### Service Desk

- **service_requests** - Core SR records with status, priority, location, etc.
- **problem_types** - Categorization of issues
- **trades** - Maintenance trades (Electrical, HVAC, etc.)
- **technicians** - Technician profiles linked to users
- **service_request_comments** - Comments on SRs
- **service_request_attachments** - File metadata (URLs for now)
- **service_request_audit** - Complete audit trail of all changes

## 🔄 Service Request Workflow

```
DRAFT → SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
         ↓           ↓          ↓
      CANCELLED  CANCELLED  CANCELLED
```

### Status Transitions

| From | To | Required Role |
|------|-------|---------------|
| DRAFT | SUBMITTED | Request creator |
| SUBMITTED | TRIAGED | SUPERVISOR/ADMIN |
| TRIAGED | ASSIGNED | SUPERVISOR/ADMIN |
| ASSIGNED | IN_PROGRESS | TECHNICIAN/ADMIN |
| IN_PROGRESS | COMPLETED | TECHNICIAN/ADMIN |
| COMPLETED | CLOSED | SUPERVISOR/ADMIN |
| SUBMITTED/TRIAGED/ASSIGNED | CANCELLED | Creator or SUPERVISOR/ADMIN |

### SLA Calculation

SLAs are automatically calculated based on priority when submitted:

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| URGENT | 2 hours | 1 day |
| HIGH | 4 hours | 3 days |
| MEDIUM | 8 hours | 7 days |
| LOW | 1 day | 14 days |

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login      - Login with email/password
POST   /api/auth/logout     - Logout
GET    /api/auth/me         - Get current user
```

### Service Requests
```
POST   /api/service-requests                - Create SR (REQUESTOR+)
GET    /api/service-requests                - List SRs with filters
GET    /api/service-requests/:id            - Get SR details
PATCH  /api/service-requests/:id            - Update SR (DRAFT only)
POST   /api/service-requests/:id/submit     - Submit SR
POST   /api/service-requests/:id/triage     - Triage SR (SUPERVISOR+)
POST   /api/service-requests/:id/assign     - Assign SR (SUPERVISOR+)
POST   /api/service-requests/:id/start      - Start work (TECHNICIAN+)
POST   /api/service-requests/:id/complete   - Complete work (TECHNICIAN+)
POST   /api/service-requests/:id/close      - Close SR (SUPERVISOR+)
POST   /api/service-requests/:id/cancel     - Cancel SR
GET    /api/service-requests/:id/comments   - Get comments
POST   /api/service-requests/:id/comments   - Add comment
GET    /api/service-requests/:id/attachments- Get attachments
POST   /api/service-requests/:id/attachments- Add attachment
GET    /api/service-requests/:id/audit      - Get audit trail
```

### Reference Data
```
GET    /api/reference/sites           - List sites
GET    /api/reference/buildings       - List buildings (filter by siteId)
GET    /api/reference/floors          - List floors (filter by buildingId)
GET    /api/reference/rooms           - List rooms (filter by floorId)
GET    /api/reference/problem-types   - List problem types
GET    /api/reference/trades          - List trades
GET    /api/reference/technicians     - List technicians (filter by tradeId)
GET    /api/reference/users           - List active users
```

## 🧪 Testing

```bash
cd backend
npm test
```

Currently includes:
- Workflow transition rules tests
- RBAC permission tests
- SLA calculation tests

## 🗂️ Project Structure

```
archibus-dev/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed script
│   ├── src/
│   │   ├── plugins/
│   │   │   ├── auth.ts        # Session authentication
│   │   │   ├── rbac.ts        # Role-based access control
│   │   │   └── db.ts          # Prisma connection
│   │   ├── routes/
│   │   │   ├── auth.ts        # Auth endpoints
│   │   │   ├── service-requests.ts  # SR CRUD + workflow
│   │   │   └── reference-data.ts    # Dropdown data
│   │   ├── schemas/
│   │   │   └── index.ts       # Zod validation schemas
│   │   ├── utils/
│   │   │   └── sr-number.ts   # SR number generation
│   │   └── server.ts          # Fastify server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx           # Root layout with providers
    │   │   ├── page.tsx             # Home page (redirect)
    │   │   ├── login/
    │   │   │   └── page.tsx         # Login page
    │   │   └── service-desk/
    │   │       └── requests/
    │   │           ├── page.tsx     # List view
    │   │           ├── new/
    │   │           │   └── page.tsx # Create form
    │   │           └── [id]/
    │   │               └── page.tsx # Details view
    │   ├── components/
    │   │   ├── ui/                  # shadcn/ui components
    │   │   └── service-desk/        # Feature components
    │   ├── contexts/
    │   │   └── auth-context.tsx     # Auth state
    │   ├── lib/
    │   │   ├── api.ts               # API client
    │   │   ├── types.ts             # TypeScript types
    │   │   └── utils.ts             # Utilities
    │   └── styles/
    │       └── globals.css          # Global styles
    └── package.json
```

## 🔐 Security Features

- **Session-based auth** with httpOnly cookies (XSS protected)
- **CSRF protection** via SameSite cookies
- **Password hashing** with bcrypt
- **Role-based access control** on all endpoints
- **Input validation** with Zod on both client and server
- **SQL injection protection** via Prisma ORM

## 🚧 Future Enhancements

- [ ] OIDC/SSO integration (interface ready)
- [ ] File upload with S3/local storage
- [ ] Email notifications
- [ ] Real-time updates with WebSockets
- [ ] Mobile responsive optimization
- [ ] Advanced reporting and analytics
- [ ] Calendar/scheduling view
- [ ] Asset management module
- [ ] Preventive maintenance module

## 📝 Development Notes

### Adding a new endpoint

1. Define Zod schema in `backend/src/schemas/index.ts`
2. Add route handler in appropriate route file
3. Add RBAC guards via `preHandler`
4. Create API client method in `frontend/src/lib/api.ts`
5. Define TypeScript types in `frontend/src/lib/types.ts`

### Database Changes

```bash
# Create migration after schema changes
cd backend
npm run db:migrate

# Reset database (caution!)
npx prisma migrate reset

# View database in Prisma Studio
npm run db:studio
```

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit PR

## 📄 License

MIT

## 🆘 Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ using modern TypeScript stack
