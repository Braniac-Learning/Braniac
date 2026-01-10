#!/bin/bash

# Quiz AI App Backend - Quick Deploy to Railway
echo "🚄 Deploying Quiz AI App Backend to Railway..."

# Check if in correct directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Make sure you're in the backend directory."
    exit 1
fi

echo "✅ Backend files found"
echo "📦 Installing dependencies..."

# Install dependencies
npm install

echo "🚀 Backend is ready for Railway deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://railway.app"
echo "2. Login with GitHub"
echo "3. Create New Project → Deploy from GitHub repo"
echo "4. Select this backend folder/repo"
echo "5. Add environment variable: GEMINI_API_KEY = AIzaSyANt9WI56zqzUfP3M0p2gsLMkUfbFbUeWw"
echo "6. Deploy!"
echo ""
echo "🔗 After deployment, copy your Railway URL to update the frontend!"
