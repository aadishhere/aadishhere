/**
 * 🐰 BunnyBrain — Autonomous Artificial Life & Behavior System for Blinky
 * Gives Blinky an independent mind with organic rabbit drives, autonomous exploration,
 * loaf sleeping, carrot foraging, playful binkies, and contextual thoughts.
 */

import { bunnyGlobalState } from './bunny-state.js';

export class BunnyBrain {
    constructor(companion) {
        this.companion = companion;
        this.stateManager = bunnyGlobalState;

        // Autonomous State
        this.currentBehavior = 'idle'; // 'idle', 'wander', 'follow', 'loaf', 'binky', 'seek_carrot'
        this.behaviorTimer = 0;
        this.nextBehaviorChange = 4.0; // Seconds until next decision

        // Internal Drives (0 - 100)
        this.energy = this.stateManager.state.energy || 100;
        this.hunger = this.stateManager.state.hunger || 20;
        this.curiosity = this.stateManager.state.curiosity || 80;

        // Loaf rest tracking
        this.loafDurationSeconds = 0;
        this.lastDriveTick = performance.now();

        // Targets of interest on the page
        this.autonomousTarget = null;
    }

    tick(delta, now) {
        if (this.stateManager.state.isDead) {
            this.currentBehavior = 'dead';
            return;
        }

        // 1. Update Biological Drives over time
        if (now - this.lastDriveTick > 3000) {
            const dtSec = (now - this.lastDriveTick) / 1000;
            this.lastDriveTick = now;

            if (this.currentBehavior === 'loaf') {
                // Recover energy while resting
                this.energy = Math.min(100, this.energy + dtSec * 1.5);
                this.loafDurationSeconds += dtSec;
                if (this.loafDurationSeconds >= 60) {
                    this.stateManager.addRestMinutes(1);
                    this.loafDurationSeconds = 0;
                }
            } else if (this.currentBehavior === 'wander' || this.currentBehavior === 'follow') {
                // Drain energy while moving
                this.energy = Math.max(0, this.energy - dtSec * 0.4);
                this.hunger = Math.min(100, this.hunger + dtSec * 0.3);
            }
            this.stateManager.updateDrives(0, 0);
        }

        // 2. High-Priority Overrides: Neck Holding & Choking
        if (this.companion.isDragging) {
            this.currentBehavior = 'held';
            this.stateManager.setThought('Gasps for air! Someone is holding my neck! 🫁', 'Suffocating! ⚠️');
            return;
        }

        // 3. High-Priority Overrides: Dropped Carrot nearby
        if (this.companion.droppedCarrot) {
            this.currentBehavior = 'seek_carrot';
            return;
        }

        // 4. Autonomous State Machine Timer
        this.behaviorTimer += delta;
        if (this.behaviorTimer >= this.nextBehaviorChange) {
            this.behaviorTimer = 0;
            this.decideNextBehavior();
        }

        // 5. Execute Current Behavior Logic
        this.executeCurrentBehavior(delta);
    }

    decideNextBehavior() {
        const mouseDist = Math.hypot(
            this.companion.lastKnownPointer.x - this.companion.pagePos.x,
            this.companion.lastKnownPointer.y - this.companion.pagePos.y
        );

        // A. If energy is depleted (< 25) or stayed idle for long -> Plop into Loaf Nap
        if (this.energy < 25 && this.currentBehavior !== 'loaf') {
            this.enterLoafRest();
            this.nextBehaviorChange = 12 + Math.random() * 15; // Nap for 12-27 seconds
            return;
        }

        // B. If currently loafing, wake up once energy is healthy
        if (this.currentBehavior === 'loaf') {
            if (this.energy > 60 || mouseDist < 120) {
                this.wakeUpFromLoaf();
                this.nextBehaviorChange = 3 + Math.random() * 4;
            } else {
                this.nextBehaviorChange = 8;
            }
            return;
        }

        // C. If user recently moved mouse within range -> Curious follow
        const timeSincePointerMove = performance.now() - (this.companion.lastKnownPointer.time || 0);
        if (mouseDist > 160 && mouseDist < 600 && timeSincePointerMove < 4000) {
            this.currentBehavior = 'follow';
            this.stateManager.setThought('Following your cursor with curious hops! 👀', 'Curious & Alert 🌾');
            this.nextBehaviorChange = 4 + Math.random() * 3;
            return;
        }

        // D. Chance of playful Binky (Joy jump) if happy & high energy
        if (this.energy > 75 && this.stateManager.state.health > 80 && Math.random() < 0.2) {
            this.triggerBinky();
            this.nextBehaviorChange = 3.5;
            return;
        }

        // E. Autonomous Page Exploration (Pick a site element to inspect)
        if (Math.random() < 0.6) {
            this.pickPageExplorationTarget();
            this.currentBehavior = 'wander';
            this.nextBehaviorChange = 5 + Math.random() * 5;
            return;
        }

        // F. Default Idle & Grooming
        this.currentBehavior = 'idle';
        const idleThoughts = [
            'Sniffing around Aadish\'s portfolio... smells like clean code 🥕',
            'Twitching nose and perking ears at the surroundings ✨',
            'Enjoying a sunny spot on the screen ☀️',
            'Watching visitors explore the projects 🌾',
            'Feeling calm and cozy on the web page 😊'
        ];
        const randomThought = idleThoughts[Math.floor(Math.random() * idleThoughts.length)];
        this.stateManager.setThought(randomThought, 'Peaceful & Content');
        this.nextBehaviorChange = 3 + Math.random() * 4;
    }

