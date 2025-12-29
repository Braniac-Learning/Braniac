// BRANIAC - Smooth Animation Controller
console.log("Braniac site loaded successfully.");

// Intersection Observer for smooth animations
document.addEventListener('DOMContentLoaded', function() {
    // Create intersection observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special handling for cards within sections
                if (entry.target.classList.contains('why')) {
                    const cards = entry.target.querySelectorAll('.why-card');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate-in');
                        }, index * 200);
                    });
                }
                
                // Special handling for how steps
                if (entry.target.classList.contains('how')) {
                    const steps = entry.target.querySelectorAll('.how-step');
                    steps.forEach((step, index) => {
                        setTimeout(() => {
                            step.classList.add('animate-in');
                        }, 600 + (index * 200));
                    });
                }
                
                // Unobserve after animation is triggered
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animatable sections
    const sections = document.querySelectorAll('.trusted, .how, .why, .footer');
    sections.forEach(section => {
        observer.observe(section);
    });

    // Add smooth hover effects to buttons
    const buttons = document.querySelectorAll('.cta-btn, .sign-in-btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
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
    // REGISTER FORM SUBMISSION (calls backend)
    // -----------------------------
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!registerForm.checkValidity()) {
          registerForm.reportValidity();
          return;
        }

        const usernameInput = registerForm.querySelector('input[placeholder="Username"]');
        const firstNameInput = registerForm.querySelector('input[placeholder="First Name"]');
        const passwordInput = registerForm.querySelector('input[placeholder="Password"]');
        const confirmInput = registerForm.querySelector('input[placeholder="Confirm Password"]');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const firstName = firstNameInput ? firstNameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmInput ? confirmInput.value : '';

        // Client-side validation to match server rules
        const usernameOk = /^[A-Za-z0-9_-]{3,30}$/.test(username);
        const firstNameOk = /^[A-Za-z\s-]{1,50}$/.test(firstName);
        const passwordOk = password.length >= 8 && !/\s/.test(password);

        if (!usernameOk) return alert('Invalid username. Use letters, numbers, hyphens or underscores (3-30 chars), no spaces.');
        if (!firstNameOk) return alert('Invalid first name. Use letters, spaces, and hyphens only.');
        if (!passwordOk) return alert('Invalid password. Minimum 8 characters, no spaces.');
        if (password !== confirmPassword) return alert('Passwords do not match');

        try {
          const resp = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, firstName, password, confirmPassword })
          });

          const data = await resp.json();
          if (!resp.ok) {
            return alert(data.error || 'Registration failed');
          }

          // Save first name locally and redirect to onboarding
          if (data.user && data.user.firstName) localStorage.setItem('braniacFirstName', data.user.firstName);
          window.location.href = 'onboarding.html';
        } catch (err) {
          console.error('Register error:', err);
          alert('Registration failed. Check console for details.');
        }
      });
    }

    // -----------------------------
    // SIGN IN FORM SUBMISSION (calls backend)
    // -----------------------------
    const signInForm = document.querySelector('#signInPanel form');
    const signinError = document.getElementById('signinError');
    const signUsername = document.getElementById('signUsername');
    const signPassword = document.getElementById('signPassword');

    function clearSignInError() {
      if (signinError) {
        signinError.style.display = 'none';
        signinError.textContent = '';
      }
      if (signUsername) signUsername.classList.remove('error');
      if (signPassword) signPassword.classList.remove('error');
    }

    if (signUsername) signUsername.addEventListener('input', clearSignInError);
    if (signPassword) signPassword.addEventListener('input', clearSignInError);

    if (signInForm) {
      signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearSignInError();

        const username = signUsername ? signUsername.value.trim() : '';
        const password = signPassword ? signPassword.value : '';

        if (!username || !password) {
          if (signinError) {
            signinError.textContent = 'Please enter both username and password.';
            signinError.style.display = 'block';
          }
          if (!username && signUsername) signUsername.classList.add('error');
          if (!password && signPassword) signPassword.classList.add('error');
          return;
        }

        try {
          const resp = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
          });

          const data = await resp.json();
          if (!resp.ok) {
            const msg = data && data.error ? data.error : 'Login failed';
            // show inline error and mark inputs
            if (signinError) {
              signinError.textContent = msg;
              signinError.style.display = 'block';
            }
            if (signUsername) signUsername.classList.add('error');
            if (signPassword) signPassword.classList.add('error');
            return;
          }

          if (data.user && data.user.firstName) localStorage.setItem('braniacFirstName', data.user.firstName);
          clearSignInError();
          authOverlay.classList.remove('active');
        } catch (err) {
          console.error('Login error:', err);
          if (signinError) {
            signinError.textContent = 'Network error — please try again.';
            signinError.style.display = 'block';
          }
          if (signUsername) signUsername.classList.add('error');
          if (signPassword) signPassword.classList.add('error');
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
});