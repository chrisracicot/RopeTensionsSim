class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    sub(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    mul(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    div(scalar) {
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const magnitude = this.mag();
        if (magnitude === 0) return new Vector2(0, 0);
        return this.div(magnitude);
    }

    distanceTo(other) {
        return this.sub(other).mag();
    }

    copy() {
        return new Vector2(this.x, this.y);
    }
}
