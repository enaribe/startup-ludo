/**
 * Game Store - Gestion de l'état du jeu
 *
 * Utilise le nouveau système de pions avec PawnState :
 * - home: Pion à la maison (slotIndex 0-3)
 * - circuit: Pion sur le circuit principal (position 0-35)
 * - final: Pion sur le chemin final (position 0-3)
 * - finished: Pion arrivé au centre
 *
 * Par défaut: 1 pion par joueur (configurable via DEFAULT_PAWNS_COUNT)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GameState, GameMode, Player, GameEvent, PlayerColor, PawnState, EventType, ChallengeContext } from '@/types';
import { GameEngine, type MoveResult, type ValidMove } from '@/services/game/GameEngine';
import { eventManager, type GeneratedGameEvent } from '@/services/game/EventManager';
import type { EditionId } from '@/data';
import type { CheckpointData } from '@/utils/onlineCodec';

/** Action compacte recue d'un joueur distant via RTDB */
export interface RemoteAction {
  /** Type: r=roll, m=move, x=exit, e=event, s=skip, n=nextTurn, w=win */
  t: string;
  /** Player ID */
  p: string;
  /** Data payload */
  d: Record<string, unknown>;
  /** Timestamp */
  ts?: number;
  /** Action ID (from Firebase key) */
  id?: string | null;
}

interface HighlightedPosition {
  type: 'circuit' | 'final' | 'home';
  position: number;
  color?: PlayerColor;
}

interface PlayerEffects {
  shield: boolean;       // Protection contre la capture
  skipNextTurn: boolean; // Passer le prochain tour
  extraTurn: boolean;    // Tour supplémentaire
}

interface GameStoreState {
  game: GameState | null;
  isLoading: boolean;
  error: string | null;
  selectedPawnIndex: number | null;
  highlightedPositions: HighlightedPosition[];
  isAnimating: boolean;
  lastMoveResult: MoveResult | null;
  playerEffects: Record<string, PlayerEffects>;
  currentEdition: EditionId;
}

interface GameStoreActions {
  // Cycle de vie du jeu
  initGame: (mode: GameMode, edition: string, players: Omit<Player, 'tokens' | 'pawns'>[], challengeContext?: ChallengeContext) => void;
  resetGame: () => void;
  endGame: (winnerId: string) => void;

  // Gestion des tours
  rollDice: () => number;
  setDiceValue: (value: number) => void;
  nextTurn: () => void;
  grantExtraTurn: () => void;

  // Actions de jeu
  executeMove: (pawnIndex: number) => MoveResult | null;
  exitHome: (pawnIndex: number) => MoveResult | null;

  // Gestion des tokens
  addTokens: (playerId: string, amount: number) => void;
  removeTokens: (playerId: string, amount: number) => void;

  // Événements
  triggerEvent: (event: GameEvent) => void;
  resolveEvent: () => void;
  generateEvent: (eventType: EventType) => GeneratedGameEvent | null;

  // Effets spéciaux
  applyEffect: (playerId: string, effect: 'shield' | 'extraTurn' | 'skipTurn' | 'retreat' | 'returnBase', value?: number) => void;
  clearEffect: (playerId: string, effect: keyof PlayerEffects) => void;
  hasEffect: (playerId: string, effect: keyof PlayerEffects) => boolean;

  // Captures
  handleCapture: (capturedPlayerId: string, capturedPawnIndex: number) => void;

  // Sélection et surbrillance
  selectPawn: (pawnIndex: number | null) => void;
  setHighlightedPositions: (positions: HighlightedPosition[]) => void;
  clearSelection: () => void;
  setAnimating: (animating: boolean) => void;

  // Helpers de logique
  getValidMoves: () => ValidMove[];
  checkWinCondition: (playerId: string) => boolean;

  // Online multiplayer
  applyRemoteAction: (action: RemoteAction) => void;
  loadFromCheckpoint: (data: CheckpointData) => void;

  // Gestion d'état
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getCurrentPlayer: () => Player | null;
  getPlayerById: (id: string) => Player | null;
  getPlayerByColor: (color: PlayerColor) => Player | null;
  canRollDice: () => boolean;
  canMove: () => boolean;
}

type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  game: null,
  isLoading: false,
  error: null,
  selectedPawnIndex: null,
  highlightedPositions: [],
  isAnimating: false,
  lastMoveResult: null,
  playerEffects: {},
  currentEdition: 'classic',
};

