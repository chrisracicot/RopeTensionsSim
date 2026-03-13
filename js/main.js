/* --- CONFIGURATION --- */
const UI_CONFIG = {
    gravity: { min: 0, max: 1, step: 0.01, displayScale: 10 },
    velocity: { min: -100, max: 100, step: 1 },
    strength: { min: 0, max: 3, step: 0.01, infiniteThreshold: 3.0 },
    tension: { min: 0.01, max: 1.0, step: 0.01 }
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

const engine = new VerletEngine(10.0); // Gravity
const builder = new StructureBuilder(engine, []);
const levelObj = new LevelManager(engine, builder);
const renderer = new RopeRenderer(ctx);

// Initialize slider attributes from config
function initSliders() {
    // Gravity
    const grav = document.getElementById('slider-gravity');
    grav.min = UI_CONFIG.gravity.min;
    grav.max = UI_CONFIG.gravity.max;
    grav.step = UI_CONFIG.gravity.step;
    levelObj.settings.gravity = parseFloat(grav.value) * UI_CONFIG.gravity.displayScale;
    updateHUDLabel('slider-gravity', 'val-gravity', 'gravity');

    // Velocity
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

    // Strength
    ['twine', 'hemp', 'steel'].forEach(mat => {
        const id = `slider-tough-${mat}`;
        const el = document.getElementById(id);
        el.min = UI_CONFIG.strength.min;
        el.max = UI_CONFIG.strength.max;
        el.step = UI_CONFIG.strength.step;
        updateHUDLabel(id, `val-tough-${mat}`, 'strength');

        const val = parseFloat(el.value);
        const isInf = val >= UI_CONFIG.strength.infiniteThreshold;
        builder.materials[mat].breakingStrain = isInf ? Infinity : val;
    });

    // Tension
    ['twine', 'hemp', 'steel'].forEach(mat => {
        const id = `slider-tension-${mat}`;
        const el = document.getElementById(id);
        el.min = UI_CONFIG.tension.min;
        el.max = UI_CONFIG.tension.max;
        el.step = UI_CONFIG.tension.step;
        updateHUDLabel(id, `val-tension-${mat}`, 'tension');

        builder.materials[mat].preTension = parseFloat(el.value);
    });
}

function updateHUDLabel(sliderId, labelId, type) {
    const el = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    const val = parseFloat(el.value);

    let text = "";
    if (type === 'gravity') {
        const percent = Math.round((val / UI_CONFIG.gravity.max) * 100);
        text = percent + "%";
    } else if (type === 'strength') {
        const isInf = val >= UI_CONFIG.strength.infiniteThreshold;
        const percent = Math.round((val / UI_CONFIG.strength.max) * 100);
        text = isInf ? "100%" : percent + "%"; // In case threshold is slightly below max
        if (val === UI_CONFIG.strength.max) text = "100%";
    } else if (type === 'tension') {
        const percent = Math.round(((val - UI_CONFIG.tension.min) / (UI_CONFIG.tension.max - UI_CONFIG.tension.min)) * 100);
        text = percent + "%";
    }
    label.innerText = text;
}

initSliders();

levelObj.initLevel();

// Mouse tracking
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousedown', (e) => {
    if (levelObj.state !== 'BUILD') return;
    builder.onMouseDown(new Vector2(e.clientX, e.clientY));
});

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    builder.onMouseMove(new Vector2(mouseX, mouseY));
});

canvas.addEventListener('mouseup', (e) => {
    if (levelObj.state !== 'BUILD') return;
    builder.onMouseUp(new Vector2(e.clientX, e.clientY), (cost) => {
        return levelObj.requestBuild(cost);
    });
});

// UI Event Binding
document.getElementById('btn-simulate').addEventListener('click', () => {
    levelObj.startSimulation();
});

document.getElementById('btn-reset').addEventListener('click', () => {
    levelObj.reset();
});

document.getElementById('btn-next').addEventListener('click', () => {
    levelObj.reset();
    // In a full game, this would load level 2 instead of resetting level 1
});

document.getElementById('select-material').addEventListener('change', (e) => {
    builder.setMaterial(e.target.value);
});

// Physics Parameter Listeners
document.getElementById('slider-gravity').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const displayVal = val * UI_CONFIG.gravity.displayScale;
    levelObj.settings.gravity = displayVal;
    updateHUDLabel('slider-gravity', 'val-gravity', 'gravity');
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

// Rope Toughness Listeners
document.getElementById('slider-tough-twine').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const isInf = val >= UI_CONFIG.strength.infiniteThreshold;
    builder.materials.twine.breakingStrain = isInf ? Infinity : val;
    updateHUDLabel('slider-tough-twine', 'val-tough-twine', 'strength');
});

document.getElementById('slider-tough-hemp').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const isInf = val >= UI_CONFIG.strength.infiniteThreshold;
    builder.materials.hemp.breakingStrain = isInf ? Infinity : val;
    updateHUDLabel('slider-tough-hemp', 'val-tough-hemp', 'strength');
});

document.getElementById('slider-tough-steel').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    const isInf = val >= UI_CONFIG.strength.infiniteThreshold;
    builder.materials.steel.breakingStrain = isInf ? Infinity : val;
    updateHUDLabel('slider-tough-steel', 'val-tough-steel', 'strength');
});

// Rope Tension Listeners
document.getElementById('slider-tension-twine').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.twine.preTension = val;
    updateHUDLabel('slider-tension-twine', 'val-tension-twine', 'tension');
});

document.getElementById('slider-tension-hemp').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.hemp.preTension = val;
    updateHUDLabel('slider-tension-hemp', 'val-tension-hemp', 'tension');
});

document.getElementById('slider-tension-steel').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.steel.preTension = val;
    updateHUDLabel('slider-tension-steel', 'val-tension-steel', 'tension');
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
