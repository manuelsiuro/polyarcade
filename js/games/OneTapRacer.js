import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { Game } from '../engine/Game.js';
import { F1_TRACKS, getTracksInOrder } from '../data/F1Tracks.js';

export class OneTapRacer extends Game {
    constructor(app) {
        super(app);
        this.name = 'One Tap Racer';

        // Game state
        this.state = 'menu'; // 'menu' | 'racing'
        this.selectedTrackIndex = 0;
        this.currentTrack = null;
        this.orderedTracks = getTracksInOrder();

        // Track
        this.trackCurve = null;
        this.trackLength = 0;
        this.trackWidth = 4;

        // Track preview
        this.trackPreviewLine = null;
        this.trackPreviewGroup = new THREE.Group();

        // Car state
        this.car = {
            t: 0,           // Position on track (0-1)
            speed: 0,
            lateralOffset: 0,
            lateralVelocity: 0,
            mesh: null
        };

        // Physics constants
        this.physics = {
            maxSpeed: 30,
            acceleration: 15,
            brakeDecel: 20,
            centrifugalFactor: 3,
            lateralDamping: 5,
            recoveryForce: 8,
            offTrackDrag: 0.95
        };

        // Input
        this.isTouching = false;

        // Coins
        this.coins = [];
        this.coinMeshTemplate = null;

        // Assets
        this.assets = {};
        this.loader = new GLTFLoader();

        // Groups
        this.trackGroup = new THREE.Group();
        this.environmentGroup = new THREE.Group();
        this.coinGroup = new THREE.Group();
        this.scene.add(this.trackGroup);
        this.scene.add(this.environmentGroup);
        this.scene.add(this.coinGroup);
        this.scene.add(this.trackPreviewGroup);

        // UI Elements (will be created in init)
        this.trackNameElement = null;
        this.trackInstructionsElement = null;
    }

    async init() {
        // Update camera far plane for top-down menu view
        this.camera.far = 500;
        this.camera.updateProjectionMatrix();

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        this.scene.add(ambient, sun);

        // Dark background for menu (will change to sky when racing)
        this.scene.background = new THREE.Color(0x0f0c29);

        // Load assets
        await this.loadAssets();

        // Create UI elements
        this.createTrackMenuUI();

        // Show track selection menu
        this.showTrackMenu();
    }

    createTrackMenuUI() {
        // Track name display
        this.trackNameElement = document.createElement('div');
        this.trackNameElement.id = 'track-name';
        this.trackNameElement.className = 'track-menu-ui';
        document.getElementById('ui-layer').appendChild(this.trackNameElement);

        // Country display
        this.trackCountryElement = document.createElement('div');
        this.trackCountryElement.id = 'track-country';
        this.trackCountryElement.className = 'track-menu-ui';
        document.getElementById('ui-layer').appendChild(this.trackCountryElement);

        // Track counter (e.g., "1 / 24")
        this.trackCounterElement = document.createElement('div');
        this.trackCounterElement.id = 'track-counter';
        this.trackCounterElement.className = 'track-menu-ui';
        document.getElementById('ui-layer').appendChild(this.trackCounterElement);

        // Left arrow button
        this.leftArrowBtn = document.createElement('button');
        this.leftArrowBtn.id = 'track-arrow-left';
        this.leftArrowBtn.className = 'track-arrow-btn';
        this.leftArrowBtn.innerHTML = '&#10094;';
        this.leftArrowBtn.addEventListener('click', () => this.prevTrack());
        document.getElementById('ui-layer').appendChild(this.leftArrowBtn);

        // Right arrow button
        this.rightArrowBtn = document.createElement('button');
        this.rightArrowBtn.id = 'track-arrow-right';
        this.rightArrowBtn.className = 'track-arrow-btn';
        this.rightArrowBtn.innerHTML = '&#10095;';
        this.rightArrowBtn.addEventListener('click', () => this.nextTrack());
        document.getElementById('ui-layer').appendChild(this.rightArrowBtn);

        // Start button
        this.startBtn = document.createElement('button');
        this.startBtn.id = 'track-start-btn';
        this.startBtn.className = 'track-menu-ui';
        this.startBtn.textContent = 'START RACE';
        this.startBtn.addEventListener('click', () => this.startRace());
        document.getElementById('ui-layer').appendChild(this.startBtn);
    }

