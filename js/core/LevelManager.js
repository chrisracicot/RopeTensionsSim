class LevelManager {
    constructor(engine, builder) {
        this.engine = engine;
        this.builder = builder;
        this.state = 'BUILD'; // BUILD, SIMULATE, RESULT
        this.budget = 1000;

        // Example Level 1 Data
        this.vehicle = null;
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

        // Add static anchors
        this.addAnchor(new WorldAnchor(100, 400));
        this.addAnchor(new WorldAnchor(200, 450));

        this.addAnchor(new WorldAnchor(600, 450));
        this.addAnchor(new WorldAnchor(800, 400));

        this.updateHUD();
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
        if (this.state === 'SIMULATE') return;
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

        document.getElementById('mode-text').innerText = this.state;
    }

    reset() {
        this.state = 'BUILD';
        this.initLevel(); // Crude reset, drops player built lines
        document.getElementById('message-overlay').classList.add('hidden');
        document.getElementById('mode-text').innerText = this.state;
    }

    update() {
        if (this.state === 'SIMULATE') {
            this.simulationFrames++;
            this.engine.update(this.vehicle);
            this.checkConditions();

            // Update live velocity display
            if (this.vehicle) {
                const speed = this.vehicle.position.distanceTo(this.vehicle.oldPosition) / 0.016;
                document.getElementById('live-velocity').innerText = speed.toFixed(2);
            }

            // Automatic locomotive forces removed (now strictly vertical gravity)
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
        // Removed failure popup notice as requested
    }

    triggerSuccess() {
        this.state = 'RESULT';
        let overlay = document.getElementById('message-overlay');
        overlay.classList.remove('hidden');
        document.getElementById('overlay-title').innerText = "Success!";
        document.getElementById('overlay-title').style.color = "#64ffda";
        document.getElementById('overlay-text').innerText = "Structure held successfully!";

        // Auto-reset after 2 seconds
        setTimeout(() => {
            if (this.state === 'RESULT') {
                this.reset();
            }
        }, 2000);
    }

    updateHUD() {
        document.getElementById('budget-text').innerText = this.budget;
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

        // Draw Target Zone Removed

        // Draw Ghost Preview of Ball Start Position
        if (this.state === 'BUILD') {
            const previewRadius = 22;
            const previewX = ctx.canvas.width / 2;
            ctx.beginPath();
            ctx.arc(previewX, 50, previewRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 51, 102, 0.3)'; // Faint red
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 51, 102, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

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
