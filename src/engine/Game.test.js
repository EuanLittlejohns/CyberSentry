import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game } from './Game.js';
import { Tower } from '../entities/Tower.js';

describe('Game', () => {
    let mockCanvas;
    let mockUI;
    let game;

    beforeEach(() => {
        global.requestAnimationFrame = vi.fn();

        mockCanvas = {
            getContext: () => ({
                clearRect: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                stroke: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                translate: vi.fn(),
                rotate: vi.fn(),
                fillText: vi.fn(),
                setLineDash: vi.fn(),
                rect: vi.fn(),
                strokeRect: vi.fn(),
                fillRect: vi.fn(),
                closePath: vi.fn()
            }),
            width: 800,
            height: 600,
            getBoundingClientRect: () => ({ left: 0, top: 0 })
        };
        mockUI = {
            updateStats: vi.fn(),
            showScreen: vi.fn()
        };

        global.document = {
            getElementById: vi.fn(() => ({ innerText: '', style: {} })),
            querySelectorAll: vi.fn(() => [])
        };

        game = new Game(mockCanvas, mockUI);
    });

    it('should initialize with starting gold and lives', () => {
        expect(game.gold).toBe(300);
        expect(game.lives).toBe(20);
        expect(game.state).toBe('MENU');
    });

    it('should start level correctly', () => {
        game.startLevel();
        expect(game.state).toBe('PLAYING');
        expect(game.entities.enemies.length).toBe(0);
    });

    it('should place tower if enough gold and valid position', () => {
        game.startLevel();
        const initialGold = game.gold;
        const success = game.placeTower('pulse', 200, 200);

        expect(success).toBe(true);
        expect(game.entities.towers.length).toBe(1);
        expect(game.gold).toBeLessThan(initialGold);
    });

    it('should not place tower if not enough gold', () => {
        game.gold = 0;
        const success = game.placeTower('pulse', 100, 100);
        expect(success).toBe(false);
    });

    it('should lose lives when enemies reach end', () => {
        game.startLevel();
        game.entities.enemies.push({
            hasReachedEnd: true,
            update: () => { },
            draw: () => { }
        });

        game.update(16);
        expect(game.lives).toBe(19);
    });

    it('should trigger game over when lives reach 0', () => {
        game.startLevel();
        game.lives = 1;
        game.entities.enemies.push({
            hasReachedEnd: true,
            update: () => { },
            draw: () => { }
        });

        game.update(16);
        expect(game.state).toBe('GAMEOVER');
        expect(mockUI.showScreen).toHaveBeenCalledWith('gameover-screen');
    });

    it('should not allow placing towers too close to each other', () => {
        game.startLevel();
        game.placeTower('pulse', 100, 100);
        const success = game.placeTower('pulse', 110, 110);
        expect(success).toBe(false);
    });

    it('should not allow placing towers on the path', () => {
        game.startLevel();
        // Path starts at 0,100 -> 600,100
        const success = game.placeTower('pulse', 300, 100);
        expect(success).toBe(false);
    });

    it('should handle wave completion and victory', () => {
        game.startLevel();
        game.isWaveInProgress = true;
        game.isSpawning = false;
        game.entities.enemies = []; // No enemies left

        // Mock LevelManager to be on the last wave of the last level
        game.levelMgr.currentLevelIndex = 2; // Core Terminal
        game.levelMgr.currentWaveIndex = 5; // Last wave

        game.update(16);
        expect(game.state).toBe('VICTORY');
        expect(mockUI.showScreen).toHaveBeenCalledWith('victory-screen');
    });
});
