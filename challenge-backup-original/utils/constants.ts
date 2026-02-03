import type { EventType, PlayerColor } from '@/types';

// Board dimensions
export const BOARD_SIZE = 13;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

// Game constants
export const PAWNS_PER_PLAYER = 4;
export const DICE_MIN = 1;
export const DICE_MAX = 6;
export const DICE_TO_EXIT_BASE = 6; // Need 6 to bring pawn out of base

// Path lengths
export const MAIN_PATH_LENGTH = 52; // Main track around the board
export const HOME_STRETCH_LENGTH = 6; // Final stretch to center

// Player starting positions on the main path
export const PLAYER_START_POSITIONS: Record<PlayerColor, number> = {
  yellow: 0,
  blue: 13,
  green: 26,
  red: 39,
};

// Player home stretch entry positions
export const PLAYER_HOME_ENTRY: Record<PlayerColor, number> = {
  yellow: 50,
  blue: 11,
  green: 24,
  red: 37,
};

// Base positions (corners) for each player
export const PLAYER_BASE_POSITIONS: Record<PlayerColor, { x: number; y: number }[]> = {
  yellow: [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
  ],
  blue: [
    { x: 10, y: 1 },
    { x: 11, y: 1 },
    { x: 10, y: 2 },
    { x: 11, y: 2 },
  ],
  green: [
    { x: 10, y: 10 },
    { x: 11, y: 10 },
    { x: 10, y: 11 },
    { x: 11, y: 11 },
  ],
  red: [
    { x: 1, y: 10 },
    { x: 2, y: 10 },
    { x: 1, y: 11 },
    { x: 2, y: 11 },
  ],
};

// Event distribution on the board (position on main path -> event type)
export const PATH_EVENTS: Record<number, EventType> = {
  // Quiz cases (every ~8 cells)
  4: 'quiz',
  12: 'quiz',
  17: 'quiz',
  25: 'quiz',
  30: 'quiz',
  38: 'quiz',
  43: 'quiz',
  51: 'quiz',

  // Funding cases
  8: 'funding',
  21: 'funding',
  34: 'funding',
  47: 'funding',

  // Duel cases
  6: 'duel',
  19: 'duel',
  32: 'duel',
  45: 'duel',

  // Opportunity cases
  2: 'opportunity',
  15: 'opportunity',
  28: 'opportunity',
  41: 'opportunity',

  // Challenge cases
  10: 'challenge',
  23: 'challenge',
  36: 'challenge',
  49: 'challenge',

  // Safe/Start positions (player start squares)
  0: 'start', // Yellow start
  13: 'start', // Blue start
  26: 'start', // Green start
  39: 'start', // Red start
};

// Main path coordinates (clockwise from yellow start)
// This maps position index (0-51) to board coordinates
export const MAIN_PATH_COORDS: { x: number; y: number }[] = [
  // Yellow exit and top-left section (0-5)
  { x: 1, y: 6 }, // 0 - Yellow start
  { x: 2, y: 6 },
  { x: 3, y: 6 },
  { x: 4, y: 6 },
  { x: 5, y: 6 },
  { x: 6, y: 5 },

  // Top section going up (6-11)
  { x: 6, y: 4 },
  { x: 6, y: 3 },
  { x: 6, y: 2 },
  { x: 6, y: 1 },
  { x: 6, y: 0 },
  { x: 7, y: 0 },

  // Top-right corner down (12-17)
  { x: 8, y: 0 },
  { x: 8, y: 1 }, // 13 - Blue start
  { x: 8, y: 2 },
  { x: 8, y: 3 },
  { x: 8, y: 4 },
  { x: 8, y: 5 },

  // Right section going right (18-23)
  { x: 9, y: 6 },
  { x: 10, y: 6 },
  { x: 11, y: 6 },
  { x: 12, y: 6 },
  { x: 12, y: 7 },
  { x: 12, y: 8 },

  // Bottom-right going down (24-29)
  { x: 11, y: 8 },
  { x: 10, y: 8 },
  { x: 9, y: 8 }, // 26 - Green start
  { x: 8, y: 9 },
  { x: 8, y: 10 },
  { x: 8, y: 11 },

  // Bottom section (30-35)
  { x: 8, y: 12 },
  { x: 7, y: 12 },
  { x: 6, y: 12 },
  { x: 6, y: 11 },
  { x: 6, y: 10 },
  { x: 6, y: 9 },

  // Left section going left (36-41)
  { x: 5, y: 8 },
  { x: 4, y: 8 },
  { x: 3, y: 8 },
  { x: 2, y: 8 }, // 39 - Red start
  { x: 1, y: 8 },
  { x: 0, y: 8 },

  // Back to top-left (42-51)
  { x: 0, y: 7 },
  { x: 0, y: 6 },
  { x: 1, y: 6 },
  { x: 2, y: 6 },
  { x: 3, y: 6 },
  { x: 4, y: 6 },
  { x: 5, y: 6 },
  { x: 6, y: 6 },
  { x: 6, y: 5 },
  { x: 6, y: 4 },
];

// Home stretch coordinates for each player (6 cells leading to center)
export const HOME_STRETCH_COORDS: Record<PlayerColor, { x: number; y: number }[]> = {
  yellow: [
    { x: 1, y: 6 },
    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 6 }, // Center
  ],
  blue: [
    { x: 6, y: 1 },
    { x: 6, y: 2 },
    { x: 6, y: 3 },
    { x: 6, y: 4 },
    { x: 6, y: 5 },
    { x: 6, y: 6 }, // Center
  ],
  green: [
    { x: 11, y: 6 },
    { x: 10, y: 6 },
    { x: 9, y: 6 },
    { x: 8, y: 6 },
    { x: 7, y: 6 },
    { x: 6, y: 6 }, // Center
  ],
  red: [
    { x: 6, y: 11 },
    { x: 6, y: 10 },
    { x: 6, y: 9 },
    { x: 6, y: 8 },
    { x: 6, y: 7 },
    { x: 6, y: 6 }, // Center
  ],
};

// Center position
export const CENTER_POSITION = { x: 6, y: 6 };

// Rewards
export const REWARDS = {
  quizCorrect: {
    easy: 5,
    medium: 10,
    hard: 15,
  },
  quizWrong: 0,
  duelWin: 15,
  duelLose: -5,
  fundingBase: 20,
  opportunityBase: 10,
  challengeBase: -10,
  captureBonus: 5,
  finishPawnBonus: 20,
  winGameBonus: 50,
};

// Timer durations (in seconds)
export const TIMERS = {
  quizEasy: 30,
  quizMedium: 20,
  quizHard: 15,
  duel: 15,
  turnTimeout: 60,
};

// XP rewards
export const XP_REWARDS = {
  gameComplete: 10,
  gameWin: 25,
  quizCorrect: 2,
  duelWin: 5,
  startupCreated: 15,
};
