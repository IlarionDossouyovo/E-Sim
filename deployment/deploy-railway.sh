#!/bin/bash
# E-Sim By ELECTRON - Deploy Script for Railway.app

set -e

echo "🚀 Deploying E-Sim to Railway..."

# Check prerequisites
command - node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command - npm >/dev/null 2>&1 || { echo "npm is required but not installed."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install

# Build
echo "🔨 Building application..."
cd .. && npm run build

# Login to Railway
echo "🔐 Logging into Railway..."
railway login --token $RAILWAY_TOKEN

# Create project
echo "📁 Creating Railway project..."
railway init --name esim-electron --template node

# Set environment variables
echo "⚙️ Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$JWT_SECRET
railway variables set DATABASE_URL=$DATABASE_URL
railway variables set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY

# Deploy
echo "🚀 Deploying to Railway..."
railway deploy --detach

# Get URL
echo "✅ Deployment complete!"
railway open

echo ""
echo "🌐 Your app is live at: https://esim-electron.up.railway.app"