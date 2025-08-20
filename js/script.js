document.addEventListener('DOMContentLoaded', () => {
    const dynamicIsland = document.getElementById('dynamic-island');
    let currentIslandState = 'initial';

    function setIslandState(newState) {
        if (currentIslandState === newState) return;
        currentIslandState = newState;

        dynamicIsland.classList.remove('expanded', 'showing-work-prompt', 'showing-skills-reset');

        switch (newState) {
            case 'work-prompt':
                dynamicIsland.classList.add('expanded', 'showing-work-prompt');
                break;
            case 'skills-reset':
                dynamicIsland.classList.add('expanded', 'showing-skills-reset');
                break;
            case 'initial':
                break;
        }
    }

    dynamicIsland.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (currentIslandState === 'initial') {
            dynamicIsland.classList.add('tapped');
            setTimeout(() => {
                dynamicIsland.classList.remove('tapped');
            }, 300);
        }
    });

    const footer = document.querySelector('.footer-index');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (currentIslandState !== 'skills-reset') {
                    setIslandState('work-prompt');
                }
            } else {
                if (currentIslandState === 'work-prompt') {
                    setIslandState('initial');
                }
            }
        });
    }, { threshold: 0.1 });

    if (footer) {
        observer.observe(footer);
    }

    const closeButtons = document.querySelectorAll('.js-close-skill');
    const skillCards = document.querySelectorAll('.macos-window-card');
    if (closeButtons.length > 0) {
        let visibleCardCount = skillCards.length;

        closeButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const cardToHide = event.target.closest('.macos-window-card');
                if (cardToHide && !cardToHide.classList.contains('is-hidden')) {
                    cardToHide.classList.add('is-hidden');
                    visibleCardCount--;
                }
                if (visibleCardCount === 0) {
                    setIslandState('skills-reset');
                    setTimeout(() => {
                        setIslandState('initial');
                        setTimeout(() => {
                            skillCards.forEach(card => card.classList.remove('is-hidden'));
                            visibleCardCount = skillCards.length;
                        }, 500);
                    }, 4000);
                }
            });
        });
    }

    const experienceWidget = document.querySelector('.experience-widget');
    if (experienceWidget) {
        const tabButtons = experienceWidget.querySelectorAll('.tab-button');
        const contentPanels = experienceWidget.querySelectorAll('.content-panel');
        const experienceEntries = experienceWidget.querySelectorAll('.experience-entry');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('is-active'));
                contentPanels.forEach(panel => panel.classList.remove('is-active'));
                button.classList.add('is-active');
                document.getElementById(button.dataset.tab)?.classList.add('is-active');
            });
        });

        experienceEntries.forEach(entry => {
            entry.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                const isCurrentlyExpanded = entry.classList.contains('is-expanded');
                experienceEntries.forEach(otherEntry => otherEntry.classList.remove('is-expanded'));
                if (!isCurrentlyExpanded) {
                    entry.classList.add('is-expanded');
                }
            });
        });
    }

    const themeIcon = document.querySelector('.theme-icon');
    const body = document.body;

    function setInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            body.classList.remove('dark-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    themeIcon.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        if (isDarkMode) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    });

    setInitialTheme();
});