import Vector2 from './Vector2.js';

export default class CollisionResolver {
    /**
     * Resolves collision between two circles.
     * @param {VerletNode} nodeA 
     * @param {VerletNode} nodeB 
     */
    static resolveCircleCircle(nodeA, nodeB) {
        const distVec = nodeA.position.sub(nodeB.position);
        const dist = distVec.mag();
        const minDist = nodeA.radius + nodeB.radius;

        if (dist < minDist) {
            const overlap = minDist - dist;
            const collisionNormal = dist > 0 ? distVec.div(dist) : new Vector2(0, -1);
            const resolution = collisionNormal.mul(overlap);

            if (nodeA.isPinned && !nodeB.isPinned) {
                nodeB.position.x -= resolution.x;
                nodeB.position.y -= resolution.y;
                nodeB.oldPosition.x -= resolution.x * 0.5; // Faint bounce dampening
                nodeB.oldPosition.y -= resolution.y * 0.5;
            } else if (!nodeA.isPinned && nodeB.isPinned) {
                nodeA.position.x += resolution.x;
                nodeA.position.y += resolution.y;
                nodeA.oldPosition.x += resolution.x * 0.5;
                nodeA.oldPosition.y += resolution.y * 0.5;
            } else if (!nodeA.isPinned && !nodeB.isPinned) {
                // Both dynamic: distribute based on mass (simplified)
                const totalMass = nodeA.mass + nodeB.mass;
                const ratioA = nodeB.mass / totalMass;
                const ratioB = nodeA.mass / totalMass;

                nodeA.position.x += resolution.x * ratioA;
                nodeA.position.y += resolution.y * ratioA;
                nodeB.position.x -= resolution.x * ratioB;
                nodeB.position.y -= resolution.y * ratioB;
            }
        }
    }

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
            const ropeBaseMass = 1.0; // Base mass of rope nodes

            // Mass scales exponentially with tension. High tension means it resists movement heavily.
            // We normalize tension (0.01-0.5 range) for scaling so it's more impactful even at the cap.
            const normTension = (constraint.tension || 0.1) * 2; // Maps 0.5 to 1.0
            const dynamicMass = Math.pow(normTension, 3) * (constraint.rigidity || 1.0) * 5.0;
            const ropeMass = ropeBaseMass + dynamicMass;

            const totalMass = circleMass + ropeMass;

            // Calculate ratios: heavier objects move less
            let circleRatio = ropeMass / totalMass;
            let ropeRatio = circleMass / totalMass;

            // If the circle is pinned (e.g., being dragged by the mouse), it should act as an immovable object
            if (circle.isPinned) {
                circleRatio = 0;
                ropeRatio = 1.0;
            }

            const circleXMove = resolution.x * circleRatio;
            const circleYMove = resolution.y * circleRatio;

            if (!circle.isPinned) {
                circle.position.x += circleXMove;
                circle.position.y += circleYMove;
            }

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

            // --- Impact Force Transfer ---
            // Track the PEAK impact force per frame to prevent astronomical buildup
            // over 50 iterations from microscopic overlaps.
            const impactScalar = 2.0; // Calibration factor for impact damage
            const impactForce = overlap * circleMass * impactScalar;
            constraint.peakImpactForce = Math.max((constraint.peakImpactForce || 0), impactForce);
        }
    }
}
