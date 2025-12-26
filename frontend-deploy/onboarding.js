// ===============================
// ONBOARDING CONTROLLER
// ===============================

// Section references
const sections = document.querySelectorAll('.onboarding-section');
const proceedButtons = document.querySelectorAll('.proceed-btn');
const returnButtons = document.querySelectorAll('.return-btn');
const closeButtons = document.querySelectorAll('.close-section');

let currentSection = document.querySelector('.onboarding-section.active');

// ===============================
// HELLO, FIRST NAME GREETING
// ===============================
const whoAreYouHeader = document.querySelector('#whoAreYou h1');
const firstName = localStorage.getItem('braniacFirstName');

if (firstName && whoAreYouHeader) {
  whoAreYouHeader.textContent = `HELLO, ${firstName.toUpperCase()}`;
}

// ===============================
// ANIMATION TRIGGER
// ===============================
function triggerSectionAnimation(section) {
  if (!section) return;

  // Reset animation
  section.classList.remove('animate-in');

  // Force reflow so animation restarts
  void section.offsetWidth;

  section.classList.add('animate-in');
}

// Trigger animation on first visible section
if (currentSection) {
  triggerSectionAnimation(currentSection);
}

// ===============================
// SECTION TRANSITION HANDLER
// ===============================
function transitionTo(nextId, direction = 'forward') {
  const nextSection = document.getElementById(nextId);
  if (!nextSection || nextSection === currentSection) return;

  // Animate current section out
  currentSection.classList.add(
    direction === 'forward' ? 'slide-out-left' : 'slide-out-right'
  );

  // Prepare next section
  nextSection.classList.add('active');
  triggerSectionAnimation(nextSection);

  nextSection.classList.add(
    direction === 'forward' ? 'slide-in-right' : 'slide-in-left'
  );

  // Cleanup
  setTimeout(() => {
    currentSection.classList.remove(
      'active',
      'slide-out-left',
      'slide-out-right'
    );

    nextSection.classList.remove(
      'slide-in-right',
      'slide-in-left'
    );

    currentSection = nextSection;
  }, 300); // MUST match CSS animation duration
}

// ===============================
// OPTION SELECTION LOGIC
// ===============================
sections.forEach(section => {
  const optionBtns = section.querySelectorAll('.option-btn');
  const proceedBtn = section.querySelector('.proceed-btn');

  if (!proceedBtn || optionBtns.length === 0) return;

  // Disable proceed initially
  proceedBtn.disabled = true;
  proceedBtn.classList.add('disabled');

  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = section.querySelectorAll('.option-btn.selected');

      if (!btn.classList.contains('selected')) {
        if (selected.length >= 7) return;
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }

      const hasSelection =
        section.querySelectorAll('.option-btn.selected').length > 0;

      proceedBtn.disabled = !hasSelection;
      proceedBtn.classList.toggle('disabled', !hasSelection);
    });
  });
});

// ===============================
// PROCEED / RETURN BUTTONS
// ===============================
proceedButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    transitionTo(btn.dataset.next, 'forward');
  });
});

returnButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    transitionTo(btn.dataset.prev, 'backward');
  });
});

// ===============================
// EXIT → LANDING PAGE
// ===============================
closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});