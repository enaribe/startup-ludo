/**
 * Configuration du plateau de jeu Ludo - Design visuel
 *
 * Structure basée sur l'image de référence :
 * - Grille 13x13
 * - 4 zones maison colorées aux coins (5x5 chacune)
 * - Chemin de cases formant une croix (3 colonnes de large)
 * - Zone centrale 3x3 pour l'arrivée
 * - Circuit de 44 cases
 */

import type { PlayerColor } from '@/types';

// ===== TYPES =====

export interface Coordinate {
  row: number;
  col: number;
}

export interface PlayerConfig {
  startIndex: number;      // Position de départ sur le circuit
  exitIndex: number;       // Position avant l'entrée du chemin final
  homePosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  homeCoords: Coordinate;  // Coordonnées du centre de la zone maison
  homeSlots: Coordinate[]; // Positions des pions dans la maison (max 4)
}

// ===== CONSTANTES =====

export const BOARD_SIZE = 13;        // Grille 13x13
export const CIRCUIT_LENGTH = 44;    // 44 cases sur le circuit
export const FINAL_PATH_LENGTH = 5;  // 5 cases vers le centre
export const TOKENS_TO_FINISH = 7;   // Jetons requis pour finir
export const DICE_TO_EXIT = 6;       // Dé pour sortir de la maison
export const DEFAULT_PAWNS_COUNT = 1; // 1 pion par défaut (configurable à 4)

// Centre du plateau (zone 3x3) - position 5,6,7
export const CENTER_COORDS: Coordinate = { row: 6, col: 6 };

// ===== CIRCUIT PRINCIPAL (44 cases, sens horaire) =====
// Grille 13x13 : zones maison 5x5 aux coins, croix 3 colonnes au centre

export const MAIN_CIRCUIT: Coordinate[] = [
  // === BRAS GAUCHE (row 5 et 7, col 0-4) ===
  // Rangée du haut (row 5) - Yellow entre ici
  { row: 5, col: 0 },   // 0
  { row: 5, col: 1 },   // 1 - Départ Yellow ⭐
  { row: 5, col: 2 },   // 2
  { row: 5, col: 3 },   // 3
  { row: 5, col: 4 },   // 4

  // === BRAS HAUT (col 5 et 7, row 0-4) ===
  // Colonne gauche (col 5) - montée
  { row: 4, col: 5 },   // 5
  { row: 3, col: 5 },   // 6
  { row: 2, col: 5 },   // 7
  { row: 1, col: 5 },   // 8
  { row: 0, col: 5 },   // 9

  // Traversée du haut (row 0)
  { row: 0, col: 6 },   // 10
  { row: 0, col: 7 },   // 11

  // Colonne droite (col 7) - descente - Blue entre ici
  { row: 1, col: 7 },   // 12 - Départ Blue ⭐
  { row: 2, col: 7 },   // 13
  { row: 3, col: 7 },   // 14
  { row: 4, col: 7 },   // 15

  // === BRAS DROIT (row 5 et 7, col 8-12) ===
  // Rangée du haut (row 5)
  { row: 5, col: 8 },   // 16
  { row: 5, col: 9 },   // 17
  { row: 5, col: 10 },  // 18
  { row: 5, col: 11 },  // 19
  { row: 5, col: 12 },  // 20

  // Traversée droite (col 12)
  { row: 6, col: 12 },  // 21
  { row: 7, col: 12 },  // 22

  // Rangée du bas (row 7) - Red entre ici
  { row: 7, col: 11 },  // 23 - Départ Red ⭐
  { row: 7, col: 10 },  // 24
  { row: 7, col: 9 },   // 25
  { row: 7, col: 8 },   // 26

  // === BRAS BAS (col 5 et 7, row 8-12) ===
  // Colonne droite (col 7) - descente
  { row: 8, col: 7 },   // 27
  { row: 9, col: 7 },   // 28
  { row: 10, col: 7 },  // 29
  { row: 11, col: 7 },  // 30
  { row: 12, col: 7 },  // 31

  // Traversée du bas (row 12)
  { row: 12, col: 6 },  // 32
  { row: 12, col: 5 },  // 33

  // Colonne gauche (col 5) - montée - Green entre ici
  { row: 11, col: 5 },  // 34 - Départ Green ⭐
  { row: 10, col: 5 },  // 35
  { row: 9, col: 5 },   // 36
  { row: 8, col: 5 },   // 37

  // === RETOUR BRAS GAUCHE (row 7, col 0-4) ===
  // Rangée du bas (row 7)
  { row: 7, col: 4 },   // 38
  { row: 7, col: 3 },   // 39
  { row: 7, col: 2 },   // 40
  { row: 7, col: 1 },   // 41
  { row: 7, col: 0 },   // 42

  // Traversée gauche (col 0)
  { row: 6, col: 0 },   // 43
  // Puis retour à 0
];