    pickPageExplorationTarget() {
        const candidateSelectors = [
            '.project-card',
            '.nav-links',
            '.brand-logo',
            '.dynamic-island',
            '.bento-card',
            'h1',
            'h2',
            '.site-footer'
        ];

        let chosenEl = null;
        for (const sel of candidateSelectors) {
            const elements = document.querySelectorAll(sel);
            if (elements.length > 0) {
                chosenEl = elements[Math.floor(Math.random() * elements.length)];
                break;
            }
        }

        if (chosenEl) {
            const rect = chosenEl.getBoundingClientRect();
            this.autonomousTarget = {
                x: Math.max(80, Math.min(window.innerWidth - 80, rect.left + rect.width * (0.2 + Math.random() * 0.6))),
                y: Math.max(120, rect.top + window.scrollY + rect.height * 0.5)
            };
            const label = chosenEl.innerText ? chosenEl.innerText.slice(0, 22).trim() : 'a project card';
            this.stateManager.setThought(`Hopping over to inspect "${label}"... 🌾`, 'Exploring 🧭');
        } else {
            // Random page coordinate
            this.autonomousTarget = {
                x: 100 + Math.random() * (window.innerWidth - 200),
                y: window.scrollY + 150 + Math.random() * (window.innerHeight - 300)
            };
            this.stateManager.setThought('Scampering to explore a quiet corner of the page 🌾', 'Exploring 🧭');
        }
    }

    executeCurrentBehavior(delta) {
        if (this.currentBehavior === 'wander' && this.autonomousTarget) {
            const dx = this.autonomousTarget.x - this.companion.pagePos.x;
            const dy = this.autonomousTarget.y - this.companion.pagePos.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 35) {
                this.companion.state = 'walk';
                this.companion.gaitCycle += delta * 4.8;
                const speed = Math.min(dist * 1.5, 95);
                this.companion.pagePos.x += (dx / dist) * speed * delta;
                this.companion.pagePos.y += (dy / dist) * speed * delta;
                this.companion.currentHeading = Math.atan2(dx, dy);
            } else {
                this.companion.state = 'idle';
                this.currentBehavior = 'idle';
            }
        } else if (this.currentBehavior === 'loaf') {
            this.companion.state = 'loaf';
        }
    }

    enterLoafRest() {
        this.currentBehavior = 'loaf';
        this.companion.state = 'loaf';
        this.loafDurationSeconds = 0;
        this.stateManager.setResting(true);
    }

    wakeUpFromLoaf() {
        this.currentBehavior = 'idle';
        this.companion.state = 'idle';
        this.stateManager.setResting(false);
    }

    triggerBinky() {
        this.currentBehavior = 'binky';
        this.companion.state = 'binky';
        this.stateManager.setThought('Joyful mid-air BINKY jump! Wheee! 🐰✨', 'Pure Joy! 🌟');
        this.companion.spawnHeartReaction();
        setTimeout(() => {
            if (this.currentBehavior === 'binky') {
                this.currentBehavior = 'idle';
                this.companion.state = 'idle';
            }
        }, 1200);
    }
}
