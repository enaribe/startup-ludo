/**
 * MultiplayerSync - Service de synchronisation temps réel
 *
 * Utilise Firebase Realtime Database pour la synchronisation
 * du jeu multijoueur (facturé par bande passante, économique).
 *
 * Structure RTDB:
 * rooms/{roomId}/
 *   ├── info (RealtimeRoom)
 *   ├── players/{playerId} (RealtimePlayer)
 *   ├── state (RealtimeGameState)
 *   ├── positions/{playerId} (PawnState[])
 *   ├── tokens/{playerId} (number)
 *   ├── actions/{actionId} (RealtimeAction)
 *   └── chat/{messageId} (ChatMessage)
 */

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

const PLAYER_COLORS: PlayerColor[] = ['yellow', 'blue', 'green', 'red'];

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

export class MultiplayerSync {
  private roomId: string | null = null;
  private playerId: string | null = null;
  private listeners: Map<string, () => void> = new Map();
  private eventCallbacks: Set<EventCallback> = new Set();
  private isConnected = false;

  // Note: Ces méthodes seront implémentées avec Firebase
  // Pour l'instant, elles simulent le comportement

  /**
   * Crée une nouvelle room
   */
  async createRoom(config: RoomConfig): Promise<{ roomId: string; code: string }> {
    const code = generateRoomCode();
    const roomId = `room_${Date.now()}_${code}`;

    // Room et player data préparées pour Firebase
    // TODO: Écrire dans Firebase RTDB
    // const room: RealtimeRoom = {
    //   id: roomId,
    //   code,
    //   hostId: config.hostId,
    //   status: 'waiting',
    //   edition: config.edition,
    //   maxPlayers: config.maxPlayers,
    //   createdAt: Date.now(),
    //   updatedAt: Date.now(),
    // };
    // const hostPlayer: RealtimePlayer = {
    //   id: config.hostId,
    //   name: config.hostName,
    //   color: 'yellow',
    //   isHost: true,
    //   isReady: false,
    //   isConnected: true,
    //   lastSeen: Date.now(),
    // };
    // await database().ref(`rooms/${roomId}/info`).set(room);
    // await database().ref(`rooms/${roomId}/players/${config.hostId}`).set(hostPlayer);
    void config; // Utilisation temporaire pour éviter erreur TS

    this.roomId = roomId;
    this.playerId = config.hostId;
    this.isConnected = true;

    // Simuler le succès
    console.log('[MultiplayerSync] Room created:', { roomId, code });

    return { roomId, code };
  }

  /**
   * Rejoint une room existante par code
   */
  async joinRoom(code: string, data: JoinRoomData): Promise<{ roomId: string; color: PlayerColor }> {
    // TODO: Chercher la room par code dans Firebase
    // const snapshot = await database().ref('rooms').orderByChild('code').equalTo(code).once('value');

    // Simuler la recherche
    const roomId = `room_simulated_${code}`;

    // Trouver une couleur disponible
    // TODO: Lire les joueurs existants pour déterminer les couleurs prises
    const availableColor = PLAYER_COLORS[1]!; // Simuler: bleu

    const player: RealtimePlayer = {
      id: data.playerId,
      displayName: data.playerName,
      name: data.playerName, // Backward compat
      color: availableColor,
      isHost: false,
      isReady: false,
      isConnected: true,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    // TODO: Écrire le joueur dans Firebase
    // await database().ref(`rooms/${roomId}/players/${data.playerId}`).set(player);

    this.roomId = roomId;
    this.playerId = data.playerId;
    this.isConnected = true;

    // Émettre l'événement
    this.emit({
      type: 'player_joined',
      data: player,
      timestamp: Date.now(),
    });

    console.log('[MultiplayerSync] Joined room:', { roomId, color: availableColor });

    return { roomId, color: availableColor };
  }

  /**
   * Quitte la room actuelle
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    // TODO: Supprimer le joueur de Firebase
    // await database().ref(`rooms/${this.roomId}/players/${this.playerId}`).remove();

    // Nettoyer les listeners
    this.cleanup();

    this.emit({
      type: 'player_left',
      data: { playerId: this.playerId },
      timestamp: Date.now(),
    });

    console.log('[MultiplayerSync] Left room');

    this.roomId = null;
    this.playerId = null;
    this.isConnected = false;
  }

  /**
   * Marquer le joueur comme prêt
   */
  async setReady(ready: boolean): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    // TODO: Mettre à jour dans Firebase
    // await database().ref(`rooms/${this.roomId}/players/${this.playerId}/isReady`).set(ready);

    this.emit({
      type: 'player_ready',
      data: { playerId: this.playerId, ready },
      timestamp: Date.now(),
    });

    console.log('[MultiplayerSync] Set ready:', ready);
  }

