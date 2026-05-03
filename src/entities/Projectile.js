import { Particle } from './Particle.js';

export class Projectile {
    constructor(params) {
        this.x = params.x;
        this.y = params.y;
        this.target = params.target;
        this.damage = params.damage;
        this.type = params.type;
        this.special = params.special;
        this.slowAmount = params.slowAmount || 0.5;
        this.speed = params.speed || 5;
        this.isDead = false;
        this.color = params.color || '#fff';
        
        // Target tracking: project to last known target position if target is lost
        this.targetX = params.target ? params.target.x : params.x;
        this.targetY = params.target ? params.target.y : params.y;
    }

    static get CLASSES() {
        return {
            pulse: PulseProjectile,
            railgun: RailgunProjectile,
            nova: NovaProjectile,
            stasis: StasisProjectile
        };
    }

    static create(params) {
        const ProjClass = this.CLASSES[params.type] || PulseProjectile;
        return new ProjClass(params);
    }

    update(deltaTime, enemies, particles) {
        if (this.isDead) return;

        if (this.target && !this.target.isDead) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const moveDist = this.speed * (deltaTime / 16.67);

        if (distance <= moveDist) {
            this.hit(enemies, particles);
        } else {
            this.x += (dx / distance) * moveDist;
            this.y += (dy / distance) * moveDist;
        }
    }

    hit(enemies, particles) {
        this.isDead = true;
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
        this.applyEffect(enemies);
    }

    applyEffect(enemies) {
        if (this.target && !this.target.isDead) {
            this.target.takeDamage(this.damage);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class PulseProjectile extends Projectile {}

export class RailgunProjectile extends Projectile {
    constructor(params) {
        super(params);
        this.speed = 15;
    }
}

export class NovaProjectile extends Projectile {
    applyEffect(enemies) {
        const radius = 50;
        enemies.forEach(e => {
            const dist = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
            if (dist <= radius) {
                e.takeDamage(this.damage);
            }
        });
    }
}

export class StasisProjectile extends Projectile {
    applyEffect(enemies) {
        if (this.target && !this.target.isDead) {
            this.target.applySlow(this.slowAmount, 2000);
            this.target.takeDamage(this.damage);
        }
    }
}