// ===== CHEMINS FINAUX (5 cases chacun, vers le centre) =====

export const FINAL_PATHS: Record<PlayerColor, Coordinate[]> = {
  yellow: [
    { row: 6, col: 1 },   // Final 0
    { row: 6, col: 2 },   // Final 1
    { row: 6, col: 3 },   // Final 2
    { row: 6, col: 4 },   // Final 3
    { row: 6, col: 5 },   // Final 4 - Adjacent au centre
  ],
  blue: [
    { row: 1, col: 6 },   // Final 0
    { row: 2, col: 6 },   // Final 1
    { row: 3, col: 6 },   // Final 2
    { row: 4, col: 6 },   // Final 3
    { row: 5, col: 6 },   // Final 4 - Adjacent au centre
  ],
  red: [
    { row: 6, col: 11 },  // Final 0
    { row: 6, col: 10 },  // Final 1
    { row: 6, col: 9 },   // Final 2
    { row: 6, col: 8 },   // Final 3
    { row: 6, col: 7 },   // Final 4 - Adjacent au centre
  ],
  green: [
    { row: 11, col: 6 },  // Final 0
    { row: 10, col: 6 },  // Final 1
    { row: 9, col: 6 },   // Final 2
    { row: 8, col: 6 },   // Final 3
    { row: 7, col: 6 },   // Final 4 - Adjacent au centre
  ],
};

// ===== CONFIGURATION PAR JOUEUR =====

export const PLAYER_CONFIG: Record<PlayerColor, PlayerConfig> = {
  yellow: {
    startIndex: 1,
    exitIndex: 43,
    homePosition: 'top-left',
    homeCoords: { row: 2, col: 2 },
    homeSlots: [
      { row: 1, col: 1 },
      { row: 1, col: 3 },
      { row: 3, col: 1 },
      { row: 3, col: 3 },
    ],
  },
  blue: {
    startIndex: 12,
    exitIndex: 11,
    homePosition: 'top-right',
    homeCoords: { row: 2, col: 10 },
    homeSlots: [
      { row: 1, col: 9 },
      { row: 1, col: 11 },
      { row: 3, col: 9 },
      { row: 3, col: 11 },
    ],
  },
  red: {
    startIndex: 23,
    exitIndex: 22,
    homePosition: 'bottom-right',
    homeCoords: { row: 10, col: 10 },
    homeSlots: [
      { row: 9, col: 9 },
      { row: 9, col: 11 },
      { row: 11, col: 9 },
      { row: 11, col: 11 },
    ],
  },
  green: {
    startIndex: 34,
    exitIndex: 33,
    homePosition: 'bottom-left',
    homeCoords: { row: 10, col: 2 },
    homeSlots: [
      { row: 9, col: 1 },
      { row: 9, col: 3 },
      { row: 11, col: 1 },
      { row: 11, col: 3 },
    ],
  },
};

// ===== CASES SPÉCIALES =====

// Cases safe (étoiles) - pas de capture possible
export const SAFE_POSITIONS: number[] = [1, 12, 23, 34]; // Les départs

// Types d'événements sur les cases
export type CellEventType = 'quiz' | 'funding' | 'duel' | 'opportunity' | 'challenge' | 'safe' | 'start' | 'normal';

