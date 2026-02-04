/**
 * Manages the HTML User Interface overlays.
 * Handles transitions between Menu, HUD, and Game Over logic.
 */
export class UIManager {
    constructor() {
        this.screens = {
            menu: document.getElementById('main-menu'),
            hud: document.getElementById('hud'),
            gameOver: document.getElementById('game-over')
        };

        this.elements = {
            gameList: document.getElementById('game-list'),
            score: document.getElementById('score-display'),
            finalScore: document.getElementById('final-score'),
            btnBack: document.getElementById('btn-back'),
            btnReplay: document.getElementById('btn-replay'),
            btnMenu: document.getElementById('btn-menu')
        };
    }

    showMenu() {
        this._showScreen('menu');
    }

    showHUD() {
        this._showScreen('hud');
    }

    showGameOver(score) {
        if (typeof score === 'string') {
            this.elements.finalScore.textContent = score; // Direct text for custom messages (e.g. "Winner: Red!")
        } else {
            this.elements.finalScore.textContent = `Score: ${score}`; // Default behavior
        }
        this._showScreen('gameOver');
    }

    updateScore(score) {
        this.elements.score.textContent = `Score: ${score}`;
    }

    populateGameList(games, onSelect) {
        this.elements.gameList.innerHTML = '';
        games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `<h3>${game.name}</h3>`;
            card.onclick = () => onSelect(index);
            this.elements.gameList.appendChild(card);
        });
    }

    onBackToMenu(callback) {
        this.elements.btnBack.onclick = callback;
        this.elements.btnMenu.onclick = callback;
    }

    onReplay(callback) {
        this.elements.btnReplay.onclick = callback;
    }

    _showScreen(name) {
        Object.values(this.screens).forEach(el => el.classList.add('hidden'));
        this.screens[name].classList.remove('hidden');
    }
}
