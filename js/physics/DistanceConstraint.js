class DistanceConstraint {
    constructor(nodeA, nodeB, materialInfo) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.stiffness = 1.0; // Ropes are fundamentally inelastic now. Pliancy comes from slack.
        this.breakingStrain = materialInfo.breakingStrain || 1.5; // Strain limit before it snaps

        let actualDist = nodeA.position.distanceTo(nodeB.position);
        this.rigidity = materialInfo.rigidity !== undefined ? materialInfo.rigidity : 1.0;


        // High tension = short, slack = long
        let slackMultiplier = materialInfo.slackMultiplier || 1.0;
        this.tension = materialInfo.tensionVal !== undefined ? materialInfo.tensionVal : 0.1;

        this.restLength = actualDist * slackMultiplier;
        this.drawnLength = actualDist; // Store original drawn length for visual strain calc
        this.isBroken = false;

        // Strain ranges for visualizing wear
        this.currentStrainRatio = 1.0;

        // Inverse mass caching for fast constraint resolution
        this.invMassA = nodeA.isPinned ? 0 : (1.0 / (nodeA.mass || 1.0));
        this.invMassB = nodeB.isPinned ? 0 : (1.0 / (nodeB.mass || 1.0));

        this.frameTension = 0; // Accumulates correction distance over multiple iterations
    }

    solve() {
        if (this.isBroken) return;

        // Distance between nodes
        let dx = this.nodeA.position.x - this.nodeB.position.x;
        let dy = this.nodeA.position.y - this.nodeB.position.y;
        let currentDist = Math.sqrt(dx * dx + dy * dy);

        // Calculate geometric stretch percentage (for visualization)
        if (this.restLength > 0) {
            this.currentStrainRatio = currentDist / this.drawnLength;
        }

        // Apply constraint limits (Inverse Mass weighted resolution)
        if (currentDist > 0) {
            let invMassSum = this.invMassA + this.invMassB;
            if (invMassSum <= 0) return; // Both nodes are pinned

            let difference = (this.restLength - currentDist) / currentDist;
            let correctionVectorX = dx * difference * this.stiffness;
            let correctionVectorY = dy * difference * this.stiffness;

            // Move nodes proportionally to their inverse mass
            if (this.invMassA > 0) {
                this.nodeA.position.x += correctionVectorX * (this.invMassA / invMassSum);
                this.nodeA.position.y += correctionVectorY * (this.invMassA / invMassSum);
            }
            if (this.invMassB > 0) {
                this.nodeB.position.x -= correctionVectorX * (this.invMassB / invMassSum);
                this.nodeB.position.y -= correctionVectorY * (this.invMassB / invMassSum);
            }

            // Accumulate tension force (absolute magnitude of correction distance)
            if (currentDist > this.restLength) {
                this.frameTension += (currentDist - this.restLength);
            }
        }
    }
}
