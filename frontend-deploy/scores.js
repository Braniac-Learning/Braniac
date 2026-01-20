document.addEventListener('DOMContentLoaded', () => {
  // Check session first
  const session = JSON.parse(localStorage.getItem('braniacSession'));
  
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  /**
   * NAVIGATION LOGIC
   * Highlights the current page in the navbar
   */
  const navItems = document.querySelectorAll('.nav-item');
  const currentPath = window.location.pathname;

  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPath.includes(href)) {
      item.classList.add('active');
    }
  });

  /**
   * RENDER SCORES - Load from backend if logged in, otherwise from localStorage
   */
  loadAndRenderScores();
  
  /**
   * AUTO-REFRESH SCORES
   * Refresh scores when page becomes visible or when storage changes
   */
  // Reload scores when page becomes visible (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('🔄 Page visible - refreshing scores...');
      loadAndRenderScores();
    }
  });
  
  // Listen for storage changes from other tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === 'userScores') {
      console.log('🔄 Scores updated in another tab - refreshing...');
      loadAndRenderScores();
    }
  });
  
  // Refresh scores when page gets focus
  window.addEventListener('focus', () => {
    console.log('🔄 Page focused - refreshing scores...');
    loadAndRenderScores();
  });
});

async function loadAndRenderScores() {
  const session = JSON.parse(localStorage.getItem('braniacSession'));
  let scores = [];
  
  // Try to load from backend if user is logged in
  if (session && session.type === 'user') {
    try {
      const API_BASE = window.API_BASE || 'https://braniac-backend.onrender.com';
      const response = await fetch(`${API_BASE}/api/user/data`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.data && data.data.scores && Array.isArray(data.data.scores)) {
          // Convert backend scores to frontend format
          scores = data.data.scores.map(s => ({
            type: s.quizType || 'topic',
            name: s.topic || 'Unnamed Quiz',
            score: s.correctAnswers || 0,
            total: s.totalQuestions || 1,
            percentage: s.score || 0,
            date: s.date || new Date().toISOString()
          }));
          console.log('✅ Loaded scores from database:', scores.length);
          
          // Also save to localStorage for offline access
          localStorage.setItem('userScores', JSON.stringify(scores));
        } else {
          console.log('⚠️ No scores in backend response');
        }
      } else {
        console.log('⚠️ Backend returned', response.status, '- using localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading scores from backend:', error.message);
    }
  }
  
  // Fallback to localStorage if backend failed or guest user
  if (scores.length === 0) {
    try {
      scores = JSON.parse(localStorage.getItem('userScores')) || [];
      console.log('📦 Using localStorage scores:', scores.length);
    } catch (e) {
      console.error('❌ Error reading localStorage:', e);
      scores = [];
    }
  }
  
  renderScores(scores);
}

function renderScores(scores) {
  
  console.log('Total scores found:', scores.length);
  
  // Group scores by type
  const topicScores = scores.filter(s => s.type === 'topic');
  const documentScores = scores.filter(s => s.type === 'document');
  const multiplayerScores = scores.filter(s => s.type === 'multiplayer');

  console.log('Topic:', topicScores.length, 'Document:', documentScores.length, 'Multiplayer:', multiplayerScores.length);

  // Find containers
  const topicSection = document.querySelector('#topic-scores');
  const documentSection = document.querySelector('#document-scores');
  const multiplayerSection = document.querySelector('#multiplayer-scores');
  const noDataView = document.querySelector('#noDataView');

  const topicContainer = document.querySelector('#topic-scores .scores-grid');
  const documentContainer = document.querySelector('#document-scores .scores-grid');
  const multiplayerContainer = document.querySelector('#multiplayer-scores .scores-grid');

  // Show/hide noDataView
  if (scores.length === 0) {
    noDataView?.classList.remove('hidden');
    noDataView?.style.setProperty('display', 'flex');
    topicSection?.style.setProperty('display', 'none');
    documentSection?.style.setProperty('display', 'none');
    multiplayerSection?.style.setProperty('display', 'none');
    return;
  } else {
    noDataView?.classList.add('hidden');
    noDataView?.style.setProperty('display', 'none');
  }

  // Show/hide sections based on content
  if (topicScores.length > 0) {
    topicSection?.style.setProperty('display', 'block');
    if (topicContainer) {
      topicContainer.innerHTML = topicScores.map(score => createScoreCard(score)).join('');
    }
  } else {
    topicSection?.style.setProperty('display', 'none');
  }

  if (documentScores.length > 0) {
    documentSection?.style.setProperty('display', 'block');
    if (documentContainer) {
      documentContainer.innerHTML = documentScores.map(score => createScoreCard(score)).join('');
    }
  } else {
    documentSection?.style.setProperty('display', 'none');
  }

  if (multiplayerScores.length > 0) {
    multiplayerSection?.style.setProperty('display', 'block');
    if (multiplayerContainer) {
      multiplayerContainer.innerHTML = multiplayerScores.map(score => createScoreCard(score)).join('');
    }
  } else {
    multiplayerSection?.style.setProperty('display', 'none');
  }
}

function createScoreCard(score) {
  const percentage = score.percentage || Math.round((score.score / score.total) * 100);
  const date = new Date(score.date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Calculate stroke dasharray for progress ring
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const remaining = circumference - progress;

  return `
    <div class="score-card">
      <div class="score-header">
        <h3 class="score-title">${escapeHtml(score.name)}</h3>
        <span class="score-date">${formattedDate}</span>
      </div>
      <div class="score-body">
        <svg class="progress-ring" width="120" height="120">
          <circle class="progress-ring-bg" cx="60" cy="60" r="${radius}" />
          <circle 
            class="progress-ring-fill" 
            cx="60" 
            cy="60" 
            r="${radius}" 
            stroke-dasharray="${progress} ${remaining}"
            stroke-dashoffset="0"
          />
          <text x="60" y="60" text-anchor="middle" dy=".3em" class="progress-text">
            ${percentage}%
          </text>
        </svg>
        <div class="score-stats">
          <div class="stat">
            <span class="stat-label">Correct</span>
            <span class="stat-value">${score.score}/${score.total}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value">${percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}