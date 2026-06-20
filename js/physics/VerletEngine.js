class VerletEngine {
    constructor(gravityY = 9.8) {
        this.nodes = [];
        this.constraints = [];
        this.gravity = new Vector2(0, gravityY);
        this.iterations = 50; // Increased to 50 for higher stiffness and faster propagation
        this.timeStep = 0.016; // Assuming ~60fps
        this.fixedDeltaTimeSq = this.timeStep * this.timeStep;
    }

    addNode(node) {
        this.nodes.push(node);
    }

    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    clear() {
        this.nodes = [];
        this.constraints = [];
    }

    update(vehicleNode = null) {
        this.simulate();

        // Reset tension tracking for this frame
        for (let j = 0; j < this.constraints.length; j++) {
            this.constraints[j].frameTension = 0;
            this.constraints[j].peakImpactForce = 0;
        }

        // Iterations make the simulation stiffer and more accurate
        for (let i = 0; i < this.iterations; i++) {
            this.applyConstraints();

            // Resolve collision between vehicle, rope segments, and anchors
            if (vehicleNode) {
                // 1. Check against rope segments
                for (let j = 0; j < this.constraints.length; j++) {
                    CollisionResolver.resolveCircleSegment(vehicleNode, this.constraints[j]);
                }

                // 2. Check against fixed anchor points (pinned nodes)
                for (let j = 0; j < this.nodes.length; j++) {
                    const node = this.nodes[j];
                    if (node.isPinned && node !== vehicleNode) {
                        CollisionResolver.resolveCircleCircle(vehicleNode, node);
                    }
                }
            }
        }

        // Force-based breaking (Single-Snap Rule) is disabled. Ropes can stretch infinitely.
    }

    simulate() {
        // Apply forces (gravity)
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];

            if (node.isPinned) continue;

            let tempX = node.position.x;
            let tempY = node.position.y;

            // next_pos = cur_pos + (cur_pos - old_pos) + acceleration * dt * dt
            node.position.x += (node.position.x - node.oldPosition.x) + (this.gravity.x * node.gravityScale) * this.fixedDeltaTimeSq;
            node.position.y += (node.position.y - node.oldPosition.y) + (this.gravity.y * node.gravityScale) * this.fixedDeltaTimeSq;

            node.oldPosition.x = tempX;
            node.oldPosition.y = tempY;

            // Basic floor collision - stop vertical movement when hitting ground
            if (node.position.y > 600) {
                node.position.y = 600;
                // Zero out vertical velocity: set oldPosition.y to current position.y
                node.oldPosition.y = node.position.y;

                // Friction approximation for horizontal movement
                node.position.x -= (node.position.x - node.oldPosition.x) * 0.2;
            }
        }
    }

    applyConstraints() {
        for (let i = 0; i < this.constraints.length; i++) {
            this.constraints[i].solve();
        }
    }
}
