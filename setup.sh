#!/bin/bash

# ARCHIBUS Service Desk - Quick Setup Script
# This script automates the setup process for both backend and frontend

set -e  # Exit on any error

echo "🏗️  ARCHIBUS Service Desk Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL CLI (psql) not found. Make sure PostgreSQL is installed.${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
fi

echo ""
echo "🗄️  Setting up database..."

# Prompt for database details
read -p "Enter PostgreSQL username [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password [postgres]: " DB_PASS
DB_PASS=${DB_PASS:-postgres}
echo ""

read -p "Enter database name [archibus_dev]: " DB_NAME
DB_NAME=${DB_NAME:-archibus_dev}

# Create database
echo "Creating database '$DB_NAME'..."
PGPASSWORD=$DB_PASS createdb -U $DB_USER $DB_NAME 2>/dev/null || echo "Database may already exist"

# Update .env file
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"

echo ""
echo "🔧 Setting up backend..."

cd backend

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cat > .env << EOF
DATABASE_URL="$DATABASE_URL"
SESSION_SECRET="$(openssl rand -base64 32 2>/dev/null || echo 'change-this-to-a-random-secure-string')"
NODE_ENV="development"
PORT=3001
HOST="0.0.0.0"
LOG_LEVEL="info"
FRONTEND_URL="http://localhost:3000"
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "Seeding database..."
npm run db:seed

echo -e "${GREEN}✓ Backend setup complete!${NC}"

cd ..

echo ""
echo "🎨 Setting up frontend..."

cd frontend

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF
    echo -e "${GREEN}✓ Created .env.local file${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local file already exists, skipping...${NC}"
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}✓ Frontend setup complete!${NC}"

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Sample Login Credentials:"
echo "   Admin:      admin@archibus.com / password123"
echo "   Supervisor: supervisor@archibus.com / password123"
echo "   Technician: technician@archibus.com / password123"
echo "   Requestor:  requestor@archibus.com / password123"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd backend"
echo "   $ npm run dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd frontend"
echo "   $ npm run dev"
echo ""
echo "   Then open http://localhost:3000 in your browser"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
