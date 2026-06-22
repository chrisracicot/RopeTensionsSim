class RopeRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    render(engine) {
        // We'll use HTML5 Canvas Path for simplicity for now, 
        // though custom WebGL quads are needed for massive scale.

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (let i = 0; i < engine.constraints.length; i++) {
            let c = engine.constraints[i];
            
            if (c.ropeType === 'mouse') continue;

            // Visual thickness based on rope type
            let maxThick = 4;
            if (c.ropeType === 'twine') maxThick = 2;
            else if (c.ropeType === 'steel') maxThick = 5;

            let baseColor = c.color || [100, 255, 218];
            let r = baseColor[0];
            let g = baseColor[1];
            let b = baseColor[2];

            let ratio = c.currentStrainRatio;
            if (ratio > 1.1) {
                // Blend with warning red (255, 50, 50) based on strain ratio
                // Reaches full red at 1.4x stretch ratio
                let blendFactor = Math.min(1.0, (ratio - 1.1) / 0.3);
                r = Math.round(r * (1.0 - blendFactor) + 255 * blendFactor);
                g = Math.round(g * (1.0 - blendFactor) + 50 * blendFactor);
                b = Math.round(b * (1.0 - blendFactor) + 50 * blendFactor);
            }

            this.ctx.beginPath();
            this.ctx.moveTo(c.nodeA.position.x, c.nodeA.position.y);
            this.ctx.lineTo(c.nodeB.position.x, c.nodeB.position.y);
            this.ctx.lineWidth = maxThick;
            this.ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.stroke();
        }

        // Draw nodes for debug
        /*
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < engine.nodes.length; i++) {
            let n = engine.nodes[i];
            this.ctx.beginPath();
            this.ctx.arc(n.position.x, n.position.y, 2, 0, Math.PI*2);
            this.ctx.fill();
        }
        */
    }
}
