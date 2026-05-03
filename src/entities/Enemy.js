export class Enemy {
    constructor(stats, path) {
        this.type = stats.type;
        this.path = path;
        this.waypointIndex = 0;
        
        this.maxHealth = stats.health;
        this.health = stats.health;
        this.speed = stats.speed;
        this.reward = stats.reward;
        this.isBoss = stats.isBoss || false;
        this.color = stats.color;
        
        this.x = path[0].x;
        this.y = path[0].y;
        
        this.radius = this.isBoss ? 20 : 12;
        this.isDead = false;
        this.hasReachedEnd = false;
        
        this.slowAmount = 1;
        this.slowTimer = 0;
    }

    static create(type, path) {
        switch(type) {
            case 'scout': return new ScoutEnemy(path);
            case 'tank': return new TankEnemy(path);
            case 'glitch': return new GlitchEnemy(path);
            case 'boss': return new BossEnemy(path);
            default: return new ScoutEnemy(path);
        }
    }

    update(deltaTime) {
        if (this.isDead || this.hasReachedEnd) return;

        // Apply slow decay over time
        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime;
            if (this.slowTimer <= 0) {
                this.slowTimer = 0;
                this.slowAmount = 1;
            }
        }

        const target = this.path[this.waypointIndex + 1];
        if (!target) {
            this.hasReachedEnd = true;
            return;
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const moveDist = this.speed * this.slowAmount * (deltaTime / 16.67);

        // Pathing logic: snap to waypoint if close enough, otherwise move towards it
        if (distance <= moveDist) {
            this.x = target.x;
            this.y = target.y;
            this.waypointIndex++;
            
            if (this.waypointIndex >= this.path.length - 1) {
                this.hasReachedEnd = true;
            }
        } else {
            this.x += (dx / distance) * moveDist;
            this.y += (dy / distance) * moveDist;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }

    applySlow(amount, duration) {
        this.slowAmount = amount;
        this.slowTimer = duration;
    }

    draw(ctx) {
        ctx.save();
        
        // Frost effect: glow cyan-white when slowed
        const drawColor = this.slowAmount < 1 ? '#00ff88' : this.color;
        ctx.shadowBlur = this.slowAmount < 1 ? 20 : 10;
        ctx.shadowColor = drawColor;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.slowAmount < 1 ? '#fff' : this.color;
        ctx.lineWidth = 2;

        ctx.translate(this.x, this.y);
        
        // Rotate body to face the direction of movement
        const target = this.path[this.waypointIndex + 1];
        if (target) {
            const angle = Math.atan2(target.y - this.y, target.x - this.x);
            ctx.rotate(angle);
        }

        this.drawShape(ctx);
        ctx.restore();

        this.drawHealthBar(ctx);
    }

    drawShape(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2.5;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 12;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const hpPercent = this.health / this.maxHealth;
        // Color shifts from Green -> Yellow -> Red based on HP percentage
        ctx.fillStyle = hpPercent > 0.5 ? '#00ff88' : (hpPercent > 0.2 ? '#fff200' : '#ff0055');
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
}

export class ScoutEnemy extends Enemy {
    constructor(path) {
        super({ type: 'scout', health: 50, speed: 2, reward: 10, color: '#00f2ff' }, path);
    }
    drawShape(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius/1.5);
        ctx.lineTo(-this.radius, this.radius/1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

export class TankEnemy extends Enemy {
    constructor(path) {
        super({ type: 'tank', health: 200, speed: 0.8, reward: 25, color: '#ff00f2' }, path);
    }
    drawShape(ctx) {
        ctx.beginPath();
        ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.strokeRect(-this.radius + 3, -this.radius + 3, (this.radius * 2) - 6, (this.radius * 2) - 6);
        ctx.fill();
        ctx.stroke();
    }
}

export class GlitchEnemy extends Enemy {
    constructor(path) {
        super({ type: 'glitch', health: 80, speed: 3, reward: 20, color: '#fff200' }, path);
    }
    drawShape(ctx) {
        // Visual "jitter" effect: 20% chance per frame to offset the rendering position
        if (Math.random() > 0.8) ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
        ctx.beginPath();
        ctx.moveTo(this.radius * 1.2, 0);
        ctx.lineTo(0, -this.radius * 1.2);
        ctx.lineTo(-this.radius * 1.2, 0);
        ctx.lineTo(0, this.radius * 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

export class BossEnemy extends Enemy {
    constructor(path) {
        super({ type: 'boss', health: 2000, speed: 0.5, reward: 100, color: '#ff0055', isBoss: true }, path);
    }
    drawShape(ctx) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i;
            const px = Math.cos(a) * this.radius;
            const py = Math.sin(a) * this.radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, this.radius/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}
