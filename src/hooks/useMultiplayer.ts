/**
 * useMultiplayer - Hook pour la gestion du multijoueur
 *
 * Fournit une interface React pour le service MultiplayerSync
 * avec gestion automatique des subscriptions et du state.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  multiplayerSync,
  type RoomConfig,
  type ChatMessage,
  type RoomEvent,
} from '@/services/multiplayer';
import type {
  RealtimeRoom,
  RealtimePlayer,
  RealtimeGameState,
  RealtimeAction,
} from '@/services/firebase/config';
import type { PawnState } from '@/types';

// ===== TYPES =====

interface UseMultiplayerState {
  room: RealtimeRoom | null;
  players: Record<string, RealtimePlayer>;
  gameState: RealtimeGameState | null;
  chatMessages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseMultiplayerActions {
  createRoom: (config: Omit<RoomConfig, 'hostId'>) => Promise<{ roomId: string; code: string } | null>;
  joinRoom: (code: string, playerName: string) => Promise<{ roomId: string } | null>;
  leaveRoom: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<string | null>;
  sendAction: (action: Omit<RealtimeAction, 'id' | 'timestamp'>) => Promise<void>;
  updateGameState: (state: Partial<RealtimeGameState>) => Promise<void>;
  updatePositions: (playerId: string, pawns: PawnState[]) => Promise<void>;
  updateTokens: (playerId: string, tokens: number) => Promise<void>;
  sendEmoji: (emoji: string) => Promise<void>;
  clearError: () => void;
}

type UseMultiplayerReturn = UseMultiplayerState & UseMultiplayerActions;

// ===== HOOK =====

export function useMultiplayer(userId: string | null): UseMultiplayerReturn {
  const [state, setState] = useState<UseMultiplayerState>({
    room: null,
    players: {},
    gameState: null,
    chatMessages: [],
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const unsubscribesRef = useRef<(() => void)[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
    };
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = multiplayerSync.onEvent((event: RoomEvent) => {
      switch (event.type) {
        case 'player_joined':
        case 'player_left':
        case 'player_ready':
          // Les subscriptions géreront la mise à jour
          break;
        case 'game_started':
          setState((prev) => ({
            ...prev,
            room: prev.room
              ? { ...prev.room, status: 'playing' }
              : null,
          }));
          break;
        case 'chat_message':
          setState((prev) => ({
            ...prev,
            chatMessages: [...prev.chatMessages.slice(-49), event.data as ChatMessage],
          }));
          break;
        case 'connection_changed':
          setState((prev) => ({
            ...prev,
            isConnected: event.data as boolean,
          }));
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  // ===== ACTIONS =====

  const createRoom = useCallback(
    async (config: Omit<RoomConfig, 'hostId'>): Promise<{ roomId: string; code: string } | null> => {
      if (!userId) {
        setState((prev) => ({ ...prev, error: 'Utilisateur non connecté' }));
        return null;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await multiplayerSync.createRoom({
          ...config,
          hostId: userId,
        });

        // Setup subscriptions
        setupSubscriptions();

        // Setup presence
        multiplayerSync.setupPresence();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isConnected: true,
        }));

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la création';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return null;
      }
    },
    [userId]
  );

  const joinRoom = useCallback(
    async (code: string, playerName: string): Promise<{ roomId: string } | null> => {
      if (!userId) {
        setState((prev) => ({ ...prev, error: 'Utilisateur non connecté' }));
        return null;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await multiplayerSync.joinRoom(code, {
          odorId: userId,
          playerName,
        });

        // Setup subscriptions
        setupSubscriptions();

        // Setup presence
        multiplayerSync.setupPresence();

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isConnected: true,
        }));

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur lors de la connexion';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        return null;
      }
    },
    [userId]
  );

  const setupSubscriptions = useCallback(() => {
    // Clear existing subscriptions
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];

    // Subscribe to room
    const unsubRoom = multiplayerSync.subscribeToRoom((room) => {
      setState((prev) => ({ ...prev, room }));
    });
    unsubscribesRef.current.push(unsubRoom);

    // Subscribe to players
    const unsubPlayers = multiplayerSync.subscribeToPlayers((players) => {
      setState((prev) => ({ ...prev, players }));
    });
    unsubscribesRef.current.push(unsubPlayers);

    // Subscribe to game state
    const unsubState = multiplayerSync.subscribeToGameState((gameState) => {
      setState((prev) => ({ ...prev, gameState }));
    });
    unsubscribesRef.current.push(unsubState);

    // Subscribe to chat
    const unsubChat = multiplayerSync.subscribeToChat((message) => {
      setState((prev) => ({
        ...prev,
        chatMessages: [...prev.chatMessages.slice(-49), message],
      }));
    });
    unsubscribesRef.current.push(unsubChat);
  }, []);

  const leaveRoom = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await multiplayerSync.leaveRoom();

      // Clear subscriptions
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];

      setState({
        room: null,
        players: {},
        gameState: null,
        chatMessages: [],
        isConnected: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la déconnexion';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const setReady = useCallback(async (ready: boolean) => {
    try {
      await multiplayerSync.setReady(ready);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, []);

  const startGame = useCallback(async (): Promise<string | null> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const gameId = await multiplayerSync.startGame();
      setState((prev) => ({ ...prev, isLoading: false }));
      return gameId;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du lancement';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, []);

  const sendAction = useCallback(
    async (action: Omit<RealtimeAction, 'id' | 'timestamp'>) => {
      try {
        await multiplayerSync.sendAction(action);
      } catch (error) {
        console.error('[useMultiplayer] sendAction error:', error);
      }
    },
    []
  );

  const updateGameState = useCallback(
    async (gameStateUpdate: Partial<RealtimeGameState>) => {
      try {
        await multiplayerSync.updateGameState(gameStateUpdate);
      } catch (error) {
        console.error('[useMultiplayer] updateGameState error:', error);
      }
    },
    []
  );

  const updatePositions = useCallback(
    async (playerId: string, pawns: PawnState[]) => {
      try {
        await multiplayerSync.updatePositions(playerId, pawns);
      } catch (error) {
        console.error('[useMultiplayer] updatePositions error:', error);
      }
    },
    []
  );

  const updateTokens = useCallback(
    async (playerId: string, tokens: number) => {
      try {
        await multiplayerSync.updateTokens(playerId, tokens);
      } catch (error) {
        console.error('[useMultiplayer] updateTokens error:', error);
      }
    },
    []
  );

  const sendEmoji = useCallback(async (emoji: string) => {
    try {
      await multiplayerSync.sendEmoji(emoji);
    } catch (error) {
      console.error('[useMultiplayer] sendEmoji error:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    sendAction,
    updateGameState,
    updatePositions,
    updateTokens,
    sendEmoji,
    clearError,
  };
}
