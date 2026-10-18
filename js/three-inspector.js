/**
 * Aadish Jain — 3D Product Hardware Inspector
 * Built with Three.js.
 * Features:
 * - 3D Mechanical Timepiece (Chronos Watch with rotating bezel, ticking hands, metallic materials)
 * - 3D Apple Vision Pro Spatial Visor with ocular glass and glowing lidar ring
 * - 360-degree orbit drag controls and zoom
 * - Interactive 3D hotspots revealing PRD and business specs
 */

export class ThreeProductInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentModelGroup = null;
        this.watchGroup = null;
        this.visorGroup = null;
        this.secondHand = null;

        this.isDragging = false;
        this.prevMouse = { x: 0, y: 0 };
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 600;
        const height = 340;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(0, 1.2, 5.5);

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);

        const pointLight = new THREE.PointLight(0x6366f1, 1.8, 20);
        pointLight.position.set(4, 5, 4);
        this.scene.add(pointLight);

        const goldLight = new THREE.PointLight(0xf59e0b, 1.2, 20);
        goldLight.position.set(-4, -2, 3);
        this.scene.add(goldLight);

        // Build 3D Models
        this.buildChronosWatch();
        this.buildVisionVisor();

        // Start with Chronos Watch visible
        this.currentModelGroup = this.watchGroup;
        this.scene.add(this.watchGroup);

        this.bindEvents();
        this.animate();
    }

    buildChronosWatch() {
        this.watchGroup = new THREE.Group();

        // Metallic materials
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            metalness: 0.9,
            roughness: 0.2
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            metalness: 0.92,
            roughness: 0.15
        });

        const dialMat = new THREE.MeshStandardMaterial({
            color: 0x090a0f,
            roughness: 0.3,
            metalness: 0.4
        });

        const sapphireMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.9,
            opacity: 1,
            transparent: true,
            roughness: 0.05,
            ior: 1.77
        });

        // 1. Case
        const caseGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.45, 48);
        const watchCase = new THREE.Mesh(caseGeo, steelMat);
        this.watchGroup.add(watchCase);

        // 2. Fluted Bezel (Gold accent ring)
        const bezelGeo = new THREE.TorusGeometry(1.48, 0.1, 16, 48);
        const bezel = new THREE.Mesh(bezelGeo, goldMat);
        bezel.rotation.x = Math.PI / 2;
        bezel.position.y = 0.23;
        this.watchGroup.add(bezel);

        // 3. Dial Face
        const dialGeo = new THREE.CylinderGeometry(1.38, 1.38, 0.05, 36);
        const dial = new THREE.Mesh(dialGeo, dialMat);
        dial.position.y = 0.22;
        this.watchGroup.add(dial);

        // Hour markers
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const markerGeo = new THREE.BoxGeometry(0.06, 0.04, 0.2);
            const marker = new THREE.Mesh(markerGeo, goldMat);
            marker.position.set(Math.sin(angle) * 1.15, 0.25, Math.cos(angle) * 1.15);
            marker.rotation.y = angle;
            this.watchGroup.add(marker);
        }

        // Hands
        const hourHandGeo = new THREE.BoxGeometry(0.08, 0.02, 0.7);
        const hourHand = new THREE.Mesh(hourHandGeo, goldMat);
        hourHand.position.set(0, 0.26, 0.25);
        this.watchGroup.add(hourHand);

        const minuteHandGeo = new THREE.BoxGeometry(0.05, 0.02, 1.0);
        const minuteHand = new THREE.Mesh(minuteHandGeo, steelMat);
        minuteHand.position.set(0, 0.28, 0.35);
        minuteHand.rotation.y = 0.8;
        this.watchGroup.add(minuteHand);

        // Ticking Second Hand
        const secondHandGeo = new THREE.BoxGeometry(0.025, 0.02, 1.2);
        const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        this.secondHand = new THREE.Mesh(secondHandGeo, redMat);
        this.secondHand.position.set(0, 0.3, 0.4);
        this.watchGroup.add(this.secondHand);

        // Sapphire crystal top
        const crystalGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.06, 36);
        const crystal = new THREE.Mesh(crystalGeo, sapphireMat);
        crystal.position.y = 0.32;
        this.watchGroup.add(crystal);

        // Watch Straps (Luxury leather texture simulation)
        const strapMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.7 });
        const strapTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.8), strapMat);
        strapTop.position.set(0, -0.05, 2.2);
        this.watchGroup.add(strapTop);

        const strapBottom = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.8), strapMat);
        strapBottom.position.set(0, -0.05, -2.2);
        this.watchGroup.add(strapBottom);

        // Initial angle
        this.watchGroup.rotation.x = 0.65;
        this.watchGroup.rotation.y = -0.4;
    }

    buildVisionVisor() {
        this.visorGroup = new THREE.Group();

        // Curved 3D Visor glass
        const visorMat = new THREE.MeshPhysicalMaterial({
            color: 0x0f172a,
            transmission: 0.8,
            roughness: 0.1,
            metalness: 0.9,
            clearcoat: 1.0
        });

        const visorGeo = new THREE.SphereGeometry(1.6, 32, 16, 0, Math.PI);
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.scale.set(1.4, 0.9, 0.7);
        visor.rotation.x = Math.PI / 2;
        this.visorGroup.add(visor);

        // Aluminum frame
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.15 });
        const frame = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.12, 16, 48), frameMat);
        frame.scale.set(1.4, 0.9, 0.7);
        this.visorGroup.add(frame);

        // Spatial Audio Pods
        const audioMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const podLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6), audioMat);
        podLeft.rotation.z = Math.PI / 2;
        podLeft.position.set(-2.2, 0, -0.6);
        this.visorGroup.add(podLeft);

        const podRight = podLeft.clone();
        podRight.position.set(2.2, 0, -0.6);
        this.visorGroup.add(podRight);

        // Initial angle
        this.visorGroup.rotation.y = -0.3;
    }

    setModel(type) {
        if (this.currentModelGroup) {
            this.scene.remove(this.currentModelGroup);
        }

        if (type === 'watch') {
            this.currentModelGroup = this.watchGroup;
        } else {
            this.currentModelGroup = this.visorGroup;
        }
        this.scene.add(this.currentModelGroup);
    }

    bindEvents() {
        this.container.addEventListener('pointerdown', (e) => {
            this.isDragging = true;
            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || !this.currentModelGroup) return;
            const deltaX = e.clientX - this.prevMouse.x;
            const deltaY = e.clientY - this.prevMouse.y;

            this.currentModelGroup.rotation.y += deltaX * 0.012;
            this.currentModelGroup.rotation.x += deltaY * 0.008;

            this.prevMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointerup', () => {
            this.isDragging = false;
        });

        // Model Switch Buttons
        const btnWatch = document.getElementById('btn-inspect-watch');
        const btnVisor = document.getElementById('btn-inspect-visor');

        if (btnWatch && btnVisor) {
            btnWatch.addEventListener('click', () => {
                this.setModel('watch');
                btnWatch.classList.add('active');
                btnVisor.classList.remove('active');
            });

            btnVisor.addEventListener('click', () => {
                this.setModel('visor');
                btnVisor.classList.add('active');
                btnWatch.classList.remove('active');
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Ticking second hand
        if (this.secondHand) {
            this.secondHand.rotation.y = -time * 1.5;
        }

        // Gentle auto rotation when not dragging
        if (!this.isDragging && this.currentModelGroup) {
            this.currentModelGroup.rotation.y += 0.003;
            this.currentModelGroup.position.y = Math.sin(time * 1.5) * 0.06;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
