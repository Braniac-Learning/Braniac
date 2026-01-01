const session = JSON.parse(localStorage.getItem('braniacSession'));

if (!session) {
  window.location.href = 'index.html';
}

// Toggle QUIZ / EXAM views
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active states
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.score-list').forEach(list => list.classList.remove('active'));

    // Activate selected
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

const navItems = document.querySelectorAll('.nav-item');
const currentPath = window.location.pathname;

navItems.forEach(item => {
  const href = item.getAttribute('href');
  if (href && currentPath.includes(href)) {
    item.classList.add('active');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const noDataView = document.getElementById('noDataView');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  
  // Check for real session data
  const realScores = JSON.parse(localStorage.getItem('userScores')) || [];

  function updateView() {
    const activeBtn = document.querySelector('.toggle-btn.active');
    const activeList = document.getElementById(activeBtn.dataset.target);
    const targetType = activeBtn.dataset.target === 'quizScores' ? 'QUIZ' : 'EXAM';

    // Filter session data for the current tab
    const hasData = realScores.some(score => score.type === targetType);

    if (!hasData) {
      activeList.classList.remove('active'); // Hide the list (and mock cards)
      noDataView.classList.remove('hidden'); // Show "No Data"
    } else {
      activeList.classList.add('active');
      noDataView.classList.add('hidden');
    }
  }

  // Handle Toggle Clicks
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.score-list').forEach(l => l.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
      
      updateView();
    });
  });

  updateView(); // Run on load
});