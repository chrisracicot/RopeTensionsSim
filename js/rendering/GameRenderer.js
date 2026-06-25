import DistanceConstraint from '../physics/DistanceConstraint.js';

export class GameRenderer {
    constructor(ctx, engine, levelObj, inputController) {
        this.ctx = ctx;
        this.engine = engine;
        this.levelObj = levelObj;
        this.inputController = inputController;
        this.cameraOffset = { x: 0, y: 0 };
    }

    render() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;

        // Clear screen with background color
        ctx.fillStyle = '#1e222b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply camera offset transformation if used in future phases
        ctx.save();
        ctx.translate(-this.cameraOffset.x, -this.cameraOffset.y);

        // Draw draft state (building mode)
        if (this.levelObj.state === 'BUILD') {
            this.levelObj.builder.drawDraft(ctx);
        }

        // Draw ropes/constraints
        this.renderRopes();

        // Draw world anchors
        for (let a of this.levelObj.builder.anchors) {
            a.draw(ctx);
        }

        // Draw the floor/ground line
        ctx.beginPath();
        ctx.moveTo(0, 595);
        ctx.lineTo(canvas.width, 595);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the vehicle ball
        if (this.levelObj.vehicle) {
            const v = this.levelObj.vehicle;
            ctx.beginPath();
            ctx.arc(v.position.x, v.position.y, v.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3366';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw trajectory arc prediction
        if (this.inputController) {
            this.inputController.drawTrajectory(ctx);
        }

        ctx.restore();
    }

    renderRopes() {
        const ctx = this.ctx;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < this.engine.constraints.length; i++) {
            let c = this.engine.constraints[i];
            
            if (c.ropeType === 'mouse') continue;

            let maxThick = 4;
            if (c.ropeType === 'twine') maxThick = 2;
            else if (c.ropeType === 'steel') maxThick = 5;

            let baseColor = c.color || [100, 255, 218];
            let r = baseColor[0];
            let g = baseColor[1];
            let b = baseColor[2];

            let ratio = c.currentStrainRatio;
            if (ratio > 1.1) {
                let blendFactor = Math.min(1.0, (ratio - 1.1) / 0.3);
                r = Math.round(r * (1.0 - blendFactor) + 255 * blendFactor);
                g = Math.round(g * (1.0 - blendFactor) + 50 * blendFactor);
                b = Math.round(b * (1.0 - blendFactor) + 50 * blendFactor);
            }

            ctx.beginPath();
            ctx.moveTo(c.nodeA.position.x, c.nodeA.position.y);
            ctx.lineTo(c.nodeB.position.x, c.nodeB.position.y);
            ctx.lineWidth = maxThick;
            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.stroke();
        }
    }
}
