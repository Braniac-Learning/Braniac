# Quiz AI App - Backend

This is the backend API server for the Quiz AI App. It provides:
- AI quiz generation using Google Gemini API
- Document processing (PDF/TXT uploads)
- Real-time multiplayer functionality via Socket.IO
- RESTful API endpoints

## 🚀 Quick Deploy

### Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Create "New Project" → "Deploy from GitHub repo"
4. Select this backend folder/repo
5. Add environment variable: `GEMINI_API_KEY`
6. Deploy!

### Alternative Platforms
- **Render**: [render.com](https://render.com)
- **Fly.io**: [fly.io](https://fly.io)
- **Heroku**: [heroku.com](https://heroku.com)

## ⚙️ Environment Variables

Required:
- `GEMINI_API_KEY` = `AIzaSyANt9WI56zqzUfP3M0p2gsLMkUfbFbUeWw`

Optional:
- `NODE_ENV` = `production`
- `PORT` = (auto-set by deployment platform)

## 🔧 CORS Configuration

**IMPORTANT**: After deploying the frontend, update the CORS origins in `server.js`:

1. Find the CORS configuration sections (lines ~30 and ~15)
2. Replace `'https://your-frontend-domain.netlify.app'` with your actual frontend URL
3. Redeploy the backend

## 📡 API Endpoints

- `GET /health` - Health check
- `POST /api/generate-quiz/topic` - Generate quiz from topic
- `POST /api/generate-quiz/document` - Generate quiz from uploaded document
- Socket.IO endpoints for multiplayer functionality

## 🔧 Local Development

```bash
npm install
npm start
```

Server runs on: `http://localhost:3001`

## 📁 Files Included

- `server.js` - Main server file
- `package.json` - Dependencies and scripts
- `railway.json` - Railway deployment config
- `api/` - Serverless function endpoints (for Vercel compatibility)
- Sample files for testing

## ✅ Features

- ✅ Google Gemini AI Integration
- ✅ PDF/TXT Document Processing
- ✅ Real-time Socket.IO Multiplayer
- ✅ Multiple Difficulty Levels
- ✅ RESTful API Design
- ✅ Production-ready Error Handling
- ✅ Health Check Endpoints
