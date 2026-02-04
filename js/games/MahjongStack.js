import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class MahjongStack extends Game {
    constructor(app) {
        super(app);
        this.name = 'Mahjong Stack';

        this.gridSize = 6;
        this.maxHeight = 6;
        this.tiles = []; // Array of {x, y, z, id, mesh}
        this.selectedTile = null;
        this.raycaster = new THREE.Raycaster();

        this.colors = [
            0xe74c3c, 0xe67e22, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6, 0xffffff, 0x34495e
        ];

        this.pivot = new THREE.Group();
        this.scene.add(this.pivot);
    }

    init() {
        this.camera.position.set(0, 5, 12);
        this.camera.lookAt(0, 0, 0);

        // Env
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 10, 5);
        this.scene.add(ambient, dir);

        this.generateStack();
    }

    generateStack() {
        // Create a paired list of IDs
        // Calculate total cubes needed. Try simple pyramid or cube.
        // Let's do a Cube 4x4x4 = 64 tiles.
        // 64 / 2 = 32 pairs.

        const dim = 4;
        const total = dim * dim * dim;
        const ids = [];
        for (let i = 0; i < total / 2; i++) {
            const colorId = i % this.colors.length;
            ids.push(colorId, colorId);
        }

        // Shuffle
        ids.sort(() => Math.random() - 0.5);

        // Geometry
        const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);

        // Fill Grid
        let idx = 0;
        for (let y = 0; y < dim; y++) {
            for (let x = 0; x < dim; x++) {
                for (let z = 0; z < dim; z++) {
                    const id = ids[idx++];
                    const color = this.colors[id];

                    const mat = new THREE.MeshStandardMaterial({ color });
                    const mesh = new THREE.Mesh(geo, mat);

                    // Center offset
                    const off = (dim - 1) / 2;
                    mesh.position.set(x - off, y - off, z - off);

                    mesh.userData = {
                        gx: x, gy: y, gz: z,
                        id: id,
                        colorHex: color // store original color
                    };

                    this.pivot.add(mesh);
                    this.tiles.push({ x, y: y, z, id, mesh });
                }
            }
        }
    }

    onInput(type, coords) {
        if (type === 'move' && this.isDragging) {
            // Rotation logic (Orbit)
            const deltaX = coords.x - this.lastX;
            this.pivot.rotation.y += deltaX * 2;
            this.lastX = coords.x;
            return;
        }

        if (type === 'start') {
            this.isDragging = true;
            this.lastX = coords.x;
            this.clickStart = Date.now();
        } else if (type === 'end') {
            this.isDragging = false;

            if (Date.now() - this.clickStart < 200) {
                // Tap
                this.raycaster.setFromCamera(coords, this.camera);
                const intersects = this.raycaster.intersectObjects(this.pivot.children);
                if (intersects.length > 0) {
                    this.handleTileClick(intersects[0].object);
                }
            }
        }
    }

    handleTileClick(mesh) {
        const data = mesh.userData;

        // 1. Check if free
        if (!this.isFree(data.gx, data.gy, data.gz)) {
            // Shake effect or feedback that it's locked?
            return;
        }

        // 2. Selection Logic
        if (this.selectedTile === mesh) {
            // Deselect
            this.deselect();
        } else if (this.selectedTile) {
            // Match attempt
            if (this.selectedTile.userData.id === data.id) {
                // Match!
                this.removeTile(this.selectedTile);
                this.removeTile(mesh);
                this.selectedTile = null;
                this.score += 10;

                if (this.pivot.children.length === 0) {
                    this.gameOver(); // Won actually
                }
            } else {
                // Mismatch -> Select new
                this.deselect();
                this.select(mesh);
            }
        } else {
            // Select
            this.select(mesh);
        }
    }

    isFree(x, y, z) {
        // Tile is free if:
        // 1. No tile above (y+1)
        // 2. At least 2 adjacent faces are free (Left/Right/Front/Back) (x+/-1, z+/-1)

        // Check Top
        if (this.hasTile(x, y + 1, z)) return false;

        let freeFaces = 0;
        if (!this.hasTile(x + 1, y, z)) freeFaces++;
        if (!this.hasTile(x - 1, y, z)) freeFaces++;
        if (!this.hasTile(x, y, z + 1)) freeFaces++;
        if (!this.hasTile(x, y, z - 1)) freeFaces++;

        return freeFaces >= 2;
    }

    hasTile(x, y, z) {
        return this.tiles.some(t => t.x === x && t.y === y && t.z === z);
    }

    select(mesh) {
        this.selectedTile = mesh;
        mesh.material.emissive.setHex(0x555555);
    }

    deselect() {
        if (this.selectedTile) {
            this.selectedTile.material.emissive.setHex(0x000000);
            this.selectedTile = null;
        }
    }

    removeTile(mesh) {
        const idx = this.tiles.findIndex(t => t.mesh === mesh);
        if (idx !== -1) {
            this.tiles.splice(idx, 1);
            this.pivot.remove(mesh);

            // Generate Particles/Effect?
        }
    }

    update(dt) {
        // Auto rotate slightly?
        // this.pivot.rotation.y += 0.1 * dt;
    }
}
