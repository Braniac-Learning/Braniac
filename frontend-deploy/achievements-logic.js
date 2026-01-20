// Achievement System Logic for Braniac
const API_BASE = window.API_BASE || 'https://braniac-backend.onrender.com';

// Achievement definitions matching the HTML
const ACHIEVEMENTS = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first quiz',
    check: (stats) => stats.quizzesTaken >= 1,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 1)} / 1`,
    hint: 'Try any quiz to get started'
  },
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    description: 'Explore 3 different subjects',
    check: (stats) => (stats.uniqueSubjects || 0) >= 3,
    progress: (stats) => `${Math.min(stats.uniqueSubjects || 0, 3)} / 3`,
    hint: 'Try learning something new'
  },
  {
    id: 'warm-up',
    name: 'Warm-Up',
    description: 'Answer 10 questions total',
    check: (stats) => stats.questionsAnswered >= 10,
    progress: (stats) => `${Math.min(stats.questionsAnswered, 10)} / 10`,
    hint: 'Keep answering questions'
  },
  {
    id: 'logic-learner',
    name: 'Logic Learner',
    description: 'Complete 5 logic quizzes',
    check: (stats) => (stats.logicQuizzes || 0) >= 5,
    progress: (stats) => `${Math.min(stats.logicQuizzes || 0, 5)} / 5`,
    hint: 'Try logic-based quizzes'
  },
  {
    id: 'consistent-starter',
    name: 'Consistent Starter',
    description: 'Learn on 3 different days',
    check: (stats) => (stats.learningDays || 0) >= 3,
    progress: (stats) => `${Math.min(stats.learningDays || 0, 3)} / 3`,
    hint: 'Come back tomorrow'
  },
  {
    id: 'knowledge-grinder',
    name: 'Knowledge Grinder',
    description: 'Complete 50 quizzes',
    check: (stats) => stats.quizzesTaken >= 50,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 50)} / 50`,
    hint: 'Keep grinding quizzes'
  },
  {
    id: 'logic-master',
    name: 'Logic Master',
    description: 'Complete 25 logic quizzes',
    check: (stats) => (stats.logicQuizzes || 0) >= 25,
    progress: (stats) => `${Math.min(stats.logicQuizzes || 0, 25)} / 25`,
    hint: 'Logic quizzes reward precision'
  },
  {
    id: 'perfect-streak',
    name: 'Perfect Streak',
    description: 'Get 15 answers correct in a row',
    check: (stats) => (stats.maxConsecutiveCorrect || 0) >= 15,
    progress: (stats) => `${Math.min(stats.maxConsecutiveCorrect || 0, 15)} / 15`,
    hint: 'Slow down and double-check answers'
  },
  {
    id: 'subject-specialist',
    name: 'Subject Specialist',
    description: 'Master one subject completely',
    check: (stats) => (stats.masteredSubjects || []).length >= 1,
    progress: (stats) => `${Math.min((stats.masteredSubjects || []).length, 1)} / 1`,
    hint: 'Score 100% on a quiz'
  },
  {
    id: 'iron-mind',
    name: 'Iron Mind',
    description: 'Study for 7 consecutive days',
    check: (stats) => stats.currentStreak >= 7,
    progress: (stats) => `${Math.min(stats.currentStreak, 7)} / 7`,
    hint: 'Don\'t break your streak'
  },
  {
    id: 'knowledge-architect',
    name: 'Knowledge Architect',
    description: 'Complete 100 quizzes',
    check: (stats) => stats.quizzesTaken >= 100,
    progress: (stats) => `${Math.min(stats.quizzesTaken, 100)} / 100`,
    hint: 'Only quizzes you score 80%+ on count'
  },
  {
    id: 'braniac-elite',
    name: 'Braniac Elite',
    description: 'Unlock all achievements',
    check: (stats, unlockedCount) => unlockedCount >= 11,
    progress: (stats, unlockedCount) => `${unlockedCount} / 11`,
    hint: 'Complete all other achievements'
  }
];

// Calculate stats from user data
function calculateStats(userData) {
  const scores = userData.scores || [];
  
  return {
    quizzesTaken: userData.quizzesTaken || scores.length,
    questionsAnswered: userData.questionsAnswered || 0,
    correctAnswers: userData.correctAnswers || 0,
    currentStreak: userData.currentStreak || 0,
    longestStreak: userData.longestStreak || 0,
    uniqueSubjects: (userData.uniqueSubjects || []).length,
    learningDays: (userData.learningDays || []).length,
    logicQuizzes: userData.logicQuizzes || 0,
    perfectScores: userData.perfectScores || 0,
    maxConsecutiveCorrect: userData.maxConsecutiveCorrect || 0,
    masteredSubjects: userData.masteredSubjects || []
  };
}

