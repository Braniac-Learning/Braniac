const session = JSON.parse(localStorage.getItem('braniacSession'));

// 1. Redirect to landing page if no session is found
if (!session) {
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
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
   * RENDER SCORES
   */
  renderScores();
});

function renderScores() {
  const scores = JSON.parse(localStorage.getItem('userScores')) || [];
  
  if (scores.length === 0) {
    console.log('No scores found');
    return;
  }

  // Group scores by type
  const topicScores = scores.filter(s => s.type === 'topic');
  const documentScores = scores.filter(s => s.type === 'document');
  const multiplayerScores = scores.filter(s => s.type === 'multiplayer');

  // Find containers
  const topicContainer = document.querySelector('#topic-scores .scores-grid');
  const documentContainer = document.querySelector('#document-scores .scores-grid');
  const multiplayerContainer = document.querySelector('#multiplayer-scores .scores-grid');

  if (topicContainer) {
    topicContainer.innerHTML = topicScores.length > 0 
      ? topicScores.map(score => createScoreCard(score)).join('') 
      : '<p style="text-align: center; color: #666;">No topic quiz scores yet</p>';
  }

  if (documentContainer) {
    documentContainer.innerHTML = documentScores.length > 0 
      ? documentScores.map(score => createScoreCard(score)).join('') 
      : '<p style="text-align: center; color: #666;">No document quiz scores yet</p>';
  }

  if (multiplayerContainer) {
    multiplayerContainer.innerHTML = multiplayerScores.length > 0 
      ? multiplayerScores.map(score => createScoreCard(score)).join('') 
      : '<p style="text-align: center; color: #666;">No multiplayer quiz scores yet</p>';
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