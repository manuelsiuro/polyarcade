import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class CubeCrawler extends Game {
    constructor(app) {
        super(app);
        this.name = 'Cube Crawler 3D';

        this.gridSize = 10;
        this.cubeSize = 4;
        this.stepTime = 0.2; // Speed

        this.snake = [];
        this.food = null;

        // Direction: {du, dv}
        // face: 0..5
        this.direction = { du: 1, dv: 0 };
        this.nextDirection = { du: 1, dv: 0 };
        this.timer = 0;

        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Adjacency Map
        // [Right, Left, Top, Bottom]
        // Returns: { f: faceIndex, r: rotation (0=0, 1=90, 2=180, 3=270) }
        // Rotation defines how our "Up" changes relative to new face "Up".
        // Actually, let's just map entrance.
        // If we exit Right (u+), we enter Left (u=0) of neighbor.
        // If we exit Top (v+), we enter Bottom (v=0) of neighbor.

        // Face 0 (Front): R->2, L->3, T->4, B->5. (Standard)
        // Face 1 (Back):  R->3, L->2, T->4, B->5. (Note: effectively flipped horizontally relative to front??)
        // Let's assume standard UV layout on a folded box.

        // Transition Table
        // [Right, Left, Top, Bottom]
        // Entries: { f: face, rot: rotation_steps_cw }
        // Rotation: 0 (No change, standard connection), 1 (90 CW), 2 (180), 3 (270 CCW)
        // Standard (0): Exit Right -> Enter Left. Exit Top -> Enter Bottom.

        // Face Layout (Unfolded Cross):
        //   4
        // 3 0 2 1
        //   5
        // (Note: 1 is Back, typically to the Right of 2)

        // Face 4 is Top, 5 is Bottom.

        // Rot key:
        // 0: Entry matches Exit (e.g. Right -> Left). Visually straight.
        // 1: 90 CW.
        // 2: 180.
        // 3: 270 CW (-90).


        // 0=Front, 1=Back, 2=Right, 3=Left, 4=Top, 5=Bottom

        // Camera Targets
        this.targetCamPos = new THREE.Vector3(0, 0, 12);
        this.targetCamUp = new THREE.Vector3(0, 1, 0);
    }

    init() {
        this.camera.position.set(0, 0, 12);
        this.camera.up.set(0, 1, 0);
        this.camera.lookAt(0, 0, 0);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 10, 5);
        this.scene.add(ambient, dir);

        const geo = new THREE.BoxGeometry(this.cubeSize - 0.1, this.cubeSize - 0.1, this.cubeSize - 0.1);
        // Darker material with transparency
        const mat = new THREE.MeshStandardMaterial({
            color: 0x050505,
            roughness: 0.2,
            metalness: 0.9,
            transparent: true,
            opacity: 0.95
        });
        this.core = new THREE.Mesh(geo, mat);
        this.group.add(this.core);

        // Grid Lines
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize));
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 }));
        this.group.add(line);

        this.createStarfield();
        this.resetGame();
    }

    createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1500;
        const starPos = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 100;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0x00ff88,
            size: 0.15,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
    }

    resetGame() {
        this.snake = [
            { f: 0, u: 5, v: 5 },
            { f: 0, u: 4, v: 5 }
        ];
        this.direction = { du: 1, dv: 0 };
        this.nextDirection = { du: 1, dv: 0 };

        this.spawnFood();
        this.updateVisuals();
        this.setCameraFace(0);
    }

    onInput(type, coords) {
        // Keyboard Control
        if (type === 'key') {
            this.handleDirectionInput(coords);
        }
        // Touch Control (Swipe)
        else if (type === 'start') {
            this.touchStart = coords;
        }
        else if (type === 'end' && this.touchStart) {
            const dx = coords.x - this.touchStart.x;
            const dy = coords.y - this.touchStart.y;
            const threshold = 0.1; // Min distance for swipe

            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.handleDirectionInput(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
                } else {
                    this.handleDirectionInput(dy > 0 ? 'ArrowUp' : 'ArrowDown');
                }
            }
            this.touchStart = null;
        }
    }

    handleDirectionInput(code) {
        // Map visual direction relative to CAMERA
        let newDu = this.direction.du;
        let newDv = this.direction.dv;

        // Current Movement logic assumes "Up" is +v.
        // This holds true for Face 0.
        // For other faces, transitions handle rotation.
        // So local +v is always "visually up" IF Camera Up is aligned with Face Up.

        if (code === 'ArrowUp' || code === 'KeyW') { newDu = 0; newDv = 1; }
        else if (code === 'ArrowDown' || code === 'KeyS') { newDu = 0; newDv = -1; }
        else if (code === 'ArrowLeft' || code === 'KeyA') { newDu = -1; newDv = 0; }
        else if (code === 'ArrowRight' || code === 'KeyD') { newDu = 1; newDv = 0; }

        // Prevent 180 turn
        if (newDu === -this.direction.du && newDv === -this.direction.dv) return;

        this.nextDirection = { du: newDu, dv: newDv };

        if (this.app.audio) this.app.audio.playTurn();
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.stepTime) {
            this.timer = 0;
            this.step();
        }

        // Smooth Camera Orbit - Faster speed (10)
        this.camera.position.lerp(this.targetCamPos, 10 * dt);
        this.camera.up.lerp(this.targetCamUp, 10 * dt).normalize();
        this.camera.lookAt(0, 0, 0);

        // Animate Starfield
        if (this.stars) {
            this.stars.rotation.y += 0.05 * dt;
            this.stars.rotation.x += 0.02 * dt;
        }
    }

    step() {
        this.direction = this.nextDirection;
        const head = this.snake[0];

        let nf = head.f;
        let nu = head.u + this.direction.du;
        let nv = head.v + this.direction.dv;

        const max = this.gridSize - 1;

        // Check Bounds
        if (nu > max) { this.crossFace(head.f, 0, nv); return; } // Right
        else if (nu < 0) { this.crossFace(head.f, 1, nv); return; } // Left
        else if (nv > max) { this.crossFace(head.f, 2, nu); return; } // Top
        else if (nv < 0) { this.crossFace(head.f, 3, nu); return; } // Bottom

        // Normal Move
        this.moveTo(nf, nu, nv);
    }

    crossFace(fromFace, edgeIdx, otherCoord) {
        // Use the explicit logic from before, it was correct for Topology.
        // Re-pasting the robust switch-case block.

        let nextFace, newU, newV, newDu, newDv;
        const max = this.gridSize - 1;
        const cv = otherCoord;
        const inv = c => max - c;

        // ... (Explicit Logic Block from previous step) ...
        // I will allow the previous tool's extensive switch block to be reused or re-typed here.
        // To save space, implementing the core logic again concisely but robustly.

        switch (fromFace) {
            case 0: // Front
                if (edgeIdx === 0) { nextFace = 2; newU = 0; newV = cv; newDu = 1; newDv = 0; }
                else if (edgeIdx === 1) { nextFace = 3; newU = max; newV = cv; newDu = -1; newDv = 0; }
                else if (edgeIdx === 2) { nextFace = 4; newU = cv; newV = 0; newDu = 0; newDv = 1; }
                else if (edgeIdx === 3) { nextFace = 5; newU = cv; newV = max; newDu = 0; newDv = -1; }
                break;
            case 1: // Back
                if (edgeIdx === 0) { nextFace = 3; newU = 0; newV = cv; newDu = 1; newDv = 0; }
                else if (edgeIdx === 1) { nextFace = 2; newU = max; newV = cv; newDu = -1; newDv = 0; }
                else if (edgeIdx === 2) { nextFace = 4; newU = inv(cv); newV = max; newDu = 0; newDv = -1; }
                else if (edgeIdx === 3) { nextFace = 5; newU = inv(cv); newV = 0; newDu = 0; newDv = 1; }
                break;
            case 2: // Right
                if (edgeIdx === 0) { nextFace = 1; newU = 0; newV = cv; newDu = 1; newDv = 0; }
                else if (edgeIdx === 1) { nextFace = 0; newU = max; newV = cv; newDu = -1; newDv = 0; }
                else if (edgeIdx === 2) { nextFace = 4; newU = max; newV = cv; newDu = -1; newDv = 0; }
                else if (edgeIdx === 3) { nextFace = 5; newU = max; newV = inv(cv); newDu = -1; newDv = 0; }
                break;
            case 3: // Left
                if (edgeIdx === 0) { nextFace = 0; newU = 0; newV = cv; newDu = 1; newDv = 0; }
                else if (edgeIdx === 1) { nextFace = 1; newU = max; newV = cv; newDu = -1; newDv = 0; }
                else if (edgeIdx === 2) { nextFace = 4; newU = 0; newV = cv; newDu = 1; newDv = 0; }
                else if (edgeIdx === 3) { nextFace = 5; newU = 0; newV = inv(cv); newDu = 1; newDv = 0; }
                break;
            case 4: // Top
                if (edgeIdx === 0) { nextFace = 2; newU = cv; newV = max; newDu = 0; newDv = -1; }
                else if (edgeIdx === 1) { nextFace = 3; newU = cv; newV = max; newDu = 0; newDv = -1; }
                else if (edgeIdx === 2) { nextFace = 1; newU = inv(cv); newV = max; newDu = 0; newDv = -1; }
                else if (edgeIdx === 3) { nextFace = 0; newU = cv; newV = max; newDu = 0; newDv = -1; }
                break;
            case 5: // Bottom
                if (edgeIdx === 0) { nextFace = 2; newU = inv(cv); newV = 0; newDu = 0; newDv = 1; }
                else if (edgeIdx === 1) { nextFace = 3; newU = inv(cv); newV = 0; newDu = 0; newDv = 1; }
                else if (edgeIdx === 2) { nextFace = 0; newU = cv; newV = 0; newDu = 0; newDv = 1; }
                else if (edgeIdx === 3) { nextFace = 1; newU = inv(cv); newV = 0; newDu = 0; newDv = 1; }
                break;
        }

        if (nextFace === undefined || isNaN(newU) || isNaN(newV)) {
            console.error("Invalid Transition detected", fromFace, edgeIdx);
            this.gameOver();
            return;
        }

        this.direction = { du: newDu, dv: newDv };
        this.nextDirection = { du: newDu, dv: newDv };
        this.moveTo(nextFace, newU, newV);
    }

    moveTo(f, u, v) {
        // Collision
        if (this.snake.some(s => s.f === f && s.u === u && s.v === v)) {
            if (this.app.audio) this.app.audio.playExplosion();
            this.gameOver();
            return;
        }

        this.snake.unshift({ f, u, v });

        if (this.food && this.food.f === f && this.food.u === u && this.food.v === v) {
            if (this.app.audio) this.app.audio.playEat();
            this.score += 10;
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        // Camera Update
        if (f !== this.lastCamFace) {
            this.setCameraFace(f);
            this.lastCamFace = f;
        }

        this.updateVisuals();
    }

    setCameraFace(faceIdx) {
        const d = 12;
        // Set target position and Up vector based on face
        // 0: Front (0,0,d) Up(0,1,0)
        // 1: Back (0,0,-d) Up(0,1,0)
        // 2: Right (d,0,0) Up(0,1,0)
        // 3: Left (-d,0,0) Up(0,1,0)
        // 4: Top (0,d,0) Up(0,0,-1)
        // 5: Bottom (0,-d,0) Up(0,0,1)

        switch (faceIdx) {
            case 0:
                this.targetCamPos.set(0, 0, d);
                this.targetCamUp.set(0, 1, 0);
                break;
            case 1:
                this.targetCamPos.set(0, 0, -d);
                this.targetCamUp.set(0, 1, 0);
                break;
            case 2:
                this.targetCamPos.set(d, 0, 0);
                this.targetCamUp.set(0, 1, 0);
                break;
            case 3:
                this.targetCamPos.set(-d, 0, 0);
                this.targetCamUp.set(0, 1, 0);
                break;
            case 4:
                this.targetCamPos.set(0, d, 0);
                this.targetCamUp.set(0, 0, -1);
                break;
            case 5:
                this.targetCamPos.set(0, -d, 0);
                this.targetCamUp.set(0, 0, 1);
                break;
        }
    }

    spawnFood() {
        this.food = {
            f: Math.floor(Math.random() * 6),
            u: Math.floor(Math.random() * this.gridSize),
            v: Math.floor(Math.random() * this.gridSize)
        };
        // Ensure not on snake (opt)
    }

    updateVisuals() {
        // Clear children of group except core/grid
        this.group.children = this.group.children.filter(c => c === this.core || c.type === 'LineSegments');

        // Draw Snake (Neon)
        this.snake.forEach((s, i) => {
            const isHead = i === 0;
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 0.35, 0.1),
                new THREE.MeshStandardMaterial({
                    color: isHead ? 0x00ff00 : 0x00cc00,
                    emissive: isHead ? 0x00ff00 : 0x008800,
                    emissiveIntensity: isHead ? 0.8 : 0.4
                })
            );
            this.placeOnCube(mesh, s);
            this.group.add(mesh);
        });

        // Draw Food (Neon Red)
        const fMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.2),
            new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 1.0
            })
        );
        this.placeOnCube(fMesh, this.food);
        this.group.add(fMesh);
    }

    placeOnCube(mesh, pos) {
        const step = this.cubeSize / this.gridSize;
        const offset = -this.cubeSize / 2 + step / 2;
        const u = offset + pos.u * step;
        const v = offset + pos.v * step;
        const d = this.cubeSize / 2 + 0.05;

        switch (pos.f) {
            case 0: mesh.position.set(u, v, d); break;
            case 1: mesh.position.set(-u, v, -d); mesh.rotation.y = Math.PI; break;
            case 2: mesh.position.set(d, v, -u); mesh.rotation.y = Math.PI / 2; break;
            case 3: mesh.position.set(-d, v, u); mesh.rotation.y = -Math.PI / 2; break;
            case 4: mesh.position.set(u, d, -v); mesh.rotation.x = -Math.PI / 2; break;
            case 5: mesh.position.set(u, -d, v); mesh.rotation.x = Math.PI / 2; break;
        }
    }
}
