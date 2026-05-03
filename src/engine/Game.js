import { Enemy } from '../entities/Enemy.js';
import { Tower } from '../entities/Tower.js';
import { Particle } from '../entities/Particle.js';
import { LevelManager } from '../utils/LevelManager.js';

export class Game {
    constructor(canvas, uiCallbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = uiCallbacks;
        
        this.levelMgr = new LevelManager();
        this.entities = {
            enemies: [],
            towers: [],
            projectiles: [],
            particles: []
        };
        
        this.state = 'MENU';
        this.gold = 300;
        this.lives = 20;
        this.lastTime = 0;
        
        this.waveTimer = 0;
        this.spawnQueue = [];
        this.isSpawning = false;
        this.isWaveInProgress = false;
        
        this.selectedTower = null;
        this.mousePos = { x: 0, y: 0 };
        this.placingTowerType = null;
        this.upgradePreviewRange = null;
        this.isMouseOverCanvas = false;
        
        this.init();
    }

    init() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.updateUI();
    }

    startLevel() {
        this.state = 'PLAYING';
        this.entities.enemies = [];
        this.entities.towers = [];
        this.entities.projectiles = [];
        this.gold = 300;
        this.lives = 20;
        this.isWaveInProgress = false;
        this.updateUI();
    }

    startWave() {
        if (this.isWaveInProgress) return;
        
        const wave = this.levelMgr.getCurrentWave();
        this.spawnQueue = [];
        
        for (const [type, count] of Object.entries(wave.enemies)) {
            for (let i = 0; i < count; i++) {
                this.spawnQueue.push({ type, delay: wave.interval });
            }
        }
        
        this.isSpawning = true;
        this.isWaveInProgress = true;
        this.updateUI();
    }

    update(currentTime) {
        if (this.state !== 'PLAYING') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Spawning logic: sequentially release enemies based on interval
        if (this.isSpawning && this.spawnQueue.length > 0) {
            this.waveTimer += deltaTime;
            const nextSpawn = this.spawnQueue[0];
            if (this.waveTimer >= nextSpawn.delay) {
                const level = this.levelMgr.getCurrentLevel();
                this.entities.enemies.push(Enemy.create(nextSpawn.type, level.path));
                this.spawnQueue.shift();
                this.waveTimer = 0;
            }
        } else if (this.isSpawning && this.spawnQueue.length === 0) {
            this.isSpawning = false;
        }

        // Standard update loop for all entities
        this.entities.enemies.forEach(e => e.update(deltaTime));
        this.entities.towers.forEach(t => t.update(this.entities.enemies, currentTime, this.entities.projectiles));
        this.entities.projectiles.forEach(p => p.update(deltaTime, this.entities.enemies, this.entities.particles));
        this.entities.particles.forEach(p => p.update());

        // Cleanup: remove dead or escaped entities
        this.entities.enemies = this.entities.enemies.filter(e => {
            if (e.hasReachedEnd) {
                this.lives--;
                this.updateUI();
                if (this.lives <= 0) this.gameOver();
                return false;
            }
            if (e.isDead) {
                this.gold += e.reward;
                this.createExplosion(e.x, e.y, e.isBoss ? '#ff00f2' : '#00f2ff', e.isBoss ? 50 : 20);
                this.updateUI();
                return false;
            }
            return true;
        });

        this.entities.projectiles = this.entities.projectiles.filter(p => !p.isDead);
        this.entities.particles = this.entities.particles.filter(p => p.alpha > 0);

        // Check for wave/level completion
        if (!this.isSpawning && this.entities.enemies.length === 0 && this.isWaveInProgress) {
            this.isWaveInProgress = false;
            if (this.levelMgr.nextWave()) {
                this.updateUI();
            } else {
                this.victory();
            }
        }

        this.draw();
        requestAnimationFrame((time) => this.update(time));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw Path
        const level = this.levelMgr.getCurrentLevel();
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.05)';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(level.path[0].x, level.path[0].y);
        level.path.forEach(p => this.ctx.lineTo(p.x, p.y));
        this.ctx.stroke();

        this.entities.towers.forEach(t => t.draw(this.ctx));
        this.entities.enemies.forEach(e => e.draw(this.ctx));
        this.entities.projectiles.forEach(p => p.draw(this.ctx));
        this.entities.particles.forEach(p => p.draw(this.ctx));

        // Hover/Placement Previews
        if (this.selectedTower) {
            this.drawRange(this.selectedTower.x, this.selectedTower.y, this.selectedTower.range, 'rgba(255, 255, 255, 0.3)');
            if (this.upgradePreviewRange) {
                this.drawRange(this.selectedTower.x, this.selectedTower.y, this.upgradePreviewRange, 'rgba(0, 255, 136, 0.3)');
            }
        }

        if (this.state === 'PLAYING' && this.placingTowerType && !this.selectedTower && this.isMouseOverCanvas) {
            const validation = this.canPlaceTower(this.placingTowerType, this.mousePos.x, this.mousePos.y);
            const color = validation.valid ? 'rgba(0, 242, 255, 0.2)' : 'rgba(255, 0, 85, 0.3)';
            
            // Get base range for placement preview dynamically
            const dummy = Tower.create(this.placingTowerType, 0, 0);
            this.drawRange(this.mousePos.x, this.mousePos.y, dummy.range, color);
            
            this.ctx.globalAlpha = 0.5;
            dummy.x = this.mousePos.x;
            dummy.y = this.mousePos.y;
            dummy.draw(this.ctx);
            this.ctx.globalAlpha = 1.0;
            
            if (!validation.valid) {
                this.ctx.fillStyle = '#ff0055';
                this.ctx.font = '12px Orbitron';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(validation.reason, this.mousePos.x, this.mousePos.y - 25);
            }
        }
    }

    drawRange(x, y, range, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, range, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
    }

    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.entities.particles.push(new Particle(x, y, color));
        }
    }

    updateUI() {
        this.ui.updateStats({
            gold: this.gold,
            lives: this.lives,
            wave: `Sector ${this.levelMgr.getCurrentLevel().id} | Wave ${this.levelMgr.currentWaveIndex + 1}/${this.levelMgr.getCurrentLevel().waves.length}`,
            isWaveInProgress: this.isWaveInProgress
        });
    }

    nextLevel() {
        if (this.levelMgr.nextLevel()) {
            this.startLevel();
            return true;
        }
        return false;
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.ui.showScreen('gameover-screen');
    }

    victory() {
        this.state = 'VICTORY';
        const level = this.levelMgr.getCurrentLevel();
        document.getElementById('victory-msg').innerText = `${level.name} Secured`;
        
        if (this.levelMgr.currentLevelIndex === 2) {
             document.getElementById('victory-msg').innerText = "System Fully Secured. All Sectors Online.";
             document.getElementById('next-level-btn').style.display = 'none';
        }

        this.ui.showScreen('victory-screen');
    }

    placeTower(type, x, y) {
        const validation = this.canPlaceTower(type, x, y);
        if (validation.valid) {
            const tower = Tower.create(type, x, y);
            this.gold -= tower.cost;
            this.entities.towers.push(tower);
            this.updateUI();
            return true;
        }
        return false;
    }

    canPlaceTower(type, x, y) {
        const dummyTower = Tower.create(type, x, y);
        
        if (this.gold < dummyTower.cost) {
            return { valid: false, reason: 'INSUFFICIENT GOLD' };
        }

        for (const tower of this.entities.towers) {
            const dist = Math.sqrt((tower.x - x)**2 + (tower.y - y)**2);
            if (dist < 40) return { valid: false, reason: 'TOWER PROXIMITY ALERT' };
        }

        const level = this.levelMgr.getCurrentLevel();
        for (let i = 0; i < level.path.length - 1; i++) {
            const dist = this.distToSegment({x, y}, level.path[i], level.path[i+1]);
            if (dist < 40) return { valid: false, reason: 'PATH OBSTRUCTION' };
        }

        return { valid: true };
    }

    // Mathematical utility: calculates shortest distance from point p to line segment vw
    distToSegment(p, v, w) {
        const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
        if (l2 === 0) return Math.sqrt((p.x - v.x)**2 + (p.y - v.y)**2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2);
    }
}
