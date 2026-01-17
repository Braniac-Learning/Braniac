# Braniac Authentication System Documentation

## Overview
This document describes the complete authentication and user data persistence system for Braniac Learning Platform.

## Features
✅ **Complete Authentication System**
- User registration with validation
- Secure login with password hashing (scrypt)
- Session management with HTTP-only cookies
- Logout functionality

✅ **Persistent User Data**
- All user data stored in MongoDB database
- Fallback to in-memory storage if database unavailable
- Data syncs between frontend and backend
- No data loss on page refresh or server restart (when MongoDB connected)

✅ **User Data Tracked**
- Quiz scores and history
- Achievements and badges
- Total points earned
- Questions answered and correctness rate
- Current and longest streak
- Profile picture and bio
- Quiz statistics (quizzes taken, time spent, etc.)

## Architecture

### Backend (Node.js + Express + MongoDB)
**Location:** `/backend/server.js`

#### Collections:
1. **users** - User accounts (username, passwordHash, salt, firstName)
2. **sessions** - Active user sessions with auto-expiry (7 days)
3. **userData** - User progress, scores, achievements, profile data

#### API Endpoints:

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login existing user  
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info + data

**User Data:**
- `GET /api/user/data` - Get all user data
- `POST /api/user/data` - Save/update user data
- `POST /api/user/score` - Submit quiz score (auto-updates stats)
- `POST /api/user/achievements` - Update achievements
- `POST /api/user/profile` - Update profile (picture, bio)

### Frontend (Vanilla JavaScript)
**Location:** `/frontend-deploy/auth-api.js`

#### AuthAPI Class Methods:
- `register(username, firstName, password, confirmPassword)`
- `login(username, password)`
- `logout()`
- `getCurrentUser()`
- `getUserData()`
- `saveUserData(data)`
- `submitScore(scoreData)`
- `updateAchievements(achievements)`
- `updateProfile(profileData)`

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

Required packages:
- `express` - Web server
- `mongodb` - Database driver
- `cookie-parser` - Session cookies
- `dotenv` - Environment variables
- `cors` - Cross-origin requests
- `socket.io` - Real-time multiplayer
- `multer` - File uploads
- `pdf-parse` - PDF processing

### 2. Configure MongoDB

#### Option A: MongoDB Atlas (Cloud - Recommended for Production)
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster (M0 tier)
3. Create database user with password
4. Whitelist your IP address (or 0.0.0.0/0 for development)
5. Get connection string from "Connect" > "Connect your application"
6. Update `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/braniac_db?retryWrites=true&w=majority
DB_NAME=braniac_db
```

#### Option B: Local MongoDB
1. Install MongoDB Community Edition
   - macOS: `brew install mongodb-community`
   - Windows: Download from mongodb.com
   - Linux: Use package manager

2. Start MongoDB service:
   - macOS: `brew services start mongodb-community`
   - Windows: Run MongoDB as service
   - Linux: `sudo systemctl start mongod`

3. Update `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=braniac_db
```

### 3. Environment Variables
Create `/backend/.env` file (already created):

