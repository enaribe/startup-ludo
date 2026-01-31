/**
 * Moteur de jeu Ludo - Startup Ludo
 *
 * Gère toute la logique de déplacement des pions selon l'architecture :
 * - Circuit principal de 42 cases (partagé)
 * - Chemins finaux de 5 cases (par couleur)
 * - Règle des 7 jetons minimum pour finir
 */

import type { Player, PlayerColor, PawnState, GameEvent, EventType } from '@/types';
import {
  MAIN_CIRCUIT,
  FINAL_PATHS,
  PLAYER_CONFIG,
  CIRCUIT_LENGTH,
  FINAL_PATH_LENGTH,
  TOKENS_TO_FINISH,
  DICE_TO_EXIT,
  CENTER_COORDS,
  DEFAULT_PAWNS_COUNT,
  isSafePosition,
  getEventAtCircuitPosition,
  getCircuitDistance,
  type Coordinate,
} from '@/config/boardConfig';

// ===== TYPES =====

export interface MoveResult {
  canMove: boolean;
  newState: PawnState;
  path: Coordinate[];                              // Chemin d'animation case par case
  capturedPawn?: { playerId: string; pawnIndex: number };
  triggeredEvent?: EventType;
  isFinished?: boolean;
}

export interface ValidMove {
  type: 'exit' | 'move';
  pawnIndex: number;
  result: MoveResult;
}

// ===== CLASSE PRINCIPALE =====

export class GameEngine {
  /**
   * Vérifie si un joueur peut sortir un pion de sa maison
   */
  static canExitHome(player: Player, diceValue: number): boolean {
    if (diceValue !== DICE_TO_EXIT) return false;

    // Vérifie s'il y a au moins un pion à la maison
    return player.pawns.some(pawn => pawn.status === 'home');
  }

  /**
   * Fait sortir un pion de la maison
   */
  static exitHome(
    player: Player,
    pawnIndex: number,
    allPlayers: Player[]
  ): MoveResult {
    const pawn = player.pawns[pawnIndex];
    if (!pawn || pawn.status !== 'home') {
      return {
        canMove: false,
        newState: pawn ?? { status: 'home', slotIndex: 0 },
        path: [],
      };
    }

    const config = PLAYER_CONFIG[player.color];
    const startPosition = config.startIndex;
    const startCoords = MAIN_CIRCUIT[startPosition]!;

    const newState: PawnState = { status: 'circuit', position: startPosition };

    // Vérifier capture à la case de départ
    const capturedPawn = this.checkCapture(
      player.id,
      player.color,
      startPosition,
      allPlayers
    );

    // Événement sur la case de départ
    const eventType = getEventAtCircuitPosition(startPosition);
    const triggeredEvent = eventType !== 'normal' && eventType !== 'start' && eventType !== 'safe'
      ? eventType as EventType
      : undefined;

    return {
      canMove: true,
      newState,
      path: [startCoords],
      capturedPawn,
      triggeredEvent,
    };
  }

  /**
   * Déplace un pion selon la valeur du dé
   */
  static movePawn(
    player: Player,
    pawnIndex: number,
    diceValue: number,
    allPlayers: Player[]
  ): MoveResult {
    const pawn = player.pawns[pawnIndex];
    if (!pawn) {
      return {
        canMove: false,
        newState: { status: 'home', slotIndex: 0 },
        path: [],
      };
    }

    // CAS 1: Le pion est à la maison
    if (pawn.status === 'home') {
      return {
        canMove: false,
        newState: pawn,
        path: [],
      };
    }

    // CAS 2: Le pion est sur le circuit principal
    if (pawn.status === 'circuit') {
      return this.moveOnCircuit(player, pawn, diceValue, allPlayers);
    }

    // CAS 3: Le pion est sur le chemin final
    if (pawn.status === 'final') {
      return this.moveOnFinalPath(player.color, pawn, diceValue);
    }

    // CAS 4: Le pion a déjà fini
    return {
      canMove: false,
      newState: pawn,
      path: [],
    };
  }

