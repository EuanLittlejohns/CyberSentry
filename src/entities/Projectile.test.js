import { describe, it, expect, vi } from 'vitest';
import { Projectile } from './Projectile.js';

describe('Projectile', () => {
    it('should initialize correctly', () => {
        const target = { x: 100, y: 100 };
        const p = Projectile.create({ x: 0, y: 0, target: target, damage: 10, type: 'pulse' });

        expect(p.damage).toBe(10);
        expect(p.type).toBe('pulse');
        expect(p.targetX).toBe(100);
    });

    it('should move towards target', () => {
        const target = { x: 100, y: 0, isDead: false };
        const p = Projectile.create({ x: 0, y: 0, target: target, damage: 10, type: 'pulse' });

        p.update(16.67, [], []); // 1 frame
        expect(p.x).toBeGreaterThan(0);
        expect(p.y).toBe(0);
    });

    it('should hit target and deal damage', () => {
        const target = {
            x: 5, y: 0, isDead: false,
            takeDamage: (amt) => target.health -= amt,
            health: 100
        };
        const p = Projectile.create({ x: 0, y: 0, target: target, damage: 10, type: 'pulse', speed: 10 });

        p.update(16.67, [], []); // Should hit in 1 frame (dist 5, speed 10)
        expect(p.isDead).toBe(true);
        expect(target.health).toBe(90);
    });

    it('should handle AOE damage', () => {
        const enemies = [
            { x: 10, y: 0, health: 100, takeDamage(amt) { this.health -= amt } },
            { x: 50, y: 0, health: 100, takeDamage(amt) { this.health -= amt } },
            { x: 100, y: 0, health: 100, takeDamage(amt) { this.health -= amt } }
        ];
        const dummyTarget = { x: 0, y: 0 };
        const p = Projectile.create({ x: 0, y: 0, target: dummyTarget, damage: 20, type: 'nova', special: 'aoe' });
        p.hit(enemies, []);

        expect(enemies[0].health).toBe(80); // In range (dist 10 < 50)
        expect(enemies[1].health).toBe(80); // On edge (dist 50 <= 50)
        expect(enemies[2].health).toBe(100); // Out of range (dist 100)
    });

    it('should apply slow effect for stasis projectiles', () => {
        const target = {
            x: 0, y: 0, isDead: false,
            applySlow: vi.fn(),
            takeDamage: vi.fn()
        };
        const p = Projectile.create({
            x: 0, y: 0, target: target, damage: 0, type: 'stasis',
            special: 'slow', slowAmount: 0.4
        });
        p.applyEffect([]);

        expect(target.applySlow).toHaveBeenCalledWith(0.4, 2000);
    });
});
