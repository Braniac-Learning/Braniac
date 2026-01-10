// Add to your main script file
document.addEventListener('contextmenu', e => e.preventDefault()); // Blocks Right-Click

document.addEventListener('keydown', e => {
    // Blocks F12, Ctrl+Shift+I (Inspect), Ctrl+U (View Source)
    if (e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
        (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
    }
});