/**
 * 🐰 Blinky the 2D Surface Companion — Standalone Universal Bundle
 * Works 100% offline, on file:/// protocol, and on http/https web servers.
 */
(function(window) {
    'use strict';

    // 1. State Management
/**
 * 🐰 BunnyState — Global State Management & Firebase Adapter for Blinky
 * Persists bunny health, food, rest, and life/death state across sessions and websites.
 * Pre-wired for Firebase Realtime Database & Firestore.
 */

const STORAGE_KEY = 'aadish_bunny_global_state';

const DEFAULT_STATE = {
    health: 100,            // 0 - 100
    oxygen: 100,            // 0 - 100 (%SpO2)
    isDead: false,          // Persisted life/death flag
    deathCount: 0,          // Number of times bunny died today
    deadSince: null,        // Timestamp of death or null
    pullUpsToday: 0,        // Number of pull-ups completed today
    lastWorkoutTime: Date.now(),
    lastWorkoutDate: new Date().toISOString().split('T')[0],
    isSick: false,          // Critical condition flag
    lastUpdated: Date.now()
};

class BunnyState {
    constructor() {
        this.listeners = [];
        this.state = this.loadState();
        this.checkDayReset();
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return { ...DEFAULT_STATE, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('[BunnyState] Error reading localStorage:', e);
        }
        return { ...DEFAULT_STATE };
    }

    saveState() {
        this.state.lastUpdated = Date.now();
        this.state.isSick = !this.state.isDead && (this.state.health < 45 || this.state.oxygen < 65);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn('[BunnyState] Error saving localStorage:', e);
        }
        this.notifyListeners();
        this.syncToFirebase();
    }

    checkDayReset() {
        const today = new Date().toISOString().split('T')[0];
        if (this.state.lastWorkoutDate !== today) {
            this.state.lastWorkoutDate = today;
            this.state.pullUpsToday = 0;
            this.state.deathCount = 0;
            this.saveState();
        }
    }

    // --- State Mutations ---
    setDead(isDead) {
        this.state.isDead = !!isDead;
        if (isDead) {
            this.state.health = 0;
            this.state.oxygen = 0;
            this.state.deathCount = (this.state.deathCount || 0) + 1;
            this.state.deadSince = Date.now();
        } else {
            this.state.deadSince = null;
            this.state.oxygen = 100;
            this.state.health = 100;
        }
        this.saveState();
    }

    setHealth(val) {
        this.state.health = Math.max(0, Math.min(100, val));
        if (this.state.health === 0) {
            this.setDead(true);
            return;
        }
        this.saveState();
    }

    setOxygen(val) {
        this.state.oxygen = Math.max(0, Math.min(100, val));
        if (this.state.oxygen === 0) {
            this.setDead(true);
            return;
        }
        this.saveState();
    }

    recordPullUps(reps = 5) {
        this.checkDayReset();
        this.state.pullUpsToday = (this.state.pullUpsToday || 0) + reps;
        this.state.lastWorkoutTime = Date.now();
        this.state.health = Math.min(100, (this.state.health || 0) + 20);
        this.saveState();
    }

    recordCarrotEaten() {
        this.recordPullUps(5);
    }

    // --- Admin Revival ---
    adminRevive() {
        this.state.isDead = false;
        this.state.health = 100;
        this.state.oxygen = 100;
        this.state.deadSince = null;
        this.saveState();
    }

    // --- Observer Pattern ---
    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.state);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(cb => {
            try {
                cb(this.state);
            } catch (e) {
                console.error(e);
            }
        });
    }

    // --- Firebase Hook ---
    syncToFirebase() {
        if (window.bunnyFirebaseRef) {
            try {
                window.bunnyFirebaseRef.set(this.state);
            } catch (err) {
                console.warn('[BunnyState] Firebase sync error:', err);
            }
        }
    }

    connectFirebase(firebaseDatabaseRef) {
        window.bunnyFirebaseRef = firebaseDatabaseRef;
        firebaseDatabaseRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.state = { ...this.state, ...data };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
                this.notifyListeners();
            }
        });
    }

    applyRemoteState(remoteData) {
        if (!remoteData) return;
        this.state = {
            ...this.state,
            ...remoteData
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {}
        this.notifyListeners();
    }
}

const bunnyGlobalState = new BunnyState();


    // 2. Firebase Sync Adapter
/**
 * 🐰 BunnyFirebaseSync — Realtime Firebase Firestore Sync for Blinky
 * Connects Blinky's vitals, death state, food count, and rest time to Aadish's Firebase database.
 * Syncs seamlessly across visitors, tabs, and sessions.
 */


const defaultFirebaseConfig = {
    apiKey: "AIzaSyAy8bC4VPqwOajedDs-vLldSoKDjcJVZd0",
    authDomain: "myportfolio-aadishhere.firebaseapp.com",
    projectId: "myportfolio-aadishhere",
    storageBucket: "myportfolio-aadishhere.appspot.com",
    messagingSenderId: "483800227478",
    appId: "1:483800227478:web:994bda2c2d41a7377eecb7"
};

class BunnyFirebaseSync {
    constructor(config = defaultFirebaseConfig, collectionName = "bunny", docId = "blinky_vitals") {
        this.config = config;
        this.collectionName = collectionName;
        this.docId = docId;
        this.app = null;
        this.db = null;
        this.docRef = null;
        this.unsubscribe = null;
        this.isSyncing = false;
        this.hasWritePermission = true;
        this.debounceTimer = null;
    }

    async init() {
        try {
            this.app = !getApps().length ? initializeApp(this.config) : getApps()[0];
            this.db = getFirestore(this.app);
            this.docRef = doc(this.db, this.collectionName, this.docId);

            // 1. Initial snapshot & realtime listener
            this.unsubscribe = onSnapshot(this.docRef, (snapshot) => {
                if (snapshot.exists()) {
                    const remoteData = snapshot.data();
                    this.isSyncing = true;
                    bunnyGlobalState.applyRemoteState(remoteData);
                    this.isSyncing = false;
                } else {
                    // Document does not exist yet; try creating it with initial state
                    this.pushToFirestore(bunnyGlobalState.state);
                }
            }, (error) => {
                if (error.code === 'permission-denied') {
                    console.info('[BunnyFirebase] Firestore security rule for /bunny collection needed in Firebase Console. Using persistent localStorage until rule is added.');
                    this.hasWritePermission = false;
                } else {
                    console.warn('[BunnyFirebase] onSnapshot listener warning:', error);
                }
            });

            // 2. Subscribe to local state mutations to sync outbound
            bunnyGlobalState.subscribe((state) => {
                if (!this.isSyncing && this.hasWritePermission) {
                    this.debouncedPush(state);
                }
            });

            console.log('[BunnyFirebase] Connected to Firebase Firestore database: myportfolio-aadishhere');
        } catch (e) {
            console.warn('[BunnyFirebase] Initialization notice:', e);
        }
    }

    debouncedPush(state) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.pushToFirestore(state);
        }, 400);
    }

    async pushToFirestore(state) {
        if (!this.docRef || !this.hasWritePermission) return;
        try {
            await setDoc(this.docRef, {
                health: state.health,
                oxygen: state.oxygen,
                isDead: state.isDead,
                deathCount: state.deathCount || 0,
                pullUpsToday: state.pullUpsToday || 0,
                lastWorkoutDate: state.lastWorkoutDate,
                isSick: state.isSick || false,
                lastUpdated: Date.now()
            }, { merge: true });
        } catch (err) {
            if (err.code === 'permission-denied') {
                console.info('[BunnyFirebase] Firestore write requires security rule in Firebase Console. Saved to localStorage.');
                this.hasWritePermission = false;
            } else {
                console.warn('[BunnyFirebase] pushToFirestore warning:', err);
            }
        }
    }
}

const bunnyFirebaseSync = new BunnyFirebaseSync();

    // 3. Bunny Engine
