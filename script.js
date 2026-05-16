document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('gravity-container');

    // Select elements we want to float
    // Note: We don't float the header to keep navigation usable,
    // but we float children of main.
    const elementsToFloat = Array.from(mainContainer.children);

    const physicsObjects = [];

    // Initialize elements for physics
    elementsToFloat.forEach((el, index) => {
        el.classList.add('physics-element');

        // Initial random spread around the center
        const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
        const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 400;

        const obj = {
            el: el,
            x: startX,
            y: startY,
            vx: (Math.random() - 0.5) * 2, // Initial velocity
            vy: (Math.random() - 0.5) * 2,
            width: el.offsetWidth,
            height: el.offsetHeight,
            mass: Math.random() * 0.5 + 0.5 // varied mass
        };

        // Absolutely position them
        el.style.left = '0px';
        el.style.top = '0px';

        physicsObjects.push(obj);
    });

    // Mouse interaction variables
    let mouseX = -1000;
    let mouseY = -1000;
    const repelRadius = 200;
    const repelForce = 0.5;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Dragging logic
    let draggedObj = null;

    physicsObjects.forEach(obj => {
        obj.el.addEventListener('mousedown', (e) => {
            draggedObj = obj;
            obj.vx = 0;
            obj.vy = 0;
            e.preventDefault(); // prevent text selection
        });
    });

    window.addEventListener('mouseup', () => {
        if (draggedObj) {
            // Optional: give it a little toss based on mouse movement
            draggedObj = null;
        }
    });

    // Physics Loop
    function updatePhysics() {
        physicsObjects.forEach(obj => {
            if (obj === draggedObj) {
                // If dragging, follow mouse directly
                obj.x = mouseX - obj.width / 2;
                obj.y = mouseY - obj.height / 2;
            } else {
                // Apply a very light "space" drift if velocity gets too low
                if (Math.abs(obj.vx) < 0.1) obj.vx += (Math.random() - 0.5) * 0.1;
                if (Math.abs(obj.vy) < 0.1) obj.vy += (Math.random() - 0.5) * 0.1;

                // --- Mouse Repulsion (Anti-gravity effect) ---
                const centerX = obj.x + obj.width / 2;
                const centerY = obj.y + obj.height / 2;
                const dx = centerX - mouseX;
                const dy = centerY - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < repelRadius) {
                    // Push away from mouse
                    const force = (repelRadius - distance) / repelRadius; // 0 to 1
                    const angle = Math.atan2(dy, dx);

                    obj.vx += Math.cos(angle) * force * repelForce / obj.mass;
                    obj.vy += Math.sin(angle) * force * repelForce / obj.mass;
                }

                // Apply velocity with some friction
                obj.x += obj.vx;
                obj.y += obj.vy;

                obj.vx *= 0.99; // Air resistance / friction
                obj.vy *= 0.99;

                // --- Screen Boundaries (Bouncing) ---
                // Left/Right
                if (obj.x <= 0) {
                    obj.x = 0;
                    obj.vx *= -0.8; // Bounce with some energy loss
                } else if (obj.x + obj.width >= window.innerWidth) {
                    obj.x = window.innerWidth - obj.width;
                    obj.vx *= -0.8;
                }

                // Top/Bottom
                if (obj.y <= 0) {
                    obj.y = 0;
                    obj.vy *= -0.8;
                } else if (obj.y + obj.height >= window.innerHeight) {
                    obj.y = window.innerHeight - obj.height;
                    obj.vy *= -0.8;
                }
            }

            // Update DOM element position
            obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
        });

        requestAnimationFrame(updatePhysics);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        physicsObjects.forEach(obj => {
            // Keep objects inside bounds on resize
            if (obj.x + obj.width > window.innerWidth) obj.x = window.innerWidth - obj.width;
            if (obj.y + obj.height > window.innerHeight) obj.y = window.innerHeight - obj.height;
        });
    });

    // Start loop
    updatePhysics();
});
