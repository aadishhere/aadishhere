/**
 * 🐰 Blinky the Desktop Rabbit Companion ("rabbit-logic/bunny.js")
 * Realistic, lifelike 3D bunny companion built with Three.js.
 *
 * Core Behaviors:
 * - Pure Realistic Idle Companion: Stays calm and planted on the desk surface.
 *   Does not move body or hop across the screen on its own.
 * - Lifelike Facial Expressions & Micro-Life:
 *   • Natural rabbit sniffing bursts with twitching muzzle
 *   • 3D quivering whiskers in sync with nose sniffs
 *   • Independent ear movements (swiveling, listening to cursor, subtle twitches)
 *   • Natural eye blinking (soft periodic blinks)
 *   • Gentle head glances tracking the cursor within natural rabbit biomechanics
 *   • Calm, slow rhythmic chest breathing
 * - Scruff-of-Neck Dragging:
 *   • Can be picked up and repositioned anywhere on the page
 *   • Folds naturally from the neck, dangling with pendulum inertia
 *   • Clinical Oxygen / Heart Rate monitoring with audible pulse and EKG
 * - Realistic Death State:
 *   • When oxygen reaches 0%, rabbit suffocates and falls flat on its side
 *   • All animation tracks are frozen immediately: hands and legs STOP MOVING completely
 *   • Total lifeless stillness until revived via Admin Revive or WhatsApp/Email
 */

import { bunnyGlobalState } from './bunny-state.js';
import { bunnyFirebaseSync } from './bunny-firebase.js';

export class BunnyCompanion {
    constructor(options = {}) {
        this.options = {
            modelPath: 'assets/rabbit.glb',
            scale: 1.0,
            primaryColor: '#38bdf8',
            adminPhone: '',
            adminEmail: 'aadishhere@gmail.com',
            ...options
        };
        this.gltfBaseScale = 1.0;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;

        // 3D Meshes & Rigging
        this.bunnyRoot = null;
        this.gltfScene = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.isGltfLoaded = false;
        this.gltfNodes = null;
        this.gltfWhiskers = null;

        // Document-Space Coordinates (Natural resting spot on right side of desk)
        this.pagePos = {
            x: Math.min(window.innerWidth - 120, Math.floor(window.innerWidth * 0.82)),
            y: 220
        };
        this.state = 'idle'; // 'idle', 'held', 'fainted', 'pant'

        // Screen & Pointer Awareness Logic
        this.isUserOnScreen = true;
        this.isUserInteracting = false;
        this.lastUserInteractingTime = 0;
        this.lastUserActivityTime = performance.now();
        this.safeDistance = 120; // Respectful safe distance
        this.safeBubble = 75; // Personal boundary threshold

        // Target movement for safe corner evasion & polite distance
        this.targetPagePos = null;
        this.isHopping = false;
        this.hopCycle = 0;

        // Random Joyful Backflip (Binky)
        this.isBackflipping = false;
        this.backflipStartTime = 0;
        this.backflipDuration = 950; // ms
        this.lastBackflipTime = performance.now() + 6000;
        this.nextBackflipInterval = 28000 + Math.random() * 20000; // Random 28-48s

        // Pointer tracking for subtle inquisitive head glance
        this.lastKnownPointer = {
            x: this.pagePos.x,
            y: this.pagePos.y,
            time: performance.now()
        };

        // Draggable & Scruff Neck State
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dangleSway = 0;
        this.targetDangleSway = 0;
        this.lastDragEndTime = 0;

        // Vitals & Suffocation / Dying State System
        this.oxygenLevel = 100;
        this.heartRate = 140;
        this.cornerCapsuleEl = null;
        this.ekgCanvas = null;
        this.ekgCtx = null;
        this.ekgBuffer = new Float32Array(140);
        this.ekgBuffer.fill(14); // Baseline at midY
        this.ekgBeatTimer = 0;
        this.currentBeatParams = {
            pHeight: 2.2,
            qDepth: 2.8,
            rHeight: 12.0,
            sDepth: 6.5,
            tHeight: 3.2,
            sinusArrhythmia: 1.0
        };
        this.lastBeepTime = 0;
        this.pantStartTime = 0;
        this.audioCtx = null;
        this.lastPetTime = 0;

        // Clock
        this.clock = new THREE.Clock();

        // Subscribe to Global State (LocalStorage & Firebase)
        this.stateManager = bunnyGlobalState;
    }

    init() {
        this.createCanvas();
        this.initCornerCapsule();
        this.setupThreeScene();
        this.buildRabbitRoot();
        this.loadGLTFModel();
        this.bindEvents();
        this.listenToGlobalState();
        bunnyFirebaseSync.init();
        this.animate();
    }

    createCanvas() {
        if (document.getElementById('three-fullpage-rabbit-canvas')) {
            this.canvas = document.getElementById('three-fullpage-rabbit-canvas');
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.id = 'three-fullpage-rabbit-canvas';
        document.body.appendChild(canvas);
        this.canvas = canvas;
    }

    setupThreeScene() {
        this.scene = new THREE.Scene();

        const w = window.innerWidth;
        const h = window.innerHeight;
        const aspect = w / h;

        // Pure 2D Orthographic Parallel Camera (Zero perspective warp)
        const frustumH = 8.284;
        const frustumW = frustumH * aspect;
        this.camera = new THREE.OrthographicCamera(
            -frustumW / 2, frustumW / 2,
            frustumH / 2, -frustumH / 2,
            0.1, 100
        );
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        window.addEventListener('resize', () => {
            const nw = window.innerWidth;
            const nh = window.innerHeight;
            const naspect = nw / nh;

            const nFrustumH = 8.284;
            const nFrustumW = nFrustumH * naspect;
            this.camera.left = -nFrustumW / 2;
            this.camera.right = nFrustumW / 2;
            this.camera.top = nFrustumH / 2;
            this.camera.bottom = -nFrustumH / 2;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(nw, nh);
            this.clampToBounds();
        });

        // Surface Desk Lighting: Warm, uniform daylight
        const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.4);
        this.scene.add(ambientLight);

        const keyLight = new THREE.DirectionalLight(0xffedd5, 1.3);
        keyLight.position.set(4, 8, 8);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
        fillLight.position.set(-6, -2, 6);
        this.scene.add(fillLight);
    }

    buildRabbitRoot() {
        this.bunnyRoot = new THREE.Group();
        this.bunnyRoot.position.set(0, 0, 0);
        this.scene.add(this.bunnyRoot);
    }

    screenToWorld(screenX, screenY) {
        const x = (screenX / window.innerWidth) * 2 - 1;
        const y = -(screenY / window.innerHeight) * 2 + 1;
        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(this.camera);
        return new THREE.Vector3(vector.x, vector.y, 0);
    }

    worldToScreen(worldPos) {
        const v = worldPos.clone().project(this.camera);
        return {
            x: ((v.x + 1) * window.innerWidth) / 2,
            y: ((-v.y + 1) * window.innerHeight) / 2
        };
    }