  /**
   * Démarre la partie (host uniquement)
   */
  async startGame(): Promise<string> {
    if (!this.roomId) throw new Error('Not in a room');

    const gameId = `game_${this.roomId}_${Date.now()}`;

    // TODO: Mettre à jour Firebase
    // const initialState: RealtimeGameState = {
    //   currentPlayerIndex: 0,
    //   currentTurn: 1,
    //   diceValue: null,
    //   diceRolled: false,
    //   phase: 'rolling',
    //   updatedAt: Date.now(),
    // };
    // await database().ref(`rooms/${this.roomId}/info/status`).set('playing');
    // await database().ref(`rooms/${this.roomId}/info/gameId`).set(gameId);
    // await database().ref(`rooms/${this.roomId}/state`).set(initialState);

    this.emit({
      type: 'game_started',
      data: { gameId },
      timestamp: Date.now(),
    });

    console.log('[MultiplayerSync] Game started:', gameId);

    return gameId;
  }

  /**
   * Envoie une action de jeu
   */
  async sendAction(action: Omit<RealtimeAction, 'id' | 'timestamp'>): Promise<void> {
    if (!this.roomId) return;

    const fullAction: RealtimeAction = {
      ...action,
      id: `action_${Date.now()}`,
      timestamp: Date.now(),
    };

    // TODO: Push dans Firebase (utilise push() pour ID auto)
    // await database().ref(`rooms/${this.roomId}/actions`).push(fullAction);

    console.log('[MultiplayerSync] Action sent:', fullAction);
  }

  /**
   * Met à jour l'état du jeu
   */
  async updateGameState(state: Partial<RealtimeGameState>): Promise<void> {
    if (!this.roomId) return;

    const update = {
      ...state,
      updatedAt: Date.now(),
    };

    // TODO: Mettre à jour Firebase
    // await database().ref(`rooms/${this.roomId}/state`).update(update);

    this.emit({
      type: 'state_updated',
      data: update,
      timestamp: Date.now(),
    });

    console.log('[MultiplayerSync] State updated:', update);
  }

  /**
   * Met à jour les positions des pions
   */
  async updatePositions(playerId: string, pawns: PawnState[]): Promise<void> {
    if (!this.roomId) return;

    // TODO: Mettre à jour Firebase
    // await database().ref(`rooms/${this.roomId}/positions/${playerId}`).set(pawns);

    console.log('[MultiplayerSync] Positions updated:', { playerId, pawns });
  }

  /**
   * Met à jour les jetons
   */
  async updateTokens(playerId: string, tokens: number): Promise<void> {
    if (!this.roomId) return;

    // TODO: Mettre à jour Firebase
    // await database().ref(`rooms/${this.roomId}/tokens/${playerId}`).set(tokens);

    console.log('[MultiplayerSync] Tokens updated:', { playerId, tokens });
  }

