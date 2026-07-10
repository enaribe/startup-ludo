/**
 * MultiplayerSync - Service de synchronisation temps réel
 * MIGRATED TO @react-native-firebase/database
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

import database, { FirebaseDatabaseTypes } from '@react-native-firebase/database';
import { JoinRoomError, isNetworkError } from '@/services/multiplayer/JoinRoomError';
import { getProgramEnrollmentsForUser } from '@/services/firebase/programService';
import {
  firebaseLog,
  getFirebaseErrorMessage,
  REALTIME_PATHS,
} from '@/services/firebase/config';
import {
  setUserInGame,
  setUserOnline,
} from '@/services/firebase/presenceService';
import type { PlayerColor, PawnState } from '@/types';
import type {
  RealtimeRoom,
  RealtimePlayer,
  RealtimeGameState,
  RealtimeAction,
  MatchmakingTicket,
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
  /** Salon d'un parcours PROGRAMME (absent = partie normale). */
  program?: {
    programId: string;
    partnerId: string;
    contentPackId?: string;
    levelIndex: number;
  };
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
  | 'player_startup_selected'
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
  private listeners: Map<string, () => void> = new Map();
  private eventCallbacks: Set<EventCallback> = new Set();
  private isConnected = false;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Crée une nouvelle room dans Firebase RTDB
   */
  async createRoom(config: RoomConfig): Promise<{ roomId: string; code: string }> {
    try {
      firebaseLog('Creating room', { hostId: config.hostId, hostName: config.hostName });

      const roomsRef = database().ref(REALTIME_PATHS.rooms);
      const newRoomRef = roomsRef.push();
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
        // Mise par joueur (FCFA). On n'écrit le champ que si > 0 (RTDB n'accepte pas undefined).
        ...(config.betAmount && config.betAmount > 0 ? { stake: config.betAmount } : {}),
        // Contexte programme : source de vérité partagée pour charger le même contenu.
        ...(config.program
          ? {
              program: {
                programId: config.program.programId,
                partnerId: config.program.partnerId,
                levelIndex: config.program.levelIndex,
                ...(config.program.contentPackId ? { contentPackId: config.program.contentPackId } : {}),
              },
            }
          : {}),
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
      await database().ref(REALTIME_PATHS.room(roomId)).set(roomData);
      await database().ref(REALTIME_PATHS.roomPlayer(roomId, config.hostId)).set(hostPlayer);

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
      const roomsRef = database().ref(REALTIME_PATHS.rooms);
      const snapshot = await roomsRef.once('value');

      if (!snapshot.exists()) {
        throw new JoinRoomError('ROOM_NOT_FOUND', 'Aucun salon trouvé avec ce code');
      }

      let matchedRoom: RealtimeRoom | null = null;
      let matchedRoomId: string | null = null;

      snapshot.forEach((childSnapshot) => {
        const roomData = childSnapshot.val() as RealtimeRoom;
        if (roomData.code === code.toUpperCase()) {
          matchedRoom = roomData;
          matchedRoomId = childSnapshot.key;
          return true; // Stop iteration
        }
        return undefined;
      });

      if (!matchedRoom || !matchedRoomId) {
        throw new JoinRoomError('ROOM_NOT_FOUND', 'Aucun salon trouvé avec ce code');
      }

      // Re-assign to local const to satisfy TS narrowing
      const foundRoom: RealtimeRoom = matchedRoom;
      const foundRoomId: string = matchedRoomId;

      if (foundRoom.status === 'playing') {
        throw new JoinRoomError('ROOM_STARTED', 'Cette partie a déjà commencé');
      }
      if (foundRoom.status === 'finished') {
        throw new JoinRoomError('ROOM_FINISHED', 'Cette partie est terminée');
      }
      if (foundRoom.status !== 'waiting') {
        throw new JoinRoomError('ROOM_STARTED', 'Ce salon n\'est plus disponible');
      }

      // Salon PROGRAMME : réservé aux joueurs inscrits à ce programme.
      if (foundRoom.program?.programId) {
        const enrollments = await getProgramEnrollmentsForUser(data.playerId);
        const enrolled = enrollments.some((e) => e.programId === foundRoom.program!.programId);
        if (!enrolled) {
          throw new JoinRoomError('NOT_ENROLLED', 'Ce salon est réservé aux joueurs inscrits à ce programme.');
        }
      }

      // Get existing players to determine available color
      const playersRef = database().ref(REALTIME_PATHS.roomPlayers(foundRoomId));
      const playersSnap = await playersRef.once('value');

      const usedColors = new Set<string>();
      if (playersSnap.exists()) {
        let playerCount = 0;
        playersSnap.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          usedColors.add(player.color);
          playerCount++;
          return undefined;
        });

        // Check max players
        const maxPlayers = foundRoom.maxPlayers ?? foundRoom.gameSettings?.maxPlayers ?? 4;
        if (playerCount >= maxPlayers) {
          throw new JoinRoomError('ROOM_FULL', 'Ce salon est plein');
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
      await database().ref(REALTIME_PATHS.roomPlayer(foundRoomId, data.playerId)).set(playerData);

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
      if (error instanceof JoinRoomError) {
        throw error;
      }
      if (isNetworkError(error)) {
        throw new JoinRoomError('NETWORK_ERROR', 'Erreur réseau');
      }
      throw new JoinRoomError(
        'UNKNOWN',
        error instanceof Error ? error.message : getFirebaseErrorMessage(error)
      );
    }
  }

  /**
   * Rejoint une room existante directement par son ID (sans code).
   * Utilisé par le match rapide : les joueurs reçoivent le roomId via leur ticket.
   */
  async joinRoomById(roomId: string, data: JoinRoomData): Promise<{ roomId: string; color: PlayerColor }> {
    try {
      firebaseLog('Joining room by id', { roomId, playerId: data.playerId });

      const roomSnap = await database().ref(REALTIME_PATHS.room(roomId)).once('value');
      if (!roomSnap.exists()) {
        throw new JoinRoomError('ROOM_NOT_FOUND', 'Salon introuvable');
      }

      const room = roomSnap.val() as RealtimeRoom;
      if (room.status === 'playing') {
        throw new JoinRoomError('ROOM_STARTED', 'Cette partie a déjà commencé');
      }
      if (room.status === 'finished') {
        throw new JoinRoomError('ROOM_FINISHED', 'Cette partie est terminée');
      }
      if (room.status !== 'waiting') {
        throw new JoinRoomError('ROOM_STARTED', 'Ce salon n\'est plus disponible');
      }

      const playersRef = database().ref(REALTIME_PATHS.roomPlayers(roomId));
      const playersSnap = await playersRef.once('value');

      const usedColors = new Set<string>();
      let playerCount = 0;
      if (playersSnap.exists()) {
        playersSnap.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          // Si déjà présent (reconnexion), on réutilise sa couleur
          if (child.key === data.playerId) {
            this.roomId = roomId;
            this.playerId = data.playerId;
            this.isConnected = true;
            this.setupPresence();
            this.startPresenceHeartbeat();
          }
          usedColors.add(player.color);
          playerCount++;
          return undefined;
        });
      }

      // Si le joueur est déjà dans la room, pas besoin de le re-ajouter
      if (this.roomId === roomId && this.playerId === data.playerId) {
        const existing = playersSnap.child(data.playerId).val() as RealtimePlayer | null;
        return { roomId, color: existing?.color ?? 'yellow' };
      }

      const maxPlayers = room.maxPlayers ?? room.gameSettings?.maxPlayers ?? 4;
      if (playerCount >= maxPlayers) {
        throw new JoinRoomError('ROOM_FULL', 'Ce salon est plein');
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

      await database().ref(REALTIME_PATHS.roomPlayer(roomId, data.playerId)).set(playerData);

      this.roomId = roomId;
      this.playerId = data.playerId;
      this.isConnected = true;

      this.setupPresence();
      this.startPresenceHeartbeat();

      this.emit({
        type: 'player_joined',
        data: playerData,
        timestamp: Date.now(),
      });

      firebaseLog('Joined room by id successfully', { roomId, color: availableColor });
      return { roomId, color: availableColor };
    } catch (error) {
      firebaseLog('Failed to join room by id', error);
      if (error instanceof JoinRoomError) {
        throw error;
      }
      if (isNetworkError(error)) {
        throw new JoinRoomError('NETWORK_ERROR', 'Erreur réseau');
      }
      throw new JoinRoomError(
        'UNKNOWN',
        error instanceof Error ? error.message : getFirebaseErrorMessage(error)
      );
    }
  }

  /**
   * Quitte la room actuelle
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      firebaseLog('Leaving room', { roomId: this.roomId, playerId: this.playerId });

      // Lire la room pour savoir si on est l'hôte et si la partie a démarré
      const roomSnap = await database().ref(REALTIME_PATHS.room(this.roomId)).once('value');
      const room = roomSnap.val() as RealtimeRoom | null;
      const isHost = !!room && room.hostId === this.playerId;
      const gameNotStarted = !room || room.status === 'waiting';

      if (isHost && gameNotStarted) {
        // L'hôte quitte la salle d'attente : on dissout tout le salon.
        // La suppression de la room notifie les autres clients via subscribeToRoom.
        await database().ref(REALTIME_PATHS.room(this.roomId)).remove();
        firebaseLog('Room deleted (host left waiting room)');
      } else {
        // Joueur non-hôte (ou partie déjà en cours) : on retire juste ce joueur.
        await database().ref(REALTIME_PATHS.roomPlayer(this.roomId, this.playerId)).remove();

        // Si la room est maintenant vide, on la supprime.
        const playersRef = database().ref(REALTIME_PATHS.roomPlayers(this.roomId));
        const playersSnap = await playersRef.once('value');
        if (!playersSnap.exists() || playersSnap.numChildren() === 0) {
          await database().ref(REALTIME_PATHS.room(this.roomId)).remove();
          firebaseLog('Room deleted (empty)');
        }
      }

      // Cleanup
      const leavingPlayerId = this.playerId;
      this.cleanup();
      if (leavingPlayerId) {
        setUserOnline(leavingPlayerId).catch(() => {});
      }

      this.emit({
        type: 'player_left',
        data: { playerId: leavingPlayerId },
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

      await database().ref(REALTIME_PATHS.roomPlayer(this.roomId, this.playerId)).update({
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
   * Définir la startup sélectionnée pour ce joueur
   * @param sector - Secteur du projet (permet de calculer l'édition du joueur)
   */
  async setStartupSelection(startupId: string, startupName: string, isDefaultProject: boolean, sector?: string): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      firebaseLog('Setting startup selection', { roomId: this.roomId, startupId, startupName, isDefaultProject, sector });

      // Calculer l'édition basée sur le secteur
      let edition: string | undefined;
      if (sector) {
        const { getSectorEdition } = await import('@/data/defaultProjects');
        edition = getSectorEdition(sector);
      }

      await database().ref(REALTIME_PATHS.roomPlayer(this.roomId, this.playerId)).update({
        startupId,
        startupName,
        isDefaultProject,
        ...(sector && { sector }),
        ...(edition && { edition }),
      });

      this.emit({
        type: 'player_startup_selected',
        data: { playerId: this.playerId, startupId, startupName, isDefaultProject, sector, edition },
        timestamp: Date.now(),
      });

      firebaseLog('Startup selection updated', { edition });
    } catch (error) {
      firebaseLog('Failed to set startup selection', error);
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
      const playersRef = database().ref(REALTIME_PATHS.roomPlayers(this.roomId));
      const playersSnap = await playersRef.once('value');

      const playerIds: string[] = [];
      const positions: Record<string, number> = {};
      const tokens: Record<string, number> = {};

      if (playersSnap.exists()) {
        playersSnap.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          playerIds.push(player.id);
          positions[player.id] = -1; // Start position
          tokens[player.id] = 0;
          return undefined;
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
      await database().ref(REALTIME_PATHS.room(this.roomId)).update({
        status: 'playing',
        gameId,
        updatedAt: Date.now(),
      });

      // Set initial game state
      await database().ref(REALTIME_PATHS.roomState(this.roomId)).set(initialState);

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
      const actionsRef = database().ref(REALTIME_PATHS.roomActions(this.roomId));
      const newActionRef = actionsRef.push();

      await newActionRef.set({
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
      await database().ref(REALTIME_PATHS.roomState(this.roomId)).update(state);

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
      await database().ref(`${REALTIME_PATHS.room(this.roomId)}/positions/${playerId}`).set(pawns);
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
      await database().ref(`${REALTIME_PATHS.room(this.roomId)}/tokens/${playerId}`).set(tokens);
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
      const chatRef = database().ref(REALTIME_PATHS.roomChat(this.roomId));
      const newMessageRef = chatRef.push();

      const message = {
        userId: this.playerId,
        emoji,
        timestamp: Date.now(),
      };

      await newMessageRef.set(message);

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

  /**
   * Envoie une reaction emoji aux autres joueurs (affichage en overlay)
   */
  async sendEmojiReaction(emoji: string, playerName: string): Promise<void> {
    if (!this.roomId || !this.playerId) return;

    try {
      const action: Omit<RealtimeAction, 'id' | 'timestamp' | 'ts'> = {
        t: 'em',
        p: this.playerId,
        d: { emoji, name: playerName },
      };

      await this.sendAction(action);
      firebaseLog('Emoji reaction sent', { emoji });
    } catch (error) {
      firebaseLog('Failed to send emoji reaction', error);
    }
  }

  // ===== SUBSCRIPTIONS =====

  /**
   * S'abonne aux changements de la room
   */
  subscribeToRoom(callback: (room: RealtimeRoom | null) => void): () => void {
    if (!this.roomId) return () => {};

    const roomRef = database().ref(REALTIME_PATHS.room(this.roomId));

    const onValueCallback = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as RealtimeRoom);
      } else {
        callback(null);
      }
    };

    roomRef.on('value', onValueCallback);

    const key = `room_${this.roomId}`;
    this.listeners.set(key, () => roomRef.off('value', onValueCallback));

    return () => {
      roomRef.off('value', onValueCallback);
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne aux joueurs
   */
  subscribeToPlayers(callback: (players: Record<string, RealtimePlayer>) => void): () => void {
    if (!this.roomId) return () => {};

    const playersRef = database().ref(REALTIME_PATHS.roomPlayers(this.roomId));

    const onValueCallback = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      const players: Record<string, RealtimePlayer> = {};
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const player = child.val() as RealtimePlayer;
          const key = child.key ?? player.id;
          players[key] = player;
          return undefined;
        });
      }
      callback(players);
    };

    playersRef.on('value', onValueCallback);

    const key = `players_${this.roomId}`;
    this.listeners.set(key, () => playersRef.off('value', onValueCallback));

    return () => {
      playersRef.off('value', onValueCallback);
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne à l'état du jeu
   */
  subscribeToGameState(callback: (state: RealtimeGameState | null) => void): () => void {
    if (!this.roomId) return () => {};

    const stateRef = database().ref(REALTIME_PATHS.roomState(this.roomId));

    const onValueCallback = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as RealtimeGameState);
      } else {
        callback(null);
      }
    };

    stateRef.on('value', onValueCallback);

    const key = `state_${this.roomId}`;
    this.listeners.set(key, () => stateRef.off('value', onValueCallback));

    return () => {
      stateRef.off('value', onValueCallback);
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne aux actions (nouvelles uniquement via child_added)
   */
  subscribeToActions(callback: (action: RealtimeAction) => void): () => void {
    if (!this.roomId) return () => {};

    const actionsRef = database().ref(REALTIME_PATHS.roomActions(this.roomId));

    // child_added fires once per existing child then once per new child
    // We skip initial children by tracking init phase
    let initialLoadDone = false;
    let initialCount = 0;

    // First get the current count to skip existing actions
    actionsRef.once('value').then((snapshot) => {
      initialCount = snapshot.exists() ? snapshot.numChildren() : 0;
      initialLoadDone = true;
    }).catch(() => {
      initialLoadDone = true;
    });

    let received = 0;
    const onChildAdded = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
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
    };

    actionsRef.on('child_added', onChildAdded);

    const key = `actions_${this.roomId}`;
    this.listeners.set(key, () => actionsRef.off('child_added', onChildAdded));

    return () => {
      actionsRef.off('child_added', onChildAdded);
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne au chat
   */
  subscribeToChat(callback: (message: ChatMessage) => void): () => void {
    if (!this.roomId) return () => {};

    const chatRef = database().ref(REALTIME_PATHS.roomChat(this.roomId));
    let isInitialLoad = true;

    const onValueCallback = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
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
          return undefined;
        });

        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          callback(latestMessage);
        }
      }
    };

    chatRef.on('value', onValueCallback);

    const key = `chat_${this.roomId}`;
    this.listeners.set(key, () => chatRef.off('value', onValueCallback));

    return () => {
      chatRef.off('value', onValueCallback);
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
      await database().ref(`${REALTIME_PATHS.room(this.roomId)}/checkpoint`).set({
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
      const snap = await database().ref(`${REALTIME_PATHS.room(this.roomId)}/checkpoint`).once('value');
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
      await database().ref(REALTIME_PATHS.room(this.roomId)).update({
        status,
        updatedAt: Date.now(),
      });
      if (status === 'finished' && this.playerId) {
        setUserOnline(this.playerId).catch(() => {});
      } else if (status === 'playing' && this.playerId) {
        setUserInGame(this.playerId, this.roomId).catch(() => {});
      }
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
      const playerRef = database().ref(REALTIME_PATHS.roomPlayer(this.roomId, this.playerId));
      const now = Date.now();
      await playerRef.update({ isConnected: true, lastSeen: now });
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
      const playerRef = database().ref(REALTIME_PATHS.roomPlayer(this.roomId, this.playerId));

      // When disconnected, mark as not connected
      playerRef.onDisconnect().update({
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

      setUserInGame(this.playerId, this.roomId).catch(() => {});

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
      const playerRef = database().ref(REALTIME_PATHS.roomPlayer(this.roomId, playerId));
      const snapshot = await playerRef.once('value');

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

  // ===== MATCHMAKING (MATCH RAPIDE) =====

  /**
   * Dépose un ticket dans la file d'attente match rapide.
   * Le ticket est auto-supprimé si le joueur se déconnecte (onDisconnect).
   */
  async enqueueMatchmakingTicket(
    payload: Omit<MatchmakingTicket, 'id' | 'createdAt' | 'status' | 'roomId'>
  ): Promise<string> {
    try {
      const queueRef = database().ref(REALTIME_PATHS.matchmakingQueue);
      const newTicketRef = queueRef.push();
      const ticketId = newTicketRef.key!;

      const ticket: MatchmakingTicket = {
        ...payload,
        id: ticketId,
        createdAt: Date.now(),
        status: 'waiting',
        roomId: null,
        // RTDB n'accepte pas undefined : on force 0 si pas de mise.
        stake: payload.stake ?? 0,
      };

      await newTicketRef.set(ticket);
      // Auto-cleanup si le joueur ferme l'app
      await newTicketRef.onDisconnect().remove();

      firebaseLog('Matchmaking ticket enqueued', { ticketId, maxPlayers: payload.maxPlayers });
      return ticketId;
    } catch (error) {
      firebaseLog('Failed to enqueue matchmaking ticket', error);
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Supprime un ticket de la file (annulation volontaire ou fin de match).
   */
  async removeMatchmakingTicket(ticketId: string): Promise<void> {
    try {
      const ref = database().ref(REALTIME_PATHS.matchmakingTicket(ticketId));
      await ref.onDisconnect().cancel();
      await ref.remove();
      firebaseLog('Matchmaking ticket removed', { ticketId });
    } catch (error) {
      firebaseLog('Failed to remove matchmaking ticket', error);
    }
  }

  /**
   * S'abonne à la file d'attente globale (triée par createdAt).
   * Retourne la liste complète des tickets à chaque changement.
   */
  subscribeToMatchmakingQueue(
    callback: (tickets: MatchmakingTicket[]) => void
  ): () => void {
    const queueRef = database()
      .ref(REALTIME_PATHS.matchmakingQueue)
      .orderByChild('createdAt');

    const onValueCallback = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      const tickets: MatchmakingTicket[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const ticket = child.val() as MatchmakingTicket;
          tickets.push({ ...ticket, id: child.key ?? ticket.id });
          return undefined;
        });
      }
      callback(tickets);
    };

    queueRef.on('value', onValueCallback);

    const key = `mm_queue_${Date.now()}`;
    this.listeners.set(key, () => queueRef.off('value', onValueCallback));

    return () => {
      queueRef.off('value', onValueCallback);
      this.listeners.delete(key);
    };
  }

  /**
   * S'abonne à un ticket spécifique pour savoir quand il est matché.
   */
  subscribeToMatchmakingTicket(
    ticketId: string,
    callback: (ticket: MatchmakingTicket | null) => void
  ): () => void {
    const ticketRef = database().ref(REALTIME_PATHS.matchmakingTicket(ticketId));

    const onValueCallback = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as MatchmakingTicket);
      } else {
        callback(null);
      }
    };

    ticketRef.on('value', onValueCallback);

    const key = `mm_ticket_${ticketId}`;
    this.listeners.set(key, () => ticketRef.off('value', onValueCallback));

    return () => {
      ticketRef.off('value', onValueCallback);
      this.listeners.delete(key);
    };
  }

  /**
   * Tente de verrouiller N tickets (transition waiting → matching) de manière atomique.
   * Retourne true si le lock réussit pour TOUS les tickets, false sinon.
   * Si ça échoue, le caller doit réessayer au prochain tick de la queue.
   */
  private async lockTickets(ticketIds: string[]): Promise<boolean> {
    let allLocked = true;

    for (const ticketId of ticketIds) {
      const ref = database().ref(REALTIME_PATHS.matchmakingTicket(ticketId));
      const txResult = await ref.transaction((current: MatchmakingTicket | null) => {
        if (!current) return; // abort
        if (current.status !== 'waiting') return; // abort
        return { ...current, status: 'matching' };
      });

      if (!txResult.committed || !txResult.snapshot.exists()) {
        allLocked = false;
        break;
      }
    }

    // Si un lock a échoué, on relâche les tickets déjà lockés
    if (!allLocked) {
      await Promise.all(
        ticketIds.map((id) =>
          database()
            .ref(REALTIME_PATHS.matchmakingTicket(id))
            .transaction((current: MatchmakingTicket | null) => {
              if (!current) return;
              if (current.status !== 'matching') return;
              return { ...current, status: 'waiting' };
            })
            .catch(() => {})
        )
      );
    }

    return allLocked;
  }

  /**
   * Marque N tickets comme matchés, avec le roomId.
   * Appelée par le "lead" une fois la room créée.
   */
  async markTicketsMatched(ticketIds: string[], roomId: string): Promise<void> {
    await Promise.all(
      ticketIds.map((id) =>
        database()
          .ref(REALTIME_PATHS.matchmakingTicket(id))
          .update({ status: 'matched' as const, roomId })
          .catch((err) => firebaseLog('Failed to mark ticket matched', { id, err }))
      )
    );
  }

  /**
   * Logique "lead" : appelée quand on détecte que notre ticket est le plus ancien
   * parmi un groupe de N compatibles. Lock les tickets, crée la room, les marque matched.
   *
   * @returns roomId si le match a été créé, null si un autre lead a pris la main
   */
  async tryCreateRoomFromTickets(
    tickets: MatchmakingTicket[],
    hostUserId: string,
    hostDisplayName: string
  ): Promise<string | null> {
    if (tickets.length === 0) return null;

    const ticketIds = tickets.map((t) => t.id);
    const host = tickets.find((t) => t.userId === hostUserId);
    if (!host) {
      firebaseLog('Lead ticket not found in group, aborting');
      return null;
    }

    // Phase 1 : lock atomique
    const locked = await this.lockTickets(ticketIds);
    if (!locked) {
      firebaseLog('Failed to lock tickets, another lead got them');
      return null;
    }

    try {
      // Phase 2 : créer la room en tant que host
      const { roomId } = await this.createRoom({
        edition: host.edition,
        maxPlayers: host.maxPlayers,
        hostId: hostUserId,
        hostName: hostDisplayName,
        isQuickMatch: true,
        betAmount: host.stake ?? 0,
      });

      // Le host a déjà été ajouté par createRoom avec isHost=true, on propage sa startup
      await this.setStartupSelection(
        host.startupId,
        host.startupName,
        host.isDefaultProject,
        host.sector
      );

      // Phase 3 : notifier les autres tickets
      await this.markTicketsMatched(ticketIds, roomId);

      firebaseLog('Match created from tickets', { roomId, ticketIds });
      return roomId;
    } catch (error) {
      firebaseLog('Failed to create room from tickets, releasing locks', error);
      // Relâcher les tickets en cas d'échec
      await Promise.all(
        ticketIds.map((id) =>
          database()
            .ref(REALTIME_PATHS.matchmakingTicket(id))
            .transaction((current: MatchmakingTicket | null) => {
              if (!current) return;
              if (current.status !== 'matching') return;
              return { ...current, status: 'waiting' };
            })
            .catch(() => {})
        )
      );
      return null;
    }
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

  /**
   * Appelé quand la room disparaît côté serveur (ex. hôte parti avant démarrage).
   * Nettoie uniquement l'état local, sans tenter d'écrire dans une room supprimée.
   */
  handleRemoteRoomClosed(): void {
    const playerId = this.playerId;
    this.cleanup();
    if (playerId) {
      setUserOnline(playerId).catch(() => {});
    }
    this.roomId = null;
    this.playerId = null;
    this.isConnected = false;
    this.emit({
      type: 'connection_changed',
      data: false,
      timestamp: Date.now(),
    });
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
