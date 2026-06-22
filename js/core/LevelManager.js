class LevelManager {
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
        this.draggedNode = null;
        this.mouseNode = null;
        this.mouseConstraint = null;
        this.dragSlideDirection = null;
        this.dragSlideAccumulator = 0;

        // Side-scroller game mode variables
        this.isGameMode = false;
        this.scrollSpeed = 1.0;
        this.distanceScrolledSinceLastSpawn = 0;
        this.nextSpawnDistance = 0;

        // Default simulation settings
        this.settings = {
            gravity: 10.0,
            velX: 0.0,
            velY: 0.0,
            ballMass: 50.0
        };
    }

    initLevel() {
        this.engine.clear();
        this.builder.anchors = [];
        this.budget = 1000;
        this.ballDropped = false;
        this.distanceScrolledSinceLastSpawn = 0;
        this.nextSpawnDistance = 0;

        if (this.mouseConstraint) {
            let idx = this.engine.constraints.indexOf(this.mouseConstraint);
            if (idx !== -1) {
                this.engine.constraints.splice(idx, 1);
            }
        }
        this.draggedNode = null;
        this.mouseNode = null;
        this.mouseConstraint = null;
        this.dragSlideDirection = null;
        this.dragSlideAccumulator = 0;

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
        this.engine.gravity.y = this.settings.gravity * 25.0;

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
        if (this.ballDropped) return;
        this.ballDropped = true;

        // Apply starting velocities dynamically when launched
        if (this.vehicle) {
            this.vehicle.oldPosition.x = this.vehicle.position.x - (this.settings.velX * 0.016);
            this.vehicle.oldPosition.y = this.vehicle.position.y - (this.settings.velY * 0.016);
        }

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
        this.initLevel(); // Resets anchors and pre-places the rope and vehicle
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
            // Only set nextSpawnDistance if we starting fresh
            if (this.nextSpawnDistance === 0) {
                this.distanceScrolledSinceLastSpawn = 0;
                this.nextSpawnDistance = 150; // Spawn first platform soon
            }
        }
        if (typeof this.updateUIElements === 'function') {
            this.updateUIElements();
        }
    }

    spawnPlatform() {
        const canvasEl = document.getElementById('game-canvas');
        const width = canvasEl ? canvasEl.width : 800;

        const spawnX = width + 600; // Off-screen further to the right to settle before scrolling into view
        const spawnY = 200 + Math.random() * 300; // Random height between 200 and 500
        const platformWidth = 150 + Math.random() * 250; // Random width between 150 and 400

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

            // If the ball has not been dropped yet, hold it in place
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
                    this.nextSpawnDistance = 250 + Math.random() * 350; // Keep horizontal gaps consistent (250 to 600 px)
                }

                // Despawning Cleanup
                this.cleanupOffscreenPlatforms();
            }

            this.checkConditions();
        }

        // Always update live displays when vehicle exists
        if (this.vehicle) {
            const speed = this.vehicle.position.distanceTo(this.vehicle.oldPosition) / 0.016;
            const speedEl = document.getElementById('live-velocity');
            if (speedEl) speedEl.innerText = speed.toFixed(2);

            const massEl = document.getElementById('live-mass');
            if (massEl) massEl.innerText = this.vehicle.mass.toFixed(1);
        }
    }

    cleanupOffscreenPlatforms() {
        // Find anchors far off-screen to the left
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

        // Collect all nodes and constraints connected to these anchors to remove them
        // Because ropes are chains, we find any node whose X is way off-screen.
        let nodesToKeep = [];
        let constraintsToKeep = [];

        for (let n of this.engine.nodes) {
            if (n === this.vehicle) {
                nodesToKeep.push(n);
                continue;
            }
            if (n.position.x < despawnThreshold + 100) { // Add padding so we don't cut ropes mid-screen
                // Skip it (remove)
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

    handleMouseDown(v) {
        if (this.state !== 'SIMULATE') return;

        // Prevent dragging if clicking near an anchor point
        for (let a of this.builder.anchors) {
            if (a.position.distanceTo(v) < 25) {
                return;
            }
        }

        // 1. Check for node dragging
        let nearestNode = null;
        let minDist = 30; // Drag radius threshold

        for (let n of this.engine.nodes) {
            if (n.isPinned) continue; // Cannot drag pinned nodes (anchors)
            if (n === this.vehicle && !this.ballDropped) continue; // Don't drag un-dropped vehicle

            let d = n.position.distanceTo(v);
            if (d < minDist) {
                minDist = d;
                nearestNode = n;
            }
        }

        if (nearestNode) {
            this.draggedNode = nearestNode;
            
            // Create a virtual node representing the mouse (pinned)
            this.mouseNode = new VerletNode(v.x, v.y, true);
            this.mouseNode.mass = 1.0;
            
            // Create a temporary distance constraint linking mouseNode to draggedNode
            this.mouseConstraint = new DistanceConstraint(this.mouseNode, this.draggedNode, {
                rigidity: 200,
                slackMultiplier: 1.0,
                tensionVal: 0.1,
                ropeType: 'mouse'
            });
            this.mouseConstraint.restLength = 0;

            // Add the constraint to the engine
            this.engine.addConstraint(this.mouseConstraint);

            this.dragSlideDirection = null;
            this.dragSlideAccumulator = 0;
        }
    }

    getNeighbors(node) {
        let neighbors = [];
        for (let c of this.engine.constraints) {
            if (c.isBroken) continue;
            // Only slide along actual distance constraints representing ropes
            if (!(c instanceof DistanceConstraint)) continue;
            // Never slide onto the mouse cursor
            if (c.ropeType === 'mouse') continue;

            if (c.nodeA === node) {
                neighbors.push({ node: c.nodeB, constraint: c });
            } else if (c.nodeB === node) {
                neighbors.push({ node: c.nodeA, constraint: c });
            }
        }
        return neighbors;
    }

    handleMouseMove(v) {
        if (this.draggedNode) {
            let dv = v.sub(this.mouseNode.position);
            let neighbors = this.getNeighbors(this.draggedNode);

            if (!this.dragSlideDirection) {
                // Find the neighbor with the best positive projection
                let bestProj = -Infinity;
                let bestNeighborObj = null;

                for (let nObj of neighbors) {
                    let neighbor = nObj.node;
                    let dir = neighbor.position.sub(this.draggedNode.position).normalize();
                    let proj = dv.x * dir.x + dv.y * dir.y;
                    if (proj > bestProj) {
                        bestProj = proj;
                        bestNeighborObj = nObj;
                    }
                }

                if (bestNeighborObj && bestProj > 0) {
                    this.dragSlideDirection = bestNeighborObj.node;
                    this.dragSlideAccumulator = bestProj;
                }
            } else {
                // Calculate projection along the current target direction
                let dirTarget = this.dragSlideDirection.position.sub(this.draggedNode.position).normalize();
                let projTarget = dv.x * dirTarget.x + dv.y * dirTarget.y;
                this.dragSlideAccumulator += projTarget;

                if (this.dragSlideAccumulator < 0) {
                    // We moved away from the target direction.
                    // Let's see if we should switch to another neighbor.
                    let otherNeighbors = neighbors.filter(n => n.node !== this.dragSlideDirection);
                    let bestProj = -Infinity;
                    let bestNeighborObj = null;

                    for (let nObj of otherNeighbors) {
                        let neighbor = nObj.node;
                        let dir = neighbor.position.sub(this.draggedNode.position).normalize();
                        let proj = dv.x * dir.x + dv.y * dir.y;
                        if (proj > bestProj) {
                            bestProj = proj;
                            bestNeighborObj = nObj;
                        }
                    }

                    if (bestNeighborObj && bestProj > 0) {
                        this.dragSlideDirection = bestNeighborObj.node;
                        this.dragSlideAccumulator = bestProj;
                    } else {
                        // Reset if no other neighbor or movement is not positive
                        this.dragSlideAccumulator = 0;
                        this.dragSlideDirection = null;
                    }
                }
            }

            // Process sliding if we have a direction and exceeded threshold
            if (this.dragSlideDirection) {
                let currentConstraint = null;
                for (let c of this.engine.constraints) {
                    if (c.isBroken) continue;
                    if ((c.nodeA === this.draggedNode && c.nodeB === this.dragSlideDirection) ||
                        (c.nodeB === this.draggedNode && c.nodeA === this.dragSlideDirection)) {
                        currentConstraint = c;
                        break;
                    }
                }

                if (currentConstraint) {
                    let threshold = currentConstraint.restLength;
                    while (this.dragSlideAccumulator > threshold) {
                        this.dragSlideAccumulator -= threshold;

                        let oldNode = this.draggedNode;

                        // Switch constraint to the new node
                        this.draggedNode = this.dragSlideDirection;
                        if (this.mouseConstraint) {
                            this.mouseConstraint.nodeB = this.draggedNode;
                            this.mouseConstraint.invMassB = this.draggedNode.isPinned ? 0 : (1.0 / (this.draggedNode.mass || 1.0));
                        }

                        // Get neighbors of the new dragged node
                        let newNeighbors = this.getNeighbors(this.draggedNode);
                        // Filter out the old node we just came from
                        let nextNeighbors = newNeighbors.filter(n => n.node !== oldNode);

                        if (nextNeighbors.length === 0) {
                            this.dragSlideAccumulator = 0;
                            this.dragSlideDirection = null;
                            break;
                        }

                        // Choose the next direction based on the mouse movement dv
                        let bestProj = -Infinity;
                        let bestNeighborObj = null;

                        for (let nObj of nextNeighbors) {
                            let neighbor = nObj.node;
                            let dir = neighbor.position.sub(this.draggedNode.position).normalize();
                            let proj = dv.x * dir.x + dv.y * dir.y;
                            if (proj > bestProj) {
                                bestProj = proj;
                                bestNeighborObj = nObj;
                            }
                        }

                        if (bestNeighborObj && bestProj > 0) {
                            this.dragSlideDirection = bestNeighborObj.node;

                            // Re-fetch constraint for the new step to update threshold
                            let nextConstraint = null;
                            for (let c of this.engine.constraints) {
                                if (c.isBroken) continue;
                                if ((c.nodeA === this.draggedNode && c.nodeB === this.dragSlideDirection) ||
                                    (c.nodeB === this.draggedNode && c.nodeA === this.dragSlideDirection)) {
                                    nextConstraint = c;
                                    break;
                                }
                            }
                            if (nextConstraint) {
                                threshold = nextConstraint.restLength;
                            } else {
                                this.dragSlideAccumulator = 0;
                                this.dragSlideDirection = null;
                                break;
                            }
                        } else {
                            this.dragSlideAccumulator = 0;
                            this.dragSlideDirection = null;
                            break;
                        }
                    }
                }
            }

            // Finally, update the mouse node's position to follow the cursor
            if (this.mouseNode) {
                this.mouseNode.position.x = v.x;
                this.mouseNode.position.y = v.y;
                this.mouseNode.oldPosition.x = v.x;
                this.mouseNode.oldPosition.y = v.y;
            }
        }
    }

    handleMouseUp(v) {
        if (this.draggedNode) {
            if (this.mouseConstraint) {
                let idx = this.engine.constraints.indexOf(this.mouseConstraint);
                if (idx !== -1) {
                    this.engine.constraints.splice(idx, 1);
                }
            }
            this.draggedNode = null;
            this.mouseNode = null;
            this.mouseConstraint = null;
            this.dragSlideAccumulator = 0;
            this.dragSlideDirection = null;
        }
    }
}
