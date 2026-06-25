import Vector2 from '../physics/Vector2.js';
import DistanceConstraint from '../physics/DistanceConstraint.js';
import VerletNode from '../physics/VerletNode.js';

export class InputController {
    constructor(canvas, engine, levelObj) {
        this.canvas = canvas;
        this.engine = engine;
        this.levelObj = levelObj;

        this.draggedNode = null;
        this.mouseNode = null;
        this.mouseConstraint = null;
        this.dragSlideDirection = null;
        this.dragSlideAccumulator = 0;
        this.dragStartPosition = null;

        this.setupListeners();
    }

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseDown(new Vector2(x, y));
        });

        window.addEventListener('mousemove', (e) => {
            if (this.levelObj.state === 'SIMULATE' && this.draggedNode) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.handleMouseMove(new Vector2(x, y));
            }
        });

        window.addEventListener('mouseup', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseUp(new Vector2(x, y));
        });
    }

    reset() {
        if (this.mouseConstraint) {
            let idx = this.engine.constraints.indexOf(this.mouseConstraint);
            if (idx !== -1) {
                this.engine.constraints.splice(idx, 1);
            }
        }
        this.draggedNode = null;
        this.mouseNode = null;
        this.mouseConstraint = null;
        this.dragSlideDirection = null;
        this.dragSlideAccumulator = 0;
    }

    handleMouseDown(v) {
        if (this.levelObj.state !== 'SIMULATE') return;

        // Prevent dragging if clicking near an anchor point
        for (let a of this.levelObj.builder.anchors) {
            if (a.position.distanceTo(v) < 25) {
                return;
            }
        }

        // Check for node dragging
        let nearestNode = null;
        let minDist = 30; // Drag radius threshold

        for (let n of this.engine.nodes) {
            if (n.isPinned) continue; // Cannot drag pinned nodes

            // Do not allow dragging the vehicle directly
            if (n === this.levelObj.vehicle) continue;

            let d = n.position.distanceTo(v);
            if (d < minDist) {
                minDist = d;
                nearestNode = n;
            }
        }

        if (nearestNode) {
            this.draggedNode = nearestNode;

            // Create virtual node for mouse
            this.mouseNode = new VerletNode(v.x, v.y, true);
            this.mouseNode.mass = 1.0;

            // Link mouse to dragged node
            this.mouseConstraint = new DistanceConstraint(this.mouseNode, this.draggedNode, {
                rigidity: 200,
                slackMultiplier: 1.0,
                tensionVal: 0.1,
                ropeType: 'mouse'
            });
            this.mouseConstraint.restLength = 0;

            this.engine.addConstraint(this.mouseConstraint);
            this.dragSlideDirection = null;
            this.dragSlideAccumulator = 0;
        }
    }

    getNeighbors(node) {
        let neighbors = [];
        for (let c of this.engine.constraints) {
            if (c.isBroken) continue;
            if (!(c instanceof DistanceConstraint)) continue;
            if (c.ropeType === 'mouse') continue;

            if (c.nodeA === node) {
                neighbors.push({ node: c.nodeB, constraint: c });
            } else if (c.nodeB === node) {
                neighbors.push({ node: c.nodeA, constraint: c });
            }
        }
        return neighbors;
    }

    handleMouseMove(v) {
        if (this.draggedNode) {
            let dv = v.sub(this.mouseNode.position);
            let neighbors = this.getNeighbors(this.draggedNode);

            if (!this.dragSlideDirection) {
                let bestProj = -Infinity;
                let bestNeighborObj = null;

                for (let nObj of neighbors) {
                    let neighbor = nObj.node;
                    let dir = neighbor.position.sub(this.draggedNode.position).normalize();
                    let proj = dv.x * dir.x + dv.y * dir.y;
                    if (proj > bestProj) {
                        bestProj = proj;
                        bestNeighborObj = nObj;
                    }
                }

                if (bestNeighborObj && bestProj > 0) {
                    this.dragSlideDirection = bestNeighborObj.node;
                    this.dragSlideAccumulator = bestProj;
                }
            } else {
                let dirTarget = this.dragSlideDirection.position.sub(this.draggedNode.position).normalize();
                let projTarget = dv.x * dirTarget.x + dv.y * dirTarget.y;
                this.dragSlideAccumulator += projTarget;

                if (this.dragSlideAccumulator < 0) {
                    let otherNeighbors = neighbors.filter(n => n.node !== this.dragSlideDirection);
                    let bestProj = -Infinity;
                    let bestNeighborObj = null;

                    for (let nObj of otherNeighbors) {
                        let neighbor = nObj.node;
                        let dir = neighbor.position.sub(this.draggedNode.position).normalize();
                        let proj = dv.x * dir.x + dv.y * dir.y;
                        if (proj > bestProj) {
                            bestProj = proj;
                            bestNeighborObj = nObj;
                        }
                    }

                    if (bestNeighborObj && bestProj > 0) {
                        this.dragSlideDirection = bestNeighborObj.node;
                        this.dragSlideAccumulator = bestProj;
                    } else {
                        this.dragSlideAccumulator = 0;
                        this.dragSlideDirection = null;
                    }
                }
            }

            if (this.dragSlideDirection) {
                let currentConstraint = null;
                for (let c of this.engine.constraints) {
                    if (c.isBroken) continue;
                    if ((c.nodeA === this.draggedNode && c.nodeB === this.dragSlideDirection) ||
                        (c.nodeB === this.draggedNode && c.nodeA === this.dragSlideDirection)) {
                        currentConstraint = c;
                        break;
                    }
                }

                if (currentConstraint) {
                    let threshold = currentConstraint.restLength;
                    while (this.dragSlideAccumulator > threshold) {
                        this.dragSlideAccumulator -= threshold;
                        let oldNode = this.draggedNode;
                        this.draggedNode = this.dragSlideDirection;

                        if (this.mouseConstraint) {
                            this.mouseConstraint.nodeB = this.draggedNode;
                            this.mouseConstraint.invMassB = this.draggedNode.isPinned ? 0 : (1.0 / (this.draggedNode.mass || 1.0));
                        }

                        let newNeighbors = this.getNeighbors(this.draggedNode);
                        let nextNeighbors = newNeighbors.filter(n => n.node !== oldNode);

                        if (nextNeighbors.length === 0) {
                            this.dragSlideAccumulator = 0;
                            this.dragSlideDirection = null;
                            break;
                        }

                        let bestProj = -Infinity;
                        let bestNeighborObj = null;

                        for (let nObj of nextNeighbors) {
                            let neighbor = nObj.node;
                            let dir = neighbor.position.sub(this.draggedNode.position).normalize();
                            let proj = dv.x * dir.x + dv.y * dir.y;
                            if (proj > bestProj) {
                                bestProj = proj;
                                bestNeighborObj = nObj;
                            }
                        }

                        if (bestNeighborObj && bestProj > 0) {
                            this.dragSlideDirection = bestNeighborObj.node;
                            let nextConstraint = null;
                            for (let c of this.engine.constraints) {
                                if (c.isBroken) continue;
                                if ((c.nodeA === this.draggedNode && c.nodeB === this.dragSlideDirection) ||
                                    (c.nodeB === this.draggedNode && c.nodeA === this.dragSlideDirection)) {
                                    nextConstraint = c;
                                    break;
                                }
                            }
                            if (nextConstraint) {
                                threshold = nextConstraint.restLength;
                            } else {
                                this.dragSlideAccumulator = 0;
                                this.dragSlideDirection = null;
                                break;
                            }
                        } else {
                            this.dragSlideAccumulator = 0;
                            this.dragSlideDirection = null;
                            break;
                        }
                    }
                }
            }

            if (this.mouseNode) {
                this.mouseNode.position.x = v.x;
                this.mouseNode.position.y = v.y;
                this.mouseNode.oldPosition.x = v.x;
                this.mouseNode.oldPosition.y = v.y;
            }
        }
    }

    handleMouseUp(v) {
        if (this.draggedNode) {
            if (this.mouseConstraint) {
                let idx = this.engine.constraints.indexOf(this.mouseConstraint);
                if (idx !== -1) {
                    this.engine.constraints.splice(idx, 1);
                }
            }
            this.draggedNode = null;
            this.mouseNode = null;
            this.mouseConstraint = null;
            this.dragSlideAccumulator = 0;
            this.dragSlideDirection = null;
        }
    }
}