  /**
   * Déplacement sur le circuit principal
   */
  private static moveOnCircuit(
    player: Player,
    pawn: Extract<PawnState, { status: 'circuit' }>,
    diceValue: number,
    allPlayers: Player[]
  ): MoveResult {
    const config = PLAYER_CONFIG[player.color];
    const currentPos = pawn.position;
    const exitPos = config.exitIndex;

    // Calculer la distance jusqu'à la sortie (sens horaire)
    const stepsToExit = getCircuitDistance(currentPos, exitPos);

    // Vérifier si le mouvement passe par ou dépasse la case de sortie
    // ET si le joueur a assez de jetons pour finir
    if (diceValue > stepsToExit && player.tokens >= TOKENS_TO_FINISH) {
      // Entrer dans le chemin final
      const stepsIntoFinal = diceValue - stepsToExit - 1;

      if (stepsIntoFinal === FINAL_PATH_LENGTH - 1) {
        // Atteint exactement la dernière case → VICTOIRE
        const path = this.buildPathToFinal(player.color, currentPos, FINAL_PATH_LENGTH - 1);

        return {
          canMove: true,
          newState: { status: 'finished' },
          path: [...path, CENTER_COORDS],
          isFinished: true,
        };
      } else if (stepsIntoFinal < FINAL_PATH_LENGTH - 1) {
        // Position valide dans le chemin final (avant la dernière case)
        const path = this.buildPathToFinal(player.color, currentPos, stepsIntoFinal);
        const newState: PawnState = { status: 'final', position: stepsIntoFinal };

        return {
          canMove: true,
          newState,
          path,
        };
      } else {
        // Dépasse le centre → ne peut pas bouger
        return {
          canMove: false,
          newState: pawn,
          path: [],
        };
      }
    }

    // Mouvement normal sur le circuit (wrap-around naturel avec modulo)
    const newPos = (currentPos + diceValue) % CIRCUIT_LENGTH;
    const path = this.buildCircuitPath(currentPos, newPos);
    const newState: PawnState = { status: 'circuit', position: newPos };

    // Vérifier capture
    const capturedPawn = this.checkCapture(
      player.id,
      player.color,
      newPos,
      allPlayers
    );

    // Vérifier événement
    const eventType = getEventAtCircuitPosition(newPos);
    const triggeredEvent = eventType !== 'normal' && eventType !== 'start' && eventType !== 'safe'
      ? eventType as EventType
      : undefined;

    return {
      canMove: true,
      newState,
      path,
      capturedPawn,
      triggeredEvent,
    };
  }

  /**
   * Déplacement sur le chemin final
   */
  private static moveOnFinalPath(
    color: PlayerColor,
    pawn: Extract<PawnState, { status: 'final' }>,
    diceValue: number
  ): MoveResult {
    const currentPos = pawn.position;
    const newPos = currentPos + diceValue;

    if (newPos === FINAL_PATH_LENGTH - 1) {
      // Atteint exactement le centre → VICTOIRE
      const path = FINAL_PATHS[color].slice(currentPos + 1, newPos + 1);

      return {
        canMove: true,
        newState: { status: 'finished' },
        path: [...path, CENTER_COORDS],
        isFinished: true,
      };
    } else if (newPos < FINAL_PATH_LENGTH - 1) {
      // Avance dans le chemin final
      const path = FINAL_PATHS[color].slice(currentPos + 1, newPos + 1);

      return {
        canMove: true,
        newState: { status: 'final', position: newPos },
        path,
      };
    } else {
      // Dépasse le centre → ne peut pas bouger
      return {
        canMove: false,
        newState: pawn,
        path: [],
      };
    }
  }

  /**
   * Construit le chemin d'animation sur le circuit
   */
  private static buildCircuitPath(from: number, to: number): Coordinate[] {
    console.log('[GameEngine.buildCircuitPath] Building path from', from, 'to', to);
    
    const path: Coordinate[] = [];
    let current = from;
    let iterations = 0;
    const maxIterations = CIRCUIT_LENGTH + 1; // Protection contre boucle infinie

    while (current !== to && iterations < maxIterations) {
      current = (current + 1) % CIRCUIT_LENGTH;
      const coord = MAIN_CIRCUIT[current];
      if (coord) {
        path.push(coord);
      } else {
        console.warn('[GameEngine.buildCircuitPath] Missing coord at position:', current);
      }
      iterations++;
    }

    if (iterations >= maxIterations) {
      console.error('[GameEngine.buildCircuitPath] Max iterations reached!', { from, to });
    }

    console.log('[GameEngine.buildCircuitPath] Path built with', path.length, 'steps');
    return path;
  }