/**
 * 🐰 Blinky the 2D Surface Companion ("rabbit-logic/bunny.js")
 * Standalone, modular companion engine built with Three.js.
 * Can be integrated into ANY website.
 *
 * Features:
 * - Pure 2D Surface Orthographic projection (zero perspective distortion)
 * - Springy Bounding Bunny Hop Gait (jumping walk) with recoil squish
 * - Authentic Rabbit Paw Prints (central heel pad + 4 toe beans)
 * - Scruff-of-Neck Dragging with pendulum inertia sway & body fold
 * - Clinical "VITALS" Telemetry Monitor HUD with live EKG waveform & audio
 * - Global Persistence Layer (BunnyState) pre-wired for Firebase
 * - Permanent Death state with WhatsApp / Email alert to Aadish
 * - Admin Revival State Changer (Firebase-ready)
 */


class BunnyCompanion {
    constructor(options = {}) {
        this.options = {
            modelPath: 'assets/rabbit.glb',
            scale: 1.0,
            primaryColor: '#38bdf8',
            adminPhone: '', // Add WhatsApp phone if available
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

        // Header Pull-Up Bar Workout System
        this.isWorkoutActive = false;
        this.workoutState = null; // 'running_to_bar', 'jumping_to_bar', 'doing_pullups', 'dismount_jump'
        this.workoutTargetX = null;
        this.workoutStartTime = 0;
        this.jumpStartTime = 0;
        this.pullUpRep = 0;
        this.pullUpMaxReps = 5;
        this.repStartTime = 0;
        this.lastRepCounted = -1;
        this.dismountStartTime = 0;
        this.lastDragEndTime = 0;
        this.landingBounceStartTime = 0;

        // Document-Space Coordinates
        this.pagePos = { x: window.innerWidth * 0.78, y: 320 };
        this.state = 'idle'; // 'idle', 'walk', 'held', 'fainted', 'pant', 'reviving', 'binky', 'eat'
        this.gaitCycle = 0;
        this.currentHeading = 0;

        // 3-Second Delayed Pointer Follow
        this.pointerHistory = [];
        this.lastKnownPointer = {
            x: this.pagePos.x,
            y: this.pagePos.y,
            time: performance.now(),
            isInteractive: false,
            targetRect: null
        };

        // Draggable & Scruff Neck State
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dangleSway = 0;
        this.targetDangleSway = 0;

        // Surface Contact Shadow & Paw Footprints
        this.contactShadow = null;
        this.footsteps = [];
        this.footstepGroup = null;
        this.lastFootstepTime = 0;
        this.stepCounter = 0;
        this.pawTexture = null;

        // Vitals & Suffocation / Dying State System
        this.oxygenLevel = 100;
        this.heartRate = 140;
        this.cornerCapsuleEl = null;
        this.ekgCanvas = null;
        this.ekgCtx = null;
        this.ekgPoints = null;
        this.ekgPhase = 0;
        this.lastBeepTime = 0;
        this.faintStartTime = 0;
        this.pantStartTime = 0;
        this.audioCtx = null;
        this.lastPetTime = 0;

        // Raycasting & Clock
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

        // Pure 2D Orthographic Parallel Camera (Zero perspective warp!)
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
        });

