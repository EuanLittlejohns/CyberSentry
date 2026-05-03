import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Tower } from './Tower.js';

describe('Tower', () => {
    it('should initialize with correct base stats', () => {
        const tower = Tower.create('pulse', 100, 100);
        expect(tower.type).toBe('pulse');
        expect(tower.range).toBe(120);
        expect(tower.damage).toBe(15);
        expect(tower.level).toBe(1);
    });

    it('should calculate upgrade stats correctly', () => {
        const tower = Tower.create('pulse', 100, 100);
        const nextStats = tower.getStats(2);

        expect(nextStats.range).toBeGreaterThan(120);
        expect(nextStats.damage).toBeGreaterThan(15);
        expect(nextStats.upgradeCost).toBeGreaterThan(0);
    });

    it('should upgrade correctly', () => {
        const tower = Tower.create('pulse', 100, 100);
        const initialRange = tower.range;

        const success = tower.upgrade();
        expect(success).toBe(true);
        expect(tower.level).toBe(2);
        expect(tower.range).toBeGreaterThan(initialRange);
    });

    it('should not upgrade past max level', () => {
        const tower = Tower.create('pulse', 100, 100);
        tower.upgrade(); // 2
        tower.upgrade(); // 3
        const success = tower.upgrade();
        expect(success).toBe(false);
        expect(tower.level).toBe(3);
    });

    it('should find the nearest enemy in range', () => {
        const tower = Tower.create('pulse', 0, 0);
        const enemies = [
            { x: 50, y: 50, isDead: false, hasReachedEnd: false },
            { x: 200, y: 200, isDead: false, hasReachedEnd: false }
        ];

        const target = tower.findNearestEnemy(enemies);
        expect(target).toBe(enemies[0]);
    });

    it('should rotate towards the target', () => {
        const tower = Tower.create('pulse', 0, 0);
        const enemies = [{ x: 100, y: 0, isDead: false, hasReachedEnd: false }];

        tower.update(enemies, 1000, []);
        expect(tower.rotation).toBe(0); // Directly right

        const enemies2 = [{ x: 0, y: 100, isDead: false, hasReachedEnd: false }];
        tower.target = null; // Reset target
        tower.update(enemies2, 1000, []);
        expect(tower.rotation).toBe(Math.PI / 2); // Directly down
    });
});
