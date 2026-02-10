document.addEventListener('DOMContentLoaded', () => {
  let session = null;
  try {
    const sessionStr = localStorage.getItem('braniacSession');
    session = sessionStr ? JSON.parse(sessionStr) : null;
  } catch (e) {
    console.error('Failed to parse session:', e);
    localStorage.removeItem('braniacSession');
  }

  if (!session) {
    window.location.href = 'index.html';
    return;
  }

// Toggle obtained / unobtained
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.achievement-list').forEach(list => list.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

// Accordion logic
document.querySelectorAll('.achievement-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('open');
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

  const noDataView = document.getElementById('noDataView');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  
  // Check for real achievements
  const realAchievements = JSON.parse(localStorage.getItem('userAchievements')) || [];

  function updateView() {
    const activeBtn = document.querySelector('.toggle-btn.active');
    const target = activeBtn.dataset.target;
    const activeList = document.getElementById(target);

    if (target === 'obtained') {
      if (realAchievements.length === 0) {
        // No real achievements - hide the list and show no data
        activeList.classList.remove('active');
        noDataView.classList.remove('hidden');
      } else {
        // Has achievements - show the list
        activeList.classList.add('active');
        noDataView.classList.add('hidden');
      }
    } else {
      // Unobtained tab - always show
      activeList.classList.add('active');
      noDataView.classList.add('hidden');
    }
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.achievement-list').forEach(l => l.classList.remove('active'));
      
      btn.classList.add('active');
      
      updateView();
    });
  });

  updateView();
});