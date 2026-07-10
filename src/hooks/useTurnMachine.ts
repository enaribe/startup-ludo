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
import { useSound } from '@/hooks/useSound';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { crashLog, gameLog, gameWarn } from '@/utils/gameLog';

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
  setDiceValue?: (value: number) => void;
  executeMove: (pawnIndex: number) => MoveResult | null;
  exitHome: (pawnIndex: number) => MoveResult | null;
  nextTurn: () => void;
  grantExtraTurn: () => void;
  handleCapture: (capturedPlayerId: string, capturedPawnIndex: number) => void;
  endGame: (winnerId: string) => void;
  resolveEvent: (result: { ok: boolean; reward: number; selectedIndex?: number }) => void;
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
  /**
   * Appelé quand un joueur finit son pion (atteint l'arrivée).
   * Retourne true si la partie continue (3+ joueurs et il reste des actifs),
   * false si la partie est complètement terminée (2 joueurs OU dernier actif).
   */
  onWin: (playerId: string) => boolean;
  hapticsEnabled: boolean;
  setAnimating: (v: boolean) => void;
  clearSelection: () => void;
  /** Whether the online game considers it my turn (for dice disable) */
  isMyTurnOnline?: boolean;
  /** Appelé quand un pion entre dans la zone d'approche de son entrée finale
   *  (≤ FINAL_ENTRY_WARNING_DISTANCE cases) sans avoir encore les jetons requis.
   *  Déclenché 1× par lap pour ne pas spammer. */
  onMissedFinalEntry?: (tokensNeeded: number) => void;
  /** Appelé quand une capture doit être résolue via popup de choix.
   *  RÈGLE : c'est l'ATTRAPÉ (`capturedPlayerId`) qui décide. `capturerId` = le
   *  joueur qui a capturé (bénéficiaire des jetons en cas de « donner »). */
  onCapturePending?: (capturedPlayerId: string, capturedPawnIndex: number, capturerId: string) => void;
  /** Appelé quand l'ATTRAPÉ est une IA → décision automatique côté PlayScreen.
   *  `capturerId` = le joueur qui a capturé (bénéficiaire des jetons). */
  onAICapture?: (capturedPlayerId: string, capturedPawnIndex: number, capturerId: string) => void;
  /** Appelé au début du tour d'un joueur (après le lancer du dé). Sert au joker Investissement. */
  onTurnStart?: (playerId: string) => void;
  /** Appelé quand le tour passe RÉELLEMENT au joueur suivant (pas un rejeu-6),
   *  avec l'id du joueur dont le tour se termine. Sert à résoudre le joker Investissement. */
  onRealTurnEnd?: (playerId: string) => void;
}

export interface UseTurnMachineReturn {
  turnState: TurnState;
  dispatch: React.Dispatch<TurnAction>;
  diceProps: {
    onRoll: () => number;
    onDiceComplete: (value: number) => void;
  };
  handleEventResolve: () => void;
  chosenDiceValue: number | null;
  hasUsedDiceChoice: boolean;
  setChosenDiceValue: (value: number) => void;
  /** À appeler par PlayScreen une fois le popup de choix capture résolu (débloquera le passage de tour) */
  resolveCaptureChoice: () => void;
  /** À appeler par PlayScreen une fois le popup d'avertissement (entrée finale) fermé
   *  (débloquera l'event de case + fin de tour). */
  resolveMissedFinalEntry: () => void;
  /** Décompte anti-AFK du tour courant en ligne (15..0), null si inactif. */
  afkSecondsLeft: number | null;
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

