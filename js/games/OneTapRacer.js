import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { Game } from '../engine/Game.js';

export class OneTapRacer extends Game {
    constructor(app) {
        super(app);
        this.name = 'One Tap Racer';

        // Track
        this.trackCurve = null;
        this.trackLength = 0;
        this.trackWidth = 4;

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
    }

    async init() {
        // Camera setup
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        this.scene.add(ambient, sun);

        // Sky color
        this.scene.background = new THREE.Color(0x87ceeb);

        // Load assets
        await this.loadAssets();

        // Setup track
        this.setupTrack();

        // Setup car
        this.setupCar();

        // Spawn coins
        this.spawnCoins();

        // Add environment
        this.setupEnvironment();
    }

    async loadAssets() {
        const assetPaths = {
            car: 'assets/onetapracer/car.glb',
            coin: 'assets/onetapracer/coin.glb',
            barrier: 'assets/onetapracer/barrier.glb',
            tree: 'assets/onetapracer/tree.glb'
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

    setupTrack() {
        // Define oval circuit control points
        const points = [
            new THREE.Vector3(0, 0, -40),
            new THREE.Vector3(25, 0, -35),
            new THREE.Vector3(40, 0, -15),
            new THREE.Vector3(40, 0, 15),
            new THREE.Vector3(25, 0, 35),
            new THREE.Vector3(0, 0, 40),
            new THREE.Vector3(-25, 0, 35),
            new THREE.Vector3(-40, 0, 15),
            new THREE.Vector3(-40, 0, -15),
            new THREE.Vector3(-25, 0, -35)
        ];

        // Create closed spline
        this.trackCurve = new THREE.CatmullRomCurve3(points, true);
        this.trackLength = this.trackCurve.getLength();

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

        // Create grass ground
        const grassGeo = new THREE.PlaneGeometry(200, 200);
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

    addBarriers() {
        if (!this.assets.barrier) return;

        const barrierCount = 80;
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
        // Create container for car (used for positioning and Y rotation)
        this.car.mesh = new THREE.Group();

        let carModel;
        if (this.assets.car) {
            carModel = this.assets.car.clone();
            carModel.scale.setScalar(0.8);
            // Rotate 90° on X to lay car flat (front was pointing up)
            carModel.rotation.x = Math.PI / 2;
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
        if (!this.assets.tree) return;

        // Scatter trees around the track
        const treeCount = 40;
        for (let i = 0; i < treeCount; i++) {
            const angle = (i / treeCount) * Math.PI * 2;
            const radius = 55 + Math.random() * 30;

            const tree = this.assets.tree.clone();
            tree.position.x = Math.cos(angle) * radius;
            tree.position.z = Math.sin(angle) * radius;
            tree.position.y = 0;
            tree.scale.setScalar(0.8 + Math.random() * 0.4);
            tree.rotation.y = Math.random() * Math.PI * 2;

            this.environmentGroup.add(tree);
        }
    }

    onInput(type, coords) {
        if (this.isGameOver) return;

        if (type === 'start') {
            this.isTouching = true;
        } else if (type === 'end') {
            this.isTouching = false;
        }
    }

    update(dt) {
        if (this.isGameOver) return;

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

        // Clean up groups
        this.trackGroup.clear();
        this.environmentGroup.clear();
        this.coinGroup.clear();

        this.coins = [];
        this.assets = {};
    }
}
