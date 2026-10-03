import { LevelConfig, LevelObjective } from '../types';

export const WORLDS = [
  { id: 1, name: '🍬 Gummy Meadow', start: 1, end: 20, theme: 'from-pink-400 via-rose-300 to-amber-200' },
  { id: 2, name: '🍋 Lemon Lagoon', start: 21, end: 40, theme: 'from-amber-400 via-yellow-300 to-emerald-200' },
  { id: 3, name: '🍫 Chocolate Canyon', start: 41, end: 60, theme: 'from-amber-700 via-yellow-600 to-amber-900' },
  { id: 4, name: '🍧 Jelly Galaxy', start: 61, end: 80, theme: 'from-purple-600 via-indigo-400 to-pink-300' },
  { id: 5, name: '🌈 Rainbow Kingdom', start: 81, end: 100, theme: 'from-fuchsia-500 via-cyan-400 to-amber-300' },
  { id: 6, name: '⭐ Celestial Sugar Peak', start: 101, end: 120, theme: 'from-blue-600 via-violet-500 to-fuchsia-400' },
];

export const getWorldForLevel = (levelNumber: number) => {
  const world = WORLDS.find(w => levelNumber >= w.start && levelNumber <= w.end);
  return world || WORLDS[WORLDS.length - 1];
};

export const generateLevelConfig = (lvl: number): LevelConfig => {
  const world = getWorldForLevel(lvl);

  // Rows and columns
  const rows = 8;
  const cols = 8;

  // Moves calculation: gradually tighter moves, adjusted per level
  const baseMoves = Math.max(16, 28 - Math.floor(lvl / 10));
  const moves = baseMoves + ((lvl % 5) === 0 ? 4 : 0);

  // Determine objective type based on level
  let objective: LevelObjective;
  const typeMod = lvl % 4;

  if (lvl === 1) {
    objective = {
      type: 'score',
      targetScore: 1200,
      description: 'Reach 1,200 points to pass Level 1!'
    };
  } else if (typeMod === 0 || lvl === 2) {
    // Jelly challenge
    const jellyTarget = Math.min(64, 8 + Math.floor(lvl * 0.45));
    objective = {
      type: 'jelly',
      targetScore: 1500 + lvl * 180,
      targetJellyCount: jellyTarget,
      description: `Clear all ${jellyTarget} frosted jelly squares!`
    };
  } else if (typeMod === 1) {
    // Red/Blue/Green candy collection target
    const colors: ('red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple')[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    const targetCol = colors[lvl % colors.length];
    const targetCount = 15 + Math.min(35, Math.floor(lvl * 0.35));
    objective = {
      type: 'color_collection',
      targetScore: 2000 + lvl * 200,
      targetColor: targetCol,
      targetColorCount: targetCount,
      description: `Collect ${targetCount} delicious ${targetCol.toUpperCase()} candies!`
    };
  } else {
    // High score challenge
    const targetScore = 2000 + lvl * 260 + (lvl % 3) * 300;
    objective = {
      type: 'score',
      targetScore,
      description: `Score ${targetScore.toLocaleString()} points with juicy combos!`
    };
  }

  // Star thresholds
  const star1 = objective.targetScore;
  const star2 = Math.round(star1 * 1.5);
  const star3 = Math.round(star1 * 2.2);

  return {
    levelNumber: lvl,
    worldName: world.name,
    worldTheme: world.theme,
    rows,
    cols,
    moves,
    objective,
    star1,
    star2,
    star3,
    initialJellyRate: objective.type === 'jelly' ? Math.min(0.65, 0.2 + (lvl * 0.005)) : 0
  };
};

export const TOTAL_LEVELS = 120;
