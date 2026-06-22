class BendingConstraint {
    constructor(nodeA, nodeB, nodeC, bendAngleLimitDegrees, stiffness = 0.5) {
        this.nodeA = nodeA;
        this.nodeB = nodeB; // Middle node
        this.nodeC = nodeC;
        this.stiffness = stiffness;
        this.ropeType = nodeA.ropeType || 'rope';
        this.isBroken = false;

        this.invMassA = nodeA.isPinned ? 0 : (1.0 / (nodeA.mass || 1.0));
        this.invMassC = nodeC.isPinned ? 0 : (1.0 / (nodeC.mass || 1.0));

        this.setAngleLimit(bendAngleLimitDegrees);
    }

    setAngleLimit(degrees) {
        this.bendAngleLimitDegrees = degrees;
        // 0 deg = completely straight, internal angle = 180 deg.
        // 180 deg = fold in half, internal angle = 0 deg.
        let minInternalAngleDegrees = 180 - Math.max(0, Math.min(180, degrees));
        this.minInternalAngleRad = minInternalAngleDegrees * Math.PI / 180.0;
        this.cosMinAngle = Math.cos(this.minInternalAngleRad);
    }

    solve() {
        if (this.isBroken) return;

        // Vector B->A
        let dx1 = this.nodeA.position.x - this.nodeB.position.x;
        let dy1 = this.nodeA.position.y - this.nodeB.position.y;
        let d1Sq = dx1 * dx1 + dy1 * dy1;
        let d1 = Math.sqrt(d1Sq);

        // Vector B->C
        let dx2 = this.nodeC.position.x - this.nodeB.position.x;
        let dy2 = this.nodeC.position.y - this.nodeB.position.y;
        let d2Sq = dx2 * dx2 + dy2 * dy2;
        let d2 = Math.sqrt(d2Sq);

        if (d1 === 0 || d2 === 0) return;

        // Current distance between A and C
        let dxAC = this.nodeA.position.x - this.nodeC.position.x;
        let dyAC = this.nodeA.position.y - this.nodeC.position.y;
        let currentDistSq = dxAC * dxAC + dyAC * dyAC;
        let currentDist = Math.sqrt(currentDistSq);

        // Minimum distance required to maintain the angle
        // Law of Cosines: D_min = sqrt(d1^2 + d2^2 - 2*d1*d2*cos(minAngle))
        let minDistSq = d1Sq + d2Sq - 2 * d1 * d2 * this.cosMinAngle;
        if (minDistSq <= 0) return;
        
        let minDist = Math.sqrt(minDistSq);

        // If A and C are closer than the minimum allowed distance, push them apart
        if (currentDist < minDist && currentDist > 0) {
            let invA = this.nodeA.isPinned ? 0 : this.invMassA;
            let invC = this.nodeC.isPinned ? 0 : this.invMassC;
            let invMassSum = invA + invC;

            if (invMassSum <= 0) return;

            let difference = (minDist - currentDist) / currentDist;
            let correctionVectorX = dxAC * difference * this.stiffness;
            let correctionVectorY = dyAC * difference * this.stiffness;

            if (invA > 0) {
                this.nodeA.position.x += correctionVectorX * (invA / invMassSum);
                this.nodeA.position.y += correctionVectorY * (invA / invMassSum);
            }
            if (invC > 0) {
                this.nodeC.position.x -= correctionVectorX * (invC / invMassSum);
                this.nodeC.position.y -= correctionVectorY * (invC / invMassSum);
            }
        }
    }
}
