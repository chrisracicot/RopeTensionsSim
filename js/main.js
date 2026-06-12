/* --- CONFIGURATION --- */
const UI_CONFIG = {
    gravity: { min: 0, max: 2, step: 0.01, displayScale: 10 },
    iterations: { min: 10, max: 100, step: 1 },
    velocity: { min: -100, max: 100, step: 1 },

    // Sandbox Rope ranges
    sandbox: {
        strength: { min: 0.50, max: 6.50, step: 0.05, infiniteThreshold: 6.45 },
        tension: { min: 0.50, max: 2.00, step: 0.01 },
        rigidity: { min: 0, max: 500, step: 1 },
        segment: { min: 5, max: 30, step: 1 },
        mass: { min: 0.05, max: 2.00, step: 0.05 }
    }
};

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Proper resizing
function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const engine = new VerletEngine(10.0); // Default gravity
const builder = new StructureBuilder(engine, []);
const levelObj = new LevelManager(engine, builder);
const renderer = new RopeRenderer(ctx);

// Initialize slider attributes from config
function initSliders() {
    // Global Physics
    const grav = document.getElementById('slider-gravity');
    const iter = document.getElementById('slider-iterations');

    grav.min = UI_CONFIG.gravity.min;
    grav.max = UI_CONFIG.gravity.max;
    grav.step = UI_CONFIG.gravity.step;
    levelObj.settings.gravity = parseFloat(grav.value) * UI_CONFIG.gravity.displayScale;
    updateHUDLabel('slider-gravity', 'val-gravity', 'gravity');

    iter.min = UI_CONFIG.iterations.min;
    iter.max = UI_CONFIG.iterations.max;
    iter.step = UI_CONFIG.iterations.step;
    engine.iterations = parseInt(iter.value);
    document.getElementById('val-iterations').innerText = iter.value;

    const ballMassEl = document.getElementById('slider-ball-mass');
    levelObj.settings.ballMass = parseFloat(ballMassEl.value);
    document.getElementById('val-ball-mass').innerText = ballMassEl.value;

    // Launch Velocity
    ['slider-vel-x', 'slider-vel-y'].forEach(id => {
        const el = document.getElementById(id);
        el.min = UI_CONFIG.velocity.min;
        el.max = UI_CONFIG.velocity.max;
        el.step = UI_CONFIG.velocity.step;
        const val = parseFloat(el.value);
        if (id === 'slider-vel-x') levelObj.settings.velX = val;
        else levelObj.settings.velY = val;
        document.getElementById(id === 'slider-vel-x' ? 'val-vel-x' : 'val-vel-y').innerText = val.toFixed(1);
    });

    // Sandbox Rope
    const sandboxMap = [
        { id: 'slider-sandbox-strength', lab: 'val-sandbox-strength', type: 'strength', config: UI_CONFIG.sandbox.strength },
        { id: 'slider-sandbox-tension', lab: 'val-sandbox-tension', type: 'tension', config: UI_CONFIG.sandbox.tension },
        { id: 'slider-sandbox-rigidity', lab: 'val-sandbox-rigidity', type: 'rigidity', config: UI_CONFIG.sandbox.rigidity },
        { id: 'slider-sandbox-segment', lab: 'val-sandbox-segment', type: 'segment', config: UI_CONFIG.sandbox.segment },
        { id: 'slider-sandbox-mass', lab: 'val-sandbox-mass', type: 'mass', config: UI_CONFIG.sandbox.mass }
    ];

    sandboxMap.forEach(item => {
        const el = document.getElementById(item.id);
        el.min = item.config.min;
        el.max = item.config.max;
        el.step = item.config.step;
        updateHUDLabel(item.id, item.lab, item.type);
    });
}

function updateHUDLabel(sliderId, labelId, type) {
    const el = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (!el || !label) return;

    const val = parseFloat(el.value);
    let text = "";

    switch (type) {
        case 'gravity':
            text = Math.round(val * 100) + "% (" + (val * 10.0).toFixed(1) + ")";
            break;
        case 'strength':
            const isInf = val >= UI_CONFIG.sandbox.strength.infiniteThreshold;
            const normalized = (val - UI_CONFIG.sandbox.strength.min) / (UI_CONFIG.sandbox.strength.max - UI_CONFIG.sandbox.strength.min);
            text = isInf ? "100% (Infinity)" : Math.round(normalized * 100) + "% (" + val.toFixed(2) + ")";
            break;
        case 'tension':
            text = Math.round(val * 100) + "% (" + val.toFixed(2) + ")";
            break;
        case 'rigidity':
            text = Math.round(val).toString();
            break;
        case 'segment':
            text = Math.round(val) + "px";
            break;
        case 'mass':
            text = val.toFixed(2);
            break;
        default:
            text = val.toString();
    }
    label.innerText = text;
}

