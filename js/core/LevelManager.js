class LevelManager {
    constructor(engine, builder) {
        this.engine = engine;
        this.builder = builder;
        this.state = 'SIMULATE'; // Always start in SIMULATE mode
        this.budget = 1000;
        this.isIncreasingWeight = false;

        this.vehicle = null;
        this.simulationFrames = 0;
        this.stableFrames = 0;

        // Default simulation settings
        this.settings = {
            gravity: 10.0,
            velX: 0.0,
            velY: 0.0
        };
    }

    initLevel() {
        this.engine.clear();
        this.builder.anchors = [];
        this.budget = 1000;

        // Add static anchors on the same Y-level (asymmetrical horizontal spacing)
        const anchor1 = new WorldAnchor(150, 350);
        const anchor2 = new WorldAnchor(700, 350);
        this.addAnchor(anchor1);
        this.addAnchor(anchor2);

        // Pre-place rope between the two anchors
        const settings = this.builder.getSandboxSettings();
        const totalDist = anchor1.position.distanceTo(anchor2.position);
        const numSegments = Math.max(1, Math.floor(totalDist / settings.segmentLength));
        this.builder.buildRope(anchor1, anchor2, null, numSegments, settings);

        this.updateHUD();
        this.startSimulation();
    }

    addAnchor(a) {
        this.builder.anchors.push(a);
        this.engine.addNode(a.node);
    }

    requestBuild(cost) {
        if (this.state !== 'BUILD') return false;
        if (this.budget >= cost) {
            this.budget -= cost;
            this.updateHUD();
            return true;
        }
        return false;
    }

    startSimulation() {
        this.state = 'SIMULATE';
        this.simulationFrames = 0;
        this.stableFrames = 0;

        // Spawn vehicle at horizontal center
        const canvasEl = document.getElementById('game-canvas');
        const startX = canvasEl.width / 2;
        this.vehicle = new VerletNode(startX, 50);
        this.vehicle.mass = 50.0;
        this.vehicle.radius = 22; // Hardcoded radius for standard 50 mass

        // Initial velocity explicit control
        this.vehicle.oldPosition.x = this.vehicle.position.x - (this.settings.velX * 0.016);
        this.vehicle.oldPosition.y = this.vehicle.position.y - (this.settings.velY * 0.016);

        this.engine.addNode(this.vehicle);

        // Update engine gravity (scaled for realistic feel)
        this.engine.gravity.y = this.settings.gravity * 25.0;

        this.updateModeText();
    }

    reset() {
        this.state = 'SIMULATE';
        this.initLevel(); // Resets anchors and pre-places the rope
        const overlay = document.getElementById('message-overlay');
        if (overlay) overlay.classList.add('hidden');
        this.updateModeText();
    }

    update() {
        if (this.state === 'SIMULATE') {
            this.simulationFrames++;

            // Gradually increase weight of the ball when button is held
            if (this.isIncreasingWeight && this.vehicle) {
                this.vehicle.mass += 0.5;
            }

            this.engine.update(this.vehicle);
            this.checkConditions();

            // Update live displays
            if (this.vehicle) {
                const speed = this.vehicle.position.distanceTo(this.vehicle.oldPosition) / 0.016;
                const speedEl = document.getElementById('live-velocity');
                if (speedEl) speedEl.innerText = speed.toFixed(2);

                const massEl = document.getElementById('live-mass');
                if (massEl) massEl.innerText = this.vehicle.mass.toFixed(1);
            }
        }
    }

    checkConditions() {
        if (!this.vehicle) return;

        // Loss: Check if vehicle edge falls into ground
        if (this.vehicle.position.y + this.vehicle.radius >= 595) {
            this.triggerFailure();
        }

        // Win: Check for sustained stability after initial drop
        if (this.simulationFrames > 120) { // Wait ~2 seconds before checking
            let speed = this.vehicle.position.distanceTo(this.vehicle.oldPosition) / 0.016; // proper velocity magnitude

            // If the vehicle is practically motionless
            if (speed < 15.0) { // Slackened velocity threshold (Verlet px/sec)
                this.stableFrames++;
            } else {
                this.stableFrames = 0; // Reset if it bounces or swings
            }

            // Require 1 full second (60 frames) of unbroken stillness
            if (this.stableFrames > 60) {
                this.triggerSuccess();
            }
        }
    }

    triggerFailure() {
        this.state = 'RESULT';
        // Auto-reset after 2 seconds on failure
        setTimeout(() => {
            if (this.state === 'RESULT') {
                this.reset();
            }
        }, 2000);
    }

    triggerSuccess() {
        this.state = 'RESULT';
        let overlay = document.getElementById('message-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            document.getElementById('overlay-title').innerText = "Success!";
            document.getElementById('overlay-title').style.color = "#64ffda";
            document.getElementById('overlay-text').innerText = "Structure held successfully!";
        }

        // Auto-reset after 2 seconds
        setTimeout(() => {
            if (this.state === 'RESULT') {
                this.reset();
            }
        }, 2000);
    }

    updateHUD() {
        const budgetEl = document.getElementById('budget-text');
        if (budgetEl) {
            budgetEl.innerText = this.budget;
        }
    }

    updateModeText() {
        const modeEl = document.getElementById('mode-text');
        if (modeEl) {
            modeEl.innerText = this.state;
        }
    }

    draw(ctx) {
        // Draw Anchors
        for (let a of this.builder.anchors) {
            a.draw(ctx);
        }

        // Draw Ground Line
        ctx.beginPath();
        ctx.moveTo(0, 595);
        ctx.lineTo(800, 595);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Vehicle
        if (this.vehicle) {
            ctx.beginPath();
            ctx.arc(this.vehicle.position.x, this.vehicle.position.y, this.vehicle.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3366';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
