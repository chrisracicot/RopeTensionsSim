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
    const displayVal = val * 10;
    levelObj.settings.gravity = displayVal;
    document.getElementById('val-gravity').innerText = displayVal.toFixed(1);
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
    builder.materials.twine.breakingStrain = val;
    document.getElementById('val-tough-twine').innerText = val.toFixed(2);
});

document.getElementById('slider-tough-hemp').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.hemp.breakingStrain = val;
    document.getElementById('val-tough-hemp').innerText = val.toFixed(2);
});

document.getElementById('slider-tough-steel').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.steel.breakingStrain = val;
    document.getElementById('val-tough-steel').innerText = val.toFixed(2);
});

// Rope Tension Listeners
document.getElementById('slider-tension-twine').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.twine.stiffness = val;
    document.getElementById('val-tension-twine').innerText = val.toFixed(2);
});

document.getElementById('slider-tension-hemp').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.hemp.stiffness = val;
    document.getElementById('val-tension-hemp').innerText = val.toFixed(2);
});

document.getElementById('slider-tension-steel').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    builder.materials.steel.stiffness = val;
    document.getElementById('val-tension-steel').innerText = val.toFixed(2);
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
