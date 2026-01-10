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

// ===============================
// PROFILE PICTURE - LATER BUTTON
// ===============================
const skipBtn = document.querySelector('.skip-btn');

if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    // 1. Get the first name saved during registration
    const firstName = localStorage.getItem('braniacFirstName') || 'BRANIAC';

    // 2. Create the session object
    const newSession = {
      type: 'user',
      firstName: firstName,
      pfp: 'assets/icons/guest.svg' // Default icon since they skipped
    };

    // 3. Save to localStorage (using the helper logic)
    localStorage.setItem('braniacSession', JSON.stringify(newSession));

    // 4. Redirect to index.html
    window.location.href = 'index.html';
  });
}

// ===============================
// PROFILE PICTURE LOGIC
// ===============================
const pfpInput = document.getElementById('pfpInput');
const uploadBtn = document.querySelector('.upload-btn');
const profileImgPreview = document.querySelector('.profile-icon');

// Match your CSS classes and IDs
const uploadOverlay = document.getElementById('uploadOverlay');
const closeUploadChoices = document.getElementById('closeUploadChoices');

// 1. REUSABLE SUCCESS HANDLER
function processFinalPFP(base64Image) {
  if (profileImgPreview) {
    profileImgPreview.src = base64Image;
    profileImgPreview.style.width = "105px";
    profileImgPreview.style.height = "105px";
    profileImgPreview.style.objectFit = "cover";
    profileImgPreview.style.borderRadius = "50%";
  }

  const firstName = localStorage.getItem('braniacFirstName') || 'BRANIAC';
  const newSession = {
    type: 'user',
    firstName: firstName,
    pfp: base64Image 
  };

  localStorage.setItem('braniacSession', JSON.stringify(newSession));
  
  // Close overlay using your .active class
  uploadOverlay?.classList.remove('active');

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1200);
}

// 2. OVERLAY CONTROL (MATCHES YOUR CSS)
uploadBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  uploadOverlay?.classList.add('active'); // Changed from .hidden logic
});

closeUploadChoices?.addEventListener('click', (e) => {
  e.preventDefault();
  uploadOverlay?.classList.remove('active'); // Changed from .hidden logic
});

// Close if clicking the darkened background area
uploadOverlay?.addEventListener('click', (e) => {
  if (e.target === uploadOverlay) {
    uploadOverlay.classList.remove('active');
  }
});

// 3. CHOICE ACTIONS
document.getElementById('chooseFileBtn')?.addEventListener('click', () => {
  pfpInput.click();
});

document.getElementById('takePhotoBtn')?.addEventListener('click', () => {
  openCamera();
});

// 4. FILE UPLOAD LOGIC
pfpInput?.addEventListener('change', function() {
  const file = this.files[0];
  const errorEl = document.getElementById('uploadError'); // Reference your error element
  if (!file) return;

  const maxSize = 2 * 1024 * 1024; 
  if (file.size > maxSize) {
    // --- THE FIX: CLOSE OVERLAY SO USER SEES ERROR ---
    uploadOverlay?.classList.remove('active');
    
    if (errorEl) {
      errorEl.classList.remove('hidden');
      errorEl.classList.add('show');
      
      this.value = ""; // Clear the input
      
      setTimeout(() => {
        errorEl.classList.remove('show');
        setTimeout(() => errorEl.classList.add('hidden'), 300);
      }, 3000);
    }
    return;
  }

  // If size is fine, proceed as usual
  const reader = new FileReader();
  reader.onload = (e) => processFinalPFP(e.target.result);
  reader.readAsDataURL(file);
});

// 5. CAMERA LOGIC (Mirrored)
async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // MIRROR LOGIC
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const capturedImage = canvas.toDataURL('image/jpeg');
    stream.getTracks().forEach(track => track.stop());
    processFinalPFP(capturedImage);
  } catch (err) {
    console.error(err);
    alert("Camera access denied or device not found.");
  }
}