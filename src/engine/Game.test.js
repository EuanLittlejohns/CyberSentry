import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from './Game.js';
import { Tower } from '../entities/Tower.js';

// Mock Canvas and DOM for headless testing
global.document = {
    getElementById: vi.fn().mockReturnValue({
        getContext: () => ({
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            arc: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            setLineDash: vi.fn(),
            fillText: vi.fn(),
        }),
        width: 800,
        height: 600,
        innerText: ''
    }),
    querySelectorAll: vi.fn().mockReturnValue([])
};
global.requestAnimationFrame = vi.fn();

describe('Game Engine', () => {
    let game;
    let canvas;

    beforeEach(() => {
        canvas = document.getElementById('gameCanvas');
        game = new Game(canvas, {
            updateStats: vi.fn(),
            showScreen: vi.fn()
        });
        game.startLevel();
    });

    it('should initialize with correct starting resources', () => {
        expect(game.gold).toBe(300);
        expect(game.lives).toBe(20);
        expect(game.state).toBe('PLAYING');
    });

    it('should correctly validate tower placement on path', () => {
        // Path point in Sector 1 is at y=100
        const result = game.canPlaceTower('pulse', 100, 100);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('PATH OBSTRUCTION');
    });

    it('should correctly validate tower placement near other towers', () => {
        game.placeTower('pulse', 400, 400);
        const result = game.canPlaceTower('pulse', 410, 410);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe('TOWER PROXIMITY ALERT');
    });

    it('should subtract gold when placing a tower', () => {
        const initialGold = game.gold;
        const towerCost = Tower.create('pulse', 0, 0).cost;
        game.placeTower('pulse', 400, 400);
        expect(game.gold).toBe(initialGold - towerCost);
    });

    it('should trigger game over when lives reach zero', () => {
        game.lives = 1;
        // Mock an enemy reaching the end
        game.entities.enemies = [{ hasReachedEnd: true }];
        
        // Filter logic in update()
        game.entities.enemies = game.entities.enemies.filter(e => {
            if (e.hasReachedEnd) {
                game.lives--;
                if (game.lives <= 0) game.gameOver();
                return false;
            }
            return true;
        });

        expect(game.state).toBe('GAMEOVER');
    });
});
