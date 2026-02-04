#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting RBAC System setup..."

# 1. Install Backend Dependencies
echo "📦 Installing backend dependencies..."
cd rbac-backend
npm install
cd ..

# 2. Install Frontend Dependencies
echo "📦 Installing frontend dependencies..."
cd rbac-frontend
npm install

# 3. Build Frontend
echo "🏗️  Building frontend..."
npm run build
cd ..

# 4. Copy Frontend Assets to Backend
echo "🚚 Copying frontend assets to backend..."
# Create public directory if not exists
mkdir -p rbac-backend/public
# Remove old files
rm -rf rbac-backend/public/*
# Copy new files
cp -r rbac-frontend/dist/* rbac-backend/public/

# 5. Kill existing backend process (if any)
echo "🔧 Stopping existing backend service..."
pkill -f "node dist/main.js" || true

# 6. Start Backend
echo "✅ Setup complete! Starting backend server..."
echo "🌐 Application will be available at http://localhost:3000"

# Auto-create database if not exists (ignore error if exists)
createdb -p 5438 -U postgres rbac_db || true

cd rbac-backend
export DB_PORT=5438
npm run start:prod