const createDefaultEffects = (): PlayerEffects => ({
  shield: false,
  skipNextTurn: false,
  extraTurn: false,
});

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ===== CYCLE DE VIE =====

      initGame: (mode, edition, players, challengeContext) => {
        const gameId = `game_${Date.now()}`;

        // Configurer l'EventManager avec l'édition
        eventManager.setEdition(edition as EditionId);

        set((state) => {
          state.game = {
            id: gameId,
            mode,
            status: 'playing',
            edition,
            players: players.map((p, index) => ({
              ...p,
              tokens: 0,
              pawns: GameEngine.createInitialPawns(),
              isHost: index === 0,
            })),
            currentPlayerIndex: 0,
            currentTurn: 1,
            diceValue: null,
            diceRolled: false,
            selectedPawnIndex: null,
            pendingEvent: null,
            winner: null,
            challengeContext,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          state.isLoading = false;
          state.error = null;
          state.selectedPawnIndex = null;
          state.highlightedPositions = [];
          state.currentEdition = edition as EditionId;

          // Initialiser les effets pour chaque joueur
          state.playerEffects = {};
          players.forEach((p) => {
            state.playerEffects[p.id] = createDefaultEffects();
          });
        });
      },

      resetGame: () => {
        set((state) => {
          state.game = null;
          state.isLoading = false;
          state.error = null;
          state.selectedPawnIndex = null;
          state.highlightedPositions = [];
          state.lastMoveResult = null;
        });
      },

      endGame: (winnerId) => {
        set((state) => {
          if (state.game) {
            state.game.status = 'finished';
            state.game.winner = winnerId;
            state.game.updatedAt = Date.now();
          }
        });
      },

      // ===== GESTION DES TOURS =====

      rollDice: () => {
        const value = Math.floor(Math.random() * 6) + 1;

        set((state) => {
          if (state.game) {
            state.game.diceValue = value;
            state.game.diceRolled = true;
            state.game.updatedAt = Date.now();
          }
        });

        return value;
      },

      setDiceValue: (value) => {
        set((state) => {
          if (state.game) {
            state.game.diceValue = value;
            state.game.diceRolled = true;
            state.game.updatedAt = Date.now();
          }
        });
      },

      nextTurn: () => {
        const { game, playerEffects } = get();
        if (!game) return;

        const currentPlayer = game.players[game.currentPlayerIndex];

        // Vérifier si le joueur actuel a un tour supplémentaire
        if (currentPlayer && playerEffects[currentPlayer.id]?.extraTurn) {
          // Consommer le tour supplémentaire
          set((state) => {
            if (state.playerEffects[currentPlayer.id]) {
              state.playerEffects[currentPlayer.id]!.extraTurn = false;
            }
            if (state.game) {
              state.game.diceValue = null;
              state.game.diceRolled = false;
              state.game.pendingEvent = null;
              state.game.selectedPawnIndex = null;
              state.game.updatedAt = Date.now();
            }
            state.selectedPawnIndex = null;
            state.highlightedPositions = [];
            state.lastMoveResult = null;
          });
          return;
        }

        set((state) => {
          if (state.game) {
            let nextIndex = (state.game.currentPlayerIndex + 1) % state.game.players.length;

            // Vérifier si le prochain joueur doit passer son tour
            let skipCount = 0;
            while (skipCount < state.game.players.length) {
              const nextPlayer = state.game.players[nextIndex];
              if (nextPlayer && state.playerEffects[nextPlayer.id]?.skipNextTurn) {
                // Consommer le skip
                state.playerEffects[nextPlayer.id]!.skipNextTurn = false;
                nextIndex = (nextIndex + 1) % state.game.players.length;
                skipCount++;
              } else {
                break;
              }
            }

            if (nextIndex === 0 || nextIndex <= state.game.currentPlayerIndex) {
              state.game.currentTurn += 1;
            }

            state.game.currentPlayerIndex = nextIndex;
            state.game.diceValue = null;
            state.game.diceRolled = false;
            state.game.pendingEvent = null;
            state.game.selectedPawnIndex = null;
            state.game.updatedAt = Date.now();
            state.selectedPawnIndex = null;
            state.highlightedPositions = [];
            state.lastMoveResult = null;
          }
        });
      },

      grantExtraTurn: () => {
        set((state) => {
          if (state.game) {
            state.game.diceValue = null;
            state.game.diceRolled = false;
            state.game.pendingEvent = null;
            state.game.selectedPawnIndex = null;
            state.game.updatedAt = Date.now();
            state.selectedPawnIndex = null;
            state.highlightedPositions = [];
            state.lastMoveResult = null;
          }
        });
      },

      // ===== ACTIONS DE JEU =====

      executeMove: (pawnIndex) => {
        console.log('[useGameStore.executeMove] Starting move for pawn:', pawnIndex);
        
        const { game } = get();
        if (!game || game.diceValue === null) {
          console.log('[useGameStore.executeMove] No game or dice value');
          return null;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer) {
          console.log('[useGameStore.executeMove] No current player');
          return null;
        }

        const pawn = currentPlayer.pawns[pawnIndex];
        if (!pawn) {
          console.log('[useGameStore.executeMove] No pawn at index:', pawnIndex);
          return null;
        }

        console.log('[useGameStore.executeMove] Pawn state:', pawn);

        // Sortie de maison
        if (pawn.status === 'home') {
          console.log('[useGameStore.executeMove] Pawn is at home, calling exitHome');
          return get().exitHome(pawnIndex);
        }

        // Mouvement normal
        console.log('[useGameStore.executeMove] Moving pawn on circuit/final');
        const result = GameEngine.movePawn(
          currentPlayer,
          pawnIndex,
          game.diceValue,
          game.players
        );

        console.log('[useGameStore.executeMove] Move result:', {
          canMove: result.canMove,
          newStatus: result.newState?.status,
          newPosition: result.newState && 'position' in result.newState ? result.newState.position : undefined,
          pathLength: result.path?.length,
        });

        if (!result.canMove) {
          console.log('[useGameStore.executeMove] Cannot move');
          return null;
        }

        set((state) => {
          if (state.game) {
            const player = state.game.players[state.game.currentPlayerIndex];
            if (player) {
              player.pawns[pawnIndex] = result.newState;
              state.game.updatedAt = Date.now();
              state.lastMoveResult = result;
              console.log('[useGameStore.executeMove] State updated, lastMoveResult set');
            }
          }
        });

        return result;
      },

      exitHome: (pawnIndex) => {
        console.log('[useGameStore.exitHome] Exiting home for pawn:', pawnIndex);
        
        const { game } = get();
        if (!game || game.diceValue !== 6) {
          console.log('[useGameStore.exitHome] Cannot exit - no 6');
          return null;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer) {
          console.log('[useGameStore.exitHome] No current player');
          return null;
        }

        const result = GameEngine.exitHome(
          currentPlayer,
          pawnIndex,
          game.players
        );

        console.log('[useGameStore.exitHome] Exit result:', {
          canMove: result.canMove,
          newStatus: result.newState?.status,
          newPosition: result.newState && 'position' in result.newState ? result.newState.position : undefined,
          pathLength: result.path?.length,
        });

        if (!result.canMove) {
          console.log('[useGameStore.exitHome] Cannot exit');
          return null;
        }

        set((state) => {
          if (state.game) {
            const player = state.game.players[state.game.currentPlayerIndex];
            if (player) {
              player.pawns[pawnIndex] = result.newState;
              state.game.updatedAt = Date.now();
              state.lastMoveResult = result;
              console.log('[useGameStore.exitHome] State updated');
            }
          }
        });

        return result;
      },

      // ===== GESTION DES TOKENS =====

      addTokens: (playerId, amount) => {
        set((state) => {
          if (state.game) {
            const player = state.game.players.find((p) => p.id === playerId);
            if (player) {
              player.tokens += amount;
              state.game.updatedAt = Date.now();
            }
          }
        });
      },

      removeTokens: (playerId, amount) => {
        set((state) => {
          if (state.game) {
            const player = state.game.players.find((p) => p.id === playerId);
            if (player) {
              player.tokens = Math.max(0, player.tokens - amount);
              state.game.updatedAt = Date.now();
            }
          }
        });
      },

      // ===== ÉVÉNEMENTS =====

      triggerEvent: (event) => {
        set((state) => {
          if (state.game) {
            state.game.pendingEvent = event;
            state.game.updatedAt = Date.now();
          }
        });
      },

      resolveEvent: () => {
        set((state) => {
          if (state.game) {
            state.game.pendingEvent = null;
            state.game.updatedAt = Date.now();
          }
        });
      },

      generateEvent: (eventType) => {
        return eventManager.generateEvent(eventType);
      },

      // ===== EFFETS SPÉCIAUX =====

      applyEffect: (playerId, effect, value = 1) => {
        set((state) => {
          if (!state.playerEffects[playerId]) {
            state.playerEffects[playerId] = createDefaultEffects();
          }

          switch (effect) {
            case 'shield':
              state.playerEffects[playerId]!.shield = true;
              break;

            case 'extraTurn':
              state.playerEffects[playerId]!.extraTurn = true;
              break;

            case 'skipTurn':
              state.playerEffects[playerId]!.skipNextTurn = true;
              break;

            case 'retreat':
              // Reculer le pion actif de X cases
              if (state.game) {
                const player = state.game.players.find((p) => p.id === playerId);
                if (player) {
                  const activePawn = player.pawns.find((p) => p.status === 'circuit');
                  if (activePawn && activePawn.status === 'circuit') {
                    const newPos = Math.max(0, activePawn.position - value);
                    activePawn.position = newPos;
                  }
                }
              }
              break;

            case 'returnBase':
              // Renvoyer un pion à la maison
              if (state.game) {
                const player = state.game.players.find((p) => p.id === playerId);
                if (player) {
                  const pawnOnCircuit = player.pawns.findIndex((p) => p.status === 'circuit');
                  if (pawnOnCircuit !== -1) {
                    // Trouver un slot libre
                    const usedSlots = player.pawns
                      .filter((p): p is Extract<PawnState, { status: 'home' }> => p.status === 'home')
                      .map((p) => p.slotIndex);

                    let freeSlot = 0;
                    while (usedSlots.includes(freeSlot) && freeSlot < 4) {
                      freeSlot++;
                    }

                    player.pawns[pawnOnCircuit] = { status: 'home', slotIndex: freeSlot };
                  }
                }
              }
              break;
          }

          if (state.game) {
            state.game.updatedAt = Date.now();
          }
        });
      },

      clearEffect: (playerId, effect) => {
        set((state) => {
          if (state.playerEffects[playerId]) {
            state.playerEffects[playerId]![effect] = false;
          }
        });
      },

      hasEffect: (playerId, effect) => {
        const { playerEffects } = get();
        return playerEffects[playerId]?.[effect] ?? false;
      },

      // ===== CAPTURES =====

      handleCapture: (capturedPlayerId, capturedPawnIndex) => {
        const { playerEffects } = get();

        // Vérifier si le joueur a un bouclier
        if (playerEffects[capturedPlayerId]?.shield) {
          // Consommer le bouclier et annuler la capture
          set((state) => {
            if (state.playerEffects[capturedPlayerId]) {
              state.playerEffects[capturedPlayerId]!.shield = false;
            }
          });
          return; // La capture est bloquée
        }

        set((state) => {
          if (state.game) {
            const player = state.game.players.find((p) => p.id === capturedPlayerId);
            if (player && player.pawns[capturedPawnIndex]) {
              // Trouver un slot libre à la maison
              const usedSlots = player.pawns
                .filter((p): p is Extract<PawnState, { status: 'home' }> => p.status === 'home')
                .map(p => p.slotIndex);

              let freeSlot = 0;
              while (usedSlots.includes(freeSlot) && freeSlot < 4) {
                freeSlot++;
              }

              player.pawns[capturedPawnIndex] = {
                status: 'home',
                slotIndex: freeSlot,
              };
              state.game.updatedAt = Date.now();
            }
          }
        });
      },

      // ===== SÉLECTION ET SURBRILLANCE =====

      selectPawn: (pawnIndex) => {
        set((state) => {
          state.selectedPawnIndex = pawnIndex;
          if (state.game) {
            state.game.selectedPawnIndex = pawnIndex;
          }
        });
      },

      setHighlightedPositions: (positions) => {
        set((state) => {
          state.highlightedPositions = positions;
        });
      },

      clearSelection: () => {
        set((state) => {
          state.selectedPawnIndex = null;
          state.highlightedPositions = [];
          if (state.game) {
            state.game.selectedPawnIndex = null;
          }
        });
      },

      setAnimating: (animating) => {
        set((state) => {
          state.isAnimating = animating;
        });
      },

      // ===== HELPERS DE LOGIQUE =====

      getValidMoves: () => {
        const { game } = get();
        if (!game || game.diceValue === null) return [];

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer) return [];

        return GameEngine.getValidMoves(currentPlayer, game.diceValue, game.players);
      },

      checkWinCondition: (playerId) => {
        const { game } = get();
        if (!game) return false;

        const player = game.players.find((p) => p.id === playerId);
        if (!player) return false;

        return GameEngine.hasPlayerWon(player);
      },

      // ===== ONLINE MULTIPLAYER =====

      applyRemoteAction: (action) => {
        const { game } = get();
        if (!game) {
          console.log('[useGameStore.applyRemoteAction] Pas de partie, action ignorée:', action.t);
          return;
        }

        console.log('[useGameStore.applyRemoteAction]', action.t, {
          from: action.p,
          currentPlayerIndex: game.currentPlayerIndex,
          currentPlayerId: game.players[game.currentPlayerIndex]?.id,
          diceRolled: game.diceRolled,
          diceValue: game.diceValue,
        });

        switch (action.t) {
          case 'r': {
            // Roll: apply remote dice value
            const value = (action.d as { v: number }).v;
            console.log('[useGameStore.applyRemoteAction] r (roll): valeur', value);
            set((state) => {
              if (state.game) {
                state.game.diceValue = value;
                state.game.diceRolled = true;
                state.game.updatedAt = Date.now();
              }
            });
            break;
          }

          case 'm': {
            // Move: execute the same move locally
            const pawnIndex = (action.d as { i: number }).i;
            console.log('[useGameStore.applyRemoteAction] m (move): pawnIndex', pawnIndex);
            const moveResult = get().executeMove(pawnIndex);
            console.log('[useGameStore.applyRemoteAction] m résultat:', {
              canMove: moveResult?.canMove,
              newStatus: moveResult?.newState?.status,
            });
            break;
          }

          case 'x': {
            // Exit home: execute locally
            const pawnIndex = (action.d as { i: number }).i;
            console.log('[useGameStore.applyRemoteAction] x (exit): pawnIndex', pawnIndex);
            const exitResult = get().exitHome(pawnIndex);
            console.log('[useGameStore.applyRemoteAction] x résultat:', {
              canMove: exitResult?.canMove,
            });
            break;
          }

          case 'e': {
            // Event result: apply tokens
            const data = action.d as { ok?: boolean; r?: number };
            if (data.ok && data.r && data.r > 0) {
              get().addTokens(action.p, data.r);
            } else if (!data.ok && data.r && data.r > 0) {
              get().removeTokens(action.p, data.r);
            }
            get().resolveEvent();
            break;
          }

          case 's': {
            // Skip turn
            get().nextTurn();
            break;
          }

          case 'n': {
            // Next turn (after move completed)
            const data = action.d as { extra?: boolean };
            console.log('[useGameStore.applyRemoteAction] n (nextTurn): extra=', data.extra);
            if (data.extra) {
              get().grantExtraTurn();
            } else {
              get().nextTurn();
            }
            break;
          }

          case 'w': {
            // Win
            const winnerId = (action.d as { winner: string }).winner;
            get().endGame(winnerId);
            break;
          }

          case 'k': {
            // Capture
            const data = action.d as { pid: string; pi: number };
            get().handleCapture(data.pid, data.pi);
            break;
          }

          case 'f': {
            // Forfeit — opponent quit, winner declared
            const winnerId = (action.d as { winner: string }).winner;
            get().endGame(winnerId);
            break;
          }
        }
      },

      loadFromCheckpoint: (data) => {
        set((state) => {
          if (!state.game) return;

          state.game.currentTurn = data.currentTurn;
          state.game.currentPlayerIndex = data.currentPlayerIndex;
          state.game.diceValue = null;
          state.game.diceRolled = false;
          state.game.pendingEvent = null;
          state.game.selectedPawnIndex = null;
          state.game.updatedAt = Date.now();
          state.selectedPawnIndex = null;
          state.highlightedPositions = [];
          state.lastMoveResult = null;

          // Restore pawns and tokens for each player
          for (const player of state.game.players) {
            const savedPawns = data.pawns[player.id];
            if (savedPawns) {
              player.pawns = savedPawns;
            }
            const savedTokens = data.tokens[player.id];
            if (savedTokens !== undefined) {
              player.tokens = savedTokens;
            }
          }
        });
      },

      // ===== GESTION D'ÉTAT =====

      setLoading: (isLoading) => {
        set((state) => {
          state.isLoading = isLoading;
        });
      },

      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      // ===== GETTERS =====

      getCurrentPlayer: () => {
        const { game } = get();
        if (!game) return null;
        return game.players[game.currentPlayerIndex] ?? null;
      },

      getPlayerById: (id) => {
        const { game } = get();
        if (!game) return null;
        return game.players.find((p) => p.id === id) ?? null;
      },

      getPlayerByColor: (color) => {
        const { game } = get();
        if (!game) return null;
        return game.players.find((p) => p.color === color) ?? null;
      },

      canRollDice: () => {
        const { game, isAnimating } = get();
        if (!game) return false;
        return (
          game.status === 'playing' &&
          !game.diceRolled &&
          !game.pendingEvent &&
          !isAnimating
        );
      },

      canMove: () => {
        const { game, isAnimating } = get();
        if (!game) return false;
        return (
          game.status === 'playing' &&
          game.diceRolled &&
          !game.pendingEvent &&
          !isAnimating
        );
      },
    }))
  )
);
