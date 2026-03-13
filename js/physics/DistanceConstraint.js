class DistanceConstraint {
    constructor(nodeA, nodeB, materialInfo) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.stiffness = materialInfo.stiffness || 1.0;
        this.breakingStrain = materialInfo.breakingStrain || 1.5; // Strain limit before it snaps
        this.restLength = nodeA.position.distanceTo(nodeB.position);
        this.isBroken = false;

        // Strain ranges for visualizing wear
        this.currentStrainRatio = 1.0;
    }

    solve() {
        if (this.isBroken) return;

        // Distance between nodes
        let dx = this.nodeA.position.x - this.nodeB.position.x;
        let dy = this.nodeA.position.y - this.nodeB.position.y;
        let currentDist = Math.sqrt(dx * dx + dy * dy);

        // Calculate physical Tension Force
        if (this.restLength > 0) {
            let stretchRatio = currentDist / this.restLength;
            this.currentStrainRatio = stretchRatio;
            // We only care about stretching (tension), not compressing
            let strain = Math.max(0, stretchRatio - 1.0);

            // True physical Tension is the amount of stretch multiplied by the rope's stiffness
            let tensionForce = strain * this.stiffness;

            // The UI "Strength" (breakingStrain) is stored as e.g. 1.05. We convert this to a max force tolerance of 0.05.
            let maxTensionTolerance = this.breakingStrain - 1.0;

            if (tensionForce > maxTensionTolerance) {
                this.isBroken = true;
                return;
            }
        }

        // Apply constraint limits
        if (currentDist > 0) {
            let difference = (this.restLength - currentDist) / currentDist;
            let translateX = dx * 0.5 * difference * this.stiffness;
            let translateY = dy * 0.5 * difference * this.stiffness;

            if (!this.nodeA.isPinned) {
                this.nodeA.position.x += translateX;
                this.nodeA.position.y += translateY;
            }
            if (!this.nodeB.isPinned) {
                this.nodeB.position.x -= translateX;
                this.nodeB.position.y -= translateY;
            }
        }
    }
}
