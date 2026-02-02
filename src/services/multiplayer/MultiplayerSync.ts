/**
 * MultiplayerSync - Service de synchronisation temps réel
 *
 * Utilise Firebase Realtime Database pour la synchronisation
 * du jeu multijoueur (facturé par bande passante, économique).
 *
 * Structure RTDB:
 * rooms/{roomId}/
 *   ├── (room data: id, code, hostId, status, etc.)
 *   ├── players/{playerId} (RealtimePlayer)
 *   ├── state (RealtimeGameState)
 *   ├── actions/{actionId} (RealtimeAction)
 *   └── chat/{messageId} (ChatMessage)
 */

import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  onChildAdded,
  onDisconnect,
  type Unsubscribe,
} from 'firebase/database';
import {
  database,
  firebaseLog,
  getFirebaseErrorMessage,
  REALTIME_PATHS,
} from '@/services/firebase/config';
import type { PlayerColor, PawnState } from '@/types';
import type {
  RealtimeRoom,
  RealtimePlayer,
  RealtimeGameState,
  RealtimeAction,
} from '@/services/firebase/config';

// ===== TYPES =====

export interface RoomConfig {
  edition: string;
  maxPlayers: 2 | 3 | 4;
  hostId: string;
  hostName: string;
  roomName?: string;
  betAmount?: number;
  isQuickMatch?: boolean;
}

export interface JoinRoomData {
  playerId: string;
  playerName: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  emoji: string;
  timestamp: number;
}

export interface GamePositions {
  [playerId: string]: PawnState[];
}

export interface GameTokens {
  [playerId: string]: number;
}

export type RoomEventType =
  | 'player_joined'
  | 'player_left'
  | 'player_ready'
  | 'game_started'
  | 'game_ended'
  | 'state_updated'
  | 'action_received'
  | 'chat_message'
  | 'connection_changed';

export interface RoomEvent {
  type: RoomEventType;
  data: unknown;
  timestamp: number;
}

type EventCallback = (event: RoomEvent) => void;

// ===== COULEURS DISPONIBLES =====

// For 2 players: green (bottom-left) + blue (top-right) — opposite corners
// For 3-4 players: green, blue, yellow, red
const PLAYER_COLORS: PlayerColor[] = ['green', 'blue', 'yellow', 'red'];

// ===== GÉNÉRATION CODE =====

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ===== CLASSE PRINCIPALE =====

const PRESENCE_HEARTBEAT_MS = 10000; // Réaffirmer la présence toutes les 10s (évite fausses déconnexions après onDisconnect)

