import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class IsoSokoban extends Game {
    constructor(app) {
        super(app);
        this.name = 'Iso-Sokoban';

        // Orthographic Camera for Isometric view
        const aspect = window.innerWidth / window.innerHeight;
        const d = 12;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        this.camera.position.set(20, 20, 20); // Isometric angle
        this.camera.lookAt(0, 0, 0);

        // Game State
        this.gridSize = 8;
        this.level = [];
        this.playerPos = { x: 0, z: 0 };
        this.boxes = []; // Array of {x, z, mesh, targetX, targetZ, isMoving}
        this.holes = [];
        this.targets = [];

        this.tileSize = 2;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.isMoving = false;
        this.playerTarget = { x: 0, z: 0 };
    }

    init() {
        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        this.scene.add(ambient, dirLight);

        // Load Level 1
        this.loadLevel();
    }

    loadLevel() {
        // Updated Map
        const map = [
            "########",
            "#......#",
            "#..P...#",
            "#.B.B..#",
            "#..H...#",
            "#..B...#",
            "#..T.T.#",
            "########"
        ];

        this.boxes = [];
        this.holes = [];
        this.targets = [];
        this.group.clear();

        // Floor Base
        const floorGeo = new THREE.PlaneGeometry(this.gridSize * this.tileSize, this.gridSize * this.tileSize);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x34495e });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        floor.position.set(
            (this.gridSize * this.tileSize) / 2 - this.tileSize / 2,
            -0.1,
            (this.gridSize * this.tileSize) / 2 - this.tileSize / 2
        );
        this.group.add(floor);

        map.forEach((row, z) => {
            for (let x = 0; x < row.length; x++) {
                const char = row[x];

                if (char === '#') {
                    this.createBlock(x, z, 1.5, 0x95a5a6); // Wall
                } else if (char === 'P') {
                    this.playerPos = { x, z };
                    this.playerTarget = { x, z };
                    this.playerMesh = this.createEntity(x, z, 0xe74c3c, 0.8); // Red Player
                } else if (char === 'B') {
                    const box = this.createEntity(x, z, 0xf1c40f, 1.4, 'box'); // Yellow Box
                    this.boxes.push({ x, z, mesh: box, targetX: x, targetZ: z, isMoving: false });
                } else if (char === 'H') {
                    this.createHole(x, z);
                } else if (char === 'T') {
                    this.createTile(x, z, 0x2ecc71); // Green Target
                    this.targets.push({ x, z });
                }
            }
        });

        // Center the board
        const centerOffset = (this.gridSize * this.tileSize) / 2;
        this.group.position.set(-centerOffset, 0, -centerOffset);
    }

    createTile(x, z, color) {
        const geo = new THREE.BoxGeometry(this.tileSize * 0.9, 0.1, this.tileSize * 0.9);
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * this.tileSize, 0, z * this.tileSize);
        this.group.add(mesh);
    }

    createHole(x, z) {
        const geo = new THREE.BoxGeometry(this.tileSize, 0.1, this.tileSize);
        const mat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * this.tileSize, 0, z * this.tileSize);
        this.group.add(mesh);
        this.holes.push({ x, z });
    }

    createBlock(x, z, height, color) {
        // Aesthetic overhaul: Low "Tech Barriers" instead of tall glass walls
        const wallHeight = 0.5; // Look over them easily

        const geo = new THREE.BoxGeometry(this.tileSize, wallHeight, this.tileSize);

        // Dark, semi-transparent base
        const mat = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            roughness: 0.1,
            transparent: true,
            opacity: 0.8
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * this.tileSize, wallHeight / 2, z * this.tileSize);
        this.group.add(mesh);

        // Add Neon Edges for "Tron" look
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 })
        );
        mesh.add(line);
    }

    createEntity(x, z, color, scale, type = 'sphere') {
        let geo;
        if (type === 'box') {
            geo = new THREE.BoxGeometry(this.tileSize * 0.8, this.tileSize * 0.8, this.tileSize * 0.8);
        } else {
            geo = new THREE.SphereGeometry(this.tileSize * 0.3, 32, 32);
        }

        const mat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.1,
            metalness: 0.3
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * this.tileSize, 1, z * this.tileSize); // Keep entities high enough
        this.group.add(mesh);
        return mesh;
    }

        this.isMoving = false;
this.playerTarget = { x: 0, z: 0 };

this.raycaster = new THREE.Raycaster();
this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    }

// ... (rest of class) ...

