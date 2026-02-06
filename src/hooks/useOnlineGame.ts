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

/** Info about a remote duel score (pour synchroniser les scores en duel online) */
export interface RemoteDuelScore {
  playerId: string;
  score: number;
}

/** Info about a remote duel result (pour informer les spectateurs) */
export interface RemoteDuelResult {
  challengerId: string;
  opponentId: string;
  challengerScore: number;
  opponentScore: number;
  winnerId: string | null;
}

/** Info about a remote emoji reaction */
export interface RemoteEmojiReaction {
  id: string;
  playerId: string;
  playerName: string;
  emoji: string;
  timestamp: number;
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
  /** Broadcast le démarrage d'un duel avec questions (événement 'duel' avec challengerId, opponentId, questions) */
  broadcastDuelStart: (challengerId: string, opponentId: string, questions: Record<string, unknown>[]) => void;
  /** Broadcast son score en duel (action 'dr') */
  broadcastDuelScore: (score: number) => void;
  /** Broadcast le résultat du duel aux spectateurs (action 'dres') */
  broadcastDuelResult: (result: RemoteDuelResult) => void;
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
  /** Score duel reçu de l'adversaire (pour duel online) */
  remoteDuelScore: RemoteDuelScore | null;
  /** Clear remote duel score after processing */
  clearRemoteDuelScore: () => void;
  /** Résultat du duel reçu (pour les spectateurs) */
  remoteDuelResult: RemoteDuelResult | null;
  /** Clear remote duel result after processing */
  clearRemoteDuelResult: () => void;

  /** Send an emoji reaction to other players */
  sendEmojiReaction: (emoji: string, playerName: string) => void;
  /** Remote emoji reaction received (for overlay display) */
  remoteEmojiReaction: RemoteEmojiReaction | null;
  /** Clear remote emoji reaction after animation */
  clearRemoteEmojiReaction: () => void;
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
  const [remoteDuelScore, setRemoteDuelScore] = useState<RemoteDuelScore | null>(null);
  const [remoteDuelResult, setRemoteDuelResult] = useState<RemoteDuelResult | null>(null);
  const [remoteEmojiReaction, setRemoteEmojiReaction] = useState<RemoteEmojiReaction | null>(null);

  const clearRemoteEvent = useCallback(() => setRemoteEvent(null), []);
  const clearRemoteEventResult = useCallback(() => setRemoteEventResult(null), []);
  const clearRemoteDuelScore = useCallback(() => setRemoteDuelScore(null), []);
  const clearRemoteDuelResult = useCallback(() => setRemoteDuelResult(null), []);
  const clearRemoteEmojiReaction = useCallback(() => setRemoteEmojiReaction(null), []);

