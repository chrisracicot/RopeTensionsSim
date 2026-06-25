import VerletEngine from './physics/VerletEngine.js';
import StructureBuilder from './core/StructureBuilder.js';
import LevelManager from './core/LevelManager.js';
import { GameRenderer } from './rendering/GameRenderer.js';
import { UIManager } from './core/UIManager.js';
import { InputController } from './core/InputController.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper && canvas) {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const engine = new VerletEngine(10.0);
const builder = new StructureBuilder(engine, []);
const levelObj = new LevelManager(engine, builder);
const uiManager = new UIManager(engine, levelObj);
const inputController = new InputController(canvas, engine, levelObj);
const renderer = new GameRenderer(ctx, engine, levelObj, inputController);

// Wire resetting in inputController to level reset/init
const originalInitLevel = levelObj.initLevel;
levelObj.initLevel = function() {
    inputController.reset();
    originalInitLevel.call(levelObj);
};

// Initialize UI and Game State
uiManager.init();
levelObj.initLevel();

let lastTime = 0;
function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Update Level manager
    levelObj.update();

    // Render Scene
    renderer.render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
