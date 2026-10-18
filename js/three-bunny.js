/**
 * Aadish Jain — Interactive 3D Bunny Avatar ("Blinky 3D")
 * Built with Three.js.
 * Features:
 * - Full 3D procedural bunny mesh with PBR materials and studio lighting
 * - Real-time 3D head and body tracking towards the user's cursor
 * - 360-degree mouse drag rotation
 * - Interactive 3D backflip, ear twitching, and carrot eating animations on click
 */

export class ThreeBunnyAvatar {
    constructor(canvasContainerId) {
        this.container = document.getElementById(canvasContainerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.bunnyGroup = null;
        this.headGroup = null;
        this.earLeft = null;
        this.earRight = null;
        this.carrot = null;

        this.targetRotation = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.isFlipping = false;
        this.flipProgress = 0;
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 340;
        const height = this.container.clientHeight || 340;

        // 1. Scene
        this.scene = new THREE.Scene();

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(0, 1.2, 5.2);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 4. Studio Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(ambientLight);

        // Main key light
        const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
        keyLight.position.set(3, 6, 4);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        this.scene.add(keyLight);

        // Cool rim light (Pixar / Apple style rim accent)
        const rimLight = new THREE.DirectionalLight(0x6366f1, 1.0);
        rimLight.position.set(-4, 3, -3);
        this.scene.add(rimLight);

        // Fill light
        const fillLight = new THREE.PointLight(0xf472b6, 0.6, 10);
        fillLight.position.set(0, -1, 3);
        this.scene.add(fillLight);

        // 5. Build 3D Bunny
        this.buildBunny();

        // 6. Event Listeners
        this.bindEvents();

        // 7. Render Loop
        this.animate();
    }

    buildBunny() {
        this.bunnyGroup = new THREE.Group();
        this.scene.add(this.bunnyGroup);

        // Materials
        const furMaterial = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.6,
            metalness: 0.05
        });