// Check achievements and update UI
async function updateAchievementsUI() {
  try {
    console.log('🏆 Loading achievements...');
    
    // Fetch user data from backend
    const response = await fetch(`${API_BASE}/api/user/data`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      console.log('⚠️ No user data available');
      return;
    }

    const data = await response.json();
    if (!data.ok || !data.data) {
      console.log('⚠️ Invalid user data response');
      return;
    }

    const userData = data.data;
    const stats = calculateStats(userData);
    console.log('📊 User stats:', stats);

    // Check each achievement
    let unlockedCount = 0;
    const unlockedAchievements = [];
    const lockedAchievements = [];

    ACHIEVEMENTS.forEach(achievement => {
      const isUnlocked = achievement.check(stats, unlockedCount);
      if (isUnlocked) {
        unlockedCount++;
        unlockedAchievements.push({
          ...achievement,
          progress: achievement.progress(stats, unlockedCount)
        });
      } else {
        lockedAchievements.push({
          ...achievement,
          progress: achievement.progress(stats, unlockedCount)
        });
      }
    });

    console.log(`✅ ${unlockedCount} achievements unlocked`);
    console.log(`🔒 ${lockedAchievements.length} achievements locked`);

    // Update the "obtained" section
    const obtainedSection = document.getElementById('obtained');
    if (obtainedSection && unlockedAchievements.length > 0) {
      obtainedSection.innerHTML = unlockedAchievements.map(a => 
        createAchievementCardHTML(a, true)
      ).join('');
    }

    // Update the "unobtained" section
    const unobtainedSection = document.getElementById('unobtained');
    if (unobtainedSection && lockedAchievements.length > 0) {
      unobtainedSection.innerHTML = lockedAchievements.map(a => 
        createAchievementCardHTML(a, false)
      ).join('');
    }

    // Show/hide no data view
    const noDataView = document.getElementById('noDataView');
    if (noDataView) {
      if (unlockedCount === 0) {
        noDataView.classList.remove('hidden');
      } else {
        noDataView.classList.add('hidden');
      }
    }

    // Re-attach accordion listeners
    attachAccordionListeners();

    // Store achievements in localStorage for the existing code
    localStorage.setItem('userAchievements', JSON.stringify(unlockedAchievements.map(a => a.id)));

  } catch (error) {
    console.error('❌ Error updating achievements:', error);
  }
}

// Create achievement card HTML
function createAchievementCardHTML(achievement, isObtained) {
  const status = isObtained ? '✓' : '◌';
  const className = isObtained ? 'obtained' : 'unobtained';
  
  // Calculate progress percentage for ring
  const progressMatch = achievement.progress.match(/(\d+)\s*\/\s*(\d+)/);
  const percentage = progressMatch 
    ? (parseInt(progressMatch[1]) / parseInt(progressMatch[2])) * 100 
    : (isObtained ? 100 : 0);
  
  // SVG circle calculations (radius 40, circumference = 2πr)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return `
    <div class="achievement-card ${className}">
      <div class="card-main">
        <div class="badge-icon-wrapper">
          ${!isObtained ? `
          <svg class="progress-ring" width="90" height="90">
            <defs>
              <linearGradient id="progress-gradient-${achievement.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#EE247C;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#FE77AA;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle class="progress-ring-circle-bg" cx="45" cy="45" r="${radius}"></circle>
            <circle class="progress-ring-circle" 
                    cx="45" cy="45" r="${radius}"
                    style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}; stroke: url(#progress-gradient-${achievement.id});"
                    data-percentage="${percentage}"></circle>
          </svg>
          ` : ''}
          <div class="badge-icon">
            <img src="assets/icons/achievements/${achievement.id}.svg" 
                 alt="${achievement.name}"
                 onerror="this.src='assets/icons/achievements/default.svg'">
          </div>
        </div>
        <div class="card-text">
          <strong>${achievement.name}</strong>
          <span>${achievement.description}</span>
        </div>
        <span class="status">${status}</span>
      </div>
      <div class="card-details">
        <p><strong>Progress:</strong> ${achievement.progress} ${!isObtained ? `(${Math.round(percentage)}%)` : ''}</p>
        ${!isObtained ? `<p><strong>Hint:</strong> ${achievement.hint}</p>` : ''}
      </div>
    </div>
  `;
}

// Attach accordion click listeners
function attachAccordionListeners() {
  document.querySelectorAll('.achievement-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('open');
    });
  });
}

// Initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Achievement system initializing...');
    updateAchievementsUI();
  });

  // Refresh achievements when page gets focus
  window.addEventListener('focus', () => {
    console.log('🔄 Page focused, refreshing achievements...');
    updateAchievementsUI();
  });

  // Listen for score updates
  window.addEventListener('storage', (e) => {
    if (e.key === 'braniacSession') {
      console.log('🔄 Session updated, refreshing achievements...');
      updateAchievementsUI();
    }
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateAchievementsUI, calculateStats, ACHIEVEMENTS };
}
