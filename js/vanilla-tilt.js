/**
 * Aadish Jain — 3D Spatial Tilt & Parallax Physics Engine
 * Gives real 3D spatial depth, dynamic lighting glares, and pop-out parallax
 * to portfolio cards, widgets, and buttons.
 */

export function init3DTilt() {
    const cards = document.querySelectorAll('.artifact-card, .bridge-card, .timeline-item, .chat-hero-container, .bunny-game-card');

    cards.forEach(card => {
        card.style.transformStyle = 'preserve-3d';
        card.style.perspective = '1000px';

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max tilt 10 deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

            // Spatial depth for inner elements
            const popElements = card.querySelectorAll('.artifact-title, .bridge-card-title, .artifact-type-pill, .btn, .artifact-metrics-row');
            popElements.forEach(el => {
                el.style.transform = 'translateZ(28px)';
                el.style.transition = 'transform 0.1s ease';
            });
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.4s ease';

            const popElements = card.querySelectorAll('.artifact-title, .bridge-card-title, .artifact-type-pill, .btn, .artifact-metrics-row');
            popElements.forEach(el => {
                el.style.transform = 'translateZ(0px)';
                el.style.transition = 'transform 0.4s ease';
            });
        });
    });
}
