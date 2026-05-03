import { Game } from './src/engine/Game.js';
import { Tower } from './src/entities/Tower.js';

const canvas = document.getElementById('gameCanvas');
const towerShop = document.getElementById('tower-shop');
const goldEl = document.getElementById('gold-value');
const livesEl = document.getElementById('lives-value');
const waveEl = document.getElementById('wave-value');
const nextWaveBtn = document.getElementById('next-wave-btn');

let currentSelectedType = null;
const TOWERS = Tower.getAvailableTowers();

const game = new Game(canvas, {
    updateStats: (stats) => {
        goldEl.innerText = stats.gold;
        livesEl.innerText = stats.lives;
        waveEl.innerText = stats.wave;
        nextWaveBtn.style.display = stats.isWaveInProgress ? 'none' : 'block';
    },
    showScreen: (id) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }
});

// Build shop UI from dynamic tower list
TOWERS.forEach(t => {
    const card = document.createElement('div');
    card.className = 'tower-card';
    card.id = `shop-${t.type}`;
    
    card.innerHTML = `
        <div class="tower-icon">${t.icon}</div>
        <div class="tower-info">
            <div class="tower-name">${t.name}</div>
            <div class="tower-desc">${t.desc}</div>
            <div class="tower-cost">${t.cost} Gold</div>
        </div>
    `;
    
    card.onclick = () => {
        if (currentSelectedType === t.type) {
            currentSelectedType = null;
            game.placingTowerType = null;
            deselectShopCards();
        } else {
            currentSelectedType = t.type;
            game.placingTowerType = t.type;
            game.selectedTower = null;
            hideTowerDetails();
            deselectShopCards();
            card.classList.add('selected');
        }
    };
    
    towerShop.appendChild(card);
});

// Navigation & Game State Controls
document.getElementById('start-btn').onclick = () => {
    document.getElementById('start-screen').classList.add('hidden');
    game.startLevel();
    requestAnimationFrame((time) => game.update(time));
};

document.getElementById('next-wave-btn').onclick = () => game.startWave();

document.getElementById('next-level-btn').onclick = () => {
    if (game.nextLevel()) document.getElementById('victory-screen').classList.add('hidden');
};

document.getElementById('restart-btn').onclick = () => {
    document.getElementById('gameover-screen').classList.add('hidden');
    game.startLevel();
};

// Canvas Interaction Logic
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if selecting an existing tower on the grid
    const clickedTower = game.entities.towers.find(t => 
        Math.sqrt((t.x - x)**2 + (t.y - y)**2) < 20
    );

    if (clickedTower) {
        game.selectedTower = clickedTower;
        currentSelectedType = null;
        game.placingTowerType = null;
        deselectShopCards();
        showTowerDetails(clickedTower);
    } else if (currentSelectedType) {
        if (game.placeTower(currentSelectedType, x, y)) {
            currentSelectedType = null;
            game.placingTowerType = null;
            deselectShopCards();
        }
    } else {
        game.selectedTower = null;
        hideTowerDetails();
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    currentSelectedType = null;
    game.placingTowerType = null;
    game.selectedTower = null;
    deselectShopCards();
    hideTowerDetails();
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    game.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
});

canvas.addEventListener('mouseenter', () => {
    game.isMouseOverCanvas = true;
});

canvas.addEventListener('mouseleave', () => {
    game.isMouseOverCanvas = false;
});

function deselectShopCards() {
    document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
}

function showTowerDetails(tower) {
    const details = document.getElementById('tower-details');
    const content = document.getElementById('detail-content');
    details.classList.remove('hidden');
    
    const isMaxLevel = tower.level >= tower.maxLevel;
    const nextStats = !isMaxLevel ? tower.getStats(tower.level + 1) : null;
    
    content.innerHTML = `
        <div class="detail-header">
            <p><strong>${tower.type.toUpperCase()}</strong> - LVL ${tower.level} ${isMaxLevel ? '(MAX)' : ''}</p>
            <div class="stat-comparison">
                <div class="detail-row">
                    <span>Range:</span>
                    <span>${Math.round(tower.range)} ${!isMaxLevel ? `➜ <span class="stat-upgrade">${Math.round(nextStats.range)}</span>` : ''}</span>
                </div>
                <div class="detail-row">
                    <span>Damage:</span>
                    <span>${Math.round(tower.damage)} ${!isMaxLevel ? `➜ <span class="stat-upgrade">${Math.round(nextStats.damage)}</span>` : ''}</span>
                </div>
                <div class="detail-row">
                    <span>Fire Rate:</span>
                    <span>${(tower.fireRate/1000).toFixed(1)}s ${!isMaxLevel ? `➜ <span class="stat-upgrade">${(nextStats.fireRate/1000).toFixed(1)}s</span>` : ''}</span>
                </div>
                ${tower.slowAmount !== undefined ? `
                <div class="detail-row">
                    <span>Slow:</span>
                    <span>${Math.round((1 - tower.slowAmount) * 100)}% ${!isMaxLevel ? `➜ <span class="stat-upgrade">${Math.round((1 - nextStats.slowAmount) * 100)}%</span>` : ''}</span>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="flex-gap-10">
            ${!isMaxLevel ? `
                <button id="upgrade-btn" class="btn btn-small flex-1">
                    Upgrade (${nextStats.upgradeCost} G)
                </button>
            ` : ''}
            <button id="sell-btn" class="btn btn-small btn-magenta flex-1">
                Sell (${tower.getSellValue()} G)
            </button>
        </div>
    `;
    
    if (!isMaxLevel) {
        const upgradeBtn = document.getElementById('upgrade-btn');
        upgradeBtn.onclick = () => {
            const cost = nextStats.upgradeCost;
            if (game.gold >= cost && tower.upgrade()) {
                game.gold -= cost;
                game.upgradePreviewRange = null;
                game.updateUI();
                showTowerDetails(tower);
                game.createExplosion(tower.x, tower.y, '#fff', 15);
            }
        };

        upgradeBtn.onmouseenter = () => game.upgradePreviewRange = nextStats.range;
        upgradeBtn.onmouseleave = () => game.upgradePreviewRange = null;
    }
    
    document.getElementById('sell-btn').onclick = () => {
        game.gold += tower.getSellValue();
        game.entities.towers = game.entities.towers.filter(t => t !== tower);
        game.updateUI();
        hideTowerDetails();
    };
}

function hideTowerDetails() {
    document.getElementById('tower-details').classList.add('hidden');
}