const sandboxIds = [
    'slider-sandbox-strength',
    'slider-sandbox-tension',
    'slider-sandbox-rigidity',
    'slider-sandbox-segment',
    'slider-sandbox-mass'
];



// UI Element lock/unlock sync function
levelObj.updateUIElements = function() {
    const isSimulating = levelObj.state === 'SIMULATE';
    const isDropped = levelObj.ballDropped;

    // Disable/Enable restricted elements
    const restrictedIds = [
        'slider-sandbox-segment',
        'slider-vel-x',
        'slider-vel-y',
        'select-rope-type'
    ];
    restrictedIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = isSimulating;
    });

    // Disable/Enable buttons
    const btnStart = document.getElementById('btn-start');
    if (btnStart) btnStart.disabled = isSimulating;

    const btnDrop = document.getElementById('btn-drop');
    if (btnDrop) btnDrop.disabled = isDropped;
};

initSliders();
levelObj.initLevel();
levelObj.updateUIElements();

// Wire up weight button mouse/touch events
const weightBtn = document.getElementById('btn-increase-weight');

if (weightBtn) {
    const startIncrease = (e) => {
        e.preventDefault();
        levelObj.isIncreasingWeight = true;
    };
    const stopIncrease = (e) => {
        e.preventDefault();
        levelObj.isIncreasingWeight = false;
    };

    weightBtn.addEventListener('mousedown', startIncrease);
    weightBtn.addEventListener('touchstart', startIncrease, { passive: false });

    weightBtn.addEventListener('mouseup', stopIncrease);
    weightBtn.addEventListener('mouseleave', stopIncrease);
    weightBtn.addEventListener('touchend', stopIncrease, { passive: false });
}

// UI Event Binding
const btnStart = document.getElementById('btn-start');
if (btnStart) {
    btnStart.addEventListener('click', () => {
        levelObj.start();
    });
}

const btnStop = document.getElementById('btn-stop');
if (btnStop) {
    btnStop.addEventListener('click', () => {
        levelObj.stop();
    });
}

const btnDrop = document.getElementById('btn-drop');
if (btnDrop) {
    btnDrop.addEventListener('click', () => {
        levelObj.dropBall();
    });
}

const btnResetProps = document.getElementById('btn-reset-properties');
if (btnResetProps) {
    btnResetProps.addEventListener('click', () => {
        // Reset rope settings back to their default presets
        ropeSettings = JSON.parse(JSON.stringify(DEFAULT_ROPE_SETTINGS));

        // Reset DOM elements to defaults
        document.getElementById('slider-gravity').value = "1";
        document.getElementById('slider-iterations').value = "50";
        document.getElementById('slider-vel-x').value = "0";
        document.getElementById('slider-vel-y').value = "0";
        document.getElementById('slider-ball-mass').value = "50";

        const ropeSelect = document.getElementById('select-rope-type');
        const currentRopeType = ropeSelect ? ropeSelect.value : "rope";
        const activeSettings = ropeSettings[currentRopeType];

        document.getElementById('slider-sandbox-strength').value = activeSettings.strength;
        document.getElementById('slider-sandbox-tension').value = activeSettings.tension;
        document.getElementById('slider-sandbox-rigidity').value = activeSettings.rigidity;
        document.getElementById('slider-sandbox-segment').value = activeSettings.segment;
        document.getElementById('slider-sandbox-mass').value = activeSettings.mass;

        // Re-initialize slider variables and HUD labels
        initSliders();

        // Stop and reset the level to stopped state
        levelObj.reset();
    });
}


// Endless Simulation Checkbox Listener
const endlessCheckbox = document.getElementById('checkbox-endless');
if (endlessCheckbox) {
    endlessCheckbox.addEventListener('change', (e) => {
        levelObj.endlessMode = e.target.checked;
    });
}

// Default rope constants
const DEFAULT_ROPE_SETTINGS = {
    twine: { strength: 1.15, tension: 1.10, rigidity: 150, segment: 15, mass: 0.05 },
    rope: { strength: 1.45, tension: 1.00, rigidity: 300, segment: 20, mass: 0.20 },
    steel: { strength: 3.00, tension: 0.95, rigidity: 500, segment: 25, mass: 0.80 }
};

// Mutable active settings for each rope type
let ropeSettings = JSON.parse(JSON.stringify(DEFAULT_ROPE_SETTINGS));

