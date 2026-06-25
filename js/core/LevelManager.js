import WorldAnchor from './WorldAnchor.js';
import VerletNode from '../physics/VerletNode.js';

export default class LevelManager {
    constructor(engine, builder) {
        this.engine = engine;
        this.builder = builder;
        this.state = 'STOPPED'; // Start in STOPPED mode
        this.budget = 1000;
        this.endlessMode = true;

        this.vehicle = null;
        this.simulationFrames = 0;
        this.stableFrames = 0;
        this.ballDropped = false;

        // Side-scroller game mode variables
        this.isGameMode = false;
        this.scrollSpeed = 1.0;
        this.distanceScrolledSinceLastSpawn = 0;
        this.nextSpawnDistance = 0;

        // Default simulation settings
        this.settings = {
            gravity: 10.0,
            ballGravity: 10.0,
            velX: 0.0,
            velY: 0.0,
            ballMass: 50.0,
            drag: 0.008
        };
    }

    initLevel() {
        this.engine.clear();
        this.builder.anchors = [];
        this.budget = 1000;
        this.ballDropped = false;
        this.distanceScrolledSinceLastSpawn = 0;
        this.nextSpawnDistance = 0;

        // Add static anchors on the Y-level
        const anchor1 = new WorldAnchor(150, 350);
        const anchor2 = new WorldAnchor(700, 350);
        this.addAnchor(anchor1);
        this.addAnchor(anchor2);

        // Pre-place rope between the two anchors
        const settings = this.builder.getSandboxSettings();
        const totalDist = anchor1.position.distanceTo(anchor2.position);
        const numSegments = Math.max(1, Math.floor(totalDist / settings.segmentLength));
        this.builder.buildRope(anchor1, anchor2, null, numSegments, settings);

        // Spawn vehicle at horizontal center
        const canvasEl = document.getElementById('game-canvas');
        const startX = canvasEl ? canvasEl.width / 2 : 400;
        this.vehicle = new VerletNode(startX, 50);
        this.vehicle.mass = this.settings.ballMass;
        this.vehicle.radius = 22; // Hardcoded radius for standard 50 mass

        // Initial velocity explicit control
        this.vehicle.oldPosition.x = this.vehicle.position.x - (this.settings.velX * 0.016);
        this.vehicle.oldPosition.y = this.vehicle.position.y - (this.settings.velY * 0.016);

        this.engine.addNode(this.vehicle);

        // Update engine gravity (scaled for realistic feel)
        this.engine.gravity.x = 0;
        this.engine.gravity.y = this.settings.gravity * 25.0;
        this.engine.gravityAttractorPoint = null;
        this.engine.ballGravity.x = 0;
        this.engine.ballGravity.y = this.settings.ballGravity * 25.0;
        this.engine.drag = 1.0 - this.settings.drag;

        this.simulationFrames = 0;
        this.stableFrames = 0;

        this.updateHUD();
        this.updateModeText();
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

    start() {
        if (this.state === 'SIMULATE') return;
        this.state = 'SIMULATE';

        const overlay = document.getElementById('message-overlay');
        if (overlay) overlay.classList.add('hidden');

        this.updateModeText();
        if (typeof this.updateUIElements === 'function') {
            this.updateUIElements();
        }
    }

    dropBall() {
        if (this.vehicle) {
            const idx = this.engine.nodes.indexOf(this.vehicle);
            if (idx !== -1) {
                this.engine.nodes.splice(idx, 1);
            }
        }

        const canvasEl = document.getElementById('game-canvas');
        const startX = canvasEl ? canvasEl.width / 2 : 400;
        this.vehicle = new VerletNode(startX, 50);
        this.vehicle.mass = this.settings.ballMass;
        this.vehicle.radius = 22;

        this.vehicle.oldPosition.x = this.vehicle.position.x - (this.settings.velX * 0.016);
        this.vehicle.oldPosition.y = this.vehicle.position.y - (this.settings.velY * 0.016);

        this.engine.addNode(this.vehicle);
        this.ballDropped = true;

        if (this.state !== 'SIMULATE') {
            this.state = 'SIMULATE';
            const overlay = document.getElementById('message-overlay');
            if (overlay) overlay.classList.add('hidden');
            this.updateModeText();
        }

        if (typeof this.updateUIElements === 'function') {
            this.updateUIElements();
        }
    }

    stop() {
        this.reset();
    }

    reset() {
        this.state = 'STOPPED';
        this.isGameMode = false;
        this.initLevel();
        const overlay = document.getElementById('message-overlay');
        if (overlay) overlay.classList.add('hidden');

        this.updateModeText();
        if (typeof this.updateUIElements === 'function') {
            this.updateUIElements();
        }
    }

    toggleGameMode() {
        if (this.state !== 'SIMULATE') return;
        this.isGameMode = !this.isGameMode;
        if (this.isGameMode) {
            if (this.nextSpawnDistance === 0) {
                this.distanceScrolledSinceLastSpawn = 0;
                this.nextSpawnDistance = 150;
            }
        }
        if (typeof this.updateUIElements === 'function') {
            this.updateUIElements();
        }
    }

    spawnPlatform() {
        const canvasEl = document.getElementById('game-canvas');
        const width = canvasEl ? canvasEl.width : 800;

        const spawnX = width + 600;
        const spawnY = 200 + Math.random() * 300;
        const platformWidth = 150 + Math.random() * 250;

        const anchor1 = new WorldAnchor(spawnX, spawnY);
        const anchor2 = new WorldAnchor(spawnX + platformWidth, spawnY);

        this.addAnchor(anchor1);
        this.addAnchor(anchor2);

        const settings = this.builder.getSandboxSettings();
        const numSegments = Math.max(1, Math.floor(platformWidth / settings.segmentLength));

        this.builder.buildRope(anchor1, anchor2, null, numSegments, settings);
    }

    update() {
        if (this.state === 'SIMULATE') {
            this.simulationFrames++;

            if (!this.ballDropped && this.vehicle) {
                const canvasEl = document.getElementById('game-canvas');
                const startX = canvasEl ? canvasEl.width / 2 : 400;
                this.vehicle.position.x = startX;
                this.vehicle.position.y = 50;
                this.vehicle.oldPosition.x = startX;
                this.vehicle.oldPosition.y = 50;
            }

            this.engine.update(this.vehicle);

            if (this.isGameMode) {
                // Scroll all anchors
                for (let a of this.builder.anchors) {
                    a.position.x -= this.scrollSpeed;
                    a.node.position.x -= this.scrollSpeed;
                    a.node.oldPosition.x -= this.scrollSpeed;
                }

                // Scroll all rope nodes
                for (let n of this.engine.nodes) {
                    if (!n.isPinned && n !== this.vehicle) {
                        n.position.x -= this.scrollSpeed;
                        n.oldPosition.x -= this.scrollSpeed;
                    }
                }

                // Spawning
                this.distanceScrolledSinceLastSpawn += this.scrollSpeed;
                if (this.distanceScrolledSinceLastSpawn >= this.nextSpawnDistance) {
                    this.spawnPlatform();
                    this.distanceScrolledSinceLastSpawn = 0;
                    this.nextSpawnDistance = 250 + Math.random() * 350;
                }

                // Despawning Cleanup
                this.cleanupOffscreenPlatforms();
            }

            this.checkConditions();
        }

        // Live displays
        if (this.vehicle) {
            const speed = this.vehicle.position.distanceTo(this.vehicle.oldPosition) / 0.016;
            const speedEl = document.getElementById('live-velocity');
            if (speedEl) speedEl.innerText = speed.toFixed(2);

            const massEl = document.getElementById('live-mass');
            if (massEl) massEl.innerText = this.vehicle.mass.toFixed(1);
        }
    }

    cleanupOffscreenPlatforms() {
        let despawnThreshold = -500;
        let activeAnchors = [];
        let anchorsToRemove = new Set();

        for (let a of this.builder.anchors) {
            if (a.position.x < despawnThreshold) {
                anchorsToRemove.add(a.node);
            } else {
                activeAnchors.push(a);
            }
        }

        if (anchorsToRemove.size === 0) return;
        this.builder.anchors = activeAnchors;

        let nodesToKeep = [];
        let constraintsToKeep = [];

        for (let n of this.engine.nodes) {
            if (n === this.vehicle) {
                nodesToKeep.push(n);
                continue;
            }
            if (n.position.x < despawnThreshold + 100) {
                // Remove
            } else {
                nodesToKeep.push(n);
            }
        }

        let validNodesSet = new Set(nodesToKeep);

        for (let c of this.engine.constraints) {
            if (validNodesSet.has(c.nodeA) && validNodesSet.has(c.nodeB)) {
                constraintsToKeep.push(c);
            }
        }

        this.engine.nodes = nodesToKeep;
        this.engine.constraints = constraintsToKeep;
    }

    checkConditions() {
        if (this.endlessMode) return;
        if (!this.vehicle) return;

        if (this.vehicle.position.y + this.vehicle.radius >= 595) {
            this.triggerFailure();
        }

        if (this.simulationFrames > 120) {
            let speed = this.vehicle.position.distanceTo(this.vehicle.oldPosition) / 0.016;

            if (speed < 15.0) {
                this.stableFrames++;
            } else {
                this.stableFrames = 0;
            }

            if (this.stableFrames > 60) {
                this.triggerSuccess();
            }
        }
    }

    triggerFailure() {
        this.state = 'RESULT';
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
}
