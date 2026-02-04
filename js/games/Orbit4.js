import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class Orbit4 extends Game {
    constructor(app) {
        super(app);
        this.name = 'Orbit 4 (Cylinder Connect 4)';

        // Game Constants
        this.columns = 16; // Circumference
        this.rows = 8;     // Height
        this.radius = 2.5;
        this.height = 4;

        // State
        this.grid = Array(this.columns).fill().map(() => Array(this.rows).fill(0));
        this.currentPlayer = 1;
        this.cylinderGroup = new THREE.Group();
        this.tokenGroup = new THREE.Group();
        this.isAnimating = false;

        // Interaction
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.dragStartX = 0;
        this.isDragging = false;

        this.scene.add(this.cylinderGroup);
        this.cylinderGroup.add(this.tokenGroup);
    }

    init() {
        // Hide global score for this game
        if (this.app.ui && this.app.ui.elements.score) {
            this.app.ui.elements.score.style.display = 'none';
        }

        this.camera.position.set(0, 0, 7);
        this.camera.lookAt(0, 0, 0);

        // Lights
        const ambient = new THREE.AmbientLight(0x404040);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(5, 5, 5);
        this.scene.add(ambient, dirLight);

        // Cylindrical Grid Visuals
        const coreGeo = new THREE.CylinderGeometry(this.radius - 0.1, this.radius - 0.1, this.height, 32);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            roughness: 0.7,
            metalness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        this.cylinderGroup.add(core);

        // Dynamic Column Separators
        this.columnLines = [];

        // Materials
        this.defaultLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
        this.activeLineMat = new THREE.MeshBasicMaterial({
            color: 0x39ff14, // Neon Green
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const lineGeo = new THREE.BoxGeometry(0.12, this.height, 0.12); // THICKER for visibility

        for (let c = 0; c < this.columns; c++) {
            const angle = (c / this.columns) * Math.PI * 2;
            const x = Math.sin(angle) * this.radius;
            const z = Math.cos(angle) * this.radius;

            const line = new THREE.Mesh(lineGeo, this.defaultLineMat);
            line.position.set(x, 0, z);
            line.lookAt(0, 0, 0);

            this.cylinderGroup.add(line);
            this.columnLines.push(line);
        }
        // Create Starfield
        this.createStarfield();
    }

    createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPos = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 200; // Wide spread
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0x88ccff, // Slight blue tint for Orbit 4
            size: 0.2,
            transparent: true,
            opacity: 0.6
        });
        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
    }

    update(dt) {
        // Smooth rotation
        this.currentRotation += (this.targetRotation - this.currentRotation) * 5 * dt;
        this.cylinderGroup.rotation.y = this.currentRotation;

        // Rotate background slowly
        if (this.stars) {
            this.stars.rotation.y += dt * 0.02; // Slow rotation
            this.stars.rotation.x += dt * 0.01; // Slight tilt
        }

        // Update Column Highlighting
        const colAngle = (Math.PI * 2) / this.columns;
        const colSteps = Math.round(-this.targetRotation / colAngle);

        let activeIndex = colSteps % this.columns;
        if (activeIndex < 0) activeIndex += this.columns;

        // Log occasionally
        if (Math.random() < 0.01) {
            console.log(`Orbit4 Update: activeIndex ${activeIndex}, rot ${this.currentRotation.toFixed(2)}`);
        }

        // Apply materials
        if (this.columnLines) {
            this.columnLines.forEach((line, index) => {
                if (index === activeIndex) {
                    if (line.material !== this.activeLineMat) {
                        // console.log("Orbit4: Switching line", index, "to active");
                        line.material = this.activeLineMat;
                    }
                    // Pulse opacity slightly (Slower and softer)
                    line.material.opacity = 0.25 + Math.sin(Date.now() * 0.003) * 0.15;
                    line.scale.setScalar(1.0); // Same size
                } else {
                    if (line.material !== this.defaultLineMat) {
                        line.material = this.defaultLineMat;
                        line.scale.setScalar(1.0);
                    }
                }
            });
        }
    }

    onInput(type, coords) {
        if (this.isGameOver || this.isAnimating) return;

        if (type === 'start') {
            this.isDragging = true;
            this.dragStartX = coords.x;
            this.dragStartRotation = this.targetRotation;
        } else if (type === 'move') {
            if (this.isDragging) {
                const deltaX = coords.x - this.dragStartX;
                this.targetRotation = this.dragStartRotation + deltaX * 2;
            }
        } else if (type === 'end') {
            if (this.isDragging) {
                this.isDragging = false;
                // Snap to nearest column
                const colAngle = (Math.PI * 2) / this.columns;
                const snapIndex = Math.round(this.targetRotation / colAngle);
                this.targetRotation = snapIndex * colAngle;

                // If distinct tap (little movement)
                if (Math.abs(coords.x - this.dragStartX) < 0.05) {
                    this.attemptDrop();
                }
            }
        }
    }

    attemptDrop() {
        // Calculate which column handles "front"
        const colSteps = Math.round(-this.targetRotation / ((Math.PI * 2) / this.columns));
        let colIndex = colSteps % this.columns;
        if (colIndex < 0) colIndex += this.columns;

        this.dropToken(colIndex);
    }

    dropToken(colIndex) {
        // Find first empty row
        let rowIndex = -1;
        for (let r = 0; r < this.rows; r++) {
            if (this.grid[colIndex][r] === 0) {
                rowIndex = r;
                break;
            }
        }

        if (rowIndex === -1) return; // Column full

        // Logic
        this.grid[colIndex][rowIndex] = this.currentPlayer;

        // Create Token Visual
        this.createTokenVisual(colIndex, rowIndex, this.currentPlayer);

        // Play Sound
        if (this.app.audio) {
            this.app.audio.playDrop();
        }

        // Win Check
        if (this.checkWin(colIndex, rowIndex, this.currentPlayer)) {
            this.gameOver();
        } else {
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
    }

    gameOver() {
        this.isGameOver = true;
        // Custom message for Orbit 4
        const winner = this.currentPlayer === 1 ? "RED WINS!" : "YELLOW WINS!";
        this.app.onGameOver(winner);
    }

    createTokenVisual(c, r, player) {
        const color = player === 1 ? 0xe74c3c : 0xf1c40f; // Red vs Yellow
        const geo = new THREE.SphereGeometry(0.2, 16, 16);
        const mat = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);

        const angle = (c / this.columns) * Math.PI * 2;

        // Visual Position
        // y: map row 0..rows to -height/2 .. +height/2
        const yBase = -this.height / 2 + 0.25;
        const yStep = (this.height - 0.5) / (this.rows - 1);
        const y = yBase + r * yStep;

        const x = Math.sin(angle) * this.radius;
        const z = Math.cos(angle) * this.radius;

        mesh.position.set(x, this.height / 2 + 1, z); // Start high
        this.tokenGroup.add(mesh);

        // Simple drop animation
        const startY = mesh.position.y;
        const endY = y;
        let t = 0;

        const animate = () => {
            t += 0.1;
            mesh.position.y = THREE.MathUtils.lerp(startY, endY, t);
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                mesh.position.y = endY; // Ensure exact
            }
        };
        animate();
    }

    checkWin(c, r, player) {
        // Check directions: Vertical, Horizontal (looping), Diagonal

        // Helper to get cell safely with wrapping horizontal
        const getCell = (col, row) => {
            if (row < 0 || row >= this.rows) return 0;
            // Wrap column
            let wc = col % this.columns;
            if (wc < 0) wc += this.columns;
            return this.grid[wc][row];
        };

        const checkDir = (dx, dy) => {
            let count = 1;
            // Forward
            for (let i = 1; i < 4; i++) {
                if (getCell(c + dx * i, r + dy * i) === player) count++;
                else break;
            }
            // Backward
            for (let i = 1; i < 4; i++) {
                if (getCell(c - dx * i, r - dy * i) === player) count++;
                else break;
            }
            return count >= 4;
        };

        // Horizontal
        if (checkDir(1, 0)) return true;
        // Vertical
        if (checkDir(0, 1)) return true;
        // Diag 1
        if (checkDir(1, 1)) return true;
        // Diag 2
        if (checkDir(1, -1)) return true;

        return false;
    }
}
