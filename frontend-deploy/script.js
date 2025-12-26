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
});