  /**
   * Envoie un emoji dans le chat
   */
  async sendEmoji(emoji: string): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      playerId: this.playerId,
      emoji,
      timestamp: Date.now(),
    };

    // TODO: Push dans Firebase
    // await database().ref(`rooms/${this.roomId}/chat`).push(message);

    this.emit({
      type: 'chat_message',
      data: message,
      timestamp: Date.now(),
    });

    console.log('[MultiplayerSync] Emoji sent:', emoji);
  }

  // ===== SUBSCRIPTIONS =====

  /**
   * S'abonne aux changements de la room
   */
  subscribeToRoom(_callback: (room: RealtimeRoom | null) => void): () => void {
    if (!this.roomId) return () => {};

    // TODO: Écouter Firebase
    // const ref = database().ref(`rooms/${this.roomId}/info`);
    // const unsubscribe = ref.on('value', snapshot => _callback(snapshot.val()));
    // this.listeners.set('room', () => ref.off('value', unsubscribe));

    const key = `room_${Date.now()}`;
    this.listeners.set(key, () => {});

    return () => {
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne aux joueurs
   */
  subscribeToPlayers(_callback: (players: Record<string, RealtimePlayer>) => void): () => void {
    if (!this.roomId) return () => {};

    // TODO: Écouter Firebase
    // const ref = database().ref(`rooms/${this.roomId}/players`);
    // const unsubscribe = ref.on('value', snapshot => _callback(snapshot.val() || {}));

    const key = `players_${Date.now()}`;
    this.listeners.set(key, () => {});

    return () => {
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne à l'état du jeu
   */
  subscribeToGameState(_callback: (state: RealtimeGameState | null) => void): () => void {
    if (!this.roomId) return () => {};

    // TODO: Écouter Firebase
    // const ref = database().ref(`rooms/${this.roomId}/state`);
    // const unsubscribe = ref.on('value', snapshot => _callback(snapshot.val()));

    const key = `state_${Date.now()}`;
    this.listeners.set(key, () => {});

    return () => {
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne aux actions (nouvelles uniquement)
   */
  subscribeToActions(_callback: (action: RealtimeAction) => void): () => void {
    if (!this.roomId) return () => {};

    // TODO: Écouter Firebase avec startAt(Date.now()) pour nouvelles actions seulement
    // const ref = database().ref(`rooms/${this.roomId}/actions`).orderByChild('timestamp').startAt(Date.now());
    // const unsubscribe = ref.on('child_added', snapshot => _callback(snapshot.val()));

    const key = `actions_${Date.now()}`;
    this.listeners.set(key, () => {});

    return () => {
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne au chat
   */
  subscribeToChat(_callback: (message: ChatMessage) => void): () => void {
    if (!this.roomId) return () => {};

    // TODO: Écouter Firebase
    // const ref = database().ref(`rooms/${this.roomId}/chat`);
    // const unsubscribe = ref.on('child_added', snapshot => _callback(snapshot.val()));

    const key = `chat_${Date.now()}`;
    this.listeners.set(key, () => {});

    return () => {
      this.listeners.delete(key);
    };
  }

  // ===== PRÉSENCE =====

  /**
   * Configure la gestion de présence (déconnexion automatique)
   */
  setupPresence(): void {
    if (!this.roomId || !this.playerId) return;

    // TODO: Configurer onDisconnect
    // const presenceRef = database().ref(`rooms/${this.roomId}/players/${this.playerId}`);
    // presenceRef.onDisconnect().update({ isConnected: false, lastSeen: database.ServerValue.TIMESTAMP });

    // Mettre à jour la présence périodiquement
    // setInterval(() => {
    //   presenceRef.update({ lastSeen: Date.now() });
    // }, 30000);

    console.log('[MultiplayerSync] Presence setup');
  }

  /**
   * Vérifie si un joueur est connecté
   */
  async checkPlayerConnection(_playerId: string): Promise<boolean> {
    if (!this.roomId) return false;

    // TODO: Lire depuis Firebase
    // const snapshot = await database().ref(`rooms/${this.roomId}/players/${_playerId}/isConnected`).once('value');
    // return snapshot.val() === true;

    return true; // Simulé
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
   * Nettoie tous les listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {
        // Ignorer les erreurs de cleanup
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
