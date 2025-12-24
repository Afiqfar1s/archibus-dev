# ARCHIBUS Service Desk - Setup Instructions

## Prerequisites

Before starting, ensure you have:
- **Node.js 20+** installed (`node --version`)
- **PostgreSQL 14+** installed and running
- **npm** or **yarn** package manager
- **Git** (optional, for version control)

## Step-by-Step Setup

### 1. Create PostgreSQL Database

```bash
# Using createdb command
createdb archibus_dev

# OR using psql
psql -U postgres
CREATE DATABASE archibus_dev;
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# Required variables:
#   DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/archibus_dev?schema=public"
#   SESSION_SECRET="generate-a-random-string-here"
#   NODE_ENV="development"
#   PORT=3001

# Generate Prisma client
npx prisma generate

# Create and run database migrations
npx prisma migrate dev --name init

# Seed database with sample data
npm run db:seed

# Start the backend server
npm run dev
```

The backend should now be running at **http://localhost:3001**

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install all dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# The default settings should work:
#   NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start the frontend development server
npm run dev
```

The frontend should now be running at **http://localhost:3000**

### 4. Login to the System

Open your browser and navigate to **http://localhost:3000**

Use any of these test accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@archibus.com | password123 |
| **Supervisor** | supervisor@archibus.com | password123 |
| **Technician** | technician@archibus.com | password123 |
| **Requestor** | requestor@archibus.com | password123 |

## Testing the System

### Create a Service Request
1. Login as **requestor@archibus.com**
2. Click "Create Request"
3. Fill in the form:
   - Title: "Broken light in office"
   - Description: "Light fixture not working"
   - Priority: High
   - Location: Select site, building, floor, room
   - Problem Type: Select from dropdown
4. Click "Create Service Request"
5. Click "Submit Request" to move it from DRAFT to SUBMITTED

### Triage and Assign (as Supervisor)
1. Logout and login as **supervisor@archibus.com**
2. View the submitted request
3. Click "Triage" (SUBMITTED → TRIAGED)
4. Click "Assign" and select a technician
5. Request moves to ASSIGNED status

### Work on Request (as Technician)
1. Logout and login as **technician@archibus.com**
2. View the assigned request
3. Click "Start Work" (ASSIGNED → IN_PROGRESS)
4. Add comments about the work
5. Click "Complete" (IN_PROGRESS → COMPLETED)

### Close Request (as Supervisor)
1. Login as **supervisor@archibus.com**
2. View the completed request
3. Click "Close" (COMPLETED → CLOSED)

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Check port 3001 is not in use: `lsof -i :3001`

### Frontend won't start
- Check port 3000 is not in use: `lsof -i :3000`
- Verify NEXT_PUBLIC_API_URL in .env.local
- Clear Next.js cache: `rm -rf .next`

### Database errors
- Reset database: `npx prisma migrate reset` (WARNING: deletes all data)
- View database in Prisma Studio: `npm run db:studio`

### Cannot login
- Check backend is running and accessible
- Check browser console for errors
- Verify cookies are enabled
- Try different browser

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production server
npm test             # Run tests
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production server
npm run lint         # Run ESLint
```

## Next Steps

Once the system is running:

1. **Explore the UI**: Navigate through the service desk module
2. **Test workflows**: Try different user roles and status transitions
3. **Review the code**: Check the backend routes and frontend components
4. **Customize**: Modify fields, add new problem types, etc.
5. **Extend**: Add new features like file uploads, notifications, etc.

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Generate strong `SESSION_SECRET`
3. Use proper PostgreSQL credentials
4. Enable HTTPS/SSL
5. Set up proper CORS origins
6. Configure environment-specific variables
7. Set up database backups
8. Configure logging and monitoring

## Support

For issues or questions:
- Check the main README.md
- Review API documentation in README.md
- Check database schema in `backend/prisma/schema.prisma`
- Review TypeScript types in `frontend/src/lib/types.ts`

---

🎉 **Congratulations!** Your ARCHIBUS Service Desk system is now running!
