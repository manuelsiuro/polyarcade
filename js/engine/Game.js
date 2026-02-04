import * as THREE from 'three';

/**
 * Abstract base class for all Mini-Games.
 */
export class Game {
    constructor(app) {
        this.app = app;
        this.scene = new THREE.Scene();
        // Default camera, can be overridden by subclasses
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.z = 5;
        this.score = 0;
        this.isGameOver = false;
    }

    /**
     * Initialize the game (assets, objects).
     */
    init() {
        console.warn('init() not implemented');
    }

    /**
     * Update loop called every frame.
     * @param {number} dt Delta time in seconds
     */
    update(dt) {
        // Override
    }

    /**
     * Handle input events.
     * @param {string} type 'start', 'move', 'end'
     * @param {THREE.Vector2} coords Normalized device coordinates (-1 to 1)
     */
    onInput(type, coords) {
        // Override
    }

    /**
     * Cleanup resources.
     */
    dispose() {
        // Recursive dispose pattern could be added here
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
        this.app.onGameOver(this.score);
    }
}
