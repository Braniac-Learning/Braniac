// onboarding.js

const sections = document.querySelectorAll('.onboarding-section');
const proceedButtons = document.querySelectorAll('.proceed-btn');
const returnButtons = document.querySelectorAll('.return-btn');
const closeButtons = document.querySelectorAll('.close-section');

let currentSection = document.querySelector('.onboarding-section.active');

/* ===============================
   SECTION TRANSITION HANDLER
================================ */

function transitionTo(nextId, direction = 'forward') {
  const nextSection = document.getElementById(nextId);
  if (!nextSection || nextSection === currentSection) return;

  // Animate current section out
  currentSection.classList.add(
    direction === 'forward' ? 'slide-out-left' : 'slide-out-right'
  );

  // Prepare next section
  nextSection.classList.add('active');
  nextSection.classList.add(
    direction === 'forward' ? 'slide-in-right' : 'slide-in-left'
  );

  // Cleanup after animation
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

/* ===============================
   OPTION SELECTION LOGIC
================================ */

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

/* ===============================
   PROCEED / RETURN BUTTONS
================================ */

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

/* ===============================
   EXIT → LANDING PAGE
================================ */

closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});