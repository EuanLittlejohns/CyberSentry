import { describe, it, expect, beforeEach } from 'vitest';
import { Tower, PulseTower, RailgunTower } from './Tower.js';

describe('Tower Entity', () => {
    it('should create correct tower types via factory', () => {
        const tower = Tower.create('pulse', 100, 100);
        expect(tower).toBeInstanceOf(PulseTower);
        expect(tower.cost).toBe(50);
    });

    it('should calculate upgrade stats correctly', () => {
        const tower = Tower.create('pulse', 0, 0);
        const initialDamage = tower.damage;
        const nextStats = tower.getStats(2);
        
        expect(nextStats.damage).toBe(initialDamage * 1.5);
        expect(nextStats.upgradeCost).toBe(Math.floor(tower.cost * 0.8 * 1));
    });

    it('should apply upgrades correctly', () => {
        const tower = Tower.create('pulse', 0, 0);
        const initialLevel = tower.level;
        tower.upgrade();
        expect(tower.level).toBe(initialLevel + 1);
        expect(tower.totalInvested).toBeGreaterThan(tower.cost);
    });

    it('should find targets within range', () => {
        const tower = Tower.create('pulse', 0, 0);
        const inRange = { x: 50, y: 50, isDead: false };
        const outRange = { x: 500, y: 500, isDead: false };
        
        const target = tower.findNearestEnemy([outRange, inRange]);
        expect(target).toBe(inRange);
    });

    it('should produce metadata for the shop', () => {
        const towers = Tower.getAvailableTowers();
        expect(towers.length).toBe(4);
        expect(towers[0]).toHaveProperty('name');
        expect(towers[0]).toHaveProperty('cost');
    });
});
