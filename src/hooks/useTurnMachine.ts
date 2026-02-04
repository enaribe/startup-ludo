/**
 * useTurnMachine — State machine for turn management
 *
 * Replaces scattered callbacks/effects/refs with a single useReducer-based
 * state machine. Each action is phase-guarded: if the current phase doesn't
 * match, the action is a no-op. This eliminates all double-fire bugs.
 *
 * Phases: idle → rolling → moving → event → ending → idle
 */

import type { MoveResult, ValidMove } from '@/services/game/GameEngine';
import type { GameState, Player } from '@/types';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

// ===== CONSTANTS =====

const PAWN_STEP_MS = 80;

// ===== TYPES =====

export type TurnPhase = 'idle' | 'rolling' | 'moving' | 'event' | 'ending';

export interface TurnState {
  phase: TurnPhase;
  diceValue: number | null;
  isRolling: boolean;
  rolledSix: boolean;
  moveResult: MoveResult | null;
}

type TurnAction =
  | { type: 'ROLL_START'; value: number }
  | { type: 'ROLL_COMPLETE'; value: number }
  | { type: 'MOVE_COMPLETE'; result: MoveResult | null; rolledSix: boolean }
  | { type: 'EVENT_SHOWN' }
  | { type: 'EVENT_RESOLVED' }
  | { type: 'TURN_ENDED' }
  | { type: 'NO_VALID_MOVE' }
  | { type: 'RESET' };

/** Unified action interface — resolves online/local split once */
export interface TurnActions {
  rollDice: () => number;
  executeMove: (pawnIndex: number) => MoveResult | null;
  exitHome: (pawnIndex: number) => MoveResult | null;
  nextTurn: () => void;
  grantExtraTurn: () => void;
  handleCapture: (capturedPlayerId: string, capturedPawnIndex: number) => void;
  endGame: (winnerId: string) => void;
  resolveEvent: (result: { ok: boolean; reward: number }) => void;
  broadcastEvent: (eventType: string, eventData: Record<string, unknown>) => void;
  getValidMoves: () => ValidMove[];
  checkWinCondition: (playerId: string) => boolean;
}

export interface UseTurnMachineParams {
  game: GameState | null;
  currentPlayer: Player | null;
  isOnline: boolean;
  userId: string | null;
  actions: TurnActions;
  onEvent: (eventType: string) => void;
  onWin: (playerId: string) => void;
  hapticsEnabled: boolean;
  setAnimating: (v: boolean) => void;
  clearSelection: () => void;
  /** Whether the online game considers it my turn (for dice disable) */
  isMyTurnOnline?: boolean;
}

export interface UseTurnMachineReturn {
  turnState: TurnState;
  dispatch: React.Dispatch<TurnAction>;
  diceProps: {
    onRoll: () => number;
    onDiceComplete: (value: number) => void;
  };
  handleEventResolve: () => void;
}

// ===== INITIAL STATE =====

const initialTurnState: TurnState = {
  phase: 'idle',
  diceValue: null,
  isRolling: false,
  rolledSix: false,
  moveResult: null,
};

// ===== REDUCER =====

export function turnReducer(state: TurnState, action: TurnAction): TurnState {
  switch (action.type) {
    case 'ROLL_START': {
      if (state.phase !== 'idle') return state;
      return {
        ...state,
        phase: 'rolling',
        diceValue: action.value,
        isRolling: true,
        rolledSix: false,
        moveResult: null,
      };
    }

    case 'ROLL_COMPLETE': {
      if (state.phase !== 'rolling') return state;
      return {
        ...state,
        phase: 'moving',
        isRolling: false,
        rolledSix: action.value === 6,
      };
    }

    case 'MOVE_COMPLETE': {
      if (state.phase !== 'moving') return state;

      const { result, rolledSix } = action;

      // On a 6: ignore any triggered event — extra turn takes priority
      // On non-6: show event popup immediately before ending the turn
      if (result?.triggeredEvent && !rolledSix) {
        return {
          ...state,
          phase: 'event',
          moveResult: result,
          rolledSix,
        };
      }

      return {
        ...state,
        phase: 'ending',
        moveResult: result,
        rolledSix,
      };
    }

    case 'EVENT_SHOWN': {
      // Already in event phase from MOVE_COMPLETE or TURN_ENDED
      return state;
    }

    case 'EVENT_RESOLVED': {
      if (state.phase !== 'event') return state;
      return {
        ...state,
        phase: 'ending',
      };
    }

    case 'TURN_ENDED': {
      if (state.phase !== 'ending') return state;

      // Extra turn on 6: only if a move was actually executed (moveResult !== null)
      // and the pawn didn't finish. Rolling 6 with no valid move → no extra turn.
      const earnedExtraTurn =
        state.rolledSix &&
        state.moveResult !== null &&
        !state.moveResult.isFinished;

      if (earnedExtraTurn) {
        // Reset to idle for same player — ready for extra turn
        return { ...initialTurnState };
      }

      // Normal end
      return { ...initialTurnState };
    }

    case 'NO_VALID_MOVE': {
      if (state.phase !== 'moving') return state;
      return {
        ...state,
        phase: 'ending',
        moveResult: null,
      };
    }

    case 'RESET': {
      return { ...initialTurnState };
    }

    default:
      return state;
  }
}

