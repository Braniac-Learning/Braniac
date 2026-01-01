const session = JSON.parse(localStorage.getItem('braniacSession'));

if (!session) {
  window.location.href = 'index.html';
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

document.addEventListener('DOMContentLoaded', () => {
  const noDataView = document.getElementById('noDataView');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  
  // Check for real achievements
  const realAchievements = JSON.parse(localStorage.getItem('userAchievements')) || [];

  function updateView() {
    const activeBtn = document.querySelector('.toggle-btn.active');
    const target = activeBtn.dataset.target;
    const activeList = document.getElementById(target);

    if (target === 'obtained' && realAchievements.length === 0) {
      activeList.classList.remove('active'); // Hide mock cards
      noDataView.classList.remove('hidden'); // Show "No Data"
    } else {
      // Always show data for "Unobtained" or if "Obtained" has real data
      activeList.classList.add('active');
      noDataView.classList.add('hidden');
    }
  }

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.achievement-list').forEach(l => l.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
      
      updateView();
    });
  });

  updateView();
});