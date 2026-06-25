import { UI_CONFIG, DEFAULT_ROPE_SETTINGS } from './GameConfig.js';
import Vector2 from '../physics/Vector2.js';

export class UIManager {
    constructor(engine, levelObj) {
        this.engine = engine;
        this.levelObj = levelObj;
        this.ropeSettings = JSON.parse(JSON.stringify(DEFAULT_ROPE_SETTINGS));

        this.sandboxIds = [
            'slider-sandbox-strength',
            'slider-sandbox-tension',
            'slider-sandbox-rigidity',
            'slider-sandbox-segment',
            'slider-sandbox-mass',
            'slider-sandbox-bendAngleLimit',
            'slider-sandbox-bendingStiffness'
        ];

        // Link updateUIElements to LevelManager
        this.levelObj.updateUIElements = () => this.updateUIElements();
    }

    init() {
        this.initSliders();
        this.bindEvents();
        this.loadFromLocalStorage();
        this.updateUIElements();
    }

    initSliders() {
        // Global Physics
        const grav = document.getElementById('slider-gravity');
        const iter = document.getElementById('slider-iterations');

        if (grav) {
            grav.min = UI_CONFIG.gravity.min;
            grav.max = UI_CONFIG.gravity.max;
            grav.step = UI_CONFIG.gravity.step;
            this.levelObj.settings.gravity = parseFloat(grav.value) * UI_CONFIG.gravity.displayScale;
            this.updateHUDLabel('slider-gravity', 'val-gravity', 'gravity');
        }

        const ballGrav = document.getElementById('slider-ball-gravity');
        if (ballGrav) {
            ballGrav.min = UI_CONFIG.gravity.min;
            ballGrav.max = UI_CONFIG.gravity.max;
            ballGrav.step = UI_CONFIG.gravity.step;
            this.levelObj.settings.ballGravity = parseFloat(ballGrav.value) * UI_CONFIG.gravity.displayScale;
            this.updateHUDLabel('slider-ball-gravity', 'val-ball-gravity', 'gravity');
            this.engine.ballGravity.y = this.levelObj.settings.ballGravity * 25.0;
        }

        if (iter) {
            iter.min = UI_CONFIG.iterations.min;
            iter.max = UI_CONFIG.iterations.max;
            iter.step = UI_CONFIG.iterations.step;
            this.engine.iterations = parseInt(iter.value);
            const valIter = document.getElementById('val-iterations');
            if (valIter) valIter.innerText = iter.value;
        }

        const dragEl = document.getElementById('slider-drag');
        if (dragEl) {
            this.levelObj.settings.drag = parseFloat(dragEl.value) / 100.0;
            this.engine.drag = 1.0 - this.levelObj.settings.drag;
            const valDrag = document.getElementById('val-drag');
            if (valDrag) valDrag.innerText = dragEl.value + "%";
        }

        const ballMassEl = document.getElementById('slider-ball-mass');
        if (ballMassEl) {
            this.levelObj.settings.ballMass = parseFloat(ballMassEl.value);
            const valBallMass = document.getElementById('val-ball-mass');
            if (valBallMass) valBallMass.innerText = ballMassEl.value;
        }

        const scrollSpeedEl = document.getElementById('slider-scroll-speed');
        if (scrollSpeedEl) {
            this.levelObj.scrollSpeed = parseFloat(scrollSpeedEl.value);
            const valScrollSpeed = document.getElementById('val-scroll-speed');
            if (valScrollSpeed) valScrollSpeed.innerText = this.levelObj.scrollSpeed.toFixed(1);
        }

        // Launch Velocity
        ['slider-vel-x', 'slider-vel-y'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.min = UI_CONFIG.velocity.min;
                el.max = UI_CONFIG.velocity.max;
                el.step = UI_CONFIG.velocity.step;
                const val = parseFloat(el.value);
                if (id === 'slider-vel-x') this.levelObj.settings.velX = val;
                else this.levelObj.settings.velY = val;
                const targetLabel = document.getElementById(id === 'slider-vel-x' ? 'val-vel-x' : 'val-vel-y');
                if (targetLabel) targetLabel.innerText = val.toFixed(1);
            }
        });

        // Sandbox Rope
        const sandboxMap = [
            { id: 'slider-sandbox-strength', lab: 'val-sandbox-strength', type: 'strength', config: UI_CONFIG.sandbox.strength },
            { id: 'slider-sandbox-tension', lab: 'val-sandbox-tension', type: 'tension', config: UI_CONFIG.sandbox.tension },
            { id: 'slider-sandbox-rigidity', lab: 'val-sandbox-rigidity', type: 'rigidity', config: UI_CONFIG.sandbox.rigidity },
            { id: 'slider-sandbox-segment', lab: 'val-sandbox-segment', type: 'segment', config: UI_CONFIG.sandbox.segment },
            { id: 'slider-sandbox-mass', lab: 'val-sandbox-mass', type: 'mass', config: UI_CONFIG.sandbox.mass },
            { id: 'slider-sandbox-bendAngleLimit', lab: 'val-sandbox-bendAngleLimit', type: 'bendAngleLimit', config: UI_CONFIG.sandbox.bendAngleLimit },
            { id: 'slider-sandbox-bendingStiffness', lab: 'val-sandbox-bendingStiffness', type: 'bendingStiffness', config: UI_CONFIG.sandbox.bendingStiffness }
        ];

        sandboxMap.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                el.min = item.config.min;
                el.max = item.config.max;
                el.step = item.config.step;
                this.updateHUDLabel(item.id, item.lab, item.type);
            }
        });
    }

    updateHUDLabel(sliderId, labelId, type) {
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
                text = (val >= UI_CONFIG.sandbox.strength.infiniteThreshold) ? "Infinity" : val.toFixed(2);
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
            case 'bendAngleLimit':
                text = Math.round(val) + "°";
                break;
            case 'bendingStiffness':
                text = val.toFixed(2);
                break;
            default:
                text = val.toString();
        }
        label.innerText = text;
    }

    updateUIElements() {
        const isSimulating = this.levelObj.state === 'SIMULATE';

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
        if (btnDrop) btnDrop.disabled = false;

        const btnStartGame = document.getElementById('btn-start-game');
        if (btnStartGame) {
            btnStartGame.disabled = !isSimulating;
            btnStartGame.textContent = this.levelObj.isGameMode ? "Pause Scroll" : "Start Scroll";
        }

        const gravityModeCheckbox = document.getElementById('checkbox-gravity-mode');
        const gravityTypeItem = document.getElementById('item-gravity-type');
        if (gravityModeCheckbox && gravityTypeItem) {
            gravityModeCheckbox.checked = this.levelObj.gravityControlMode;
            gravityTypeItem.style.display = this.levelObj.gravityControlMode ? 'flex' : 'none';
        }
    }

    saveToLocalStorage() {
        const currentRopeType = document.getElementById('select-rope-type')?.value || "rope";
        if (this.ropeSettings[currentRopeType]) {
            this.ropeSettings[currentRopeType].strength = parseFloat(document.getElementById('slider-sandbox-strength')?.value || "6.5");
            this.ropeSettings[currentRopeType].tension = parseFloat(document.getElementById('slider-sandbox-tension')?.value || "1.0");
            this.ropeSettings[currentRopeType].rigidity = parseFloat(document.getElementById('slider-sandbox-rigidity')?.value || "300");
            this.ropeSettings[currentRopeType].segment = parseFloat(document.getElementById('slider-sandbox-segment')?.value || "5");
            this.ropeSettings[currentRopeType].mass = parseFloat(document.getElementById('slider-sandbox-mass')?.value || "0.2");
            this.ropeSettings[currentRopeType].bendAngleLimit = parseFloat(document.getElementById('slider-sandbox-bendAngleLimit')?.value || "90");
            this.ropeSettings[currentRopeType].bendingStiffness = parseFloat(document.getElementById('slider-sandbox-bendingStiffness')?.value || "0.4");
        }

        const globals = {
            gravity: document.getElementById('slider-gravity')?.value || "1",
            ballGravity: document.getElementById('slider-ball-gravity')?.value || "1",
            iterations: document.getElementById('slider-iterations')?.value || "50",
            drag: document.getElementById('slider-drag')?.value || "0.8",
            velX: document.getElementById('slider-vel-x')?.value || "0",
            velY: document.getElementById('slider-vel-y')?.value || "0",
            ballMass: document.getElementById('slider-ball-mass')?.value || "50",
            scrollSpeed: document.getElementById('slider-scroll-speed')?.value || "1.0",
            endless: document.getElementById('checkbox-endless')?.checked !== false,
            ropeType: currentRopeType,
            gravityMode: document.getElementById('checkbox-gravity-mode')?.checked || false,
            gravityType: document.getElementById('select-gravity-type')?.value || "vector"
        };
        localStorage.setItem('ropeSwing_globals', JSON.stringify(globals));
        localStorage.setItem('ropeSwing_ropeSettings', JSON.stringify(this.ropeSettings));

        // Apply these settings to the engine constraints/nodes immediately
        this.applyRopeSettingsToEngine(currentRopeType);
        
        const saveBtn = document.getElementById('btn-save-settings');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = "Saved!";
            saveBtn.style.borderColor = "#64ffda";
            saveBtn.style.color = "#64ffda";
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.borderColor = "";
                saveBtn.style.color = "";
            }, 1500);
        }
    }

    applyRopeSettingsToEngine(ropeType) {
        const typePreset = this.ropeSettings[ropeType];
        if (!typePreset) return;

        // Apply strength
        let actualStrain = (typePreset.strength >= UI_CONFIG.sandbox.strength.infiniteThreshold) ? Infinity : typePreset.strength;
        this.engine.constraints.forEach(c => {
            if (c.ropeType === ropeType) c.breakingStrain = actualStrain;
        });

        // Apply tension and rigidity (DistanceConstraint only)
        this.engine.constraints.forEach(c => {
            if (c.ropeType === ropeType && c.drawnLength !== undefined) {
                c.tension = typePreset.tension;
                c.restLength = c.drawnLength * typePreset.tension;
                
                c.rigidity = typePreset.rigidity;
                if (c.rigidityToStiffness) {
                    c.stiffness = c.rigidityToStiffness(typePreset.rigidity);
                }
            }
        });

        // Apply mass to nodes
        this.engine.nodes.forEach(n => {
            if (!n.isPinned && n !== this.levelObj.vehicle && n.ropeType === ropeType) {
                n.mass = typePreset.mass;
            }
        });

        // Recompute invMass values for constraints
        this.engine.constraints.forEach(c => {
            if (c.nodeA && c.nodeB) {
                c.invMassA = c.nodeA.isPinned ? 0 : (1.0 / c.nodeA.mass);
                if (c.invMassB !== undefined) {
                    c.invMassB = c.nodeB.isPinned ? 0 : (1.0 / c.nodeB.mass);
                }
                if (c.invMassC !== undefined && c.nodeC) {
                    c.invMassC = c.nodeC.isPinned ? 0 : (1.0 / c.nodeC.mass);
                }
            }
        });

        // Apply bendAngleLimit and bendingStiffness (BendingConstraint only)
        this.engine.constraints.forEach(c => {
            if (c.ropeType === ropeType && c.setAngleLimit !== undefined) {
                c.setAngleLimit(typePreset.bendAngleLimit);
                c.stiffness = typePreset.bendingStiffness;
            }
        });
    }

    loadFromLocalStorage() {
        const globalsStr = localStorage.getItem('ropeSwing_globals');
        const ropeSettingsStr = localStorage.getItem('ropeSwing_ropeSettings');
        
        const setValAndDispatch = (id, val, evType = 'input') => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') el.checked = val;
                else el.value = val;
                el.dispatchEvent(new Event(evType));
            }
        };

        if (ropeSettingsStr) {
            this.ropeSettings = JSON.parse(ropeSettingsStr);
        }

        if (globalsStr) {
            const globals = JSON.parse(globalsStr);
            setValAndDispatch('slider-gravity', globals.gravity);
            setValAndDispatch('slider-ball-gravity', globals.ballGravity);
            setValAndDispatch('slider-iterations', globals.iterations);
            setValAndDispatch('slider-drag', globals.drag);
            setValAndDispatch('slider-vel-x', globals.velX);
            setValAndDispatch('slider-vel-y', globals.velY);
            setValAndDispatch('slider-ball-mass', globals.ballMass);
            setValAndDispatch('slider-scroll-speed', globals.scrollSpeed);
            setValAndDispatch('checkbox-endless', globals.endless, 'change');
            setValAndDispatch('select-rope-type', globals.ropeType, 'change');
            setValAndDispatch('checkbox-gravity-mode', globals.gravityMode || false, 'change');
            setValAndDispatch('select-gravity-type', globals.gravityType || "vector", 'change');
        }
        
        const currentRopeType = document.getElementById('select-rope-type')?.value || "rope";
        const typePreset = this.ropeSettings[currentRopeType];
        if (typePreset) {
            setValAndDispatch('slider-sandbox-strength', typePreset.strength);
            setValAndDispatch('slider-sandbox-tension', typePreset.tension);
            setValAndDispatch('slider-sandbox-rigidity', typePreset.rigidity);
            setValAndDispatch('slider-sandbox-segment', typePreset.segment);
            setValAndDispatch('slider-sandbox-mass', typePreset.mass);
            setValAndDispatch('slider-sandbox-bendAngleLimit', typePreset.bendAngleLimit);
            setValAndDispatch('slider-sandbox-bendingStiffness', typePreset.bendingStiffness);
        }
    }

    bindEvents() {
        // UI Buttons
        document.getElementById('btn-start')?.addEventListener('click', () => {
            this.levelObj.start();
        });

        document.getElementById('btn-stop')?.addEventListener('click', () => {
            this.levelObj.stop();
        });

        document.getElementById('btn-drop')?.addEventListener('click', () => {
            this.levelObj.dropBall();
        });

        document.getElementById('btn-start-game')?.addEventListener('click', () => {
            this.levelObj.toggleGameMode();
        });

        document.getElementById('btn-save-settings')?.addEventListener('click', () => {
            this.saveToLocalStorage();
        });

        document.getElementById('btn-reset-properties')?.addEventListener('click', () => {
            if (localStorage.getItem('ropeSwing_globals') || localStorage.getItem('ropeSwing_ropeSettings')) {
                this.loadFromLocalStorage();
            } else {
                this.ropeSettings = JSON.parse(JSON.stringify(DEFAULT_ROPE_SETTINGS));

                if (document.getElementById('slider-gravity')) document.getElementById('slider-gravity').value = "1";
                if (document.getElementById('slider-ball-gravity')) document.getElementById('slider-ball-gravity').value = "1";
                if (document.getElementById('slider-iterations')) document.getElementById('slider-iterations').value = "50";
                if (document.getElementById('slider-drag')) document.getElementById('slider-drag').value = "0.8";
                if (document.getElementById('slider-vel-x')) document.getElementById('slider-vel-x').value = "0";
                if (document.getElementById('slider-vel-y')) document.getElementById('slider-vel-y').value = "0";
                if (document.getElementById('slider-ball-mass')) document.getElementById('slider-ball-mass').value = "50";

                const ropeSelect = document.getElementById('select-rope-type');
                const currentRopeType = ropeSelect ? ropeSelect.value : "rope";
                const activeSettings = this.ropeSettings[currentRopeType];

                if (activeSettings) {
                    if (document.getElementById('slider-sandbox-strength')) document.getElementById('slider-sandbox-strength').value = activeSettings.strength;
                    if (document.getElementById('slider-sandbox-tension')) document.getElementById('slider-sandbox-tension').value = activeSettings.tension;
                    if (document.getElementById('slider-sandbox-rigidity')) document.getElementById('slider-sandbox-rigidity').value = activeSettings.rigidity;
                    if (document.getElementById('slider-sandbox-segment')) document.getElementById('slider-sandbox-segment').value = activeSettings.segment;
                    if (document.getElementById('slider-sandbox-mass')) document.getElementById('slider-sandbox-mass').value = activeSettings.mass;
                    if (document.getElementById('slider-sandbox-bendAngleLimit')) document.getElementById('slider-sandbox-bendAngleLimit').value = activeSettings.bendAngleLimit;
                    if (document.getElementById('slider-sandbox-bendingStiffness')) document.getElementById('slider-sandbox-bendingStiffness').value = activeSettings.bendingStiffness;
                }
            }

            this.initSliders();
            this.levelObj.reset();
        });

        // Endless Simulation Checkbox
        document.getElementById('checkbox-endless')?.addEventListener('change', (e) => {
            this.levelObj.endlessMode = e.target.checked;
        });

        // Rope Type Selection
        const ropeTypeSelect = document.getElementById('select-rope-type');
        if (ropeTypeSelect) {
            ropeTypeSelect.addEventListener('change', (e) => {
                const typePreset = this.ropeSettings[e.target.value];
                if (typePreset) {
                    document.getElementById('slider-sandbox-strength').value = typePreset.strength;
                    document.getElementById('slider-sandbox-tension').value = typePreset.tension;
                    document.getElementById('slider-sandbox-rigidity').value = typePreset.rigidity;
                    document.getElementById('slider-sandbox-segment').value = typePreset.segment;
                    document.getElementById('slider-sandbox-mass').value = typePreset.mass;
                    document.getElementById('slider-sandbox-bendAngleLimit').value = typePreset.bendAngleLimit;
                    document.getElementById('slider-sandbox-bendingStiffness').value = typePreset.bendingStiffness;

                    this.updateHUDLabel('slider-sandbox-strength', 'val-sandbox-strength', 'strength');
                    this.updateHUDLabel('slider-sandbox-tension', 'val-sandbox-tension', 'tension');
                    this.updateHUDLabel('slider-sandbox-rigidity', 'val-sandbox-rigidity', 'rigidity');
                    this.updateHUDLabel('slider-sandbox-segment', 'val-sandbox-segment', 'segment');
                    this.updateHUDLabel('slider-sandbox-mass', 'val-sandbox-mass', 'mass');
                    this.updateHUDLabel('slider-sandbox-bendAngleLimit', 'val-sandbox-bendAngleLimit', 'bendAngleLimit');
                    this.updateHUDLabel('slider-sandbox-bendingStiffness', 'val-sandbox-bendingStiffness', 'bendingStiffness');

                    // Apply newly selected rope type preset settings to engine
                    this.applyRopeSettingsToEngine(e.target.value);
                }
            });
        }

        // Global Gravity Slider
        document.getElementById('slider-gravity')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.settings.gravity = val * UI_CONFIG.gravity.displayScale;
            const mag = this.levelObj.settings.gravity * 25.0;
            const currentDir = this.engine.gravity.normalize();
            if (currentDir.mag() === 0) {
                this.engine.gravity = new Vector2(0, mag);
            } else {
                this.engine.gravity = currentDir.mul(mag);
            }
            this.updateHUDLabel('slider-gravity', 'val-gravity', 'gravity');
        });

        // Ball Gravity Slider
        document.getElementById('slider-ball-gravity')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.settings.ballGravity = val * UI_CONFIG.gravity.displayScale;
            this.engine.ballGravity.y = this.levelObj.settings.ballGravity * 25.0;
            this.updateHUDLabel('slider-ball-gravity', 'val-ball-gravity', 'gravity');
        });

        // Gravity Control Mode
        const gravityModeCheckbox = document.getElementById('checkbox-gravity-mode');
        const gravityTypeItem = document.getElementById('item-gravity-type');
        const gravityTypeSelect = document.getElementById('select-gravity-type');

        if (gravityModeCheckbox) {
            gravityModeCheckbox.addEventListener('change', (e) => {
                const isEnabled = e.target.checked;
                this.levelObj.gravityControlMode = isEnabled;
                if (gravityTypeItem) {
                    gravityTypeItem.style.display = isEnabled ? 'flex' : 'none';
                }
                if (!isEnabled) {
                    this.engine.gravity.x = 0;
                    this.engine.gravity.y = this.levelObj.settings.gravity * 25.0;
                    this.engine.gravityAttractorPoint = null;
                } else {
                    if (gravityTypeSelect) {
                        this.levelObj.gravityType = gravityTypeSelect.value;
                    }
                }
            });
        }

        if (gravityTypeSelect) {
            gravityTypeSelect.addEventListener('change', (e) => {
                this.levelObj.gravityType = e.target.value;
                this.engine.gravityAttractorPoint = null;
                this.engine.gravity.x = 0;
                this.engine.gravity.y = this.levelObj.settings.gravity * 25.0;
            });
        }

        // Air Resistance / Drag Slider
        document.getElementById('slider-drag')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.settings.drag = val / 100.0;
            this.engine.drag = 1.0 - this.levelObj.settings.drag;
            const valDrag = document.getElementById('val-drag');
            if (valDrag) valDrag.innerText = val.toFixed(1) + "%";
        });

        // Engine Iterations
        document.getElementById('slider-iterations')?.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.engine.iterations = val;
            const valIter = document.getElementById('val-iterations');
            if (valIter) valIter.innerText = val;
        });

        // Launch Vel X
        document.getElementById('slider-vel-x')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.settings.velX = val;
            if (this.levelObj.state === 'STOPPED' && this.levelObj.vehicle) {
                this.levelObj.vehicle.oldPosition.x = this.levelObj.vehicle.position.x - (val * 0.016);
            }
            const valVelX = document.getElementById('val-vel-x');
            if (valVelX) valVelX.innerText = val.toFixed(1);
        });

        // Launch Vel Y
        document.getElementById('slider-vel-y')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.settings.velY = val;
            if (this.levelObj.state === 'STOPPED' && this.levelObj.vehicle) {
                this.levelObj.vehicle.oldPosition.y = this.levelObj.vehicle.position.y - (val * 0.016);
            }
            const valVelY = document.getElementById('val-vel-y');
            if (valVelY) valVelY.innerText = val.toFixed(1);
        });

        // Ball Mass
        document.getElementById('slider-ball-mass')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.settings.ballMass = val;
            if (this.levelObj.vehicle) {
                this.levelObj.vehicle.mass = val;
            }
            const valBallMass = document.getElementById('val-ball-mass');
            if (valBallMass) valBallMass.innerText = val;
        });

        // Scroll Speed
        document.getElementById('slider-scroll-speed')?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.levelObj.scrollSpeed = val;
            const valScrollSpeed = document.getElementById('val-scroll-speed');
            if (valScrollSpeed) valScrollSpeed.innerText = val.toFixed(1);
        });

        // Sandbox Ropes Live Updates
        this.sandboxIds.forEach(id => {
            document.getElementById(id)?.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                const type = id.split('-').pop();

                const currentRopeType = document.getElementById('select-rope-type')?.value;
                if (currentRopeType && this.ropeSettings[currentRopeType]) {
                    this.ropeSettings[currentRopeType][type] = val;
                }

                // Live update existing engine nodes/constraints
                if (type === 'strength') {
                    let actualStrain = (val >= UI_CONFIG.sandbox.strength.infiniteThreshold) ? Infinity : val;
                    this.engine.constraints.forEach(c => {
                        if (c.ropeType === currentRopeType) c.breakingStrain = actualStrain;
                    });
                } else if (type === 'tension') {
                    this.engine.constraints.forEach(c => {
                        if (c.ropeType === currentRopeType && c.drawnLength !== undefined) {
                            c.tension = val;
                            c.restLength = c.drawnLength * val;
                        }
                    });
                } else if (type === 'rigidity') {
                    this.engine.constraints.forEach(c => {
                        if (c.ropeType === currentRopeType && c.drawnLength !== undefined) {
                            c.rigidity = val;
                            if (c.rigidityToStiffness) {
                                c.stiffness = c.rigidityToStiffness(val);
                            }
                        }
                    });
                } else if (type === 'mass') {
                    this.engine.nodes.forEach(n => {
                        if (!n.isPinned && n !== this.levelObj.vehicle && n.ropeType === currentRopeType) {
                            n.mass = val;
                        }
                    });
                    this.engine.constraints.forEach(c => {
                        if (c.nodeA && c.nodeB) {
                            c.invMassA = c.nodeA.isPinned ? 0 : (1.0 / c.nodeA.mass);
                            if (c.invMassB !== undefined) {
                                c.invMassB = c.nodeB.isPinned ? 0 : (1.0 / c.nodeB.mass);
                            }
                            if (c.invMassC !== undefined && c.nodeC) {
                                c.invMassC = c.nodeC.isPinned ? 0 : (1.0 / c.nodeC.mass);
                            }
                        }
                    });
                } else if (type === 'bendAngleLimit') {
                    this.engine.constraints.forEach(c => {
                        if (c.ropeType === currentRopeType && c.setAngleLimit !== undefined) {
                            c.setAngleLimit(val);
                        }
                    });
                } else if (type === 'bendingStiffness') {
                    this.engine.constraints.forEach(c => {
                        if (c.ropeType === currentRopeType && c.setAngleLimit !== undefined) {
                            c.stiffness = val;
                        }
                    });
                }

                this.updateHUDLabel(id, `val-sandbox-${type}`, type);
            });
        });
    }
}
