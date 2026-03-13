class StructureBuilder {
    constructor(engine, anchors) {
        this.engine = engine;
        this.anchors = anchors;

        this.isDrawing = false;
        this.startAnchor = null;
        this.mousePos = new Vector2();

        this.materials = {
            twine: { stiffness: 0.1, breakingStrain: 1.015, costPerSegment: 1 },
            hemp: { stiffness: 0.4, breakingStrain: 1.08, costPerSegment: 3 },
            steel: { stiffness: 0.9, breakingStrain: 1.25, costPerSegment: 10 }
        };
        this.currentMaterialId = 'hemp';
        this.segmentLength = 15; // Target distance between nodes
    }

    setMaterial(matId) {
        if (this.materials[matId]) {
            this.currentMaterialId = matId;
        }
    }

    getNearestAnchor(v, dist = 20) {
        let nearest = null;
        let minDist = dist;
        // Check static anchors
        for (let a of this.anchors) {
            let d = a.position.distanceTo(v);
            if (d < minDist) {
                minDist = d;
                nearest = a;
            }
        }
        // Check dynamic nodes (joints)
        for (let n of this.engine.nodes) {
            if (n.isPinned) continue; // Skip static anchor nodes, already handled
            let d = n.position.distanceTo(v);
            if (d < minDist) {
                minDist = d;
                // Treat a node as an anchor point dynamically
                nearest = { node: n, position: n.position, isDynamic: true };
            }
        }
        return nearest;
    }

    onMouseDown(v) {
        let anchor = this.getNearestAnchor(v);
        // Only start from an anchor or existing joint to prevent floating ropes
        if (anchor) {
            this.isDrawing = true;
            this.startAnchor = anchor;
            this.mousePos = v.copy();
        }
    }

    onMouseMove(v) {
        if (this.isDrawing) {
            this.mousePos = v.copy();
        }
    }

    onMouseUp(v, onBuildCallback) {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        let endAnchor = this.getNearestAnchor(v);

        // Prevent tying to the exact same anchor
        if (endAnchor && endAnchor.node === this.startAnchor.node) return;

        // Determine start and end points
        let pStart = this.startAnchor.position;
        let pEnd = endAnchor ? endAnchor.position : v;

        // Calculate cost based on length
        let totalDist = pStart.distanceTo(pEnd);
        let numSegments = Math.max(1, Math.floor(totalDist / this.segmentLength));
        let material = this.materials[this.currentMaterialId];
        let estimatedCost = numSegments * material.costPerSegment;

        // Callback to level manager to check budget
        let allowed = onBuildCallback(estimatedCost);

        if (allowed) {
            this.buildRope(this.startAnchor, endAnchor, v, numSegments, material);
        }
    }

    buildRope(startAnchor, endAnchor, endPos, numSegments, material) {
        let pStart = startAnchor.position;
        let pEnd = endAnchor ? endAnchor.position : endPos;

        let pathVec = pEnd.sub(pStart);
        let stepVec = pathVec.div(numSegments);

        let prevNode = startAnchor.node;

        for (let i = 1; i <= numSegments; i++) {
            let isLast = (i === numSegments);
            let nextPos = pStart.add(stepVec.mul(i));

            let newNode;
            if (isLast) {
                if (endAnchor) {
                    newNode = endAnchor.node;
                } else {
                    // Create a dynamic joint in space
                    newNode = new VerletNode(nextPos.x, nextPos.y);
                    newNode.mass = 0.2; // Rope nodes must be light so they don't break themselves
                    this.engine.addNode(newNode);
                }
            } else {
                newNode = new VerletNode(nextPos.x, nextPos.y);
                newNode.mass = 0.2; // Rope nodes must be light
                this.engine.addNode(newNode);
            }

            let constraint = new DistanceConstraint(prevNode, newNode, material);
            this.engine.addConstraint(constraint);

            prevNode = newNode;
        }
    }

    drawDraft(ctx) {
        if (!this.isDrawing) return;

        let endObj = this.getNearestAnchor(this.mousePos);
        let pEnd = endObj ? endObj.position : this.mousePos;

        ctx.beginPath();
        ctx.moveTo(this.startAnchor.position.x, this.startAnchor.position.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#a8b2d1';
        ctx.stroke();
        ctx.setLineDash([]);

        // Highlight snapping
        if (endObj) {
            ctx.beginPath();
            ctx.arc(pEnd.x, pEnd.y, endObj.radius || 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 255, 218, 0.5)';
            ctx.fill();
        }
    }
}