    prevTrack() {
        this.selectedTrackIndex = (this.selectedTrackIndex - 1 + this.orderedTracks.length) % this.orderedTracks.length;
        this.updateTrackPreview();
        if (this.app.audio) this.app.audio.playEat();
    }

    nextTrack() {
        this.selectedTrackIndex = (this.selectedTrackIndex + 1) % this.orderedTracks.length;
        this.updateTrackPreview();
        if (this.app.audio) this.app.audio.playEat();
    }

    showTrackMenu() {
        this.state = 'menu';

        // Show UI elements
        if (this.trackNameElement) {
            this.trackNameElement.classList.remove('hidden');
            this.trackCountryElement.classList.remove('hidden');
            this.trackCounterElement.classList.remove('hidden');
            this.leftArrowBtn.classList.remove('hidden');
            this.rightArrowBtn.classList.remove('hidden');
            this.startBtn.classList.remove('hidden');
        }

        // Position camera for top-down view
        this.camera.position.set(0, 100, 0);
        this.camera.lookAt(0, 0, 0);

        // Create ground for menu
        this.createMenuGround();

        // Show track preview
        this.updateTrackPreview();
    }

    createMenuGround() {
        // No ground needed - using solid background color
    }

    updateTrackPreview() {
        // Clear old preview
        while (this.trackPreviewGroup.children.length > 0) {
            this.trackPreviewGroup.remove(this.trackPreviewGroup.children[0]);
        }

        // Get selected track
        const track = this.orderedTracks[this.selectedTrackIndex];
        if (!track) return;

        // Update UI
        if (this.trackNameElement) {
            this.trackNameElement.textContent = track.name.toUpperCase();
            this.trackCountryElement.textContent = track.country;
            this.trackCounterElement.textContent = `${this.selectedTrackIndex + 1} / ${this.orderedTracks.length}`;
        }

        // Create preview from selected track
        const points = track.points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(points, true);
        const previewPoints = curve.getPoints(150);

        // Create filled track preview (wide line effect using plane)
        const trackShape = this.createTrackShape(curve);
        if (trackShape) {
            this.trackPreviewGroup.add(trackShape);
        }

        // Create track outline on top
        const geo = new THREE.BufferGeometry().setFromPoints(previewPoints);
        const mat = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 });
        const trackLine = new THREE.Line(geo, mat);
        trackLine.position.y = 0.5;
        this.trackPreviewGroup.add(trackLine);

        // Add start/finish marker
        const startPoint = curve.getPointAt(0);
        const startTangent = curve.getTangentAt(0);
        const startMarker = this.createStartMarker(startPoint, startTangent);
        this.trackPreviewGroup.add(startMarker);
    }

    createTrackShape(curve) {
        const segments = 150;
        const width = 3;
        const positions = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = curve.getPointAt(t);
            const tangent = curve.getTangentAt(t);
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            const left = point.clone().add(perp.clone().multiplyScalar(width / 2));
            const right = point.clone().add(perp.clone().multiplyScalar(-width / 2));

            positions.push(left.x, 0.2, left.z);
            positions.push(right.x, 0.2, right.z);
        }

        const indices = [];
        for (let i = 0; i < segments; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = i * 2 + 2;
            const d = i * 2 + 3;
            indices.push(a, b, c);
            indices.push(b, d, c);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            color: 0x1a1a3e,
            side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
    }

    createStartMarker(position, tangent) {
        const group = new THREE.Group();

        // Start/finish line marker
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const angle = Math.atan2(tangent.x, tangent.z);

        // Create checkered pattern
        const checkerSize = 0.8;
        const numCheckers = 8;
        for (let i = 0; i < numCheckers; i++) {
            const geo = new THREE.PlaneGeometry(checkerSize, checkerSize);
            const isWhite = i % 2 === 0;
            const mat = new THREE.MeshBasicMaterial({ color: isWhite ? 0xffffff : 0x000000 });
            const checker = new THREE.Mesh(geo, mat);
            checker.rotation.x = -Math.PI / 2;

            const offset = (i - numCheckers / 2 + 0.5) * checkerSize;
            checker.position.copy(position);
            checker.position.add(perp.clone().multiplyScalar(offset));
            checker.position.y = 0.6;
            checker.rotation.z = angle;

            group.add(checker);
        }

        return group;
    }

    async loadAssets() {
        const assetPaths = {
            // Cars
            car: 'assets/onetapracer/car.glb',
            car_f1: 'assets/onetapracer/car_f1.glb',
            car_kart: 'assets/onetapracer/car_kart.glb',
            car_sport: 'assets/onetapracer/car_sport.glb',
            // Core
            coin: 'assets/onetapracer/coin.glb',
            barrier: 'assets/onetapracer/barrier.glb',
            // Start/Finish
            start_arch: 'assets/onetapracer/start_arch.glb',
            // Trees (variety)
            tree: 'assets/onetapracer/tree.glb',
            tree_pine: 'assets/onetapracer/tree_pine.glb',
            tree_round: 'assets/onetapracer/tree_round.glb',
            tree_palm: 'assets/onetapracer/tree_palm.glb',
            tree_bushy: 'assets/onetapracer/tree_bushy.glb',
            tree_cypress: 'assets/onetapracer/tree_cypress.glb',
            // Props
            traffic_cone: 'assets/onetapracer/traffic_cone.glb',
            tire_stack: 'assets/onetapracer/tire_stack.glb',
            jerry_can: 'assets/onetapracer/jerry_can.glb',
            billboard: 'assets/onetapracer/billboard.glb',
            // Buildings
            grandstand: 'assets/onetapracer/grandstand.glb',
            pit_building: 'assets/onetapracer/pit_building.glb',
            timing_tower: 'assets/onetapracer/timing_tower.glb'
        };

        const loadPromises = Object.entries(assetPaths).map(([key, path]) => {
            return new Promise((resolve, reject) => {
                this.loader.load(
                    path,
                    (gltf) => {
                        this.assets[key] = gltf.scene;
                        resolve();
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load ${key}:`, error);
                        resolve(); // Continue even if asset fails
                    }
                );
            });
        });

        await Promise.all(loadPromises);
    }

    startRace() {
        this.state = 'racing';

        // Change to sky background for racing
        this.scene.background = new THREE.Color(0x87ceeb);

        // Hide menu UI
        if (this.trackNameElement) {
            this.trackNameElement.classList.add('hidden');
            this.trackCountryElement.classList.add('hidden');
            this.trackCounterElement.classList.add('hidden');
            this.leftArrowBtn.classList.add('hidden');
            this.rightArrowBtn.classList.add('hidden');
            this.startBtn.classList.add('hidden');
        }

        // Remove menu ground
        if (this.menuGround) {
            this.scene.remove(this.menuGround);
            this.menuGround = null;
        }

        // Clear preview
        while (this.trackPreviewGroup.children.length > 0) {
            this.trackPreviewGroup.remove(this.trackPreviewGroup.children[0]);
        }

        // Setup track with selected circuit
        this.setupTrack(this.orderedTracks[this.selectedTrackIndex]);

        // Setup car
        this.setupCar();

        // Spawn coins
        this.spawnCoins();

        // Add environment
        this.setupEnvironment();

        // Reset camera target
        this._cameraLookTarget = null;
    }

    setupTrack(trackData) {
        this.currentTrack = trackData;

        // Convert points array to Vector3 array
        const points = trackData.points.map(p => new THREE.Vector3(p[0], p[1], p[2]));

        // Create closed spline
        this.trackCurve = new THREE.CatmullRomCurve3(points, true);
        this.trackLength = this.trackCurve.getLength();

        // Calculate track bounds for environment scaling
        this.trackBounds = this.calculateTrackBounds();

        // Create road surface using TubeGeometry
        const tubeGeo = new THREE.TubeGeometry(this.trackCurve, 200, this.trackWidth / 2, 8, true);

        // Flatten the tube to make it a road (scale Y to near 0)
        const positions = tubeGeo.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] = 0.05; // Flatten to ground level
        }
        tubeGeo.attributes.position.needsUpdate = true;
        tubeGeo.computeVertexNormals();

        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        const roadMesh = new THREE.Mesh(tubeGeo, roadMat);
        this.trackGroup.add(roadMesh);

        // Create center line
        const linePoints = this.trackCurve.getPoints(200);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        const centerLine = new THREE.Line(lineGeo, lineMat);
        centerLine.position.y = 0.1;
        this.trackGroup.add(centerLine);

        // Create grass ground - size based on track bounds
        const grassSize = Math.max(this.trackBounds.width, this.trackBounds.height) + 100;
        const grassGeo = new THREE.PlaneGeometry(grassSize, grassSize);
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x228b22,
            roughness: 1
        });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.01;
        this.scene.add(grass);

        // Add barriers along track edges
        this.addBarriers();
    }

    calculateTrackBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        const points = this.trackCurve.getPoints(100);
        for (const p of points) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z);
            maxZ = Math.max(maxZ, p.z);
        }

        return {
            minX, maxX, minZ, maxZ,
            width: maxX - minX,
            height: maxZ - minZ,
            centerX: (minX + maxX) / 2,
            centerZ: (minZ + maxZ) / 2
        };
    }

    addBarriers() {
        if (!this.assets.barrier) return;

        // Scale barrier count based on track length
        const barrierCount = Math.floor(this.trackLength / 3);
        for (let i = 0; i < barrierCount; i++) {
            const t = i / barrierCount;
            const point = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t);

            // Get perpendicular direction
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // Place barriers on both sides
            for (const side of [-1, 1]) {
                const barrier = this.assets.barrier.clone();
                const offset = (this.trackWidth / 2 + 0.5) * side;
                barrier.position.copy(point).add(perp.clone().multiplyScalar(offset));
                barrier.position.y = 0;

                // Rotate to face track
                const angle = Math.atan2(tangent.x, tangent.z);
                barrier.rotation.y = angle;
                barrier.scale.setScalar(0.5);

                this.environmentGroup.add(barrier);
            }
        }
    }

    setupCar() {
        // Reset car state
        this.car.t = 0;
        this.car.speed = 0;
        this.car.lateralOffset = 0;
        this.car.lateralVelocity = 0;

        // Create container for car (used for positioning and Y rotation)
        this.car.mesh = new THREE.Group();

        // Select car type randomly from available models
        const carTypes = ['car_f1', 'car_kart', 'car_sport', 'car'];
        const availableCars = carTypes.filter(type => this.assets[type]);
        const selectedCarType = availableCars[Math.floor(Math.random() * availableCars.length)] || 'car';

        let carModel;
        if (this.assets[selectedCarType]) {
            carModel = this.assets[selectedCarType].clone();
            // Scale and rotate based on car type
            if (selectedCarType === 'car_f1') {
                carModel.scale.setScalar(1.0);
                carModel.rotation.y = -Math.PI / 2; // Face forward (Z axis)
            } else if (selectedCarType === 'car_kart') {
                carModel.scale.setScalar(1.2);
                carModel.rotation.y = -Math.PI / 2; // Face forward (Z axis)
            } else if (selectedCarType === 'car_sport') {
                carModel.scale.setScalar(1.0);
                carModel.rotation.y = -Math.PI / 2; // Face forward (Z axis)
            } else {
                // Original car model
                carModel.scale.setScalar(0.8);
                carModel.rotation.x = Math.PI / 2;
            }
        } else {
            // Fallback car geometry
            const carGeo = new THREE.BoxGeometry(1.5, 0.5, 2.5);
            const carMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            carModel = new THREE.Mesh(carGeo, carMat);
        }

        this.car.mesh.add(carModel);
        this.scene.add(this.car.mesh);

        // Position car at start
        this.updateCarPosition();
    }

    spawnCoins() {
        const coinCount = 20;

        for (let i = 0; i < coinCount; i++) {
            const t = (i / coinCount + 0.05) % 1; // Offset from start
            const lateralOffset = (Math.random() - 0.5) * (this.trackWidth - 1);

            let coinMesh;
            if (this.assets.coin) {
                coinMesh = this.assets.coin.clone();
                coinMesh.scale.setScalar(0.5);
            } else {
                // Fallback coin
                const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
                const coinMat = new THREE.MeshStandardMaterial({
                    color: 0xffd700,
                    metalness: 0.8,
                    roughness: 0.2
                });
                coinMesh = new THREE.Mesh(coinGeo, coinMat);
                coinMesh.rotation.x = Math.PI / 2;
            }

            const point = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t);
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            coinMesh.position.copy(point).add(perp.clone().multiplyScalar(lateralOffset));
            coinMesh.position.y = 0.5;

            this.coinGroup.add(coinMesh);
            this.coins.push({
                mesh: coinMesh,
                t: t,
                lateralOffset: lateralOffset,
                collected: false
            });
        }
    }

    setupEnvironment() {
        // Add start/finish arch
        this.addStartFinishArch();

        // Add variety of trees around track
        this.addTreesAroundTrack();

        // Add track decorations (props and buildings)
        this.addTrackDecorations();
    }

    addStartFinishArch() {
        if (!this.assets.start_arch) return;

        // Get start position and orientation
        const startPoint = this.trackCurve.getPointAt(0);
        const startTangent = this.trackCurve.getTangentAt(0);

        const arch = this.assets.start_arch.clone();
        arch.position.copy(startPoint);
        arch.position.y = 0;

        // Rotate arch to span across track (perpendicular to direction)
        const angle = Math.atan2(startTangent.x, startTangent.z);
        arch.rotation.y = angle;

        // Scale to fit track width
        arch.scale.setScalar(1.0);

        this.environmentGroup.add(arch);
    }

    addTreesAroundTrack() {
        // Available tree types
        const treeTypes = ['tree_pine', 'tree_round', 'tree_palm', 'tree_bushy', 'tree_cypress', 'tree'];
        const availableTrees = treeTypes.filter(type => this.assets[type]);

        if (availableTrees.length === 0) return;

        // Scatter trees around the track based on bounds
        const treeCount = 60;
        const radius = Math.max(this.trackBounds.width, this.trackBounds.height) / 2 + 15;

        for (let i = 0; i < treeCount; i++) {
            const angle = (i / treeCount) * Math.PI * 2 + Math.random() * 0.3;
            const treeRadius = radius + Math.random() * 40;

            // Select random tree type
            const treeType = availableTrees[Math.floor(Math.random() * availableTrees.length)];
            const tree = this.assets[treeType].clone();

            tree.position.x = this.trackBounds.centerX + Math.cos(angle) * treeRadius;
            tree.position.z = this.trackBounds.centerZ + Math.sin(angle) * treeRadius;
            tree.position.y = 0;

            // Scale based on tree type for visual variety
            let baseScale = 0.8 + Math.random() * 0.4;
            if (treeType === 'tree_palm') baseScale *= 0.9;
            if (treeType === 'tree_cypress') baseScale *= 1.1;
            if (treeType === 'tree_bushy') baseScale *= 0.85;
            tree.scale.setScalar(baseScale);

            tree.rotation.y = Math.random() * Math.PI * 2;

            this.environmentGroup.add(tree);
        }

        // Add some inner trees (between track sections if there's space)
        const innerTreeCount = 15;
        for (let i = 0; i < innerTreeCount; i++) {
            const t = Math.random();
            const point = this.trackCurve.getPointAt(t);
            const tangent = this.trackCurve.getTangentAt(t);
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // Place tree far from track edge
            const side = Math.random() > 0.5 ? 1 : -1;
            const offset = (this.trackWidth / 2 + 8 + Math.random() * 10) * side;

            const treeType = availableTrees[Math.floor(Math.random() * availableTrees.length)];
            const tree = this.assets[treeType].clone();

            tree.position.copy(point).add(perp.clone().multiplyScalar(offset));
            tree.position.y = 0;
            tree.scale.setScalar(0.7 + Math.random() * 0.5);
            tree.rotation.y = Math.random() * Math.PI * 2;

            this.environmentGroup.add(tree);
        }
    }

    addTrackDecorations() {
        // Add props along track at strategic locations
        this.addTrackProps();

        // Add buildings around the track
        this.addBuildings();
    }

    addTrackProps() {
        // Traffic cones at certain curves
        if (this.assets.traffic_cone) {
            const coneCount = 20;
            for (let i = 0; i < coneCount; i++) {
                const t = Math.random();
                const curvature = Math.abs(this.getCurvature(t));

                // Only place cones at curves
                if (curvature < 0.3) continue;

                const point = this.trackCurve.getPointAt(t);
                const tangent = this.trackCurve.getTangentAt(t);
                const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

                const cone = this.assets.traffic_cone.clone();
                const side = Math.random() > 0.5 ? 1 : -1;
                const offset = (this.trackWidth / 2 + 0.5) * side;

                cone.position.copy(point).add(perp.clone().multiplyScalar(offset));
                cone.position.y = 0;
                cone.scale.setScalar(1.0);

                this.environmentGroup.add(cone);
            }
        }

        // Tire stacks at track edges
        if (this.assets.tire_stack) {
            const stackCount = 12;
            for (let i = 0; i < stackCount; i++) {
                const t = i / stackCount;
                const point = this.trackCurve.getPointAt(t);
                const tangent = this.trackCurve.getTangentAt(t);
                const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

                const stack = this.assets.tire_stack.clone();
                const side = i % 2 === 0 ? 1 : -1;
                const offset = (this.trackWidth / 2 + 2) * side;

                stack.position.copy(point).add(perp.clone().multiplyScalar(offset));
                stack.position.y = 0;
                stack.scale.setScalar(0.8);
                stack.rotation.y = Math.random() * Math.PI * 2;

                this.environmentGroup.add(stack);
            }
        }

        // Jerry cans scattered near pit area (at track bounds edge)
        if (this.assets.jerry_can) {
            const canCount = 6;
            for (let i = 0; i < canCount; i++) {
                const can = this.assets.jerry_can.clone();

                // Place near start/pit area
                const startPoint = this.trackCurve.getPointAt(0.02 + i * 0.01);
                const tangent = this.trackCurve.getTangentAt(0.02 + i * 0.01);
                const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

                can.position.copy(startPoint).add(perp.clone().multiplyScalar(this.trackWidth / 2 + 3 + Math.random() * 2));
                can.position.y = 0;
                can.scale.setScalar(0.8);
                can.rotation.y = Math.random() * Math.PI * 2;

                this.environmentGroup.add(can);
            }
        }

        // Billboards around the track
        if (this.assets.billboard) {
            const billboardCount = 4;
            for (let i = 0; i < billboardCount; i++) {
                const t = (i / billboardCount + 0.125) % 1;
                const point = this.trackCurve.getPointAt(t);
                const tangent = this.trackCurve.getTangentAt(t);
                const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

                const billboard = this.assets.billboard.clone();
                const side = i % 2 === 0 ? 1 : -1;
                const offset = (this.trackWidth / 2 + 12) * side;

                billboard.position.copy(point).add(perp.clone().multiplyScalar(offset));
                billboard.position.y = 0;
                billboard.scale.setScalar(1.2);

                // Face toward track
                const angle = Math.atan2(tangent.x, tangent.z);
                billboard.rotation.y = angle + (side > 0 ? -Math.PI / 2 : Math.PI / 2);

                this.environmentGroup.add(billboard);
            }
        }
    }

    addBuildings() {
        // Add grandstand near start
        if (this.assets.grandstand) {
            const startPoint = this.trackCurve.getPointAt(0.95);
            const tangent = this.trackCurve.getTangentAt(0.95);
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            const grandstand = this.assets.grandstand.clone();
            grandstand.position.copy(startPoint).add(perp.clone().multiplyScalar(this.trackWidth / 2 + 15));
            grandstand.position.y = 0;
            grandstand.scale.setScalar(1.2);

            // Face track
            const angle = Math.atan2(tangent.x, tangent.z);
            grandstand.rotation.y = angle - Math.PI / 2;

            this.environmentGroup.add(grandstand);
        }

        // Add pit building near start
        if (this.assets.pit_building) {
            const startPoint = this.trackCurve.getPointAt(0.05);
            const tangent = this.trackCurve.getTangentAt(0.05);
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            const pitBuilding = this.assets.pit_building.clone();
            pitBuilding.position.copy(startPoint).add(perp.clone().multiplyScalar(this.trackWidth / 2 + 8));
            pitBuilding.position.y = 0;
            pitBuilding.scale.setScalar(1.0);

            // Face track
            const angle = Math.atan2(tangent.x, tangent.z);
            pitBuilding.rotation.y = angle - Math.PI / 2;

            this.environmentGroup.add(pitBuilding);
        }

        // Add timing tower near start line
        if (this.assets.timing_tower) {
            const startPoint = this.trackCurve.getPointAt(0);
            const tangent = this.trackCurve.getTangentAt(0);
            const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            const tower = this.assets.timing_tower.clone();
            tower.position.copy(startPoint).add(perp.clone().multiplyScalar(-(this.trackWidth / 2 + 10)));
            tower.position.y = 0;
            tower.scale.setScalar(1.0);

            // Face track
            const angle = Math.atan2(tangent.x, tangent.z);
            tower.rotation.y = angle + Math.PI / 2;

            this.environmentGroup.add(tower);
        }
    }

    onInput(type, coords) {
        if (this.isGameOver) return;

        // Menu state - buttons handle track selection
        if (this.state === 'menu') {
            return;
        }

        // Racing state input
        if (type === 'start') {
            this.isTouching = true;
        } else if (type === 'end') {
            this.isTouching = false;
        }
    }

    update(dt) {
        if (this.isGameOver) return;

        // Menu state - no rotation needed
        if (this.state === 'menu') {
            return;
        }

        // Wait for track to be initialized
        if (!this.trackCurve) return;

        // Clamp dt to prevent physics issues on lag
        dt = Math.min(dt, 0.05);

        // Update car physics
        this.updateCarPhysics(dt);

        // Update car position on track
        this.updateCarPosition();

        // Update camera
        this.updateCamera(dt);

        // Check coin collection
        this.checkCoinCollection();

        // Animate coins
        this.animateCoins(dt);
    }

    updateCarPhysics(dt) {
        const { physics, car } = this;

        // Speed update
        if (this.isTouching) {
            car.speed += physics.acceleration * dt;
        } else {
            car.speed -= physics.brakeDecel * dt;
        }
        car.speed = Math.max(0, Math.min(car.speed, physics.maxSpeed));

        // Move along track
        if (this.trackLength > 0) {
            const distanceMoved = car.speed * dt;
            car.t += distanceMoved / this.trackLength;
            car.t = car.t % 1; // Wrap around
        }

        // Calculate curvature for centrifugal force
        const curvature = this.getCurvature(car.t);

        // Centrifugal force pushes car outward on curves (proportional to speed squared)
        const speedFactor = car.speed / physics.maxSpeed; // Normalize to 0-1
        const centrifugalForce = curvature * speedFactor * speedFactor * physics.centrifugalFactor;

        // Apply centrifugal force to lateral velocity
        car.lateralVelocity += centrifugalForce * dt;

        // Apply centering force to keep car on track when not in a curve
        car.lateralVelocity -= car.lateralOffset * 10 * dt;

        // Apply damping
        car.lateralVelocity *= (1 - physics.lateralDamping * dt);

        // Update lateral offset
        car.lateralOffset += car.lateralVelocity * dt;

        // Check if off-track
        const halfWidth = this.trackWidth / 2;
        const isOffTrack = Math.abs(car.lateralOffset) > halfWidth;

        if (isOffTrack) {
            // Apply heavy speed reduction
            car.speed *= physics.offTrackDrag;

            // Push car back toward track
            const sign = car.lateralOffset > 0 ? -1 : 1;
            car.lateralVelocity += sign * physics.recoveryForce * dt;

            // Clamp lateral offset to prevent going too far
            const maxOffset = halfWidth + 3;
            car.lateralOffset = Math.max(-maxOffset, Math.min(maxOffset, car.lateralOffset));
        }

        // Game over if stuck (very slow while off-track)
        if (isOffTrack && car.speed < 0.5 && !this.isTouching) {
            // Give player a chance to recover by holding
            if (this._stuckTime === undefined) this._stuckTime = 0;
            this._stuckTime += dt;
            if (this._stuckTime > 2) {
                this.gameOver();
            }
        } else {
            this._stuckTime = 0;
        }
    }

    getCurvature(t) {
        // Sample tangent at nearby points to estimate curvature
        const epsilon = 0.01;
        const t1 = (t - epsilon + 1) % 1;
        const t2 = (t + epsilon) % 1;

        const tangent1 = this.trackCurve.getTangentAt(t1);
        const tangent2 = this.trackCurve.getTangentAt(t2);

        // Cross product to get curvature direction and magnitude
        const cross = new THREE.Vector3().crossVectors(tangent1, tangent2);

        // cross.y indicates turn direction: positive = left turn, negative = right turn
        // Scale to reasonable range (-1 to 1 roughly)
        return cross.y * 50;
    }

    updateCarPosition() {
        if (!this.car.mesh || !this.trackCurve) return;

        const point = this.trackCurve.getPointAt(this.car.t);
        const tangent = this.trackCurve.getTangentAt(this.car.t);

        // Perpendicular direction for lateral offset
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        // Set car position
        this.car.mesh.position.copy(point);
        this.car.mesh.position.add(perp.clone().multiplyScalar(this.car.lateralOffset));
        this.car.mesh.position.y = 0.3;

        // Rotate car to face forward along track
        const angle = Math.atan2(tangent.x, tangent.z);
        this.car.mesh.rotation.y = angle;
    }

    updateCamera(dt) {
        if (!this.car.mesh || !this.trackCurve) return;

        const tangent = this.trackCurve.getTangentAt(this.car.t);
        const carPos = this.car.mesh.position.clone();

        // Target position behind and above car
        const targetPos = carPos.clone()
            .sub(tangent.clone().multiplyScalar(12))
            .add(new THREE.Vector3(0, 6, 0));

        // Look ahead of car
        const lookAt = carPos.clone()
            .add(tangent.clone().multiplyScalar(8));

        // Smooth camera movement
        const smoothness = 5;
        this.camera.position.lerp(targetPos, smoothness * dt);

        // Update camera look target
        if (!this._cameraLookTarget) {
            this._cameraLookTarget = lookAt.clone();
        }
        this._cameraLookTarget.lerp(lookAt, smoothness * dt);
        this.camera.lookAt(this._cameraLookTarget);
    }

    checkCoinCollection() {
        const carPos = this.car.mesh.position;
        const collectRadius = 1.5;

        for (const coin of this.coins) {
            if (coin.collected) continue;

            const dist = carPos.distanceTo(coin.mesh.position);
            if (dist < collectRadius) {
                coin.collected = true;
                this.coinGroup.remove(coin.mesh);
                this.score += 10;

                if (this.app.audio) {
                    this.app.audio.playEat();
                }
            }
        }
    }

    animateCoins(dt) {
        for (const coin of this.coins) {
            if (coin.collected) continue;

            // Spin coins
            coin.mesh.rotation.y += dt * 3;

            // Bobbing animation
            coin.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003 + coin.t * 10) * 0.1;
        }
    }

    dispose() {
        super.dispose();

        // Remove UI elements
        if (this.trackNameElement) {
            this.trackNameElement.remove();
            this.trackCountryElement.remove();
            this.trackCounterElement.remove();
            this.leftArrowBtn.remove();
            this.rightArrowBtn.remove();
            this.startBtn.remove();
        }

        // Remove menu ground if exists
        if (this.menuGround) {
            this.scene.remove(this.menuGround);
        }

        // Clean up groups
        this.trackGroup.clear();
        this.environmentGroup.clear();
        this.coinGroup.clear();
        this.trackPreviewGroup.clear();

        this.coins = [];
        this.assets = {};
    }
}
