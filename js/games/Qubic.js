import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class Qubic extends Game {
    constructor(app) {
        super(app);
        this.name = 'Qubic (3D Tic-Tac-Toe)';
        this.currentPlayer = 1; // 1 or 2
        this.gridSize = 3;
        this.grid = []; // 3D array [x][y][z]
        this.raycaster = new THREE.Raycaster();
        this.interactionObjects = [];
        this.pieces = new THREE.Group();
        this.scene.add(this.pieces);
    }

    init() {
        // Hide global score for this game
        if (this.app.ui && this.app.ui.elements.score) {
            this.app.ui.elements.score.style.display = 'none';
        }

        this.camera.position.set(5, 5, 8);
        this.camera.lookAt(0, 0, 0);

        // Lights
        const ambient = new THREE.AmbientLight(0x404040);
        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(5, 10, 7);
        this.scene.add(ambient, directional);

        // Initialize Grid Data & Visuals
        const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const transparentMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false
        });
        const hoverMat = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });

        // Centering offset
        const offset = (this.gridSize - 1) / 2;

        for (let x = 0; x < this.gridSize; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridSize; y++) {
                this.grid[x][y] = [];
                for (let z = 0; z < this.gridSize; z++) {
                    this.grid[x][y][z] = 0; // 0 = empty, 1 = P1, 2 = P2

                    // Visual placeholder for raycasting
                    const cell = new THREE.Mesh(boxGeo, transparentMat);
                    cell.position.set(x - offset, y - offset, z - offset);
                    cell.userData = { x, y, z };
                    this.scene.add(cell);
                    this.interactionObjects.push(cell);
                }
            }
        }

        // Helper Grid Lines
        const gridHelper = new THREE.GridHelper(5, 5);
        gridHelper.position.y = -2;
        this.scene.add(gridHelper);

        this.createStarfield();
    }

    // ... (rest of methods) ...

    makeMove(x, y, z) {
        if (this.grid[x][y][z] !== 0) return; // Occupied

        // update State
        this.grid[x][y][z] = this.currentPlayer;

        // Visual
        const offset = (this.gridSize - 1) / 2;
        const pos = new THREE.Vector3(x - offset, y - offset, z - offset);

        let mesh;
        if (this.currentPlayer === 1) {
            // Player 1: Sphere
            mesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0x3498db }));
        } else {
            // Player 2: Cube
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
        }
        mesh.position.copy(pos);
        this.pieces.add(mesh);

        // Sound
        if (this.app.audio) this.app.audio.playDrop();

        // Check Win
        if (this.checkWin(this.currentPlayer)) {
            const winner = this.currentPlayer === 1 ? "BLUE WINS!" : "RED WINS!";
            if (this.app.audio) this.app.audio.playWin();
            this.app.onGameOver(winner);
        } else {
            // Switch Player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
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
            color: 0x88ccff,
            size: 0.15,
            transparent: true,
            opacity: 0.6
        });

        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
    }

    onInput(type, coords) {
        if (this.isGameOver) return;

        // Simple orbital controls logic could be added here for camera rotation
        if (type === 'move') {
            // Optional: Highlight cell under cursor
        } else if (type === 'end') {
            this.handleTap(coords);
        }
    }

    // Add simple rotation for better view
    update(dt) {
        // Slowly rotate structure to help depth perception if not interacting
        this.scene.rotation.y += 0.1 * dt;

        if (this.stars) {
            this.stars.rotation.y += 0.05 * dt;
        }
    }

    handleTap(coords) {
        this.raycaster.setFromCamera(coords, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactionObjects);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const { x, y, z } = hit.userData;
            this.makeMove(x, y, z);
        }
    }

    makeMove(x, y, z) {
        if (this.grid[x][y][z] !== 0) return; // Occupied

        // update State
        this.grid[x][y][z] = this.currentPlayer;

        // Visual
        const offset = (this.gridSize - 1) / 2;
        const pos = new THREE.Vector3(x - offset, y - offset, z - offset);

        let mesh;
        if (this.currentPlayer === 1) {
            // Player 1: Sphere
            mesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshStandardMaterial({ color: 0x3498db }));
        } else {
            // Player 2: Cube
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshStandardMaterial({ color: 0xe74c3c }));
        }
        mesh.position.copy(pos);
        this.pieces.add(mesh);

        // Sound
        if (this.app.audio) this.app.audio.playDrop();

        // Check Win
        if (this.checkWin(this.currentPlayer)) {
            const winner = this.currentPlayer === 1 ? "BLUE WINS!" : "RED WINS!";
            if (this.app.audio) this.app.audio.playWin();
            this.app.onGameOver(winner);
        } else {
            // Switch Player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
    }

    checkWin(player) {
        // Naive Check: Check all lines
        const N = this.gridSize;

        // 1. Orthogonal Lines
        // Check X lines
        for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) {
            if (this.checkLine(player, 0, y, z, 1, 0, 0)) return true;
        }
        // Check Y lines
        for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
            if (this.checkLine(player, x, 0, z, 0, 1, 0)) return true;
        }
        // Check Z lines
        for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) {
            if (this.checkLine(player, x, y, 0, 0, 0, 1)) return true;
        }

        // 2. 2D Diagonals on planes
        // XY Planes
        for (let z = 0; z < N; z++) {
            if (this.checkLine(player, 0, 0, z, 1, 1, 0)) return true;
            if (this.checkLine(player, 0, N - 1, z, 1, -1, 0)) return true;
        }
        // XZ Planes
        for (let y = 0; y < N; y++) {
            if (this.checkLine(player, 0, y, 0, 1, 0, 1)) return true;
            if (this.checkLine(player, 0, y, N - 1, 1, 0, -1)) return true;
        }
        // YZ Planes
        for (let x = 0; x < N; x++) {
            if (this.checkLine(player, x, 0, 0, 0, 1, 1)) return true;
            if (this.checkLine(player, x, 0, N - 1, 0, 1, -1)) return true;
        }

        // 3. 3D Diagonals (only 4)
        if (this.checkLine(player, 0, 0, 0, 1, 1, 1)) return true;
        if (this.checkLine(player, 0, 0, N - 1, 1, 1, -1)) return true;
        if (this.checkLine(player, 0, N - 1, 0, 1, -1, 1)) return true;
        if (this.checkLine(player, 0, N - 1, N - 1, 1, -1, -1)) return true;

        return false;
    }

    checkLine(player, sx, sy, sz, dx, dy, dz) {
        for (let i = 0; i < this.gridSize; i++) {
            if (this.grid[sx + dx * i][sy + dy * i][sz + dz * i] !== player) return false;
        }
        return true;
    }
}
