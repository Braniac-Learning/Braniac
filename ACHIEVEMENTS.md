# Braniac Achievement System

## Overview
The achievement system dynamically tracks user progress and unlocks achievements based on quiz completion, accuracy, streaks, and other metrics.

## How It Works

### Backend Tracking
The backend (`backend/server.js`) tracks these statistics for each user:
- `quizzesTaken` - Total quizzes completed
- `totalPoints` - Cumulative score points
- `questionsAnswered` - Total questions answered
- `correctAnswers` - Total correct answers
- `perfectScores` - Number of 100% quiz scores
- `logicQuizzes` - Number of logic-themed quizzes
- `currentStreak` - Current daily learning streak
- `longestStreak` - Longest ever daily streak
- `lastQuizDate` - Last quiz completion date

### Frontend Display
The frontend (`frontend-deploy/achievements-logic.js`) calculates which achievements are unlocked and displays them dynamically.

## Available Achievements

### Getting Started
1. **First Steps** - Complete your first quiz (1 quiz)
2. **Curious Mind** - Complete 5 quizzes (5 quizzes)
3. **Knowledge Seeker** - Complete 10 quizzes (10 quizzes)

### Logic Master
4. **Logic Novice** - Complete 5 logic quizzes (5 logic quizzes)
5. **Logic Expert** - Complete 25 logic quizzes (25 logic quizzes)

### Perfectionist
6. **Flawless Victory** - Get 100% on any quiz (1 perfect score)
7. **Perfectionist** - Get 100% on 5 quizzes (5 perfect scores)

### Dedicated Learner (Streaks)
8. **3-Day Streak** - Learn for 3 days in a row (3-day streak)
9. **7-Day Streak** - Learn for 7 days in a row (7-day streak)
10. **30-Day Streak** - Learn for 30 days in a row (30-day streak)

### Milestones
11. **Half Century** - Complete 50 quizzes (50 quizzes)
12. **Centurion** - Complete 100 quizzes (100 quizzes)

## Achievement Features

### Dynamic Progress Tracking
- Each achievement shows real-time progress (e.g., "3 / 5")
- Progress updates automatically after each quiz
- Locked achievements display hints

### Visual Indicators
- ✓ - Unlocked/Obtained achievements
- 🔒 - Locked/Unobtained achievements
- Badge icons for each achievement

### Auto-Refresh
- Achievements automatically refresh when:
  - Page loads
  - Window gets focus
  - User completes a quiz

## Technical Details

### Data Flow
1. User completes quiz
2. Backend receives score via `POST /api/user/score`
3. `updateUserScore()` function updates statistics
4. Stats saved to MongoDB `userData` collection
5. Frontend fetches updated data via `GET /api/user/data`
6. `loadAndRenderAchievements()` calculates unlocked achievements
7. Achievement cards dynamically rendered in HTML

### Streak Logic
- Streaks increment if quiz completed day after last quiz
- Streaks reset if gap > 1 day
- Multiple quizzes same day don't break streak

### Perfect Score Detection
- Triggers when `score === 100` OR `correctAnswers === totalQuestions`
- Tracked in `userData.perfectScores`

### Logic Quiz Detection
- Triggers when quiz topic includes "logic" (case-insensitive)
- Tracked in `userData.logicQuizzes`

## Files Modified

### Backend
- `backend/server.js`
  - Added `perfectScores` and `logicQuizzes` tracking
  - Enhanced `updateUserScore()` function
  - Added logging for achievement-related events

### Frontend
- `frontend-deploy/achievements-logic.js` (NEW)
  - Achievement definitions with requirements
  - Stats calculation from user data
  - Achievement checking logic
  - Dynamic rendering functions
  - Accordion click handlers
  
- `frontend-deploy/achievements.html`
  - Removed static achievement cards
  - Added dynamic containers for obtained/unobtained
  - Linked to achievements-logic.js

## Future Enhancements

### Possible Additions
- Achievement unlock notifications/toasts
- Achievement unlock sound effects
- Share achievements on social media
- Rare/secret achievements
- Achievement badges on profile
- Achievement leaderboard
- Time-based achievements (speed demon)
- Category-specific mastery achievements
- Community achievements

### Extended Tracking
- Track quiz categories/topics completed
- Track time spent learning
- Track accuracy percentage trends
- Track improvement over time
- Track consecutive perfect scores
- Track hardest difficulty mastered

## Database Schema

```javascript
userData: {
  username: String,
  scores: [
    {
      topic: String,
      score: Number,
      totalQuestions: Number,
      correctAnswers: Number,
      difficulty: String,
      quizType: String,
      date: Date,
      timeSpent: Number
    }
  ],
  achievements: Array, // Reserved for future use
  totalPoints: Number,
  questionsAnswered: Number,
  correctAnswers: Number,
  quizzesTaken: Number,
  currentStreak: Number,
  longestStreak: Number,
  perfectScores: Number, // NEW
  logicQuizzes: Number, // NEW
  lastQuizDate: Date
}
```

## Testing

To test achievements:
1. Complete a quiz to unlock "First Steps"
2. Complete 5 quizzes to unlock "Curious Mind"
3. Get 100% on a quiz to unlock "Flawless Victory"
4. Complete quizzes on consecutive days to build streaks
5. Check achievements page to see progress

## Notes

- Achievements are calculated on-the-fly from user statistics
- No separate achievement unlock records (yet)
- All users start with zero achievements
- Guest accounts can earn achievements but will lose them on logout
- Achievement progress persists in MongoDB for registered users
