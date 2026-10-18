/**
 * Aadish Jain — The Roaming Rabbit Companion ("Bunny PM")
 * A whimsical, roaming virtual rabbit that hops around the screen,
 * eats carrots dropped by the visitor, delivers witty PM tips,
 * and nudges recruiters to book an interview!
 */

export class RoamingRabbit {
    constructor() {
        this.rabbitEl = null;
        this.bubbleEl = null;
        this.x = 80;
        this.y = window.innerHeight - 120;
        this.facing = 1; // 1 = right, -1 = left
        this.isHopping = false;
        this.isEating = false;
        this.speechTimer = null;
        this.roamTimer = null;
        this.quotes = [
            "Psst... Aadish can write your PRD AND code the iOS prototype! 🐰",
            "Looking for a PM? Aadish is right here! Don't let someone else hire him first!",
            "Did you know Aadish cut rent delays by 42% at Bluebex? Pretty sweet, huh?",
            "Click me to pet me, or double-click anywhere to feed me a carrot! 🥕",
            "Aadish published a whole book on Amazon! That's what I call narrative skills.",
            "He organized TEDx for 1,000+ people. Stakeholder management? Level 100.",
            "Want to talk to Aadish? Try the chat above or click 'Book an Interview'! 📅",
            "Munch munch... Carrots are great, but hiring Aadish is even better!"
        ];
    }

    init() {
        this.createRabbitElement();
        this.bindEvents();
        this.startAutonomousRoam();
        this.startSpeechLoop();
    }

    createRabbitElement() {
        // Container
        const container = document.createElement('div');
        container.id = 'roaming-rabbit-container';
        container.className = 'roaming-rabbit-container';
        container.style.left = `${this.x}px`;
        container.style.bottom = `20px`;

        container.innerHTML = `
            <div class="rabbit-speech-bubble" id="rabbit-bubble">
                <span class="bubble-text">Hi! I'm Blinky, Aadish's Product Bunny! Click me! 🐰</span>
                <span class="bubble-arrow"></span>
            </div>
            <div class="rabbit-body-wrapper" id="rabbit-body">
                <svg class="rabbit-svg" viewBox="0 0 100 100" width="70" height="70">
                    <!-- Fluffy Tail -->
                    <circle cx="15" cy="70" r="10" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
                    <!-- Main Body -->
                    <ellipse cx="45" cy="65" rx="30" ry="24" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
                    <!-- Feet -->
                    <ellipse cx="35" cy="88" rx="14" ry="7" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
                    <ellipse cx="65" cy="88" rx="14" ry="7" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
                    <!-- Chest fluff -->
                    <path d="M 50 55 Q 60 65 52 75 Q 40 65 50 55" fill="#f1f5f9"/>
                    <!-- Head -->
                    <circle cx="68" cy="45" r="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
                    <!-- Cheeks Blush -->
                    <circle cx="62" cy="52" r="4" fill="#fda4af" opacity="0.7"/>
                    <circle cx="76" cy="52" r="4" fill="#fda4af" opacity="0.7"/>
                    <!-- Left Ear -->
                    <g class="rabbit-ear ear-left">
                        <ellipse cx="60" cy="18" rx="7" ry="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" transform="rotate(-12 60 18)"/>
                        <ellipse cx="60" cy="18" rx="4" ry="14" fill="#fecdd3" transform="rotate(-12 60 18)"/>
                    </g>
                    <!-- Right Ear -->
                    <g class="rabbit-ear ear-right">
                        <ellipse cx="74" cy="16" rx="7" ry="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" transform="rotate(8 74 16)"/>
                        <ellipse cx="74" cy="16" rx="4" ry="14" fill="#fecdd3" transform="rotate(8 74 16)"/>
                    </g>
                    <!-- Eyes -->
                    <circle cx="64" cy="42" r="3" fill="#1e293b"/>
                    <circle cx="65" cy="41" r="1" fill="#ffffff"/>
                    <circle cx="76" cy="42" r="3" fill="#1e293b"/>
                    <circle cx="77" cy="41" r="1" fill="#ffffff"/>
                    <!-- Cute Nose -->
                    <polygon points="68,48 72,48 70,51" fill="#fb7185"/>
                    <!-- Mouth -->
                    <path d="M 67 52 Q 70 55 73 52" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </div>
        `;

        document.body.appendChild(container);
        this.rabbitEl = container;
        this.bubbleEl = container.querySelector('#rabbit-bubble');
    }

