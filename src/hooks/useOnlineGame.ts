/**
 * useOnlineGame - Hook pont entre useGameStore et MultiplayerSync
 *
 * Ce hook est le coeur du multijoueur en ligne :
 * - Ecoute les actions RTDB entrantes et les applique au store local
 * - Wrappe les actions locales pour les broadcaster automatiquement
 * - Gate les actions (seul le joueur actif peut agir)
 * - Gere les checkpoints periodiques pour la reconnexion
 * - Detecte la deconnexion des adversaires
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { multiplayerSync } from '@/services/multiplayer';
import { useGameStore, type RemoteAction } from '@/stores/useGameStore';
import { encodeCheckpoint } from '@/utils/onlineCodec';
import type { MoveResult } from '@/services/game/GameEngine';

// ===== TYPES =====

/** Info about a remote dice roll for animation */
export interface RemoteDiceRoll {
  playerId: string;
  value: number;
}

/** Info about a remote event for spectator display */
export interface RemoteEvent {
  playerId: string;
  eventType: string;
  eventData: Record<string, unknown>;
}

/** Info about a remote event result */
export interface RemoteEventResult {
  playerId: string;
  ok: boolean;
  reward: number;
}

interface UseOnlineGameReturn {
  /** Roll dice and broadcast to other players */
  rollDice: () => number;
  /** Move pawn and broadcast */
  movePawn: (pawnIndex: number) => MoveResult | null;
  /** Exit home and broadcast */
  exitHome: (pawnIndex: number) => MoveResult | null;
  /** Resolve event (quiz/funding/etc) and broadcast result */
  resolveEvent: (result: { ok: boolean; reward: number }) => void;
  /** Skip turn and broadcast */
  skipTurn: () => void;
  /** End turn and broadcast (next turn or extra turn) */
  endTurn: (extra: boolean) => void;
  /** Broadcast capture */
  broadcastCapture: (capturedPlayerId: string, capturedPawnIndex: number) => void;
  /** Broadcast win */
  broadcastWin: (winnerId: string) => void;
  /** Broadcast an event trigger (so opponent sees the popup) */
  broadcastEvent: (eventType: string, eventData: Record<string, unknown>) => void;
  /** Forfeit (quit) the game — opponent wins */
  forfeit: () => void;

  /** True when it's this player's turn */
  isMyTurn: boolean;
  /** True when connected to RTDB */
  isConnected: boolean;
  /** True when an opponent has disconnected */
  opponentDisconnected: boolean;
  /** Name of the disconnected opponent */
  disconnectedPlayerName: string | null;

  /** Remote dice roll to animate (set briefly, then cleared) */
  remoteDiceRoll: RemoteDiceRoll | null;
  /** Remote event to show as spectator (set when remote player triggers event) */
  remoteEvent: RemoteEvent | null;
  /** Remote event result (set when remote player resolves event) */
  remoteEventResult: RemoteEventResult | null;
  /** Clear remote event after displaying */
  clearRemoteEvent: () => void;
  /** Clear remote event result after displaying */
  clearRemoteEventResult: () => void;
}

// Checkpoint every N turns
const CHECKPOINT_INTERVAL = 5;

// ===== HOOK =====

