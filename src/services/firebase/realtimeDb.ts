// Firebase Realtime Database Service for Multiplayer
// MIGRATED TO @react-native-firebase/database
import database from '@react-native-firebase/database';
import {
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

    const roomsRef = database().ref(REALTIME_PATHS.rooms);
    const newRoomRef = roomsRef.push();
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
    await database().ref(REALTIME_PATHS.room(roomId)).set(roomData);
    await database().ref(REALTIME_PATHS.roomPlayer(roomId, hostId)).set(hostPlayer);

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
    const roomsRef = database().ref(REALTIME_PATHS.rooms);
    const snapshot = await roomsRef.once('value');

    if (!snapshot.exists()) {
      return null;
    }

    let foundRoom: RealtimeRoom | null = null;
    snapshot.forEach((childSnapshot) => {
      const room = childSnapshot.val() as RealtimeRoom;
      if (room.code === code.toUpperCase()) {
        foundRoom = room;
        return true; // Stop iteration
      }
      return undefined;
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
    const playersRef = database().ref(REALTIME_PATHS.roomPlayers(roomId));
    const playersSnap = await playersRef.once('value');

    const usedColors = new Set<string>();
    if (playersSnap.exists()) {
      playersSnap.forEach((child) => {
        const player = child.val() as RealtimePlayer;
        usedColors.add(player.color);
        return undefined;
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

    await database().ref(REALTIME_PATHS.roomPlayer(roomId, playerId)).set(playerData);

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

    await database().ref(REALTIME_PATHS.roomPlayer(roomId, playerId)).remove();

    // Check if room is now empty
    const playersRef = database().ref(REALTIME_PATHS.roomPlayers(roomId));
    const playersSnap = await playersRef.once('value');

    if (!playersSnap.exists() || playersSnap.numChildren() === 0) {
      // Delete empty room
      await database().ref(REALTIME_PATHS.room(roomId)).remove();
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

    await database().ref(REALTIME_PATHS.roomPlayer(roomId, playerId)).update({
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

    await database().ref(REALTIME_PATHS.roomPlayer(roomId, playerId)).update({
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

    await database().ref(REALTIME_PATHS.room(roomId)).update({
      status: 'playing',
    });

    await database().ref(REALTIME_PATHS.roomState(roomId)).set(initialState);

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

    await database().ref(REALTIME_PATHS.roomState(roomId)).update(updates);

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

    const actionsRef = database().ref(REALTIME_PATHS.roomActions(roomId));
    const newActionRef = actionsRef.push();

    await newActionRef.set({
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

    await database().ref(REALTIME_PATHS.room(roomId)).update({
      status: 'finished',
    });

    await database().ref(REALTIME_PATHS.roomState(roomId)).update({
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

    const presenceRef = database().ref(REALTIME_PATHS.userPresence(userId));
    const presenceData: RealtimePresence = {
      online: true,
      lastSeen: Date.now(),
      currentRoom: roomId,
    };

    await presenceRef.set(presenceData);

    // Set up disconnect handler
    await presenceRef.onDisconnect().set({
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

  const roomRef = database().ref(REALTIME_PATHS.room(roomId));

  const onValueCallback = (snapshot: ReturnType<typeof roomRef.once> extends Promise<infer T> ? T : never) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeRoom);
    } else {
      callback(null);
    }
  };

  roomRef.on('value', onValueCallback as Parameters<typeof roomRef.on>[1]);

  return () => {
    roomRef.off('value', onValueCallback as Parameters<typeof roomRef.off>[1]);
  };
};

// Subscribe to room players
export const subscribeToPlayers = (
  roomId: string,
  callback: (players: RealtimePlayer[]) => void
): (() => void) => {
  firebaseLog('Subscribing to players', { roomId });

  const playersRef = database().ref(REALTIME_PATHS.roomPlayers(roomId));

  const onValueCallback = (snapshot: ReturnType<typeof playersRef.once> extends Promise<infer T> ? T : never) => {
    const players: RealtimePlayer[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        players.push(child.val() as RealtimePlayer);
        return undefined;
      });
    }
    callback(players);
  };

  playersRef.on('value', onValueCallback as Parameters<typeof playersRef.on>[1]);

  return () => {
    playersRef.off('value', onValueCallback as Parameters<typeof playersRef.off>[1]);
  };
};

// Subscribe to game state
export const subscribeToGameState = (
  roomId: string,
  callback: (state: RealtimeGameState | null) => void
): (() => void) => {
  firebaseLog('Subscribing to game state', { roomId });

  const stateRef = database().ref(REALTIME_PATHS.roomState(roomId));

  const onValueCallback = (snapshot: ReturnType<typeof stateRef.once> extends Promise<infer T> ? T : never) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as RealtimeGameState);
    } else {
      callback(null);
    }
  };

  stateRef.on('value', onValueCallback as Parameters<typeof stateRef.on>[1]);

  return () => {
    stateRef.off('value', onValueCallback as Parameters<typeof stateRef.off>[1]);
  };
};

// Subscribe to game actions
export const subscribeToActions = (
  roomId: string,
  callback: (action: RealtimeAction) => void
): (() => void) => {
  firebaseLog('Subscribing to actions', { roomId });

  const actionsRef = database().ref(REALTIME_PATHS.roomActions(roomId));

  // Only listen for new actions (after subscription)
  let isInitialLoad = true;

  const onValueCallback = (snapshot: ReturnType<typeof actionsRef.once> extends Promise<infer T> ? T : never) => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }

    if (snapshot.exists()) {
      const actions: RealtimeAction[] = [];
      snapshot.forEach((child) => {
        actions.push(child.val() as RealtimeAction);
        return undefined;
      });

      // Get the latest action
      const latestAction = actions[actions.length - 1];
      if (latestAction) {
        callback(latestAction);
      }
    }
  };

  actionsRef.on('value', onValueCallback as Parameters<typeof actionsRef.on>[1]);

  return () => {
    actionsRef.off('value', onValueCallback as Parameters<typeof actionsRef.off>[1]);
  };
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

    const chatRef = database().ref(REALTIME_PATHS.roomChat(roomId));
    const newMessageRef = chatRef.push();

    await newMessageRef.set({
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

  const chatRef = database().ref(REALTIME_PATHS.roomChat(roomId));
  let isInitialLoad = true;

  const onValueCallback = (snapshot: ReturnType<typeof chatRef.once> extends Promise<infer T> ? T : never) => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }

    if (snapshot.exists()) {
      const messages: ChatMessage[] = [];
      snapshot.forEach((child) => {
        messages.push(child.val() as ChatMessage);
        return undefined;
      });

      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        callback(latestMessage);
      }
    }
  };

  chatRef.on('value', onValueCallback as Parameters<typeof chatRef.on>[1]);

  return () => {
    chatRef.off('value', onValueCallback as Parameters<typeof chatRef.off>[1]);
  };
};
