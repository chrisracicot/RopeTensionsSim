class CollisionResolver {
    /**
     * Resolves collision between a circle (vehicle) and a line segment (rope constraint).
     * @param {VerletNode} circle - The vehicle node
     * @param {DistanceConstraint} constraint - The rope segment
     */
    static resolveCircleSegment(circle, constraint) {
        if (constraint.isBroken) return;

        const n1 = constraint.nodeA;
        const n2 = constraint.nodeB;

        // Segment vector
        const seg_v = n2.position.sub(n1.position);
        const seg_len = seg_v.mag();
        if (seg_len === 0) return;

        // Vector from n1 to circle center
        const n1_to_circle = circle.position.sub(n1.position);

        // Project n1_to_circle onto seg_v to find the closest point's parameter t
        let t = (n1_to_circle.x * seg_v.x + n1_to_circle.y * seg_v.y) / (seg_len * seg_len);

        // Clamp t to the segment [0, 1]
        t = Math.max(0, Math.min(1, t));

        // Closest point on segment
        const closestPoint = n1.position.add(seg_v.mul(t));

        // Distance from circle center to closest point
        const distVec = circle.position.sub(closestPoint);
        const dist = distVec.mag();
        const minPlayerDist = circle.radius + 2; // + rope thickness

        if (dist < minPlayerDist) {
            // Collision detected!
            const overlap = minPlayerDist - dist;
            const collisionNormal = dist > 0 ? distVec.div(dist) : new Vector2(0, -1);

            // Resolution vector
            const resolution = collisionNormal.mul(overlap);

            // 1. Move vehicle out of rope (dynamic push based on mass)
            const circleMass = circle.mass || 1.0;
            const ropeMass = 1.0; // Assume rope nodes have unit mass
            const totalMass = circleMass + ropeMass;

            // Calculate ratios: heavier objects move less
            const circleRatio = ropeMass / totalMass;
            const ropeRatio = circleMass / totalMass;

            const circleXMove = resolution.x * circleRatio;
            const circleYMove = resolution.y * circleRatio;

            circle.position.x += circleXMove;
            circle.position.y += circleYMove;

            // DAMPEN: Pull oldPosition along with the push so the Verlet engine
            // doesn't see this displacement as radical new velocity
            circle.oldPosition.x += circleXMove * 0.9;
            circle.oldPosition.y += circleYMove * 0.9;

            // 2. Move rope nodes down (sagging)
            // Distribute the force based on t (barycentric) and the rope's ratio
            const forceOnRope = resolution.mul(-ropeRatio);

            if (!n1.isPinned) {
                n1.position.x += forceOnRope.x * (1 - t);
                n1.position.y += forceOnRope.y * (1 - t);
            }
            if (!n2.isPinned) {
                n2.position.x += forceOnRope.x * t;
                n2.position.y += forceOnRope.y * t;
            }
        }
    }
}
