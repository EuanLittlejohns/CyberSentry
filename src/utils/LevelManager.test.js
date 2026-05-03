import { describe, it, expect, beforeEach } from 'vitest';
import { LevelManager, LEVELS } from './LevelManager.js';

describe('LevelManager', () => {
    let lm;
    beforeEach(() => {
        lm = new LevelManager();
    });

    it('should start at level 1, wave 1', () => {
        expect(lm.currentLevelIndex).toBe(0);
        expect(lm.currentWaveIndex).toBe(0);
        expect(lm.getCurrentLevel().id).toBe(1);
    });

    it('should advance waves correctly', () => {
        const initialWave = lm.currentWaveIndex;
        const hasMore = lm.nextWave();
        
        expect(lm.currentWaveIndex).toBe(initialWave + 1);
        expect(hasMore).toBe(true);
    });

    it('should advance levels correctly', () => {
        lm.currentLevelIndex = 0;
        lm.currentWaveIndex = LEVELS[0].waves.length - 1;
        
        const hasMoreWaves = lm.nextWave();
        expect(hasMoreWaves).toBe(false);
        
        const hasMoreLevels = lm.nextLevel();
        expect(hasMoreLevels).toBe(true);
        expect(lm.currentLevelIndex).toBe(1);
        expect(lm.currentWaveIndex).toBe(0);
    });

    it('should detect end of game', () => {
        lm.currentLevelIndex = LEVELS.length - 1;
        const hasMore = lm.nextLevel();
        expect(hasMore).toBe(false);
    });
});
