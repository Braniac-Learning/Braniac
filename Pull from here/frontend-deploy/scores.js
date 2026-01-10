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
   * DATA RENDERING (Optional Next Step)
   * If you want to replace the hardcoded HTML cards with 
   * actual data from localStorage, you would add that logic here.
   */
  const realScores = JSON.parse(localStorage.getItem('userScores')) || [];
  
  if (realScores.length > 0) {
    console.log(`${realScores.length} score(s) detected. Ready to render.`);
    // renderScores(realScores); 
  }
});