export function useOnlineGame(userId: string | null): UseOnlineGameReturn {
  const game = useGameStore((s) => s.game);
  const getCurrentPlayer = useGameStore((s) => s.getCurrentPlayer);
  const applyRemoteAction = useGameStore((s) => s.applyRemoteAction);

  // Store action refs (avoid stale closures)
  const storeRollDice = useGameStore((s) => s.rollDice);
  const storeExecuteMove = useGameStore((s) => s.executeMove);
  const storeExitHome = useGameStore((s) => s.exitHome);
  const storeAddTokens = useGameStore((s) => s.addTokens);
  const storeRemoveTokens = useGameStore((s) => s.removeTokens);
  const storeResolveEvent = useGameStore((s) => s.resolveEvent);
  const storeNextTurn = useGameStore((s) => s.nextTurn);
  const storeGrantExtraTurn = useGameStore((s) => s.grantExtraTurn);
  const storeHandleCapture = useGameStore((s) => s.handleCapture);
  const storeEndGame = useGameStore((s) => s.endGame);

  const [isConnected, setIsConnected] = useState(true);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [disconnectedPlayerName, setDisconnectedPlayerName] = useState<string | null>(null);

  // Remote notifications for PlayScreen to react to
  const [remoteDiceRoll, setRemoteDiceRoll] = useState<RemoteDiceRoll | null>(null);
  const [remoteEvent, setRemoteEvent] = useState<RemoteEvent | null>(null);
  const [remoteEventResult, setRemoteEventResult] = useState<RemoteEventResult | null>(null);

  const clearRemoteEvent = useCallback(() => setRemoteEvent(null), []);
  const clearRemoteEventResult = useCallback(() => setRemoteEventResult(null), []);

  // Track processed actions to avoid duplicates
  const processedActionsRef = useRef<Set<string>>(new Set());
  // Track last checkpoint turn to avoid duplicate checkpoints
  const lastCheckpointTurnRef = useRef<number>(0);

  // ===== A. RECEIVE REMOTE ACTIONS =====

  useEffect(() => {
    if (!userId) return;

    const unsub = multiplayerSync.subscribeToActions((action) => {
      console.log('[useOnlineGame] Action reçue:', {
        type: action.t,
        from: action.p,
        isMe: action.p === userId,
        data: action.d,
        ts: action.ts,
      });

      // Skip own actions
      if (action.p === userId) {
        console.log('[useOnlineGame] Action ignorée (moi-même)');
        return;
      }

      // Skip already processed actions
      const actionKey = action.id ?? `${action.t}_${action.ts}`;
      if (processedActionsRef.current.has(actionKey)) {
        console.log('[useOnlineGame] Action ignorée (déjà traitée):', actionKey);
        return;
      }
      processedActionsRef.current.add(actionKey);

      // Keep set manageable
      if (processedActionsRef.current.size > 200) {
        const entries = Array.from(processedActionsRef.current);
        processedActionsRef.current = new Set(entries.slice(-100));
      }

      // Handle special actions that need UI notification
      switch (action.t) {
        case 'r': {
          // Remote dice roll: notify PlayScreen to animate
          const value = (action.d as { v: number }).v;
          setRemoteDiceRoll({ playerId: action.p, value });
          // Clear after animation duration (1200ms)
          setTimeout(() => setRemoteDiceRoll(null), 1500);
          break;
        }
        case 'ev': {
          // Remote event triggered: show popup as spectator
          const data = action.d as { type: string; data: Record<string, unknown> };
          setRemoteEvent({
            playerId: action.p,
            eventType: data.type,
            eventData: data.data,
          });
          break;
        }
        case 'e': {
          // Remote event result: show the answer/result
          const result = action.d as { ok: boolean; r: number };
          setRemoteEventResult({
            playerId: action.p,
            ok: result.ok ?? false,
            reward: result.r ?? 0,
          });
          // Clear remote event popup after a delay
          setTimeout(() => {
            setRemoteEvent(null);
            setRemoteEventResult(null);
          }, 3000);
          break;
        }
      }

      // Apply to local store (for state-modifying actions)
      applyRemoteAction(action as RemoteAction);
    });

    return unsub;
  }, [userId, applyRemoteAction]);

  // ===== B. MONITOR PLAYER CONNECTIONS =====

  useEffect(() => {
    if (!userId) return;

    const unsub = multiplayerSync.subscribeToPlayers((players) => {
      const otherPlayers = Object.values(players).filter((p) => p.id !== userId);
      const disconnected = otherPlayers.find((p) => !p.isConnected);

      if (disconnected) {
        setOpponentDisconnected(true);
        setDisconnectedPlayerName(disconnected.displayName || disconnected.name || null);
      } else {
        setOpponentDisconnected(false);
        setDisconnectedPlayerName(null);
      }
    });

    return unsub;
  }, [userId]);

  // ===== C. CONNECTION STATUS =====

  useEffect(() => {
    const unsub = multiplayerSync.onEvent((event) => {
      if (event.type === 'connection_changed') {
        setIsConnected(event.data as boolean);
      }
    });

    return unsub;
  }, []);

  // ===== D. PERIODIC CHECKPOINTS =====

  useEffect(() => {
    if (!game || !userId) return;

    const currentPlayer = getCurrentPlayer();
    const isMyTurn = currentPlayer?.id === userId;

    // Save checkpoint every CHECKPOINT_INTERVAL turns, only on my turn
    if (
      isMyTurn &&
      game.currentTurn > 0 &&
      game.currentTurn % CHECKPOINT_INTERVAL === 0 &&
      game.currentTurn !== lastCheckpointTurnRef.current
    ) {
      lastCheckpointTurnRef.current = game.currentTurn;
      const checkpoint = encodeCheckpoint(game);
      multiplayerSync.saveCheckpoint(checkpoint as unknown as Record<string, unknown>);
    }
  }, [game?.currentTurn, game, userId, getCurrentPlayer]);

  // ===== E. IS MY TURN =====

  const isMyTurn = useMemo(() => {
    if (!userId || !game) return false;
    const currentPlayer = game.players[game.currentPlayerIndex];
    return currentPlayer?.id === userId;
  }, [userId, game?.currentPlayerIndex, game?.players]);

  // ===== F. WRAPPED ACTIONS (local + broadcast) =====

  const rollDice = useCallback(() => {
    if (!userId) {
      console.log('[useOnlineGame.rollDice] Abandon: userId absent');
      return 1;
    }

    const value = storeRollDice();
    console.log('[useOnlineGame.rollDice] Dé lancé:', value, '- envoi action "r"');
    multiplayerSync.sendAction({
      t: 'r',
      p: userId,
      d: { v: value },
    });
    return value;
  }, [userId, storeRollDice]);

  const movePawn = useCallback(
    (pawnIndex: number) => {
      if (!userId) {
        console.log('[useOnlineGame.movePawn] Abandon: userId absent');
        return null;
      }

      console.log('[useOnlineGame.movePawn] Déplacement local puis envoi', { pawnIndex, userId });
      const result = storeExecuteMove(pawnIndex);
      console.log('[useOnlineGame.movePawn] Résultat local:', {
        canMove: result?.canMove,
        newStatus: result?.newState?.status,
        pathLength: result?.path?.length,
      });

      multiplayerSync.sendAction({
        t: 'm',
        p: userId,
        d: { i: pawnIndex },
      });
      console.log('[useOnlineGame.movePawn] Action "m" envoyée');
      return result;
    },
    [userId, storeExecuteMove]
  );

  const exitHome = useCallback(
    (pawnIndex: number) => {
      if (!userId) {
        console.log('[useOnlineGame.exitHome] Abandon: userId absent');
        return null;
      }

      console.log('[useOnlineGame.exitHome] Sortie maison puis envoi', { pawnIndex, userId });
      const result = storeExitHome(pawnIndex);
      console.log('[useOnlineGame.exitHome] Résultat local:', {
        canMove: result?.canMove,
        pathLength: result?.path?.length,
      });

      multiplayerSync.sendAction({
        t: 'x',
        p: userId,
        d: { i: pawnIndex },
      });
      console.log('[useOnlineGame.exitHome] Action "x" envoyée');
      return result;
    },
    [userId, storeExitHome]
  );

  const resolveEvent = useCallback(
    (result: { ok: boolean; reward: number }) => {
      if (!userId) return;

      // Apply locally
      if (result.ok && result.reward > 0) {
        storeAddTokens(userId, result.reward);
      } else if (!result.ok && result.reward > 0) {
        storeRemoveTokens(userId, result.reward);
      }
      storeResolveEvent();

      // Broadcast
      multiplayerSync.sendAction({
        t: 'e',
        p: userId,
        d: { ok: result.ok, r: result.reward },
      });
    },
    [userId, storeAddTokens, storeRemoveTokens, storeResolveEvent]
  );

  const skipTurn = useCallback(() => {
    if (!userId) return;

    storeNextTurn();
    multiplayerSync.sendAction({
      t: 's',
      p: userId,
      d: {},
    });
  }, [userId, storeNextTurn]);

  const endTurn = useCallback(
    (extra: boolean) => {
      if (!userId) return;

      if (extra) {
        storeGrantExtraTurn();
      } else {
        storeNextTurn();
      }

      multiplayerSync.sendAction({
        t: 'n',
        p: userId,
        d: { extra },
      });
    },
    [userId, storeNextTurn, storeGrantExtraTurn]
  );

  const broadcastCapture = useCallback(
    (capturedPlayerId: string, capturedPawnIndex: number) => {
      if (!userId) return;

      storeHandleCapture(capturedPlayerId, capturedPawnIndex);
      multiplayerSync.sendAction({
        t: 'k',
        p: userId,
        d: { pid: capturedPlayerId, pi: capturedPawnIndex },
      });
    },
    [userId, storeHandleCapture]
  );

  const broadcastWin = useCallback(
    (winnerId: string) => {
      if (!userId) return;

      storeEndGame(winnerId);
      multiplayerSync.sendAction({
        t: 'w',
        p: userId,
        d: { winner: winnerId },
      });

      // Update room status
      multiplayerSync.updateRoomStatus('finished');
    },
    [userId, storeEndGame]
  );

  const broadcastEvent = useCallback(
    (eventType: string, eventData: Record<string, unknown>) => {
      if (!userId) return;

      multiplayerSync.sendAction({
        t: 'ev',
        p: userId,
        d: { type: eventType, data: eventData },
      });
    },
    [userId]
  );

  const forfeit = useCallback(() => {
    if (!userId || !game) return;

    // Find the opponent (the one who wins by forfeit)
    const opponent = game.players.find((p) => p.id !== userId);
    if (opponent) {
      storeEndGame(opponent.id);
      multiplayerSync.sendAction({
        t: 'f',
        p: userId,
        d: { winner: opponent.id },
      });
      multiplayerSync.updateRoomStatus('finished');
    }

    multiplayerSync.leaveRoom();
  }, [userId, game, storeEndGame]);

  return {
    rollDice,
    movePawn,
    exitHome,
    resolveEvent,
    skipTurn,
    endTurn,
    broadcastCapture,
    broadcastWin,
    broadcastEvent,
    forfeit,
    isMyTurn,
    isConnected,
    opponentDisconnected,
    disconnectedPlayerName,
    remoteDiceRoll,
    remoteEvent,
    remoteEventResult,
    clearRemoteEvent,
    clearRemoteEventResult,
  };
}
