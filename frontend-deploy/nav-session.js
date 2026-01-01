document.addEventListener('click', (e) => {
  const gated = e.target.closest('.gated');
  if (!gated) return;

  const session = getSession();
  
  // If session exists, redirect them to the backend
  if (session) {
    window.location.href = 'backend/learn.html'; // 👈 ADD THIS LINE
    return;
  }

  // If NO session, stop them and show the "Sign In" notice
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

  const changePfpBtn = document.getElementById('changePfpBtn');
  const guestLoginBtn = document.getElementById('guestLoginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!session) {
    // No session → show sign in
    signInBtn.classList.remove('hidden');
    navProfile.classList.add('hidden');
    return;
  }

  navAvatar.src = session.pfp || 'assets/icons/guest.svg';

  /* Add this inside your nav-session.js DOMContentLoaded block */
  navAvatar.onerror = function() {
    this.src = 'assets/icons/guest.svg'; // Fallback if pfp path is broken
  };

  if (session.type === 'guest') {
    guestLoginBtn.classList.remove('hidden');
    changePfpBtn.classList.add('hidden');
  } else {
    changePfpBtn.classList.remove('hidden');
    guestLoginBtn.classList.add('hidden');
  }

  // Toggle dropdown
  navAvatar.addEventListener('click', () => {
    navProfile.classList.toggle('show');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navProfile.contains(e.target)) {
      navProfile.classList.remove('show');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('braniacSession');
    window.location.href = 'index.html';
  });

  // Open modal
  guestLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    authOverlay.classList.add('active');
    signInPanel.classList.remove('hidden');
    registerPanel.classList.add('hidden');
    authTitle.textContent = "SIGN IN";
    authDesc.textContent = "Access your scores and achievements";
  });

  changePfpBtn?.addEventListener('click', () => {
    window.location.href = 'profile.html';
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

// REMOVED THE OLD GUESTBTN REDIRECT FROM HERE

document.querySelector('.auth-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  setSession({
    type: 'user',
    firstName: 'BRANIAC',
    pfp: 'assets/icons/guest.svg'
  });

  window.location.href = 'index.html';
});

// -----------------------------
// AUTH MODAL HANDLING
// -----------------------------
const authOverlay = document.getElementById('authOverlay');
const signInBtn = document.querySelector('.sign-in-btn');
const closeModal = document.getElementById('closeModal');

const switchToRegister = document.getElementById('switchToRegister');
const switchToSignIn = document.getElementById('switchToSignIn');

const signInPanel = document.getElementById('signInPanel');
const registerPanel = document.getElementById('registerPanel');

const authTitle = document.querySelector('.auth-title');
const authDesc = document.querySelector('.auth-subtitle');

// Open modal
signInBtn.addEventListener('click', (e) => {
  e.preventDefault();
  authOverlay.classList.add('active');
  signInPanel.classList.remove('hidden');
  registerPanel.classList.add('hidden');
  authTitle.textContent = "SIGN IN";
  authDesc.textContent = "Access your scores and achievements";
});

// Close modal
closeModal.addEventListener('click', () => {
  authOverlay.classList.remove('active');
});

// Switch panels
switchToRegister.addEventListener('click', (e) => {
  e.preventDefault();
  signInPanel.classList.add('hidden');
  registerPanel.classList.remove('hidden');
  authTitle.textContent = "REGISTER";
  authDesc.textContent = "Create your account to track your progress";
});

switchToSignIn.addEventListener('click', (e) => {
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

    // Grab first name
    const firstNameInput = registerForm.querySelector('input[placeholder="First Name"]');
    const firstName = firstNameInput ? firstNameInput.value.trim() : "";
    if (firstName) {
      localStorage.setItem('braniacFirstName', firstName);
    }

    // Redirect to onboarding page
    window.location.href = 'onboarding.html';
  });
}

// -----------------------------
// PASSWORD TOGGLE HANDLER
// -----------------------------
const toggleButtons = document.querySelectorAll('.toggle-password');

toggleButtons.forEach(btn => {
  const input = btn.closest('.password-wrapper').querySelector('input');
  const img = btn.querySelector('img');

  const originalIcon = 'assets/icons/eye.svg';
  const toggledIcon = 'assets/icons/eye(2).svg';

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
    window.location.href = 'index.html';
  }

  // Show notice or skip
  if (guestBtn) {
    guestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // CHANGED: Now checks sessionStorage instead of localStorage
      if (sessionStorage.getItem('skipGuestNotice') === 'true') {
        proceedAsGuest();
      } else {
        overlay.classList.remove('hidden');
      }
    });
  }

  // Proceed logic
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (dontShowCheck.checked) {
        // CHANGED: Now saves to sessionStorage so it resets on tab close
        sessionStorage.setItem('skipGuestNotice', 'true');
      }
      proceedAsGuest();
    });
  }

  // Close/Return logic
  [cancelBtn, closeBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        overlay.classList.add('hidden');
      });
    }
  });
});