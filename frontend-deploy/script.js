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
});

// Elements
const authOverlay = document.getElementById('authOverlay');
const signInBtn = document.querySelector('.sign-in-btn'); // landing page sign in button
const closeModal = document.getElementById('closeModal');

const switchToRegister = document.getElementById('switchToRegister');
const switchToSignIn = document.getElementById('switchToSignIn');

const signInPanel = document.getElementById('signInPanel');
const registerPanel = document.getElementById('registerPanel');

const authTitle = document.getElementById('authTitle');
const authDesc = document.getElementById('authDesc');

const registerForm = document.getElementById('registerForm');

// Open modal
signInBtn.addEventListener('click', (e) => {
  e.preventDefault();
  authOverlay.classList.add('active');
  signInPanel.classList.remove('hidden');
  registerPanel.classList.add('hidden');
  authTitle.textContent = "Sign In to BRANIAC";
  authDesc.innerHTML = "Access your <strong>Scores</strong> and <strong>Achievements</strong>.";
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
  authTitle.textContent = "Join the BRANIAC Community";
  authDesc.innerHTML = "Create your account to save your <strong>Scores</strong>, earn <strong>Achievements</strong>, and show off your brainpower.";
});

switchToSignIn.addEventListener('click', (e) => {
  e.preventDefault();
  registerPanel.classList.add('hidden');
  signInPanel.classList.remove('hidden');
  authTitle.textContent = "Sign In to BRANIAC";
  authDesc.innerHTML = "Access your <strong>Scores</strong> and <strong>Achievements</strong>.";
});

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!registerForm.checkValidity()) {
    registerForm.reportValidity();
    return;
  }
  window.location.href = 'onboarding.html'; // update path if needed
});

const toggleButtons = document.querySelectorAll('.toggle-password');

toggleButtons.forEach(btn => {
  const input = btn.previousElementSibling;
  const img = btn.querySelector('img');

  // Original and toggled icon paths
  const originalIcon = 'assets/icons/eye.svg';
  const toggledIcon = 'assets/icons/eye%282%29.svg'; // parentheses encoded

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