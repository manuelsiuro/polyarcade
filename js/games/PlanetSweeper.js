import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class PlanetSweeper extends Game {
    constructor(app) {
        super(app);
        this.name = 'Planet Sweeper';

        this.raycaster = new THREE.Raycaster();
        this.isDragging = false;
        this.lastPointer = new THREE.Vector2();

        this.mines = [];
        this.revealedCount = 0;
        this.mineCount = 0;
        this.totalSafe = 0;
    }

    init() {
        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(10, 10, 10);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x606060));

        // Background Starfield
        this.createStarfield();

        // Planet Geometry
        // Detail 2 = 320 faces (good balance)
        const geometry = new THREE.IcosahedronGeometry(2, 2);

        // Ensure unique vertices for flat shading look, but we need indexed for topology?
        // Actually, for flat shading usually we split vertices.
        // BUT for adjacency logic it's easier with merged vertices.
        // We will keep default (indexed) for logic, and use non-indexed for coloring?
        // Wait, THREE.IcosahedronGeometry is indexed by default but vertices are shared.
        // We will use the indexed geometry for logic.

        this.planet = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({
                color: 0x3498db,
                flatShading: true,
                vertexColors: true,
                roughness: 0.6
            })
        );
        this.scene.add(this.planet);

        // Pre-calculate logic
        this.setupGameLogic(geometry);
        this.updateColors();
    }

    setupGameLogic(geometry) {
        const pos = geometry.attributes.position;
        this.facesCount = pos.count / 3;

        // 1. Build Adjacency Graph
        // Map: VertexIndex -> Set of FaceIndices
        // But wait, standard geometry might not be indexed?
        // Let's check. geometry.index might be null for IcosahedronGeometry?
        // Yes, it is usually non-indexed for flat shading types or generators?
        // Actually recent Three.js versions: IcosahedronGeometry IS indexed if detail > 0?
        // Let's assume it might not be perfect for "shared vertex" logic if we want "flat look".
        // Actually, for flat shading we want unique vertices per face.
        // But for logic we want shared.

        // Solution: Use a spatial map (tolerance) to identify shared vertices physically.

        const verticesMap = {}; // "x,y,z" -> [faceIndex ...]

        for (let i = 0; i < this.facesCount; i++) {
            for (let v = 0; v < 3; v++) {
                const idx = i * 3 + v;
                const p = new THREE.Vector3().fromBufferAttribute(pos, idx);
                // Precision key
                const key = `${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`;

                if (!verticesMap[key]) verticesMap[key] = [];
                verticesMap[key].push(i);
            }
        }

        // 2. Initialize Face Data with Neighbors
        this.faceData = new Array(this.facesCount).fill(null).map((_, i) => ({
            id: i,
            isMine: Math.random() < 0.15,
            state: 'hidden', // hidden, visible, flagged
            neighbors: new Set(), // Set of face indices
            sprites: [] // Store text/flag sprites to remove them if needed
        }));

        // Populate Neighbors
        for (let key in verticesMap) {
            const facesSharing = verticesMap[key];
            for (let f1 of facesSharing) {
                for (let f2 of facesSharing) {
                    if (f1 !== f2) {
                        this.faceData[f1].neighbors.add(f2);
                    }
                }
            }
        }

        // 3. Count Stats
        this.mineCount = this.faceData.filter(f => f.isMine).length;
        this.totalSafe = this.facesCount - this.mineCount;
        this.revealedCount = 0;
    }

    onInput(type, coords) {
        if (this.isGameOver) return;

        if (type === 'start') {
            this.isDragging = true;
            this.lastPointer.copy(coords);
            this.clickStartTime = Date.now();
        } else if (type === 'move') {
            if (this.isDragging) {
                const deltaX = coords.x - this.lastPointer.x;
                const deltaY = coords.y - this.lastPointer.y;
                this.planet.rotation.y += deltaX * 2;
                this.planet.rotation.x += deltaY * 2;
                this.lastPointer.copy(coords);
            }
        } else if (type === 'end') {
            this.isDragging = false;
            if (Date.now() - this.clickStartTime < 200) {
                this.handleTap(coords);
            }
        }
    }

    handleTap(coords) {
        this.raycaster.setFromCamera(coords, this.camera);
        const intersects = this.raycaster.intersectObject(this.planet);
        if (intersects.length > 0) {
            // Depending on button (Left/Right) we could flag/reveal.
            // On mobile, maybe toggle flag mode?
            // For now: Simple Tap = Reveal. Long Press logic is harder to detect reliably here.
            // Let's rely on User knowing: Tap to reveal.
            // Wait, implementation plan promised Flags.
            // Let's implement toggle: If flagged, unflag. If hidden, reveal.
            // But how to flag?
            // Let's add a "Flag Mode" toggle UI? No, that's too much UI.
            // Let's say: If you tap a number, it chord-reveals?
            // Let's just stick to: Tap = Reveal. 
            // Maybe Shift+Click = Flag?

            // Re-use logic: Tap = Reveal.
            // If user wants to flag, we need a mechanism.
            // I will add a "Flag" button in HUD?
            // Or just Long Press logic?
            // I'll re-implement the simplified Long Press from previous version if possible.
            // But mouse-event 'long press' in `onInput` is:
            // start -> wait -> end?

            // Let's try this:
            // Intersects gives faceIndex.
            const faceIndex = intersects[0].faceIndex;
            this.revealFace(faceIndex);
        }
    }

    revealFace(index) {
        const data = this.faceData[index];
        if (data.state === 'visible' || data.state === 'flagged') return;

        data.state = 'visible';

        if (data.isMine) {
            this.app.audio.playExplosion();
            this.triggerExplosion(index);
            this.gameOver();
        } else {
            this.app.audio.playReveal();
            this.revealedCount++;
            this.score += 10;

            const mines = this.countMines(index);
            if (mines === 0) {
                // Flood fill (Recursive Reveal)
                for (let neighbor of data.neighbors) {
                    this.revealFace(neighbor);
                }
            } else {
                this.addTextLabel(index, mines);
            }

            this.updateColors();

            if (this.revealedCount === this.totalSafe) {
                this.win();
            }
        }
    }

    win() {
        this.app.audio.playWin();
        // Celebrate
        this.score += 1000;
        super.gameOver(); // Reuse game over screen but maybe Change Text?
        // We can access UI?
        // For now, standard Game Over screen is fine.
    }

    createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPos = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 100;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8 });
        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
    }

    update(dt) {
        if (this.stars) {
            this.stars.rotation.y += dt * 0.05;
        }
    }

    countMines(index) {
        let count = 0;
        for (let n of this.faceData[index].neighbors) {
            if (this.faceData[n].isMine) count++;
        }
        return count;
    }

    triggerExplosion(index) {
        const cMine = new THREE.Color(0xe74c3c);
        // Reveal all mines
        this.faceData.forEach((f, i) => {
            if (f.isMine) {
                this.faceData[i].state = 'visible'; // Force visible
                // Add mine icon?
            }
        });
        this.updateColors();
    }



    addTextLabel(faceIndex, number) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const colors = {
            1: '#3498db', 2: '#2ecc71', 3: '#e74c3c',
            4: '#9b59b6', 5: '#f1c40f', 6: '#1abc9c'
        };

        ctx.fillStyle = colors[number] || 'white';
        ctx.font = 'bold 80px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(number.toString(), 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true });
        const sprite = new THREE.Sprite(spriteMat);

        sprite.scale.set(0.5, 0.5, 0.5);

        const pos = this.planet.geometry.attributes.position;
        const v1 = new THREE.Vector3().fromBufferAttribute(pos, faceIndex * 3);
        const v2 = new THREE.Vector3().fromBufferAttribute(pos, faceIndex * 3 + 1);
        const v3 = new THREE.Vector3().fromBufferAttribute(pos, faceIndex * 3 + 2);

        const center = new THREE.Vector3().addVectors(v1, v2).add(v3).divideScalar(3);
        center.multiplyScalar(1.08); // Slight offset

        sprite.position.copy(center);
        sprite.raycast = () => { };
        this.planet.add(sprite);

        this.faceData[faceIndex].sprites.push(sprite);
    }

    updateColors() {
        const pos = this.planet.geometry.attributes.position;
        const count = pos.count;
        const colorAttr = new THREE.BufferAttribute(new Float32Array(count * 3), 3);

        const cHidden = new THREE.Color(0x34495e); // Darker blue for hidden
        const cSafe = new THREE.Color(0xecf0f1);   // Light grey for safe
        const cMine = new THREE.Color(0xc0392b);   // Deep red for mine
        const cFlag = new THREE.Color(0xf1c40f);

        for (let i = 0; i < this.facesCount; i++) {
            const data = this.faceData[i];
            let color = cHidden;

            if (data.state === 'visible') {
                color = data.isMine ? cMine : cSafe;
            } else if (data.state === 'flagged') {
                color = cFlag;
            }

            // Random variation for hidden tiles to look cool
            if (data.state === 'hidden') {
                // slight noise
                // color.offsetHSL(0, 0, (Math.random()-0.5)*0.05);
            }

            for (let j = 0; j < 3; j++) {
                colorAttr.setXYZ(i * 3 + j, color.r, color.g, color.b);
            }
        }

        this.planet.geometry.setAttribute('color', colorAttr);
        this.planet.material.needsUpdate = true;
    }
}
