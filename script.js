// Tab Switching Logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// Canvas Background Logic
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const keys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const laneCount = keys.length;
const laneState = new Array(laneCount).fill(0); // 0 to 1 for brightness
const particles = [];

// Particle class for visual flair
class Particle {
    constructor(laneIndex) {
        const laneWidth = width / laneCount;
        this.x = laneIndex * laneWidth + laneWidth / 2 + (Math.random() - 0.5) * laneWidth * 0.5;
        this.y = 0; // Start at the top
        this.speed = Math.random() * 5 + 5; // Falling speed
        this.size = Math.random() * 3 + 2;
        this.color = `hsl(${(laneIndex / laneCount) * 360}, 100%, 50%)`;
        this.alpha = 1;
    }

    update() {
        this.y += this.speed;
        this.alpha -= 0.01; // Fade out slightly
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

// Generate background falling notes/particles randomly
function spawnAmbientParticles() {
    if (Math.random() < 0.1) {
        const randomLane = Math.floor(Math.random() * laneCount);
        particles.push(new Particle(randomLane));
    }
}

// Handle Keydown
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const index = keys.indexOf(key);
    if (index !== -1) {
        laneState[index] = 1; // Max brightness
        // Spawn burst of particles on key press
        for(let i=0; i<5; i++) {
            let p = new Particle(index);
            p.y = height - 50; // Spawn near bottom
            p.speed = -(Math.random() * 5 + 2); // Fly upwards
            particles.push(p);
        }
    }
});

// Animation Loop
function animate() {
    // Semi-transparent black to create trailing effect
    ctx.fillStyle = 'rgba(10, 10, 10, 0.2)';
    ctx.fillRect(0, 0, width, height);

    const laneWidth = width / laneCount;

    // Draw Lanes
    for (let i = 0; i < laneCount; i++) {
        // Fade out lane brightness over time
        laneState[i] *= 0.9;

        if (laneState[i] > 0.01) {
            const hue = (i / laneCount) * 360;
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${laneState[i] * 0.3})`;
            ctx.fillRect(i * laneWidth, 0, laneWidth, height);

            // Draw hit line at bottom
            ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${laneState[i]})`;
            ctx.fillRect(i * laneWidth, height - 60, laneWidth, 10);
        }

        // Draw lane separators (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
        ctx.stroke();
    }

    spawnAmbientParticles();

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        // Remove dead particles
        if (p.alpha <= 0 || p.y > height + 10 || p.y < -10) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

animate();