  /**
   * Construit le chemin d'animation vers le chemin final
   */
  private static buildPathToFinal(
    color: PlayerColor,
    fromCircuit: number,
    toFinalPos: number
  ): Coordinate[] {
    console.log('[GameEngine.buildPathToFinal]', { color, fromCircuit, toFinalPos });
    
    const config = PLAYER_CONFIG[color];
    if (!config) {
      console.error('[GameEngine.buildPathToFinal] No config for color:', color);
      return [];
    }
    
    const path: Coordinate[] = [];
    let iterations = 0;
    const maxIterations = CIRCUIT_LENGTH + 1;

    // D'abord, aller jusqu'à la case de sortie
    let current = fromCircuit;
    while (current !== config.exitIndex && iterations < maxIterations) {
      current = (current + 1) % CIRCUIT_LENGTH;
      const coord = MAIN_CIRCUIT[current];
      if (coord) {
        path.push(coord);
      } else {
        console.warn('[GameEngine.buildPathToFinal] Missing circuit coord at:', current);
      }
      iterations++;
    }

    if (iterations >= maxIterations) {
      console.error('[GameEngine.buildPathToFinal] Max iterations reached for circuit!');
      return path;
    }

    // Puis entrer dans le chemin final
    const finalPath = FINAL_PATHS[color];
    if (!finalPath) {
      console.error('[GameEngine.buildPathToFinal] No final path for color:', color);
      return path;
    }
    
    for (let i = 0; i <= toFinalPos; i++) {
      const coord = finalPath[i];
      if (coord) {
        path.push(coord);
      } else {
        console.warn('[GameEngine.buildPathToFinal] Missing final coord at:', i);
      }
    }

    console.log('[GameEngine.buildPathToFinal] Path built with', path.length, 'steps');
    return path;
  }

  /**
   * Vérifie si un mouvement capture un pion adverse
   */
  private static checkCapture(
    movingPlayerId: string,
    _movingPlayerColor: PlayerColor,
    targetPosition: number,
    allPlayers: Player[]
  ): { playerId: string; pawnIndex: number } | undefined {
    // Pas de capture sur les cases safe
    if (isSafePosition(targetPosition)) {
      return undefined;
    }

    for (const player of allPlayers) {
      if (player.id === movingPlayerId) continue;

      for (let i = 0; i < player.pawns.length; i++) {
        const pawn = player.pawns[i];
        if (
          pawn &&
          pawn.status === 'circuit' &&
          pawn.position === targetPosition
        ) {
          return { playerId: player.id, pawnIndex: i };
        }
      }
    }

    return undefined;
  }

  /**
   * Obtient tous les mouvements valides pour un joueur
   */
  static getValidMoves(
    player: Player,
    diceValue: number,
    allPlayers: Player[]
  ): ValidMove[] {
    const moves: ValidMove[] = [];

    // Vérifier si on peut sortir un pion
    if (this.canExitHome(player, diceValue)) {
      // Trouver le premier pion à la maison
      const homeIndex = player.pawns.findIndex(p => p.status === 'home');
      if (homeIndex !== -1) {
        const result = this.exitHome(player, homeIndex, allPlayers);
        if (result.canMove) {
          moves.push({ type: 'exit', pawnIndex: homeIndex, result });
        }
      }
    }

    // Vérifier chaque pion qui peut bouger
    for (let i = 0; i < player.pawns.length; i++) {
      const pawn = player.pawns[i];
      if (!pawn || pawn.status === 'home' || pawn.status === 'finished') {
        continue;
      }

      const result = this.movePawn(player, i, diceValue, allPlayers);
      if (result.canMove) {
        moves.push({ type: 'move', pawnIndex: i, result });
      }
    }

    return moves;
  }

  /**
   * Vérifie si un joueur a des mouvements disponibles
   */
  static hasValidMoves(
    player: Player,
    diceValue: number,
    allPlayers: Player[]
  ): boolean {
    return this.getValidMoves(player, diceValue, allPlayers).length > 0;
  }

  /**
   * Vérifie si un joueur a gagné
   */
  static hasPlayerWon(player: Player): boolean {
    return player.pawns.every(pawn => pawn.status === 'finished');
  }

  /**
   * Compte les pions dans chaque état
   */
  static countPawns(player: Player): {
    home: number;
    circuit: number;
    final: number;
    finished: number;
  } {
    return player.pawns.reduce(
      (acc, pawn) => {
        acc[pawn.status]++;
        return acc;
      },
      { home: 0, circuit: 0, final: 0, finished: 0 }
    );
  }

