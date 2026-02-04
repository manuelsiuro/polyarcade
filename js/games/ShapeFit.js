import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class ShapeFit extends Game {
    constructor(app) {
        super(app);
        this.name = 'Shape Fit';

        // Game Constants
        this.speed = 10;
        this.spawnTimer = 0;
        this.spawnInterval = 3; // Seconds
        this.walls = [];
        this.passedCount = 0;

        // Player State
        this.targetRotation = 0; // 0, 90, 180, 270 (Z axis)
        this.currentRotation = 0;

        this.group = new THREE.Group();
        this.scene.add(this.group);
    }

    init() {
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, -10);

        // Tunnel/Env
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        // Grid floor moving effect?
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        gridHelper.position.y = -2;
        this.scene.add(gridHelper);

        // Player Shape (The "Key")
        // Create an L shape or T shape
        this.playerMesh = new THREE.Group();

        const mat = new THREE.MeshNormalMaterial();
        const box = new THREE.BoxGeometry(1, 1, 1);

        // Center block
        const b1 = new THREE.Mesh(box, mat);
        this.playerMesh.add(b1);

        // Top block
        const b2 = new THREE.Mesh(box, mat);
        b2.position.y = 1;
        this.playerMesh.add(b2);

        // Right block (L-Shape)
        const b3 = new THREE.Mesh(box, mat);
        b3.position.x = 1;
        this.playerMesh.add(b3);

        this.scene.add(this.playerMesh);

        // Initial Wall
        this.spawnWall();
    }

    onInput(type, coords) {
        if (this.isGameOver) return;

        if (type === 'end') {
            // Swipe/Tap rotation logic
            // Divide screen into Left/Right halves for rotation direction
            if (coords.x > 0) {
                this.targetRotation -= Math.PI / 2; // Clockwise
            } else {
                this.targetRotation += Math.PI / 2; // CCW
            }
        }
    }

    spawnWall() {
        const distance = 40;
        const wallGroup = new THREE.Group();
        wallGroup.position.z = -distance;

        // Logic: Pick a random rotation that is REQUIRED
        const requiredRotStep = Math.floor(Math.random() * 4); // 0, 1, 2, 3
        const requiredRot = requiredRotStep * (Math.PI / 2);

        // We need to create a hole that fits the player IF the player was at requiredRot
        // Player shape relative to center (0,0):
        // (0,0), (0,1), (1,0)

        // We construct the wall by filling a 5x5 grid EXCEPT the hole cells
        const wallMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
        const geo = new THREE.BoxGeometry(1, 1, 0.5);

        // Rotate "Virtual Player" to find hole spots
        // Simple 2D rotation of (0,0), (0,1), (1,0)
        const holeCells = [];
        const baseCells = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }];

        const cos = Math.round(Math.cos(requiredRot));
        const sin = Math.round(Math.sin(requiredRot));

        baseCells.forEach(c => {
            // x' = x cos - y sin
            // y' = x sin + y cos
            const nx = c.x * cos - c.y * sin;
            const ny = c.x * sin + c.y * cos;
            holeCells.push({ x: Math.round(nx), y: Math.round(ny) });
        });

        // Build Wall Grid -2 to +2
        for (let x = -2; x <= 2; x++) {
            for (let y = -2; y <= 2; y++) {
                // Check if this is a hole
                if (!holeCells.some(h => h.x === x && h.y === y)) {
                    const brick = new THREE.Mesh(geo, wallMat);
                    brick.position.set(x, y, 0);
                    wallGroup.add(brick);
                }
            }
        }

        wallGroup.userData = { requiredRotStep }; // Store integer step for easier comparison
        this.scene.add(wallGroup);
        this.walls.push(wallGroup);
    }

    update(dt) {
        if (this.isGameOver) return;

        // Rotate Player
        const rotSpeed = 10;
        this.currentRotation += (this.targetRotation - this.currentRotation) * rotSpeed * dt;
        this.playerMesh.rotation.z = this.currentRotation;

        // Move Walls
        const moveDist = this.speed * dt;

        for (let i = this.walls.length - 1; i >= 0; i--) {
            const wall = this.walls[i];
            wall.position.z += moveDist;

            // Collision/Pass Logic
            if (wall.position.z > -0.5 && wall.position.z < 0.5) {
                // Check pass
                if (!wall.userData.checked) {
                    wall.userData.checked = true;
                    this.checkCollision(wall);
                }
            }

            // Remove passed walls
            if (wall.position.z > 5) {
                this.scene.remove(wall);
                this.walls.splice(i, 1);
            }
        }

        // Spawn Logic
        this.spawnTimer += dt;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnWall();
            this.speed += 0.5; // Acceleration
            this.spawnInterval = Math.max(1.0, 3.0 - (this.speed - 10) * 0.1);
        }
    }

    checkCollision(wall) {
        // Player Rotation Step (Normalized)
        // targetRotation is in radians (could be huge e.g. 10 * PI)
        // Normalize to 0..3

        let currentStep = Math.round(this.targetRotation / (Math.PI / 2));
        // JS Modulo bug with negatives
        currentStep = ((currentStep % 4) + 4) % 4;

        const requiredStep = wall.userData.requiredRotStep;

        if (currentStep === requiredStep) {
            this.passedCount++;
            this.score += 100;
            // Sound effect could go here
        } else {
            console.log("Crash!", currentStep, requiredStep);
            this.gameOver();
        }
    }
}
