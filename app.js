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
    // 1.1 GLOBAL SCENE TRANSITION SYSTEM (Godot-style)
    // ---------------------------------------------------------
    const overlay = document.querySelector(".scene-transition-overlay");
    const gradients = [
        "linear-gradient(135deg, #00f0ff, #ff007f)", // Cyan -> Magenta
        "linear-gradient(135deg, #ff5e00, #ff007f)", // Orange -> Magenta
        "linear-gradient(135deg, #00ff66, #00f0ff)", // Green -> Cyan
        "linear-gradient(135deg, #ff007f, #8a2be2)", // Hot Pink -> Purple
        "linear-gradient(135deg, #00f0ff, #39ff14)"  // Cyan -> Neon Green
    ];

    function playTransitionWhoosh() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            
            const bufferSize = audioCtx.sampleRate * 0.6; // 0.6s sweep
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            
            // Generate structural noise sweep
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = audioCtx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(90, audioCtx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(1900, audioCtx.currentTime + 0.3);
            filter.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.6);
            
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.22);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            
            noise.start();
        } catch (e) {
            console.warn("AudioContext trans-sound fallback failed:", e);
        }
    }

    if (overlay) {
        // Fetch last transitioned color coordinate
        const currentGradIndex = parseInt(localStorage.getItem("scene_transition_grad_index") || "0");
        overlay.style.background = gradients[currentGradIndex];

        // Trigger entrance sweep off to the right
        requestAnimationFrame(() => {
            setTimeout(() => {
                overlay.classList.add("entrance");
            }, 30);
        });

        // Bind exit sweeps to all physical HTML anchors
        document.querySelectorAll("a").forEach(link => {
            const href = link.getAttribute("href");
            // Only transition relative physical HTML file links
            if (href && href.endsWith(".html") && !href.startsWith("http") && !href.startsWith("#")) {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    
                    // Increment and store next transition index
                    const nextGradIndex = (currentGradIndex + 1) % gradients.length;
                    localStorage.setItem("scene_transition_grad_index", nextGradIndex.toString());
                    
                    // Play sound
                    playTransitionWhoosh();

                    // Snap back to left instantly
                    overlay.style.background = gradients[currentGradIndex];
                    overlay.style.transition = "none";
                    overlay.style.transform = "skewX(-20deg) translateX(-110%)";
                    
                    // Force GPU reflow repaint
                    void overlay.offsetWidth;

                    // Trigger hold swipe sweep covering the viewport
                    overlay.classList.remove("entrance");
                    overlay.classList.add("hold");

                    // Physical navigation delay matching exit wipe transition
                    setTimeout(() => {
                        window.location.href = href;
                    }, 480);
                });
            }
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

    // Tracker for mouse positioning
    let mouseX = -1000;
    let mouseY = -1000;

    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
        mouseX = -1000;
        mouseY = -1000;
    });

    // AAA Click Energy burst dispersion
    window.addEventListener("click", (e) => {
        // Prevent click bursts when interacting with UI buttons, links, search bars or keys
        if (
            e.target.tagName === "BUTTON" || 
            e.target.tagName === "A" || 
            e.target.tagName === "INPUT" || 
            e.target.tagName === "SELECT" || 
            e.target.closest(".key-slot") || 
            e.target.closest(".docs-sidebar")
        ) {
            return;
        }
        
        const colors = ["#00f0ff", "#ff007f"];
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 5 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const p = new Particle(e.clientX, e.clientY, color);
            p.speedX = Math.cos(angle) * velocity;
            p.speedY = Math.sin(angle) * velocity;
            p.decay = Math.random() * 0.02 + 0.015; // Decay faster
            particles.push(p);
        }
    });

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
            this.size = Math.random() * 2 + 1.2;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = -(Math.random() * 2.5 + 1.2); // Rise upwards
            this.color = color;
            this.alpha = 1.0;
            this.decay = Math.random() * 0.008 + 0.004;
            this.sparkle = Math.random() > 0.5;
        }

        update() {
            // Apply slight mechanical wind
            this.x += this.speedX;
            this.y += this.speedY;
            this.alpha -= this.decay;

            // AAA Magnetic Cursor Attraction Physics (Optimized with squared distance check)
            if (mouseX >= 0 && mouseY >= 0) {
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distSq = dx * dx + dy * dy;
                const radiusSq = 260 * 260;
                if (distSq < radiusSq) {
                    const distance = Math.sqrt(distSq);
                    if (distance > 0) {
                        const pullFactor = (260 - distance) / 260 * 0.12;
                        this.speedX += (dx / distance) * pullFactor;
                        this.speedY += (dy / distance) * pullFactor;
                    }
                }
            }

            if (this.sparkle) {
                this.size = Math.max(0.1, this.size + (Math.random() * 0.4 - 0.2));
            }
        }

        draw() {
            // Dual-layered fill renders a beautiful glowing core 100x faster than shadowBlur
            ctx.fillStyle = this.color;
            
            // Outer corona glow
            ctx.globalAlpha = this.alpha * 0.18;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Solid inner core
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Active visualizer lanes tracking list
    const activeLanesState = Array(10).fill(false);
    const visHeights = Array(10).fill(4);

    function spawnVisualizerBurst(laneIndex) {
        // Skip spawning if particle count already exceeds target performance ceiling
        if (particles.length > 90) return;

        const startX = (canvasWidth / 2) - 200 + (laneIndex * 44) + 22;
        const startY = canvasHeight - 20;

        const isMagenta = (laneIndex === 4 || laneIndex === 5);
        const particleColor = isMagenta ? "#ff007f" : "#00f0ff";

        // Spawn a compact, highly optimized burst
        for (let i = 0; i < 12; i++) {
            particles.push(new Particle(startX, startY, particleColor));
        }
    }

    // Animation Loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw soft base gradient
        const bgGrad = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, 10, canvasWidth / 2, canvasHeight / 2, canvasWidth);
        bgGrad.addColorStop(0, "#060710");
        bgGrad.addColorStop(1, "#020204");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Update and draw floating particles (strict capacity slice for smooth FPS)
        particles = particles.filter(p => p.alpha > 0);
        if (particles.length > 100) {
            particles = particles.slice(-100);
        }

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        ctx.globalAlpha = 1.0; // Reset global alpha

        // AAA Cursor Halo trail rendering on Background canvas (No expensive shadow blur)
        if (mouseX >= 0 && mouseY >= 0) {
            ctx.save();
            ctx.lineWidth = 1.5;
            
            // Outer cyan circle
            ctx.strokeStyle = "#00f0ff";
            ctx.globalAlpha = 0.06;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 32, 0, Math.PI * 2);
            ctx.stroke();

            // Inner magenta circle
            ctx.strokeStyle = "#ff007f";
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 16, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // AAA Equalizer Visualizer Bars animation
        const visBars = document.querySelectorAll(".vis-bar");
        if (visBars.length > 0) {
            const time = Date.now() * 0.003;
            for (let i = 0; i < 10; i++) {
                if (activeLanesState[i]) {
                    // Dynamic explosive keystroke bounce
                    visHeights[i] = Math.random() * 25 + 75;
                } else {
                    // Organic breathing ambient wave + decay filter
                    const ambient = Math.sin(time + i * 0.7) * 8 + 12;
                    visHeights[i] = Math.max(ambient, visHeights[i] - 5);
                }
                visBars[i].style.height = `${visHeights[i]}%`;
            }
        }

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
    // 6. DYNAMIC SUPABASE LEADERBOARD SYSTEM (AAA Polish)
    // ---------------------------------------------------------
    const usersListContainer = document.getElementById("users-list-container");
    const userSearchInput = document.getElementById("user-search");
    const forceRefreshBtn = document.getElementById("force-refresh-btn");
    const categoryTabs = document.querySelectorAll(".cat-tab");
    const syncIcon = document.getElementById("sync-icon");
    const syncText = document.getElementById("sync-text");

    const supabaseUrl = "https://khkhsxmfdplvvajolqyg.supabase.co";
    // Legacy anon key works perfectly for public REST SELECT calls
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoa2hzeG1mZHBsdnZham9scXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjA4MjEsImV4cCI6MjA5NDQ5NjgyMX0.-eo-E06FwWYiJr5n_U7ARmYSxKnLuBAB7TsVsWAH7_U";

    let playersData = [];
    let currentCategory = "pid";
    let filterQuery = "";

    function getSyncTimeString() {
        const d = new Date();
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, "0");
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    function formatNumber(num) {
        return num.toLocaleString();
    }

    function formatDate(unixSecs) {
        if (!unixSecs) return "N/A";
        const d = new Date(unixSecs * 1000);
        return d.toISOString().split("T")[0];
    }

    function renderLeaderboardData() {
        if (!usersListContainer) return;
        usersListContainer.innerHTML = "";

        // Clone and filter
        let filtered = playersData.filter(p => {
            const name = (p.display_name || "Player").toLowerCase();
            const rank = (p.rank || "Player").toLowerCase();
            const query = filterQuery.toLowerCase();
            return name.includes(query) || rank.includes(query);
        });

        // Sort by selected category
        filtered.sort((a, b) => {
            if (currentCategory === "joined_at" || currentCategory === "pid") {
                // Ascending for PID or joined date (lowest PID/registration order and oldest pioneers first!)
                return (a[currentCategory] || 0) - (b[currentCategory] || 0);
            } else {
                // Descending for numerical progression metrics
                return (b[currentCategory] || 0) - (a[currentCategory] || 0);
            }
        });

        if (filtered.length === 0) {
            usersListContainer.innerHTML = `
                <div class="leaderboard-loading">
                    <p style="color: var(--text-muted);">NO PLAYERS FOUND MATCHING "${filterQuery.toUpperCase()}".</p>
                </div>
            `;
            return;
        }

        filtered.forEach((player, index) => {
            const rankNum = index + 1;
            let rowClass = "player-row";
            if (rankNum === 1) rowClass += " rank-1";
            else if (rankNum === 2) rowClass += " rank-2";
            else if (rankNum === 3) rowClass += " rank-3";

            // Medal indicator or absolute number
            let rankDisplay = `#${rankNum}`;
            if (rankNum === 1) rankDisplay = "🥇";
            else if (rankNum === 2) rankDisplay = "🥈";
            else if (rankNum === 3) rankDisplay = "🥉";

            const name = player.display_name || "Guest Player";
            const customAvatar = `https://khkhsxmfdplvvajolqyg.supabase.co/storage/v1/object/public/avatars/${player.id}.png?t=${player.last_updated || 0}`;
            let fallbackAvatar = player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
            if (fallbackAvatar.includes("/storage/v1/object/public/avatars/")) {
                fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`;
            }
            const pid = player.pid ? `PID #${player.pid.toString().padStart(4, "0")}` : "PID #9999";
            
            // Highlight active column in view
            const xpVal = `<span class="stat-xp-val ${currentCategory === 'xp' ? 'text-cyan' : ''}">${formatNumber(player.xp || 0)} XP</span>`;
            const starsVal = `<span class="stat-stars-val ${currentCategory === 'stars' ? 'text-yellow' : ''}">★ ${formatNumber(player.stars || 0)}</span>`;
            const coinsVal = `<span class="stat-coins-val ${currentCategory === 'currency' ? 'text-green' : ''}">$ ${formatNumber(player.currency || 0)}</span>`;
            const levelsVal = `<span class="stat-levels-val ${currentCategory === 'levels_completed' ? 'text-magenta' : ''}">${formatNumber(player.levels_completed || 0)}</span>`;
            
            const tierBadge = `<span class="tier-badge ${player.rank.toLowerCase()}">${player.rank}</span>`;
            const joinedDate = formatDate(player.joined_at);
 
            const rowHTML = `
                <div class="${rowClass}">
                    <div class="col-rank">${rankDisplay}</div>
                    <div class="col-player">
                        <div class="player-avatar">
                            <img src="${customAvatar}" alt="${name}" onerror="if(this.src!=='${fallbackAvatar}'){this.src='${fallbackAvatar}';}else{this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${name}';}">
                        </div>
                        <div class="player-name-wrapper">
                            <span class="player-name">${name}</span>
                            <span class="player-pid">${pid}</span>
                        </div>
                    </div>
                    <div class="col-tier">${tierBadge}</div>
                    <div class="col-xp">${xpVal}</div>
                    <div class="col-stars">${starsVal}</div>
                    <div class="col-coins">${coinsVal}</div>
                    <div class="col-levels">${levelsVal}</div>
                    <div class="col-joined">${joinedDate}</div>
                </div>
            `;
            usersListContainer.insertAdjacentHTML("beforeend", rowHTML);
        });
    }

    async function loadLeaderboardEngine(forceRefresh = false) {
        if (!usersListContainer) return;

        if (syncIcon && syncText) {
            syncIcon.textContent = "📡";
            syncIcon.style.animation = "spin 1.5s linear infinite";
            syncText.textContent = "Checking live sync updates...";
        }

        let cachedPlayers = localStorage.getItem("leaderboard_cached_players");
        // Auto-bust old cache structure if pid is missing to ensure smooth migration
        if (cachedPlayers) {
            try {
                const parsed = JSON.parse(cachedPlayers);
                if (parsed.length > 0 && parsed[0].pid === undefined) {
                    cachedPlayers = null;
                    localStorage.removeItem("leaderboard_cached_players");
                }
            } catch (e) {
                cachedPlayers = null;
            }
        }
        const cachedTimestamp = localStorage.getItem("leaderboard_cached_timestamp");
        const cachedSyncDate = localStorage.getItem("leaderboard_cached_sync_date");

        try {
            // Step 1: Lightweight fetch checking the latest max timestamp
            const timeCheckUrl = `${supabaseUrl}/rest/v1/player_stats?select=last_updated&order=last_updated.desc&limit=1`;
            const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

            const checkResponse = await fetch(timeCheckUrl, { headers });
            if (!checkResponse.ok) throw new Error("Lightweight sync check failed");

            const checkResult = await checkResponse.json();
            const latestDbTimestamp = checkResult.length > 0 ? checkResult[0].last_updated.toString() : "0";

            // Step 2: Compare cached timestamp.
            // If they match AND we are NOT forcing a reload, return cached data!
            if (!forceRefresh && cachedPlayers && cachedTimestamp === latestDbTimestamp) {
                playersData = JSON.parse(cachedPlayers);
                
                if (syncIcon && syncText) {
                    syncIcon.textContent = "⚡";
                    syncIcon.style.animation = "none";
                    syncText.textContent = `Cached (Synced: ${cachedSyncDate || "Today"})`;
                }
                renderLeaderboardData();
                return;
            }

            // Step 3: Drift / Cache-Miss Case: Perform a full data fetch
            if (syncText) syncText.textContent = "Pulling real-time updates...";

            const fullDataUrl = `${supabaseUrl}/rest/v1/player_stats?select=id,xp,currency,stars,levels_completed,rank,joined_at,display_name,avatar_url,pid,last_updated`;
            const fullResponse = await fetch(fullDataUrl, { headers });
            if (!fullResponse.ok) throw new Error("Leaderboard full pull failed");

            const fullResult = await fullResponse.json();
            playersData = fullResult;

            // Cache data in localStorage
            const nowTimeStr = getSyncTimeString();
            localStorage.setItem("leaderboard_cached_players", JSON.stringify(playersData));
            localStorage.setItem("leaderboard_cached_timestamp", latestDbTimestamp);
            localStorage.setItem("leaderboard_cached_sync_date", nowTimeStr);

            if (syncIcon && syncText) {
                syncIcon.textContent = "✅";
                syncIcon.style.animation = "none";
                syncText.textContent = `Live Synced (${nowTimeStr})`;
            }

            renderLeaderboardData();

        } catch (error) {
            console.error("Leaderboard Sync Failure:", error);
            
            // Fallback: If network is offline but cache exists, load it
            if (cachedPlayers) {
                playersData = JSON.parse(cachedPlayers);
                if (syncIcon && syncText) {
                    syncIcon.textContent = "⚠️";
                    syncIcon.style.animation = "none";
                    syncText.textContent = `Offline (Loaded: ${cachedSyncDate || "Cache"})`;
                }
                renderLeaderboardData();
            } else {
                // Fatal fallback: render error view
                if (syncIcon && syncText) {
                    syncIcon.textContent = "❌";
                    syncIcon.style.animation = "none";
                    syncText.textContent = "Offline / Connection Error";
                }
                usersListContainer.innerHTML = `
                    <div class="leaderboard-loading">
                        <p style="color: var(--neon-magenta);">CRITICAL DATABASE CONNECTION ERROR</p>
                        <p style="font-size:0.85rem; color: rgba(255,255,255,0.4);">Check your local network firewall or internet connection.</p>
                        <button id="retry-btn" class="btn-primary small-btn" style="margin-top: 10px;">RETRY CONNECTION</button>
                    </div>
                `;
                const retryBtn = document.getElementById("retry-btn");
                if (retryBtn) {
                    retryBtn.addEventListener("click", () => loadLeaderboardEngine(true));
                }
            }
        }
    }

    // Connect control triggers
    if (userSearchInput) {
        userSearchInput.addEventListener("input", (e) => {
            filterQuery = e.target.value;
            renderLeaderboardData();
        });
    }

    if (forceRefreshBtn) {
        forceRefreshBtn.addEventListener("click", () => {
            loadLeaderboardEngine(true);
        });
    }

    categoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            categoryTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentCategory = tab.getAttribute("data-category");
            renderLeaderboardData();
        });
    });

    // Start execution
    loadLeaderboardEngine();
});
