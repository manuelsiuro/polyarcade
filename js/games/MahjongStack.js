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
            0xe74c3c, 0xe67e22, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6, 0xffffff, 0x34495e,
            0x1abc9c, 0x95a5a6, 0xd35400, 0xc0392b
        ];

        // Define Shapes (Layers from Bottom to Top)
        // 1 = Block, 0 = Empty
        this.SHAPES = {
            CUBE: [
                // 4x4x4 Solid
                ['1111', '1111', '1111', '1111'],
                ['1111', '1111', '1111', '1111'],
                ['1111', '1111', '1111', '1111'],
                ['1111', '1111', '1111', '1111']
            ],
            CAT: [
                // Base
                ['11111', '11111', '11111', '11111'],
                // Body
                ['01110', '11111', '11111', '01110'],
                // Head
                ['01110', '11111', '11111', '01110'],
                // Ears
                ['10001', '00000', '00000', '00000']
            ],
            PIG: [
                // Body
                ['01110', '11111', '11111', '11111'],
                // Head
                ['01110', '11111', '11111', '11111'],
                // Snout
                ['00000', '01110', '01110', '00000'],
                // Ears/Tail
                ['10001', '00000', '00000', '00100']
            ],
            HOUSE: [
                // Base 4x4
                ['1111', '1111', '1111', '1111'],
                ['1111', '1001', '1001', '1111'],
                // Roof 3x3
                ['0000', '0111', '0111', '0111'],
                // Top
                ['0000', '0010', '0000', '0000']
            ],
            SMILEY: [
                // Base Circle-ish
                ['01110', '11111', '11111', '11111', '01110'],
                // Face
                ['01110', '11111', '11111', '11111', '01110'],
                // Eyes/Mouth (Hollows) - handled by block presence
                ['01110', '10101', '11111', '10101', '01110']
            ]
        };

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
        this.createStarfield();
    }

    createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 300;
        const positions = new Float32Array(starCount * 3);
        const speeds = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
            speeds[i] = 0.5 + Math.random() * 2;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

        const starMat = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.15,
            transparent: true,
            opacity: 0.8
        });

        this.starField = new THREE.Points(starGeo, starMat);
        this.scene.add(this.starField);
    }

    generateStack() {
        const shapeKeys = Object.keys(this.SHAPES);
        const randomKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        const shapeDef = this.SHAPES[randomKey];

        console.log(`Generating Pattern: ${randomKey}`);

        // 1. Parse Shape to Coords
        let coords = [];
        const height = shapeDef.length;
        const depth = shapeDef[0].length;
        const width = shapeDef[0][0].length;

        // Center Offset
        const offX = (width - 1) / 2;
        const offZ = (depth - 1) / 2;
        const offY = (height - 1) / 2;

        for (let y = 0; y < height; y++) {
            const layer = shapeDef[y];
            for (let z = 0; z < layer.length; z++) {
                const row = layer[z];
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === '1') {
                        coords.push({ x: x - offX, y: y - offY, z: z - offZ });
                    }
                }
            }
        }

        // 2. Ensure Even Count
        if (coords.length % 2 !== 0) {
            console.log('Odd tile count, removing top-most tile.');
            // Remove the highest tile (max Y)
            coords.sort((a, b) => b.y - a.y);
            coords.pop();
        }

        // 3. Generate Colors
        const total = coords.length;
        const ids = [];
        for (let i = 0; i < total / 2; i++) {
            const colorId = i % this.colors.length;
            ids.push(colorId, colorId);
        }
        ids.sort(() => Math.random() - 0.5);

        // 4. Create Meshes
        const geo = new THREE.BoxGeometry(0.9, 0.9, 0.9);

        coords.forEach((pos, i) => {
            const id = ids[i];
            const color = this.colors[id];
            const mat = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.userData = {
                gx: Math.round(pos.x + 10), // Offset to avoid negatives for 'hasTile' logic or fix logic
                gy: Math.round(pos.y + 10),
                gz: Math.round(pos.z + 10),
                id: id,
                colorHex: color
            };

            // Fix Logic: Store float position for rendering, but normalize grid coords for logic
            // Actually, let's just use the float values for logic but be careful with floating point comparison?
            // Better: Rounded integer keys. But `isFree` checks neighbors.
            // Let's stick effectively to grid coordinates.
            // My centering logic produced floats (e.g. 1.5). 
            // Better alignment: Just map them to integers for the `tiles` array logic.
            // Let's store logic coordinates (lx, ly, lz) separate from world position.

            const lx = Math.round(pos.x * 2); // Avoid decimals? No, simple:
            // Just use the loop indices for logic!
            // Wait, I centered them. 
            // Let's re-do: Store logic coords from loop (x,y,z) directly.
        });

        // RESTART LOOP for cleanliness
        this.pivot.clear(); // Ensure clean
        this.tiles = [];

        coords = [];
        // Re-parsing to keep original generic integer coordinates for logic
        for (let y = 0; y < height; y++) {
            const layer = shapeDef[y];
            for (let z = 0; z < layer.length; z++) {
                const row = layer[z];
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === '1') {
                        coords.push({ x, y, z });
                    }
                }
            }
        }

        if (coords.length % 2 !== 0) {
            coords.sort((a, b) => b.y - a.y);
            coords.pop();
        }

        coords.forEach((pos, i) => {
            const id = ids[i];
            const color = this.colors[id];
            const mat = new THREE.MeshStandardMaterial({ color });
            const mesh = new THREE.Mesh(geo, mat);

            // World Position (Centered)
            mesh.position.set(pos.x - offX, pos.y - offY, pos.z - offZ);

            // Logic Position (Integer Grid)
            mesh.userData = { gx: pos.x, gy: pos.y, gz: pos.z, id: id, colorHex: color };

            this.pivot.add(mesh);
            this.tiles.push({ x: pos.x, y: pos.y, z: pos.z, id, mesh });
        });
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
            if (this.app.audio) this.app.audio.playClick();
        } else if (this.selectedTile) {
            // Match attempt
            if (this.selectedTile.userData.id === data.id) {
                // Match!
                this.removeTile(this.selectedTile);
                this.removeTile(mesh);
                this.selectedTile = null;
                this.score += 10;

                if (this.app.audio) this.app.audio.playReveal();

                if (this.pivot.children.length === 0) {
                    this.gameOver(); // Won actually
                    if (this.app.audio) this.app.audio.playWin();
                }
            } else {
                // Mismatch -> Select new
                this.deselect();
                this.select(mesh);
                if (this.app.audio) this.app.audio.playClick(); // Play click for new selection
            }
        } else {
            // Select
            this.select(mesh);
            if (this.app.audio) this.app.audio.playClick();
        }
    }

    isFree(x, y, z) {
        // Tile is free if:
        // 1. No tile above (y+1)
        // 2. At least 1 adjacent face is free (Left/Right/Front/Back) (x+/-1, z+/-1)

        // Check Top
        if (this.hasTile(x, y + 1, z)) return false;

        let freeFaces = 0;
        if (!this.hasTile(x + 1, y, z)) freeFaces++;
        if (!this.hasTile(x - 1, y, z)) freeFaces++;
        if (!this.hasTile(x, y, z + 1)) freeFaces++;
        if (!this.hasTile(x, y, z - 1)) freeFaces++;

        return freeFaces >= 1; // Relaxed from 2 to 1
    }

    hasTile(x, y, z) {
        return this.tiles.some(t => t.x === x && t.y === y && t.z === z);
    }

    select(mesh) {
        this.selectedTile = mesh;
        mesh.material.emissive.setHex(0xaaaaaa);
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

        if (this.starField) {
            const positions = this.starField.geometry.attributes.position.array;
            const speeds = this.starField.geometry.attributes.speed.array;

            for (let i = 0; i < speeds.length; i++) {
                positions[i * 3 + 1] -= speeds[i] * dt * 2; // Fall down
                if (positions[i * 3 + 1] < -25) {
                    positions[i * 3 + 1] = 25;
                }
            }
            this.starField.geometry.attributes.position.needsUpdate = true;
        }
    }
}
