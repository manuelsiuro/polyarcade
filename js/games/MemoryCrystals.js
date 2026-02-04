import * as THREE from 'three';
import { Game } from '../engine/Game.js';

export class MemoryCrystals extends Game {
    constructor(app) {
        super(app);
        this.name = 'Memory Crystals (Simon)';

        this.crystals = [];
        this.sequence = [];
        this.playerSequence = [];
        this.state = 'IDLE'; // IDLE, PLAYING_SEQUENCE, WAITING_INPUT
        this.raycaster = new THREE.Raycaster();

        // Audio Context
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    init() {
        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);

        // Dark Atmospheric Lighting
        const ambient = new THREE.AmbientLight(0x222222);
        this.scene.add(ambient);

        // Center Light
        const pointLight = new THREE.PointLight(0xffffff, 1, 20);
        pointLight.position.set(0, 2, 0);
        this.scene.add(pointLight);

        // Create Crystals (Pentagon Setup)
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const radius = 3;

        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;

            const geo = new THREE.OctahedronGeometry(1, 0);
            const mat = new THREE.MeshStandardMaterial({
                color: colors[i],
                emissive: 0x000000,
                emissiveIntensity: 0,
                roughness: 0.1,
                metalness: 0.8
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, 0, z);
            mesh.userData = { id: i, baseColor: colors[i] };

            this.scene.add(mesh);
            this.crystals.push(mesh);
        }

        // Star field
        // ...

        // Start Gameplay after short delay
        setTimeout(() => this.startRound(), 1000);
    }

    startRound() {
        this.addToSequence();
        this.playSequence();
    }

    addToSequence() {
        this.sequence.push(Math.floor(Math.random() * 5));
    }

    async playSequence() {
        this.state = 'PLAYING_SEQUENCE';
        this.playerSequence = [];

        for (let i = 0; i < this.sequence.length; i++) {
            const crystalId = this.sequence[i];
            await this.activateCrystal(crystalId, 600);
            await this.wait(200);
        }

        this.state = 'WAITING_INPUT';
    }

    async activateCrystal(id, duration = 500) {
        const mesh = this.crystals[id];
        const color = new THREE.Color(mesh.userData.baseColor);

        // Visual
        mesh.material.emissive.set(color);
        mesh.material.emissiveIntensity = 2;
        mesh.scale.setScalar(1.2);

        // Sound
        this.playTone(id);

        await this.wait(duration);

        // Off
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
        mesh.scale.setScalar(1.0);
    }

    playTone(id) {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Pentatonic Scale-ish
        const freqs = [261.63, 293.66, 329.63, 392.00, 440.00]; // C4, D4, E4, G4, A4

        osc.frequency.value = freqs[id];
        osc.type = 'sine';

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();

        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        osc.stop(this.audioCtx.currentTime + 0.5);
    }

    onInput(type, coords) {
        if (this.state !== 'WAITING_INPUT') return;

        if (type === 'end') {
            this.raycaster.setFromCamera(coords, this.camera);
            const intersects = this.raycaster.intersectObjects(this.crystals);

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                this.handlePlayerInput(hit.userData.id);
            }
        }
    }

    handlePlayerInput(id) {
        // Flash immediately
        this.activateCrystal(id, 200);

        // Check Correctness
        const expected = this.sequence[this.playerSequence.length];

        if (id === expected) {
            this.playerSequence.push(id);
            if (this.playerSequence.length === this.sequence.length) {
                // Round Complete
                this.score++;
                this.state = 'IDLE';
                setTimeout(() => this.startRound(), 1000);
            }
        } else {
            // Game Over
            this.gameOver();
            this.playErrorSound();
        }
    }

    playErrorSound() {
        // Low buz
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    update(dt) {
        this.crystals.forEach(c => {
            c.rotation.y += 1 * dt;
            c.rotation.x += 0.5 * dt;
        });
    }

    dispose() {
        super.dispose();
        if (this.audioCtx) this.audioCtx.close();
    }
}