```env
# Gemini API Key
GEMINI_API_KEY=your-gemini-api-key

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017
# OR for Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/braniac_db

# Database Name
DB_NAME=braniac_db

# Session Secret (generate random string)
SESSION_SECRET=your-secure-random-secret

# Server Config
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

### 4. Update Frontend API URL
In `/frontend-deploy/auth-api.js`, update for production:

```javascript
const API_BASE_URL = 'http://localhost:3001'; // Development
// const API_BASE_URL = 'https://your-backend-domain.com'; // Production
```

### 5. Start the Application

**Backend:**
```bash
cd backend
npm start
# Or for development with auto-reload:
npm run dev
```

**Frontend:**
```bash
cd frontend-deploy
# Serve with any static file server
python3 -m http.server 8080
# OR
npx serve
```

## Usage Examples

### Register User
```javascript
// Frontend
await authAPI.register('johndoe', 'John', 'password123', 'password123');
```

### Login User
```javascript
// Frontend
await authAPI.login('johndoe', 'password123');
```

### Submit Quiz Score
```javascript
// After completing a quiz
await authAPI.submitScore({
    topic: 'JavaScript Basics',
    score: 85,
    totalQuestions: 10,
    correctAnswers: 8,
    difficulty: 'intermediate',
    timeSpent: 300 // seconds
});
```

### Update Profile
```javascript
await authAPI.updateProfile({
    profilePicture: 'data:image/jpeg;base64,...',
    bio: 'Passionate learner'
});
```

### Get User Data
```javascript
const userData = await authAPI.getUserData();
console.log(userData.data.scores); // All quiz scores
console.log(userData.data.totalPoints); // Total points
console.log(userData.data.currentStreak); // Current streak
```

## Data Models

### User Document
```javascript
{
    username: 'johndoe',
    firstName: 'John',
    passwordHash: 'hashed_password',
    salt: 'random_salt',
    createdAt: Date
}
```

### UserData Document
```javascript
{
    username: 'johndoe',
    scores: [{
        topic: 'JavaScript',
        score: 85,
        totalQuestions: 10,
        correctAnswers: 8,
        difficulty: 'intermediate',
        date: Date,
        timeSpent: 300
    }],
    achievements: ['first-steps', 'warm-up', 'curious-mind'],
    totalPoints: 450,
    questionsAnswered: 50,
    correctAnswers: 42,
    quizzesTaken: 5,
    currentStreak: 3,
    longestStreak: 7,
    lastQuizDate: Date,
    profilePicture: 'assets/icons/guest.svg',
    bio: 'Learning enthusiast',
    updatedAt: Date
}
```

## Security Features

1. **Password Security**
   - Passwords hashed using Node.js crypto.scrypt
   - Unique random salt per user
   - Timing-safe comparison to prevent timing attacks

2. **Session Management**
   - HTTP-only cookies (not accessible via JavaScript)
   - HMAC-based session tokens
   - Auto-expiry after 7 days
   - Secure cookie options in production

3. **Input Validation**
   - Username: 3-30 chars, alphanumeric + hyphens/underscores
   - First name: Letters, spaces, hyphens only
   - Password: Min 8 chars, no spaces

4. **CORS Protection**
   - Configured allowed origins
   - Credentials included for cookies
   - Production domains whitelisted

## Troubleshooting

### MongoDB Connection Failed
- **Symptom:** Server starts but shows "Running without database"
- **Solution:** 
  - Check MongoDB is running
  - Verify MONGODB_URI in .env
  - For Atlas: Check IP whitelist and credentials
  - System falls back to in-memory storage (data lost on restart)

### Authentication Not Working
- **Symptom:** Login/register fails
- **Solutions:**
  - Check backend server is running on port 3001
  - Verify API_BASE_URL in auth-api.js matches backend
  - Check browser console for CORS errors
  - Ensure cookies are enabled in browser

### Data Not Persisting
- **Symptom:** Data lost after logout or refresh
- **Solutions:**
  - Verify MongoDB connection is successful
  - Check backend logs for database errors
  - Ensure you're logged in as user (not guest)
  - Guest mode uses localStorage only (temporary)

### CORS Errors
- **Symptom:** "CORS policy blocked" in browser console
- **Solutions:**
  - Add frontend URL to CORS origins in server.js
  - Ensure credentials: 'include' in fetch requests
  - Check backend CORS configuration matches frontend origin

## Production Deployment

### Backend Deployment (Railway/Render/Fly.io)
1. Set environment variables in hosting platform
2. Update CORS origins to include production frontend URL
3. Use MongoDB Atlas connection string
4. Enable HTTPS/SSL
5. Set NODE_ENV=production

### Frontend Deployment (Netlify/Vercel)
1. Update API_BASE_URL to production backend URL
2. Build and deploy static files
3. Configure redirects if needed
4. Ensure CORS headers allow frontend domain

## Testing

Test the complete flow:

1. **Register:** Create new account
2. **Login:** Sign in with credentials
3. **Take Quiz:** Complete a quiz
4. **Check Scores:** Verify score saved in scores page
5. **Update Profile:** Change picture/bio
6. **Logout:** Sign out
7. **Login Again:** Verify data persists

## Support

For issues or questions:
- Check MongoDB connection status in backend logs
- Review browser console for frontend errors
- Verify all environment variables are set
- Ensure backend and frontend servers are running
- Test API endpoints directly with Postman/curl

## License
MIT License - See LICENSE file
