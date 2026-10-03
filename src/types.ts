export type CandyColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'color_bomb';

export interface CandyItem {
  id: string;
  row: number;
  col: number;
  color: CandyColor;
  special: SpecialType;
  isMatched?: boolean;
  isNew?: boolean;
  offsetY?: number;
  dropDistance?: number;
  isDropping?: boolean;
}

export interface TileState {
  hasJelly: boolean;
  jellyHealth: number; // 0 = none, 1 = regular jelly, 2 = double jelly
  isBlocked?: boolean;
}

export type LevelObjectiveType = 'score' | 'jelly' | 'ingredients' | 'color_collection';

export interface LevelObjective {
  type: LevelObjectiveType;
  targetScore: number;
  targetJellyCount?: number;
  targetColor?: CandyColor;
  targetColorCount?: number;
  targetIngredients?: number;
  description: string;
}

export interface LevelConfig {
  levelNumber: number;
  worldName: string;
  worldTheme: string;
  rows: number;
  cols: number;
  moves: number;
  objective: LevelObjective;
  star1: number;
  star2: number;
  star3: number;
  initialJellyRate?: number;
}

export interface PlayerProgress {
  unlockedLevel: number;
  stars: Record<number, number>; // levelNumber -> stars (1-3)
  highScores: Record<number, number>; // levelNumber -> score
  coins: number;
  lives: number;
  maxLives: number;
  boosters: {
    lollipop: number;
    colorBomb: number;
    extraMoves: number;
    striped: number;
  };
  dailyRewardStreak: number;
  lastClaimDate: string | null;
  settings: {
    bgmVolume: number;
    sfxVolume: number;
    hapticsEnabled: boolean;
    musicTrackIndex: number;
    companionVoice: boolean;
  };
}

export interface FriendData {
  id: string;
  name: string;
  avatar: string;
  level: number;
  score: number;
  isOnline: boolean;
  lastActive: string;
  hasSentLifeToday?: boolean;
}

export interface DailyRewardItem {
  day: number;
  coins: number;
  boosterName: string;
  boosterType: 'lollipop' | 'colorBomb' | 'extraMoves' | 'striped' | 'coins';
  boosterAmount: number;
  description: string;
}

export type GameScreen = 'home' | 'map' | 'game' | 'pause' | 'win' | 'lose';

export type AnimeEmotion = 'happy' | 'excited' | 'worried' | 'cheering' | 'celebrating' | 'surprised';
