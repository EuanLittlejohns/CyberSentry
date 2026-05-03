import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy, ScoutEnemy, TankEnemy, GlitchEnemy } from './Enemy.js';

describe('Enemy Entity', () => {
    const path = [{x: 0, y: 0}, {x: 100, y: 0}];

    it('should create correct enemy types via factory', () => {
        const scout = Enemy.create('scout', path);
        expect(scout).toBeInstanceOf(ScoutEnemy);
        expect(scout.speed).toBe(2);
    });

    it('should take damage and die', () => {
        const enemy = Enemy.create('scout', path);
        enemy.takeDamage(10);
        expect(enemy.health).toBe(40);
        enemy.takeDamage(40);
        expect(enemy.isDead).toBe(true);
    });

    it('should apply and recover from slow effects', () => {
        const enemy = Enemy.create('scout', path);
        enemy.applySlow(0.5, 1000);
        expect(enemy.slowAmount).toBe(0.5);
        
        // Mock update cycle (1s passed)
        enemy.update(1000);
        expect(enemy.slowAmount).toBe(1);
        expect(enemy.slowTimer).toBe(0);
    });

    it('should move towards waypoints', () => {
        const enemy = Enemy.create('scout', path);
        const initialX = enemy.x;
        enemy.update(16.67); // One frame at 60fps
        expect(enemy.x).toBeGreaterThan(initialX);
    });

    it('should detect when reaching the end of the path', () => {
        const enemy = Enemy.create('scout', path);
        // Instant move to end
        enemy.x = 100;
        enemy.y = 0;
        enemy.update(16.67);
        expect(enemy.hasReachedEnd).toBe(true);
    });
});
