export const LEVELS = [
    {
        id: 1,
        name: "Sector Alpha",
        path: [
            {x: 0, y: 100},
            {x: 600, y: 100},
            {x: 600, y: 300},
            {x: 100, y: 300},
            {x: 100, y: 500},
            {x: 800, y: 500}
        ],
        waves: [
            { enemies: { scout: 5 }, interval: 1000 },
            { enemies: { scout: 10 }, interval: 800 },
            { enemies: { scout: 5, tank: 2 }, interval: 1200 },
            { enemies: { glitch: 5 }, interval: 600 },
            { enemies: { tank: 5 }, interval: 1500 },
            { enemies: { boss: 1 }, interval: 0 }
        ]
    },
    {
        id: 2,
        name: "Sector Beta",
        path: [
            {x: 400, y: 0},
            {x: 400, y: 200},
            {x: 100, y: 200},
            {x: 100, y: 400},
            {x: 700, y: 400},
            {x: 700, y: 600}
        ],
        waves: [
            { enemies: { scout: 15 }, interval: 600 },
            { enemies: { tank: 8 }, interval: 1200 },
            { enemies: { glitch: 10 }, interval: 400 },
            { enemies: { scout: 20, glitch: 10 }, interval: 300 },
            { enemies: { tank: 15 }, interval: 1000 },
            { enemies: { boss: 2 }, interval: 2000 }
        ]
    },
    {
        id: 3,
        name: "Core Terminal",
        path: [
            {x: 0, y: 300},
            {x: 200, y: 300},
            {x: 200, y: 100},
            {x: 600, y: 100},
            {x: 600, y: 500},
            {x: 200, y: 500},
            {x: 200, y: 300},
            {x: 800, y: 300}
        ],
        waves: [
            { enemies: { glitch: 20 }, interval: 300 },
            { enemies: { tank: 10, scout: 20 }, interval: 500 },
            { enemies: { boss: 1, tank: 10 }, interval: 1000 },
            { enemies: { glitch: 40 }, interval: 100 },
            { enemies: { tank: 20, glitch: 20 }, interval: 400 },
            { enemies: { boss: 3 }, interval: 1500 }
        ]
    }
];

export class LevelManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.currentWaveIndex = 0;
    }

    getCurrentLevel() {
        return LEVELS[this.currentLevelIndex];
    }

    getCurrentWave() {
        return this.getCurrentLevel().waves[this.currentWaveIndex];
    }

    nextWave() {
        this.currentWaveIndex++;
        if (this.currentWaveIndex >= this.getCurrentLevel().waves.length) {
            return false; // Level completed
        }
        return true;
    }

    nextLevel() {
        this.currentLevelIndex++;
        this.currentWaveIndex = 0;
        return this.currentLevelIndex < LEVELS.length;
    }
}
