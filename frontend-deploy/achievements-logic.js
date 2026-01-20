// Achievement System for Braniac
// Dynamically tracks and unlocks achievements based on user progress

const ACHIEVEMENTS = [
  // Getting Started
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first quiz',
    category: 'Getting Started',
    icon: 'assets/icons/achievements/first-steps.svg',
    requirement: (stats) => stats.quizzesTaken >= 1,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 1)} / 1`
  },
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    description: 'Complete 5 quizzes',
    category: 'Getting Started',
    icon: 'assets/icons/achievements/curious-mind.svg',
    requirement: (stats) => stats.quizzesTaken >= 5,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 5)} / 5`
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Complete 10 quizzes',
    category: 'Getting Started',
    icon: 'assets/icons/achievements/knowledge-seeker.svg',
    requirement: (stats) => stats.quizzesTaken >= 10,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 10)} / 10`
  },
  
  // Logic Master
  {
    id: 'logic-novice',
    name: 'Logic Novice',
    description: 'Complete 5 logic quizzes',
    category: 'Logic Master',
    icon: 'assets/icons/achievements/logic-novice.svg',
    requirement: (stats) => (stats.logicQuizzes || 0) >= 5,
    progress: (stats) => `${Math.min(stats.logicQuizzes || 0, 5)} / 5`
  },
  {
    id: 'logic-expert',
    name: 'Logic Expert',
    description: 'Complete 25 logic quizzes',
    category: 'Logic Master',
    icon: 'assets/icons/achievements/logic-expert.svg',
    requirement: (stats) => (stats.logicQuizzes || 0) >= 25,
    progress: (stats) => `${Math.min(stats.logicQuizzes || 0, 25)} / 25`
  },
  
  // Perfectionist
  {
    id: 'flawless-victory',
    name: 'Flawless Victory',
    description: 'Get 100% on any quiz',
    category: 'Perfectionist',
    icon: 'assets/icons/achievements/flawless-victory.svg',
    requirement: (stats) => (stats.perfectScores || 0) >= 1,
    progress: (stats) => `${Math.min(stats.perfectScores || 0, 1)} / 1`
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 100% on 5 quizzes',
    category: 'Perfectionist',
    icon: 'assets/icons/achievements/perfectionist.svg',
    requirement: (stats) => (stats.perfectScores || 0) >= 5,
    progress: (stats) => `${Math.min(stats.perfectScores || 0, 5)} / 5`
  },
  
  // Dedicated Learner
  {
    id: '3-day-streak',
    name: '3-Day Streak',
    description: 'Learn for 3 days in a row',
    category: 'Dedicated Learner',
    icon: 'assets/icons/achievements/3-day-streak.svg',
    requirement: (stats) => stats.currentStreak >= 3,
    progress: (stats) => `${Math.min(stats.currentStreak, 3)} / 3`
  },
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    description: 'Learn for 7 days in a row',
    category: 'Dedicated Learner',
    icon: 'assets/icons/achievements/7-day-streak.svg',
    requirement: (stats) => stats.currentStreak >= 7,
    progress: (stats) => `${Math.min(stats.currentStreak, 7)} / 7`
  },
  {
    id: '30-day-streak',
    name: '30-Day Streak',
    description: 'Learn for 30 days in a row',
    category: 'Dedicated Learner',
    icon: 'assets/icons/achievements/30-day-streak.svg',
    requirement: (stats) => stats.currentStreak >= 30,
    progress: (stats) => `${Math.min(stats.currentStreak, 30)} / 30`
  },
  
  // Milestone
  {
    id: 'half-century',
    name: 'Half Century',
    description: 'Complete 50 quizzes',
    category: 'Milestone',
    icon: 'assets/icons/achievements/half-century.svg',
    requirement: (stats) => stats.quizzesTaken >= 50,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 50)} / 50`
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 quizzes',
    category: 'Milestone',
    icon: 'assets/icons/achievements/centurion.svg',
    requirement: (stats) => stats.quizzesTaken >= 100,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 100)} / 100`
  }
];

// Calculate user statistics from scores
function calculateStats(userData) {
  const scores = userData.scores || [];
  
  const stats = {
    quizzesTaken: userData.quizzesTaken || scores.length,
    totalPoints: userData.totalPoints || 0,
    questionsAnswered: userData.questionsAnswered || 0,
    correctAnswers: userData.correctAnswers || 0,
    currentStreak: userData.currentStreak || 0,
    longestStreak: userData.longestStreak || 0,
    perfectScores: 0,
    logicQuizzes: 0
  };
  
  // Count perfect scores and logic quizzes
  scores.forEach(score => {
    if (score.score === 100 || score.correctAnswers === score.totalQuestions) {
      stats.perfectScores++;
    }
    
    if (score.topic && score.topic.toLowerCase().includes('logic')) {
      stats.logicQuizzes++;
    }
  });
  
  return stats;
}

// Check which achievements are unlocked
function checkAchievements(stats) {
  const unlocked = [];
  const locked = [];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (achievement.requirement(stats)) {
      unlocked.push({
        ...achievement,
        progress: achievement.progress(stats),
        obtained: true
      });
    } else {
      locked.push({
        ...achievement,
        progress: achievement.progress(stats),
        obtained: false
      });
    }
  });
  
  return { unlocked, locked };
}

// Render achievement card
function renderAchievementCard(achievement) {
  return `
    <div class="achievement-card ${achievement.obtained ? 'obtained' : 'unobtained'}">
      <div class="card-main">
        <div class="badge-icon">
          <img src="${achievement.icon}" alt="${achievement.name}">
        </div>
        <div class="card-text">
          <strong>${achievement.name}</strong>
          <span>${achievement.description}</span>
        </div>
        <span class="status">${achievement.obtained ? '✓' : '🔒'}</span>
      </div>
      
      <div class="card-details">
        <p><strong>Category:</strong> ${achievement.category}</p>
        <p><strong>Progress:</strong> ${achievement.progress}</p>
        ${!achievement.obtained ? `<p><strong>Hint:</strong> ${getHint(achievement.id)}</p>` : ''}
      </div>
    </div>
  `;
}

// Get hints for locked achievements
function getHint(achievementId) {
  const hints = {
    'first-steps': 'Try any quiz to get started',
    'curious-mind': 'Complete more quizzes',
    'knowledge-seeker': 'Keep learning and taking quizzes',
    'logic-novice': 'Try logic-based quizzes',
    'logic-expert': 'Master logic quizzes',
    'flawless-victory': 'Get a perfect score on any quiz',
    'perfectionist': 'Aim for 100% on multiple quizzes',
    '3-day-streak': 'Take a quiz every day',
    '7-day-streak': 'Maintain your daily streak',
    '30-day-streak': 'Keep your learning streak alive',
    'half-century': 'Keep grinding quizzes',
    'centurion': 'The journey to 100 quizzes'
  };
  
  return hints[achievementId] || 'Keep playing to unlock';
}

// Load and render achievements
async function loadAndRenderAchievements() {
  try {
    const session = JSON.parse(localStorage.getItem('braniacSession'));
    let userData = {};
    
    // Load user data from backend if logged in
    if (session && session.type === 'user') {
      try {
        const API_BASE = window.API_BASE || 'https://braniac-backend.onrender.com';
        const response = await fetch(`${API_BASE}/api/user/data`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.data) {
            userData = data.data;
            console.log('✅ Loaded user data for achievements');
          }
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      }
    }
    
    // Calculate stats and check achievements
    const stats = calculateStats(userData);
    const { unlocked, locked } = checkAchievements(stats);
    
    console.log('📊 Stats:', stats);
    console.log('🏆 Unlocked:', unlocked.length, 'Locked:', locked.length);
    
    // Render obtained achievements
    const obtainedList = document.querySelector('#obtained .achievement-list') || 
                         document.getElementById('obtained');
    if (obtainedList) {
      obtainedList.innerHTML = unlocked.map(a => renderAchievementCard(a)).join('');
    }
    
    // Render unobtained achievements
    const unobtainedList = document.querySelector('#unobtained .achievement-list') ||
                           document.getElementById('unobtained');
    if (unobtainedList) {
      unobtainedList.innerHTML = locked.map(a => renderAchievementCard(a)).join('');
    }
    
    // Show/hide no data message
    const noDataView = document.getElementById('noDataView');
    if (noDataView) {
      if (unlocked.length === 0) {
        noDataView.classList.remove('hidden');
      } else {
        noDataView.classList.add('hidden');
      }
    }
    
  } catch (error) {
    console.error('❌ Error rendering achievements:', error);
  }
}

// Initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    loadAndRenderAchievements();
    
    // Add click handlers for accordion functionality
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.achievement-card');
      if (card) {
        card.classList.toggle('open');
      }
    });
  });
  
  // Refresh achievements when page gets focus
  window.addEventListener('focus', loadAndRenderAchievements);
}
