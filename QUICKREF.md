# Developer Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Setup (one time)
./setup.sh

# Start Backend
cd backend && npm run dev

# Start Frontend  
cd frontend && npm run dev

# Run Tests
cd backend && npm test

# View Database
cd backend && npm run db:studio
```

## 📦 Project Locations

```
Backend:  /Users/iffahrosani/Desktop/Main_Code/archibus-dev/backend
Frontend: /Users/iffahrosani/Desktop/Main_Code/archibus-dev/frontend
Docs:     /Users/iffahrosani/Desktop/Main_Code/archibus-dev/*.md
```

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@archibus.com | password123 |
| Supervisor | supervisor@archibus.com | password123 |
| Technician | technician@archibus.com | password123 |
| Requestor | requestor@archibus.com | password123 |

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Prisma Studio: http://localhost:5555 (when running db:studio)

## 🗄️ Database Quick Commands

```bash
cd backend

# Create migration
npx prisma migrate dev --name my_migration

# Reset database (DANGER: deletes all data)
npx prisma migrate reset

# Seed data
npm run db:seed

# Generate Prisma client
npx prisma generate

# View data
npm run db:studio
```

## 📝 Common Tasks

### Add New Endpoint
1. Define schema in `backend/src/schemas/index.ts`
2. Add route in `backend/src/routes/*.ts`
3. Add RBAC guard: `preHandler: [authenticate, requireRoles(['ADMIN'])]`
4. Add to API client: `frontend/src/lib/api.ts`
5. Define types: `frontend/src/lib/types.ts`

### Add New Field to SR
1. Update `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field`
3. Update Zod schemas in `backend/src/schemas/index.ts`
4. Update types in `frontend/src/lib/types.ts`
5. Update UI components

### Add New Role
1. Seed role in `backend/prisma/seed.ts`
2. Add to `RoleName` type in `backend/src/plugins/rbac.ts`
3. Update permissions in route guards
4. Update frontend role checks

## 🔄 Service Request Status Flow

```
DRAFT → SUBMITTED → TRIAGED → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
         ↓            ↓           ↓
      CANCELLED   CANCELLED   CANCELLED
```

## 🎨 Frontend Component Locations

```
Pages:      src/app/
Components: src/components/
Contexts:   src/contexts/
API Client: src/lib/api.ts
Types:      src/lib/types.ts
Styles:     src/app/globals.css
```

## 🔧 Backend Structure

```
Plugins:  src/plugins/     (auth, rbac, db)
Routes:   src/routes/      (auth, service-requests, reference-data)
Schemas:  src/schemas/     (Zod validation)
Utils:    src/utils/       (sr-number generator)
Database: prisma/          (schema, migrations, seed)
Tests:    src/__tests__/   (unit tests)
```

## 🐛 Debugging

### Backend Not Starting
```bash
# Check PostgreSQL
pg_isready

# Check port
lsof -i :3001

# Check logs
cd backend && npm run dev
```

### Frontend Not Starting
```bash
# Check port
lsof -i :3000

# Clear cache
rm -rf frontend/.next

# Reinstall
cd frontend && rm -rf node_modules && npm install
```

### Database Issues
```bash
# Check connection
cd backend
npx prisma db pull

# Reset (nuclear option)
npx prisma migrate reset
npm run db:seed
```

### Authentication Issues
- Clear browser cookies
- Check SESSION_SECRET in backend/.env
- Verify backend is running
- Check CORS settings in backend/src/server.ts

## 📊 Testing

```bash
# Run all tests
cd backend && npm test

# Run specific test
cd backend && npm test workflow.test.ts

# Add new test
# Create file in backend/src/__tests__/
# Import { describe, it, expect } from 'vitest'
```

## 🔐 Security Checklist for Production

- [ ] Change SESSION_SECRET to random string
- [ ] Use environment-specific DATABASE_URL
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Enable security headers
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Use strong passwords
- [ ] Implement OIDC/SSO
- [ ] Add logging
- [ ] Set up error tracking

## 📖 Documentation Quick Links

- Full Setup: `SETUP.md`
- API Reference: `API.md`
- Main README: `README.md`
- Project Summary: `PROJECT_SUMMARY.md`

## 🆘 Common Errors & Solutions

**"Cannot find module '@prisma/client'"**
```bash
cd backend && npx prisma generate
```

**"Port 3001 already in use"**
```bash
lsof -i :3001  # Find process
kill -9 <PID>  # Kill it
```

**"Database does not exist"**
```bash
createdb archibus_dev
cd backend && npx prisma migrate dev
```

**"CORS error in browser"**
- Check FRONTEND_URL in backend/.env
- Check origin in backend/src/server.ts

**"TypeScript errors everywhere"**
```bash
# Install dependencies first!
cd backend && npm install
cd ../frontend && npm install
```

## 💡 Pro Tips

1. Use `npm run dev` instead of `npm start` for hot reload
2. Prisma Studio is great for quick data inspection
3. Check browser DevTools Network tab for API errors
4. Use `console.log` liberally during development
5. Git commit after each working feature
6. Read error messages carefully - they're usually helpful
7. Test with different user roles
8. Use the seed data for quick testing

## 🎯 Next Steps

After setup works:
1. Create a service request as requestor
2. Submit it
3. Login as supervisor and triage/assign
4. Login as technician and complete
5. Add comments at each step
6. Check audit trail

Then start customizing!

---

Keep this card handy! 📌
