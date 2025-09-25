window.addEventListener('load', () => {
    // Get all necessary elements from the DOM
    const mainTitle = document.getElementById('main-title');
    const gameGallery = document.getElementById('game-gallery');

    // --- Animation Sequence ---
    // This controls the timing of the intro animation.

    // 1. After 2.5 seconds, transition the main title to its logo state (top-left corner).
    setTimeout(() => {
        mainTitle.classList.add('logo-mode');
    }, 2500); // 2.5-second delay

    // 2. After 3 seconds, fade in the game gallery.
    setTimeout(() => {
        gameGallery.classList.add('visible');
    }, 3000); // 3-second delay (0.5s after the logo starts moving)
});
