import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class CodeBreaker3D extends Game {
    constructor(app) {
        super(app);
        this.name = 'Code Breaker 3D';

        this.colors = [0xe74c3c, 0xf1c40f, 0x2ecc71, 0x3498db, 0x9b59b6, 0xffffff];
        this.secret = [];
        this.currentAttempt = [0, 0, 0, 0];

        this.slots = []; // Array of { mesh, targetY, index }
        this.leds = [];
        this.raycaster = new THREE.Raycaster();
    }

    init() {
        this.camera.position.set(0, 4, 6);
        this.camera.lookAt(0, 0, 0);

        // Cyberpunk Lighting - Fixes "All Black" issue by adding strong Ambient + Spots
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const spot1 = new THREE.SpotLight(0x00e5ff, 5); // Blue tint
        spot1.position.set(-5, 10, 5);
        spot1.lookAt(0, 0, 0);

        const spot2 = new THREE.SpotLight(0xff0055, 5); // Pink tint
        spot2.position.set(5, 10, 5);
        spot2.lookAt(0, 0, 0);

        this.scene.add(spot1, spot2);

        // Console Body (More complex shape)
        const bodyGroup = new THREE.Group();
        this.scene.add(bodyGroup);

        // Base Panel
        const panelGeo = new THREE.BoxGeometry(5.5, 0.5, 3);
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x222222, roughness: 0.2, metalness: 0.8
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        bodyGroup.add(panel);

        // Screen/Backing
        const screenGeo = new THREE.BoxGeometry(5, 2, 0.2);
        const screen = new THREE.Mesh(screenGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 }));
        screen.position.set(0, 1.25, -1.4);
        bodyGroup.add(screen);

        // Create Slots (Glowing Orbs)
        const orbGeo = new THREE.IcosahedronGeometry(0.35, 2);
        for (let i = 0; i < 4; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: this.colors[0],
                emissive: this.colors[0],
                emissiveIntensity: 0.6,
                roughness: 0.1,
                metalness: 0.5
            });
            const mesh = new THREE.Mesh(orbGeo, mat);
            const x = -1.8 + i * 1.2;
            mesh.position.set(x, 0.6, 0);
            mesh.userData = { type: 'slot', index: i };
            this.scene.add(mesh);

            // Add ring container
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.45, 0.02, 16, 32),
                new THREE.MeshBasicMaterial({ color: 0x888888 })
            );
            ring.position.set(x, 0.3, 0);
            ring.rotation.x = Math.PI / 2;
            this.scene.add(ring);

            this.slots.push({ mesh, targetY: 0.6, index: i, velocityY: 0 });
        }

        // Submit Button (Sci-fi Plinth)
        const btnGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.2, 6); // Hex button
        const btnMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 1.0 });
        this.submitBtn = new THREE.Mesh(btnGeo, btnMat);
        this.submitBtn.position.set(0, 0.4, 1.0);
        this.submitBtn.userData = { type: 'submit' };
        this.scene.add(this.submitBtn);

        // Button Glow
        const glowGeo = new THREE.RingGeometry(0.2, 0.3, 32);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.51;
        this.submitBtn.add(glow);

        // Feedback LEDs (On Screen)
        const ledGeo = new THREE.SphereGeometry(0.15, 16, 16);
        for (let i = 0; i < 4; i++) {
            const mat = new THREE.MeshStandardMaterial({
                color: 0x111111, emissive: 0x000000
            });
            const mesh = new THREE.Mesh(ledGeo, mat);
            const lx = -0.6 + i * 0.4;
            mesh.position.set(lx, 1.5, -1.2);
            this.scene.add(mesh);
            this.leds.push(mesh);
        }

        this.generateSecret();
    }

    generateSecret() {
        this.secret = [];
        for (let i = 0; i < 4; i++) {
            this.secret.push(Math.floor(Math.random() * this.colors.length));
        }
    }

    onInput(type, coords) {
        if (this.isGameOver) return;

        if (type === 'end') {
            this.raycaster.setFromCamera(coords, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children);

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                if (hit.userData.type === 'slot') {
                    this.cycleColor(hit.userData.index);
                    // Pop animation
                    this.slots[hit.userData.index].velocityY = 0.1;
                } else if (hit.userData.type === 'submit') {
                    this.submitAttempt();
                    this.animateButton();
                }
            }
        }
    }

    cycleColor(index) {
        this.currentAttempt[index] = (this.currentAttempt[index] + 1) % this.colors.length;
        const color = this.colors[this.currentAttempt[index]];
        // Lerp color ideally, but set is instant
        this.slots[index].mesh.material.color.setHex(color);
        this.slots[index].mesh.material.emissive.setHex(color);
    }

    animateButton() {
        this.submitBtn.position.y -= 0.1;
        setTimeout(() => {
            this.submitBtn.position.y += 0.1;
        }, 100);
    }

    update(dt) {
        // Bounce Logic for Slots
        this.slots.forEach(slot => {
            slot.mesh.position.y += slot.velocityY;
            // Gravity
            if (slot.mesh.position.y > slot.targetY) {
                slot.velocityY -= 0.01;
            } else {
                slot.mesh.position.y = slot.targetY;
                slot.velocityY = 0;
            }

            // Idle rotation
            slot.mesh.rotation.y += dt;
            slot.mesh.rotation.z += dt * 0.5;
        });
    }

    submitAttempt() {
        let exactMatches = 0;
        let colorMatches = 0;

        const secretCopy = [...this.secret];
        const attemptCopy = [...this.currentAttempt];

        for (let i = 0; i < 4; i++) {
            if (attemptCopy[i] === secretCopy[i]) {
                exactMatches++;
                secretCopy[i] = -1;
                attemptCopy[i] = -2;
            }
        }

        for (let i = 0; i < 4; i++) {
            if (attemptCopy[i] === -2) continue;
            const foundIndex = secretCopy.indexOf(attemptCopy[i]);
            if (foundIndex !== -1) {
                colorMatches++;
                secretCopy[foundIndex] = -1;
            }
        }

        this.showFeedback(exactMatches, colorMatches);

        if (exactMatches === 4) {
            this.score = 1000;
            this.slots.forEach(s => {
                s.velocityY = 0.2;
                s.mesh.material.emissiveIntensity = 1.0;
            });
            setTimeout(() => this.gameOver(), 1000);
        }
    }

    showFeedback(exact, partial) {
        this.leds.forEach(l => {
            l.material.color.setHex(0x111111);
            l.material.emissive.setHex(0x000000);
        });

        let ledIndex = 0;
        for (let i = 0; i < exact; i++) {
            const l = this.leds[ledIndex++];
            l.material.color.setHex(0x2ecc71);
            l.material.emissive.setHex(0x2ecc71);
        }
        for (let i = 0; i < partial; i++) {
            const l = this.leds[ledIndex++];
            l.material.color.setHex(0xffffff);
            l.material.emissive.setHex(0xffffff);
        }
    }
}
