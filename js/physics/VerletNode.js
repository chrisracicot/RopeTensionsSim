import Vector2 from './Vector2.js';

export default class VerletNode {
    constructor(x, y, isPinned = false) {
        this.position = new Vector2(x, y);
        this.oldPosition = new Vector2(x, y);
        this.isPinned = isPinned;
        this.mass = 1.0;
        this.radius = 2.0; // Collision/rendering radius
        this.gravityScale = 1.0; // High-tension tautness reduces ambient gravity effect
    }
}
