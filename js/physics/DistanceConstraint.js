export default class DistanceConstraint {
    constructor(nodeA, nodeB, materialInfo) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.breakingStrain = materialInfo.breakingStrain || 1.5; // Strain limit before it snaps
        this.color = materialInfo.color || [100, 255, 218];
        this.ropeType = materialInfo.ropeType || 'rope';

        let actualDist = nodeA.position.distanceTo(nodeB.position);
        this.rigidity = materialInfo.rigidity !== undefined ? materialInfo.rigidity : 500.0;
        this.stiffness = this.rigidityToStiffness(this.rigidity);


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

    rigidityToStiffness(r) {
        // Map rigidity to a high stiffness range (0.2 to 0.8).
        // Since breaking is disabled, high stiffness allows the rope to stretch instantly and evenly
        // without the "slow release" lag effect when dragging stops.
        return 0.2 + (Math.max(0, Math.min(500, r)) / 500) * 0.6;
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
            let invA = this.nodeA.isPinned ? 0 : this.invMassA;
            let invB = this.nodeB.isPinned ? 0 : this.invMassB;
            let invMassSum = invA + invB;
            
            if (invMassSum <= 0) return; // Both nodes are pinned

            let difference = (this.restLength - currentDist) / currentDist;
            let correctionVectorX = dx * difference * this.stiffness;
            let correctionVectorY = dy * difference * this.stiffness;

            // Move nodes proportionally to their inverse mass
            if (invA > 0) {
                this.nodeA.position.x += correctionVectorX * (invA / invMassSum);
                this.nodeA.position.y += correctionVectorY * (invA / invMassSum);
            }
            if (invB > 0) {
                this.nodeB.position.x -= correctionVectorX * (invB / invMassSum);
                this.nodeB.position.y -= correctionVectorY * (invB / invMassSum);
            }

            // Accumulate tension force (absolute magnitude of correction distance)
            if (currentDist > this.restLength) {
                this.frameTension += (currentDist - this.restLength);
            }
        }
    }
}
