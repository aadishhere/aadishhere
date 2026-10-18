/**
 * Aadish Jain — 3D WebGL Sprint Runner Game
 * Built with Three.js.
 * Full 3D perspective camera, dynamic shadows, 3D jumping bunny,
 * 3D rotating Scope Creep hurdles, and glowing 3D carrots!
 */

export class ThreeRunnerGame {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bunny = null;
        this.runway = null;

        this.score = 0;
        this.highScore = localStorage.getItem('pm_3d_bunny_highscore') || 0;
        this.isPlaying = false;
        this.isGameOver = false;

        this.bunnyY = 0;
        this.bunnyVy = 0;
        this.gravity = -0.018;
        this.jumpPower = 0.38;
        this.isGrounded = true;

        this.obstacles = [];
        this.collectibles = [];
        this.spawnTimer = 0;
        this.gameSpeed = 0.22;
        this.animationId = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 750;
        const height = 280;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0b0e, 0.035);

        // Camera (3D Isometric Perspective)
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 3.8, 8.5);
        this.camera.lookAt(0, 1.2, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0x818cf8, 1.4);
        dirLight.position.set(4, 8, 6);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -6;
        dirLight.shadow.camera.right = 6;
        dirLight.shadow.camera.top = 6;
        dirLight.shadow.camera.bottom = -6;
        this.scene.add(dirLight);

        // Build 3D Runway
        this.buildRunway();

        // Build 3D Player Bunny
        this.buildBunny();

        // Controls
        this.bindEvents();

        // Initial Render
        this.renderer.render(this.scene, this.camera);
    }

    buildRunway() {
        // Floating futuristic grid runway
        const runwayGeo = new THREE.PlaneGeometry(5, 50);
        const runwayMat = new THREE.MeshStandardMaterial({
            color: 0x111318,
            roughness: 0.8,
            metalness: 0.2
        });
        this.runway = new THREE.Mesh(runwayGeo, runwayMat);
        this.runway.rotation.x = -Math.PI / 2;
        this.runway.position.set(0, 0, -15);
        this.runway.receiveShadow = true;
        this.scene.add(this.runway);

        // Neon runway side rails
        const railGeo = new THREE.BoxGeometry(0.12, 0.2, 50);
        const railMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
        const leftRail = new THREE.Mesh(railGeo, railMat);
        leftRail.position.set(-2.5, 0.1, -15);
        this.scene.add(leftRail);

        const rightRail = leftRail.clone();
        rightRail.position.set(2.5, 0.1, -15);
        this.scene.add(rightRail);
    }

    buildBunny() {
        this.bunny = new THREE.Group();
        this.bunny.position.set(0, 0.5, 3.5);

        const furMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const earMat = new THREE.MeshStandardMaterial({ color: 0xfecdd3 });

        // Body
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), furMat);
        body.scale.set(1, 1.1, 0.9);
        body.castShadow = true;
        this.bunny.add(body);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), furMat);
        head.position.set(0, 0.45, 0.1);
        head.castShadow = true;
        this.bunny.add(head);

        // Ears
        const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.55, 8);
        const earL = new THREE.Mesh(earGeo, furMat);
        earL.position.set(-0.14, 0.82, 0);
        earL.rotation.z = -0.2;
        this.bunny.add(earL);

        const earR = new THREE.Mesh(earGeo, furMat);
        earR.position.set(0.14, 0.82, 0);
        earR.rotation.z = 0.2;
        this.bunny.add(earR);

        // Tail
        const tail = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), furMat);
        tail.position.set(0, 0, -0.42);
        this.bunny.add(tail);

        this.scene.add(this.bunny);
    }

    bindEvents() {
        const jumpHandler = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.jump();
                }
            }
        };

        window.addEventListener('keydown', jumpHandler);

        this.container.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.jump();
        });

        const startBtn = document.getElementById('btn-start-3d-runner');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }

        window.addEventListener('resize', () => {
            if (!this.container) return;
            const w = this.container.clientWidth;
            const h = 280;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    start() {
        this.score = 0;
        this.bunnyY = 0;
        this.bunnyVy = 0;
        this.isGrounded = true;
        this.gameSpeed = 0.22;
        this.isGameOver = false;
        this.isPlaying = true;

        // Clear existing obstacles
        this.obstacles.forEach(o => this.scene.remove(o.mesh));
        this.collectibles.forEach(c => this.scene.remove(c.mesh));
        this.obstacles = [];
        this.collectibles = [];

        const overlay = document.getElementById('runner-3d-overlay');
        if (overlay) overlay.style.display = 'none';

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop();
    }

    jump() {
        if (!this.isPlaying) {
            this.start();
            return;
        }
        if (this.isGrounded) {
            this.bunnyVy = this.jumpPower;
            this.isGrounded = false;
        }
    }

    loop() {
        if (!this.isPlaying) return;

        this.update();
        this.renderer.render(this.scene, this.camera);

        if (!this.isGameOver) {
            this.animationId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        this.score += 1;
        this.gameSpeed += 0.00005;

        // Bunny physics
        this.bunnyVy += this.gravity;
        this.bunnyY += this.bunnyVy;

        if (this.bunnyY <= 0) {
            this.bunnyY = 0;
            this.bunnyVy = 0;
            this.isGrounded = true;
        }

        this.bunny.position.y = 0.5 + this.bunnyY;
        this.bunny.rotation.x = this.isGrounded ? 0 : -this.bunnyVy * 0.8;

        // Spawn 3D Obstacles & Collectibles
        this.spawnTimer++;
        if (this.spawnTimer > Math.max(40, 75 - Math.floor(this.score / 200))) {
            this.spawnTimer = 0;

            if (Math.random() > 0.4) {
                // 3D Obstacle: Glowing red Scope Creep cube
                const obsGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
                const obsMat = new THREE.MeshStandardMaterial({
                    color: 0xef4444,
                    emissive: 0x7f1d1d,
                    roughness: 0.3
                });
                const obs = new THREE.Mesh(obsGeo, obsMat);
                obs.castShadow = true;
                obs.position.set((Math.random() - 0.5) * 2.8, 0.45, -30);
                this.scene.add(obs);
                this.obstacles.push({ mesh: obs, label: "Scope Creep 🛑" });
            } else {
                // 3D Collectible: Spinning golden 3D carrot
                const carrotGeo = new THREE.ConeGeometry(0.2, 0.7, 8);
                const carrotMat = new THREE.MeshStandardMaterial({
                    color: 0xf97316,
                    emissive: 0x7c2d12,
                    roughness: 0.2
                });
                const carrot = new THREE.Mesh(carrotGeo, carrotMat);
                carrot.rotation.x = Math.PI;
                carrot.position.set((Math.random() - 0.5) * 3, 0.8 + Math.random() * 0.6, -30);
                this.scene.add(carrot);
                this.collectibles.push({ mesh: carrot });
            }
        }

        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.mesh.position.z += this.gameSpeed;
            obs.mesh.rotation.y += 0.03;
            obs.mesh.rotation.x += 0.02;

            // 3D Collision Detection with bunny
            const dx = Math.abs(obs.mesh.position.x - this.bunny.position.x);
            const dy = Math.abs(obs.mesh.position.y - this.bunny.position.y);
            const dz = Math.abs(obs.mesh.position.z - this.bunny.position.z);

            if (dx < 0.65 && dy < 0.7 && dz < 0.7) {
                this.gameOver();
                return;
            }

            if (obs.mesh.position.z > 8) {
                this.scene.remove(obs.mesh);
                this.obstacles.splice(i, 1);
            }
        }

        // Move collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const col = this.collectibles[i];
            col.mesh.position.z += this.gameSpeed;
            col.mesh.rotation.y += 0.06;

            const dx = Math.abs(col.mesh.position.x - this.bunny.position.x);
            const dy = Math.abs(col.mesh.position.y - this.bunny.position.y);
            const dz = Math.abs(col.mesh.position.z - this.bunny.position.z);

            if (dx < 0.8 && dy < 0.9 && dz < 0.8) {
                this.score += 200;
                this.scene.remove(col.mesh);
                this.collectibles.splice(i, 1);
            } else if (col.mesh.position.z > 8) {
                this.scene.remove(col.mesh);
                this.collectibles.splice(i, 1);
            }
        }

        // Update score display
        const scoreEl = document.getElementById('runner-3d-score');
        if (scoreEl) scoreEl.textContent = `${this.score} pts`;
    }

    gameOver() {
        this.isGameOver = true;
        this.isPlaying = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pm_3d_bunny_highscore', this.highScore);
        }

        const overlay = document.getElementById('runner-3d-overlay');
        const scoreText = document.getElementById('runner-3d-final-score');
        if (scoreText) scoreText.textContent = `${this.score} pts (Best: ${this.highScore} pts)`;
        if (overlay) overlay.style.display = 'flex';
    }
}
