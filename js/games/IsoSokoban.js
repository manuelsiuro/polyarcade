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
        this.gameState = 'MENU'; // 'MENU' or 'PLAYING'
        this.currentLevelIndex = 0;
        this.menuPage = 0;

        // Data
        // Source : https://borgar.net/programs/sokoban/#Intro
        this.levels = [
            // Level 1
            [
                '#######',
                '#     #',
                '#  $$ #',
                '# $ $@#',
                '#..####',
                '#..#',
                '####',
            ],
            // Level 2
            [
                '  #####',
                '  #.  #',
                '###   #',
                '# $*$ #',
                '#   ###',
                '#@ .#',
                '#####',
            ],
            // Level 3
            [
                '########',
                '#     .#',
                '#   $$@#',
                '#  #  .#',
                '########',
            ],
            // Level 4
            [
                '#######',
                '#    .#',
                '#  $$.#',
                '#  # @#',
                '#######',
            ],
            // Level 5
            [
                '########',
                '#     .#',
                '#  $$ @#',
                '#  #  .#',
                '########',
            ],
            // Level 6
            [
                '######',
                '#   .#',
                '# $$@#',
                '#  #.#',
                '######',
            ],
            // Level 7
            [
                '######',
                '#   .#',
                '# $$.#',
                '# $@.#',
                '######',
            ],
            // Level 8
            [
                '########',
                '#   #  #',
                '#     .#',
                '# $$  @#',
                '# #   .#',
                '########',
            ],
            // Level 9
            [
                '######',
                '#   .#',
                '# $$+#',
                '#  # #',
                '#    #',
                '######',
            ],
            // Level 10
            [
                '######',
                '#   .#',
                '# $$@#',
                '#  # #',
                '#.   #',
                '######',
            ],
            // Level 11
            [
                '######',
                '# @ .#',
                '# $$ #',
                '#  #.#',
                '#    #',
                '######',
            ],
            // Level 12
            [
                '######',
                '#   .#',
                '# $$@#',
                '#  # #',
                '# .  #',
                '######',
            ],
            // Level 13
            [
                ' #####',
                '##@ .#',
                '# $$.#',
                '#    #',
                '######',
            ],
            // Level 14
            [
                '######',
                '#   .#',
                '# $$ #',
                '# @###',
                '##.#',
                ' ###',
            ],
            // Level 15
            [
                '######',
                '# @ .#',
                '# $$ #',
                '#  # #',
                '#   .#',
                '######',
            ],
            // Level 16
            [
                '#######',
                '#  $ .#',
                '#  @$ #',
                '#  #$.#',
                '#  . ##',
                '######',
            ],
            // Level 17
            [
                '######',
                '# @ .#',
                '# $$ #',
                '#  # #',
                '##.  #',
                ' #####',
            ],
            // Level 18
            [
                '#######',
                '#    .#',
                '# $$#.#',
                '# $@ .#',
                '#     #',
                '#######',
            ],
            // Level 19
            [
                '########',
                '#     .#',
                '# @$$$.#',
                '#  #  .#',
                '########',
            ],
            // Level 20
            [
                '#######',
                '#     #',
                '#    .#',
                '#@$$$.#',
                '#  # .#',
                '#######',
            ],
            // Level 21
            [
                '#######',
                '#    .#',
                '#@$$$.#',
                '#   #.#',
                '#######',
            ],
            // Level 22
            [
                '######',
                '# @$.#',
                '#    #',
                '# $#.#',
                '#    #',
                '######',
            ],
            // Level 23
            [
                '########',
                '#   # .#',
                '#   $$@#',
                '####   #',
                '   #  .#',
                '   #####',
            ],
            // Level 24
            [
                '########',
                '#   # .#',
                '#   $$+#',
                '####   #',
                '   #   #',
                '   #####',
            ],
            // Level 25
            [
                ' #####',
                '##  .#',
                '# $$ #',
                '# @.##',
                '#####',
            ],
            // Level 26
            [
                ' #######',
                '##    .#',
                '#   $$@#',
                '#   # .#',
                '########',
            ],
            // Level 27
            [
                ' #####',
                '##  .#',
                '# $$@#',
                '# .  #',
                '######',
            ],
            // Level 28
            [
                ' ####',
                ' #  #',
                '##  ###',
                '#    .#',
                '# $$ @#',
                '# #  .#',
                '#######',
            ],
            // Level 29
            [
                '  ####',
                ' ##  ###',
                '##     #',
                '#  @$$.#',
                '#   # .#',
                '########',
            ],
            // Level 30
            [
                '######',
                '#.  .#',
                '# $$ #',
                '#$ # #',
                '#@  .#',
                '######',
            ],
            // Level 31
            [
                '######',
                '#.  .#',
                '# $$ #',
                '#$ # #',
                '#@ . #',
                '######',
            ],
            // Level 32
            [
                ' #####',
                ' #   #',
                '##  .#',
                '# $$ #',
                '# .@##',
                '#####',
            ],
            // Level 33
            [
                '#########',
                '#   #  .#',
                '#   $$ @#',
                '####   .#',
                '   #  ###',
                '   ####',
            ],
            // Level 34
            [
                '########',
                '#   # .#',
                '#   $$@#',
                '####  .#',
                '   #  ##',
                '   #  #',
                '   ####',
            ],
            // Level 35
            [
                '########',
                '#   # .#',
                '#   $$.##',
                '####   @#',
                '   # ## #',
                '   #    #',
                '   ######',
            ],
            // Level 36
            [
                '########',
                '#   # .#',
                '#   $$.#',
                '####  @#',
                '   ##  #',
                '    ####',
            ],
            // Level 37
            [
                '######',
                '# @$.#',
                '# $$.#',
                '#  #.#',
                '#    #',
                '######',
            ],
            // Level 38
            [
                '########',
                '#   # .#',
                '#   $$@#',
                '####  .#',
                '   ##  #',
                '    #  #',
                '    ####',
            ],
            // Level 39
            [
                '#######',
                '#    .#',
                '# $$  #',
                '###@# #',
                '  #  .#',
                '  #####',
            ],
            // Level 40
            [
                '########',
                '#   # .#',
                '#   $$@#',
                '####  .#',
                '   #   #',
                '   #####',
            ],
            // Level 41
            [
                '########',
                '#   # .#',
                '#   $$@#',
                '###   .#',
                '  ######',
            ],
            // Level 42
            [
                '########',
                '#   # .#',
                '#   $$.#',
                '####  @#',
                '   #  ##',
                '   ####',
            ],
            // Level 43
            [
                '########',
                '#   # .#',
                '#   $$.#',
                '#  #  @#',
                '#    ###',
                '######',
            ],
            // Level 44
            [
                '#######',
                '#  # .#',
                '#  $$.#',
                '# #  @#',
                '#    ##',
                '######',
            ],
            // Level 45
            [
                '####',
                '#  ####',
                '#  # .#',
                '#  $$.#',
                '##   @#',
                ' #  ###',
                ' ####',
            ],
            // Level 46
            [
                '    ####',
                '##### .#',
                '#   $$.#',
                '# #   @#',
                '#   ####',
                '#####',
            ],
            // Level 47
            [
                '#####',
                '#   ###',
                '#..$$.#',
                '# $$@ #',
                '#   .##',
                '######',
            ],
            // Level 48
            [
                '#####',
                '#   ###',
                '#..$$.#',
                '# $$@ #',
                '##  .##',
                ' #####',
            ],
            // Level 49
            [
                '#######',
                '#     #',
                '# +$# #',
                '# **  #',
                '# *   #',
                '#######',
            ],
            // Level 50
            [
                '#######',
                '#     #',
                '#     #',
                '#  #  #',
                '#$$$$$#',
                '#..+..#',
                '#######',
            ],
            // Level 51
            [
                '########',
                '#..... #',
                '#$ ##$ #',
                '# $##  #',
                '#  $@$ #',
                '#     ##',
                '#######',
            ],
            // Level 52
            [
                '########',
                '#......#',
                '# $##$ #',
                '#  ##  #',
                '# $$@$$#',
                '#      #',
                '#   #  #',
                '########',
            ],
            // Level 53
            [
                '####',
                '# @#',
                '# $##',
                '# $.#',
                '# $.#',
                '# $.#',
                '###.#',
                '  ###',
            ],
            // Level 54
            [
                '#######',
                '#. ...#',
                '# $ # #',
                '#$#$$@#',
                '#    ##',
                '#   ##',
                '#####',
            ],
            // Level 55
            [
                '      ####',
                '      #  ###',
                '#######    #',
                '# $ *. *.$@#',
                '#     #    #',
                '############',
            ],
            // Level 56
            [
                '##### #####',
                '#  @# #   #',
                '# $$### $ #',
                '# ..   .  #',
                '###########',
            ],
            // Level 57
            [
                '        #####',
                '#########   #',
                '#  ......$  #',
                '#   #$###   #',
                '### $@$ #   #',
                '  # $ $ #   #',
                '  #     #####',
                '  #######',
            ],
            // Level 58
            [
                '       #####',
                '########   #',
                '# ......$  #',
                '#  #$###   #',
                '## $@$ #   #',
                ' # $ $ #   #',
                ' #     #####',
                ' #######',
            ],
            // Level 59
            [
                '#######',
                '#.   .#',
                '# # $ #',
                '#@$$# #',
                '#   $ #',
                '#. # .#',
                '#######',
            ],
            // Level 60
            [
                ' ######',
                '##   .#',
                '#.  $ #',
                '#$#$# #',
                '#@  $ #',
                '#.  #.#',
                '#######',
            ],
            // Level 61
            [
                '######',
                '#    #',
                '#  $ ####',
                '# $$ #  ##',
                '# # ##$  #',
                '#...  .. #',
                '####### ##',
                '#   ##   #',
                '#@$   .$ #',
                '#   ##   #',
                '#   ######',
                '#####',
            ],
        ];

        // Gameplay Objects
        this.gridSize = 8;
        this.tileSize = 2;

        // Scene Groups
        this.gameGroup = new THREE.Group();
        this.menuGroup = new THREE.Group();
        this.scene.add(this.gameGroup);
        this.scene.add(this.menuGroup);

        this.boxes = [];
        this.holes = [];
        this.targets = [];
        this.menuItems = []; // Cubes/Arrows for raycasting

        this.isMoving = false;
        this.playerTarget = { x: 0, z: 0 };

        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // Persistence
        this.progress = this.loadProgress();
    }

    loadProgress() {
        const data = localStorage.getItem('isoSokoban_progress');
        return data ? JSON.parse(data) : {};
    }

    saveProgress(levelIndex, moves) {
        if (!this.progress[levelIndex] || moves < this.progress[levelIndex].bestMoves) {
            this.progress[levelIndex] = {
                completed: true,
                bestMoves: moves,
                date: Date.now()
            };
            localStorage.setItem('isoSokoban_progress', JSON.stringify(this.progress));
        }
    }

    getBestScore(levelIndex) {
        return this.progress[levelIndex] ? this.progress[levelIndex].bestMoves : null;
    }

    init() {
        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 5);
        dirLight.castShadow = true;
        this.scene.add(ambient, dirLight);

        // Initialize Background
        this.createStarfield();

        // Start in Menu
        this.showMenu(0);
    }

    createStarfield() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1500;
        const starPos = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 120;
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

    // --- MENU SYSTEM ---

    showMenu(pageIndex) {
        this.gameState = 'MENU';
        this.menuPage = pageIndex;
        this.gameGroup.visible = false;
        this.menuGroup.visible = true;

        // Clear previous menu
        this.clearGroup(this.menuGroup);
        this.menuItems = [];

        // Pagination Config
        const ITEMS_PER_PAGE = 9;
        const startIdx = pageIndex * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, this.levels.length);

        // Create Grid of Cubes
        let col = 0;
        let row = 0;

        for (let i = startIdx; i < endIdx; i++) {
            const x = (col - 1) * 3; // -3, 0, 3
            const z = (row - 1) * 3; // -3, 0, 3

            const isCompleted = !!this.progress[i];
            const bestScore = this.getBestScore(i);

            const cube = this.createMenuCube(i + 1, x, z, isCompleted, bestScore);
            cube.userData = { type: 'level', index: i };
            this.menuItems.push(cube);

            col++;
            if (col > 2) {
                col = 0;
                row++;
            }
        }

        // Pagination Arrows
        if (pageIndex > 0) {
            const prev = this.createMenuArrow('left', -6, 0);
            prev.userData = { type: 'prev' };
            this.menuItems.push(prev);
        }

        if (endIdx < this.levels.length) {
            const next = this.createMenuArrow('right', 6, 0);
            next.userData = { type: 'next' };
            this.menuItems.push(next);
        }

        // Reset Score UI
        if (this.app.ui && this.app.ui.updateScore) {
            this.app.ui.updateScore("MENU");
        }
    }

    createMenuCube(levelNum, x, z, isCompleted = false, bestScore = null) {
        const size = 1.5;
        const baseColor = isCompleted ? 0x2ecc71 : 0x00ffff; // Green for completed, Cyan for normal

        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.3,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0, z);

        // Neon Edges
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: baseColor }));
        mesh.add(line);

        // Text Number (Canvas Texture)
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = isCompleted ? '#2ecc71' : '#00ffff';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(levelNum.toString(), 64, 64);

        if (bestScore !== null) {
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Best: ${bestScore}`, 64, 100);
        }

        const tex = new THREE.CanvasTexture(canvas);
        const textGeo = new THREE.PlaneGeometry(1.2, 1.2);
        const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.y = 1; // Float above
        textMesh.rotation.y = -Math.PI / 4; // Face camera roughly
        textMesh.lookAt(this.camera.position);
        mesh.add(textMesh);

        this.menuGroup.add(mesh);
        return mesh;
    }

    createMenuArrow(dir, x, z) {
        const shape = new THREE.Shape();
        if (dir === 'right') {
            shape.moveTo(0, -1);
            shape.lineTo(1.5, 0);
            shape.lineTo(0, 1);
        } else {
            shape.moveTo(0, -1);
            shape.lineTo(-1.5, 0);
            shape.lineTo(0, 1);
        }

        const geo = new THREE.ShapeGeometry(shape);
        const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 0, z + 2); // Slightly forward

        this.menuGroup.add(mesh);
        return mesh;
    }

    // --- GAMEPLAY SYSTEM ---

    loadLevel(index) {
        this.gameState = 'PLAYING';
        this.currentLevelIndex = index;
        this.gameGroup.visible = true;
        this.menuGroup.visible = false;

        const map = this.levels[index];
        console.log(`Loading Level ${index + 1}`, map);

        this.boxes = [];
        this.holes = [];
        this.targets = [];
        this.score = 0;

        this.clearGroup(this.gameGroup);

        // Calculate Level Dimensions
        const mapDepth = map.length;
        const mapWidth = Math.max(...map.map(row => row.length));

        // Adjust Camera (Auto-Fit)
        const aspect = window.innerWidth / window.innerHeight;
        const maxDimX = mapWidth * this.tileSize;
        const maxDimZ = mapDepth * this.tileSize;

        // Dynamic Zoom based on Aspect Ratio
        const padding = 1.35;
        const D_Height = (maxDimZ / 2) * padding;
        const D_Width = ((maxDimX / 2) / aspect) * padding;

        const requiredD = Math.max(12, D_Height, D_Width);

        this.camera.left = -requiredD * aspect;
        this.camera.right = requiredD * aspect;
        this.camera.top = requiredD;
        this.camera.bottom = -requiredD;
        this.camera.updateProjectionMatrix();

        // Floor Base using Dynamic Size
        const floorW = mapWidth * this.tileSize;
        const floorH = mapDepth * this.tileSize;

        const floorGeo = new THREE.PlaneGeometry(floorW + 2, floorH + 2);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x34495e });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;

        floor.position.set(
            (floorW / 2) - (this.tileSize / 2),
            -0.1,
            (floorH / 2) - (this.tileSize / 2)
        );
        this.gameGroup.add(floor);

        map.forEach((row, z) => {
            for (let x = 0; x < row.length; x++) {
                const char = row[x];

                // Wall
                if (char === '#') {
                    this.createBlock(x, z, 1.5, 0x95a5a6);
                }

                // Floor Objects (Target, Hole)
                if (char === 'T' || char === '.' || char === '+' || char === '*') {
                    this.createTile(x, z, 0x2ecc71); // Target
                    this.targets.push({ x, z });
                }

                if (char === 'H') {
                    this.createHole(x, z);
                }

                // Entities (Player, Box)
                if (char === 'P' || char === '@' || char === '+') {
                    // Player
                    this.playerPos = { x, z };
                    this.playerTarget = { x, z };
                    this.playerMesh = this.createEntity(x, z, 0xe74c3c, 0.8);
                }

                if (char === 'B' || char === '$' || char === '*') {
                    // Box
                    const box = this.createEntity(x, z, 0xf1c40f, 1.4, 'box');
                    this.boxes.push({ x, z, mesh: box, targetX: x, targetZ: z, isMoving: false });
                }
            }
        });

        // Center the board
        const centerX = (mapWidth * this.tileSize) / 2 - (this.tileSize / 2);
        const centerZ = (mapDepth * this.tileSize) / 2 - (this.tileSize / 2);
        this.gameGroup.position.set(-centerX, 0, -centerZ);

        // Setup UI
        if (this.app.ui && this.app.ui.updateScore) {
            this.app.ui.updateScore(this.score);
        }
    }

    clearGroup(group) {
        while (group.children.length > 0) {
            group.remove(group.children[0]);
        }
    }

    // ... (Visual Creation Helpers same as before but using this.gameGroup) ...

    createTile(x, z, color) {
        const geo = new THREE.PlaneGeometry(this.tileSize * 0.8, this.tileSize * 0.8);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x * this.tileSize, 0.05, z * this.tileSize);
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
        mesh.add(line);
        this.gameGroup.add(mesh);
    }

    createHole(x, z) {
        const geo = new THREE.BoxGeometry(this.tileSize, 0.5, this.tileSize);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * this.tileSize, -0.25, z * this.tileSize);
        const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(this.tileSize, this.tileSize));
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 }));
        line.rotation.x = -Math.PI / 2;
        line.position.y = 0.26;
        mesh.add(line);
        this.gameGroup.add(mesh);
        this.holes.push({ x, z });
    }

    createBlock(x, z, height, color) {
        const wallHeight = 0.5;
        const geo = new THREE.BoxGeometry(this.tileSize, wallHeight, this.tileSize);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.1, transparent: true, opacity: 0.8 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x * this.tileSize, wallHeight / 2, z * this.tileSize);
        this.gameGroup.add(mesh);
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 }));
        mesh.add(line);
    }

    createEntity(x, z, color, scale, type = 'sphere') {
        let mesh;
        if (type === 'box') {
            const size = this.tileSize * 0.8;
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.8, transparent: true, opacity: 0.6 });
            mesh = new THREE.Mesh(geo, mat);
            const edges = new THREE.EdgesGeometry(geo);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
            mesh.add(line);
            const innerGeo = new THREE.BoxGeometry(size * 0.6, size * 0.6, size * 0.6);
            const innerMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
            mesh.add(new THREE.Mesh(innerGeo, innerMat));
        } else {
            const geo = new THREE.IcosahedronGeometry(this.tileSize * 0.3, 1);
            const mat = new THREE.MeshStandardMaterial({ color: 0xff3366, emissive: 0xff0033, emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.8 });
            mesh = new THREE.Mesh(geo, mat);
            const ringGeo = new THREE.TorusGeometry(this.tileSize * 0.4, 0.05, 8, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
        }
        mesh.position.set(x * this.tileSize, 1, z * this.tileSize);
        this.gameGroup.add(mesh);
        return mesh;
    }

    // --- INPUT & UPDATE ---

    onInput(type, coords) {
        if (type === 'start') {
            // Raycast for Menu Interaction
            if (this.gameState === 'MENU') {
                this.raycaster.setFromCamera(coords, this.camera);
                const intersects = this.raycaster.intersectObjects(this.menuItems, true); // Recursive in case of children

                if (intersects.length > 0) {
                    // Find the parent with userData
                    let target = intersects[0].object;
                    while (target.parent && !target.userData.type) {
                        target = target.parent;
                    }

                    if (target.userData.type === 'level') {
                        if (this.app.audio) this.app.audio.playDrop();
                        this.loadLevel(target.userData.index);
                    } else if (target.userData.type === 'prev') {
                        this.showMenu(this.menuPage - 1);
                    } else if (target.userData.type === 'next') {
                        this.showMenu(this.menuPage + 1);
                    }
                }
                return; // Consume click for menu
            }

            this.startPoint3D = this.getGroundIntersection(coords);
        } else if (type === 'end') {
            if (this.gameState !== 'PLAYING') return;

            const endPoint3D = this.getGroundIntersection(coords);
            if (!this.startPoint3D || !endPoint3D) return;

            const dx = endPoint3D.x - this.startPoint3D.x;
            const dz = endPoint3D.z - this.startPoint3D.z;

            if (Math.abs(dx) < 0.5 && Math.abs(dz) < 0.5) return;

            if (Math.abs(dx) > Math.abs(dz)) {
                if (dx > 0) this.tryMove(1, 0);
                else this.tryMove(-1, 0);
            } else {
                if (dz > 0) this.tryMove(0, 1);
                else this.tryMove(0, -1);
            }
        }
    }

    getGroundIntersection(coords) {
        this.raycaster.setFromCamera(coords, this.camera);
        const target = new THREE.Vector3();
        const hit = this.raycaster.ray.intersectPlane(this.groundPlane, target);
        return hit;
    }

    tryMove(dx, dz) {
        if (this.isMoving) return;

        const nextX = this.playerPos.x + dx;
        const nextZ = this.playerPos.z + dz;

        if (this.isWall(nextX, nextZ)) return;

        const boxIndex = this.boxes.findIndex(b => b.x === nextX && b.z === nextZ);

        if (boxIndex !== -1) {
            const boxNextX = nextX + dx;
            const boxNextZ = nextZ + dz;
            if (this.isWall(boxNextX, boxNextZ) || this.isBox(boxNextX, boxNextZ)) return;
            this.moveBox(boxIndex, boxNextX, boxNextZ);
        }

        if (this.app.audio) this.app.audio.playDrop();

        this.playerTarget.x = nextX;
        this.playerTarget.z = nextZ;
        this.isMoving = true;

        this.score++;
        if (this.app.ui && this.app.ui.updateScore) {
            this.app.ui.updateScore(this.score);
        }
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

        if (this.stars) {
            this.stars.rotation.y += 0.05 * dt;
        }

        // Animate Menu Items
        if (this.gameState === 'MENU') {
            this.menuItems.forEach(item => {
                if (item.userData.type === 'level') {
                    item.rotation.y += 0.5 * dt;
                    item.position.y = Math.sin(Date.now() * 0.002 + item.position.x) * 0.2;
                }
            });
        }

        if (this.isMoving) {
            let stillAnimating = false;
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
            if (this.app.audio) this.app.audio.playExplosion();
            box.mesh.position.y = 0.5; // Sink
            box.mesh.scale.setScalar(0.9);
        }
    }

    checkWin() {
        const win = this.targets.every(t => this.isBox(t.x, t.z));
        if (win) {
            if (this.app.audio) this.app.audio.playWin();

            // Save Progress
            this.saveProgress(this.currentLevelIndex, this.score);

            // Victory Delay -> Next Level or Menu
            setTimeout(() => {
                const nextIndex = this.currentLevelIndex + 1;
                if (nextIndex < this.levels.length) {
                    this.loadLevel(nextIndex);
                } else {
                    this.showMenu(this.menuPage);
                }
            }, 2000);
        }
    }
}
