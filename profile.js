// Supabase configuration
const supabaseUrl = "https://khkhsxmfdplvvajolqyg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoa2hzeG1mZHBsdnZham9scXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjA4MjEsImV4cCI6MjA5NDQ5NjgyMX0.-eo-E06FwWYiJr5n_U7ARmYSxKnLuBAB7TsVsWAH7_U";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
    const authView = document.getElementById("auth-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    // Tab Elements
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    // Forms & Inputs
    const updateProfileForm = document.getElementById("update-profile-form");
    const changePasswordForm = document.getElementById("change-password-form");
    const updateDisplayNameInput = document.getElementById("update-display-name");
    const changePasswordInput = document.getElementById("change-password");
    const confirmChangePasswordInput = document.getElementById("confirm-change-password");
    const avatarFileInput = document.getElementById("avatar-file-input");
    const avatarOverlay = document.querySelector(".avatar-upload-overlay");

    // Status Elements
    const containerAlerts = document.getElementById("alert-banner-container");
    const userAvatar = document.getElementById("user-avatar");
    const userDisplayName = document.getElementById("user-display-name");
    const userPid = document.getElementById("user-pid");
    const userStatus = document.getElementById("user-status");
    const userJoined = document.getElementById("user-joined");
    const userTierBadges = document.getElementById("user-tier-badges");

    // Progression Stats Elements
    const statXp = document.getElementById("stat-xp");
    const statStars = document.getElementById("stat-stars");
    const statCoins = document.getElementById("stat-coins");
    const statLevels = document.getElementById("stat-levels");

    // Helper to raise elegant, glassmorphic toast notices
    function showNotice(message, type = "success") {
        const notice = document.createElement("div");
        notice.className = `alert-notice glass-card ${type === "success" ? "glow-cyan" : "glow-magenta"}`;
        notice.style.cssText = "margin-bottom: 20px; padding: 15px 24px; border-radius: 12px; font-weight: 600; animation: alert-flicker 0.4s ease-out;";
        
        const icon = type === "success" ? "⚡" : "⚠️";
        const color = type === "success" ? "var(--neon-cyan)" : "var(--neon-magenta)";
        
        notice.innerHTML = `<span style="color: ${color}; margin-right: 10px;">${icon}</span> ${message.toUpperCase()}`;
        containerAlerts.innerHTML = "";
        containerAlerts.appendChild(notice);

        // Auto-clear
        setTimeout(() => {
            notice.style.opacity = "0";
            notice.style.transform = "translateY(-10px)";
            notice.style.transition = "all 0.5s ease";
            setTimeout(() => notice.remove(), 500);
        }, 5000);
    }

    // Tabs toggling
    if (tabLogin && tabRegister) {
        tabLogin.addEventListener("click", () => {
            tabLogin.classList.add("active");
            tabRegister.classList.remove("active");
            loginForm.classList.add("active");
            registerForm.classList.remove("active");
        });

        tabRegister.addEventListener("click", () => {
            tabRegister.classList.add("active");
            tabLogin.classList.remove("active");
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
        });
    }

    // Sync navigation highlight
    const path = window.location.pathname;
    const page = path.split("/").pop();
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.getAttribute("href") === page) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // check session and retrieve state
    let sessionUser = null;
    async function checkAuthSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && session.user) {
            sessionUser = session.user;
            authView.style.display = "none";
            dashboardView.style.display = "grid";
            await loadPlayerDashboard(session.user);
        } else {
            sessionUser = null;
            authView.style.display = "block";
            dashboardView.style.display = "none";
        }
    }

    // Load all stats and details from public.player_stats
    async function loadPlayerDashboard(user) {
        const { data, error } = await supabase
            .from("player_stats")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error || !data) {
            // Entry doesn't exist yet, let's create a placeholder row
            const newStats = {
                id: user.id,
                xp: 0,
                currency: 0,
                stars: 0,
                levels_completed: 0,
                rank: ["Player"],
                display_name: user.user_metadata.display_name || user.email.split("@")[0],
                joined_at: Math.floor(Date.now() / 1000),
                last_updated: Math.floor(Date.now() / 1000)
            };
            const { data: insertData, error: insertError } = await supabase
                .from("player_stats")
                .insert([newStats])
                .select()
                .single();

            if (!insertError && insertData) {
                populateDashboard(insertData);
            } else {
                console.error("Dashboard record auto-generation failed:", insertError);
            }
        } else {
            populateDashboard(data);
        }
    }

    function populateDashboard(player) {
        userDisplayName.textContent = player.display_name || "Guest Player";
        updateDisplayNameInput.value = player.display_name || "";
        userPid.textContent = player.pid ? `PID #${player.pid.toString().padStart(4, "0")}` : "PID #9999";
        userStatus.textContent = player.status || "Innocent";
        
        // Joined Date conversion
        if (player.joined_at) {
            const d = new Date(player.joined_at * 1000);
            userJoined.textContent = d.toISOString().split("T")[0];
        } else {
            userJoined.textContent = "N/A";
        }

        // Render dynamic badges
        userTierBadges.innerHTML = "";
        const ranks = Array.isArray(player.rank) ? player.rank : [player.rank || "Player"];
        ranks.forEach(r => {
            const cleanRank = String(r || "Player").trim();
            const badge = document.createElement("span");
            badge.className = `tier-badge ${cleanRank.toLowerCase()}`;
            badge.textContent = cleanRank;
            userTierBadges.appendChild(badge);
        });

        // Set numbers
        statXp.textContent = `${(player.xp || 0).toLocaleString()} XP`;
        statStars.textContent = `★ ${(player.stars || 0).toLocaleString()}`;
        statCoins.textContent = `$ ${(player.currency || 0).toLocaleString()}`;
        statLevels.textContent = (player.levels_completed || 0).toLocaleString();

        // Setup Avatars with solid cache busting parameter
        const customAvatarUrl = `https://khkhsxmfdplvvajolqyg.supabase.co/storage/v1/object/public/avatars/${player.id}.png?t=${player.last_updated || 0}`;
        let fallbackAvatar = player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.display_name}`;
        if (fallbackAvatar.includes("/storage/v1/object/public/avatars/")) {
            fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${player.display_name}`;
        }

        userAvatar.src = customAvatarUrl;
        userAvatar.onerror = () => {
            userAvatar.src = fallbackAvatar;
        };

        // Store cached details in localStorage for global navigation bar accessibility
        localStorage.setItem("user_avatar_cached", customAvatarUrl);
        localStorage.setItem("user_fallback_avatar_cached", fallbackAvatar);
        
        // Update navigation circle image instantly if available on current page
        const navAvatar = document.getElementById("nav-profile-avatar");
        if (navAvatar) {
            navAvatar.src = customAvatarUrl;
            navAvatar.onerror = () => {
                navAvatar.src = fallbackAvatar;
            };
        }
    }

    // Register handler
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const displayName = document.getElementById("reg-name").value.trim();
            const email = document.getElementById("reg-email").value.trim();
            const password = document.getElementById("reg-password").value;

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName
                    }
                }
            });

            if (authError) {
                showNotice(authError.message, "error");
                return;
            }

            if (authData.user) {
                // Creating matching public profile record immediately
                const { error: profileError } = await supabase
                    .from("player_stats")
                    .insert([
                        {
                            id: authData.user.id,
                            xp: 0,
                            currency: 0,
                            stars: 0,
                            levels_completed: 0,
                            rank: ["Player"],
                            display_name: displayName,
                            joined_at: Math.floor(Date.now() / 1000),
                            last_updated: Math.floor(Date.now() / 1000)
                        }
                    ]);

                showNotice("Account successfully created! Welcome to the symphony.");
                await checkAuthSession();
            }
        });
    }

    // Login handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                showNotice(error.message, "error");
                return;
            }

            showNotice("Successfully logged in!");
            await checkAuthSession();
        });
    }

    // Profile Edit Update handler
    if (updateProfileForm) {
        updateProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!sessionUser) return;

            const nextName = updateDisplayNameInput.value.trim();
            const { error } = await supabase
                .from("player_stats")
                .update({
                    display_name: nextName,
                    last_updated: Math.floor(Date.now() / 1000)
                })
                .eq("id", sessionUser.id);

            if (error) {
                showNotice(error.message, "error");
            } else {
                showNotice("Display name successfully saved!");
                await loadPlayerDashboard(sessionUser);
            }
        });
    }

    // Security Password Updates
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pass = changePasswordInput.value;
            const confirmPass = confirmChangePasswordInput.value;

            if (pass !== confirmPass) {
                showNotice("Passwords do not match!", "error");
                return;
            }

            const { error } = await supabase.auth.updateUser({
                password: pass
            });

            if (error) {
                showNotice(error.message, "error");
            } else {
                showNotice("Security password updated successfully!");
                changePasswordForm.reset();
            }
        });
    }

    // Logout handler
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                showNotice(error.message, "error");
            } else {
                // Clear cached variables
                localStorage.removeItem("user_avatar_cached");
                localStorage.removeItem("user_fallback_avatar_cached");
                
                showNotice("Logged out cleanly. Returning home...");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1200);
            }
        });
    }

    // Interactive Avatar Trigger
    if (avatarOverlay) {
        avatarOverlay.addEventListener("click", () => {
            avatarFileInput.click();
        });
    }

    if (avatarFileInput) {
        avatarFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file || !sessionUser) return;

            if (file.type !== "image/png") {
                showNotice("Enforced rule: Avatars must be PNG format!", "error");
                return;
            }

            // Strict size guard
            if (file.size > 2 * 1024 * 1024) {
                showNotice("Avatar limit exceeded! Must be smaller than 2MB.", "error");
                return;
            }

            showNotice("Uploading new avatar...");

            const { data, error } = await supabase.storage
                .from("avatars")
                .upload(`${sessionUser.id}.png`, file, {
                    cacheControl: "0",
                    upsert: true
                });

            if (error) {
                showNotice(error.message, "error");
            } else {
                // Bump the record timestamp to bust cache in browser loader
                await supabase
                    .from("player_stats")
                    .update({
                        last_updated: Math.floor(Date.now() / 1000)
                    })
                    .eq("id", sessionUser.id);

                showNotice("Profile picture updated successfully!");
                await loadPlayerDashboard(sessionUser);
            }
        });
    }

    // Google Login handler
    const btnGoogleLogin = document.getElementById("btn-google-login");
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener("click", async () => {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.href
                }
            });
            if (error) {
                showNotice(error.message, "error");
            }
        });
    }

    // Init call
    checkAuthSession();
});