  /**
   * Obtient les coordonnées d'un pion pour le rendu
   */
  static getPawnCoordinates(
    color: PlayerColor,
    pawn: PawnState
  ): Coordinate | null {
    try {
      if (!pawn || !color) {
        console.error('[GameEngine.getPawnCoordinates] Invalid params:', { color, pawn });
        return null;
      }

      if (pawn.status === 'home') {
        const config = PLAYER_CONFIG[color];
        if (!config) {
          console.error('[GameEngine.getPawnCoordinates] No config for color:', color);
          return null;
        }
        const slotIndex = pawn.slotIndex ?? 0;
        const slot = config.homeSlots[slotIndex];
        const result = slot ?? config.homeCoords;
        console.log(`[GameEngine.getPawnCoordinates] home pawn ${color} slot ${slotIndex}:`, result);
        return result;
      }

      if (pawn.status === 'circuit') {
        const position = pawn.position ?? 0;
        const result = MAIN_CIRCUIT[position];
        if (!result) {
          console.error('[GameEngine.getPawnCoordinates] Invalid circuit position:', position);
          return null;
        }
        console.log(`[GameEngine.getPawnCoordinates] circuit pawn ${color} pos ${position}:`, result);
        return result;
      }

      if (pawn.status === 'final') {
        const position = pawn.position ?? 0;
        const finalPath = FINAL_PATHS[color];
        if (!finalPath) {
          console.error('[GameEngine.getPawnCoordinates] No final path for color:', color);
          return null;
        }
        const result = finalPath[position];
        if (!result) {
          console.error('[GameEngine.getPawnCoordinates] Invalid final position:', { color, position });
          return null;
        }
        console.log(`[GameEngine.getPawnCoordinates] final pawn ${color} pos ${position}:`, result);
        return result;
      }

      if (pawn.status === 'finished') {
        console.log(`[GameEngine.getPawnCoordinates] finished pawn ${color}:`, CENTER_COORDS);
        return CENTER_COORDS;
      }

      console.warn('[GameEngine.getPawnCoordinates] Unknown pawn status:', pawn.status);
      return null;
    } catch (error) {
      console.error('[GameEngine.getPawnCoordinates] Error:', error, { color, pawn });
      return null;
    }
  }

  /**
   * Détermine si un pion fait un 6 et peut rejouer
   */
  static getsAnotherTurn(diceValue: number): boolean {
    return diceValue === 6;
  }

  /**
   * Calcule la récompense pour un événement
   */
  static calculateEventReward(
    eventType: EventType,
    success: boolean,
    difficulty?: 'easy' | 'medium' | 'hard'
  ): number {
    const REWARDS = {
      quiz: { easy: 2, medium: 4, hard: 6 },
      funding: 5,
      duel: { win: 3, lose: -2 },
      opportunity: 3,
      challenge: -2,
    };

    switch (eventType) {
      case 'quiz':
        if (success && difficulty) {
          return REWARDS.quiz[difficulty];
        }
        return 0;

      case 'funding':
        return success ? REWARDS.funding : 0;

      case 'duel':
        return success ? REWARDS.duel.win : REWARDS.duel.lose;

      case 'opportunity':
        return REWARDS.opportunity;

      case 'challenge':
        return REWARDS.challenge;

      default:
        return 0;
    }
  }

  /**
   * Génère un événement aléatoire
   */
  static generateEvent(type: EventType, _edition: string): GameEvent | null {
    // Placeholder - sera enrichi avec les données des éditions
    switch (type) {
      case 'quiz':
        return {
          type: 'quiz',
          data: {
            id: `quiz_${Date.now()}`,
            category: 'startup',
            question: 'Quel est le premier pas pour créer une startup ?',
            options: [
              'Chercher des investisseurs',
              'Identifier un problème à résoudre',
              'Créer un logo',
              'Ouvrir un compte bancaire',
            ],
            correctAnswer: 1,
            difficulty: 'easy' as const,
            reward: 2,
            timeLimit: 30,
          },
        };

      case 'funding':
        return {
          type: 'funding',
          data: {
            id: `funding_${Date.now()}`,
            name: 'Investisseur Providentiel',
            description: 'Un investisseur croit en ton projet !',
            type: 'investisseur' as const,
            amount: 5,
            rarity: 'common' as const,
          },
        };

      case 'duel':
        return {
          type: 'duel',
          data: {
            id: `duel_${Date.now()}`,
            question: 'Quel business model génère des revenus récurrents ?',
            options: ['Vente unique', 'Abonnement', 'Freemium', 'Commission'],
            correctAnswer: 1,
            stake: 3,
            category: 'business',
          },
        };

      case 'opportunity':
        return {
          type: 'opportunity',
          data: {
            id: `opportunity_${Date.now()}`,
            title: 'Partenariat stratégique',
            description: 'Une grande entreprise veut collaborer !',
            effect: 'tokens' as const,
            value: 3,
            rarity: 'common' as const,
          },
        };

      case 'challenge':
        return {
          type: 'challenge',
          data: {
            id: `challenge_${Date.now()}`,
            title: 'Problème de trésorerie',
            description: 'Des dépenses imprévues affectent ton budget.',
            effect: 'loseTokens' as const,
            value: 2,
            rarity: 'common' as const,
          },
        };

      default:
        return null;
    }
  }

  /**
   * Crée l'état initial des pions pour un joueur
   * Par défaut utilise DEFAULT_PAWNS_COUNT (1 pion)
   */
  static createInitialPawns(count: number = DEFAULT_PAWNS_COUNT): PawnState[] {
    const pawns: PawnState[] = [];
    for (let i = 0; i < count; i++) {
      pawns.push({ status: 'home', slotIndex: i });
    }
    return pawns;
  }
}
