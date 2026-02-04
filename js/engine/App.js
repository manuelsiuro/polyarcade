import * as THREE from 'three';
import { UIManager } from './UIManager.js';
import { SoundManager } from './SoundManager.js';

export class App {
    constructor() {
        this.ui = new UIManager();
        this.audio = new SoundManager();
        this.games = []; // List of game references
        this.activeGame = null;

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Resize Handler
        window.addEventListener('resize', this.resize.bind(this));

        // Input Handling
        this.setupInput();

        // Main Loop
        this.clock = new THREE.Clock();
        this.renderer.setAnimationLoop(this.tick.bind(this));

        // Initial State
        this.createMainMenuScene();
        this.ui.showMenu();
        this.ui.onBackToMenu(this.returnToMenu.bind(this));
        this.ui.onReplay(this.replayGame.bind(this));
    }

    registerGames(gameClasses) {
        this.games = gameClasses;
        this.ui.populateGameList(gameClasses, (index) => {
            this.loadGame(index);
        });
    }

    loadGame(index) {
        if (this.activeGame) this.activeGame.dispose();

        const GameClass = this.games[index].class;
        this.currentGameIndex = index;
        this.activeGame = new GameClass(this);
        this.activeGame.init();

        this.ui.showHUD();
        this.menuScene = null; // Disable menu scene rendering
    }

    returnToMenu() {
        if (this.activeGame) {
            this.activeGame.dispose();
            this.activeGame = null;
        }
        this.createMainMenuScene();
        this.ui.showMenu();
    }

    replayGame() {
        this.loadGame(this.currentGameIndex);
    }

    onGameOver(score) {
        this.ui.showGameOver(score);
    }

    createMainMenuScene() {
        this.menuScene = new THREE.Scene();
        this.menuCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.menuCamera.position.z = 15;

        // Lights
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 5, 5);
        this.menuScene.add(light);
        this.menuScene.add(new THREE.AmbientLight(0x222222));

        // Particle System
        const count = 1000;
        const posArray = new Float32Array(count * 3);
        const colorArray = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 40;
            // Colors: Pink/Blue gradient
            colorArray[i] = Math.random();
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        // Simple textured material logic (or just points)
        const mat = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.particleMesh = new THREE.Points(geo, mat);
        this.menuScene.add(this.particleMesh);

        // Add some floating shapes
        this.shapes = [];
        const geoms = [
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.OctahedronGeometry(1, 0),
            new THREE.TetrahedronGeometry(1, 0)
        ];

        for (let i = 0; i < 5; i++) {
            const mesh = new THREE.Mesh(
                geoms[i % geoms.length],
                new THREE.MeshStandardMaterial({
                    color: Math.random() > 0.5 ? 0xff0055 : 0x00e5ff,
                    wireframe: true
                })
            );
            mesh.position.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 5
            );
            mesh.rotation.x = Math.random() * Math.PI;
            this.menuScene.add(mesh);
            this.shapes.push({ mesh, speed: (Math.random() - 0.5) * 0.02 });
        }
    }

    tick() {
        const dt = this.clock.getDelta();

        if (this.activeGame) {
            this.activeGame.update(dt);
            this.renderer.render(this.activeGame.scene, this.activeGame.camera);
            this.ui.updateScore(this.activeGame.score);
        } else if (this.menuScene) {
            // Menu Animation
            if (this.particleMesh) {
                this.particleMesh.rotation.y += 0.001;
                this.particleMesh.rotation.x += 0.0005;
            }
            if (this.shapes) {
                this.shapes.forEach(s => {
                    s.mesh.rotation.x += 0.01;
                    s.mesh.rotation.y += 0.01;
                    s.mesh.position.y += Math.sin(this.clock.getElapsedTime() + s.mesh.position.x) * 0.01;
                });
            }
            this.renderer.render(this.menuScene, this.menuCamera);
        }
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);

        if (this.activeGame) {
            this.activeGame.camera.aspect = w / h;
            this.activeGame.camera.updateProjectionMatrix();
        } else if (this.menuCamera) {
            this.menuCamera.aspect = w / h;
            this.menuCamera.updateProjectionMatrix();
        }
    }

    setupInput() {
        this.lastTouchTime = 0;

        const onInput = (e, type) => {
            // Ignore mouse events if triggered by touch (within 500ms)
            if (Date.now() - this.lastTouchTime < 500) return;

            if (!this.activeGame) return;

            // Normalize coordinates -1 to 1
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;

            this.activeGame.onInput(type, new THREE.Vector2(x, y));
        };

        const onTouch = (e, type) => {
            this.lastTouchTime = Date.now();

            if (!this.activeGame || e.changedTouches.length === 0) return;

            // Prevent default browser scrolling/zooming only when interacting with the game
            // BUT, allow ensuring UI buttons still work.
            // Since we are attaching to window, we should be careful.
            // If the target is a button, let it be?
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                if (e.type !== 'touchend') e.preventDefault();
            }

            const t = e.changedTouches[0];
            const x = (t.clientX / window.innerWidth) * 2 - 1;
            const y = -(t.clientY / window.innerHeight) * 2 + 1;
            this.activeGame.onInput(type, new THREE.Vector2(x, y));
        };

        window.addEventListener('mousedown', e => onInput(e, 'start'));
        window.addEventListener('mousemove', e => onInput(e, 'move'));
        window.addEventListener('mouseup', e => onInput(e, 'end'));

        window.addEventListener('touchstart', e => onTouch(e, 'start'), { passive: false });
        window.addEventListener('touchmove', e => onTouch(e, 'move'), { passive: false });
        window.addEventListener('touchend', e => onTouch(e, 'end'), { passive: false });

        window.addEventListener('keydown', e => {
            if (!this.activeGame) return;
            this.activeGame.onInput('key', e.code); // Pass key code e.g. "ArrowUp"
        });
    }
}
