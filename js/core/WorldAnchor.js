class WorldAnchor {
    constructor(x, y, radius = 5, isPulley = false) {
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.isPulley = isPulley;

        // Pinned node physically representing this anchor
        this.node = new VerletNode(x, y, true);
        this.node.radius = radius;

        // References to attached constraints
        this.constraints = [];
    }

    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        if (this.isPulley) {
            ctx.fillStyle = '#ffaa00';
        } else {
            ctx.fillStyle = '#64ffda'; // Neon cyan from UI
        }
        ctx.fill();
        ctx.strokeStyle = '#233554';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
