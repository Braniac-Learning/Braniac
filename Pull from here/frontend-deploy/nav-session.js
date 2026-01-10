document.addEventListener('click', (e) => {
  const gated = e.target.closest('.gated');
  if (!gated) return;

  const session = getSession();
  
  if (session) {
    return; 
  }

  e.preventDefault();
  e.stopImmediatePropagation();

  const notice = document.getElementById('authNotice');
  if (!notice) return;

  notice.classList.add('show');

  clearTimeout(notice._t);
  notice._t = setTimeout(() => {
    notice.classList.remove('show');
  }, 2200);
}, true);

document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(localStorage.getItem('braniacSession'));

  const signInBtn = document.getElementById('openSignIn');
  const navProfile = document.getElementById('navProfile');
  const navAvatar = document.getElementById('navAvatar');

  const userHeader = document.getElementById('userHeader');
  const menuAvatar = document.getElementById('menuAvatar');
  const menuFirstName = document.getElementById('menuFirstName');

  const changePfpBtn = document.getElementById('changePfpBtn');
  const guestLoginBtn = document.getElementById('guestLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!session) {
    signInBtn?.classList.remove('hidden');
    navProfile?.classList.add('hidden');
    return;
  }

  navProfile?.classList.remove('hidden');
  signInBtn?.classList.add('hidden');

  // --- ROBUST AVATAR LOADING START ---
  const isBackend = window.location.pathname.includes('/backend/');
  const defaultIcon = isBackend ? '../frontend-deploy/assets/icons/guest.svg' : 'assets/icons/guest.svg';
  
  // Clean/Re-calculate the PFP path to ensure it matches the current folder level
  let pfp = session.pfp || defaultIcon;
  if (pfp.includes('assets/icons/')) {
    const fileName = pfp.split('/').pop(); 
    pfp = isBackend ? `../frontend-deploy/assets/icons/${fileName}` : `assets/icons/${fileName}`;
  }

  if (navAvatar) {
    navAvatar.src = pfp;
    navAvatar.onerror = function() {
      this.src = defaultIcon;
      this.onerror = null; 
    };
  }

  if (menuAvatar) {
    menuAvatar.src = pfp;
    menuAvatar.onerror = function() {
      this.src = defaultIcon;
      this.onerror = null;
    };
  }
  // --- ROBUST AVATAR LOADING END ---

  if (session.type === 'guest') {
    guestLoginBtn?.classList.remove('hidden');
    changePfpBtn?.classList.add('hidden');
    userHeader?.classList.add('hidden'); 
  } else {
    changePfpBtn?.classList.remove('hidden');
    guestLoginBtn?.classList.add('hidden');
    userHeader?.classList.remove('hidden'); 
    if (menuFirstName) {
      menuFirstName.textContent = (session.firstName || "USER").toUpperCase();
    }
  }

  const profileTrigger = document.getElementById('profileTrigger');
  const triggerElement = profileTrigger || navAvatar;
  
  triggerElement?.addEventListener('click', (e) => {
    e.stopPropagation();
    navProfile.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (navProfile && !navProfile.contains(e.target)) {
      navProfile.classList.remove('show');
    }
  });

  // --- BUTTON ACTIONS ---
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('braniacSession');
    const isBackendUrl = window.location.pathname.includes('/backend/');
    window.location.href = isBackendUrl ? '../frontend-deploy/index.html' : 'index.html';
  });

  guestLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    navProfile.classList.remove('show');
    const authOverlay = document.getElementById('authOverlay');
    authOverlay?.classList.add('active');
  });

  changePfpBtn?.addEventListener('click', () => {
    const isBackendUrl = window.location.pathname.includes('/backend/');
    if (isBackendUrl) {
      window.location.href = '../frontend-deploy/profile.html';
    } else {
      window.location.href = 'profile.html';
    }
  });
});

// --- Session helpers ---
function setSession(session) {
  localStorage.setItem('braniacSession', JSON.stringify(session));
}

function getSession() {
  return JSON.parse(localStorage.getItem('braniacSession'));
}

function clearSession() {
  localStorage.removeItem('braniacSession');
}

// Optimized Sign-In Submission
document.querySelector('.auth-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const isBackend = window.location.pathname.includes('/backend/');
  
  setSession({
    type: 'user',
    firstName: 'BRANIAC',
    pfp: 'assets/icons/guest.svg' // Keep simple; re-calculated by robust loader above
  });

  window.location.href = isBackend ? '../frontend-deploy/index.html' : 'index.html';
});