// Distribution des événements sur le circuit (44 cases)
export const CIRCUIT_EVENTS: Record<number, CellEventType> = {
  // Cases de départ (safe)
  1: 'start',   // Yellow
  12: 'start',  // Blue
  23: 'start',  // Red
  34: 'start',  // Green

  // Quiz
  4: 'quiz',
  15: 'quiz',
  26: 'quiz',
  37: 'quiz',

  // Funding
  7: 'funding',
  18: 'funding',
  29: 'funding',
  40: 'funding',

  // Duel
  6: 'duel',
  17: 'duel',
  28: 'duel',
  39: 'duel',

  // Opportunity
  3: 'opportunity',
  14: 'opportunity',
  25: 'opportunity',
  36: 'opportunity',

  // Challenge
  9: 'challenge',
  20: 'challenge',
  31: 'challenge',
  42: 'challenge',
};

// ===== HELPERS =====

/**
 * Vérifie si une position est safe (pas de capture)
 */
export function isSafePosition(circuitIndex: number): boolean {
  return SAFE_POSITIONS.includes(circuitIndex);
}

/**
 * Obtient le type d'événement pour une position
 */
export function getEventAtCircuitPosition(circuitIndex: number): CellEventType {
  return CIRCUIT_EVENTS[circuitIndex] ?? 'normal';
}

/**
 * Calcule la distance entre deux positions (sens horaire)
 */
export function getCircuitDistance(from: number, to: number): number {
  if (to >= from) {
    return to - from;
  }
  return CIRCUIT_LENGTH - from + to;
}

/**
 * Convertit des coordonnées en pixels
 */
export function coordsToPixels(
  coords: Coordinate,
  cellSize: number,
  boardPadding: number = 0
): { x: number; y: number } {
  // Protection contre les coordonnées invalides
  if (!coords || typeof coords.col !== 'number' || typeof coords.row !== 'number') {
    console.error('[coordsToPixels] Invalid coords:', coords);
    return { x: 0, y: 0 };
  }
  
  if (isNaN(coords.col) || isNaN(coords.row)) {
    console.error('[coordsToPixels] NaN coords:', coords);
    return { x: 0, y: 0 };
  }
  
  return {
    x: boardPadding + coords.col * cellSize + cellSize / 2,
    y: boardPadding + coords.row * cellSize + cellSize / 2,
  };
}

/**
 * Vérifie si une coordonnée est dans une zone maison
 */
export function getHomeZoneColor(row: number, col: number): PlayerColor | null {
  // Yellow: top-left (0-4, 0-4)
  if (row >= 0 && row <= 4 && col >= 0 && col <= 4) return 'yellow';

  // Blue: top-right (0-4, 8-12)
  if (row >= 0 && row <= 4 && col >= 8 && col <= 12) return 'blue';

  // Red: bottom-right (8-12, 8-12)
  if (row >= 8 && row <= 12 && col >= 8 && col <= 12) return 'red';

  // Green: bottom-left (8-12, 0-4)
  if (row >= 8 && row <= 12 && col >= 0 && col <= 4) return 'green';

  return null;
}

/**
 * Vérifie si une coordonnée est dans la zone centrale
 */
export function isInCenterZone(row: number, col: number): boolean {
  return row >= 5 && row <= 7 && col >= 5 && col <= 7;
}

/**
 * Trouve l'index du circuit pour une coordonnée
 */
export function getCircuitIndex(row: number, col: number): number | null {
  const index = MAIN_CIRCUIT.findIndex(c => c.row === row && c.col === col);
  return index >= 0 ? index : null;
}

/**
 * Trouve si une coordonnée est sur un chemin final
 */
export function getFinalPathInfo(row: number, col: number): { color: PlayerColor; index: number } | null {
  for (const color of ['yellow', 'blue', 'red', 'green'] as PlayerColor[]) {
    const index = FINAL_PATHS[color].findIndex(c => c.row === row && c.col === col);
    if (index >= 0) {
      return { color, index };
    }
  }
  return null;
}