        const innerEarMaterial = new THREE.MeshStandardMaterial({
            color: 0xfecdd3,
            roughness: 0.8
        });

        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.1,
            metalness: 0.9
        });

        const eyeHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const noseMaterial = new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            roughness: 0.4
        });

        const cheekMaterial = new THREE.MeshStandardMaterial({
            color: 0xfda4af,
            roughness: 0.9,
            transparent: true,
            opacity: 0.7
        });

        // --- Body ---
        const bodyGeo = new THREE.SphereGeometry(0.85, 32, 32);
        const body = new THREE.Mesh(bodyGeo, furMaterial);
        body.scale.set(1, 1.15, 0.9);
        body.position.set(0, 0, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        this.bunnyGroup.add(body);

        // Fluffy belly
        const bellyGeo = new THREE.SphereGeometry(0.7, 24, 24);
        const bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const belly = new THREE.Mesh(bellyGeo, bellyMat);
        belly.scale.set(0.85, 1, 0.6);
        belly.position.set(0, -0.05, 0.45);
        this.bunnyGroup.add(belly);

        // Tail
        const tailGeo = new THREE.SphereGeometry(0.28, 16, 16);
        const tail = new THREE.Mesh(tailGeo, bellyMat);
        tail.position.set(0, -0.4, -0.9);
        this.bunnyGroup.add(tail);

        // Feet
        const footGeo = new THREE.SphereGeometry(0.32, 16, 16);
        const footLeft = new THREE.Mesh(footGeo, furMaterial);
        footLeft.scale.set(0.7, 0.5, 1.4);
        footLeft.position.set(-0.55, -0.9, 0.3);
        this.bunnyGroup.add(footLeft);

        const footRight = footLeft.clone();
        footRight.position.set(0.55, -0.9, 0.3);
        this.bunnyGroup.add(footRight);

        // Paws
        const pawGeo = new THREE.SphereGeometry(0.22, 16, 16);
        const pawLeft = new THREE.Mesh(pawGeo, furMaterial);
        pawLeft.position.set(-0.45, 0.1, 0.7);
        this.bunnyGroup.add(pawLeft);

        const pawRight = pawLeft.clone();
        pawRight.position.set(0.45, 0.1, 0.7);
        this.bunnyGroup.add(pawRight);

        // --- Head Group ---
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 1.15, 0.1);
        this.bunnyGroup.add(this.headGroup);

        const headGeo = new THREE.SphereGeometry(0.72, 32, 32);
        const head = new THREE.Mesh(headGeo, furMaterial);
        head.scale.set(1.05, 0.95, 1);
        head.castShadow = true;
        this.headGroup.add(head);

        // Cheeks
        const cheekLeft = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), cheekMaterial);
        cheekLeft.position.set(-0.42, -0.15, 0.52);
        cheekLeft.scale.set(1, 0.7, 0.4);
        this.headGroup.add(cheekLeft);

        const cheekRight = cheekLeft.clone();
        cheekRight.position.set(0.42, -0.15, 0.52);
        this.headGroup.add(cheekRight);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.11, 16, 16);
        const eyeLeft = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeLeft.position.set(-0.3, 0.1, 0.62);
        this.headGroup.add(eyeLeft);

        const eyeHighlightLeft = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeHighlightMaterial);
        eyeHighlightLeft.position.set(-0.28, 0.14, 0.72);
        this.headGroup.add(eyeHighlightLeft);

        const eyeRight = new THREE.Mesh(eyeGeo, eyeMaterial);
        eyeRight.position.set(0.3, 0.1, 0.62);
        this.headGroup.add(eyeRight);

        const eyeHighlightRight = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeHighlightMaterial);
        eyeHighlightRight.position.set(0.32, 0.14, 0.72);
        this.headGroup.add(eyeHighlightRight);

        // Nose
        const noseGeo = new THREE.ConeGeometry(0.08, 0.08, 16);
        const nose = new THREE.Mesh(noseGeo, noseMaterial);
        nose.rotation.x = Math.PI;
        nose.position.set(0, -0.05, 0.72);
        this.headGroup.add(nose);

        // --- Ears ---
        this.earLeft = new THREE.Group();
        this.earLeft.position.set(-0.35, 0.65, 0);
        this.headGroup.add(this.earLeft);

        const outerEarGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.2, 16);
        const outerEarLeft = new THREE.Mesh(outerEarGeo, furMaterial);
        outerEarLeft.scale.set(1, 1, 0.4);
        outerEarLeft.position.set(0, 0.6, 0);
        this.earLeft.add(outerEarLeft);

        const innerEarGeo = new THREE.CylinderGeometry(0.07, 0.14, 0.95, 16);
        const innerEarLeft = new THREE.Mesh(innerEarGeo, innerEarMaterial);
        innerEarLeft.scale.set(1, 1, 0.3);
        innerEarLeft.position.set(0, 0.55, 0.04);
        this.earLeft.add(innerEarLeft);

        this.earRight = new THREE.Group();
        this.earRight.position.set(0.35, 0.65, 0);
        this.headGroup.add(this.earRight);

        const outerEarRight = outerEarLeft.clone();
        this.earRight.add(outerEarRight);
        const innerEarRight = innerEarLeft.clone();
        this.earRight.add(innerEarRight);

        this.earLeft.rotation.z = -0.15;
        this.earRight.rotation.z = 0.15;

        // --- 3D Carrot Item ---
        this.carrot = new THREE.Group();
        const carrotBodyGeo = new THREE.ConeGeometry(0.18, 0.7, 16);
        const carrotBodyMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
        const carrotBody = new THREE.Mesh(carrotBodyGeo, carrotBodyMat);
        carrotBody.rotation.x = Math.PI;
        this.carrot.add(carrotBody);

        const carrotLeavesGeo = new THREE.CylinderGeometry(0.02, 0.08, 0.3, 8);
        const carrotLeavesMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
        const leaf1 = new THREE.Mesh(carrotLeavesGeo, carrotLeavesMat);
        leaf1.position.set(0, 0.38, 0);
        this.carrot.add(leaf1);

        const leaf2 = leaf1.clone();
        leaf2.rotation.z = 0.4;
        leaf2.position.set(0.06, 0.36, 0);
        this.carrot.add(leaf2);

        this.carrot.position.set(0.55, 0.05, 0.65);
        this.carrot.rotation.z = -0.4;
        this.bunnyGroup.add(this.carrot);

        // Ground shadow plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(3, 3);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.25 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -1.1;
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);
    }

    bindEvents() {
        // Track mouse movement for 3D look-at
        window.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            this.mouse.x = (e.clientX - centerX) / (window.innerWidth / 2);
            this.mouse.y = (e.clientY - centerY) / (window.innerHeight / 2);

            if (!this.isDragging) {
                this.targetRotation.y = this.mouse.x * 0.75;
                this.targetRotation.x = this.mouse.y * 0.35;
            }
        });

        // 3D Mouse Drag Orbit
        this.container.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging) return;
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.bunnyGroup.rotation.y += deltaX * 0.015;
            this.bunnyGroup.rotation.x += deltaY * 0.008;

            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointerup', () => {
            this.isDragging = false;
        });

        // Click to Backflip & Cheer
        this.container.addEventListener('click', () => {
            if (!this.isFlipping) {
                this.trigger3DFlip();
            }
        });

        // Responsive resize
        window.addEventListener('resize', () => {
            if (!this.container) return;
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    trigger3DFlip() {
        this.isFlipping = true;
        this.flipProgress = 0;

        // Floating 3D cheer particles
        this.spawn3DParticles();

        // Speech bubble notification
        const speech = document.getElementById('bunny-3d-speech');
        if (speech) {
            const quotes = [
                "Wheee! 3D flips for high sprint velocity! 🚀",
                "Aadish builds products with 3D depth and user delight! ✨",
                "Drag me with your mouse to inspect my 3D polygon mesh! 🥕",
                "Book an interview with Aadish before sprint freeze! 📅"
            ];
            speech.textContent = quotes[Math.floor(Math.random() * quotes.length)];
            speech.classList.add('visible');
            setTimeout(() => speech.classList.remove('visible'), 3500);
        }
    }

    spawn3DParticles() {
        const particleGroup = new THREE.Group();
        this.scene.add(particleGroup);

        const colors = [0x6366f1, 0xf43f5e, 0x10b981, 0xfbbf24];
        const particles = [];

        for (let i = 0; i < 20; i++) {
            const geo = new THREE.DodecahedronGeometry(0.08);
            const mat = new THREE.MeshStandardMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                roughness: 0.2
            });
            const p = new THREE.Mesh(geo, mat);
            p.position.set(0, 1.2, 0);
            p.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.12,
                Math.random() * 0.14 + 0.05,
                (Math.random() - 0.5) * 0.12
            );
            particleGroup.add(p);
            particles.push(p);
        }

        let pTime = 0;
        const animateP = () => {
            pTime++;
            particles.forEach(p => {
                p.position.add(p.velocity);
                p.velocity.y -= 0.005; // gravity
                p.rotation.x += 0.1;
                p.rotation.y += 0.1;
                p.scale.multiplyScalar(0.96);
            });

            if (pTime < 45) {
                requestAnimationFrame(animateP);
            } else {
                this.scene.remove(particleGroup);
            }
        };
        animateP();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Idle breathing & natural 3D head bobbing
        if (this.bunnyGroup && !this.isFlipping) {
            this.bunnyGroup.position.y = Math.sin(time * 2.5) * 0.06;

            // Ears twitching
            if (this.earLeft && this.earRight) {
                this.earLeft.rotation.z = -0.15 + Math.sin(time * 3) * 0.06;
                this.earRight.rotation.z = 0.15 + Math.sin(time * 3.5 + 1) * 0.06;
            }

            // Carrot gentle sway
            if (this.carrot) {
                this.carrot.rotation.x = Math.sin(time * 2) * 0.1;
            }

            // Head tracking target rotation
            if (!this.isDragging) {
                this.headGroup.rotation.y += (this.targetRotation.y - this.headGroup.rotation.y) * 0.08;
                this.headGroup.rotation.x += (this.targetRotation.x - this.headGroup.rotation.x) * 0.08;
                this.bunnyGroup.rotation.y += (this.targetRotation.y * 0.4 - this.bunnyGroup.rotation.y) * 0.05;
            }
        }

        // 3D Backflip Animation
        if (this.isFlipping) {
            this.flipProgress += 0.05;
            this.bunnyGroup.rotation.x = Math.sin(this.flipProgress * Math.PI) * (Math.PI * 2);
            this.bunnyGroup.position.y = Math.sin(this.flipProgress * Math.PI) * 1.5;

            if (this.flipProgress >= 1) {
                this.isFlipping = false;
                this.bunnyGroup.rotation.x = 0;
                this.bunnyGroup.position.y = 0;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}
