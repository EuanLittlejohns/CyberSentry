import { Projectile } from './Projectile.js';

export class Tower {
    constructor(stats, x, y) {
        this.type = stats.type;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.maxLevel = 3;
        
        this.range = stats.range;
        this.damage = stats.damage;
        this.fireRate = stats.fireRate;
        this.cost = stats.cost;
        this.totalInvested = stats.cost;
        this.special = stats.special || null;
        this.slowAmount = stats.slowAmount;
        this.color = stats.color;
        
        this.lastFired = 0;
        this.target = null;
        this.rotation = 0;
    }

    /**
     * Registry of available tower classes.
     * Driving source for factory creation and metadata collection.
     */
    static get CLASSES() {
        return {
            pulse: PulseTower,
            railgun: RailgunTower,
            nova: NovaTower,
            stasis: StasisTower
        };
    }

    static create(type, x, y) {
        const TowerClass = this.CLASSES[type] || PulseTower;
        return new TowerClass(x, y);
    }

    static getAvailableTowers() {
        return Object.entries(this.CLASSES).map(([type, Class]) => ({
            type,
            ...Class.metadata
        }));
    }

    getBaseStats() { return {}; }

    /**
     * Calculates stats for a specific level.
     * multiplier: +50% damage per level
     * range: +10% per level
     * fireRate: -10% delay per level
     */
    getStats(level = this.level) {
        const stats = this.getBaseStats();
        const multiplier = 1 + (level - 1) * 0.5;
        return {
            ...stats,
            range: stats.range * (1 + (level - 1) * 0.1),
            damage: stats.damage * multiplier,
            fireRate: stats.fireRate * (1 - (level - 1) * 0.1),
            slowAmount: stats.slowAmount ? Math.max(0.1, stats.slowAmount - (level - 1) * 0.1) : undefined,
            upgradeCost: Math.floor(stats.cost * 0.8 * level)
        };
    }

    upgrade() {
        if (this.level < this.maxLevel) {
            const nextStats = this.getStats(this.level + 1);
            this.level++;
            this.range = nextStats.range;
            this.damage = nextStats.damage;
            this.fireRate = nextStats.fireRate;
            this.slowAmount = nextStats.slowAmount;
            this.totalInvested += nextStats.upgradeCost;
            return true;
        }
        return false;
    }

    getSellValue() {
        return this.totalInvested;
    }

    update(enemies, currentTime, projectiles) {
        // Target acquisition logic: prioritizes sticking to current target until it leaves range or dies
        if (!this.target || this.target.isDead || this.getDistance(this.target) > this.range) {
            this.target = this.findNearestEnemy(enemies);
        }

        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            this.rotation = Math.atan2(dy, dx);

            if (currentTime - this.lastFired >= this.fireRate) {
                this.fire(projectiles);
                this.lastFired = currentTime;
            }
        }
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (enemy.isDead || enemy.hasReachedEnd) continue;
            const dist = this.getDistance(enemy);
            if (dist <= this.range && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    getDistance(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    fire(projectiles) {
        projectiles.push(Projectile.create({
            x: this.x,
            y: this.y,
            target: this.target,
            damage: this.damage,
            type: this.type,
            special: this.special,
            slowAmount: this.slowAmount,
            color: this.color
        }));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const size = 15 + (this.level * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Base platform
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Weapon details (rotated towards target)
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        this.drawDetails(ctx, size);

        ctx.restore();
        
        // Orbital Level Indicators
        ctx.save();
        ctx.translate(this.x, this.y);
        for(let i=0; i<this.level; i++) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            const angle = (Math.PI * 2 / 3) * i - Math.PI/2;
            ctx.arc(Math.cos(angle) * (size + 5), Math.sin(angle) * (size + 5), 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawDetails(ctx, size) {}
}

export class PulseTower extends Tower {
    static get metadata() {
        return { name: 'Pulse Turret', cost: 50, desc: 'Rapid energy discharge', icon: '⚡' };
    }
    constructor(x, y) {
        super({ 
            type: 'pulse', range: 120, damage: 15, fireRate: 600, cost: 50,
            color: '#00f2ff'
        }, x, y);
    }
    getBaseStats() { return { type: 'pulse', range: 120, damage: 15, fireRate: 600, cost: 50 }; }
    drawDetails(ctx, size) {
        ctx.fillRect(5, -8, 15, 4);
        ctx.fillRect(5, 4, 15, 4);
        ctx.fillRect(-size/2, -size/2, size, size);
    }
}

export class RailgunTower extends Tower {
    static get metadata() {
        return { name: 'Railgun', cost: 150, desc: 'Kinetic penetrator', icon: '🎯' };
    }
    constructor(x, y) {
        super({ 
            type: 'railgun', range: 250, damage: 80, fireRate: 1500, cost: 150,
            color: '#ff00f2'
        }, x, y);
    }
    getBaseStats() { return { type: 'railgun', range: 250, damage: 80, fireRate: 1500, cost: 150 }; }
    drawDetails(ctx, size) {
        ctx.fillRect(5, -3, 25, 6);
        ctx.strokeRect(8, -5, 20, 10);
        ctx.fillRect(0, -10, 2, 20);
        ctx.fillRect(4, -10, 2, 20);
    }
}

export class NovaTower extends Tower {
    static get metadata() {
        return { name: 'Nova Mortar', cost: 100, desc: 'AOE seismic blast', icon: '💥' };
    }
    constructor(x, y) {
        super({ 
            type: 'nova', range: 80, damage: 20, fireRate: 1000, cost: 100, special: 'aoe',
            color: '#fff200'
        }, x, y);
    }
    getBaseStats() { return { type: 'nova', range: 80, damage: 20, fireRate: 1000, cost: 100, special: 'aoe' }; }
    drawDetails(ctx, size) {
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeRect(-5, -5, 10, 10);
        for(let i=0; i<4; i++) {
            ctx.rotate(Math.PI/2);
            ctx.fillRect(8, -2, 6, 4);
        }
    }
}

export class StasisTower extends Tower {
    static get metadata() {
        return { name: 'Stasis Field', cost: 120, desc: 'Slows data threats', icon: '❄️' };
    }
    constructor(x, y) {
        super({ 
            type: 'stasis', range: 100, damage: 0, fireRate: 800, cost: 120, special: 'slow', slowAmount: 0.5,
            color: '#00ff88'
        }, x, y);
    }
    getBaseStats() { return { type: 'stasis', range: 100, damage: 0, fireRate: 800, cost: 120, special: 'slow', slowAmount: 0.5 }; }
    drawDetails(ctx, size) {
        ctx.beginPath();
        ctx.arc(5, 0, 12, -Math.PI/2, Math.PI/2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.fillRect(10, -2, 4, 4);
    }
}