// Rope Type Change Listener
const ropeTypeSelect = document.getElementById('select-rope-type');
if (ropeTypeSelect) {
    ropeTypeSelect.addEventListener('change', (e) => {
        const typePreset = ropeSettings[e.target.value];
        if (typePreset) {
            // Update all the sliders to the preset values
            document.getElementById('slider-sandbox-strength').value = typePreset.strength;
            document.getElementById('slider-sandbox-tension').value = typePreset.tension;
            document.getElementById('slider-sandbox-rigidity').value = typePreset.rigidity;
            document.getElementById('slider-sandbox-segment').value = typePreset.segment;
            document.getElementById('slider-sandbox-mass').value = typePreset.mass;

            // Update all the sandbox labels in the HUD
            updateHUDLabel('slider-sandbox-strength', 'val-sandbox-strength', 'strength');
            updateHUDLabel('slider-sandbox-tension', 'val-sandbox-tension', 'tension');
            updateHUDLabel('slider-sandbox-rigidity', 'val-sandbox-rigidity', 'rigidity');
            updateHUDLabel('slider-sandbox-segment', 'val-sandbox-segment', 'segment');
            updateHUDLabel('slider-sandbox-mass', 'val-sandbox-mass', 'mass');
        }
    });
}

// Physics Listeners
document.getElementById('slider-gravity').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    levelObj.settings.gravity = val * UI_CONFIG.gravity.displayScale;
    engine.gravity.y = levelObj.settings.gravity * 25.0; // Apply dynamically in real-time
    updateHUDLabel('slider-gravity', 'val-gravity', 'gravity');
});

document.getElementById('slider-iterations').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    engine.iterations = val;
    document.getElementById('val-iterations').innerText = val;
});

document.getElementById('slider-vel-x').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    levelObj.settings.velX = val;
    if (levelObj.state === 'STOPPED' && levelObj.vehicle) {
        levelObj.vehicle.oldPosition.x = levelObj.vehicle.position.x - (val * 0.016);
    }
    document.getElementById('val-vel-x').innerText = val.toFixed(1);
});

document.getElementById('slider-vel-y').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    levelObj.settings.velY = val;
    if (levelObj.state === 'STOPPED' && levelObj.vehicle) {
        levelObj.vehicle.oldPosition.y = levelObj.vehicle.position.y - (val * 0.016);
    }
    document.getElementById('val-vel-y').innerText = val.toFixed(1);
});

document.getElementById('slider-ball-mass').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    levelObj.settings.ballMass = val;
    if (levelObj.vehicle) {
        levelObj.vehicle.mass = val;
    }
    document.getElementById('val-ball-mass').innerText = val;
});

// Sandbox Listeners

sandboxIds.forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        const type = id.split('-').pop();

        // Save the updated property to the currently active rope settings
        const currentRopeType = document.getElementById('select-rope-type')?.value;
        if (currentRopeType && ropeSettings[currentRopeType]) {
            ropeSettings[currentRopeType][type] = val;
        }

        // --- REAL-TIME SANDBOX UPDATES ---
        if (type === 'strength') {
            let actualStrain = (val >= UI_CONFIG.sandbox.strength.infiniteThreshold) ? Infinity : val;
            engine.constraints.forEach(c => {
                if (c.ropeType === currentRopeType) c.breakingStrain = actualStrain;
            });
        } else if (type === 'tension') {
            engine.constraints.forEach(c => {
                if (c.ropeType === currentRopeType) {
                    c.tension = val;
                    c.restLength = c.drawnLength * val;
                }
            });
        } else if (type === 'rigidity') {
            engine.constraints.forEach(c => {
                if (c.ropeType === currentRopeType) {
                    c.rigidity = val;
                    if (c.rigidityToStiffness) {
                        c.stiffness = c.rigidityToStiffness(val);
                    }
                }
            });
        } else if (type === 'mass') {
            engine.nodes.forEach(n => {
                if (!n.isPinned && n !== levelObj.vehicle && n.ropeType === currentRopeType) {
                    n.mass = val;
                }
            });
            // Update inverse mass cache for ALL constraints (since nodes can be shared)
            engine.constraints.forEach(c => {
                c.invMassA = c.nodeA.isPinned ? 0 : (1.0 / c.nodeA.mass);
                c.invMassB = c.nodeB.isPinned ? 0 : (1.0 / c.nodeB.mass);
            });
        } else if (type === 'segment') {
            // We only apply segment changes to NEW ropes to avoid deleting drawn ropes.
            // The segment length is already saved in ropeSettings and will be used by StructureBuilder.
        }

        updateHUDLabel(id, `val-sandbox-${type}`, type);
    });
});

let lastTime = 0;
function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Clear Screen
    ctx.fillStyle = '#1e222b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update
    levelObj.update();

    // Render
    renderer.render(engine);
    levelObj.draw(ctx);

    // Draw drafting
    if (levelObj.state === 'BUILD') {
        builder.drawDraft(ctx);
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