onInput(type, coords) {
    if (this.isMoving) return;

    if (type === 'start') {
        this.startPoint3D = this.getGroundIntersection(coords);
    } else if (type === 'end') {
        const endPoint3D = this.getGroundIntersection(coords);

        if (!this.startPoint3D || !endPoint3D) return;

        const dx = endPoint3D.x - this.startPoint3D.x;
        const dz = endPoint3D.z - this.startPoint3D.z;

        // Threshold in World Units (approx 1 tile is 2 units)
        // Swipe should be significant, e.g., 0.5 units
        if (Math.abs(dx) < 0.5 && Math.abs(dz) < 0.5) return;

        // Determine dominant axis in WORLD space
        if (Math.abs(dx) > Math.abs(dz)) {
            // Moving along X axis
            if (dx > 0) this.tryMove(1, 0);
            else this.tryMove(-1, 0);
        } else {
            // Moving along Z axis
            if (dz > 0) this.tryMove(0, 1);
            else this.tryMove(0, -1);
        }
    }
}

getGroundIntersection(coords) {
    this.raycaster.setFromCamera(coords, this.camera);
    const target = new THREE.Vector3();
    // Intersect with abstract plane at Y=0
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);
    return hit; // Returns Vector3 or null
}

tryMove(dx, dz) {
    if (this.isMoving) return;

    const nextX = this.playerPos.x + dx;
    const nextZ = this.playerPos.z + dz;

    if (this.isWall(nextX, nextZ)) return;

    // Check Box
    const boxIndex = this.boxes.findIndex(b => b.x === nextX && b.z === nextZ);

    if (boxIndex !== -1) {
        // Pushing Box
        const boxNextX = nextX + dx;
        const boxNextZ = nextZ + dz;

        if (this.isWall(boxNextX, boxNextZ) || this.isBox(boxNextX, boxNextZ)) {
            return; // Blocked
        }

        // Move Box
        this.moveBox(boxIndex, boxNextX, boxNextZ);
    }

    // Move Player target
    this.playerTarget.x = nextX;
    this.playerTarget.z = nextZ;
    this.isMoving = true;
}

isWall(x, z) {
    if (x < 0 || z < 0 || x >= 8 || z >= 8) return true;
    if (x === 0 || x === 7 || z === 0 || z === 7) return true;
    return false;
}

isBox(x, z) {
    return this.boxes.some(b => b.x === x && b.z === z);
}

moveBox(index, x, z) {
    const box = this.boxes[index];
    box.targetX = x;
    box.targetZ = z;
    box.isMoving = true;
}

update(dt) {
    const speed = 15 * dt;

    if (this.isMoving) {
        let stillAnimating = false;

        // Player Animation
        const pt = this.playerTarget;
        const pm = this.playerMesh.position;
        const tx = pt.x * this.tileSize;
        const tz = pt.z * this.tileSize;

        pm.x += (tx - pm.x) * speed;
        pm.z += (tz - pm.z) * speed;

        if (Math.abs(tx - pm.x) < 0.05 && Math.abs(tz - pm.z) < 0.05) {
            pm.set(tx, 1, tz);
            this.playerPos.x = pt.x;
            this.playerPos.z = pt.z;
        } else {
            stillAnimating = true;
        }

        // Box Animation
        this.boxes.forEach(box => {
            if (box.isMoving) {
                const bx = box.targetX * this.tileSize;
                const bz = box.targetZ * this.tileSize;
                box.mesh.position.x += (bx - box.mesh.position.x) * speed;
                box.mesh.position.z += (bz - box.mesh.position.z) * speed;

                if (Math.abs(bx - box.mesh.position.x) < 0.05 && Math.abs(bz - box.mesh.position.z) < 0.05) {
                    box.mesh.position.set(bx, 1, bz);
                    box.x = box.targetX;
                    box.z = box.targetZ;
                    box.isMoving = false;
                    this.checkHole(box);
                } else {
                    stillAnimating = true;
                }
            }
        });

        if (!stillAnimating) {
            this.isMoving = false;
            this.checkWin();
        }
    }
}

checkHole(box) {
    const holeIdx = this.holes.findIndex(h => h.x === box.x && h.z === box.z);
    if (holeIdx !== -1) {
        box.mesh.position.y = 0.5; // Sink
        box.mesh.scale.setScalar(0.9);
    }
}

checkWin() {
    const win = this.targets.every(t => this.isBox(t.x, t.z));
    if (win) {
        this.gameOver();
    }
}
}
