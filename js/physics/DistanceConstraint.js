class DistanceConstraint {
    constructor(nodeA, nodeB, materialInfo) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.stiffness = 1.0; // Ropes are fundamentally inelastic now. Pliancy comes from slack.
        this.breakingStrain = materialInfo.breakingStrain || 1.5; // Strain limit before it snaps

        let actualDist = nodeA.position.distanceTo(nodeB.position);

        // High tension = short, slack = long
        let slackMultiplier = materialInfo.slackMultiplier || 1.0;

        this.restLength = actualDist * slackMultiplier;
        this.drawnLength = actualDist; // Store original drawn length for visual strain calc
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

        // Calculate geometric stretch percentage (1.0 = exactly the length drawn)
        if (this.restLength > 0) {
            let stretchRatio = currentDist / this.restLength;
            this.currentStrainRatio = currentDist / this.drawnLength;

            // Simple breaking: If we stretch materially beyond our resting length allowance
            if (stretchRatio > this.breakingStrain && this.breakingStrain !== Infinity) {
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
