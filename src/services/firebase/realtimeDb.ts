// Firebase Realtime Database Service for Multiplayer
import {
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  onDisconnect,
} from 'firebase/database';
import {
  database,
  firebaseLog,
  getFirebaseErrorMessage,
  REALTIME_PATHS,
  type RealtimeRoom,
  type RealtimePlayer,
  type RealtimeGameState,
  type RealtimeAction,
  type RealtimePresence,
} from './config';

// ===== ROOM MANAGEMENT =====

// Generate a unique 6-character room code
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar chars (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create a new multiplayer room
export const createRoom = async (
  hostId: string,
  hostName: string,
  settings: RealtimeRoom['gameSettings']
): Promise<{ roomId: string; code: string }> => {
  try {
    firebaseLog('Creating room', { hostId, hostName });

    const roomsRef = ref(database, REALTIME_PATHS.rooms);
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;
    const code = generateRoomCode();

    const roomData: RealtimeRoom = {
      id: roomId,
      code,
      hostId,
      status: 'waiting',
      createdAt: Date.now(),
      gameSettings: settings,
    };

    const hostPlayer: RealtimePlayer = {
      id: hostId,
      displayName: hostName,
      color: 'yellow',
      isReady: false,
      joinedAt: Date.now(),
    };

    // Create room with host as first player
    await set(ref(database, REALTIME_PATHS.room(roomId)), roomData);
    await set(ref(database, REALTIME_PATHS.roomPlayer(roomId, hostId)), hostPlayer);

    firebaseLog('Room created successfully', { roomId, code });
    return { roomId, code };
  } catch (error) {
    firebaseLog('Failed to create room', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Find room by code
export const findRoomByCode = async (code: string): Promise<RealtimeRoom | null> => {
  try {
    firebaseLog('Finding room by code', { code });

    // Note: This requires an index on 'code' field
    // For now, we'll fetch all rooms and filter (not ideal for production)
    const roomsRef = ref(database, REALTIME_PATHS.rooms);
    const snapshot = await get(roomsRef);

    if (!snapshot.exists()) {
      return null;
    }

    let foundRoom: RealtimeRoom | null = null;
    snapshot.forEach((childSnapshot) => {
      const room = childSnapshot.val() as RealtimeRoom;
      if (room.code === code.toUpperCase()) {
        foundRoom = room;
      }
    });

    firebaseLog('Room search result', { found: !!foundRoom });
    return foundRoom;
  } catch (error) {
    firebaseLog('Failed to find room', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Join a room
export const joinRoom = async (
  roomId: string,
  playerId: string,
  playerName: string
): Promise<RealtimePlayer> => {
  try {
    firebaseLog('Joining room', { roomId, playerId, playerName });

    // Get current players to determine color
    const playersRef = ref(database, REALTIME_PATHS.roomPlayers(roomId));
    const playersSnap = await get(playersRef);

    const usedColors = new Set<string>();
    if (playersSnap.exists()) {
      playersSnap.forEach((child) => {
        const player = child.val() as RealtimePlayer;
        usedColors.add(player.color);
      });
    }

    // Assign first available color
    const colors: RealtimePlayer['color'][] = ['yellow', 'blue', 'green', 'red'];
    const availableColor = colors.find((c) => !usedColors.has(c)) ?? 'yellow';

    const playerData: RealtimePlayer = {
      id: playerId,
      displayName: playerName,
      color: availableColor,
      isReady: false,
      joinedAt: Date.now(),
    };

    await set(ref(database, REALTIME_PATHS.roomPlayer(roomId, playerId)), playerData);

    firebaseLog('Joined room successfully', { color: availableColor });
    return playerData;
  } catch (error) {
    firebaseLog('Failed to join room', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Leave a room
export const leaveRoom = async (roomId: string, playerId: string): Promise<void> => {
  try {
    firebaseLog('Leaving room', { roomId, playerId });

    await remove(ref(database, REALTIME_PATHS.roomPlayer(roomId, playerId)));

    // Check if room is now empty
    const playersRef = ref(database, REALTIME_PATHS.roomPlayers(roomId));
    const playersSnap = await get(playersRef);

    if (!playersSnap.exists() || playersSnap.size === 0) {
      // Delete empty room
      await remove(ref(database, REALTIME_PATHS.room(roomId)));
      firebaseLog('Room deleted (empty)');
    }

    firebaseLog('Left room successfully');
  } catch (error) {
    firebaseLog('Failed to leave room', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update player ready status
export const setPlayerReady = async (
  roomId: string,
  playerId: string,
  isReady: boolean
): Promise<void> => {
  try {
    firebaseLog('Setting player ready', { roomId, playerId, isReady });

    await update(ref(database, REALTIME_PATHS.roomPlayer(roomId, playerId)), {
      isReady,
    });

    firebaseLog('Player ready status updated');
  } catch (error) {
    firebaseLog('Failed to set player ready', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update player color
export const setPlayerColor = async (
  roomId: string,
  playerId: string,
  color: RealtimePlayer['color']
): Promise<void> => {
  try {
    firebaseLog('Setting player color', { roomId, playerId, color });

    await update(ref(database, REALTIME_PATHS.roomPlayer(roomId, playerId)), {
      color,
    });

    firebaseLog('Player color updated');
  } catch (error) {
    firebaseLog('Failed to set player color', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== GAME STATE =====

// Start the game (host only)
export const startGame = async (
  roomId: string,
  playerIds: string[]
): Promise<void> => {
  try {
    firebaseLog('Starting game', { roomId, playerCount: playerIds.length });

    // Initialize positions and tokens
    const positions: Record<string, number> = {};
    const tokens: Record<string, number> = {};
    playerIds.forEach((id) => {
      positions[id] = -1; // Start position
      tokens[id] = 0;
    });

    const initialState: RealtimeGameState = {
      s: 'playing', // status
      t: 0, // current turn (first player)
      d: null, // dice value
      p: positions,
      j: tokens,
    };

    await update(ref(database, REALTIME_PATHS.room(roomId)), {
      status: 'playing',
    });

    await set(ref(database, REALTIME_PATHS.roomState(roomId)), initialState);

    firebaseLog('Game started successfully');
  } catch (error) {
    firebaseLog('Failed to start game', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update game state
export const updateGameState = async (
  roomId: string,
  updates: Partial<RealtimeGameState>
): Promise<void> => {
  try {
    firebaseLog('Updating game state', { roomId, updates });

    await update(ref(database, REALTIME_PATHS.roomState(roomId)), updates);

    firebaseLog('Game state updated');
  } catch (error) {
    firebaseLog('Failed to update game state', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Push a game action
export const pushAction = async (
  roomId: string,
  action: Omit<RealtimeAction, 'ts'>
): Promise<void> => {
  try {
    firebaseLog('Pushing action', { roomId, type: action.t });

    const actionsRef = ref(database, REALTIME_PATHS.roomActions(roomId));
    const newActionRef = push(actionsRef);

    await set(newActionRef, {
      ...action,
      ts: Date.now(),
    });

    firebaseLog('Action pushed');
  } catch (error) {
    firebaseLog('Failed to push action', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// End the game
export const endGame = async (
  roomId: string,
  winnerId: string
): Promise<void> => {
  try {
    firebaseLog('Ending game', { roomId, winnerId });

    await update(ref(database, REALTIME_PATHS.room(roomId)), {
      status: 'finished',
    });

    await update(ref(database, REALTIME_PATHS.roomState(roomId)), {
      s: 'finished',
    });

    firebaseLog('Game ended');
  } catch (error) {
    firebaseLog('Failed to end game', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== PRESENCE =====

// Set user presence (online/offline)
export const setPresence = async (userId: string, roomId: string | null): Promise<void> => {
  try {
    firebaseLog('Setting presence', { userId, roomId });

    const presenceRef = ref(database, REALTIME_PATHS.userPresence(userId));
    const presenceData: RealtimePresence = {
      online: true,
      lastSeen: Date.now(),
      currentRoom: roomId,
    };

    await set(presenceRef, presenceData);

    // Set up disconnect handler
    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: Date.now(),
      currentRoom: null,
    });

    firebaseLog('Presence set');
  } catch (error) {
    firebaseLog('Failed to set presence', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== SUBSCRIPTIONS =====

// Subscribe to room changes
export const subscribeToRoom = (
  roomId: string,
  callback: (room: RealtimeRoom | null) => void
): (() => void) => {
  firebaseLog('Subscribing to room', { roomId });

  const roomRef = ref(database, REALTIME_PATHS.room(roomId));

  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeRoom);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// Subscribe to room players
export const subscribeToPlayers = (
  roomId: string,
  callback: (players: RealtimePlayer[]) => void
): (() => void) => {
  firebaseLog('Subscribing to players', { roomId });

  const playersRef = ref(database, REALTIME_PATHS.roomPlayers(roomId));

  const unsubscribe = onValue(playersRef, (snapshot) => {
    const players: RealtimePlayer[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        players.push(child.val() as RealtimePlayer);
      });
    }
    callback(players);
  });

  return unsubscribe;
};

// Subscribe to game state
export const subscribeToGameState = (
  roomId: string,
  callback: (state: RealtimeGameState | null) => void
): (() => void) => {
  firebaseLog('Subscribing to game state', { roomId });

  const stateRef = ref(database, REALTIME_PATHS.roomState(roomId));

  const unsubscribe = onValue(stateRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeGameState);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

// Subscribe to game actions
export const subscribeToActions = (
  roomId: string,
  callback: (action: RealtimeAction) => void
): (() => void) => {
  firebaseLog('Subscribing to actions', { roomId });

  const actionsRef = ref(database, REALTIME_PATHS.roomActions(roomId));

  // Only listen for new actions (after subscription)
  let isInitialLoad = true;

  const unsubscribe = onValue(actionsRef, (snapshot) => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }

    if (snapshot.exists()) {
      const actions: RealtimeAction[] = [];
      snapshot.forEach((child) => {
        actions.push(child.val() as RealtimeAction);
      });

      // Get the latest action
      const latestAction = actions[actions.length - 1];
      if (latestAction) {
        callback(latestAction);
      }
    }
  });

  return unsubscribe;
};

// ===== CHAT (Emoji only) =====

export interface ChatMessage {
  userId: string;
  emoji: string;
  timestamp: number;
}

// Send emoji message
export const sendEmoji = async (
  roomId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  try {
    firebaseLog('Sending emoji', { roomId, emoji });

    const chatRef = ref(database, REALTIME_PATHS.roomChat(roomId));
    const newMessageRef = push(chatRef);

    await set(newMessageRef, {
      userId,
      emoji,
      timestamp: Date.now(),
    });

    firebaseLog('Emoji sent');
  } catch (error) {
    firebaseLog('Failed to send emoji', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Subscribe to chat messages
export const subscribeToChat = (
  roomId: string,
  callback: (message: ChatMessage) => void
): (() => void) => {
  firebaseLog('Subscribing to chat', { roomId });

  const chatRef = ref(database, REALTIME_PATHS.roomChat(roomId));
  let isInitialLoad = true;

  const unsubscribe = onValue(chatRef, (snapshot) => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }

    if (snapshot.exists()) {
      const messages: ChatMessage[] = [];
      snapshot.forEach((child) => {
        messages.push(child.val() as ChatMessage);
      });

      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        callback(latestMessage);
      }
    }
  });

  return unsubscribe;
};