    clampToBounds() {
        const minX = 70;
        const maxX = Math.max(minX, window.innerWidth - 75);
        const scrollY = window.scrollY || 0;
        const minY = scrollY + 70;
        const maxY = Math.max(minY, scrollY + window.innerHeight - 85);

        this.pagePos.x = Math.max(minX, Math.min(maxX, this.pagePos.x));
        this.pagePos.y = Math.max(minY, Math.min(maxY, this.pagePos.y));
    }

    clampTargetToBounds() {
        if (!this.targetPagePos) return;
        const minX = 70;
        const maxX = Math.max(minX, window.innerWidth - 75);
        const scrollY = window.scrollY || 0;
        const minY = scrollY + 70;
        const maxY = Math.max(minY, scrollY + window.innerHeight - 85);

        this.targetPagePos.x = Math.max(minX, Math.min(maxX, this.targetPagePos.x));
        this.targetPagePos.y = Math.max(minY, Math.min(maxY, this.targetPagePos.y));
    }

    evacuateToSafeCorner(cursorClientX) {
        if (this.isDragging || this.state === 'fainted' || this.stateManager.state.isDead) return;

        let targetX, targetY;
        const scrollY = window.scrollY || 0;
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (cursorClientX > winW / 2) {
            // User interacting on right half -> retreat to safe left margin
            targetX = 85;
            targetY = scrollY + Math.min(winH - 95, Math.max(130, winH * 0.75));
        } else {
            // User interacting on left half -> retreat to safe right margin (above corner capsule)
            targetX = winW - 85;
            targetY = scrollY + Math.min(winH - 150, Math.max(130, winH * 0.35));
        }

        const currentDist = Math.hypot(this.pagePos.x - targetX, this.pagePos.y - targetY);
        if (currentDist > 65) {
            this.targetPagePos = { x: targetX, y: targetY };
            this.clampTargetToBounds();
        }
    }

    loadGLTFModel() {
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('[BunnyCompanion] THREE.GLTFLoader not found.');
            return;
        }

        const loader = new THREE.GLTFLoader();
        const candidatePaths = [
            this.options.modelPath,
            'assets/rabbit.glb',
            'rabbit.glb',
            '../assets/rabbit.glb'
        ];

