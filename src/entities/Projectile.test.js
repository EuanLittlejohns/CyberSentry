import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Projectile, StasisProjectile, NovaProjectile } from './Projectile.js';

describe('Projectile Entity', () => {
    it('should move towards its target coordinate', () => {
        const proj = Projectile.create({
            x: 0, y: 0, target: { x: 100, y: 0 }, damage: 10, type: 'pulse'
        });
        proj.update(16.67, [], []);
        expect(proj.x).toBeGreaterThan(0);
    });

    it('should trigger a hit when close to target', () => {
        const target = { x: 5, y: 0, takeDamage: vi.fn(), isDead: false };
        const particles = [];
        const proj = Projectile.create({
            x: 0, y: 0, target: target, damage: 10, type: 'pulse'
        });
        
        proj.update(1000, [], particles); // Move far enough to hit
        expect(proj.isDead).toBe(true);
        expect(target.takeDamage).toHaveBeenCalledWith(10);
        expect(particles.length).toBeGreaterThan(0);
    });

    it('should apply AOE damage for Nova projectiles', () => {
        const enemies = [
            { x: 10, y: 10, takeDamage: vi.fn() },
            { x: 100, y: 100, takeDamage: vi.fn() }
        ];
        const proj = Projectile.create({
            x: 0, y: 0, target: enemies[0], damage: 20, type: 'nova'
        });
        
        proj.hit(enemies, []);
        expect(enemies[0].takeDamage).toHaveBeenCalledWith(20);
        expect(enemies[1].takeDamage).not.toHaveBeenCalled();
    });

    it('should apply slow for Stasis projectiles', () => {
        const target = { x: 0, y: 0, takeDamage: vi.fn(), applySlow: vi.fn() };
        const proj = Projectile.create({
            x: 0, y: 0, target: target, damage: 5, type: 'stasis', slowAmount: 0.5
        });
        
        proj.hit([], []);
        expect(target.applySlow).toHaveBeenCalledWith(0.5, 2000);
    });
});