  // Track processed actions to avoid duplicates
  const processedActionsRef = useRef<Set<string>>(new Set());
  // Track last checkpoint turn to avoid duplicate checkpoints
  const lastCheckpointTurnRef = useRef<number>(0);
  // Track previous opponentDisconnected for debug logs
  const prevOpponentDisconnectedRef = useRef<boolean>(false);

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
          // Remote event triggered: show popup as spectator (ne pas toucher au store)
          const data = action.d as { type: string; data: Record<string, unknown> };
          const eventType = data?.type ?? '';
          const eventData = data?.data ?? {};
          console.log('[useOnlineGame] Événement distant (spectateur):', {
            eventType,
            hasData: Object.keys(eventData).length > 0,
          });
          // Mise à jour au prochain tick pour éviter un batch React avec le callback Firebase
          const payload = {
            playerId: action.p,
            eventType,
            eventData: eventData as Record<string, unknown>,
          };
          setTimeout(() => {
            setRemoteEvent(payload);
          }, 0);
          // Ne pas appeler applyRemoteAction pour 'ev' (UI uniquement)
          return;
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
          // Ne pas appeler applyRemoteAction pour 'e' ici : le store sera mis à jour
          // par applyRemoteAction ci-dessous (case 'e' dans le store applique tokens + resolveEvent)
          break;
        }
        case 'dr': {
          // Duel result (score) : l'autre joueur envoie son score
          const data = action.d as { score: number };
          setRemoteDuelScore({ playerId: action.p, score: data?.score ?? 0 });
          return;
        }
        case 'dres': {
          // Duel result broadcast : informer les spectateurs du résultat
          const rawData = action.d as Record<string, unknown>;
          const data: RemoteDuelResult = {
            challengerId: String(rawData.challengerId ?? ''),
            opponentId: String(rawData.opponentId ?? ''),
            challengerScore: Number(rawData.challengerScore ?? 0),
            opponentScore: Number(rawData.opponentScore ?? 0),
            winnerId: rawData.winnerId ? String(rawData.winnerId) : null,
          };
          console.log('[useOnlineGame] Résultat duel reçu (spectateur):', data);
          setRemoteDuelResult(data);
          return;
        }
        case 'em': {
          // Emoji reaction received from another player
          const emData = action.d as { emoji: string; name: string };
          const reaction: RemoteEmojiReaction = {
            id: `${action.p}-${action.ts}`,
            playerId: action.p,
            playerName: emData.name ?? 'Joueur',
            emoji: emData.emoji,
            timestamp: action.ts,
          };
          console.log('[useOnlineGame] Emoji reaction reçue:', reaction);
          setRemoteEmojiReaction(reaction);
          return;
        }
      }

      // Apply to local store (for state-modifying actions; 'ev' et 'dr' déjà return ci-dessus)
      applyRemoteAction(action as RemoteAction);
    });

    return unsub;
  }, [userId, applyRemoteAction]);

  // ===== B. MONITOR PLAYER CONNECTIONS =====

  // Délai de grâce avant de considérer un joueur comme déconnecté (évite les faux positifs)
  const DISCONNECT_GRACE_PERIOD_MS = 20000;
  const disconnectGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDisconnectRef = useRef<{ playerId: string; playerName: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsub = multiplayerSync.subscribeToPlayers((players) => {

      const otherPlayers = Object.values(players).filter((p) => p.id !== userId);
      const now = Date.now();

      // Un joueur est considéré déconnecté si :
      // 1. isConnected est false ET
      // 2. lastSeen est plus vieux que DISCONNECT_GRACE_PERIOD_MS
      const disconnected = otherPlayers.find((p) => {
        if (p.isConnected) return false;
        const lastSeenAge = now - (p.lastSeen ?? 0);
        return lastSeenAge > DISCONNECT_GRACE_PERIOD_MS;
      });

      // Joueur potentiellement déconnecté (isConnected false mais dans le délai de grâce)
      const potentiallyDisconnected = otherPlayers.find((p) => {
        if (p.isConnected) return false;
        const lastSeenAge = now - (p.lastSeen ?? 0);
        return lastSeenAge <= DISCONNECT_GRACE_PERIOD_MS;
      });

      const oldValue = prevOpponentDisconnectedRef.current;

      if (disconnected) {
        // Déconnexion confirmée (au-delà du délai de grâce)
        if (__DEV__) {
          console.log('[useOnlineGame] opponentDisconnected CONFIRMÉ:', {
            oldValue,
            newValue: true,
            reason: 'grace_period_expired',
            opponentId: disconnected.id,
            lastSeenTimestamp: disconnected.lastSeen,
            lastSeenAge: now - (disconnected.lastSeen ?? 0),
          });
        }
        // Annuler tout timer en attente
        if (disconnectGraceTimerRef.current) {
          clearTimeout(disconnectGraceTimerRef.current);
          disconnectGraceTimerRef.current = null;
        }
        pendingDisconnectRef.current = null;
        prevOpponentDisconnectedRef.current = true;
        setOpponentDisconnected(true);
        setDisconnectedPlayerName(disconnected.displayName || disconnected.name || null);
      } else if (potentiallyDisconnected) {
        // Déconnexion potentielle - démarrer le timer de grâce si pas déjà en cours
        const playerName = potentiallyDisconnected.displayName || potentiallyDisconnected.name || null;
        if (!disconnectGraceTimerRef.current || pendingDisconnectRef.current?.playerId !== potentiallyDisconnected.id) {
          if (__DEV__) {
            console.log('[useOnlineGame] Déconnexion potentielle détectée, démarrage timer de grâce:', {
              playerId: potentiallyDisconnected.id,
              playerName,
              lastSeen: potentiallyDisconnected.lastSeen,
              gracePeriod: DISCONNECT_GRACE_PERIOD_MS,
            });
          }
          // Annuler l'ancien timer si différent joueur
          if (disconnectGraceTimerRef.current) {
            clearTimeout(disconnectGraceTimerRef.current);
          }
          pendingDisconnectRef.current = { playerId: potentiallyDisconnected.id, playerName };
          const remainingGrace = DISCONNECT_GRACE_PERIOD_MS - (now - (potentiallyDisconnected.lastSeen ?? 0));
          disconnectGraceTimerRef.current = setTimeout(() => {
            if (__DEV__) {
              console.log('[useOnlineGame] Timer de grâce expiré, vérification finale');
            }
            // Le timer a expiré, la prochaine mise à jour de présence confirmera la déconnexion
          }, Math.max(remainingGrace, 1000));
        }
      } else {
        // Tous les joueurs sont connectés
        if (disconnectGraceTimerRef.current) {
          if (__DEV__) {
            console.log('[useOnlineGame] Joueur reconnecté, annulation du timer de grâce');
          }
          clearTimeout(disconnectGraceTimerRef.current);
          disconnectGraceTimerRef.current = null;
        }
        pendingDisconnectRef.current = null;
        if (oldValue !== false) {
          if (__DEV__) {
            console.log('[useOnlineGame] opponentDisconnected changé:', {
              oldValue,
              newValue: false,
              reason: 'all_connected',
              otherPlayersCount: otherPlayers.length,
            });
          }
        }
        prevOpponentDisconnectedRef.current = false;
        setOpponentDisconnected(false);
        setDisconnectedPlayerName(null);
      }
    });

    return () => {
      unsub();
      if (disconnectGraceTimerRef.current) {
        clearTimeout(disconnectGraceTimerRef.current);
      }
    };
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

  const broadcastDuelStart = useCallback(
    (challengerId: string, opponentId: string, questions: Record<string, unknown>[]) => {
      if (!userId) return;
      multiplayerSync.sendAction({
        t: 'ev',
        p: userId,
        d: { type: 'duel', data: { challengerId, opponentId, questions } },
      });
    },
    [userId]
  );

  const broadcastDuelScore = useCallback(
    (score: number) => {
      if (!userId) return;
      multiplayerSync.sendAction({
        t: 'dr',
        p: userId,
        d: { score },
      });
    },
    [userId]
  );

  const broadcastDuelResult = useCallback(
    (result: RemoteDuelResult) => {
      if (!userId) return;
      console.log('[useOnlineGame] Broadcast résultat duel:', result);
      multiplayerSync.sendAction({
        t: 'dres',
        p: userId,
        d: {
          challengerId: result.challengerId,
          opponentId: result.opponentId,
          challengerScore: result.challengerScore,
          opponentScore: result.opponentScore,
          winnerId: result.winnerId,
        },
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

  const sendEmojiReaction = useCallback(
    (emoji: string, playerName: string) => {
      if (!userId) return;
      multiplayerSync.sendEmojiReaction(emoji, playerName);
    },
    [userId]
  );

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
    remoteDuelScore,
    clearRemoteDuelScore,
    remoteDuelResult,
    clearRemoteDuelResult,
    broadcastDuelStart,
    broadcastDuelScore,
    broadcastDuelResult,
    sendEmojiReaction,
    remoteEmojiReaction,
    clearRemoteEmojiReaction,
  };
}
