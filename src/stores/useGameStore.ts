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
import type { GameState, GameMode, Player, GameEvent, PlayerColor, PawnState, EventType, ChallengeContext, ProgramGameContext, JokerType } from '@/types';
import { newJokerId } from '@/data/jokers';
import { GameEngine, type MoveResult, type ValidMove } from '@/services/game/GameEngine';
import { eventManager, type GeneratedGameEvent } from '@/services/game/EventManager';
import type { EditionId } from '@/data';
import type { CheckpointData } from '@/utils/onlineCodec';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useProgramStore } from '@/stores/useProgramStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { MAX_TOKENS } from '@/config/boardConfig';
import { gameLog } from '@/utils/gameLog';
import { resetDuelQuestionPool } from '@/data/duelQuestions';
import { resetJokerPool, markJokerUsed } from '@/data/jokers';

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
  /**
   * Pari « Investissement » en attente de résolution.
   * stake = mise (1 ou 2), déjà débitée. tokensAtStart = jetons du joueur
   * au début de son prochain tour (null tant que ce tour n'a pas commencé).
   * À la fin de ce tour : bilan > 0 → +2×stake ; sinon mise perdue.
   */
  pendingInvestment?: { stake: number; tokensAtStart: number | null };
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
  initGame: (mode: GameMode, edition: string, players: Omit<Player, 'tokens' | 'pawns'>[], gameContext?: ChallengeContext | ProgramGameContext) => void;
  resetGame: () => void;
  endGame: (winnerId: string) => void;

  // Forfait (online)
  forfeitPlayer: (playerId: string) => void;

  /**
   * Marque un joueur comme ayant terminé (atteint l'arrivée).
   * Lui assigne un rank, l'ajoute au ranking[], et décide si la partie continue ou se termine.
   * Retourne true si la partie continue (le joueur courant doit nextTurn), false si la partie est finie.
   */
  finishPlayer: (playerId: string) => boolean;

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
  clearEffect: (playerId: string, effect: 'shield' | 'skipNextTurn' | 'extraTurn') => void;
  hasEffect: (playerId: string, effect: 'shield' | 'skipNextTurn' | 'extraTurn') => boolean;

  // Joker « Investissement » (pari différé)
  /** Pose le pari : la mise a déjà été débitée par l'appelant. */
  startInvestment: (playerId: string, stake: number) => void;
  /** Capture les jetons du joueur au début de son prochain tour (1× max). */
  markInvestmentTurnStart: (playerId: string) => void;
  /** Résout le pari à la fin du tour. Retourne le résultat, ou null si aucun pari. */
  resolveInvestment: (playerId: string) => { stake: number; won: boolean; gain: number } | null;

  // Captures
  handleCapture: (capturedPlayerId: string, capturedPawnIndex: number) => void;

  // Jokers (inventaire)
  grantJoker: (playerId: string, jokerType: JokerType, id?: string) => string;
  consumeJoker: (playerId: string, jokerId: string) => void;

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

      initGame: (mode, edition, players, gameContext) => {
        const gameId = `game_${Date.now()}`;
        const programContext =
          gameContext && 'origin' in gameContext && gameContext.origin === 'program'
            ? gameContext
            : undefined;
        const challengeContext = programContext ? undefined : gameContext as ChallengeContext | undefined;

        // Configurer l'EventManager avec l'édition
        eventManager.setEdition(edition as EditionId);

        // Langue d'affichage du contenu = préférence du joueur (réglages app).
        // S'applique à TOUT le contenu : éditions (local/online/quick match) ET programmes.
        eventManager.setLanguage(useSettingsStore.getState().language);

        // Reset du pool de questions de duel (évite les doublons entre parties)
        resetDuelQuestionPool();

        // Reset du pool de jokers (évite les doublons entre parties)
        resetJokerPool();

        // Si mode programme, charger le contenu du programme. Sinon garder le legacy challenge.
        eventManager.clearContentPack();
        if (programContext) {
          const program = useProgramStore.getState().getProgramById(programContext.programId);

          // Contenu commun (par id de pack, sinon par index du niveau joué).
          const commonPack =
            (programContext.contentPackId
              ? program?.contentPacks.find((pack) => pack.id === programContext.contentPackId)
              : undefined)
            ?? program?.contentPacks[programContext.levelIndex]
            ?? program?.contentPacks[0];

          // Contenu propre au persona : on cible le MÊME niveau que le pack commun joué.
          // On matche par levelTier (fiable) ; à défaut de levelTier, on retombe sur l'index.
          const profile = programContext.profileId
            ? program?.profiles?.find((pr) => pr.id === programContext.profileId)
            : undefined;
          const personaPack = profile?.contentPacks
            ? (commonPack?.levelTier
                ? profile.contentPacks.find((p) => p.levelTier === commonPack.levelTier)
                : profile.contentPacks[programContext.levelIndex])
            : undefined;
          const personaHasContent =
            !!personaPack &&
            (personaPack.quizzes.length +
              personaPack.duels.length +
              personaPack.fundings.length +
              personaPack.opportunities.length +
              personaPack.challengeEvents.length) > 0;

          const contentPack = personaHasContent ? personaPack : commonPack;
          if (personaHasContent) {
            gameLog('store', '[GameStore] Using persona-specific content pack:', programContext.profileId);
          }

          if (contentPack) {
            // La langue est déjà appliquée globalement via eventManager.setLanguage ci-dessus.
            eventManager.setContentPack({
              quizzes: contentPack.quizzes,
              duels: contentPack.duels,
              fundings: contentPack.fundings,
              opportunities: contentPack.opportunities,
              challengeEvents: contentPack.challengeEvents,
            });
            gameLog('store', '[GameStore] Program content loaded into EventManager:', programContext.programId);
          } else {
            gameLog('store', '[GameStore] Program content not found, using edition fallback:', programContext.programId);
          }
        }

        if (challengeContext) {
          const { challenges } = useChallengeStore.getState();
          gameLog('store', '[GameStore] Challenge mode, challenges in store:', challenges.length);
          const challenge = challenges.find((c) => c.id === challengeContext.challengeId);
          if (challenge) {
            const level = challenge.levels.find((l) => l.number === challengeContext.levelNumber);
            const subLevel = level?.subLevels.find((s) => s.number === challengeContext.subLevelNumber);
            gameLog('store', '[GameStore] SubLevel found:', subLevel?.name, 'quizzes:', subLevel?.quizzes?.length ?? 0, 'duels:', subLevel?.duels?.length ?? 0);
            if (subLevel) {
              // Filter content by sector: keep items without sectorId (generic) + items matching player's sector
              const sectorId = challengeContext.sectorId;
              const filterBySector = <T extends { sectorId?: string }>(items: T[] | undefined): T[] => {
                if (!items) return [];
                if (!sectorId) return items; // No sector selected → show all
                return items.filter(item => !item.sectorId || item.sectorId === sectorId);
              };

              const filteredContent = {
                quizzes: filterBySector(subLevel.quizzes),
                duels: filterBySector(subLevel.duels),
                fundings: filterBySector(subLevel.fundings),
                opportunities: filterBySector(subLevel.opportunities),
                challengeEvents: filterBySector(subLevel.challengeEvents),
              };

              const hasContent = filteredContent.quizzes.length || filteredContent.duels.length ||
                filteredContent.fundings.length || filteredContent.opportunities.length || filteredContent.challengeEvents.length;

              if (hasContent) {
                eventManager.setSubLevelContent(filteredContent);
                gameLog('store', '[GameStore] SubLevel content loaded into EventManager (filtered by sector:', sectorId || 'none', ')');
              } else {
                gameLog('store', '[GameStore] SubLevel has no content after sector filtering, using edition fallback');
              }
            }
          } else {
            gameLog('store', '[GameStore] Challenge not found in store:', challengeContext.challengeId);
          }
        }

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
              jokers: [{ id: newJokerId(), type: 'dice_choice', acquiredAt: Date.now() }],
              isHost: index === 0,
              // Conserver l'édition du joueur (online) ou fallback sur édition globale
              edition: p.edition || edition,
              sector: p.sector,
            })),
            currentPlayerIndex: 0,
            currentTurn: 1,
            diceValue: null,
            diceRolled: false,
            selectedPawnIndex: null,
            pendingEvent: null,
            winner: null,
            ranking: [],
            challengeContext,
            programContext,
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
        eventManager.clearSubLevelContent();
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

      forfeitPlayer: (playerId) => {
        const { game } = get();
        if (!game) return;

        const target = game.players.find((p) => p.id === playerId);
        if (!target || target.isForfeited) return;

        const wasCurrentPlayer = game.players[game.currentPlayerIndex]?.id === playerId;

        set((state) => {
          if (!state.game) return;
          const player = state.game.players.find((p) => p.id === playerId);
          if (!player || player.isForfeited) return;
          player.isForfeited = true;
          player.forfeitedAt = Date.now();
          state.game.updatedAt = Date.now();
        });

        // "Actifs" = pas forfait ET pas déjà classés (rank non défini)
        const remainingActive =
          get().game?.players.filter((p) => !p.isForfeited && p.rank === undefined) ?? [];

        if (remainingActive.length <= 1) {
          // Plus qu'un actif (ou zéro) → fin de partie.
          // Le dernier actif (s'il existe) est classé en dernier.
          const last = remainingActive[0];
          if (last) {
            get().finishPlayer(last.id);
          } else {
            // Aucun actif restant (tous forfait/finis) → fin sans plus rien à faire.
            const ranking = get().game?.ranking ?? [];
            const winner = ranking[0] ?? null;
            if (winner) get().endGame(winner);
          }
          return;
        }

        if (wasCurrentPlayer) {
          get().nextTurn();
        }
      },

      finishPlayer: (playerId) => {
        const { game } = get();
        if (!game) return false;

        const target = game.players.find((p) => p.id === playerId);
        if (!target || target.rank !== undefined || target.isForfeited) {
          // Déjà classé ou forfait : rien à faire
          return game.status !== 'finished';
        }

        // Calculer le rank = nombre de joueurs déjà classés + 1
        const alreadyFinished = game.players.filter((p) => p.rank !== undefined).length;
        const newRank = alreadyFinished + 1;

        set((state) => {
          if (!state.game) return;
          const player = state.game.players.find((p) => p.id === playerId);
          if (!player) return;
          player.rank = newRank;
          player.finishedAt = Date.now();
          if (!state.game.ranking) state.game.ranking = [];
          state.game.ranking.push(playerId);
          state.game.updatedAt = Date.now();
        });

        // Le 1er à finir devient winner
        if (newRank === 1) {
          set((state) => {
            if (state.game) state.game.winner = playerId;
          });
        }

        // Combien d'actifs restants (pas forfait ET pas classés) ?
        const remainingActive =
          get().game?.players.filter((p) => !p.isForfeited && p.rank === undefined) ?? [];

        // Mode 2 joueurs : dès qu'un finit, partie close (comportement actuel)
        const totalPlayers = game.players.length;
        if (totalPlayers <= 2) {
          get().endGame(playerId);
          return false;
        }

        // 3+ joueurs : on continue tant qu'il reste ≥ 2 actifs
        if (remainingActive.length >= 2) {
          return true;
        }

        // Plus qu'un actif (ou zéro) → classer le dernier et clôturer
        if (remainingActive.length === 1) {
          const last = remainingActive[0]!;
          const lastRank = newRank + 1;
          set((state) => {
            if (!state.game) return;
            const player = state.game.players.find((p) => p.id === last.id);
            if (!player) return;
            player.rank = lastRank;
            player.finishedAt = Date.now();
            if (!state.game.ranking) state.game.ranking = [];
            state.game.ranking.push(last.id);
            state.game.updatedAt = Date.now();
          });
        }

        const finalWinner = get().game?.ranking?.[0] ?? playerId;
        get().endGame(finalWinner);
        return false;
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

            // Vérifier si le prochain joueur doit passer son tour (skip ou forfait ou déjà classé)
            let skipCount = 0;
            while (skipCount < state.game.players.length) {
              const nextPlayer = state.game.players[nextIndex];
              if (nextPlayer && (nextPlayer.isForfeited || nextPlayer.rank !== undefined)) {
                // Skip silencieux des joueurs forfait ou déjà arrivés (rank défini)
                nextIndex = (nextIndex + 1) % state.game.players.length;
                skipCount++;
              } else if (nextPlayer && state.playerEffects[nextPlayer.id]?.skipNextTurn) {
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
        gameLog('store', '[useGameStore.executeMove] Starting move for pawn:', pawnIndex);
        
        const { game } = get();
        if (!game || game.diceValue === null) {
          gameLog('store', '[useGameStore.executeMove] No game or dice value');
          return null;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer) {
          gameLog('store', '[useGameStore.executeMove] No current player');
          return null;
        }

        const pawn = currentPlayer.pawns[pawnIndex];
        if (!pawn) {
          gameLog('store', '[useGameStore.executeMove] No pawn at index:', pawnIndex);
          return null;
        }

        gameLog('store', '[useGameStore.executeMove] Pawn state:', pawn);

        // Sortie de maison
        if (pawn.status === 'home') {
          gameLog('store', '[useGameStore.executeMove] Pawn is at home, calling exitHome');
          return get().exitHome(pawnIndex);
        }

        // Mouvement normal
        gameLog('store', '[useGameStore.executeMove] Moving pawn on circuit/final');
        const result = GameEngine.movePawn(
          currentPlayer,
          pawnIndex,
          game.diceValue,
          game.players
        );

        gameLog('store', '[useGameStore.executeMove] Move result:', {
          canMove: result.canMove,
          newStatus: result.newState?.status,
          newPosition: result.newState && 'position' in result.newState ? result.newState.position : undefined,
          pathLength: result.path?.length,
          triggeredEvent: result.triggeredEvent || 'none',
        });

        if (!result.canMove) {
          gameLog('store', '[useGameStore.executeMove] Cannot move');
          return null;
        }

        set((state) => {
          if (state.game) {
            const player = state.game.players[state.game.currentPlayerIndex];
            if (player) {
              player.pawns[pawnIndex] = result.newState;
              state.game.updatedAt = Date.now();
              state.lastMoveResult = result;
              gameLog('store', '[useGameStore.executeMove] State updated, lastMoveResult set');
            }
          }
        });

        return result;
      },

      exitHome: (pawnIndex) => {
        gameLog('store', '[useGameStore.exitHome] Exiting home for pawn:', pawnIndex);
        
        const { game } = get();
        if (!game || game.diceValue !== 6) {
          gameLog('store', '[useGameStore.exitHome] Cannot exit - no 6');
          return null;
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (!currentPlayer) {
          gameLog('store', '[useGameStore.exitHome] No current player');
          return null;
        }

        const result = GameEngine.exitHome(
          currentPlayer,
          pawnIndex,
          game.players
        );

        gameLog('store', '[useGameStore.exitHome] Exit result:', {
          canMove: result.canMove,
          newStatus: result.newState?.status,
          newPosition: result.newState && 'position' in result.newState ? result.newState.position : undefined,
          pathLength: result.path?.length,
        });

        if (!result.canMove) {
          gameLog('store', '[useGameStore.exitHome] Cannot exit');
          return null;
        }

        set((state) => {
          if (state.game) {
            const player = state.game.players[state.game.currentPlayerIndex];
            if (player) {
              player.pawns[pawnIndex] = result.newState;
              state.game.updatedAt = Date.now();
              state.lastMoveResult = result;
              gameLog('store', '[useGameStore.exitHome] State updated');
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
              player.tokens = Math.min(MAX_TOKENS, player.tokens + amount);
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

      // ===== JOKER INVESTISSEMENT (pari différé) =====

      startInvestment: (playerId, stake) => {
        set((state) => {
          if (!state.playerEffects[playerId]) {
            state.playerEffects[playerId] = createDefaultEffects();
          }
          // tokensAtStart = null : sera capturé au début du prochain tour du joueur.
          state.playerEffects[playerId]!.pendingInvestment = { stake, tokensAtStart: null };
        });
      },

      markInvestmentTurnStart: (playerId) => {
        const { game, playerEffects } = get();
        const inv = playerEffects[playerId]?.pendingInvestment;
        if (!inv || inv.tokensAtStart !== null) return; // déjà capturé ou pas de pari
        const player = game?.players.find((p) => p.id === playerId);
        const tokens = player?.tokens ?? 0;
        set((state) => {
          const e = state.playerEffects[playerId]?.pendingInvestment;
          if (e) e.tokensAtStart = tokens;
        });
      },

      resolveInvestment: (playerId) => {
        const { game, playerEffects } = get();
        const inv = playerEffects[playerId]?.pendingInvestment;
        if (!inv) return null;
        // Si le tour n'a jamais démarré (tokensAtStart null), on prend les jetons actuels
        // comme référence → bilan 0 → pari perdu (cas limite : partie finie avant de rejouer).
        const start = inv.tokensAtStart ?? (game?.players.find((p) => p.id === playerId)?.tokens ?? 0);
        const end = game?.players.find((p) => p.id === playerId)?.tokens ?? 0;
        const won = end - start > 0;
        const gain = won ? inv.stake * 2 : 0;

        set((state) => {
          const e = state.playerEffects[playerId];
          if (e) e.pendingInvestment = undefined;
        });

        if (gain > 0) {
          get().addTokens(playerId, gain);
        }
        return { stake: inv.stake, won, gain };
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

      // ===== JOKERS =====

      grantJoker: (playerId, jokerType, id) => {
        const jokerId = id ?? newJokerId();
        // Synchronise l'historique anti-répétition des jokers (couvre local + online :
        // toute attribution, y compris via applyRemoteAction, passe ici).
        markJokerUsed(jokerType);
        set((state) => {
          if (!state.game) return;
          const player = state.game.players.find((p) => p.id === playerId);
          if (!player) return;
          if (!player.jokers) player.jokers = [];
          player.jokers.push({
            id: jokerId,
            type: jokerType,
            acquiredAt: Date.now(),
          });
          state.game.updatedAt = Date.now();
        });
        return jokerId;
      },

      consumeJoker: (playerId, jokerId) => {
        set((state) => {
          if (!state.game) return;
          const player = state.game.players.find((p) => p.id === playerId);
          if (!player?.jokers) return;
          player.jokers = player.jokers.filter((j) => j.id !== jokerId);
          state.game.updatedAt = Date.now();
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
          gameLog('store', '[useGameStore.applyRemoteAction] Pas de partie, action ignorée:', action.t);
          return;
        }

        gameLog('store', '[useGameStore.applyRemoteAction]', action.t, {
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
            gameLog('store', '[useGameStore.applyRemoteAction] r (roll): valeur', value);
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
            gameLog('store', '[useGameStore.applyRemoteAction] m (move): pawnIndex', pawnIndex);
            const moveResult = get().executeMove(pawnIndex);
            gameLog('store', '[useGameStore.applyRemoteAction] m résultat:', {
              canMove: moveResult?.canMove,
              newStatus: moveResult?.newState?.status,
            });
            break;
          }

          case 'x': {
            // Exit home: execute locally
            const pawnIndex = (action.d as { i: number }).i;
            gameLog('store', '[useGameStore.applyRemoteAction] x (exit): pawnIndex', pawnIndex);
            const exitResult = get().exitHome(pawnIndex);
            gameLog('store', '[useGameStore.applyRemoteAction] x résultat:', {
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
            gameLog('store', '[useGameStore.applyRemoteAction] n (nextTurn): extra=', data.extra);
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
            // Capture: renvoi du pion à la base
            const data = action.d as { pid: string; pi: number };
            get().handleCapture(data.pid, data.pi);
            break;
          }

          case 'ks': {
            // Capture steal: voler les jetons du pion capturé
            const data = action.d as { pid: string; amount: number };
            if (data.amount > 0) {
              get().removeTokens(data.pid, data.amount);
              get().addTokens(action.p, data.amount);
            }
            break;
          }

          case 'jg': {
            // Joker granted: ajouter un joker à l'inventaire du joueur
            const data = action.d as { pid: string; type: JokerType; id: string };
            get().grantJoker(data.pid, data.type, data.id);
            break;
          }

          case 'ju': {
            // Joker used: retirer le joker + appliquer l'effet spécifique
            const data = action.d as {
              pid: string;
              id: string;
              type: JokerType;
              shieldTarget?: string;
              stealTarget?: string;
              stealAmount?: number;
              stake?: number;
            };
            get().consumeJoker(data.pid, data.id);

            // Appliquer l'effet côté store selon le type
            if (data.type === 'shield' && data.shieldTarget) {
              get().applyEffect(data.shieldTarget, 'shield');
            } else if (data.type === 'steal' && data.stealTarget && data.stealAmount && data.stealAmount > 0) {
              get().removeTokens(data.stealTarget, data.stealAmount);
              get().addTokens(data.pid, data.stealAmount);
            } else if (data.type === 'investment' && data.stake && data.stake > 0) {
              // Pose le pari sur les autres clients : débit + effet différé.
              // La résolution se fera localement à la fin du tour du joueur concerné.
              get().removeTokens(data.pid, data.stake);
              get().startInvestment(data.pid, data.stake);
            }
            // 'dice_choice' et 'reroll' : la valeur sera broadcastée via 'r' au lancer
            break;
          }

          case 'f': {
            // Forfeit — opponent quit, winner declared
            const winnerId = (action.d as { winner: string }).winner;
            get().endGame(winnerId);
            break;
          }

          case 'pf': {
            // Player forfeit — un joueur déconnecté définitivement, on l'éjecte
            const data = action.d as { pid: string };
            if (data.pid) {
              get().forfeitPlayer(data.pid);
            }
            break;
          }

          case 'pfin': {
            // Player finished — un joueur a terminé son pion (arrivée).
            // En multi 3+ joueurs : assigne un rank, partie continue si actifs restants.
            // En 2 joueurs : finishPlayer déclenche endGame directement.
            const data = action.d as { pid: string };
            if (data.pid) {
              get().finishPlayer(data.pid);
            }
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
