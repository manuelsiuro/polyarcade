import { App } from './engine/App.js';
import { PlanetSweeper } from './games/PlanetSweeper.js';
import { Qubic } from './games/Qubic.js';
import { Orbit4 } from './games/Orbit4.js';
import { CubeCrawler } from './games/CubeCrawler.js';
import { IsoSokoban } from './games/IsoSokoban.js';
import { MemoryCrystals } from './games/MemoryCrystals.js';
import { ShapeFit } from './games/ShapeFit.js';
import { MahjongStack } from './games/MahjongStack.js';
import { OneTapRacer } from './games/OneTapRacer.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();

    // Register Games
    // We pass the class reference so App can instantiate it when needed
    app.registerGames([
        { name: 'Planet Sweeper', class: PlanetSweeper },
        { name: 'Qubic', class: Qubic },
        // Future games to be added here
        { name: 'Orbit 4', class: Orbit4 },
        { name: 'Cube Crawler', class: CubeCrawler },
        { name: 'Iso-Sokoban', class: IsoSokoban },
        { name: 'Memory Crystals', class: MemoryCrystals },
        { name: 'Shape Fit', class: ShapeFit },
        { name: 'Mahjong Stack', class: MahjongStack },
        { name: 'One Tap Racer', class: OneTapRacer }
    ]);
});
