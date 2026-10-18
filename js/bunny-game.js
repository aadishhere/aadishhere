/**
 * Aadish Jain — Bunny Hop: The PM Sprint Runner Mini-Game
 * A casual, delightful canvas game where the player guides the bunny
 * to jump over Scope Creep & Unscheduled Meetings while collecting Carrots & User Research!
 */

export class BunnyRunnerGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = localStorage.getItem('pm_bunny_highscore') || 0;
        this.isPlaying = false;
        this.isGameOver = false;

        // Player (Bunny)
        this.bunny = {
            x: 50,
            y: 130,
            width: 44,
            height: 40,
            vy: 0,
            gravity: 0.85,
            jumpPower: -13,
            isGrounded: true
        };

        this.groundY = 170;
        this.obstacles = [];
        this.collectibles = [];
        this.spawnTimer = 0;
        this.gameSpeed = 4.5;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Keyboard jump
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    // Prevent page scroll when focusing on game
                    if (this.canvas.getBoundingClientRect().top < window.innerHeight && this.canvas.getBoundingClientRect().bottom > 0) {
                        e.preventDefault();
                    }
                    this.jump();
                }
            }
        });

        // Touch / click jump
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.jump();
        });

        // Start / Restart button
        const startBtn = document.getElementById('btn-start-bunny-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }

        this.drawStartScreen();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.parentElement.clientWidth || 700;
        this.canvas.height = 220;
        this.groundY = this.canvas.height - 40;
        this.bunny.y = this.groundY - this.bunny.height;
    }

    start() {
        this.score = 0;
        this.gameSpeed = 4.5;
        this.obstacles = [];
        this.collectibles = [];
        this.isGameOver = false;
        this.isPlaying = true;
        this.bunny.y = this.groundY - this.bunny.height;
        this.bunny.vy = 0;

        const overlay = document.getElementById('bunny-game-overlay');
        if (overlay) overlay.style.display = 'none';

        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.loop();
    }

    jump() {
        if (!this.isPlaying) {
            this.start();
            return;
        }
        if (this.bunny.isGrounded) {
            this.bunny.vy = this.bunny.jumpPower;
            this.bunny.isGrounded = false;
        }
    }

    loop() {
        if (!this.isPlaying) return;

        this.update();
        this.draw();

        if (!this.isGameOver) {
            this.animationFrameId = requestAnimationFrame(() => this.loop());
        }
    }

    update() {
        this.score += 1;
        this.gameSpeed += 0.0008;

        // Bunny physics
        this.bunny.vy += this.bunny.gravity;
        this.bunny.y += this.bunny.vy;

        if (this.bunny.y >= this.groundY - this.bunny.height) {
            this.bunny.y = this.groundY - this.bunny.height;
            this.bunny.vy = 0;
            this.bunny.isGrounded = true;
        }

        // Spawn obstacles & collectibles
        this.spawnTimer++;
        if (this.spawnTimer > Math.max(65, 120 - Math.floor(this.score / 150))) {
            this.spawnTimer = 0;
            if (Math.random() > 0.35) {
                // Obstacle: Scope Creep or 3-hr meeting
                const types = ["Scope Creep 🛑", "3-Hr Meeting 😴", "Tech Debt 💥", "Vanity Metric 📉"];
                const text = types[Math.floor(Math.random() * types.length)];
                this.obstacles.push({
                    x: this.canvas.width + 20,
                    y: this.groundY - 32,
                    width: 32,
                    height: 32,
                    text: text
                });
            } else {
                // Collectible: Carrot or User Research
                const items = ["🥕", "📈", "⭐"];
                const icon = items[Math.floor(Math.random() * items.length)];
                this.collectibles.push({
                    x: this.canvas.width + 20,
                    y: this.groundY - 50 - (Math.random() * 40),
                    width: 24,
                    height: 24,
                    icon: icon
                });
            }
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;

            // Collision check with bunny
            if (
                this.bunny.x + 8 < obs.x + obs.width &&
                this.bunny.x + this.bunny.width - 8 > obs.x &&
                this.bunny.y + 6 < obs.y + obs.height &&
                this.bunny.y + this.bunny.height > obs.y
            ) {
                this.gameOver();
                return;
            }

            if (obs.x < -150) {
                this.obstacles.splice(i, 1);
            }
        }

        // Update collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const col = this.collectibles[i];
            col.x -= this.gameSpeed;

            // Collect check
            if (
                this.bunny.x < col.x + col.width &&
                this.bunny.x + this.bunny.width > col.x &&
                this.bunny.y < col.y + col.height &&
                this.bunny.y + this.bunny.height > col.y
            ) {
                this.score += 150;
                this.collectibles.splice(i, 1);
            } else if (col.x < -50) {
                this.collectibles.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Ground track
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, this.groundY, this.canvas.width, 2);

        // Ground dots / sprint markers
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        const markerOffset = (this.score * this.gameSpeed) % 40;
        for (let x = -markerOffset; x < this.canvas.width; x += 40) {
            ctx.fillRect(x, this.groundY + 8, 12, 3);
        }

        // Draw Bunny
        ctx.save();
        ctx.translate(this.bunny.x, this.bunny.y);
        ctx.font = '32px sans-serif';
        ctx.fillText('🐰', 0, 32);
        ctx.restore();

        // Draw Obstacles
        ctx.font = '12px var(--font-sans, sans-serif)';
        ctx.textAlign = 'center';
        this.obstacles.forEach(obs => {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(obs.x - 25, obs.y, 50, 32, 6) : ctx.rect(obs.x - 25, obs.y, 50, 32);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(obs.text, obs.x, obs.y + 20);
        });

        // Draw Collectibles
        this.collectibles.forEach(col => {
            ctx.font = '22px sans-serif';
            ctx.fillText(col.icon, col.x + 12, col.y + 20);
        });

        // Draw HUD Score
        ctx.textAlign = 'right';
        ctx.font = '700 14px var(--font-mono, monospace)';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`Sprint Velocity: ${this.score} pts`, this.canvas.width - 20, 30);
    }

    drawStartScreen() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, this.groundY, this.canvas.width, 2);

        ctx.font = '36px sans-serif';
        ctx.fillText('🐰', 50, this.groundY - 10);
    }

    gameOver() {
        this.isGameOver = true;
        this.isPlaying = false;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pm_bunny_highscore', this.highScore);
        }

        const overlay = document.getElementById('bunny-game-overlay');
        const scoreText = document.getElementById('game-over-score');
        if (scoreText) scoreText.textContent = `${this.score} pts (Best: ${this.highScore} pts)`;
        if (overlay) overlay.style.display = 'flex';
    }
}
