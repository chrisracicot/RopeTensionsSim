export const UI_CONFIG = {
    gravity: { min: 0, max: 10, step: 0.01, displayScale: 10 },
    iterations: { min: 10, max: 100, step: 1 },
    velocity: { min: -100, max: 100, step: 1 },

    // Sandbox Rope ranges
    sandbox: {
        strength: { min: 0.50, max: 6.50, step: 0.05, infiniteThreshold: 6.45 },
        tension: { min: 0.50, max: 2.00, step: 0.01 },
        rigidity: { min: 0, max: 500, step: 1 },
        segment: { min: 3, max: 15, step: 1 },
        mass: { min: 0.05, max: 2.00, step: 0.05 },
        bendAngleLimit: { min: 0, max: 180, step: 1 },
        bendingStiffness: { min: 0.00, max: 5.00, step: 0.05 }
    }
};

export const DEFAULT_ROPE_SETTINGS = {
    twine: { strength: 1.15, tension: 1.10, rigidity: 150, segment: 4, mass: 0.05, bendAngleLimit: 150, bendingStiffness: 0.10 },
    rope: { strength: 1.45, tension: 1.00, rigidity: 300, segment: 5, mass: 0.20, bendAngleLimit: 90, bendingStiffness: 0.40 },
    steel: { strength: 3.00, tension: 0.95, rigidity: 500, segment: 6, mass: 0.80, bendAngleLimit: 20, bendingStiffness: 0.80 }
};
