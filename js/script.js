/**
 * Aadish Jain — Core Portfolio Controller
 * Standalone Bunny Companion & Theme Controller
 */

import { BunnyCompanion } from '../rabbit-logic/bunny.js';

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Theme Management (Sleek Dark Mode as Primary)
    // ==========================================================================
    const themeToggles = document.querySelectorAll('.js-theme-toggle');
    const htmlEl = document.documentElement;

    function initTheme() {
        const saved = localStorage.getItem('pm_theme');
        if (saved === 'light') {
            htmlEl.classList.remove('dark-mode');
            updateThemeIcons(false);
        } else {
            htmlEl.classList.add('dark-mode');
            updateThemeIcons(true);
        }
    }

    function updateThemeIcons(isDark) {
        themeToggles.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
            }
        });
    }

    function toggleTheme() {
        const isDark = htmlEl.classList.toggle('dark-mode');
        localStorage.setItem('pm_theme', isDark ? 'dark' : 'light');
        updateThemeIcons(isDark);
    }

    themeToggles.forEach(btn => btn.addEventListener('click', toggleTheme));
    initTheme();

    // ==========================================================================
    // 2. Standalone Modular Bunny Companion (rabbit-logic)
    // ==========================================================================
    const bunnyCompanion = new BunnyCompanion({
        modelPath: 'assets/rabbit.glb',
        adminEmail: 'aadishhere@gmail.com'
    });
    bunnyCompanion.init();
});