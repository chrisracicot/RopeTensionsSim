/* --- CONFIGURATION --- */
const UI_CONFIG = {
    gravity: { min: 0, max: 2, step: 0.01, displayScale: 10 },
    iterations: { min: 10, max: 100, step: 1 },
    velocity: { min: -100, max: 100, step: 1 },

    // Sandbox Rope ranges
    sandbox: {
        strength: { min: 0.50, max: 6.50, step: 0.05, infiniteThreshold: 6.45 },
        tension: { min: 0.90, max: 1.15, step: 0.01 },
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
            text = Math.round((val / UI_CONFIG.gravity.max) * 100) + "%";
            break;
        case 'strength':
            const isInf = val >= UI_CONFIG.sandbox.strength.infiniteThreshold;
            const normalized = (val - UI_CONFIG.sandbox.strength.min) / (UI_CONFIG.sandbox.strength.max - UI_CONFIG.sandbox.strength.min);
            text = isInf ? "100%" : Math.round(normalized * 100) + "%";
            break;
        case 'tension':
            text = Math.round(val * 100) + "%";
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

function initSliders() {
    sandboxIds.forEach(id => {
        const val = document.getElementById(id).value;
        const type = id.split('-').pop();
        updateHUDLabel(id, `val-sandbox-${type}`, type);
    });
}

initSliders();
levelObj.initLevel();

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
document.getElementById('btn-reset').addEventListener('click', () => {
    levelObj.reset();
});

// Physics Listeners
document.getElementById('slider-gravity').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    levelObj.settings.gravity = val * UI_CONFIG.gravity.displayScale;
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
    document.getElementById('val-vel-x').innerText = val.toFixed(1);
});

document.getElementById('slider-vel-y').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    levelObj.settings.velY = val;
    document.getElementById('val-vel-y').innerText = val.toFixed(1);
});

// Sandbox Listeners

sandboxIds.forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        const type = id.split('-').pop();

        // --- REAL-TIME SANDBOX UPDATES ---
        if (type === 'strength') {
            let actualStrain = (val >= UI_CONFIG.sandbox.strength.infiniteThreshold) ? Infinity : val;
            engine.constraints.forEach(c => c.breakingStrain = actualStrain);
        } else if (type === 'rigidity') {
            engine.constraints.forEach(c => c.rigidity = val);
        } else if (type === 'mass') {
            engine.nodes.forEach(n => {
                if (!n.isPinned && n !== levelObj.vehicle) {
                    n.mass = val;
                }
            });
            // Update inverse mass cache since node mass changed
            engine.constraints.forEach(c => {
                c.invMassA = c.nodeA.isPinned ? 0 : (1.0 / c.nodeA.mass);
                c.invMassB = c.nodeB.isPinned ? 0 : (1.0 / c.nodeB.mass);
            });
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
