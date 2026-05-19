/* ==========================================================================
   KEYBOARD SYMPHONY WEBPAGE LOGIC ENGINE
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------------------
    // 1. GLOBAL LAYOUT LOGIC (MOBILE MENU)
    // ---------------------------------------------------------
    const mobileMenu = document.getElementById("menu-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener("click", () => {
            navMenu.classList.toggle("active");
            mobileMenu.classList.toggle("open");
        });
    }

    // ---------------------------------------------------------
    // 2. DOCUMENTATION INNER ROUTER
    // ---------------------------------------------------------
    const docLinks = document.querySelectorAll(".docs-nav-link");
    const docArticles = document.querySelectorAll(".doc-article");

    docLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href").substring(1);
            
            // Toggle active styling on navigation anchors
            docLinks.forEach(lnk => lnk.classList.remove("active"));
            link.classList.add("active");

            // Toggle active article blocks
            docArticles.forEach(art => {
                art.classList.remove("active");
                if (art.id === targetId) {
                    art.classList.add("active");
                }
            });
        });
    });

    // ---------------------------------------------------------
    // 3. WEB AUDIO API SYNTHESIZER
    // ---------------------------------------------------------
    // Setup AudioContext (instantiated on first user interaction to bypass browser security)
    let audioCtx = null;

    // Harmonious musical pitches mapped to the 10 core lanes
    const KEY_PITCHES = {
        'Q': 261.63, // C4
        'W': 293.66, // D4
        'E': 329.63, // E4
        'R': 349.23, // F4
        'T': 392.00, // G4
        'Y': 440.00, // A4
        'U': 493.88, // B4
        'I': 523.25, // C5
        'O': 587.33, // D5
        'P': 659.25  // E5
    };

    const keyLanesIndex = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const activeOscillators = {};

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playNote(keyChar) {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const frequency = KEY_PITCHES[keyChar];
        if (!frequency || activeOscillators[keyChar]) return;

        // Create oscillator and control gain envelope
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        // Elegant retro-modern synthesizer shape (Triangle + smooth release envelope)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        // Quick attack envelope to prevent clicks
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.05);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();

        // Store active synth node references
        activeOscillators[keyChar] = {
            osc: osc,
            gain: gainNode
        };
    }

    function stopNote(keyChar) {
        const synthInstance = activeOscillators[keyChar];
        if (!synthInstance) return;

        // Apply smooth decay/release envelope
        const gainNode = synthInstance.gain;
        const osc = synthInstance.osc;

        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        
        setTimeout(() => {
            try {
                osc.stop();
                osc.disconnect();
                gainNode.disconnect();
            } catch (e) {}
        }, 300);

        delete activeOscillators[keyChar];
    }

    // ---------------------------------------------------------
    // 4. REACTIVE HTML5 CANVAS PARTICLE ENGINE
    // ---------------------------------------------------------
    const canvas = document.getElementById("particle-canvas");
    const ctx = canvas.getContext("2d");

    let particles = [];
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    function resizeCanvas() {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 2;
            this.speedX = Math.random() * 4 - 2;
            this.speedY = -(Math.random() * 5 + 3); // Rise upwards
            this.color = color;
            this.alpha = 1.0;
            this.decay = Math.random() * 0.015 + 0.008;
            this.sparkle = Math.random() > 0.5;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= this.decay;
            if (this.sparkle) {
                this.size = Math.max(0.1, this.size + (Math.random() * 0.8 - 0.4));
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Active visualizer lanes tracking list
    const activeLanesState = Array(10).fill(false);

    function spawnVisualizerBurst(laneIndex) {
        // Calculate coordinate of virtual bottom lanes
        const startX = (canvasWidth / 2) - 200 + (laneIndex * 44) + 22;
        const startY = canvasHeight - 20;

        // Choose color based on custom lane color maps
        const isMagenta = (laneIndex === 4 || laneIndex === 5);
        const particleColor = isMagenta ? "#ff007f" : "#00f0ff";

        // Spawn a spectacular burst of particles rising upwards
        for (let i = 0; i < 15; i++) {
            particles.push(new Particle(startX, startY, particleColor));
        }
    }

    // Animation Loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw soft base gradient
        const bgGrad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, 10, canvasWidth / 2, canvasHeight / 2, canvasWidth);
        bgGrad.addColorStop(0, "#080914");
        bgGrad.addColorStop(1, "#030305");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Update and draw floating particles
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // Render reactive visualizer lanes at screen bottom
        drawVisualizerLanes();

        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    function drawVisualizerLanes() {
        const laneCount = 10;
        const laneWidth = 44;
        const gap = 4;
        const totalWidth = (laneCount * laneWidth) + ((laneCount - 1) * gap);
        const startX = (canvasWidth / 2) - (totalWidth / 2);
        const startY = canvasHeight - 30;

        ctx.save();
        for (let i = 0; i < laneCount; i++) {
            const x = startX + (i * (laneWidth + gap));
            const active = activeLanesState[i];
            const isMagenta = (i === 4 || i === 5);
            const baseColor = isMagenta ? "#ff007f" : "#00f0ff";

            if (active) {
                // Glow intensity on trigger
                ctx.shadowBlur = 15;
                ctx.shadowColor = baseColor;
                ctx.strokeStyle = baseColor;
                ctx.fillStyle = isMagenta ? "rgba(255, 0, 127, 0.15)" : "rgba(0, 240, 255, 0.15)";
                ctx.lineWidth = 2.5;
            } else {
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
                ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
                ctx.lineWidth = 1;
            }

            // Draw clean rounded hit lane boxes
            ctx.beginPath();
            ctx.roundRect(x, startY, laneWidth, 24, 4);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    // ---------------------------------------------------------
    // 5. KEYBOARD CAPTURE & INTERACTION HANDLERS
    // ---------------------------------------------------------
    const keySlotElements = document.querySelectorAll(".key-slot");
    const synthStatus = document.getElementById("synth-status");

    // Helper to find lane mapping index
    function getLaneKeyChar(keyCode) {
        switch(keyCode) {
            case 81: return 'Q';
            case 87: return 'W';
            case 69: return 'E';
            case 82: return 'R';
            case 84: return 'T';
            case 89: return 'Y';
            case 85: return 'U';
            case 73: return 'I';
            case 79: return 'O';
            case 80: return 'P';
            default: return null;
        }
    }

    // Only register keyboard event listeners if key slots actually exist on this page
    if (keySlotElements.length > 0) {
        window.addEventListener("keydown", (e) => {
            // Prevent default actions for standard space, arrows to prevent scrolling
            if (e.keyCode === 32 || (e.keyCode >= 37 && e.keyCode <= 40)) {
                if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
                    e.preventDefault();
                }
            }

            const keyChar = getLaneKeyChar(e.keyCode);
            if (!keyChar) return;

            // Skip keys when typing in standard search inputs
            if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
                return;
            }

            const index = keyLanesIndex.indexOf(keyChar);
            if (index === -1) return;

            // Trigger active virtual keys
            activeLanesState[index] = true;
            
            const slotEl = keySlotElements[index];
            if (slotEl) {
                slotEl.classList.add("active");
                if (keyChar === 'T' || keyChar === 'Y') {
                    slotEl.classList.add("active-magenta");
                }
            }

            // Fire particle burst
            spawnVisualizerBurst(index);

            // Synthesize audio
            playNote(keyChar);

            if (synthStatus) {
                synthStatus.textContent = `PLAYING NOTE: ${keyChar} (${Math.round(KEY_PITCHES[keyChar])}Hz)`;
            }
        });

        window.addEventListener("keyup", (e) => {
            const keyChar = getLaneKeyChar(e.keyCode);
            if (!keyChar) return;

            const index = keyLanesIndex.indexOf(keyChar);
            if (index === -1) return;

            activeLanesState[index] = false;

            const slotEl = keySlotElements[index];
            if (slotEl) {
                slotEl.classList.remove("active");
                slotEl.classList.remove("active-magenta");
            }

            stopNote(keyChar);

            if (synthStatus) {
                const hasActiveNotes = Object.keys(activeOscillators).length > 0;
                if (!hasActiveNotes) {
                    synthStatus.textContent = "PRESS Q-W-E-R-T-Y-U-I-O-P ON YOUR KEYBOARD TO PLAY!";
                }
            }
        });

        // Web-click interactions for visual slots
        keySlotElements.forEach(slot => {
            const keyCode = parseInt(slot.getAttribute("data-key"));
            const keyChar = getLaneKeyChar(keyCode);
            const index = keyLanesIndex.indexOf(keyChar);

            slot.addEventListener("mousedown", () => {
                if (!keyChar) return;
                activeLanesState[index] = true;
                slot.classList.add("active");
                if (keyChar === 'T' || keyChar === 'Y') {
                    slot.classList.add("active-magenta");
                }
                spawnVisualizerBurst(index);
                playNote(keyChar);
            });

            slot.addEventListener("mouseup", () => {
                if (!keyChar) return;
                activeLanesState[index] = false;
                slot.classList.remove("active");
                slot.classList.remove("active-magenta");
                stopNote(keyChar);
            });

            slot.addEventListener("mouseleave", () => {
                if (!keyChar) return;
                activeLanesState[index] = false;
                slot.classList.remove("active");
                slot.classList.remove("active-magenta");
                stopNote(keyChar);
            });
        });
    }

    // ---------------------------------------------------------
    // 6. DYNAMIC COMMUNITY LEVEL & LEADERBOARD GRID RENDER
    // ---------------------------------------------------------
    
    // Curated mock levels detailing 1-20 stars
    const communityCharts = [
        { title: "Cybernetic Overture", artist: "Hologram Synths", creator: "ByteWhip", stars: 4, downloads: 412 },
        { title: "Mechanical Resonance", artist: "Piston Rhythmics", creator: "GearGrinder", stars: 7, downloads: 689 },
        { title: "N-Key Symphony No. 9", artist: "Deno Core Orchestra", creator: "Member #0001", stars: 20, downloads: 1421 },
        { title: "Cascading Streams", artist: "Linear Interpolation", creator: "MatrixRunner", stars: 12, downloads: 832 },
        { title: "Supabase Syncrenicity", artist: "The Table Joins", creator: "QueryMaster", stars: 9, downloads: 721 },
        { title: "Binary Torrent", artist: "Infinite Threads", creator: "ByteWhip", stars: 16, downloads: 541 },
        { title: "Oscillator Sweep", artist: "Web Audio Club", creator: "SynthKid", stars: 3, downloads: 290 },
        { title: "Keyboard Cataclysm", artist: "Mechanical Panic", creator: "Member #0001", stars: 19, downloads: 1289 },
        { title: "Vorbis Pulse", artist: "Ogg Devs", creator: "Transcoder", stars: 6, downloads: 409 }
    ];

    // Mock Creator Leaderboard showcasing PIDs
    const creatorsLeaderboard = [
        { rank: 1, name: "Member #0001", pid: "PID #0001", stars: 2541, medal: "gold" },
        { rank: 2, name: "ByteWhip", pid: "PID #0042", stars: 1980, medal: "silver" },
        { rank: 3, name: "GearGrinder", pid: "PID #0112", stars: 1429, medal: "bronze" },
        { rank: 4, name: "MatrixRunner", pid: "PID #0056", stars: 932, medal: "none" },
        { rank: 5, name: "QueryMaster", pid: "PID #0099", stars: 721, medal: "none" }
    ];

    const chartsContainer = document.getElementById("charts-container");
    const leaderboardContainer = document.getElementById("leaderboard-container");
    const chartSearch = document.getElementById("chart-search");
    const starFilter = document.getElementById("star-filter");

    function renderCharts() {
        if (!chartsContainer) return;
        chartsContainer.innerHTML = "";

        const searchQuery = chartSearch ? chartSearch.value.toLowerCase() : "";
        const diffFilter = starFilter ? starFilter.value : "all";

        const filtered = communityCharts.filter(chart => {
            // Search validation
            const matchesSearch = chart.title.toLowerCase().includes(searchQuery) ||
                                  chart.artist.toLowerCase().includes(searchQuery) ||
                                  chart.creator.toLowerCase().includes(searchQuery);
            
            // Difficulty categorization
            let matchesDiff = true;
            if (diffFilter === "easy") matchesDiff = (chart.stars >= 1 && chart.stars <= 5);
            else if (diffFilter === "medium") matchesDiff = (chart.stars >= 6 && chart.stars <= 12);
            else if (diffFilter === "hard") matchesDiff = (chart.stars >= 13 && chart.stars <= 18);
            else if (diffFilter === "expert") matchesDiff = (chart.stars >= 19 && chart.stars <= 20);

            return matchesSearch && matchesDiff;
        });

        if (filtered.length === 0) {
            chartsContainer.innerHTML = `<div class="glass-card" style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">NO CHARTS FOUND MATCHING YOUR FILTERS.</div>`;
            return;
        }

        filtered.forEach(chart => {
            const starsText = "★ ".repeat(Math.min(5, Math.ceil(chart.stars / 4))) + `(${chart.stars})`;
            const cardHTML = `
                <div class="glass-card chart-card glow-hover-cyan">
                    <div class="chart-card-header">
                        <span class="chart-stars">${starsText}</span>
                        <span class="badge" style="background:rgba(0,240,255,0.05); border-color:rgba(0,240,255,0.2); color:var(--neon-cyan); padding: 2px 8px; font-size:0.6rem;">${chart.downloads} DLs</span>
                    </div>
                    <div class="chart-title">${chart.title}</div>
                    <div class="chart-artist">${chart.artist}</div>
                    <div class="chart-footer">
                        <div class="chart-creator">BY <span>${chart.creator}</span></div>
                        <a href="#" class="chart-btn" onclick="event.preventDefault(); alert('Level downloading directly to editor synced cache...');">GET CHART</a>
                    </div>
                </div>
            `;
            chartsContainer.insertAdjacentHTML("beforeend", cardHTML);
        });
    }

    function renderLeaderboard() {
        if (!leaderboardContainer) return;
        leaderboardContainer.innerHTML = "";

        creatorsLeaderboard.forEach(item => {
            let rankClass = "rank-lbl";
            if (item.medal === "gold") rankClass += " gold";
            else if (item.medal === "silver") rankClass += " silver";
            else if (item.medal === "bronze") rankClass += " bronze";

            const rankContent = item.rank <= 3 ? "★" : item.rank;

            const itemHTML = `
                <div class="leaderboard-item">
                    <div class="leaderboard-profile">
                        <span class="${rankClass}">${rankContent}</span>
                        <div>
                            <div class="creator-name">${item.name}</div>
                            <div class="creator-pid">${item.pid}</div>
                        </div>
                    </div>
                    <span class="creator-stars">${item.stars} ★</span>
                </div>
            `;
            leaderboardContainer.insertAdjacentHTML("beforeend", itemHTML);
        });
    }

    // Connect filter triggers
    if (chartSearch) chartSearch.addEventListener("input", renderCharts);
    if (starFilter) starFilter.addEventListener("change", renderCharts);

    // Initial table render execution
    renderCharts();
    renderLeaderboard();
});
