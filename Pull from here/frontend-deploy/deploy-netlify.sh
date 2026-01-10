#!/bin/bash

# Frontend Deployment Script
echo "🚀 Preparing frontend for deployment..."

# Check if in frontend directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Make sure you're in the frontend directory."
    exit 1
fi

echo "✅ Frontend files found"
echo "📦 Creating deployment package..."

# Create a temporary deployment directory
mkdir -p ../frontend-deploy
cp -r * ../frontend-deploy/

echo "✅ Frontend package ready!"
echo ""
echo "📋 Next steps for Netlify deployment:"
echo "1. Go to https://netlify.com"
echo "2. Drag and drop the 'frontend-deploy' folder"
echo "3. Or connect GitHub and set build directory to 'frontend'"
echo "4. Copy your Netlify URL when deployed"
echo ""
echo "🔗 Your frontend package is in: ../frontend-deploy/"