export class MultiplayerSync {
  private roomId: string | null = null;
  private playerId: string | null = null;
  private listeners: Map<string, Unsubscribe | (() => void)> = new Map();
  private eventCallbacks: Set<EventCallback> = new Set();
  private isConnected = false;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Crée une nouvelle room dans Firebase RTDB
   */
  async createRoom(config: RoomConfig): Promise<{ roomId: string; code: string }> {
    try {
      firebaseLog('Creating room', { hostId: config.hostId, hostName: config.hostName });

      const roomsRef = ref(database, REALTIME_PATHS.rooms);
      const newRoomRef = push(roomsRef);
      const roomId = newRoomRef.key!;
      const code = generateRoomCode();

      const roomData: RealtimeRoom = {
        id: roomId,
        code,
        hostId: config.hostId,
        status: 'waiting',
        edition: config.edition,
        maxPlayers: config.maxPlayers,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        gameSettings: {
          maxPlayers: config.maxPlayers,
          maxTurns: 30,
          tokenGoal: 1000,
        },
      };

      const hostPlayer: RealtimePlayer = {
        id: config.hostId,
        displayName: config.hostName,
        name: config.hostName,
        color: 'green',
        isHost: true,
        isReady: false,
        isConnected: true,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      };

      // Write room + host player to Firebase
      await set(ref(database, REALTIME_PATHS.room(roomId)), roomData);
      await set(ref(database, REALTIME_PATHS.roomPlayer(roomId, config.hostId)), hostPlayer);

      this.roomId = roomId;
      this.playerId = config.hostId;
      this.isConnected = true;

      // Setup presence detection and heartbeat
      this.setupPresence();
      this.startPresenceHeartbeat();

      firebaseLog('Room created successfully', { roomId, code });

      return { roomId, code };
    } catch (error) {
      firebaseLog('Failed to create room', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Rejoint une room existante par code
   */
  async joinRoom(code: string, data: JoinRoomData): Promise<{ roomId: string; color: PlayerColor }> {
    try {
      firebaseLog('Joining room by code', { code, playerId: data.playerId });

      // Search for the room by code
      const roomsRef = ref(database, REALTIME_PATHS.rooms);
      const snapshot = await get(roomsRef);

      if (!snapshot.exists()) {
        throw new Error('Aucun salon trouvé avec ce code');
      }

      let matchedRoom: RealtimeRoom | null = null;
      let matchedRoomId: string | null = null;

      snapshot.forEach((childSnapshot) => {
        const roomData = childSnapshot.val() as RealtimeRoom;
        if (roomData.code === code.toUpperCase()) {
          matchedRoom = roomData;
          matchedRoomId = childSnapshot.key;
        }
      });

      if (!matchedRoom || !matchedRoomId) {
        throw new Error('Aucun salon trouvé avec ce code');
      }

      // Re-assign to local const to satisfy TS narrowing
      const foundRoom: RealtimeRoom = matchedRoom;
      const foundRoomId: string = matchedRoomId;

      if (foundRoom.status !== 'waiting') {
        throw new Error('Ce salon n\'est plus disponible');
      }

      // Get existing players to determine available color
      const playersRef = ref(database, REALTIME_PATHS.roomPlayers(foundRoomId));
      const playersSnap = await get(playersRef);

      const usedColors = new Set<string>();
      if (playersSnap.exists()) {
        playersSnap.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          usedColors.add(player.color);
        });

        // Check max players
        const maxPlayers = foundRoom.maxPlayers ?? foundRoom.gameSettings?.maxPlayers ?? 4;
        if (playersSnap.size >= maxPlayers) {
          throw new Error('Ce salon est plein');
        }
      }

      const availableColor = PLAYER_COLORS.find((c) => !usedColors.has(c)) ?? 'yellow';

      const playerData: RealtimePlayer = {
        id: data.playerId,
        displayName: data.playerName,
        name: data.playerName,
        color: availableColor,
        isHost: false,
        isReady: false,
        isConnected: true,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      };

      // Write player to Firebase
      await set(ref(database, REALTIME_PATHS.roomPlayer(foundRoomId, data.playerId)), playerData);

      this.roomId = foundRoomId;
      this.playerId = data.playerId;
      this.isConnected = true;

      // Setup presence detection and heartbeat
      this.setupPresence();
      this.startPresenceHeartbeat();

      // Emit event
      this.emit({
        type: 'player_joined',
        data: playerData,
        timestamp: Date.now(),
      });

      firebaseLog('Joined room successfully', { roomId: foundRoomId, color: availableColor });

      return { roomId: foundRoomId, color: availableColor };
    } catch (error) {
      firebaseLog('Failed to join room', error);
      throw new Error(error instanceof Error ? error.message : getFirebaseErrorMessage(error));
    }
  }

  /**
   * Quitte la room actuelle
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      firebaseLog('Leaving room', { roomId: this.roomId, playerId: this.playerId });

      // Remove player from Firebase
      await remove(ref(database, REALTIME_PATHS.roomPlayer(this.roomId, this.playerId)));

      // Check if room is now empty
      const playersRef = ref(database, REALTIME_PATHS.roomPlayers(this.roomId));
      const playersSnap = await get(playersRef);

      if (!playersSnap.exists() || playersSnap.size === 0) {
        // Delete empty room
        await remove(ref(database, REALTIME_PATHS.room(this.roomId)));
        firebaseLog('Room deleted (empty)');
      }

      // Cleanup
      this.cleanup();

      this.emit({
        type: 'player_left',
        data: { playerId: this.playerId },
        timestamp: Date.now(),
      });

      firebaseLog('Left room successfully');

      this.roomId = null;
      this.playerId = null;
      this.isConnected = false;
    } catch (error) {
      firebaseLog('Failed to leave room', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Marquer le joueur comme prêt
   */
  async setReady(ready: boolean): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      firebaseLog('Setting player ready', { roomId: this.roomId, playerId: this.playerId, ready });

      await update(ref(database, REALTIME_PATHS.roomPlayer(this.roomId, this.playerId)), {
        isReady: ready,
      });

      this.emit({
        type: 'player_ready',
        data: { playerId: this.playerId, ready },
        timestamp: Date.now(),
      });

      firebaseLog('Player ready status updated');
    } catch (error) {
      firebaseLog('Failed to set player ready', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Démarre la partie (host uniquement)
   */
  async startGame(): Promise<string> {
    if (!this.roomId) throw new Error('Not in a room');

    try {
      firebaseLog('Starting game', { roomId: this.roomId });

      const gameId = `game_${this.roomId}_${Date.now()}`;

      // Get all player IDs
      const playersRef = ref(database, REALTIME_PATHS.roomPlayers(this.roomId));
      const playersSnap = await get(playersRef);

      const playerIds: string[] = [];
      const positions: Record<string, number> = {};
      const tokens: Record<string, number> = {};

      if (playersSnap.exists()) {
        playersSnap.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          playerIds.push(player.id);
          positions[player.id] = -1; // Start position
          tokens[player.id] = 0;
        });
      }

      // Initialize game state
      const initialState: RealtimeGameState = {
        s: 'playing',
        t: 0,
        d: null,
        p: positions,
        j: tokens,
      };

      // Update room status + set game ID
      await update(ref(database, REALTIME_PATHS.room(this.roomId)), {
        status: 'playing',
        gameId,
        updatedAt: Date.now(),
      });

      // Set initial game state
      await set(ref(database, REALTIME_PATHS.roomState(this.roomId)), initialState);

      this.emit({
        type: 'game_started',
        data: { gameId },
        timestamp: Date.now(),
      });

      firebaseLog('Game started', { gameId, playerCount: playerIds.length });

      return gameId;
    } catch (error) {
      firebaseLog('Failed to start game', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Envoie une action de jeu
   */
  async sendAction(action: Omit<RealtimeAction, 'id' | 'timestamp' | 'ts'>): Promise<void> {
    if (!this.roomId) {
      console.log('[MultiplayerSync.sendAction] Abandon: roomId absent');
      return;
    }

    console.log('[MultiplayerSync.sendAction] Envoi:', { type: action.t, p: action.p, d: action.d });

    try {
      const actionsRef = ref(database, REALTIME_PATHS.roomActions(this.roomId));
      const newActionRef = push(actionsRef);

      await set(newActionRef, {
        ...action,
        ts: Date.now(),
      });

      // Réaffirmer la présence à chaque action (évite fausse déconnexion si onDisconnect a été déclenché)
      this.updateMyPresence().catch(() => {});

      console.log('[MultiplayerSync.sendAction] OK:', action.t);
      firebaseLog('Action sent', { type: action.t });
    } catch (error) {
      console.error('[MultiplayerSync.sendAction] Erreur:', error);
      firebaseLog('Failed to send action', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Met à jour l'état du jeu
   */
  async updateGameState(state: Partial<RealtimeGameState>): Promise<void> {
    if (!this.roomId) return;

    try {
      await update(ref(database, REALTIME_PATHS.roomState(this.roomId)), state);

      this.emit({
        type: 'state_updated',
        data: state,
        timestamp: Date.now(),
      });

      firebaseLog('Game state updated');
    } catch (error) {
      firebaseLog('Failed to update game state', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Met à jour les positions des pions
   */
  async updatePositions(playerId: string, pawns: PawnState[]): Promise<void> {
    if (!this.roomId) return;

    try {
      await set(ref(database, `${REALTIME_PATHS.room(this.roomId)}/positions/${playerId}`), pawns);
      firebaseLog('Positions updated', { playerId });
    } catch (error) {
      firebaseLog('Failed to update positions', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Met à jour les jetons
   */
  async updateTokens(playerId: string, tokens: number): Promise<void> {
    if (!this.roomId) return;

    try {
      await set(ref(database, `${REALTIME_PATHS.room(this.roomId)}/tokens/${playerId}`), tokens);
      firebaseLog('Tokens updated', { playerId, tokens });
    } catch (error) {
      firebaseLog('Failed to update tokens', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Envoie un emoji dans le chat
   */
  async sendEmoji(emoji: string): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      const chatRef = ref(database, REALTIME_PATHS.roomChat(this.roomId));
      const newMessageRef = push(chatRef);

      const message = {
        userId: this.playerId,
        emoji,
        timestamp: Date.now(),
      };

      await set(newMessageRef, message);

      this.emit({
        type: 'chat_message',
        data: {
          id: newMessageRef.key ?? `msg_${Date.now()}`,
          playerId: this.playerId,
          emoji,
          timestamp: Date.now(),
        } satisfies ChatMessage,
        timestamp: Date.now(),
      });

      firebaseLog('Emoji sent', { emoji });
    } catch (error) {
      firebaseLog('Failed to send emoji', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  // ===== SUBSCRIPTIONS =====

  /**
   * S'abonne aux changements de la room
   */
  subscribeToRoom(callback: (room: RealtimeRoom | null) => void): () => void {
    if (!this.roomId) return () => {};

    const roomRef = ref(database, REALTIME_PATHS.room(this.roomId));

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as RealtimeRoom);
      } else {
        callback(null);
      }
    });

    const key = `room_${this.roomId}`;
    this.listeners.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne aux joueurs
   */
  subscribeToPlayers(callback: (players: Record<string, RealtimePlayer>) => void): () => void {
    if (!this.roomId) return () => {};

    const playersRef = ref(database, REALTIME_PATHS.roomPlayers(this.roomId));

    const unsubscribe = onValue(playersRef, (snapshot) => {
      const players: Record<string, RealtimePlayer> = {};
      const rawPresence: Record<string, { isConnected?: boolean; lastSeen?: number }> = {};
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          const key = child.key ?? player.id;
          players[key] = player;
          rawPresence[key] = { isConnected: player.isConnected, lastSeen: player.lastSeen };
        });
      }
      if (__DEV__) {
        console.log('[Presence] État joueurs RTDB (MultiplayerSync):', {
          timestamp: Date.now(),
          rawData: snapshot.exists() ? snapshot.val() : null,
          presenceByPlayer: rawPresence,
        });
      }
      callback(players);
    });

    const key = `players_${this.roomId}`;
    this.listeners.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne à l'état du jeu
   */
  subscribeToGameState(callback: (state: RealtimeGameState | null) => void): () => void {
    if (!this.roomId) return () => {};

    const stateRef = ref(database, REALTIME_PATHS.roomState(this.roomId));

    const unsubscribe = onValue(stateRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as RealtimeGameState);
      } else {
        callback(null);
      }
    });

    const key = `state_${this.roomId}`;
    this.listeners.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne aux actions (nouvelles uniquement via onChildAdded)
   */
  subscribeToActions(callback: (action: RealtimeAction) => void): () => void {
    if (!this.roomId) return () => {};

    const actionsRef = ref(database, REALTIME_PATHS.roomActions(this.roomId));

    // onChildAdded fires once per existing child then once per new child
    // We skip initial children by tracking init phase
    let initialLoadDone = false;
    let initialCount = 0;

    // First get the current count to skip existing actions
    get(actionsRef).then((snapshot) => {
      initialCount = snapshot.exists() ? snapshot.size : 0;
      initialLoadDone = true;
    }).catch(() => {
      initialLoadDone = true;
    });

    let received = 0;
    const unsubscribe = onChildAdded(actionsRef, (snapshot) => {
      received++;
      // Skip actions that existed before subscription
      if (!initialLoadDone || received <= initialCount) return;

      if (snapshot.exists()) {
        const action = snapshot.val() as RealtimeAction;
        const fullAction = { ...action, id: snapshot.key } as RealtimeAction;
        console.log('[MultiplayerSync.subscribeToActions] Nouvelle action reçue (RTDB):', {
          type: fullAction.t,
          from: fullAction.p,
          id: fullAction.id,
        });
        callback(fullAction);
      }
    });

    const key = `actions_${this.roomId}`;
    this.listeners.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne au chat
   */
  subscribeToChat(callback: (message: ChatMessage) => void): () => void {
    if (!this.roomId) return () => {};

    const chatRef = ref(database, REALTIME_PATHS.roomChat(this.roomId));
    let isInitialLoad = true;

    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      if (snapshot.exists()) {
        const messages: ChatMessage[] = [];
        snapshot.forEach((child) => {
          const val = child.val();
          messages.push({
            id: child.key ?? `msg_${Date.now()}`,
            playerId: val.userId ?? val.playerId,
            emoji: val.emoji,
            timestamp: val.timestamp,
          });
        });

        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          callback(latestMessage);
        }
      }
    });

    const key = `chat_${this.roomId}`;
    this.listeners.set(key, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(key);
    };
  }

  // ===== CHECKPOINTS =====

  /**
   * Sauvegarde un checkpoint compact de l'etat du jeu (pour reconnexion)
   */
  async saveCheckpoint(data: Record<string, unknown>): Promise<void> {
    if (!this.roomId) return;

    try {
      await set(ref(database, `${REALTIME_PATHS.room(this.roomId)}/checkpoint`), {
        ...data,
        ts: Date.now(),
      });
      firebaseLog('Checkpoint saved');
    } catch (error) {
      firebaseLog('Failed to save checkpoint', error);
    }
  }

  /**
   * Recupere le dernier checkpoint (pour reconnexion)
   */
  async getCheckpoint(): Promise<Record<string, unknown> | null> {
    if (!this.roomId) return null;

    try {
      const snap = await get(ref(database, `${REALTIME_PATHS.room(this.roomId)}/checkpoint`));
      return snap.exists() ? (snap.val() as Record<string, unknown>) : null;
    } catch (error) {
      firebaseLog('Failed to get checkpoint', error);
      return null;
    }
  }

  /**
   * Met a jour le statut de la room (pour fin de partie)
   */
  async updateRoomStatus(status: 'waiting' | 'playing' | 'finished'): Promise<void> {
    if (!this.roomId) return;

    try {
      await update(ref(database, REALTIME_PATHS.room(this.roomId)), {
        status,
        updatedAt: Date.now(),
      });
    } catch (error) {
      firebaseLog('Failed to update room status', error);
    }
  }

  // ===== PRÉSENCE =====

  /**
   * Réaffirme la présence du joueur local (isConnected: true, lastSeen).
   * Appelée après chaque action et par le heartbeat pour éviter les fausses déconnexions.
   */
  async updateMyPresence(): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      const playerRef = ref(database, REALTIME_PATHS.roomPlayer(this.roomId, this.playerId));
      const now = Date.now();
      await update(playerRef, { isConnected: true, lastSeen: now });
      if (__DEV__) {
        console.log('[Presence] updateMyPresence:', { playerId: this.playerId, lastSeen: now });
      }
    } catch (error) {
      firebaseLog('Failed to update my presence', error);
    }
  }

  /**
   * Configure la gestion de présence (déconnexion automatique)
   */
  setupPresence(): void {
    if (!this.roomId || !this.playerId) return;

    try {
      const playerRef = ref(database, REALTIME_PATHS.roomPlayer(this.roomId, this.playerId));

      // When disconnected, mark as not connected
      onDisconnect(playerRef).update({
        isConnected: false,
        lastSeen: Date.now(),
      });
      if (__DEV__) {
        console.log('[Presence] onDisconnect enregistré (room player):', {
          playerId: this.playerId,
          roomId: this.roomId,
          path: REALTIME_PATHS.roomPlayer(this.roomId, this.playerId),
          timestamp: Date.now(),
        });
      }

      // Also set user-level presence
      const presenceRef = ref(database, REALTIME_PATHS.userPresence(this.playerId));
      set(presenceRef, {
        online: true,
        lastSeen: Date.now(),
        currentRoom: this.roomId,
      });

      onDisconnect(presenceRef).set({
        online: false,
        lastSeen: Date.now(),
        currentRoom: null,
      });
      if (__DEV__) {
        console.log('[Presence] onDisconnect enregistré (user presence):', {
          playerId: this.playerId,
          path: REALTIME_PATHS.userPresence(this.playerId),
          timestamp: Date.now(),
        });
      }

      firebaseLog('Presence setup complete');
    } catch (error) {
      firebaseLog('Failed to setup presence', error);
    }
  }

  /**
   * Vérifie si un joueur est connecté
   */
  async checkPlayerConnection(playerId: string): Promise<boolean> {
    if (!this.roomId) return false;

    try {
      const playerRef = ref(database, REALTIME_PATHS.roomPlayer(this.roomId, playerId));
      const snapshot = await get(playerRef);

      if (snapshot.exists()) {
        const player = snapshot.val() as RealtimePlayer;
        return player.isConnected ?? false;
      }

      return false;
    } catch {
      return false;
    }
  }

  // ===== EVENT SYSTEM =====

  /**
   * S'abonne aux événements de la room
   */
  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => {
      this.eventCallbacks.delete(callback);
    };
  }

  private emit(event: RoomEvent): void {
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[MultiplayerSync] Event callback error:', error);
      }
    });
  }

  // ===== CLEANUP =====

  /**
   * Démarre le heartbeat de présence pour éviter les fausses déconnexions
   */
  startPresenceHeartbeat(): void {
    if (this.heartbeatIntervalId) return;

    this.heartbeatIntervalId = setInterval(() => {
      this.updateMyPresence().catch(() => {});
    }, PRESENCE_HEARTBEAT_MS);

    // Aussi mettre à jour immédiatement
    this.updateMyPresence().catch(() => {});

    if (__DEV__) {
      console.log('[Presence] Heartbeat démarré (intervalle:', PRESENCE_HEARTBEAT_MS, 'ms)');
    }
  }

  /**
   * Arrête le heartbeat de présence
   */
  stopPresenceHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
      if (__DEV__) {
        console.log('[Presence] Heartbeat arrêté');
      }
    }
  }

  /**
   * Nettoie tous les listeners et le heartbeat de présence
   */
  cleanup(): void {
    this.stopPresenceHeartbeat();
    this.listeners.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {
        // Ignore cleanup errors
      }
    });
    this.listeners.clear();
  }

  // ===== GETTERS =====

  getRoomId(): string | null {
    return this.roomId;
  }

  getPlayerId(): string | null {
    return this.playerId;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// ===== SINGLETON EXPORT =====

export const multiplayerSync = new MultiplayerSync();
