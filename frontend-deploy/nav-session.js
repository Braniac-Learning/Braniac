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
  let session = null;
  try {
    const sessionStr = localStorage.getItem('braniacSession');
    session = sessionStr ? JSON.parse(sessionStr) : null;
  } catch (e) {
    console.error('Failed to parse session:', e);
    localStorage.removeItem('braniacSession');
  }

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
  logoutBtn?.addEventListener('click', async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('braniacSession');
    const isBackendUrl = window.location.pathname.includes('/backend/');
    window.location.href = isBackendUrl ? '../frontend-deploy/index.html' : 'index.html';
  });

  guestLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent the event from bubbling up
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
  try {
    const sessionStr = localStorage.getItem('braniacSession');
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (e) {
    console.error('Failed to parse session:', e);
    localStorage.removeItem('braniacSession');
    return null;
  }
}

function clearSession() {
  localStorage.removeItem('braniacSession');
  localStorage.removeItem('braniacFirstName');
}

// -----------------------------
// SIGN IN FORM SUBMISSION
// -----------------------------
const signInForm = document.getElementById('signInForm');
if (signInForm) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!signInForm.checkValidity()) {
      signInForm.reportValidity();
      return;
    }

    const usernameInput = signInForm.querySelector('input[placeholder="Username"]');
    const passwordInput = signInForm.querySelector('input[type="password"]');
    
    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    // Show loading state
    const submitBtn = signInForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) submitBtn.textContent = 'Signing in...';
    if (submitBtn) submitBtn.disabled = true;

    try {
      console.log('🔐 Attempting login for:', username);
      const result = await authAPI.login(username, password);
      
      if (result.ok) {
        console.log('✅ Login successful');
        // Login successful
        const isBackend = window.location.pathname.includes('/backend/');
        window.location.href = isBackend ? '../frontend-deploy/index.html' : 'index.html';
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
      
      // Show user-friendly error
      const errorMsg = error.message || 'Login failed. Please check your credentials.';
      const errorDiv = signInForm.querySelector('.error-message') || document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = 'red';
      errorDiv.style.marginTop = '10px';
      errorDiv.style.textAlign = 'center';
      errorDiv.textContent = errorMsg;
      
      if (!signInForm.querySelector('.error-message')) {
        signInForm.appendChild(errorDiv);
      }
      
      setTimeout(() => errorDiv.remove(), 4000);
    }
  });
}

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
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!registerForm.checkValidity()) {
      registerForm.reportValidity();
      return;
    }

    const usernameInput = registerForm.querySelector('input[name="username"]');
    const firstNameInput = registerForm.querySelector('input[name="firstName"]');
    const passwordInput = registerForm.querySelector('input[name="password"]');
    const confirmPasswordInput = registerForm.querySelector('input[name="confirmPassword"]');
    
    const username = usernameInput ? usernameInput.value.trim() : "";
    const firstName = firstNameInput ? firstNameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

    console.log('📝 Registration attempt for:', username);

    // Show loading state
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) submitBtn.textContent = 'Creating account...';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const result = await authAPI.register(username, firstName, password, confirmPassword);
      
      if (result.ok) {
        console.log('✅ Registration successful');
        // Registration successful
        const isBackend = window.location.pathname.includes('/backend/');
        window.location.href = isBackend ? '../frontend-deploy/onboarding.html' : 'onboarding.html';
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
      
      // Show user-friendly error
      const errorMsg = error.message || 'Registration failed. Please try again.';
      const errorDiv = registerForm.querySelector('.error-message') || document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = 'red';
      errorDiv.style.marginTop = '10px';
      errorDiv.style.textAlign = 'center';
      errorDiv.textContent = errorMsg;
      
      if (!registerForm.querySelector('.error-message')) {
        registerForm.appendChild(errorDiv);
      }
      
      setTimeout(() => errorDiv.remove(), 4000);
    }
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