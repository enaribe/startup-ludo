/**
 * onlineCodec - Encodage/decodage compact pour la synchronisation online
 *
 * Encode les PawnState et le game state en format compact pour minimiser
 * le trafic Firebase RTDB (~200 bytes par checkpoint au lieu de ~2KB).
 */

import type { PawnState, GameState } from '@/types';

// ===== TYPES =====

export interface CompactCheckpoint {
  /** Turn number */
  t: number;
  /** Current player index */
  i: number;
  /** Pawns: { playerId: ["c5", "h0", ...] } */
  p: Record<string, string[]>;
  /** Tokens: { playerId: amount } */
  j: Record<string, number>;
  /** Edition */
  e: string;
  /** Timestamp */
  ts?: number;
}

export interface CheckpointData {
  currentTurn: number;
  currentPlayerIndex: number;
  pawns: Record<string, PawnState[]>;
  tokens: Record<string, number>;
  edition: string;
}

// ===== PAWN ENCODING =====

/**
 * Encode un PawnState en string compact :
 * - home:     "h0" .. "h3"   (h + slotIndex)
 * - circuit:  "c0" .. "c43"  (c + position)
 * - final:    "f0" .. "f4"   (f + position)
 * - finished: "F"
 */
export function encodePawn(pawn: PawnState): string {
  switch (pawn.status) {
    case 'home':
      return `h${pawn.slotIndex}`;
    case 'circuit':
      return `c${pawn.position}`;
    case 'final':
      return `f${pawn.position}`;
    case 'finished':
      return 'F';
  }
}

/**
 * Decode un string compact en PawnState
 */
export function decodePawn(s: string): PawnState {
  if (s === 'F') {
    return { status: 'finished' };
  }

  const prefix = s[0];
  const value = parseInt(s.slice(1), 10);

  switch (prefix) {
    case 'h':
      return { status: 'home', slotIndex: value };
    case 'c':
      return { status: 'circuit', position: value, distanceTraveled: 0 };
    case 'f':
      return { status: 'final', position: value };
    default:
      // Fallback safe
      return { status: 'home', slotIndex: 0 };
  }
}

// ===== CHECKPOINT ENCODING =====

/**
 * Encode le game state en checkpoint compact pour RTDB
 */
export function encodeCheckpoint(game: GameState): CompactCheckpoint {
  const pawns: Record<string, string[]> = {};
  const tokens: Record<string, number> = {};

  for (const player of game.players) {
    pawns[player.id] = player.pawns.map(encodePawn);
    tokens[player.id] = player.tokens;
  }

  return {
    t: game.currentTurn,
    i: game.currentPlayerIndex,
    p: pawns,
    j: tokens,
    e: game.edition,
  };
}

/**
 * Decode un checkpoint compact en donnees applicables au store
 */
export function decodeCheckpoint(cp: CompactCheckpoint): CheckpointData {
  const pawns: Record<string, PawnState[]> = {};

  for (const [playerId, encodedPawns] of Object.entries(cp.p)) {
    pawns[playerId] = encodedPawns.map(decodePawn);
  }

  return {
    currentTurn: cp.t,
    currentPlayerIndex: cp.i,
    pawns,
    tokens: cp.j,
    edition: cp.e,
  };
}
