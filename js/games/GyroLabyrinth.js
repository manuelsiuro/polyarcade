import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class GyroLabyrinth extends Game {
    constructor(app) {
        super(app);
        this.name = 'Gyro Labyrinth';

        // Physics State
        this.ball = { x: 0, z: 0, vx: 0, vz: 0, radius: 0.3 };
        this.boardTilt = { x: 0, z: 0 }; // Target tilt
        this.currentTilt = { x: 0, z: 0 };

        // Visuals
        this.boardGroup = new THREE.Group();
        this.scene.add(this.boardGroup);

        this.walls = []; // {x, z, w, h} (rectangles)
        this.holes = []; // {x, z, r}
        this.target = null; // {x, z, r}
    }

    init() {
        this.camera.position.set(0, 10, 0.1);
        this.camera.lookAt(0, 0, 0);

        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(5, 10, 5);
        this.scene.add(light, new THREE.AmbientLight(0x404040));

        // Create Board
        const boardGeo = new THREE.BoxGeometry(8, 0.5, 8);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1 });
        this.boardMesh = new THREE.Mesh(boardGeo, boardMat);
        this.boardGroup.add(this.boardMesh);

        // Create Physics Ball
        const ballGeo = new THREE.SphereGeometry(this.ball.radius, 32, 32);
        const ballMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
        this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
        this.boardGroup.add(this.ballMesh);

        // Build Level
        this.buildLevel();

        // Init Physics
        this.ball.x = -3;
        this.ball.z = -3;
    }

    buildLevel() {
        // Simple Walls

        // Walls are static on board.
        // Physics Coords: Center 0,0. Range -4 to 4.

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });

        const createWall = (x, z, w, d) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), wallMat);
            mesh.position.set(x, 0.5, z);
            this.boardGroup.add(mesh);
            this.walls.push({ x, z, w, d });
        };

        // Borders
        createWall(0, -4.1, 8.2, 0.2); // Top
        createWall(0, 4.1, 8.2, 0.2);  // Bottom
        createWall(-4.1, 0, 0.2, 8.2); // Left
        createWall(4.1, 0, 0.2, 8.2);  // Right

        // Maze Pattern
        createWall(-2, -2, 4, 0.2);
        createWall(2, 2, 4, 0.2);
        createWall(0, 0, 0.2, 4);

        // Hole
        const holeGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(2, 0.26, -2);
        this.boardGroup.add(hole);
        this.holes.push({ x: 2, z: -2, r: 0.5 });

        // Target
        const targetGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
        const targetMat = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
        const target = new THREE.Mesh(targetGeo, targetMat);
        target.position.set(-3, 0.26, 3);
        this.boardGroup.add(target);
        this.target = { x: -3, z: 3, r: 0.5 };
    }

    onInput(type, coords) {
        // Fallback for Desktop: Use mouse pos to simulate tilt
        if (type === 'move') {
            // Coords -1 to 1
            // Mouse Top (-1 Y) -> Tilt Board Forward (-X rot)
            // Mouse Right (1 X) -> Tilt Board Right (-Z rot)

            const maxTilt = Math.PI / 8; // 22 deg
            this.boardTilt.x = coords.y * maxTilt;
            this.boardTilt.z = -coords.x * maxTilt;
        }
    }

    // TODO: Add DeviceOrientation listener in App or here?
    // For now we rely on onInput (Mouse/Touch).
    // App handles touchmove which can drive tilt on mobile too if dragging.
    // Real Gyro would need window.addEventListener('deviceorientation', ...) directly.

    update(dt) {
        if (this.isGameOver) return;

        // Smooth Tilt
        this.currentTilt.x += (this.boardTilt.x - this.currentTilt.x) * 5 * dt;
        this.currentTilt.z += (this.boardTilt.z - this.currentTilt.z) * 5 * dt;

        this.boardGroup.rotation.x = this.currentTilt.x;
        this.boardGroup.rotation.z = this.currentTilt.z;

        // Physics Step
        // 1. Gravity from Tilt
        // Gravity Vector relative to board:
        // gx = g * sin(tiltZ)
        // gz = g * sin(-tiltX)
        const g = 20;
        const gx = g * Math.sin(this.currentTilt.z);
        const gz = g * Math.sin(-this.currentTilt.x);

        this.ball.vx += gx * dt;
        this.ball.vz += gz * dt;

        // Damping (Friction)
        this.ball.vx *= (1 - 1.0 * dt);
        this.ball.vz *= (1 - 1.0 * dt);

        // Integrate
        let nextX = this.ball.x + this.ball.vx * dt;
        let nextZ = this.ball.z + this.ball.vz * dt;

        // Collision: Walls
        // Simple AABB vs Sphere check
        for (const wall of this.walls) {
            // Wall Bounds
            const minX = wall.x - wall.w / 2 - this.ball.radius;
            const maxX = wall.x + wall.w / 2 + this.ball.radius;
            const minZ = wall.z - wall.d / 2 - this.ball.radius;
            const maxZ = wall.z + wall.d / 2 + this.ball.radius;

            if (nextX > minX && nextX < maxX && nextZ > minZ && nextZ < maxZ) {
                // Collision
                // Determine normal?
                // Simple bounce/slide: check closest axis
                // Too complex for 2 sec check.
                // Just clamp (stop)

                // Naive: Revert
                this.ball.vx *= -0.5; // Bounce
                this.ball.vz *= -0.5;
                nextX = this.ball.x;
                nextZ = this.ball.z;
                break;
            }
        }

        this.ball.x = nextX;
        this.ball.z = nextZ;

        // Update Visuals
        this.ballMesh.position.set(this.ball.x, this.ball.radius + 0.25, this.ball.z);

        // Check Hole
        // Distance check
        for (const hole of this.holes) {
            const dist = Math.hypot(this.ball.x - hole.x, this.ball.z - hole.z);
            if (dist < hole.r * 0.5) {
                // Fall
                this.gameOver(); // Loss
                // TODO: Fall animation
            }
        }

        // Check Target
        if (this.target) {
            const dist = Math.hypot(this.ball.x - this.target.x, this.ball.z - this.target.z);
            if (dist < this.target.r * 0.5) {
                this.score = 1000;
                this.gameOver(); // Win (score > 0)
            }
        }
    }
}