// -----------------------------
// AUTH MODAL HANDLING
// -----------------------------
const authOverlay = document.getElementById('authOverlay');
const signInTrigger = document.querySelector('.sign-in-btn');
const closeModal = document.getElementById('closeModal');
const switchToRegister = document.getElementById('switchToRegister');
const switchToSignIn = document.getElementById('switchToSignIn');
const signInPanel = document.getElementById('signInPanel');
const registerPanel = document.getElementById('registerPanel');
const authTitle = document.querySelector('.auth-title');
const authDesc = document.querySelector('.auth-subtitle');

signInTrigger?.addEventListener('click', (e) => {
  e.preventDefault();
  authOverlay.classList.add('active');
  signInPanel.classList.remove('hidden');
  registerPanel.classList.add('hidden');
  authTitle.textContent = "SIGN IN";
  authDesc.textContent = "Access your scores and achievements";
});

closeModal?.addEventListener('click', () => {
  authOverlay.classList.remove('active');
});

switchToRegister?.addEventListener('click', (e) => {
  e.preventDefault();
  signInPanel.classList.add('hidden');
  registerPanel.classList.remove('hidden');
  authTitle.textContent = "REGISTER";
  authDesc.textContent = "Create your account to track your progress";
});

switchToSignIn?.addEventListener('click', (e) => {
  e.preventDefault();
  registerPanel.classList.add('hidden');
  signInPanel.classList.remove('hidden');
  authTitle.textContent = "SIGN IN";
  authDesc.textContent = "Access your scores and achievements";
});

// -----------------------------
// REGISTER FORM SUBMISSION
// -----------------------------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!registerForm.checkValidity()) {
      registerForm.reportValidity();
      return;
    }

    const firstNameInput = registerForm.querySelector('input[placeholder="First Name"]');
    const firstName = firstNameInput ? firstNameInput.value.trim() : "";
    
    if (firstName) {
      localStorage.setItem('braniacFirstName', firstName);
    }

    // FIX: Detect if we are inside the /backend/ folder
    const isBackend = window.location.pathname.includes('/backend/');
    
    // Redirect to onboarding: if in backend, go up one level to find the root file
    window.location.href = isBackend ? '../frontend-deploy/onboarding.html' : 'onboarding.html';
  });
}

// -----------------------------
// PASSWORD TOGGLE HANDLER
// -----------------------------
const toggleButtons = document.querySelectorAll('.toggle-password');
toggleButtons.forEach(btn => {
  const input = btn.closest('.password-wrapper').querySelector('input');
  const img = btn.querySelector('img');

  const isBackend = window.location.pathname.includes('/backend/');
  const prefix = isBackend ? '../frontend-deploy/' : '';

  const originalIcon = `${prefix}assets/icons/eye.svg`;
  const toggledIcon = `${prefix}assets/icons/eye(2).svg`;

  btn.addEventListener('click', () => {
    if (input.type === 'password') {
      input.type = 'text';
      img.src = toggledIcon;
    } else {
      input.type = 'password';
      img.src = originalIcon;
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const guestBtn = document.getElementById('guestBtn');
  const overlay = document.getElementById('guestNoticeOverlay');
  const confirmBtn = document.getElementById('confirmGuest');
  const cancelBtn = document.getElementById('cancelGuest');
  const closeBtn = document.getElementById('closeGuestNotice');
  const dontShowCheck = document.getElementById('dontShowGuestNotice');

  function proceedAsGuest() {
    const guestSession = { type: 'guest', id: 'GUEST_' + Date.now() };
    localStorage.setItem('braniacSession', JSON.stringify(guestSession));
    
    const isBackend = window.location.pathname.includes('/backend/');
    window.location.href = isBackend ? '../frontend-deploy/index.html' : 'index.html';
  }

  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (sessionStorage.getItem('skipGuestNotice') === 'true') {
        proceedAsGuest();
      } else {
        overlay?.classList.remove('hidden');
      }
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (dontShowCheck?.checked) {
        sessionStorage.setItem('skipGuestNotice', 'true');
      }
      proceedAsGuest();
    });
  }

  [cancelBtn, closeBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        overlay?.classList.add('hidden');
      });
    }
  });
});