        // Surface Desk Lighting: Warm, uniform, illustrated daylight with zero space shadows
        const ambient = new THREE.AmbientLight(0xfffaf0, 1.25);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xfff5ea, 0.65);
        keyLight.position.set(0, 2, 8);
        this.scene.add(keyLight);

        // Ground Paw Prints Group
        this.footstepGroup = new THREE.Group();
        this.scene.add(this.footstepGroup);
    }

    createContactShadowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        // Elliptical radial gradient for authentic 4-paw contact occlusion on webpage surface
        ctx.save();
        ctx.scale(1, 0.625);
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 110);
        grad.addColorStop(0, 'rgba(10, 8, 7, 0.78)');
        grad.addColorStop(0.35, 'rgba(18, 14, 12, 0.48)');
        grad.addColorStop(0.7, 'rgba(28, 22, 18, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return new THREE.CanvasTexture(canvas);
    }

    createPawPrintTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(46, 26, 18, 0.44)'; // authentic soft muddy paw stamp

        // 1. Central Metatarsal / Heel Pad
        ctx.beginPath();
        ctx.ellipse(32, 40, 11, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Four distinct toe pads (bunny toe beans!)
        const toes = [
            { x: 19, y: 22, rx: 3.5, ry: 5.5, angle: -0.32 },
            { x: 27, y: 15, rx: 4.0, ry: 6.5, angle: -0.10 },
            { x: 37, y: 15, rx: 4.0, ry: 6.5, angle: 0.10 },
            { x: 45, y: 22, rx: 3.5, ry: 5.5, angle: 0.32 }
        ];

        toes.forEach(t => {
            ctx.beginPath();
            ctx.ellipse(t.x, t.y, t.rx, t.ry, t.angle, 0, Math.PI * 2);
            ctx.fill();
        });

        return new THREE.CanvasTexture(canvas);
    }

    spawnFootprint(worldPos) {
        if (!this.footstepGroup) return;

        if (!this.pawTexture) {
            this.pawTexture = this.createPawPrintTexture();
        }

        const footprintMat = new THREE.MeshBasicMaterial({
            map: this.pawTexture,
            transparent: true,
            opacity: 0.38,
            depthWrite: false
        });
        const geo = new THREE.PlaneGeometry(0.10, 0.10);
        const print = new THREE.Mesh(geo, footprintMat);

        // Alternate left paw and right paw stride
        this.stepCounter = (this.stepCounter || 0) + 1;
        const sideOffset = (this.stepCounter % 2 === 0 ? -0.038 : 0.038);
        const perpX = Math.cos(this.currentHeading) * sideOffset;
        const perpY = Math.sin(this.currentHeading) * sideOffset;

        print.position.set(worldPos.x + perpX, worldPos.y - 0.16 + perpY, -0.01);
        print.rotation.z = -this.currentHeading; // points forward in jumping walk direction
        print.birthTime = performance.now();
        this.footstepGroup.add(print);
        this.footsteps.push(print);
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
            x: ((v.x + 1) / 2) * window.innerWidth,
            y: ((-v.y + 1) / 2) * window.innerHeight
        };
    }

    buildRabbitRoot() {
        this.bunnyRoot = new THREE.Group();
        // Slightly enlarged companion scale (~0.58)
        this.bunnyRoot.scale.set(this.options.scale, this.options.scale, this.options.scale);
        this.scene.add(this.bunnyRoot);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    loadGLTFModel() {
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('[BunnyCompanion] THREE.GLTFLoader not found. Please include GLTFLoader.js in your HTML.');
            return;
        }

        // 1. Fast in-memory parsing from embedded assets (works on file:/// with zero CORS blocks)
        if (typeof window !== 'undefined' && window.BUNNY_ASSETS && window.BUNNY_ASSETS.rabbitGlb) {
            try {
                const buffer = this.base64ToArrayBuffer(window.BUNNY_ASSETS.rabbitGlb);
                const loader = new THREE.GLTFLoader();
                loader.parse(buffer, '', (gltf) => {
                    this.setupGLTFModel(gltf);
                }, (err) => {
                    console.warn('[BunnyCompanion] Embedded parse failed, falling back to file load:', err);
                    this.loadGLTFFromFile();
                });
                return;
            } catch (e) {
                console.warn('[BunnyCompanion] Embedded load error:', e);
            }
        }

        this.loadGLTFFromFile();
    }

    loadGLTFFromFile() {
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
            const desiredSize = 0.99; // Increased by 10% (from 0.90 to 0.99)
            const s = desiredSize / maxDim;
            model.scale.set(s, s, s);
            this.gltfBaseScale = s;
            model.position.x = -center.x * s;
            model.position.y = -box.min.y * s - 0.28;
            model.position.z = -center.z * s;
        }

        // Soft animal fur finish & cache rest pose transforms
        model.traverse((child) => {
            if (child.isObject3D) {
                child.userData.initialPos = child.position.clone();
                child.userData.initialRot = child.rotation.clone();
                child.userData.initialScale = child.scale.clone();
            }
            if (child.isMesh && child.material) {
                child.material.roughness = 0.95;
                child.material.metalness = 0.0;
                if (child.material.map) {
                    child.material.map.encoding = THREE.sRGBEncoding;
                    child.material.map.needsUpdate = true;
                }
            }
        });

        // Head first: 180 deg
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
            cheekL: model.getObjectByName('cheek_l_9'),
            cheekR: model.getObjectByName('cheek_r_8'),
            tail: model.getObjectByName('tail_4') || model.getObjectByName('tail_2'),
            body: model.getObjectByName('body_5'),
            legFL: model.getObjectByName('leg_front_left_20'),
            legFR: model.getObjectByName('leg_front_right_17'),
            legHL: model.getObjectByName('leg_hind_left_28'),
            legHR: model.getObjectByName('leg_hind_right_24'),
            footHL: model.getObjectByName('foot_hind_l_27'),
            footHR: model.getObjectByName('foot_hind_r_23'),
            footFL: model.getObjectByName('foot_front_l_19'),
            footFR: model.getObjectByName('foot_front_r_16')
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

        // Animations: only initialize mixer for walking locomotion, NEVER for idle or dying
        this.animations = {};
        if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                const name = clip.name.toLowerCase();
                const action = this.mixer.clipAction(clip);
                if (name.includes('run') || name.includes('walk') || name.includes('hop')) {
                    this.animations['run'] = action;
                }
            });
            if (!this.animations['run'] && gltf.animations[0]) {
                this.animations['run'] = this.mixer.clipAction(gltf.animations[0]);
            }
        }

        // If spawned dead from database, lay down immediately!
        if (this.stateManager.state.isDead) {
            this.applyDeadPoseImmediate();
        } else {
            this.playAnimation('idle');
        }
    }

    resetLimbsToNeutral() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
        if (this.currentAction) {
            this.currentAction.stop();
            this.currentAction = null;
        }
        if (!this.gltfNodes) return;
        const limbKeys = ['legFL', 'legFR', 'legHL', 'legHR', 'footHL', 'footHR', 'footFL', 'footFR', 'body'];
        limbKeys.forEach((key) => {
            const node = this.gltfNodes[key];
            if (node) {
                if (node.userData.initialPos) node.position.copy(node.userData.initialPos);
                if (node.userData.initialRot) node.rotation.copy(node.userData.initialRot);
                else node.rotation.set(0, 0, 0);
            }
        });
    }

    applyDeadPoseImmediate() {
        this.state = 'fainted';
        this.oxygenLevel = 0;
        this.resetLimbsToNeutral();
        if (this.gltfScene) {
            this.gltfScene.rotation.z = Math.PI / 2;
            this.gltfScene.rotation.x = 0.05;
            this.gltfScene.position.y = -0.36;
            if (this.gltfNodes) {
                if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.y = 0.08;
                if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.y = 0.08;
                if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.z = -0.7;
                if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.z = -0.5;
            }
        }
        this.updateOximeterUI(0, 0, 'FLATLINE! RABBIT IS DEAD 💀', true);
    }

    // --- Header Pull-Up Bar Workout System ---
    getHeaderBarPos(targetClientX) {
        const barEl = document.getElementById('header-pullup-bar') || document.querySelector('.site-header');
        if (barEl) {
            const rect = barEl.getBoundingClientRect();
            const clampX = (targetClientX !== undefined && targetClientX !== null)
                ? Math.max(80, Math.min(window.innerWidth - 80, targetClientX))
                : window.innerWidth * 0.5;
            return {
                x: clampX + window.scrollX,
                y: rect.bottom + window.scrollY - 2
            };
        }
        return {
            x: (targetClientX !== undefined && targetClientX !== null) ? targetClientX : (window.innerWidth * 0.5),
            y: 72 + window.scrollY
        };
    }

    startPullUpWorkout(targetClientX) {
        if (this.state === 'fainted' || this.stateManager.state.isDead) return;
        if (this.isDragging) return;
        if (this.isWorkoutActive) return;

        this.initAudio();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isWorkoutActive = true;
        this.workoutState = 'running_to_bar';
        this.workoutTargetX = (targetClientX !== undefined && targetClientX !== null)
            ? targetClientX
            : (window.innerWidth * 0.5);
        this.workoutStartTime = performance.now();
        this.pullUpRep = 0;
        this.pullUpMaxReps = 5;
        this.lastRepCounted = -1;
        this.state = 'walk';
        this.playAnimation('run');

        // Smooth scroll to top if scrolled down so user has a front-row view of pull-ups
        if (window.scrollY > 40) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        this.playAlertSound();
    }

    triggerLandingBounce(now) {
        this.landingBounceStartTime = now;
    }

    spawnRepBadge(repNum, screenX, screenY) {
        const badge = document.createElement('div');
        badge.className = 'bunny-rep-badge';
        const emojis = ['💪', '🔥', '⚡', '🐰', '🏆'];
        const emoji = emojis[(repNum - 1) % emojis.length];
        badge.textContent = `Rep ${repNum}! ${emoji}`;
        badge.style.left = `${screenX}px`;
        badge.style.top = `${screenY - 14}px`;
        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 750);
    }

    spawnWorkoutCelebration(screenX, screenY) {
        const banner = document.createElement('div');
        banner.className = 'bunny-workout-banner';
        banner.innerHTML = `<span>🏆</span> <span>Workout Complete! 5 Pull-ups Crushed!</span> <span>💪✨</span>`;
        banner.style.left = `${screenX}px`;
        banner.style.top = `${screenY + 45}px`;
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 2300);

        const icons = ['💪', '⭐', '✨', '🔥', '🎉', '⚡', '✨', '🏆'];
        for (let i = 0; i < icons.length; i++) {
            setTimeout(() => {
                const burst = document.createElement('div');
                burst.className = 'bunny-celebration-burst';
                burst.textContent = icons[i];
                burst.style.cssText = `
                    position: fixed;
                    left: ${screenX}px;
                    top: ${screenY}px;
                    font-size: 22px;
                    pointer-events: none;
                    z-index: 10006;
                    transition: transform 0.85s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.85s ease;
                    transform: translate(0, 0) scale(0.4);
                    opacity: 1;
                `;
                document.body.appendChild(burst);
                requestAnimationFrame(() => {
                    const angle = (i / icons.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                    const dist = 55 + Math.random() * 50;
                    burst.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 35}px) scale(1.25)`;
                    burst.style.opacity = '0';
                });
                setTimeout(() => burst.remove(), 900);
            }, i * 35);
        }
    }

    playAlertSound() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(540, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(780, this.audioCtx.currentTime + 0.10);
            gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.10);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.11);
        } catch (_) {}
    }

    playPullUpGruntSound() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(320, this.audioCtx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.20);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.21);
        } catch (_) {}
    }

    playRepSuccessSound(repNum) {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            const baseFreq = 440 + repNum * 80;
            osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioCtx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.14);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.15);
        } catch (_) {}
    }

    playWhooshBackflipSound() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, this.audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(740, this.audioCtx.currentTime + 0.40);
            osc.frequency.exponentialRampToValueAtTime(340, this.audioCtx.currentTime + 0.75);
            gain.gain.setValueAtTime(0.14, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.80);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.81);
        } catch (_) {}
    }

    playTaDaLandingSound() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            [
                { f: 659.25, t: 0, d: 0.14 },
                { f: 987.77, t: 0.12, d: 0.38 }
            ].forEach(note => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'triangle';
                const st = this.audioCtx.currentTime + note.t;
                osc.frequency.setValueAtTime(note.f, st);
                gain.gain.setValueAtTime(0.14, st);
                gain.gain.exponentialRampToValueAtTime(0.001, st + note.d);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(st);
                osc.stop(st + note.d + 0.02);
            });
        } catch (_) {}
    }

    updatePullUpWorkout(delta, time, now) {
        const barPos = this.getHeaderBarPos(this.workoutTargetX);
        const targetRunX = barPos.x;
        const targetRunY = barPos.y + 48; // Standing just beneath the bar

        if (this.workoutState === 'running_to_bar') {
            const dx = targetRunX - this.pagePos.x;
            const dy = targetRunY - this.pagePos.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 18) {
                this.state = 'walk';
                this.playAnimation('run');

                this.gaitCycle += delta * 7.5;
                const hopSin = Math.sin(this.gaitCycle);
                const isAirborne = hopSin > 0;
                const hopHeight = Math.max(0, hopSin) * 0.16;
                const hopThrust = isAirborne ? 1.48 : 0.62;
                const speed = 155 * delta * hopThrust;
                const step = Math.min(dist, speed);

                this.pagePos.x += (dx / dist) * step;
                this.pagePos.y += (dy / dist) * step;

                const targetHeading = Math.atan2(dx, dy);
                let angleDiff = (targetHeading - this.currentHeading) % (Math.PI * 2);
                if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                this.currentHeading += angleDiff * Math.min(1, delta * 8.5);
                this.bunnyRoot.rotation.y = this.currentHeading;

                if (this.gltfScene) {
                    const baseS = this.gltfBaseScale || 1.0;
                    this.gltfScene.scale.set(baseS, baseS, baseS);
                    this.gltfScene.position.y = -0.28 + hopHeight;
                    this.gltfScene.rotation.x = 0.38;
                }
            } else {
                // Arrived under the bar! Jump up and latch onto the bar!
                this.workoutState = 'jumping_to_bar';
                this.jumpStartTime = now;
                this.state = 'walk';
                this.playAlertSound();
            }
        } else if (this.workoutState === 'jumping_to_bar') {
            const elapsed = now - this.jumpStartTime;
            const jumpDur = 480;
            const t = Math.min(1, elapsed / jumpDur);

            // Front-facing looking towards user
            let angleDiff = (0 - this.currentHeading) % (Math.PI * 2);
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            this.currentHeading += angleDiff * Math.min(1, delta * 12.0);
            this.bunnyRoot.rotation.y = this.currentHeading;

            // Leap up to bar
            this.pagePos.y = targetRunY - (t * 36);

            if (this.gltfScene) {
                // Body rotates into vertical hanging orientation
                this.gltfScene.rotation.x = THREE.MathUtils.lerp(0.38, -1.15, t);
                this.gltfScene.position.y = -0.28 + Math.sin(t * Math.PI) * 0.18;

                // Front arms swing overhead to catch the bar
                if (this.gltfNodes) {
                    const armUp = THREE.MathUtils.lerp(0, -1.57, t);
                    if (this.gltfNodes.legFL) this.gltfNodes.legFL.rotation.x = armUp;
                    if (this.gltfNodes.legFR) this.gltfNodes.legFR.rotation.x = armUp;
                }
            }

            if (t >= 1) {
                // LATCHED ONTO BAR! Start Pull-ups!
                this.workoutState = 'doing_pullups';
                this.pullUpRep = 0;
                this.pullUpMaxReps = 5;
                this.repStartTime = now;
                this.lastRepCounted = -1;
                this.playPullUpGruntSound();
                if (this.mixer) this.mixer.stopAllAction();
            }
        } else if (this.workoutState === 'doing_pullups') {
            const repDuration = 1250; // 1.25s per rep
            const elapsedWorkout = now - this.repStartTime;
            const currentRepIdx = Math.floor(elapsedWorkout / repDuration);
            const repT = (elapsedWorkout % repDuration) / repDuration;

            // Always face front
            this.bunnyRoot.rotation.y = 0;
            this.bunnyRoot.rotation.z = Math.sin(time * 3) * 0.04; // subtle natural hanging sway

            // Pull-up motion calculation
            let pullProgress = 0;
            if (repT < 0.45) {
                // Concentric Pull Up (chin rises above bar)
                pullProgress = Math.sin((repT / 0.45) * (Math.PI / 2));
            } else if (repT < 0.60) {
                // Peak Hold & Squeeze
                pullProgress = 1.0;
            } else {
                // Controlled Eccentric Lowering
                const lowerT = (repT - 0.60) / 0.40;
                pullProgress = Math.cos(lowerT * (Math.PI / 2));
            }

            // Trigger Rep Counter at peak
            if (repT >= 0.45 && this.lastRepCounted !== currentRepIdx && currentRepIdx < this.pullUpMaxReps) {
                this.lastRepCounted = currentRepIdx;
                const repNumber = currentRepIdx + 1;
                const screenX = this.pagePos.x;
                const screenY = this.pagePos.y - window.scrollY;
                this.spawnRepBadge(repNumber, screenX, screenY - 20);
                this.playRepSuccessSound(repNumber);
                this.stateManager.recordPullUps(1);
                this.updateCornerCapsule(100, 140, false);
            }

            if (this.gltfScene) {
                // Body hanging from hands on the bar
                this.gltfScene.rotation.x = -1.15 + pullProgress * 0.18;
                this.gltfScene.position.y = -0.28 + pullProgress * 0.28;

                if (this.gltfNodes) {
                    // Elbows bend deeply on pull up
                    const armFlex = -1.57 + pullProgress * 1.15;
                    if (this.gltfNodes.legFL) this.gltfNodes.legFL.rotation.x = armFlex;
                    if (this.gltfNodes.legFR) this.gltfNodes.legFR.rotation.x = armFlex;

                    // Head tilts up proudly
                    if (this.gltfNodes.head) {
                        this.gltfNodes.head.rotation.x = pullProgress * 0.42;
                        this.gltfNodes.head.rotation.y = 0;
                    }

                    // Core engagement: hind legs tuck slightly during pull up
                    if (this.gltfNodes.legHL) this.gltfNodes.legHL.rotation.x = -pullProgress * 0.38;
                    if (this.gltfNodes.legHR) this.gltfNodes.legHR.rotation.x = -pullProgress * 0.38;

                    // Ears tilt back with the strain
                    if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.z = -0.25 - pullProgress * 0.22;
                    if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.z = 0.25 + pullProgress * 0.22;
                }
            }

            if (elapsedWorkout >= this.pullUpMaxReps * repDuration) {
                // WORKOUT COMPLETED! Dismount cleanly!
                this.workoutState = 'dismount_jump';
                this.dismountStartTime = now;
                this.playWhooshBackflipSound();
            }
        } else if (this.workoutState === 'dismount_jump') {
            const dismountDur = 600;
            const progress = Math.min(1, (now - this.dismountStartTime) / dismountDur);

            // Gravity drop back to desk surface
            this.pagePos.y = barPos.y + 12 + (progress * 48);

            // Flip/twist in air
            this.bunnyRoot.rotation.x = -progress * Math.PI * 2;
            this.bunnyRoot.rotation.y = 0;

            if (this.gltfScene) {
                this.gltfScene.rotation.x = THREE.MathUtils.lerp(-1.15, 0.38, progress);
                this.gltfScene.position.y = -0.28;
            }

            if (progress >= 1) {
                // Clean landing!
                this.bunnyRoot.rotation.x = 0;
                this.bunnyRoot.rotation.y = 0;
                this.bunnyRoot.rotation.z = 0;
                this.currentHeading = 0;
                this.resetLimbsToNeutral();

                const screenX = this.pagePos.x;
                const screenY = this.pagePos.y - window.scrollY;
                this.spawnWorkoutCelebration(screenX, screenY);
                this.playTaDaLandingSound();
                this.triggerLandingBounce(now);

                // Finished! Return to peaceful idle
                this.isWorkoutActive = false;
                this.workoutState = null;
                this.state = 'idle';
                this.playAnimation('idle');
                this.pointerHistory = [];
                this.lastKnownPointer = { x: this.pagePos.x, y: this.pagePos.y, time: now };
            }
        }
    }

    playAnimation(name) {
        if (!this.mixer) return;

        // When idle or dead: STOP moving hands and legs completely!
        if (name === 'idle' || name === 'fainted' || this.state === 'fainted' || this.stateManager.state.isDead) {
            if (this.currentAction) {
                this.currentAction.fadeOut(0.2);
                this.currentAction = null;
            }
            this.resetLimbsToNeutral();
            return;
        }

        const action = this.animations[name];
        if (!action) return;

        if (this.currentAction === action) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(0.15);
        }

        action.reset().fadeIn(0.15).play();
        this.currentAction = action;
    }

    // --- UI: Sleek Corner Capsule Pill Widget & Pure Vitals Drawer ---
    initCornerCapsule() {
        if (document.getElementById('bunny-corner-capsule')) return;

        const capsule = document.createElement('div');
        capsule.id = 'bunny-corner-capsule';

        const waText = encodeURIComponent("Hey Aadish, I accidentally killed your website bunny Blinky 😭 Can you please revive him?");
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

                <!-- Pure Vitals 3-Column Grid -->
                <div class="bunny-stats-grid">
                    <div class="bunny-stat-card">
                        <div class="bunny-stat-label">💪 Fitness</div>
                        <div class="bunny-stat-val" id="drawer-pullups-val">0</div>
                        <div class="bunny-stat-meta" id="drawer-pullups-meta">Pull-ups today</div>
                    </div>
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
                    <button class="bunny-action-btn bunny-btn-workout-drawer" id="btn-drawer-workout">
                        <span>💪 Start Pull-up Workout</span>
                    </button>

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
                    <div class="bunny-capsule-subtitle" id="bunny-pill-stats">💪 0 Pull-ups • 🫁 100% O₂</div>
                </div>
                <button class="bunny-pill-workout-btn" id="btn-pill-workout" title="Watch Blinky do pull-ups on the header bar">
                    <span>💪 Workout</span>
                </button>
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
            if (e.target.closest('#btn-pill-workout') || e.target.closest('#btn-pill-revive')) return;
            capsule.classList.toggle('expanded');
        });

        document.getElementById('btn-close-drawer').addEventListener('click', () => {
            capsule.classList.remove('expanded');
        });

        // Workout buttons
        const handleWorkout = (e) => {
            e.stopPropagation();
            this.startPullUpWorkout();
        };
        const pillWorkout = document.getElementById('btn-pill-workout');
        if (pillWorkout) pillWorkout.addEventListener('click', handleWorkout);
        const drawerWorkout = document.getElementById('btn-drawer-workout');
        if (drawerWorkout) drawerWorkout.addEventListener('click', handleWorkout);

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

    closeCapsuleDrawer() {
        if (this.cornerCapsuleEl) {
            this.cornerCapsuleEl.classList.remove('expanded');
        }
    }

    updateCornerCapsule(spo2, bpm, isChoking) {
        if (!this.cornerCapsuleEl) return;
        const st = this.stateManager.state;
        const orb = document.getElementById('bunny-pill-orb');
        const statusBadge = document.getElementById('bunny-pill-status');
        const statsPill = document.getElementById('bunny-pill-stats');
        const pullupsEl = document.getElementById('drawer-pullups-val');
        const spo2El = document.getElementById('drawer-spo2-val');
        const spo2Text = document.getElementById('drawer-spo2-text');
        const bpmEl = document.getElementById('drawer-bpm-val');
        const healthEl = document.getElementById('drawer-health-val');
        const healthMeta = document.getElementById('drawer-health-meta');

        const spo2Rounded = Math.round(spo2);
        if (pullupsEl) pullupsEl.textContent = `${st.pullUpsToday || 0}`;
        if (spo2El) spo2El.textContent = `${spo2Rounded}% SpO2`;
        if (spo2Text) spo2Text.textContent = `${spo2Rounded}%`;
        if (bpmEl) bpmEl.textContent = `${Math.round(bpm)} bpm`;

        if (orb) {
            orb.className = 'bunny-status-orb';
            if (st.isDead) orb.classList.add('dead');
            else if (isChoking) orb.classList.add('choking');
            else if (st.isSick) orb.classList.add('sick');
        }

        if (statusBadge) {
            statusBadge.className = 'bunny-pill-badge';
            if (st.isDead) {
                statusBadge.textContent = 'Dead 💀';
                statusBadge.classList.add('dead');
            } else if (isChoking) {
                statusBadge.textContent = 'Choking! 🫁';
                statusBadge.classList.add('choking');
            } else if (st.isSick) {
                statusBadge.textContent = 'Low O₂ ⚠️';
                statusBadge.classList.add('choking');
            } else {
                statusBadge.textContent = 'Healthy ✨';
            }
        }

        if (statsPill) {
            if (st.isDead) {
                statsPill.textContent = 'Flatlined • Click to Revive';
            } else if (isChoking) {
                statsPill.textContent = 'Suffocating! Release neck! 🫁';
            } else {
                statsPill.textContent = `💪 ${st.pullUpsToday || 0} Pull-ups • 🫁 ${spo2Rounded}% O₂`;
            }
        }

        if (healthEl) {
            healthEl.textContent = st.isDead ? '0%' : `${Math.round(st.health)}%`;
        }
        if (healthMeta) {
            if (st.isDead) healthMeta.textContent = `Deceased (${st.deathCount || 1} deaths)`;
            else if (st.isSick) healthMeta.textContent = 'Condition: Critical (Need Air)';
            else healthMeta.textContent = `Healthy (${st.deathCount || 0} deaths)`;
        }
    }

    drawEKGWave(delta) {
        if (!this.ekgCtx || !this.ekgCanvas) return;
        const ctx = this.ekgCtx;
        const w = this.ekgCanvas.width;
        const h = this.ekgCanvas.height;

        ctx.fillStyle = 'rgba(5, 8, 14, 0.28)';
        ctx.fillRect(0, 0, w, h);

        const isFlatline = this.oxygenLevel <= 0;
        const rateMultiplier = isFlatline ? 0 : (this.heartRate / 60);
        this.ekgPhase = (this.ekgPhase + delta * 5.0 * rateMultiplier) % (Math.PI * 2);

        if (!this.ekgPoints) this.ekgPoints = new Array(w).fill(h / 2);

        let newY = h / 2;
        if (!isFlatline) {
            const p = this.ekgPhase;
            if (p > 1.2 && p < 1.4) {
                newY = (h / 2) - Math.sin((p - 1.2) / 0.2 * Math.PI) * 4;
            } else if (p > 1.6 && p < 1.7) {
                newY = (h / 2) + 3;
            } else if (p >= 1.7 && p < 1.9) {
                newY = (h / 2) - 13;
            } else if (p >= 1.9 && p < 2.05) {
                newY = (h / 2) + 4;
            } else if (p > 2.3 && p < 2.7) {
                newY = (h / 2) - Math.sin((p - 2.3) / 0.4 * Math.PI) * 4;
            }
        }

        this.ekgPoints.shift();
        this.ekgPoints.push(newY);

        ctx.beginPath();
        ctx.strokeStyle = isFlatline ? '#ef4444' : (this.oxygenLevel < 50 ? '#ef4444' : '#10b981');
        ctx.lineWidth = 1.8;
        ctx.lineJoin = 'round';

        for (let x = 0; x < w; x++) {
            const y = this.ekgPoints[x];
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    listenToGlobalState() {
        this.stateManager.subscribe((st) => {
            const btnPillWorkout = document.getElementById('btn-pill-workout');
            const btnPillRevive = document.getElementById('btn-pill-revive');
            const btnDrawerWorkout = document.getElementById('btn-drawer-workout');
            const deathActions = document.getElementById('drawer-death-actions');
            const deathTime = document.getElementById('drawer-death-time');

            const pullupsVal = document.getElementById('drawer-pullups-val');
            const pullupsMeta = document.getElementById('drawer-pullups-meta');

            if (pullupsVal) pullupsVal.textContent = st.pullUpsToday || 0;
            if (pullupsMeta) pullupsMeta.textContent = `${st.pullUpsToday || 0} reps today`;

            if (st.isDead) {
                if (btnPillWorkout) btnPillWorkout.style.display = 'none';
                if (btnPillRevive) btnPillRevive.style.display = 'flex';
                if (btnDrawerWorkout) btnDrawerWorkout.style.display = 'none';
                if (deathActions) deathActions.style.display = 'flex';

                if (deathTime && st.deadSince) {
                    const timeStr = new Date(st.deadSince).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    deathTime.textContent = `Dead since: ${timeStr}`;
                }

                if (this.state !== 'fainted') {
                    this.applyDeadPoseImmediate();
                }
            } else {
                if (btnPillFeed) btnPillFeed.style.display = 'flex';
                if (btnPillRevive) btnPillRevive.style.display = 'none';
                if (btnDrawerFeed) btnDrawerFeed.style.display = 'flex';
                if (deathActions) deathActions.style.display = 'none';

                if (this.state === 'fainted') {
                    this.triggerRevivalAnimation();
                }
            }

            this.updateCornerCapsule(this.oxygenLevel, this.heartRate, this.isDragging);
        });
    }

    // --- Audio Feedback ---
    initAudio() {
        if (this.audioCtx) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.audioCtx = new AudioCtx();
        } catch (e) {}
    }

    playPulseBeep() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            const baseFreq = 500 + (this.oxygenLevel * 4);
            osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.035, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.07);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.08);
        } catch (e) {}
    }

    playAudioFlatline() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.045, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 1.2);
        } catch (e) {}
    }

    playAudioGasp() {
        if (!this.audioCtx) this.initAudio();
        if (!this.audioCtx) return;
        try {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + idx * 0.07 + 0.22);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(this.audioCtx.currentTime + idx * 0.07);
                osc.stop(this.audioCtx.currentTime + idx * 0.07 + 0.25);
            });
        } catch (e) {}
    }

    // --- Death & Revival ---
    faintFromChoking() {
        this.isDragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = 'pointer';
        this.state = 'fainted';
        this.oxygenLevel = 0;
        this.heartRate = 0;
        this.faintStartTime = performance.now();
        this.resetLimbsToNeutral();
        this.playAudioFlatline();
        this.updateCornerCapsule(0, 0, false);

        // Persist to Global Database / LocalStorage / Firebase
        this.stateManager.setDead(true);
    }

    triggerRevivalAnimation() {
        this.playAudioGasp();

        this.state = 'reviving';
        this.oxygenLevel = 100;
        this.heartRate = 140;
        this.spawn3DHearts();

        const gasp = document.createElement('div');
        gasp.className = 'rabbit-floating-heart';
        gasp.textContent = 'COUGH! GASP! 🫁✨';
        gasp.style.fontSize = '18px';
        gasp.style.fontWeight = '800';
        gasp.style.color = '#38bdf8';
        gasp.style.left = `${this.pagePos.x - 40}px`;
        gasp.style.top = `${this.pagePos.y - window.scrollY - 50}px`;
        document.body.appendChild(gasp);
        setTimeout(() => gasp.remove(), 1800);

        let progress = 0;
        const animateRevive = () => {
            progress += 0.08;
            if (progress < 1) {
                this.bunnyRoot.position.y += Math.sin(progress * Math.PI) * 0.18;
                if (this.gltfScene) {
                    this.gltfScene.rotation.z = (1 - progress) * (Math.PI / 2);
                    this.gltfScene.rotation.x = THREE.MathUtils.lerp(this.gltfScene.rotation.x, 0.38, progress);
                }
                requestAnimationFrame(animateRevive);
            } else {
                this.state = 'idle';
                this.bunnyRoot.rotation.z = 0;
                if (this.gltfScene) {
                    this.gltfScene.rotation.z = 0;
                    this.gltfScene.rotation.x = 0.38;
                }
                this.updateCornerCapsule(100, 140, false);
            }
        };
        animateRevive();
    }

    spawnFloatingHeart() {
        const heart = document.createElement('div');
        heart.className = 'rabbit-floating-heart';
        const emojis = ['💖', '✨', '🥰', '🌸', '🐾'];
        heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        heart.style.left = `${this.pagePos.x + (Math.random() - 0.5) * 30}px`;
        heart.style.top = `${this.pagePos.y - window.scrollY - 30}px`;
        document.body.appendChild(heart);

        setTimeout(() => {
            if (heart.parentNode) heart.parentNode.removeChild(heart);
        }, 1200);
    }

    spawn3DHearts() {
        const heartGroup = new THREE.Group();
        this.scene.add(heartGroup);

        const heartMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3 });
        const hearts = [];
        const startPos = this.bunnyRoot.position.clone();

        for (let i = 0; i < 7; i++) {
            const h = new THREE.Mesh(new THREE.DodecahedronGeometry(0.08), heartMat);
            h.position.copy(startPos);
            h.position.y += 0.25;
            h.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.08,
                Math.random() * 0.08 + 0.04,
                (Math.random() - 0.5) * 0.05
            );
            heartGroup.add(h);
            hearts.push(h);
        }

        let step = 0;
        const animateHearts = () => {
            step++;
            hearts.forEach(h => {
                h.position.add(h.velocity);
                h.rotation.x += 0.08;
                h.rotation.y += 0.08;
                h.scale.multiplyScalar(0.97);
            });

            if (step < 35) {
                requestAnimationFrame(animateHearts);
            } else {
                this.scene.remove(heartGroup);
            }
        };
        animateHearts();
    }

    bindEvents() {
        // Scruff-of-Neck Dragging
        window.addEventListener('pointerdown', (e) => {
            const screenX = this.pagePos.x;
            const screenY = this.pagePos.y - window.scrollY;
            const dist = Math.hypot(e.clientX - screenX, e.clientY - screenY);

            if (dist < 41) {
                // If rabbit is dead/fainted, clicking it opens the sleek corner drawer with WhatsApp/Email/Admin alert!
                if (this.state === 'fainted' || this.stateManager.state.isDead) {
                    this.openCapsuleDrawer();
                    return;
                }

                this.initAudio();
                this.isDragging = true;
                this.dragOffset = { x: this.pagePos.x - e.pageX, y: this.pagePos.y - e.pageY };
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'grabbing';
                this.state = 'held';
                this.playAnimation('run');
                this.targetDangleSway = 0;
                this.dangleSway = 0;
                e.preventDefault();
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (this.isDragging) {
                this.pagePos.x = e.pageX + this.dragOffset.x;
                this.pagePos.y = e.pageY + this.dragOffset.y;
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
            if (dist < 41) {
                document.body.style.cursor = (this.state === 'fainted' || this.stateManager.state.isDead) ? 'pointer' : 'grab';
            } else if (document.body.style.cursor === 'grab' || document.body.style.cursor === 'pointer') {
                document.body.style.cursor = '';
            }

            // Detect if cursor is hovering or interacting with buttons, cards, text or links
            const el = document.elementFromPoint(e.clientX, e.clientY);
            let isInteractive = false;
            let targetRect = null;
            if (el && !el.closest('#bunny-corner-capsule') && el.id !== 'three-fullpage-rabbit-canvas') {
                const interactiveEl = el.closest('button, a, input, select, textarea, [role="button"], .card, .btn, .project-card, .interactive-card, form, h1, h2, h3, p, nav, header');
                if (interactiveEl) {
                    isInteractive = true;
                    const r = interactiveEl.getBoundingClientRect();
                    targetRect = {
                        left: r.left + window.scrollX,
                        right: r.right + window.scrollX,
                        top: r.top + window.scrollY,
                        bottom: r.bottom + window.scrollY,
                        width: r.width,
                        height: r.height
                    };
                }
            }

            // 3-Second Delayed Pointer Follower
            const now = performance.now();
            const pageX = e.pageX;
            const pageY = e.pageY;
            this.lastKnownPointer = {
                x: pageX,
                y: pageY,
                time: now,
                isInteractive: isInteractive,
                targetRect: targetRect
            };
            this.pointerHistory.push({ ...this.lastKnownPointer });
        }, { passive: false });

        window.addEventListener('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
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
                        this.playAnimation('idle');
                    } else {
                        this.state = 'idle';
                        this.playAnimation('idle');
                    }
                    this.pointerHistory = [];
                    this.lastKnownPointer = { x: this.pagePos.x, y: this.pagePos.y, time: performance.now() };
                }
                this.lastDragEndTime = performance.now();
            }
        });

        // Click on Header Pull-Up Bar or Header
        const pullUpBar = document.getElementById('header-pullup-bar');
        if (pullUpBar) {
            pullUpBar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startPullUpWorkout(e.clientX);
            });
        }

        const siteHeader = document.querySelector('.site-header');
        if (siteHeader) {
            siteHeader.addEventListener('click', (e) => {
                if (e.target.closest('a, button, input, .brand-logo, .nav-links, .nav-right-controls')) return;
                this.startPullUpWorkout(e.clientX);
            });
        }

        // Click anywhere on website -> send Blinky to header bottom bar to do pull-ups!
        window.addEventListener('click', (e) => {
            if (this.isDragging || (performance.now() - this.lastDragEndTime) < 350) return;
            if (this.state === 'fainted' || this.stateManager.state.isDead) return;

            const screenX = this.pagePos.x;
            const screenY = this.pagePos.y - window.scrollY;
            const dist = Math.hypot(e.clientX - screenX, e.clientY - screenY);
            if (dist < 42) return; // Clicking on rabbit to pet/drag

            const el = e.target;
            if (el && el.closest('a, button, input, select, textarea, #bunny-corner-capsule, .nav-links, .nav-right-controls, .brand-logo')) {
                if (!el.closest('#btn-pill-workout') && !el.closest('#btn-drawer-workout') && !el.closest('#header-pullup-bar')) {
                    return;
                }
            }

            this.startPullUpWorkout(e.clientX);
        });

        // Double-click also triggers workout
        window.addEventListener('dblclick', (e) => {
            if (!this.isDragging && this.state !== 'fainted') {
                this.startPullUpWorkout(e.clientX);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();
        const now = performance.now();

        // Strictly only update mixer when walking or during initial held struggle
        if (this.mixer) {
            if (this.state === 'walk') {
                this.mixer.update(delta);
            } else if (this.isDragging && this.oxygenLevel > 40) {
                this.mixer.update(delta);
            }
        }

        if (this.isDragging) {
            // Held up in air by the scruff of the neck!
            this.state = 'held';
            if (this.oxygenLevel > 40) {
                this.playAnimation('run');
            } else {
                // When oxygen drops below 40%, stop moving hands and legs completely! Go limp!
                this.resetLimbsToNeutral();
            }

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
                // Foldable from the neck: Body hangs straight down vertically under the neck!
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
            // STOP all hand and leg movements completely when dead!
            this.resetLimbsToNeutral();

            // Dead state: lays completely flat and limp on its side on the webpage surface
            if (this.gltfScene) {
                this.gltfScene.rotation.z = THREE.MathUtils.lerp(this.gltfScene.rotation.z, Math.PI / 2, delta * 8.0);
                this.gltfScene.rotation.x = THREE.MathUtils.lerp(this.gltfScene.rotation.x, 0.05, delta * 8.0);
                this.gltfScene.position.y = -0.36;

                if (this.gltfNodes) {
                    if (this.gltfNodes.cheekL && this.gltfNodes.cheekR) {
                        this.gltfNodes.cheekL.scale.y = 0.08;
                        this.gltfNodes.cheekR.scale.y = 0.08;
                    }
                    if (this.gltfNodes.earL) this.gltfNodes.earL.rotation.z = -0.7;
                    if (this.gltfNodes.earR) this.gltfNodes.earR.rotation.z = -0.5;
                    if (this.gltfNodes.head) {
                        this.gltfNodes.head.rotation.x = 0.05;
                        this.gltfNodes.head.rotation.y = 0;
                        this.gltfNodes.head.rotation.z = 0.15;
                    }
                }
            }
            this.updateCornerCapsule(0, 0, false);
        } else if (this.state === 'pant') {
            // Recovering breath after release
            this.oxygenLevel = Math.min(100, this.oxygenLevel + delta * 38.0);
            this.heartRate = Math.max(140, this.heartRate - delta * 25.0);
            this.updateCornerCapsule(this.oxygenLevel, this.heartRate, false);

            if (now - this.lastBeepTime > (60000 / this.heartRate)) {
                this.lastBeepTime = now;
                this.playPulseBeep();
            }

            if (this.gltfScene) {
                this.gltfScene.position.y = -0.28 + Math.abs(Math.sin(time * 9)) * 0.025;
            }
            if (this.oxygenLevel >= 99) {
                this.state = 'idle';
            }
        } else {
            // Prune pointer history
            while (this.pointerHistory.length > 1 && (now - this.pointerHistory[1].time) > 6000) {
                this.pointerHistory.shift();
            }

            const targetTime = now - 3000; // Exact 3-second delay follower
            let delayedSample = this.pointerHistory.length > 0 ? this.pointerHistory[0] : this.lastKnownPointer;
            if (this.pointerHistory.length > 0) {
                for (let i = 0; i < this.pointerHistory.length; i++) {
                    if (this.pointerHistory[i].time <= targetTime) {
                        delayedSample = this.pointerHistory[i];
                    } else {
                        break;
                    }
                }
            } else if ((now - this.lastKnownPointer.time) >= 3000) {
                delayedSample = this.lastKnownPointer;
            }

            let targetX = null;
            let targetY = null;

            if (this.isWorkoutActive) {
                this.updatePullUpWorkout(delta, time, now);
            } else {
                let targetX = null;
                let targetY = null;

                if (delayedSample) {
                    const rawX = delayedSample.x;
                    const rawY = delayedSample.y;
                    const isInteractive = delayedSample.isInteractive || this.lastKnownPointer.isInteractive;
                    const targetRect = delayedSample.targetRect || this.lastKnownPointer.targetRect;

                    // Vector from cursor to current bunny position
                    let vx = this.pagePos.x - rawX;
                    let vy = this.pagePos.y - rawY;
                    let currentDist = Math.hypot(vx, vy);
                    if (currentDist < 0.001) {
                        vx = 1;
                        vy = 0.5;
                        currentDist = Math.hypot(vx, vy);
                    }

                    // Safe Distance: 61px in open space, 103px when interacting with buttons/text
                    const safeDist = isInteractive ? 103 : 61;

                    targetX = rawX + (vx / currentDist) * safeDist;
                    targetY = rawY + (vy / currentDist) * safeDist;

                    // If targetRect exists, make sure rabbit is kept outside of its bounds
                    if (targetRect) {
                        const pad = 35;
                        if (targetX >= targetRect.left - pad && targetX <= targetRect.right + pad &&
                            targetY >= targetRect.top - pad && targetY <= targetRect.bottom + pad) {
                            targetY = targetRect.bottom + pad;
                        }
                    }

                    // Proximity evasion: If live pointer encroaches into bunny's safe personal space, gently step back
                    const liveDx = this.pagePos.x - this.lastKnownPointer.x;
                    const liveDy = this.pagePos.y - this.lastKnownPointer.y;
                    const liveDist = Math.hypot(liveDx, liveDy);
                    const liveSafeDist = this.lastKnownPointer.isInteractive ? 95 : 53;
                    if (liveDist < liveSafeDist && liveDist > 0.001) {
                        targetX = this.pagePos.x + (liveDx / liveDist) * (liveSafeDist - liveDist + 18);
                        targetY = this.pagePos.y + (liveDy / liveDist) * (liveSafeDist - liveDist + 18);
                    }

                    // Keep bunny within document bounds
                    targetX = Math.max(30, Math.min(window.innerWidth - 39, targetX));
                    targetY = Math.max(30, targetY);
                }

                if (targetX !== null && targetY !== null) {
                    const dx = targetX - this.pagePos.x;
                    const dy = targetY - this.pagePos.y;
                    const dist = Math.hypot(dx, dy);
                    const stopDist = 13;

                    if (dist > stopDist) {
                        // WALKING / JUMPING: Springy jumping walk (bunny hop gait)!
                        this.state = 'walk';
                        this.playAnimation('run');

                        this.gaitCycle += delta * 6.5;
                        const hopSin = Math.sin(this.gaitCycle);
                        const isAirborne = hopSin > 0;

                        const hopHeight = Math.max(0, hopSin) * 0.16;
                        const hopPitch = isAirborne ? -0.16 * hopSin : 0.08 * Math.abs(hopSin);
                        const hopThrust = isAirborne ? 1.42 : 0.58;

                        const dynamicSpeed = Math.min(145, 100 + (dist > 180 ? (dist - 180) * 0.15 : 0));
                        const speed = dynamicSpeed * delta * hopThrust;
                        const step = Math.min(dist, speed);
                        this.pagePos.x += (dx / dist) * step;
                        this.pagePos.y += (dy / dist) * step;

                        // WALKING STATE: Face the direction of travel, showing left/right/up/down respective side
                        const targetHeading = Math.atan2(dx, dy);
                        let angleDiff = (targetHeading - this.currentHeading) % (Math.PI * 2);
                        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        this.currentHeading += angleDiff * Math.min(1, delta * 7.5);
                        this.bunnyRoot.rotation.y = this.currentHeading;

                        const bankAmt = Math.sin(angleDiff) * 0.10;
                        this.bunnyRoot.rotation.z = THREE.MathUtils.lerp(this.bunnyRoot.rotation.z, -bankAmt, delta * 8.0);

                        if (this.gltfScene) {
                            const baseS = this.gltfBaseScale || 1.0;
                            this.gltfScene.scale.set(baseS, baseS, baseS);
                            this.gltfScene.position.y = -0.28 + hopHeight;
                            this.gltfScene.rotation.x = 0.38 + hopPitch;

                            if (this.gltfNodes && this.gltfNodes.earL && this.gltfNodes.earR) {
                                const earFlap = isAirborne ? -0.25 * hopSin : 0.12 * Math.abs(hopSin);
                                this.gltfNodes.earL.rotation.x = -0.15 + earFlap;
                                this.gltfNodes.earR.rotation.x = -0.15 + earFlap;
                            }
                        }
                    } else {
                        // ARRIVED / IDLE at safe position: Stay completely still with facial expressions only!
                        this.state = 'idle';
                        this.playAnimation('idle');
                        this.resetLimbsToNeutral();

                        // IDLE: Smoothly turn around to face the camera/viewer front side
                        const pointerGlance = Math.max(-0.25, Math.min(0.25, (this.lastKnownPointer.x - this.pagePos.x) * 0.0015));
                        const idleTargetHeading = pointerGlance; // Front face looking at user!

                        let angleDiff = (idleTargetHeading - this.currentHeading) % (Math.PI * 2);
                        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        this.currentHeading += angleDiff * Math.min(1, delta * 8.0);
                        this.bunnyRoot.rotation.y = this.currentHeading;
                        this.bunnyRoot.rotation.z = THREE.MathUtils.lerp(this.bunnyRoot.rotation.z, 0, delta * 8.0);

                        if (this.gltfScene) {
                            const baseS = this.gltfBaseScale || 1.0;
                            this.gltfScene.scale.set(baseS, baseS, baseS);
                            this.gltfScene.position.y = -0.28; // Zero whole-body bouncing! Stays flat & calm

                            if (this.gltfNodes) {
                                // 1. Realistic Rabbit Eye Blinking (natural timing: swift 100ms blink every ~4.2s, plus occasional double-flutter)
                                const blinkTime = time % 4.2;
                                let eyeScale = 1.0;
                                if (blinkTime < 0.12) {
                                    eyeScale = 0.08; // closed eyelid
                                } else if (blinkTime > 0.22 && blinkTime < 0.32 && (Math.floor(time / 4.2) % 3 === 0)) {
                                    // Occasional double-blink flutter
                                    eyeScale = 0.12;
                                }
                                if (this.gltfNodes.cheekL) this.gltfNodes.cheekL.scale.y = eyeScale;
                                if (this.gltfNodes.cheekR) this.gltfNodes.cheekR.scale.y = eyeScale;

                                // 2. Realistic Nose & Muzzle Sniffing (bursts of micro-sniffs with natural inquisitive pauses)
                                if (this.gltfNodes.muzzle) {
                                    const sniffPhase = time % 2.6;
                                    let sniff = 0;
                                    if (sniffPhase < 1.3) {
                                        // Burst of rapid micro-sniffs (approx 3 per sec)
                                        sniff = Math.sin(time * 24) * 0.007;
                                    } else if (sniffPhase > 1.8 && sniffPhase < 2.3) {
                                        // Secondary short inquisitive sniff flutter
                                        sniff = Math.sin(time * 20) * 0.005;
                                    }
                                    const initZ = this.gltfNodes.muzzle.userData.initialPos ? this.gltfNodes.muzzle.userData.initialPos.z : -0.231;
                                    this.gltfNodes.muzzle.position.z = initZ + sniff;
                                    this.gltfNodes.muzzle.scale.set(1.0 + sniff * 0.04, 1.0 + sniff * 0.04, 1.0);

                                    // 3. Whisker Quivers synchronized with sniffing bursts
                                    if (this.gltfWhiskers) {
                                        this.gltfWhiskers.rotation.z = (sniff !== 0) ? (sniff * 7.5) : 0;
                                        this.gltfWhiskers.position.z = sniff * 0.4;
                                    }
                                }

                                // 4. Natural Independent Ear Alert Twitches (ears stay upright, twitching independently to room audio)
                                if (this.gltfNodes.earL) {
                                    const twitchL = (Math.sin(time * 2.7) > 0.94) ? 0.14 : 0;
                                    this.gltfNodes.earL.rotation.z = -0.06 + twitchL;
                                    this.gltfNodes.earL.rotation.y = Math.sin(time * 0.9) * 0.06;
                                    this.gltfNodes.earL.rotation.x = -0.10;
                                }
                                if (this.gltfNodes.earR) {
                                    const twitchR = (Math.sin(time * 3.5 + 2.0) > 0.94) ? -0.14 : 0;
                                    this.gltfNodes.earR.rotation.z = 0.06 + twitchR;
                                    this.gltfNodes.earR.rotation.y = -Math.cos(time * 1.1) * 0.06;
                                    this.gltfNodes.earR.rotation.x = -0.10;
                                }

                                // 5. Micro Head Glance toward cursor (observant, subtle, zero body movement)
                                if (this.gltfNodes.head) {
                                    this.gltfNodes.head.rotation.z = pointerGlance * 0.35;
                                    this.gltfNodes.head.rotation.y = pointerGlance * 0.45;
                                    this.gltfNodes.head.rotation.x = 0.04 + Math.sin(time * 1.5) * 0.012;
                                }
                            }
                        }

                        const pointerDist = Math.hypot(this.lastKnownPointer.x - this.pagePos.x, this.lastKnownPointer.y - this.pagePos.y);
                        if (pointerDist < 61 && (now - this.lastPetTime) > 3500) {
                            this.lastPetTime = now;
                            this.spawnFloatingHeart();
                        }
                    }
                }
            }

            if (!this.isWorkoutActive && !delayedSample) {
                this.state = 'idle';
                this.playAnimation('idle');
                this.resetLimbsToNeutral();
                this.bunnyRoot.rotation.y = 0;
                this.bunnyRoot.rotation.z = 0;
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

        // Landing bounce elastic spring
        if (this.landingBounceStartTime && (now - this.landingBounceStartTime) < 450) {
            const elapsed = (now - this.landingBounceStartTime) / 450;
            const bounce = Math.sin(elapsed * Math.PI * 3) * (1 - elapsed) * 0.22;
            if (this.gltfScene) {
                const baseS = this.gltfBaseScale || 1.0;
                this.gltfScene.scale.set(baseS * (1 + bounce * 0.4), baseS * (1 - bounce), baseS * (1 + bounce * 0.4));
            }
        }

        // Paw print particles
        if (this.footstepGroup) {
            if (this.state === 'walk' && !this.isDragging && (now - this.lastFootstepTime) > 280) {
                this.lastFootstepTime = now;
                this.spawnFootprint(worldPos);
            }

            if (this.footsteps.length > 0) {
                for (let i = this.footsteps.length - 1; i >= 0; i--) {
                    const fp = this.footsteps[i];
                    const age = (now - fp.birthTime) / 1400;
                    if (age >= 1) {
                        this.footstepGroup.remove(fp);
                        this.footsteps.splice(i, 1);
                    } else {
                        fp.material.opacity = (1 - age) * 0.38;
                        fp.scale.set(1 + age * 0.15, 1 + age * 0.15, 1);
                    }
                }
            }
        }

        // Live EKG wave rendering for Corner Capsule Drawer
        if (this.ekgCanvas && this.cornerCapsuleEl && (this.cornerCapsuleEl.classList.contains('expanded') || this.isDragging)) {
            this.drawEKGWave(delta);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Backward-compatible alias
const ThreeRoamingRabbit = BunnyCompanion;

    // Global Window Attachments
    window.BunnyState = BunnyState;
    window.bunnyGlobalState = bunnyGlobalState;
    window.BunnyFirebaseSync = BunnyFirebaseSync;
    window.bunnyFirebaseSync = bunnyFirebaseSync;
    window.BunnyCompanion = BunnyCompanion;
    window.ThreeRoamingRabbit = BunnyCompanion;
})(typeof window !== 'undefined' ? window : this);