// ===== TIMER MAP =====

function useTimerMap() {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const set = useCallback((key: string, fn: () => void, delay: number) => {
    // Clear existing timer with this key
    const existing = timers.current.get(key);
    if (existing) clearTimeout(existing);
    timers.current.set(key, setTimeout(fn, delay));
  }, []);

  const clear = useCallback((key: string) => {
    const t = timers.current.get(key);
    if (t) {
      clearTimeout(t);
      timers.current.delete(key);
    }
  }, []);

  const clearAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => () => clearAll(), [clearAll]);

  return { set, clear, clearAll };
}

// ===== MAIN HOOK =====

export function useTurnMachine(params: UseTurnMachineParams): UseTurnMachineReturn {
  const {
    game,
    currentPlayer,
    actions,
    onEvent,
    onWin,
    hapticsEnabled,
    setAnimating,
    clearSelection,
  } = params;

  const [turnState, dispatch] = useReducer(turnReducer, initialTurnState);
  const timers = useTimerMap();

  // Keep fresh refs to avoid stale closures in timer callbacks
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;
  const turnStateRef = useRef(turnState);
  turnStateRef.current = turnState;
  const currentPlayerRef = useRef(currentPlayer);
  currentPlayerRef.current = currentPlayer;
  const gameRef = useRef(game);
  gameRef.current = game;

  // Track the player id whose turn the machine is currently managing.
  // When this changes, we know the turn switched to a different player.
  const activePlayerIdRef = useRef<string | null>(null);

  // ===== DICE PROPS =====

  const onRoll = useCallback((): number => {
    if (turnStateRef.current.phase !== 'idle') return 0;
    if (!gameRef.current || gameRef.current.status !== 'playing') return 0;
    if (gameRef.current.pendingEvent) return 0;
    // Guard: only the current player's human can roll
    if (!currentPlayerRef.current) return 0;
    if (currentPlayerRef.current.isAI) return 0;

    const value = actionsRef.current.rollDice();
    dispatch({ type: 'ROLL_START', value });

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    return value;
  }, [hapticsEnabled]);

  const onDiceComplete = useCallback((value: number) => {
    // Phase guard: if already past rolling, this is a no-op (fixes double-fire)
    console.log('[useTurnMachine] onDiceComplete → phase moving', { value });
    dispatch({ type: 'ROLL_COMPLETE', value });

    if (value === 6 && hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [hapticsEnabled]);

  const diceProps = useMemo(
    () => ({ onRoll, onDiceComplete }),
    [onRoll, onDiceComplete]
  );

  // ===== EVENT RESOLVE =====

  const handleEventResolve = useCallback(() => {
    dispatch({ type: 'EVENT_RESOLVED' });
  }, []);

  // ===== EFFECT: Phase 'moving' → auto-execute move =====

  useEffect(() => {
    if (turnState.phase !== 'moving') return;
    if (!game || !currentPlayer) return;

    const moves = actions.getValidMoves();
    console.log('[useTurnMachine] Phase moving: coups valides', {
      count: moves.length,
      moves: moves.map((m) => ({ type: m.type, pawnIndex: m.pawnIndex })),
      currentPlayerId: currentPlayer.id,
      diceValue: game.diceValue,
      diceRolled: game.diceRolled,
    });

    if (moves.length === 0) {
      console.log('[useTurnMachine] Aucun coup valide → fin de tour (noMove)');
      // No valid moves — skip turn after short delay
      timers.set('noMove', () => {
        dispatch({ type: 'NO_VALID_MOVE' });
      }, 1500);
      return;
    }

    const move = moves[0]!;
    setAnimating(true);
    console.log('[useTurnMachine] Exécution auto du premier coup:', move.type, 'pawnIndex', move.pawnIndex);

    timers.set('autoMove', () => {
      const rolledSix = turnState.rolledSix;
      let result: MoveResult | null = null;

      if (move.type === 'exit') {
        result = actions.exitHome(move.pawnIndex);
        console.log('[useTurnMachine] exitHome résultat:', {
          canMove: result?.canMove,
          pathLength: result?.path?.length,
        });
      } else {
        result = actions.executeMove(move.pawnIndex);
        console.log('[useTurnMachine] executeMove résultat:', {
          canMove: result?.canMove,
          newStatus: result?.newState?.status,
          pathLength: result?.path?.length,
          triggeredEvent: result?.triggeredEvent || 'none',
        });
      }

      if (result) {
        // Calculate animation delay
        const animDelay = result.path?.length
          ? result.path.length * PAWN_STEP_MS + 150
          : 400;

        // Handle capture after animation
        if (result.capturedPawn) {
          timers.set('capture', () => {
            actionsRef.current.handleCapture(
              result!.capturedPawn!.playerId,
              result!.capturedPawn!.pawnIndex
            );
            if (hapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }, animDelay);
        }

        // Handle win check
        if (result.isFinished) {
          timers.set('winCheck', () => {
            if (currentPlayerRef.current && actionsRef.current.checkWinCondition(currentPlayerRef.current.id)) {
              onWinRef.current(currentPlayerRef.current.id);
            }
            setAnimating(false);
          }, animDelay);
          // Still dispatch MOVE_COMPLETE to update state
          timers.set('moveComplete', () => {
            dispatch({ type: 'MOVE_COMPLETE', result: result!, rolledSix });
          }, animDelay);
          return;
        }

        // Dispatch move complete after animation
        timers.set('moveComplete', () => {
          setAnimating(false);
          dispatch({ type: 'MOVE_COMPLETE', result: result!, rolledSix });
        }, animDelay);
      } else {
        // Move returned null (shouldn't happen but be safe)
        console.warn('[useTurnMachine] executeMove/exitHome a retourné null');
        setAnimating(false);
        dispatch({ type: 'NO_VALID_MOVE' });
      }
    }, 500);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnState.phase]);

  // ===== EFFECT: Phase 'event' → trigger event popup =====

  useEffect(() => {
    if (turnState.phase !== 'event') return;
    if (!currentPlayer) return;

    const eventType = turnState.moveResult?.triggeredEvent;
    if (eventType) {
      onEventRef.current(eventType);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnState.phase]);

  // ===== EFFECT: Phase 'ending' → grant extra turn or next turn =====

  useEffect(() => {
    if (turnState.phase !== 'ending') return;

    timers.set('endTurn', () => {
      const state = turnStateRef.current;

      // Extra turn on 6: only if a move was actually made (moveResult !== null)
      // and the pawn didn't finish. No valid move on 6 → no extra turn.
      if (state.rolledSix && state.moveResult && !state.moveResult.isFinished) {
        actionsRef.current.grantExtraTurn();
        clearSelection();
        setAnimating(false);
        dispatch({ type: 'TURN_ENDED' });
        return;
      }

      // Normal end: advance to next player
      actionsRef.current.nextTurn();
      clearSelection();
      setAnimating(false);
      dispatch({ type: 'TURN_ENDED' });
    }, 300);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnState.phase]);

  // ===== EFFECT: Detect active player change → reset machine =====
  // When the current player changes (new player's turn), reset the
  // turn machine so the new player starts fresh in idle.

  useEffect(() => {
    const playerId = currentPlayer?.id ?? null;

    // First mount — just record
    if (activePlayerIdRef.current === null) {
      activePlayerIdRef.current = playerId;
      return;
    }

    // Same player (e.g. extra turn on 6) — no reset needed
    if (playerId === activePlayerIdRef.current) return;

    // Player changed — reset machine for the new player
    activePlayerIdRef.current = playerId;
    timers.clearAll();
    dispatch({ type: 'RESET' });
    setAnimating(false);
    clearSelection();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer?.id]);

  // ===== EFFECT: AI auto-play =====

  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    if (!currentPlayer?.isAI) return;
    if (turnState.phase !== 'idle') return;
    if (game.pendingEvent) return;
    if (game.diceRolled) return;

    timers.set('aiRoll', () => {
      // Double-check: still AI's turn and still idle?
      if (!currentPlayerRef.current?.isAI) return;
      if (turnStateRef.current.phase !== 'idle') return;

      const value = actionsRef.current.rollDice();
      if (value > 0) {
        dispatch({ type: 'ROLL_START', value });

        // Simulate dice animation time, then complete
        timers.set('aiRollComplete', () => {
          dispatch({ type: 'ROLL_COMPLETE', value });
        }, 1200);
      }
    }, 1000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer?.isAI, currentPlayer?.id, turnState.phase, game?.status, game?.pendingEvent, game?.diceRolled]);

  return {
    turnState,
    dispatch,
    diceProps,
    handleEventResolve,
  };
}
