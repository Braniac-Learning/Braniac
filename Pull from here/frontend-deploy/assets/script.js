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

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!registerForm.checkValidity()) {
    registerForm.reportValidity();
    return;
  }

  window.location.href = 'onboarding.html'; // update path if needed
});