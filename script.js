document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return; // Ensure canvas exists on the page

    const ctx = canvas.getContext('2d');
    let width, height;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse interactivity variables
    let mouseX = -1000;
    let mouseY = -1000;
    const repelRadius = 150;
    const repelForce = 5;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // Keys requested by user
    const keys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
    const laneCount = keys.length;
    const laneState = new Array(laneCount).fill(0); // For lane illumination

    // Particle System
    const particles = [];

    class Particle {
        constructor(x, y, color, isAmbient = true) {
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            // Ambient particles float slowly; burst particles fly fast
            this.vx = isAmbient ? (Math.random() - 0.5) * 1 : (Math.random() - 0.5) * 8;
            this.vy = isAmbient ? (Math.random() - 0.5) * 1 : -(Math.random() * 5 + 3);
            this.size = Math.random() * 3 + 1;
            this.color = color;
            this.alpha = isAmbient ? Math.random() * 0.5 + 0.1 : 1;
            this.isAmbient = isAmbient;
            this.life = 1;
        }

        update() {
            // Apply velocity
            this.x += this.vx;
            this.y += this.vy;

            // Mouse Repulsion logic
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < repelRadius) {
                const force = (repelRadius - distance) / repelRadius;
                const angle = Math.atan2(dy, dx);

                // Push particles away
                this.x += Math.cos(angle) * force * repelForce;
                this.y += Math.sin(angle) * force * repelForce;
            }

            if (this.isAmbient) {
                // Keep ambient particles on screen (wrap around)
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            } else {
                // Burst particles fade out and die
                this.life -= 0.02;
                this.alpha = this.life;
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Initialize ambient particles
    for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const hue = Math.random() * 360;
        particles.push(new Particle(x, y, `hsl(${hue}, 100%, 70%)`, true));
    }

    // Keyboard interactivity
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        const index = keys.indexOf(key);
        if (index !== -1) {
            laneState[index] = 1; // Illuminate lane

            // Spawn burst particles at the bottom of the lane
            const laneWidth = width / laneCount;
            const spawnX = index * laneWidth + laneWidth / 2;
            const spawnY = height - 50;
            const hue = (index / laneCount) * 360;

            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(spawnX, spawnY, `hsl(${hue}, 100%, 50%)`, false));
            }
        }
    });

    // Animation Loop
    function animate() {
        // Clear canvas with trailing effect
        ctx.fillStyle = 'rgba(10, 10, 10, 0.3)';
        ctx.fillRect(0, 0, width, height);

        const laneWidth = width / laneCount;

        // Draw Lanes (Keyboard Reactivity)
        for (let i = 0; i < laneCount; i++) {
            laneState[i] *= 0.9; // Fade out

            if (laneState[i] > 0.01) {
                const hue = (i / laneCount) * 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${laneState[i] * 0.2})`;
                ctx.fillRect(i * laneWidth, 0, laneWidth, height);
            }

            // Subtle lane separators
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.moveTo(i * laneWidth, 0);
            ctx.lineTo(i * laneWidth, height);
            ctx.stroke();
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();

            if (!p.isAmbient && p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