      // Sur un 6 : on n'affiche PAS l'event de la case. Le tour supplémentaire
      // (rejouer) est prioritaire — l'event du 6 est ignoré et on enchaîne sur
      // un nouveau lancer. L'event de la case ne s'affiche que sur un lancer ≠ 6.
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
      if (state.phase !== 'event') {
        crashLog('EVENT_RESOLVED ignored', { currentPhase: state.phase });
        return state;
      }
      return {
        ...state,
        phase: 'ending',
      };
    }

    case 'TURN_ENDED': {
      if (state.phase !== 'ending') return state;
      // La décision rejouer/passer est prise dans runEndTurn (effet phase='ending').
      // Ici on remet simplement la machine à zéro pour le tour suivant (même joueur
      // si extra turn, joueur suivant sinon).
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
    isOnline,
    userId,
    actions,
    onEvent,
    onWin,
    hapticsEnabled,
    setAnimating,
    clearSelection,
    onMissedFinalEntry,
    onCapturePending,
    onAICapture,
    onTurnStart,
    onRealTurnEnd,
  } = params;

  const onMissedFinalEntryRef = useRef(onMissedFinalEntry);
  onMissedFinalEntryRef.current = onMissedFinalEntry;
  const onCapturePendingRef = useRef(onCapturePending);
  onCapturePendingRef.current = onCapturePending;
  const onAICaptureRef = useRef(onAICapture);
  onAICaptureRef.current = onAICapture;
  const onTurnStartRef = useRef(onTurnStart);
  onTurnStartRef.current = onTurnStart;
  const onRealTurnEndRef = useRef(onRealTurnEnd);
  onRealTurnEndRef.current = onRealTurnEnd;

  // Flag bloquant le passage de tour tant que le popup de choix capture n'est pas résolu
  const waitingForCaptureChoiceRef = useRef(false);
  const pendingTurnEndRef = useRef<(() => void) | null>(null);
  // Event de case (quiz, duel, etc.) reporté quand une capture est en cours :
  // on ne déclenche pas le popup d'event tant que le joueur n'a pas choisi
  // l'issue de la capture, sinon les deux popups se superposent et l'event
  // s'exécute en arrière-plan (timer du quiz qui s'écoule pendant que la modale capture est ouverte).
  const pendingEventTriggerRef = useRef<(() => void) | null>(null);
  // Flag bloquant le déclenchement de l'event de case + fin de tour
  // tant que le popup "tour de pénalité" (manque de jetons, passe devant l'entrée finale)
  // n'a pas été fermé. Sinon le popup d'event s'ouvre derrière le popup d'avertissement
  // et l'utilisateur ne le voit pas.
  const waitingForMissedFinalEntryRef = useRef(false);
  // Pions déjà avertis pendant leur lap courant — clé `${playerId}:${pawnIndex}`.
  // Reset quand le pion finit par passer son entrée (nouveau lap).
  const warnedPawnsRef = useRef<Set<string>>(new Set());

  const resolveCaptureChoice = useCallback(() => {
    waitingForCaptureChoiceRef.current = false;
    const pending = pendingTurnEndRef.current;
    pendingTurnEndRef.current = null;
    // Déclencher l'event de case reporté maintenant que la capture est résolue.
    const pendingEvent = pendingEventTriggerRef.current;
    pendingEventTriggerRef.current = null;
    pendingEvent?.();
    pending?.();
  }, []);

  const resolveMissedFinalEntry = useCallback(() => {
    waitingForMissedFinalEntryRef.current = false;
    // Déclencher l'event de case reporté maintenant que l'avertissement est fermé.
    const pendingEvent = pendingEventTriggerRef.current;
    pendingEventTriggerRef.current = null;
    pendingEvent?.();
    // Et la fin de tour si elle a été reportée
    const pending = pendingTurnEndRef.current;
    pendingTurnEndRef.current = null;
    pending?.();
  }, []);

  const { play: playSound } = useSound();

  const [turnState, dispatch] = useReducer(turnReducer, initialTurnState);
  const timers = useTimerMap();

  /** Ref pour jouer tour.mp3 une fois au changement de joueur actif (passage de tour) */
  const tourSoundPrevPlayerIdRef = useRef<string | null>(null);

  // ===== DICE CHOICE STATE =====
  const [chosenDiceValue, setChosenDiceValueState] = useState<number | null>(null);
  const [hasUsedDiceChoice, setHasUsedDiceChoice] = useState(false);
  const chosenDiceValueRef = useRef<number | null>(null);

  // ===== AFK TIMER STATE (multijoueur en ligne) =====
  // Décompte affiché pour le tour courant : 15..0, ou null si aucun timer actif.
  const [afkSecondsLeft, setAfkSecondsLeft] = useState<number | null>(null);
  const afkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setChosenDiceValue = useCallback((value: number) => {
    chosenDiceValueRef.current = value;
    setChosenDiceValueState(value);
  }, []);

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

    // Use chosen value if set (one-time use)
    const chosen = chosenDiceValueRef.current;
    let value: number;
    if (chosen !== null) {
      // Apply chosen value directly to game state, bypassing random
      if (actionsRef.current.setDiceValue) {
        actionsRef.current.setDiceValue(chosen);
      } else {
        actionsRef.current.rollDice();
      }
      value = chosen;
      chosenDiceValueRef.current = null;
      setChosenDiceValueState(null);
      setHasUsedDiceChoice(true);
    } else {
      value = actionsRef.current.rollDice();
    }

    dispatch({ type: 'ROLL_START', value });

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    return value;
  }, [hapticsEnabled]);

  const onDiceComplete = useCallback((value: number) => {
    if (turnStateRef.current.phase !== 'rolling') {
      gameWarn('turn', 'onDiceComplete ignoré — phase:', turnStateRef.current.phase, 'value:', value);
      return;
    }
    gameLog('turn', 'onDiceComplete → phase moving', { value });
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
    gameLog('turn', 'Phase moving: coups valides', {
      count: moves.length,
      moves: moves.map((m) => ({ type: m.type, pawnIndex: m.pawnIndex })),
      currentPlayerId: currentPlayer.id,
      diceValue: game.diceValue,
      diceRolled: game.diceRolled,
    });

    if (moves.length === 0) {
      gameLog('turn', 'Aucun coup valide → fin de tour');
      // No valid moves — skip turn after short delay
      timers.set('noMove', () => {
        dispatch({ type: 'NO_VALID_MOVE' });
      }, 1500);
      return;
    }

    const move = moves[0]!;

    // Avertissement préventif quand le pion entre dans la zone d'approche
    // de son entrée finale (≤ FINAL_ENTRY_WARNING_DISTANCE cases) sans avoir
    // les jetons requis. Affiché 1× max par lap pour ce pion, silencieux pour
    // les IA. Quand le pion finit par passer son entrée faute de jetons (= nouveau
    // lap), on reset la garde pour autoriser un nouvel avertissement au prochain
    // passage en zone d'approche.
    if (move.type === 'move' && move.result.missedFinalEntry) {
      const warnKey = `${currentPlayer.id}:${move.pawnIndex}`;
      warnedPawnsRef.current.delete(warnKey);
    }
    if (
      move.type === 'move' &&
      !currentPlayer.isAI &&
      move.result.finalEntryWarning &&
      move.result.tokensNeeded
    ) {
      const warnKey = `${currentPlayer.id}:${move.pawnIndex}`;
      if (!warnedPawnsRef.current.has(warnKey)) {
        warnedPawnsRef.current.add(warnKey);
        waitingForMissedFinalEntryRef.current = true;
        onMissedFinalEntryRef.current?.(move.result.tokensNeeded);
      }
    }

    setAnimating(true);
    gameLog('turn', 'Exécution auto du coup', { type: move.type, pawnIndex: move.pawnIndex });
    crashLog('autoMove timer scheduled', { type: move.type, pawnIndex: move.pawnIndex });

    timers.set('autoMove', () => {
      crashLog('autoMove timer fired');
      const rolledSix = turnState.rolledSix;
      let result: MoveResult | null = null;

      if (move.type === 'exit') {
        result = actions.exitHome(move.pawnIndex);
        gameLog('turn', 'exitHome résultat', {
          canMove: result?.canMove,
          pathLength: result?.path?.length,
        });
      } else {
        result = actions.executeMove(move.pawnIndex);
        gameLog('turn', 'executeMove résultat', {
          canMove: result?.canMove,
          newStatus: result?.newState?.status,
          pathLength: result?.path?.length,
          triggeredEvent: result?.triggeredEvent || 'none',
        });
      }

      // Watchdog crash Android — chemins anormalement longs (tour complet)
      if (result?.path) {
        const pathLen = result.path.length;
        if (pathLen > 30) {
          crashLog('LONG_PATH detected — possible loop', {
            pathLen,
            moveType: move.type,
            pawnIndex: move.pawnIndex,
            newStatus: result.newState?.status,
          });
        }
        // Coordonnées invalides : col/row NaN/undefined
        const corruptIdx = result.path.findIndex(
          (p) => !p || !Number.isFinite((p as { col?: number }).col) || !Number.isFinite((p as { row?: number }).row),
        );
        if (corruptIdx >= 0) {
          crashLog('CORRUPT_PATH coord', {
            index: corruptIdx,
            coord: result.path[corruptIdx],
            pathLen,
          });
        }
      }

      if (result) {
        // Calculate animation delay
        const animDelay = result.path?.length
          ? result.path.length * PAWN_STEP_MS + 150
          : 400;
        crashLog('move scheduled', {
          moveType: move.type,
          pathLen: result.path?.length ?? 0,
          animDelay,
          hasCapture: !!result.capturedPawn,
          isFinished: result.isFinished ?? false,
          triggeredEvent: result.triggeredEvent ?? null,
        });

        // Handle capture after animation
        if (result.capturedPawn) {
          timers.set('capture', () => {
            if (hapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            // RÈGLE : c'est le joueur ATTRAPÉ (capturedPawn.playerId) qui décide
            // s'il cède ses jetons ou rentre à la base.
            //  - Attrapé HUMAIN → popup de choix (onCapturePending).
            //  - Attrapé IA     → décision automatique côté PlayScreen (onAICapture).
            // Le CAPTUREUR = le joueur qui vient de bouger (currentPlayerRef) : il
            // est le bénéficiaire des jetons si l'attrapé choisit « donner ».
            // Dans les deux cas on bloque le passage de tour tant que le choix
            // n'est pas résolu (évite qu'un event de case s'ouvre en parallèle).
            const capturedId = result!.capturedPawn!.playerId;
            const capturerId = currentPlayerRef.current?.id ?? '';
            const capturedPlayer = gameRef.current?.players.find((p) => p.id === capturedId);
            const capturedIsHuman = !!capturedPlayer && !capturedPlayer.isAI;
            waitingForCaptureChoiceRef.current = true;
            if (onCapturePendingRef.current && capturedIsHuman) {
              onCapturePendingRef.current(
                capturedId,
                result!.capturedPawn!.pawnIndex,
                capturerId,
              );
            } else {
              onAICaptureRef.current?.(
                capturedId,
                result!.capturedPawn!.pawnIndex,
                capturerId,
              );
            }
          }, animDelay);
        }

        // Handle win check
        if (result.isFinished) {
          timers.set('winCheck', () => {
            let stillRunning = false;
            if (currentPlayerRef.current && actionsRef.current.checkWinCondition(currentPlayerRef.current.id)) {
              stillRunning = onWinRef.current(currentPlayerRef.current.id);
            }
            setAnimating(false);
            // Si la partie continue (multi 3+), passer la main au joueur suivant
            // (sauf en cas de rolledSix : on garde le tour).
            if (stillRunning && !rolledSix) {
              actionsRef.current.nextTurn();
            }
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
          // Déclencher le callback event DIRECTEMENT ici, avant le dispatch,
          // pour éviter la race condition Android sur useEffect([turnState.phase]).
          // Le useEffect phase='event' ci-dessous est conservé pour le multijoueur
          // en ligne (remoteEvent), mais ne fera rien en solo car onEventRef
          // est déjà appelé ici.
          if (result!.triggeredEvent && !rolledSix) {
            const triggeredEvent = result!.triggeredEvent;
            crashLog('moveComplete → triggerEvent', {
              eventType: triggeredEvent,
              waitingForCapture: waitingForCaptureChoiceRef.current,
              waitingForMissed: waitingForMissedFinalEntryRef.current,
            });
            // Si une capture est en attente (popup choix ouvert), reporter le
            // déclenchement de l'event pour qu'il n'apparaisse pas en parallèle.
            // Idem si le popup d'avertissement entrée finale est ouvert.
            if (waitingForCaptureChoiceRef.current || waitingForMissedFinalEntryRef.current) {
              pendingEventTriggerRef.current = () => onEventRef.current(triggeredEvent);
            } else {
              // Dispatch MOVE_COMPLETE AVANT onEvent pour que la phase soit en 'event'
              // au moment où le callback est appelé. Sinon handleEventResolve appelé
              // depuis le callback (cas case joker auto-resolve) ne fera rien
              // (reducer EVENT_RESOLVED ignore si phase !== 'event').
              dispatch({ type: 'MOVE_COMPLETE', result: result!, rolledSix });
              onEventRef.current(triggeredEvent);
              return;
            }
          }
          dispatch({ type: 'MOVE_COMPLETE', result: result!, rolledSix });
        }, animDelay);
      } else {
        // Move returned null (shouldn't happen but be safe)
        gameWarn('turn', 'executeMove/exitHome a retourné null');
        setAnimating(false);
        dispatch({ type: 'NO_VALID_MOVE' });
      }
    }, 500);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnState.phase]);

  // ===== EFFECT: Phase 'event' → (no-op) =====
  // Le déclenchement du popup est maintenant fait directement dans le timer
  // moveComplete ci-dessus pour éviter la race condition Android.
  // Ce useEffect est conservé uniquement pour ne pas casser la machine à états
  // (la phase 'event' doit exister pour que EVENT_RESOLVED fonctionne).

  // ===== EFFECT: Phase 'ending' → grant extra turn or next turn =====

  useEffect(() => {
    if (turnState.phase !== 'ending') return;
    crashLog('phase=ending — schedule endTurn timer');

    const runEndTurn = () => {
      const state = turnStateRef.current;
      crashLog('runEndTurn exec', {
        rolledSix: state.rolledSix,
        hasMoveResult: !!state.moveResult,
        isFinished: state.moveResult?.isFinished ?? null,
      });

      // Tour supplémentaire sur un 6 : accordé tant que le pion n'a pas FINI.
      // Cas inclus : 6 qui déplace sans finir, ET 6 sans coup valide (ex. pion
      // bloqué en zone finale faute du compte exact) → on rejoue quand même.
      // Seul un pion qui atteint l'arrivée (isFinished) ne donne pas de rejeu.
      if (state.rolledSix && !state.moveResult?.isFinished) {
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
    };

    timers.set('endTurn', () => {
      if (waitingForCaptureChoiceRef.current) {
        crashLog('endTurn deferred — waitingForCaptureChoice');
        pendingTurnEndRef.current = runEndTurn;
        return;
      }
      if (waitingForMissedFinalEntryRef.current) {
        crashLog('endTurn deferred — waitingForMissedFinalEntry');
        pendingTurnEndRef.current = runEndTurn;
        return;
      }
      runEndTurn();
    }, 300);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnState.phase]);

  // ===== EFFECT: Son « tour » quand le tour passe à un autre joueur =====

  useEffect(() => {
    if (!game || game.status !== 'playing') return;
    const pid = currentPlayer?.id ?? null;
    if (!pid) return;

    if (tourSoundPrevPlayerIdRef.current === null) {
      tourSoundPrevPlayerIdRef.current = pid;
      return;
    }
    if (tourSoundPrevPlayerIdRef.current === pid) return;

    tourSoundPrevPlayerIdRef.current = pid;

    const humanCount = game.players.filter((p) => !p.isAI).length;
    let shouldPlayTour = false;

    if (isOnline && userId) {
      shouldPlayTour = pid !== userId;
    } else if (humanCount > 1) {
      shouldPlayTour = true;
    } else {
      shouldPlayTour = currentPlayer?.isAI === true;
    }

    if (shouldPlayTour) {
      playSound('tour');
    }
  }, [game?.status, game?.players, currentPlayer?.id, currentPlayer?.isAI, isOnline, userId, playSound]);

  // ===== EFFECT: Detect active player change → reset machine =====
  // When the current player changes (new player's turn), reset the
  // turn machine so the new player starts fresh in idle.

  useEffect(() => {
    const playerId = currentPlayer?.id ?? null;

    // First mount — just record + démarrer le suivi d'investissement du 1er joueur
    if (activePlayerIdRef.current === null) {
      activePlayerIdRef.current = playerId;
      if (playerId) onTurnStartRef.current?.(playerId);
      return;
    }

    // Same player (e.g. extra turn on 6) — no reset needed
    if (playerId === activePlayerIdRef.current) return;

    // Player changed — le tour du joueur précédent se termine RÉELLEMENT ici
    // (après d'éventuels rejeux-6). On résout son pari « Investissement », puis on
    // démarre le suivi pour le nouveau joueur.
    const previousPlayerId = activePlayerIdRef.current;
    if (previousPlayerId) onRealTurnEndRef.current?.(previousPlayerId);
    if (playerId) onTurnStartRef.current?.(playerId);

    activePlayerIdRef.current = playerId;
    // Reset valeur de dé armée par joker (dice_choice/reroll) : elle ne doit
    // jamais déborder sur le tour d'un autre joueur.
    chosenDiceValueRef.current = null;
    setChosenDiceValueState(null);
    // Ne pas clearAll() ici : les timers du nouveau tour (moveComplete, etc.)
    // peuvent déjà être en attente sur Android où les re-renders sont décalés.
    // On dispatche RESET seulement si la machine n'est pas déjà à idle
    // (TURN_ENDED l'a déjà reset proprement dans ce cas).
    if (turnStateRef.current.phase !== 'idle') {
      timers.clearAll();
      dispatch({ type: 'RESET' });
      setAnimating(false);
    }
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

  // ===== EFFECT: timer anti-AFK (multijoueur en ligne) =====
  // Si le joueur humain local ne lance pas le dé en 15 s, on le lance pour lui.
  // Sur les autres clients, le décompte est aussi affiché (lecture seule) mais
  // seul le client du joueur actif déclenche réellement l'auto-roll.
  const AFK_TIMEOUT_SECONDS = 15;

  useEffect(() => {
    const stopCountdown = () => {
      if (afkIntervalRef.current) {
        clearInterval(afkIntervalRef.current);
        afkIntervalRef.current = null;
      }
      setAfkSecondsLeft(null);
    };

    // Conditions d'activation : partie en ligne, en cours, en attente du lancer,
    // joueur courant humain (pas IA), dé pas encore lancé, pas d'event en attente.
    const eligible =
      isOnline &&
      !!game &&
      game.status === 'playing' &&
      !!currentPlayer &&
      !currentPlayer.isAI &&
      turnState.phase === 'idle' &&
      !game.pendingEvent &&
      !game.diceRolled;

    if (!eligible) {
      stopCountdown();
      return undefined;
    }

    // Démarre le décompte 15 -> 0
    setAfkSecondsLeft(AFK_TIMEOUT_SECONDS);
    afkIntervalRef.current = setInterval(() => {
      setAfkSecondsLeft((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          if (afkIntervalRef.current) {
            clearInterval(afkIntervalRef.current);
            afkIntervalRef.current = null;
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    // Auto-roll après 15 s — uniquement sur le client du joueur actif local.
    const isMyTurnLocal = !!userId && currentPlayer.id === userId;
    if (isMyTurnLocal) {
      timers.set(
        'afkRoll',
        () => {
          // Re-vérifie l'état au moment du déclenchement (anti stale closure)
          if (turnStateRef.current.phase !== 'idle') return;
          if (!currentPlayerRef.current || currentPlayerRef.current.isAI) return;
          if (currentPlayerRef.current.id !== userId) return;
          if (gameRef.current?.diceRolled) return;

          const value = actionsRef.current.rollDice();
          if (value > 0) {
            dispatch({ type: 'ROLL_START', value });
            timers.set('afkRollComplete', () => {
              dispatch({ type: 'ROLL_COMPLETE', value });
            }, 1200);
          }
        },
        AFK_TIMEOUT_SECONDS * 1000
      );
    }

    return () => {
      stopCountdown();
      timers.clear('afkRoll');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnline,
    currentPlayer?.id,
    currentPlayer?.isAI,
    turnState.phase,
    game?.status,
    game?.pendingEvent,
    game?.diceRolled,
    userId,
  ]);

  return {
    turnState,
    dispatch,
    diceProps,
    handleEventResolve,
    chosenDiceValue,
    hasUsedDiceChoice,
    setChosenDiceValue,
    resolveCaptureChoice,
    resolveMissedFinalEntry,
    afkSecondsLeft,
  };
}
