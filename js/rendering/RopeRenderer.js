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

            // Visual strain indicator
            let maxThick = 4;
            let ratio = c.currentStrainRatio;

            // Map ratio to color 
            let r, g, b;
            if (ratio < 1.1) {
                // Chill: cyan-ish (100, 255, 218)
                r = 100; g = 255; b = 218;
            } else if (ratio < 1.3) {
                // Warning: Orange
                r = 255; g = 165; b = 0;
            } else {
                // Breaking: Red
                r = 255; g = 50; b = 50;
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