        const tryLoad = (idx) => {
            if (idx >= candidatePaths.length) return;
            loader.load(
                candidatePaths[idx],
                (gltf) => {
                    this.setupGLTFModel(gltf);
                },
                undefined,
                () => tryLoad(idx + 1)
            );
        };
        tryLoad(0);
    }

    setupGLTFModel(gltf) {
        if (this.gltfScene) {
            this.bunnyRoot.remove(this.gltfScene);
            this.gltfScene = null;
        }

        const model = gltf.scene;

        // Auto-normalize bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const desiredSize = 0.90; // Proportional desktop scale
            const s = desiredSize / maxDim;
            model.scale.set(s, s, s);
            this.gltfBaseScale = s;
            model.position.x = -center.x * s;
            model.position.y = -box.min.y * s - 0.28;
            model.position.z = -center.z * s;
        }

        // Soft animal fur finish
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.roughness = 0.95;
                child.material.metalness = 0.0;
                if (child.material.map) {
                    child.material.map.encoding = THREE.sRGBEncoding;
                    child.material.map.needsUpdate = true;
                }
            }
        });

        // Face forward toward viewer: 180 deg
        model.rotation.y = Math.PI;

        // 2D Top-Down Desk Pitch (~22 deg / 0.38 rad)
        model.rotation.x = 0.38;

        this.bunnyRoot.add(model);
        this.gltfScene = model;
        this.isGltfLoaded = true;

        // Bones & articulated nodes
        this.gltfNodes = {
            head: model.getObjectByName('head_14'),
            earL: model.getObjectByName('ear_left_13'),
            earR: model.getObjectByName('ear_right_11'),
            muzzle: model.getObjectByName('muzzle_7'),
            cheekL: model.getObjectByName('cheek_l_9'), // Left Eye
            cheekR: model.getObjectByName('cheek_r_8'), // Right Eye
            tail: model.getObjectByName('tail_4') || model.getObjectByName('tail_2'),
            torso: model.getObjectByName('torso_0') || model.getObjectByName('body_5'),
            legFrontR: model.getObjectByName('leg_front_right_17'),
            legFrontL: model.getObjectByName('leg_front_left_20'),
            legHindR: model.getObjectByName('leg_hind_right_24'),
            legHindL: model.getObjectByName('leg_hind_left_28')
        };

        // Whiskers
        if (this.gltfNodes.head) {
            const whiskerGroup = new THREE.Group();
            const whiskerMat = new THREE.LineBasicMaterial({
                color: 0x221714,
                transparent: true,
                opacity: 0.85
            });

            [-0.14, 0, 0.14].forEach((ang) => {
                const geo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(-0.06, 0.02, -0.22),
                    new THREE.Vector3(-0.26, 0.02 + Math.sin(ang) * 0.04, -0.28 + ang * 0.06)
                ]);
                whiskerGroup.add(new THREE.Line(geo, whiskerMat));
            });

            [-0.14, 0, 0.14].forEach((ang) => {
                const geo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0.06, 0.02, -0.22),
                    new THREE.Vector3(0.26, 0.02 + Math.sin(ang) * 0.04, -0.28 + ang * 0.06)
                ]);
                whiskerGroup.add(new THREE.Line(geo, whiskerMat));
            });

            this.gltfNodes.head.add(whiskerGroup);
            this.gltfWhiskers = whiskerGroup;
        }

        // Animation mixer
        this.animations = {};
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                this.animations[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
            });
            if (gltf.animations[0]) {
                const runAction = this.mixer.clipAction(gltf.animations[0]);
                runAction.setLoop(THREE.LoopRepeat);
                runAction.timeScale = 1.35;
                this.animations['run'] = runAction;
            }
        }

        // Initialize state: Stop all mixer animations so paws remain calmly planted
        if (this.stateManager.state.isDead) {
            this.applyDeadPoseImmediate();
        } else {
            this.state = 'idle';
            if (this.mixer) {
                this.mixer.stopAllAction();
            }
        }
    }

    applyDeadPoseImmediate() {
        this.state = 'fainted';
        this.oxygenLevel = 0;

        // STOP all animation tracks immediately - hands and legs freeze completely
        if (this.mixer) {
            this.mixer.stopAllAction();
        }

        if (this.gltfScene) {
            this.gltfScene.rotation.z = Math.PI / 2; // Flat on side
            this.gltfScene.rotation.x = 0.05;
            this.gltfScene.position.y = -0.36; // Settled flat on desk
        }

        // Relax all limbs and facial features to completely limp dead state
        if (this.gltfNodes) {
            // Limp hands and legs - zero movement
            if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.set(0, 0, 0);
            if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.set(0, 0, 0);
            if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.set(0, 0, 0);
            if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.set(0, 0, 0);

            // Head and ears limp
            if (this.gltfNodes.head) this.gltfNodes.head.rotation.set(-0.2, 0, 0);
            if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.set(0, 0, -0.7);
            if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.set(0, 0, -0.5);

            // Eyes closed flatline
            if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.set(1.0, 0.05, 1.0);
            if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.set(1.0, 0.05, 1.0);

            // Muzzle still
            if (this.gltfNodes.muzzle) {
                this.gltfNodes.muzzle.position.set(0, 0, -0.231);
                this.gltfNodes.muzzle.scale.set(1.0, 1.0, 1.0);
            }
        }

        this.updateCornerCapsule(0, 0, false);
    }

    playAnimation(name) {
        if (!this.mixer) return;
        const action = this.animations[name] || this.animations['run'];
        if (!action) return;

        if (this.currentAction === action) return;
        if (this.currentAction) {
            this.currentAction.fadeOut(0.2);
        }
        action.reset().fadeIn(0.2).play();
        this.currentAction = action;
    }

    stopAnimation() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        this.currentAction = null;
    }

    // --- UI: Sleek Corner Capsule Pill Widget & Pure Vitals Drawer ---
    initCornerCapsule() {
        if (document.getElementById('bunny-corner-capsule')) return;

        const capsule = document.createElement('div');
        capsule.id = 'bunny-corner-capsule';

        const waText = encodeURIComponent("Hey Aadish, I accidentally suffocated your website bunny Blinky 😭 Can you please revive him?");
        const mailSubject = encodeURIComponent("Blinky is dead! Please revive him");
        const mailBody = encodeURIComponent("Hey Aadish,\n\nI suffocated Blinky on your site and he is dead.\n\nPlease revive him with your admin master code!\n\nBest,");

        capsule.innerHTML = `
            <!-- The Expandable Vitals Drawer -->
            <div class="bunny-drawer" id="bunny-drawer">
                <div class="bunny-drawer-header">
                    <div class="bunny-drawer-title">
                        <span>🐰 Blinky's Vitals</span>
                    </div>
                    <button class="bunny-drawer-close" id="btn-close-drawer" title="Close drawer">✕</button>
                </div>

                <!-- Pure Vitals 2-Column Grid -->
                <div class="bunny-stats-grid">
                    <div class="bunny-stat-card">
                        <div class="bunny-stat-label">🫁 Oxygen</div>
                        <div class="bunny-stat-val" id="drawer-spo2-val">100% SpO2</div>
                        <div class="bunny-stat-meta" id="drawer-bpm-val">140 bpm</div>
                    </div>
                    <div class="bunny-stat-card">
                        <div class="bunny-stat-label">❤️ Health</div>
                        <div class="bunny-stat-val" id="drawer-health-val">100%</div>
                        <div class="bunny-stat-meta" id="drawer-health-meta">Healthy</div>
                    </div>
                </div>

                <!-- Clinical EKG Waveform in Drawer -->
                <div class="bunny-ekg-row">
                    <canvas id="capsule-ekg-canvas" width="140" height="28"></canvas>
                    <div class="bunny-ekg-meta">
                        <div class="bunny-ekg-spo2" id="drawer-spo2-text">100%</div>
                        <div class="bunny-ekg-bpm">PULSE LIVE</div>
                    </div>
                </div>

                <!-- Actions / Revival Notice inside Drawer -->
                <div class="bunny-drawer-actions">
                    <!-- Emergency Revival Notice (Shown strictly when dead) -->
                    <div id="drawer-death-actions" class="bunny-death-notice-box" style="display: none;">
                        <div class="bunny-death-notice-title">⚠️ Blinky Suffocated & Died</div>
                        <div class="bunny-death-notice-meta" id="drawer-death-time">Dead since: Just now</div>
                        <div class="bunny-death-notice-desc">Someone held Blinky's neck until oxygen reached 0%. Notify Aadish to revive him, or use Admin Revive below.</div>
                        <a href="https://api.whatsapp.com/send?text=${waText}" target="_blank" class="bunny-action-btn bunny-btn-whatsapp-drawer">
                            <span>💬 Notify Aadish on WhatsApp</span>
                        </a>
                        <a href="mailto:${this.options.adminEmail}?subject=${mailSubject}&body=${mailBody}" class="bunny-action-btn bunny-btn-email-drawer">
                            <span>✉️ Email Aadish to Revive Pet</span>
                        </a>
                        <button class="bunny-action-btn bunny-btn-admin-revive" id="btn-drawer-admin-revive">
                            <span>⚡ I am Aadish (Admin Revive)</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- The Corner Pill (Always Visible) -->
            <div class="bunny-capsule-pill" id="bunny-pill">
                <div class="bunny-status-orb" id="bunny-pill-orb"></div>
                <div class="bunny-capsule-icon">🐰</div>
                <div class="bunny-capsule-info">
                    <div class="bunny-capsule-title">
                        <span>Blinky</span>
                        <span id="bunny-pill-status" class="bunny-pill-badge">Healthy</span>
                    </div>
                    <div class="bunny-capsule-subtitle" id="bunny-pill-stats">🫁 100% O₂ • 140 bpm</div>
                </div>
                <button class="bunny-pill-revive-btn" id="btn-pill-revive" style="display: none;" title="Revive Blinky">
                    <span>⚡ Revive</span>
                </button>
                <div class="bunny-capsule-chevron">▲</div>
            </div>
        `;

        document.body.appendChild(capsule);
        this.cornerCapsuleEl = capsule;
        this.ekgCanvas = document.getElementById('capsule-ekg-canvas');
        if (this.ekgCanvas) this.ekgCtx = this.ekgCanvas.getContext('2d');

        // Toggle drawer
        const pill = document.getElementById('bunny-pill');
        pill.addEventListener('click', (e) => {
            if (e.target.closest('#btn-pill-revive')) return;
            capsule.classList.toggle('expanded');
        });

        document.getElementById('btn-close-drawer').addEventListener('click', () => {
            capsule.classList.remove('expanded');
        });

        // Revive buttons
        const handleRevive = (e) => {
            e.stopPropagation();
            this.stateManager.adminRevive();
            capsule.classList.remove('expanded');
        };
        document.getElementById('btn-pill-revive').addEventListener('click', handleRevive);
        document.getElementById('btn-drawer-admin-revive').addEventListener('click', handleRevive);
    }

    openCapsuleDrawer() {
        if (this.cornerCapsuleEl) {
            this.cornerCapsuleEl.classList.add('expanded');
        }
    }

    updateCornerCapsule(spo2, bpm, isChoking) {
        if (!this.cornerCapsuleEl) return;
        const st = this.stateManager.state;
        const orb = document.getElementById('bunny-pill-orb');
        const statusBadge = document.getElementById('bunny-pill-status');
        const statsPill = document.getElementById('bunny-pill-stats');
        const spo2El = document.getElementById('drawer-spo2-val');
        const spo2Text = document.getElementById('drawer-spo2-text');
        const bpmEl = document.getElementById('drawer-bpm-val');
        const healthEl = document.getElementById('drawer-health-val');
        const healthMeta = document.getElementById('drawer-health-meta');

        const spo2Rounded = Math.round(spo2);
        if (spo2El) spo2El.textContent = `${spo2Rounded}% SpO2`;
        if (spo2Text) spo2Text.textContent = `${spo2Rounded}%`;
        if (bpmEl) bpmEl.textContent = `${Math.round(bpm)} bpm`;

        if (orb) {
            orb.className = 'bunny-status-orb';
            if (st.isDead) orb.classList.add('dead');
            else if (isChoking) orb.classList.add('choking');
            else if (st.isSick) orb.classList.add('sick');
        }

        const deathBox = document.getElementById('drawer-death-actions');
        const reviveBtn = document.getElementById('btn-pill-revive');

        if (st.isDead) {
            if (statusBadge) {
                statusBadge.textContent = 'Dead 💀';
                statusBadge.className = 'bunny-pill-badge dead';
            }
            if (statsPill) {
                statsPill.textContent = 'FLATLINE • O₂ 0%';
            }
            if (healthEl) healthEl.textContent = '0%';
            if (healthMeta) healthMeta.textContent = 'Suffocated';
            if (deathBox) deathBox.style.display = 'block';
            if (reviveBtn) reviveBtn.style.display = 'inline-flex';

            const timeEl = document.getElementById('drawer-death-time');
            if (timeEl && st.deadSince) {
                const elapsedMin = Math.floor((Date.now() - st.deadSince) / 60000);
                timeEl.textContent = `Dead since: ${elapsedMin < 1 ? 'Just now' : elapsedMin + 'm ago'}`;
            }
        } else {
            if (deathBox) deathBox.style.display = 'none';
            if (reviveBtn) reviveBtn.style.display = 'none';

            if (isChoking) {
                if (statusBadge) {
                    statusBadge.textContent = 'Choking! ⚠️';
                    statusBadge.className = 'bunny-pill-badge choking';
                }
                if (statsPill) {
                    statsPill.textContent = `🫁 ${spo2Rounded}% O₂ • ${Math.round(bpm)} bpm`;
                }
                if (healthEl) healthEl.textContent = `${Math.round(spo2)}%`;
                if (healthMeta) healthMeta.textContent = 'Suffocating!';
            } else {
                if (statusBadge) {
                    statusBadge.textContent = st.isSick ? 'Sick 🤒' : 'Healthy ✨';
                    statusBadge.className = st.isSick ? 'bunny-pill-badge sick' : 'bunny-pill-badge';
                }
                if (statsPill) {
                    statsPill.textContent = `🫁 ${spo2Rounded}% O₂ • ${Math.round(bpm)} bpm`;
                }
                if (healthEl) healthEl.textContent = `${Math.round(st.health || 100)}%`;
                if (healthMeta) healthMeta.textContent = st.isSick ? 'Low Oxygen' : 'Healthy';
            }
        }
    }

    drawEKGWave(delta) {
        if (!this.ekgCtx || !this.ekgCanvas) return;
        const ctx = this.ekgCtx;
        const w = this.ekgCanvas.width;
        const h = this.ekgCanvas.height;
        const midY = h / 2;

        const isDead = this.stateManager.state.isDead || (this.state === 'fainted');

        // Measured clinical scroll speed (~45px per second for clear, readable sweep)
        const scrollSpeed = 45;
        const pixelsToAdvance = Math.max(1, Math.round(scrollSpeed * delta * 1.4));

        if (isDead) {
            // Flatline: scroll flat baseline
            for (let i = 0; i < pixelsToAdvance; i++) {
                this.ekgBuffer.copyWithin(0, 1);
                this.ekgBuffer[w - 1] = midY;
            }
        } else {
            // Heartbeat duration based on current heartRate with subtle natural sinus arrhythmia
            const baseInterval = (60 / this.heartRate);
            const beatInterval = baseInterval * (this.currentBeatParams.sinusArrhythmia || 1.0);

            for (let i = 0; i < pixelsToAdvance; i++) {
                const dt = delta / pixelsToAdvance;
                this.ekgBeatTimer += dt;

                const phase = this.ekgBeatTimer / beatInterval;
                let sampleY = midY;
                const noise = (Math.random() - 0.5) * 0.45; // Subtle electrical baseline hiss

                if (phase < 0.12) {
                    // Baseline
                    sampleY = midY + noise;
                } else if (phase < 0.22) {
                    // P wave (atrial depolarization)
                    const p = (phase - 0.12) / 0.10;
                    sampleY = midY - Math.sin(p * Math.PI) * this.currentBeatParams.pHeight + noise;
                } else if (phase < 0.28) {
                    // PR segment
                    sampleY = midY + noise;
                } else if (phase < 0.32) {
                    // Q wave (initial dip / minor town)
                    const q = (phase - 0.28) / 0.04;
                    sampleY = midY + Math.sin(q * Math.PI) * this.currentBeatParams.qDepth;
                } else if (phase < 0.40) {
                    // R wave (THE PIKE! Sharp systolic spike upward)
                    const r = (phase - 0.32) / 0.08;
                    sampleY = midY - Math.sin(r * Math.PI) * this.currentBeatParams.rHeight;
                } else if (phase < 0.46) {
                    // S wave (DEEP TOWN / valley downward)
                    const s = (phase - 0.40) / 0.06;
                    sampleY = midY + Math.sin(s * Math.PI) * this.currentBeatParams.sDepth;
                } else if (phase < 0.54) {
                    // ST segment
                    sampleY = midY + noise;
                } else if (phase < 0.70) {
                    // T wave (ventricular repolarization dome)
                    const t = (phase - 0.54) / 0.16;
                    sampleY = midY - Math.sin(t * Math.PI) * this.currentBeatParams.tHeight + noise;
                } else {
                    // TP interval (diastolic rest)
                    sampleY = midY + noise;
                }

                // Scroll buffer left by 1px and push newest sample
                this.ekgBuffer.copyWithin(0, 1);
                this.ekgBuffer[w - 1] = sampleY;

                // When current beat completes, generate random pike and town parameters for next beat!
                if (this.ekgBeatTimer >= beatInterval) {
                    this.ekgBeatTimer = 0;
                    const isExtraPike = Math.random() < 0.28; // Occasional extra energetic pike
                    this.currentBeatParams = {
                        pHeight: 1.8 + Math.random() * 0.9,
                        qDepth: 1.8 + Math.random() * 2.2, // Random minor town (dip)
                        rHeight: isExtraPike ? (13.5 + Math.random() * 1.5) : (9.5 + Math.random() * 3.2), // Random pike (spike)
                        sDepth: 4.8 + Math.random() * 3.4, // Random deep town (valley)
                        tHeight: 2.2 + Math.random() * 1.6,
                        sinusArrhythmia: 0.93 + Math.random() * 0.14 // Natural physiological variation
                    };
                }
            }
        }

        // Dark oscilloscope phosphor background
        ctx.fillStyle = 'rgba(10, 15, 29, 0.55)';
        ctx.fillRect(0, 0, w, h);

        // Grid lines (subtle medical ECG monitor grid)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, midY); ctx.lineTo(w, midY);
        for (let gx = 28; gx < w; gx += 28) {
            ctx.moveTo(gx, 0); ctx.lineTo(gx, h);
        }
        ctx.stroke();

        // Neon Glow Trace
        const strokeColor = isDead ? '#ef4444' : (this.oxygenLevel < 60 ? '#f59e0b' : '#10b981');
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 4;
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        for (let x = 0; x < w; x++) {
            const y = this.ekgBuffer[x];
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
    }

    initAudio() {
        if (this.audioCtx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (_) {}
    }

    playPulseBeep() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const freq = Math.max(380, Math.min(950, (this.oxygenLevel / 100) * 880));
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.08);
        } catch (_) {}
    }

    playFlatlineBeep() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.6);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 1.6);
        } catch (_) {}
    }

    faintFromChoking() {
        this.state = 'fainted';
        this.isDragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        this.targetDangleSway = 0;

        // STOP all animation tracks - hands and legs freeze completely
        if (this.mixer) {
            this.mixer.stopAllAction();
        }

        this.stateManager.setDead(true);
        this.playFlatlineBeep();
        this.applyDeadPoseImmediate();
    }

    reviveBunny() {
        this.state = 'idle';
        this.oxygenLevel = 100;
        this.heartRate = 140;

        if (this.gltfScene) {
            this.gltfScene.rotation.z = 0;
            this.gltfScene.rotation.x = 0.38;
            this.gltfScene.position.y = -0.28;
            this.bunnyRoot.rotation.z = 0;
            this.bunnyRoot.rotation.y = 0;
        }

        if (this.gltfNodes) {
            if (this.gltfNodes.head) this.gltfNodes.head.rotation.set(0, 0, 0);
            if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.set(0, 0, 0);
            if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.set(0, 0, 0);
            if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.set(1, 1, 1);
            if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.set(1, 1, 1);
            if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.set(0, 0, 0);
            if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.set(0, 0, 0);
            if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.set(0, 0, 0);
            if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.set(0, 0, 0);
        }

        // Stop any running animations
        if (this.mixer) {
            this.mixer.stopAllAction();
        }

        this.spawnFloatingHeart();
        this.updateCornerCapsule(100, 140, false);
    }

    spawnFloatingHeart() {
        const heart = document.createElement('div');
        heart.className = 'rabbit-floating-heart';
        heart.textContent = '❤️';
        const screenX = this.pagePos.x;
        const screenY = this.pagePos.y - window.scrollY;
        heart.style.left = `${screenX + 8}px`;
        heart.style.top = `${screenY - 24}px`;
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
    }

    bindEvents() {
        // --- 1. Screen & Window Awareness ---
        document.addEventListener('mouseleave', () => {
            this.isUserOnScreen = false;
        });

        document.addEventListener('mouseenter', () => {
            this.isUserOnScreen = true;
            this.lastUserActivityTime = performance.now();
        });

        window.addEventListener('blur', () => {
            this.isUserOnScreen = false;
        });

        window.addEventListener('focus', () => {
            this.isUserOnScreen = true;
            this.lastUserActivityTime = performance.now();
        });

        window.addEventListener('scroll', () => {
            this.lastUserActivityTime = performance.now();
            this.clampToBounds();
        }, { passive: true });

        // --- 2. Pointer Down (Scruff Dragging & Interaction Trigger) ---
        window.addEventListener('pointerdown', (e) => {
            const screenX = this.pagePos.x;
            const screenY = this.pagePos.y - window.scrollY;
            const dist = Math.hypot(e.clientX - screenX, e.clientY - screenY);

            if (dist < 37) {
                // Clicking on rabbit
                if (this.state === 'fainted' || this.stateManager.state.isDead) {
                    this.openCapsuleDrawer();
                    return;
                }

                this.initAudio();
                this.isDragging = true;
                this.targetPagePos = null;
                this.isHopping = false;
                this.isBackflipping = false;
                this.dragOffset = { x: this.pagePos.x - e.pageX, y: this.pagePos.y - e.pageY };
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'grabbing';
                this.state = 'held';
                this.playAnimation('run'); // Dangle legs in air while held
                this.targetDangleSway = 0;
                this.dangleSway = 0;
                e.preventDefault();
                return;
            }

            // User clicked elsewhere on interactive content
            const target = e.target;
            if (target && target.closest('button, a, input, textarea, select, [role="button"], [tabindex], nav, header, footer, form, .control-icon-btn, .nav-link, .brand-logo, .site-header, .site-footer')) {
                this.isUserInteracting = true;
                this.lastUserInteractingTime = performance.now();
                this.evacuateToSafeCorner(e.clientX);
            }
        });

        // --- 3. Pointer Move (Exploration, Safe Distance & Content Awareness) ---
        window.addEventListener('pointermove', (e) => {
            this.isUserOnScreen = true;
            this.lastUserActivityTime = performance.now();

            if (this.isDragging) {
                this.pagePos.x = e.pageX + this.dragOffset.x;
                this.pagePos.y = e.pageY + this.dragOffset.y;
                this.clampToBounds();
                const vx = e.movementX;
                if (Math.abs(vx) > 0.4) {
                    this.targetDangleSway = -Math.max(-0.65, Math.min(0.65, vx * 0.05));
                }
                return;
            }

            // Tactile hover feedback
            const screenX = this.pagePos.x;
            const screenY = this.pagePos.y - window.scrollY;
            const dist = Math.hypot(e.clientX - screenX, e.clientY - screenY);
            if (dist < 37) {
                document.body.style.cursor = (this.state === 'fainted' || this.stateManager.state.isDead) ? 'pointer' : 'grab';
            } else if (document.body.style.cursor === 'grab' || document.body.style.cursor === 'pointer') {
                document.body.style.cursor = '';
            }

            // Save pointer position for gentle head glancing
            this.lastKnownPointer = {
                x: e.pageX,
                y: e.pageY,
                time: performance.now()
            };

            // Detect interactive elements under the pointer
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const isInteractive = !!(el && el.closest('button, a, input, textarea, select, [role="button"], [tabindex], nav, header, footer, form, .control-icon-btn, .nav-link, .brand-logo, .site-header, .site-footer, .bunny-drawer, .bunny-capsule-pill, .bunny-action-btn'));

            if (isInteractive) {
                this.isUserInteracting = true;
                this.lastUserInteractingTime = performance.now();
                this.evacuateToSafeCorner(e.clientX);
            } else {
                if (performance.now() - this.lastUserInteractingTime > 1800) {
                    this.isUserInteracting = false;
                }
            }
        }, { passive: false });

        // --- 4. Pointer Up (Release from Drag) ---
        window.addEventListener('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.clampToBounds();
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                this.targetDangleSway = 0;

                if (this.state !== 'fainted') {
                    this.bunnyRoot.rotation.z = 0;
                    if (this.gltfScene) {
                        this.gltfScene.rotation.z = 0;
                        this.gltfScene.rotation.x = 0.38;
                    }
                    if (this.oxygenLevel < 95) {
                        this.state = 'pant';
                        this.pantStartTime = performance.now();
                        this.stopAnimation();
                    } else {
                        this.state = 'idle';
                        this.stopAnimation();
                    }
                    this.lastKnownPointer = { x: this.pagePos.x, y: this.pagePos.y, time: performance.now() };
                }
                this.lastDragEndTime = performance.now();
            }
        });
    }

    listenToGlobalState() {
        this.stateManager.subscribe((st) => {
            if (st.isDead) {
                if (this.state !== 'fainted') {
                    this.applyDeadPoseImmediate();
                }
            } else {
                if (this.state === 'fainted') {
                    this.reviveBunny();
                }
            }
            this.updateCornerCapsule(this.oxygenLevel, this.heartRate, false);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();
        const now = performance.now();

        // Update mixer when active in air while being held OR while hopping/running
        if (this.mixer && (this.isDragging || this.isHopping)) {
            this.mixer.update(delta);
        }

        // --- Safe-Distance Pointer Following Controller ---
        // When user is exploring or moving pointer in open space, rabbit follows along
        // while maintaining a polite, respectful safe distance (~120px)
        if (
            this.isUserOnScreen &&
            !this.isUserInteracting &&
            !this.isBackflipping &&
            !this.isDragging &&
            this.state !== 'fainted' &&
            !this.stateManager.state.isDead
        ) {
            const distToCursor = Math.hypot(this.lastKnownPointer.x - this.pagePos.x, this.lastKnownPointer.y - this.pagePos.y);

            if (distToCursor > 165) {
                // Pointer moved away: follow pointer, stopping at safeDistance (120px)
                const angle = Math.atan2(this.pagePos.y - this.lastKnownPointer.y, this.pagePos.x - this.lastKnownPointer.x);
                const targetX = this.lastKnownPointer.x + Math.cos(angle) * this.safeDistance;
                const targetY = this.lastKnownPointer.y + Math.sin(angle) * this.safeDistance;
                this.targetPagePos = { x: targetX, y: targetY };
                this.clampTargetToBounds();
            } else if (distToCursor < 75) {
                // Pointer encroaching too close: step back to safeDistance
                const angle = (distToCursor < 1) ? (Math.random() * Math.PI * 2) : Math.atan2(this.pagePos.y - this.lastKnownPointer.y, this.pagePos.x - this.lastKnownPointer.x);
                const targetX = this.lastKnownPointer.x + Math.cos(angle) * this.safeDistance;
                const targetY = this.lastKnownPointer.y + Math.sin(angle) * this.safeDistance;
                this.targetPagePos = { x: targetX, y: targetY };
                this.clampTargetToBounds();
            }
        }

        // Polite Corner / Safe Boundary Relocation (Hopping & Running with Full 3D Orientation)
        if (this.targetPagePos && !this.isDragging && this.state !== 'fainted' && !this.stateManager.state.isDead) {
            const dx = this.targetPagePos.x - this.pagePos.x;
            const dy = this.targetPagePos.y - this.pagePos.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 14) {
                this.pagePos.x = this.targetPagePos.x;
                this.pagePos.y = this.targetPagePos.y;
                this.targetPagePos = null;
                this.isHopping = false;
                this.stopAnimation();
            } else {
                this.isHopping = true;
                this.playAnimation('run');
                this.hopCycle += delta * 9.5;
                const hopLift = Math.abs(Math.sin(this.hopCycle)) * 0.18;

                const speed = Math.min(dist * 4.2 + 80, 240);
                this.pagePos.x += (dx / dist) * speed * delta;
                this.pagePos.y += (dy / dist) * speed * delta;

                // REALISTIC 3D HEADING ORIENTATION:
                // Rabbit rotates to face EXACTLY the direction of travel,
                // naturally exposing all respective sides (left, right, back, diagonal, front)!
                const targetHeading = Math.atan2(dx, dy);
                let diff = targetHeading - this.bunnyRoot.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                this.bunnyRoot.rotation.y += diff * Math.min(1.0, delta * 12.0);

                if (this.gltfScene) {
                    this.gltfScene.position.y = -0.28 + hopLift;
                    // Forward rabbit pitch during bounding stride
                    this.gltfScene.rotation.x = 0.38 + Math.sin(this.hopCycle) * 0.12;
                }
            }
            this.clampToBounds();
        }

        // Random Joyful Backflip (Binky) Trigger
        if (
            this.state === 'idle' &&
            !this.isDragging &&
            !this.isHopping &&
            !this.isBackflipping &&
            !this.stateManager.state.isDead &&
            this.isUserOnScreen &&
            !this.isUserInteracting &&
            (now - this.lastBackflipTime > this.nextBackflipInterval)
        ) {
            this.isBackflipping = true;
            this.backflipStartTime = now;
            this.lastBackflipTime = now;
            this.nextBackflipInterval = 28000 + Math.random() * 20000; // Next in 28-48s
        }

        if (this.isDragging) {
            // Held up in air by the scruff of the neck!
            this.state = 'held';

            // Choking / Suffocation
            this.oxygenLevel = Math.max(0, this.oxygenLevel - delta * 18.0);
            this.heartRate = Math.min(215, 140 + (100 - this.oxygenLevel) * 0.95);

            if (now - this.lastBeepTime > (60000 / this.heartRate)) {
                this.lastBeepTime = now;
                this.playPulseBeep();
            }

            this.updateCornerCapsule(this.oxygenLevel, this.heartRate, true);

            if (this.oxygenLevel <= 0) {
                this.faintFromChoking();
            } else if (this.gltfScene) {
                // Foldable from the neck: Body hangs straight down vertically under the neck
                this.gltfScene.rotation.x = THREE.MathUtils.lerp(this.gltfScene.rotation.x, -1.35, delta * 8.0);
                this.dangleSway = THREE.MathUtils.lerp(this.dangleSway, this.targetDangleSway, delta * 9.0);
                this.targetDangleSway *= 0.93;
                this.bunnyRoot.rotation.z = this.dangleSway;

                if (this.gltfNodes && this.gltfNodes.head) {
                    this.gltfNodes.head.rotation.x = -0.42;
                    this.gltfNodes.head.rotation.y = Math.sin(time * 12) * 0.15;
                }

                if (this.gltfNodes && this.gltfNodes.earL && this.gltfNodes.earR) {
                    this.gltfNodes.earL.rotation.z = -0.3 + Math.sin(time * 18) * 0.15;
                    this.gltfNodes.earR.rotation.z = 0.3 - Math.sin(time * 18) * 0.15;
                }
            }
        } else if (this.state === 'fainted' || this.stateManager.state.isDead) {
            // ==============================================================
            // REALISTIC DEAD STATE: ZERO MOVEMENT IN HANDS OR LEGS
            // Lays completely limp and flat on its side on the surface
            // ==============================================================
            if (this.mixer) {
                this.mixer.stopAllAction();
            }

            if (this.gltfScene) {
                this.gltfScene.rotation.z = THREE.MathUtils.lerp(this.gltfScene.rotation.z, Math.PI / 2, delta * 8.0);
                this.gltfScene.rotation.x = THREE.MathUtils.lerp(this.gltfScene.rotation.x, 0.05, delta * 8.0);
                this.gltfScene.position.y = -0.36;
            }

            if (this.gltfNodes) {
                // Hands and legs stop moving completely - totally limp
                if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.set(0, 0, 0);
                if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.set(0, 0, 0);
                if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.set(0, 0, 0);
                if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.set(0, 0, 0);

                // Closed lifeless eyes
                if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.y = 0.05;
                if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.y = 0.05;

                // Limp ears
                if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.z = -0.7;
                if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.z = -0.5;

                // Muzzle still
                if (this.gltfNodes.muzzle) {
                    this.gltfNodes.muzzle.position.set(0, 0, -0.231);
                    this.gltfNodes.muzzle.scale.set(1.0, 1.0, 1.0);
                }
            }

            this.updateCornerCapsule(0, 0, false);
        } else if (this.state === 'pant') {
            // Recovering breath after release
            this.oxygenLevel = Math.min(100, this.oxygenLevel + delta * 35.0);
            this.heartRate = Math.max(140, this.heartRate - delta * 25.0);
            this.updateCornerCapsule(this.oxygenLevel, this.heartRate, false);

            if (now - this.lastBeepTime > (60000 / this.heartRate)) {
                this.lastBeepTime = now;
                this.playPulseBeep();
            }

            // Rapid breathing catch
            const pantBreath = Math.sin(time * 12) * 0.02;
            if (this.gltfScene) {
                const baseS = this.gltfBaseScale || 1.0;
                this.gltfScene.scale.set(baseS * (1.0 + pantBreath), baseS * (1.0 + pantBreath), baseS);
                this.gltfScene.position.y = -0.28 + Math.abs(pantBreath) * 0.3;
            }

            if (this.oxygenLevel >= 99) {
                this.state = 'idle';
            }
        } else {
            // ==============================================================
            // PURE REALISTIC IDLE COMPANION
            // Stays peacefully settled on the desk.
            // Paws remain planted; no continuous translation across screen.
            // Rich, lifelike facial expressions, screen awareness & random backflips
            // ==============================================================
            this.state = 'idle';
            if (this.mixer) {
                this.mixer.stopAllAction(); // Freeze walking legs/hands
            }

            if (this.isBackflipping) {
                // Execute Joyful Backflip (Binky)
                const flipElapsed = now - this.backflipStartTime;
                const progress = Math.min(1.0, flipElapsed / this.backflipDuration);

                if (progress < 1.0) {
                    if (progress < 0.15) {
                        // Windup crouch
                        const crouch = progress / 0.15;
                        if (this.gltfScene) {
                            this.gltfScene.position.y = -0.28 - crouch * 0.05;
                            this.gltfScene.scale.set(this.gltfBaseScale * 1.05, this.gltfBaseScale * 0.94, this.gltfBaseScale * 1.05);
                        }
                        if (this.gltfNodes && this.gltfNodes.head) {
                            this.gltfNodes.head.rotation.x = -0.15;
                        }
                    } else if (progress < 0.85) {
                        // Mid-air 360 degree backflip
                        const flipPhase = (progress - 0.15) / 0.70;
                        const jumpArc = Math.sin(flipPhase * Math.PI) * 0.65;
                        const flipAngle = -Math.PI * 2 * flipPhase;

                        if (this.gltfScene) {
                            this.gltfScene.position.y = -0.28 + jumpArc;
                            this.gltfScene.rotation.x = 0.38 + flipAngle;
                            this.gltfScene.scale.set(this.gltfBaseScale, this.gltfBaseScale, this.gltfBaseScale);
                        }

                        if (this.gltfNodes) {
                            if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.x = 0.35;
                            if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.x = 0.35;
                            if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.x = -0.35;
                            if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.x = -0.35;
                            if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.z = -0.35 + Math.sin(flipPhase * 16) * 0.1;
                            if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.z = 0.35 - Math.sin(flipPhase * 16) * 0.1;
                        }
                    } else {
                        // Landing squash & stretch recovery
                        const landPhase = (progress - 0.85) / 0.15;
                        const squash = Math.sin(landPhase * Math.PI) * 0.12;

                        if (this.gltfScene) {
                            this.gltfScene.position.y = -0.28 - squash * 0.04;
                            this.gltfScene.rotation.x = 0.38;
                            this.gltfScene.scale.set(
                                this.gltfBaseScale * (1.0 + squash * 0.4),
                                this.gltfBaseScale * (1.0 - squash),
                                this.gltfBaseScale * (1.0 + squash * 0.4)
                            );
                        }
                        if (this.gltfNodes) {
                            if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.set(0, 0, 0);
                            if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.set(0, 0, 0);
                            if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.set(0, 0, 0);
                            if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.set(0, 0, 0);
                        }
                    }
                } else {
                    this.isBackflipping = false;
                    if (this.gltfScene) {
                        this.gltfScene.position.y = -0.28;
                        this.gltfScene.rotation.x = 0.38;
                        this.gltfScene.scale.set(this.gltfBaseScale, this.gltfBaseScale, this.gltfBaseScale);
                    }
                    if (this.gltfNodes) {
                        if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.set(0, 0, 0);
                        if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.set(0, 0, 0);
                        if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.set(0, 0, 0);
                        if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.set(0, 0, 0);
                    }
                }
            } else {
                // Not backflipping: Pure Lifelike Idle
                if (!this.isHopping) {
                    // Smoothly turn back to face front toward the user
                    let diff = 0 - this.bunnyRoot.rotation.y;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    this.bunnyRoot.rotation.y += diff * Math.min(1.0, delta * 6.0);
                }
                this.bunnyRoot.rotation.z = THREE.MathUtils.lerp(this.bunnyRoot.rotation.z, 0, delta * 6.0);
                this.bunnyRoot.rotation.x = THREE.MathUtils.lerp(this.bunnyRoot.rotation.x, 0, delta * 6.0);

                if (!this.isHopping && this.gltfScene) {
                    this.gltfScene.rotation.x = THREE.MathUtils.lerp(this.gltfScene.rotation.x, 0.38, delta * 6.0);
                    this.gltfScene.rotation.z = 0;
                }

                if (this.gltfNodes && !this.isHopping) {
                    if (this.gltfNodes.legFrontR) this.gltfNodes.legFrontR.rotation.set(0, 0, 0);
                    if (this.gltfNodes.legFrontL) this.gltfNodes.legFrontL.rotation.set(0, 0, 0);
                    if (this.gltfNodes.legHindR) this.gltfNodes.legHindR.rotation.set(0, 0, 0);
                    if (this.gltfNodes.legHindL) this.gltfNodes.legHindL.rotation.set(0, 0, 0);
                }

                if (this.isUserOnScreen) {
                    // ==========================================================
                    // 1. USER IS ON SCREEN: LIVELY AWARENESS
                    // ==========================================================
                    const breath = Math.sin(time * 2.6) * 0.012;
                    if (this.gltfScene && !this.isHopping) {
                        const baseS = this.gltfBaseScale || 1.0;
                        this.gltfScene.scale.set(baseS * (1.0 + breath * 0.3), baseS * (1.0 + breath), baseS * (1.0 + breath * 0.3));
                        this.gltfScene.position.y = -0.28 + breath * 0.005;
                    }

                    if (this.gltfNodes) {
                        // Inquisitive head glance tracking pointer within natural biomechanical limits
                        const screenX = this.pagePos.x;
                        const screenY = this.pagePos.y - window.scrollY;
                        const mouseDx = this.lastKnownPointer.x - screenX;
                        const mouseDy = this.lastKnownPointer.y - screenY;

                        const targetHeadYaw = Math.max(-0.28, Math.min(0.28, mouseDx * 0.0006));
                        const targetHeadPitch = Math.max(-0.12, Math.min(0.16, mouseDy * 0.0004));
                        const targetHeadTilt = Math.sin(time * 0.9) * 0.035 + Math.max(-0.06, Math.min(0.06, mouseDx * 0.0002));

                        if (this.gltfNodes.head) {
                            this.gltfNodes.head.rotation.y = THREE.MathUtils.lerp(this.gltfNodes.head.rotation.y, targetHeadYaw, delta * 4.5);
                            this.gltfNodes.head.rotation.x = THREE.MathUtils.lerp(this.gltfNodes.head.rotation.x, 0.06 + targetHeadPitch, delta * 4.5);
                            this.gltfNodes.head.rotation.z = THREE.MathUtils.lerp(this.gltfNodes.head.rotation.z, targetHeadTilt, delta * 3.5);
                        }

                        // Nose & Muzzle Sniffing bursts
                        const sniffPeriod = time % 3.2;
                        let sniffIntensity = 0;
                        if (sniffPeriod < 1.6) {
                            sniffIntensity = Math.sin(sniffPeriod * Math.PI * 8);
                        }

                        if (this.gltfNodes.muzzle) {
                            this.gltfNodes.muzzle.position.z = -0.231 + sniffIntensity * 0.008;
                            this.gltfNodes.muzzle.scale.set(1.0 + sniffIntensity * 0.035, 1.0 + sniffIntensity * 0.035, 1.0);
                        }
                        if (this.gltfWhiskers) {
                            this.gltfWhiskers.rotation.z = sniffIntensity * 0.06;
                        }

                        // Independent ear movements
                        const earLTwitch = (Math.sin(time * 3.8) > 0.93) ? 0.16 : 0;
                        const earLYaw = -targetHeadYaw * 0.45 + Math.sin(time * 1.5) * 0.06;
                        if (this.gltfNodes.earL) {
                            this.gltfNodes.earL.rotation.z = -0.06 + Math.sin(time * 1.6) * 0.04 + earLTwitch;
                            this.gltfNodes.earL.rotation.y = earLYaw;
                            this.gltfNodes.earL.rotation.x = -0.10 + Math.sin(time * 1.1) * 0.03;
                        }

                        const earRTwitch = (Math.sin(time * 5.1 + 2.0) > 0.93) ? -0.16 : 0;
                        const earRYaw = -targetHeadYaw * 0.45 - Math.cos(time * 1.7) * 0.06;
                        if (this.gltfNodes.earR) {
                            this.gltfNodes.earR.rotation.z = 0.06 - Math.sin(time * 1.8 + 1) * 0.04 + earRTwitch;
                            this.gltfNodes.earR.rotation.y = earRYaw;
                            this.gltfNodes.earR.rotation.x = -0.10 + Math.sin(time * 1.3) * 0.03;
                        }

                        // Eye Blinking (quick 140ms blink every ~4.2s)
                        const blinkPeriod = time % 4.2;
                        const isBlinking = blinkPeriod > 4.06;
                        const eyeScaleY = isBlinking ? 0.10 : 1.0;
                        if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.y = eyeScaleY;
                        if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.y = eyeScaleY;

                        // Subtle tail settle
                        if (this.gltfNodes.tail) {
                            this.gltfNodes.tail.rotation.z = Math.sin(time * 0.8) * 0.05;
                        }
                    }

                    // Petting trigger when cursor moves gently over head
                    const pointerDist = Math.hypot(this.lastKnownPointer.x - this.pagePos.x, this.lastKnownPointer.y - this.pagePos.y);
                    if (pointerDist < 48 && (now - this.lastPetTime) > 3500) {
                        this.lastPetTime = now;
                        this.spawnFloatingHeart();
                    }
                } else {
                    // ==========================================================
                    // 2. USER LEFT THE SCREEN: CALM RESTING / DOZING STATE
                    // Does not get confused searching for cursor. Enters peaceful rest.
                    // ==========================================================
                    const slowBreath = Math.sin(time * 1.5) * 0.010;
                    if (this.gltfScene && !this.isHopping) {
                        const baseS = this.gltfBaseScale || 1.0;
                        this.gltfScene.scale.set(baseS * (1.0 + slowBreath * 0.2), baseS * (1.0 + slowBreath), baseS * (1.0 + slowBreath * 0.2));
                        this.gltfScene.position.y = -0.28 + slowBreath * 0.004;
                    }

                    if (this.gltfNodes) {
                        // Head stays peacefully centered
                        if (this.gltfNodes.head) {
                            this.gltfNodes.head.rotation.y = THREE.MathUtils.lerp(this.gltfNodes.head.rotation.y, 0, delta * 3.0);
                            this.gltfNodes.head.rotation.x = THREE.MathUtils.lerp(this.gltfNodes.head.rotation.x, 0.03, delta * 3.0);
                            this.gltfNodes.head.rotation.z = THREE.MathUtils.lerp(this.gltfNodes.head.rotation.z, 0, delta * 3.0);
                        }

                        // Ears relax backward comfortably
                        if (this.gltfNodes.earL) {
                            this.gltfNodes.earL.rotation.z = THREE.MathUtils.lerp(this.gltfNodes.earL.rotation.z, -0.20, delta * 3.0);
                            this.gltfNodes.earL.rotation.x = THREE.MathUtils.lerp(this.gltfNodes.earL.rotation.x, 0.08, delta * 3.0);
                            this.gltfNodes.earL.rotation.y = THREE.MathUtils.lerp(this.gltfNodes.earL.rotation.y, 0, delta * 3.0);
                        }
                        if (this.gltfNodes.earR) {
                            this.gltfNodes.earR.rotation.z = THREE.MathUtils.lerp(this.gltfNodes.earR.rotation.z, 0.20, delta * 3.0);
                            this.gltfNodes.earR.rotation.x = THREE.MathUtils.lerp(this.gltfNodes.earR.rotation.x, 0.08, delta * 3.0);
                            this.gltfNodes.earR.rotation.y = THREE.MathUtils.lerp(this.gltfNodes.earR.rotation.y, 0, delta * 3.0);
                        }

                        // Half-lidded sleepy / resting eyes
                        if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.y = 0.32;
                        if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.y = 0.32;

                        // Nose relaxed
                        if (this.gltfNodes.muzzle) {
                            this.gltfNodes.muzzle.position.set(0, 0, -0.231);
                            this.gltfNodes.muzzle.scale.set(1.0, 1.0, 1.0);
                        }
                    }
                }
            }
        }

        // World coordinates
        const screenX = this.pagePos.x;
        const screenY = this.pagePos.y - window.scrollY;

        const worldPos = this.screenToWorld(screenX, screenY);
        this.bunnyRoot.position.x = worldPos.x;
        this.bunnyRoot.position.z = worldPos.z;

        const lift = this.isDragging ? 0.42 : ((this.state === 'fainted' || this.stateManager.state.isDead) ? -0.06 : 0);
        this.bunnyRoot.position.y = worldPos.y + lift;

        // Live EKG wave rendering for Corner Capsule Drawer
        if (this.ekgCanvas && this.cornerCapsuleEl) {
            this.drawEKGWave(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Backward-compatible alias
export const ThreeRoamingRabbit = BunnyCompanion;
