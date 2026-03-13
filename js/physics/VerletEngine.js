class VerletEngine {
    constructor(gravityY = 9.8) {
        this.nodes = [];
        this.constraints = [];
        this.gravity = new Vector2(0, gravityY);
        this.iterations = 30; // Reduced from 50 to allow ropes to stretch enough to reach breaking strain
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

        // Iterations make the simulation stiffer and more accurate
        for (let i = 0; i < this.iterations; i++) {
            this.applyConstraints();

            // Resolve collision between vehicle and all rope segments
            if (vehicleNode) {
                for (let j = 0; j < this.constraints.length; j++) {
                    CollisionResolver.resolveCircleSegment(vehicleNode, this.constraints[j]);
                }
            }
        }

        // Clean up broken constraints
        this.constraints = this.constraints.filter(c => !c.isBroken);
    }

    simulate() {
        // Apply forces (gravity)
        for (let i = 0; i < this.nodes.length; i++) {
            let node = this.nodes[i];

            if (node.isPinned) continue;

            let tempX = node.position.x;
            let tempY = node.position.y;

            // next_pos = cur_pos + (cur_pos - old_pos) + acceleration * dt * dt
            node.position.x += (node.position.x - node.oldPosition.x) + this.gravity.x * this.fixedDeltaTimeSq;
            node.position.y += (node.position.y - node.oldPosition.y) + this.gravity.y * this.fixedDeltaTimeSq;

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
