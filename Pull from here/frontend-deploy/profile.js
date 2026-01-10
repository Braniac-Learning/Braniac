document.addEventListener('DOMContentLoaded', () => {
    const currentPfp = document.getElementById('currentPfp');
    const editFirstName = document.getElementById('editFirstName');
    const editBio = document.getElementById('editBio');
    const charCount = document.getElementById('charCount');
    const uploadOverlay = document.getElementById('uploadOverlay');
    const pfpInput = document.getElementById('pfpInput');

    // 1. INITIAL LOAD FROM STORAGE
    const session = JSON.parse(localStorage.getItem('braniacSession')) || {};
    const storedBio = localStorage.getItem('braniacBio') || "";
    
    if (session.pfp) currentPfp.src = session.pfp;
    editFirstName.value = session.firstName || "";
    editBio.value = storedBio;
    
    // Initial count set
    updateCharCount(storedBio.length);

    // 2. CHARACTER COUNTER LOGIC
    function updateCharCount(length) {
        charCount.textContent = `${length}/140`;
        // Turn pink if limit reached
        if (length >= 140) {
            charCount.style.color = "#EE247C";
            charCount.style.fontWeight = "bold";
        } else {
            charCount.style.color = "#555";
            charCount.style.fontWeight = "normal";
        }
    }

    editBio.addEventListener('input', () => {
        updateCharCount(editBio.value.length);
    });

    // 3. OVERLAY CONTROLS
    document.getElementById('openUploadBtn').onclick = () => uploadOverlay.classList.add('active');
    document.getElementById('closeUploadChoices').onclick = () => uploadOverlay.classList.remove('active');

    // 4. FILE UPLOAD WITH 2MB LIMIT
    document.getElementById('chooseFileBtn').onclick = () => pfpInput.click();
    pfpInput.onchange = function() {
        const file = this.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Image too large. Please stay under 2MB.");
            this.value = "";
            uploadOverlay.classList.remove('active');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentPfp.src = e.target.result;
            uploadOverlay.classList.remove('active');
        };
        reader.readAsDataURL(file);
    };

    // 5. CAMERA LOGIC (MIRRORED)
    document.getElementById('takePhotoBtn').onclick = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            currentPfp.src = canvas.toDataURL('image/jpeg');
            stream.getTracks().forEach(t => t.stop());
            uploadOverlay.classList.remove('active');
        } catch (err) {
            alert("Camera access denied.");
        }
    };

    // 6. SAVE FORM
    document.getElementById('editProfileForm').onsubmit = (e) => {
        e.preventDefault();
        
        localStorage.setItem('braniacBio', editBio.value);
        
        const updatedSession = {
            ...session,
            firstName: editFirstName.value,
            pfp: currentPfp.src
        };
        
        localStorage.setItem('braniacSession', JSON.stringify(updatedSession));
        window.location.href = 'index.html';
    };
});