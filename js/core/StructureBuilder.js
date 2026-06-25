import Vector2 from '../physics/Vector2.js';
import VerletNode from '../physics/VerletNode.js';
import DistanceConstraint from '../physics/DistanceConstraint.js';
import BendingConstraint from '../physics/BendingConstraint.js';

export default class StructureBuilder {
    constructor(engine, anchors) {
        this.engine = engine;
        this.anchors = anchors;

        this.isDrawing = false;
        this.startAnchor = null;
        this.mousePos = new Vector2();
    }

    getSandboxSettings() {
        const getVal = (id) => parseFloat(document.getElementById(id).value);
        let strength = getVal('slider-sandbox-strength');

        // Infinite threshold check
        if (strength >= 6.45) strength = Infinity;

        const ropeType = document.getElementById('select-rope-type')?.value || 'rope';
        let color = [195, 160, 120]; // default standard rope
        if (ropeType === 'twine') color = [255, 200, 50]; // Twine
        else if (ropeType === 'steel') color = [120, 180, 220]; // Steel Cable

        return {
            strength: strength,
            tension: getVal('slider-sandbox-tension'),
            rigidity: getVal('slider-sandbox-rigidity'),
            segmentLength: getVal('slider-sandbox-segment'),
            nodeMass: getVal('slider-sandbox-mass'),
            bendAngleLimit: getVal('slider-sandbox-bendAngleLimit'),
            bendingStiffness: getVal('slider-sandbox-bendingStiffness'),
            ropeType: ropeType,
            color: color
        };
    }

    getNearestAnchor(v, dist = 20) {
        let nearest = null;
        let minDist = dist;
        for (let a of this.anchors) {
            let d = a.position.distanceTo(v);
            if (d < minDist) {
                minDist = d;
                nearest = a;
            }
        }
        for (let n of this.engine.nodes) {
            if (n.isPinned) continue;
            let d = n.position.distanceTo(v);
            if (d < minDist) {
                minDist = d;
                nearest = { node: n, position: n.position, isDynamic: true };
            }
        }
        return nearest;
    }

    onMouseDown(v) {
        let anchor = this.getNearestAnchor(v);
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
        if (endAnchor && endAnchor.node === this.startAnchor.node) return;

        let pStart = this.startAnchor.position;
        let pEnd = endAnchor ? endAnchor.position : v;

        const settings = this.getSandboxSettings();

        let totalDist = pStart.distanceTo(pEnd);
        let numSegments = Math.max(1, Math.floor(totalDist / settings.segmentLength));
        let estimatedCost = numSegments * 5;

        let allowed = onBuildCallback(estimatedCost);

        if (allowed) {
            this.buildRope(this.startAnchor, endAnchor, v, numSegments, settings);
        }
    }

    buildRope(startAnchor, endAnchor, endPos, numSegments, settings) {
        let pStart = startAnchor.position;
        let pEnd = endAnchor ? endAnchor.position : endPos;

        let pathVec = pEnd.sub(pStart);
        let stepVec = pathVec.div(numSegments);

        let prevNode = startAnchor.node;
        let nodesList = [prevNode];

        let slackMultiplier = settings.tension;

        let matLayout = { 
            breakingStrain: settings.strength, 
            slackMultiplier: slackMultiplier, 
            tensionVal: settings.tension, 
            rigidity: settings.rigidity,
            color: settings.color,
            ropeType: settings.ropeType
        };

        for (let i = 1; i <= numSegments; i++) {
            let isLast = (i === numSegments);
            let nextPos = pStart.add(stepVec.mul(i));

            let newNode;
            if (isLast) {
                if (endAnchor) {
                    newNode = endAnchor.node;
                } else {
                    newNode = new VerletNode(nextPos.x, nextPos.y);
                    newNode.mass = settings.nodeMass;
                    newNode.ropeType = settings.ropeType;
                    this.engine.addNode(newNode);
                }
            } else {
                newNode = new VerletNode(nextPos.x, nextPos.y);
                newNode.mass = settings.nodeMass;
                newNode.ropeType = settings.ropeType;
                this.engine.addNode(newNode);
            }

            let constraint = new DistanceConstraint(prevNode, newNode, matLayout);
            this.engine.addConstraint(constraint);

            nodesList.push(newNode);
            prevNode = newNode;
        }

        for (let i = 0; i < nodesList.length - 2; i++) {
            let nA = nodesList[i];
            let nB = nodesList[i + 1];
            let nC = nodesList[i + 2];

            let bConstraint = new BendingConstraint(nA, nB, nC, settings.bendAngleLimit, settings.bendingStiffness);
            this.engine.addConstraint(bConstraint);
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

        if (endObj) {
            ctx.beginPath();
            ctx.arc(pEnd.x, pEnd.y, endObj.radius || 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 255, 218, 0.5)';
            ctx.fill();
        }
    }
}
