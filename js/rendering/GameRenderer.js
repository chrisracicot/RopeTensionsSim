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

        // Draw Gravity Control Indicators
        if (this.levelObj.gravityControlMode) {
            if (this.levelObj.gravityType === 'vector') {
                // Draw a sleek compass HUD in the top-right corner
                const compassX = canvas.width - 60;
                const compassY = 60;

                // Outer ring
                ctx.beginPath();
                ctx.arc(compassX, compassY, 25, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 255, 218, 0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Inner dashed circle
                ctx.beginPath();
                ctx.arc(compassX, compassY, 15, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(100, 255, 218, 0.2)';
                ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Vector line pointing in gravity direction
                const dir = this.engine.gravity.normalize();
                if (dir.mag() > 0) {
                    ctx.beginPath();
                    ctx.moveTo(compassX, compassY);
                    ctx.lineTo(compassX + dir.x * 20, compassY + dir.y * 20);
                    ctx.strokeStyle = '#64ffda';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Arrowhead
                    const angle = Math.atan2(dir.y, dir.x);
                    ctx.beginPath();
                    ctx.moveTo(compassX + dir.x * 20, compassY + dir.y * 20);
                    ctx.lineTo(compassX + dir.x * 20 - 6 * Math.cos(angle - Math.PI / 6), compassY + dir.y * 20 - 6 * Math.sin(angle - Math.PI / 6));
                    ctx.lineTo(compassX + dir.x * 20 - 6 * Math.cos(angle + Math.PI / 6), compassY + dir.y * 20 - 6 * Math.sin(angle + Math.PI / 6));
                    ctx.fillStyle = '#64ffda';
                    ctx.fill();
                }

                // HUD Label
                ctx.fillStyle = '#64ffda';
                ctx.font = '10px Outfit, Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText("GRAVITY DIR", compassX, compassY + 40);
            } else if (this.levelObj.gravityType === 'attractor' && this.engine.gravityAttractorPoint) {
                const pt = this.engine.gravityAttractorPoint;

                // Target core
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#ff3366';
                ctx.fill();

                // Pulsing ring
                const pulseRadius = 6 + (Date.now() % 1000) / 1000 * 24;
                const alpha = 1.0 - (Date.now() % 1000) / 1000;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 51, 102, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Dotted crosshair lines
                ctx.strokeStyle = 'rgba(255, 51, 102, 0.4)';
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.moveTo(pt.x - 20, pt.y);
                ctx.lineTo(pt.x + 20, pt.y);
                ctx.moveTo(pt.x, pt.y - 20);
                ctx.lineTo(pt.x, pt.y + 20);
                ctx.stroke();
                ctx.setLineDash([]);
            }
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
