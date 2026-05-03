import { describe, it, expect } from 'vitest';
import { Enemy } from './Enemy.js';

describe('Enemy', () => {
    const mockPath = [{ x: 0, y: 0 }, { x: 100, y: 0 }];

    it('should initialize with correct stats', () => {
        const enemy = Enemy.create('scout', mockPath);
        expect(enemy.health).toBe(50);
        expect(enemy.speed).toBe(2);
        expect(enemy.x).toBe(0);
        expect(enemy.y).toBe(0);
    });

    it('should move towards the next waypoint', () => {
        const enemy = Enemy.create('scout', mockPath);
        enemy.update(16.67); // 1 tick at 60fps
        expect(enemy.x).toBeGreaterThan(0);
        expect(enemy.x).toBeLessThan(100);
        expect(enemy.y).toBe(0);
    });

    it('should take damage and die', () => {
        const enemy = Enemy.create('scout', mockPath);
        enemy.takeDamage(50);
        expect(enemy.health).toBe(0);
        expect(enemy.isDead).toBe(true);
    });

    it('should be slowed by stasis', () => {
        const enemy = Enemy.create('scout', mockPath);
        enemy.applySlow(0.5, 1000);
        expect(enemy.slowAmount).toBe(0.5);
    });

    it('should reach the end of the path', () => {
        const enemy = Enemy.create('scout', mockPath);
        // Warp to near end
        enemy.x = 99;
        enemy.update(16.67);
        expect(enemy.hasReachedEnd).toBe(true);
    });

    it('should have different stats for different types', () => {
        const scout = Enemy.create('scout', mockPath);
        const tank = Enemy.create('tank', mockPath);
        const boss = Enemy.create('boss', mockPath);

        expect(tank.health).toBeGreaterThan(scout.health);
        expect(tank.speed).toBeLessThan(scout.speed);
        expect(boss.isBoss).toBe(true);
    });

    it('should recover from slow over time', () => {
        const enemy = Enemy.create('scout', mockPath);
        enemy.applySlow(0.5, 100); // 100ms
        expect(enemy.slowAmount).toBe(0.5);

        enemy.update(101); // Update past duration
        expect(enemy.slowAmount).toBe(1);
    });
});
