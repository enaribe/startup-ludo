import type { BoardCell, PlayerColor, EventType } from '@/types';
import {
  BOARD_SIZE,
  MAIN_PATH_COORDS,
  HOME_STRETCH_COORDS,
  PLAYER_BASE_POSITIONS,
  PATH_EVENTS,
  CENTER_POSITION,
  PLAYER_START_POSITIONS,
  MAIN_PATH_LENGTH,
} from './constants';

/**
 * Generate the complete board grid with all cell types
 */
export function generateBoardCells(): BoardCell[] {
  const cells: BoardCell[] = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = createCell(x, y);
      cells.push(cell);
    }
  }

  return cells;
}

/**
 * Create a single cell based on its position
 */
function createCell(x: number, y: number): BoardCell {
  const index = y * BOARD_SIZE + x;

  // Check if it's the center
  if (x === CENTER_POSITION.x && y === CENTER_POSITION.y) {
    return { index, type: 'finish', x, y };
  }

  // Check if it's a player base
  for (const [color, positions] of Object.entries(PLAYER_BASE_POSITIONS)) {
    for (const pos of positions) {
      if (pos.x === x && pos.y === y) {
        return {
          index,
          type: 'safe',
          x,
          y,
          isPlayerStart: color as PlayerColor,
        };
      }
    }
  }

  // Check if it's on the main path
  const pathIndex = MAIN_PATH_COORDS.findIndex((pos) => pos.x === x && pos.y === y);
  if (pathIndex !== -1) {
    const eventType = PATH_EVENTS[pathIndex] ?? 'safe';
    const isStart = Object.entries(PLAYER_START_POSITIONS).find(
      ([, startIdx]) => startIdx === pathIndex
    );

    return {
      index,
      type: eventType,
      x,
      y,
      isPlayerStart: isStart ? (isStart[0] as PlayerColor) : undefined,
    };
  }

  // Check if it's on any home stretch
  for (const [color, coords] of Object.entries(HOME_STRETCH_COORDS)) {
    const homeIndex = coords.findIndex((pos) => pos.x === x && pos.y === y);
    if (homeIndex !== -1 && homeIndex < coords.length - 1) {
      return {
        index,
        type: 'safe',
        x,
        y,
        isPlayerPath: color as PlayerColor,
      };
    }
  }

  // Empty cell (not part of the game)
  return { index, type: 'safe', x, y };
}

/**
 * Check if a cell is part of the playable board
 */
export function isPlayableCell(x: number, y: number): boolean {
  // Center
  if (x === CENTER_POSITION.x && y === CENTER_POSITION.y) return true;

  // Main path
  if (MAIN_PATH_COORDS.some((pos) => pos.x === x && pos.y === y)) return true;

  // Home stretches
  for (const coords of Object.values(HOME_STRETCH_COORDS)) {
    if (coords.some((pos) => pos.x === x && pos.y === y)) return true;
  }

  // Player bases
  for (const positions of Object.values(PLAYER_BASE_POSITIONS)) {
    if (positions.some((pos) => pos.x === x && pos.y === y)) return true;
  }

  return false;
}

/**
 * Get the cell at specific coordinates
 */
export function getCellAt(cells: BoardCell[], x: number, y: number): BoardCell | undefined {
  return cells.find((cell) => cell.x === x && cell.y === y);
}

/**
 * Get coordinates for a position on the main path
 */
export function getMainPathCoords(position: number): { x: number; y: number } | null {
  const normalizedPos = position % MAIN_PATH_LENGTH;
  return MAIN_PATH_COORDS[normalizedPos] ?? null;
}

/**
 * Get coordinates for a position on a player's home stretch
 */
export function getHomeStretchCoords(
  color: PlayerColor,
  position: number
): { x: number; y: number } | null {
  const coords = HOME_STRETCH_COORDS[color];
  return coords[position] ?? null;
}

/**
 * Calculate the actual board position for a pawn
 */
export function getPawnBoardPosition(
  color: PlayerColor,
  pathPosition: number,
  isInHomeStretch: boolean
): { x: number; y: number } | null {
  if (isInHomeStretch) {
    return getHomeStretchCoords(color, pathPosition);
  }
  return getMainPathCoords(pathPosition);
}

/**
 * Check if a position is on a player's safe zone (start square)
 */
export function isSafeZone(position: number): boolean {
  return Object.values(PLAYER_START_POSITIONS).includes(position);
}

/**
 * Get the event type at a given path position
 */
export function getEventAtPosition(position: number): EventType {
  const normalizedPos = position % MAIN_PATH_LENGTH;
  return PATH_EVENTS[normalizedPos] ?? 'safe';
}

/**
 * Calculate distance between two path positions
 */
export function getPathDistance(from: number, to: number): number {
  if (to >= from) {
    return to - from;
  }
  return MAIN_PATH_LENGTH - from + to;
}

/**
 * Check if a pawn can enter home stretch
 */
export function canEnterHomeStretch(
  color: PlayerColor,
  currentPosition: number,
  diceValue: number
): boolean {
  const startPos = PLAYER_START_POSITIONS[color];
  const homeEntryPos = (startPos + MAIN_PATH_LENGTH - 1) % MAIN_PATH_LENGTH;

  // Calculate if the pawn would pass or land on home entry
  const newPos = currentPosition + diceValue;

  // Check if we've completed a full lap and are approaching home
  if (currentPosition <= homeEntryPos && newPos > homeEntryPos) {
    return true;
  }

  // Handle wrap-around case
  if (currentPosition > homeEntryPos) {
    const wrappedPos = newPos % MAIN_PATH_LENGTH;
    if (wrappedPos <= homeEntryPos || newPos >= MAIN_PATH_LENGTH + homeEntryPos) {
      return true;
    }
  }

  return false;
}

/**
 * Get cell color based on event type
 */
export function getCellColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    quiz: '#4A90E2',
    funding: '#50C878',
    duel: '#FF6B6B',
    opportunity: '#FFB347',
    challenge: '#9B59B6',
    safe: 'rgba(255, 255, 255, 0.1)',
    start: '#2ECC71',
    finish: '#FFD700',
  };
  return colors[type];
}