    bindEvents() {
        // Pet the rabbit
        this.rabbitEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.pet();
        });

        // Double click anywhere to drop a carrot for the rabbit
        document.addEventListener('dblclick', (e) => {
            this.spawnCarrot(e.clientX, e.clientY);
        });

        // Dedicated Carrot buttons (hero and floating)
        const feedBtns = [document.getElementById('btn-feed-carrot'), document.getElementById('btn-floating-feed')];
        feedBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    const targetX = Math.min(window.innerWidth - 100, Math.max(100, this.x + (this.facing * 180)));
                    const targetY = window.innerHeight - 100;
                    this.spawnCarrot(targetX, targetY);
                });
            }
        });
    }

    say(text, duration = 4000) {
        if (!this.bubbleEl) return;
        const textEl = this.bubbleEl.querySelector('.bubble-text');
        textEl.textContent = text;
        this.bubbleEl.classList.add('visible');

        clearTimeout(this.speechTimer);
        this.speechTimer = setTimeout(() => {
            this.bubbleEl.classList.remove('visible');
        }, duration);
    }

    pet() {
        // Heart floating effect
        this.createFloatingHeart();
        const body = this.rabbitEl.querySelector('#rabbit-body');
        body.classList.add('happy-spin');
        setTimeout(() => body.classList.remove('happy-spin'), 600);

        const funPetQuotes = [
            "*purrr* You found the sweet spot! Aadish is ready for your team! ❤️",
            "Hehe, that tickles! Have you seen Aadish's PulsePG PRD yet?",
            "Aadish is 10/10 in execution and I am 10/10 in softness! 🐰✨",
            "Aww! You're hired! ...wait, I mean, you should hire Aadish! ☕"
        ];
        const randomQuote = funPetQuotes[Math.floor(Math.random() * funPetQuotes.length)];
        this.say(randomQuote, 3500);
    }

    createFloatingHeart() {
        const heart = document.createElement('div');
        heart.className = 'rabbit-floating-heart';
        heart.textContent = '❤️';
        heart.style.left = `${this.x + 35}px`;
        heart.style.bottom = `90px`;
        document.body.appendChild(heart);

        setTimeout(() => heart.remove(), 1200);
    }

    startAutonomousRoam() {
        const roamStep = () => {
            if (!this.isHopping && !this.isEating) {
                // Randomly decide to hop somewhere
                if (Math.random() > 0.35) {
                    const maxX = window.innerWidth - 120;
                    const minX = 40;
                    const targetX = Math.floor(Math.random() * (maxX - minX)) + minX;
                    this.hopTo(targetX);
                }
            }
            const nextInterval = Math.floor(Math.random() * 4000) + 4000;
            this.roamTimer = setTimeout(roamStep, nextInterval);
        };
        setTimeout(roamStep, 2500);
    }

    startSpeechLoop() {
        setInterval(() => {
            if (!this.isEating && Math.random() > 0.4) {
                const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
                this.say(randomQuote, 4500);
            }
        }, 14000);
    }

    hopTo(targetX, onComplete = null) {
        if (this.isHopping) return;
        this.isHopping = true;

        const distance = targetX - this.x;
        this.facing = distance >= 0 ? 1 : -1;

        const body = this.rabbitEl.querySelector('#rabbit-body');
        body.style.transform = `scaleX(${this.facing})`;
        body.classList.add('hopping');

        const stepTime = 300;
        const totalSteps = Math.min(8, Math.max(2, Math.round(Math.abs(distance) / 80)));
        let currentStep = 0;
        const startX = this.x;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / totalSteps;
            this.x = startX + (distance * progress);
            this.rabbitEl.style.left = `${this.x}px`;

            if (currentStep >= totalSteps) {
                clearInterval(interval);
                body.classList.remove('hopping');
                this.isHopping = false;
                if (onComplete) onComplete();
            }
        }, stepTime);
    }

    spawnCarrot(clientX, clientY) {
        const carrot = document.createElement('div');
        carrot.className = 'falling-carrot';
        carrot.textContent = '🥕';
        carrot.style.left = `${clientX - 15}px`;
        carrot.style.top = `${clientY - 20}px`;
        document.body.appendChild(carrot);

        // Animate carrot falling to the ground
        setTimeout(() => {
            carrot.style.top = `${window.innerHeight - 60}px`;
        }, 50);

        // Rabbit reacts enthusiastically!
        this.say("Ooh, a carrot!! Coming! 🥕😋", 2500);

        setTimeout(() => {
            const targetX = Math.max(30, Math.min(window.innerWidth - 120, clientX - 35));
            this.hopTo(targetX, () => {
                this.isEating = true;
                const body = this.rabbitEl.querySelector('#rabbit-body');
                body.classList.add('eating');

                // Eat carrot
                setTimeout(() => {
                    carrot.classList.add('eaten');
                    this.say("Nom nom nom! That was delicious! 🎉", 3000);
                    setTimeout(() => {
                        carrot.remove();
                        body.classList.remove('eating');
                        this.isEating = false;
                    }, 600);
                }, 1000);
            });
        }, 500);
    }
}
