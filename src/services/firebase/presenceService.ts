/**
 * Presence Service - Statut temps réel des joueurs.
 *
 * La présence publique est stockée dans RTDB (`presence/{userId}`) pour profiter
 * de `onDisconnect()` et afficher les joueurs en ligne / en partie / hors ligne.
 */
import database, { FirebaseDatabaseTypes } from '@react-native-firebase/database';

import {
  firebaseLog,
  REALTIME_PATHS,
  type RealtimePresence,
  type RealtimePresenceState,
} from './config';

export type PlayerPresenceState = RealtimePresenceState;

export type PresenceMap = Record<string, RealtimePresence | null>;

const PRESENCE_HEARTBEAT_MS = 30000;
const PRESENCE_STALE_MS = 60000;

let activeUserId: string | null = null;
let appIsActive = true;
let heartbeatId: ReturnType<typeof setInterval> | null = null;

let desiredPresence: {
  state: Exclude<PlayerPresenceState, 'offline'>;
  currentRoom: string | null;
  currentGame: string | null;
} = {
  state: 'online',
  currentRoom: null,
  currentGame: null,
};

function offlinePresence(): RealtimePresence {
  const now = Date.now();
  return {
    online: false,
    state: 'offline',
    lastSeen: now,
    updatedAt: now,
    currentRoom: null,
    currentGame: null,
  };
}

function buildPresence(): RealtimePresence {
  const now = Date.now();
  if (!appIsActive) {
    return offlinePresence();
  }
  return {
    online: true,
    state: desiredPresence.state,
    lastSeen: now,
    updatedAt: now,
    currentRoom: desiredPresence.currentRoom,
    currentGame: desiredPresence.currentGame,
  };
}

async function writePresence(userId: string, presence: RealtimePresence): Promise<void> {
  await database().ref(REALTIME_PATHS.userPresence(userId)).set(presence);
}

function ensureDisconnectHandler(userId: string): void {
  database()
    .ref(REALTIME_PATHS.userPresence(userId))
    .onDisconnect()
    .set(offlinePresence())
    .catch((error) => {
      firebaseLog('Presence onDisconnect setup failed', error);
    });
}

function stopHeartbeat(): void {
  if (heartbeatId) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }
}

function startHeartbeat(): void {
  stopHeartbeat();
  heartbeatId = setInterval(() => {
    if (!activeUserId) return;
    writePresence(activeUserId, buildPresence()).catch((error) => {
      firebaseLog('Presence heartbeat failed', error);
    });
  }, PRESENCE_HEARTBEAT_MS);
}

export async function startPresenceSession(userId: string): Promise<void> {
  if (activeUserId !== userId) {
    desiredPresence = {
      state: 'online',
      currentRoom: null,
      currentGame: null,
    };
  }

  activeUserId = userId;
  appIsActive = true;
  ensureDisconnectHandler(userId);
  startHeartbeat();
  await writePresence(userId, buildPresence());
}

export async function stopPresenceSession(userId?: string): Promise<void> {
  const targetUserId = userId ?? activeUserId;
  stopHeartbeat();

  if (targetUserId) {
    try {
      await writePresence(targetUserId, offlinePresence());
      await database().ref(REALTIME_PATHS.userPresence(targetUserId)).onDisconnect().cancel();
    } catch (error) {
      firebaseLog('Presence stop failed', error);
    }
  }

  if (!userId || userId === activeUserId) {
    activeUserId = null;
    desiredPresence = {
      state: 'online',
      currentRoom: null,
      currentGame: null,
    };
  }
}

export async function setPresenceAppActive(isActive: boolean): Promise<void> {
  appIsActive = isActive;
  if (!activeUserId) return;
  await writePresence(activeUserId, buildPresence());
}

export async function setUserOnline(userId: string): Promise<void> {
  if (activeUserId === userId || activeUserId == null) {
    activeUserId = userId;
    desiredPresence = {
      state: 'online',
      currentRoom: null,
      currentGame: null,
    };
    ensureDisconnectHandler(userId);
    startHeartbeat();
  }
  await writePresence(userId, buildPresence());
}

export async function setUserInGame(
  userId: string,
  roomId: string | null,
  gameId: string | null = null
): Promise<void> {
  if (activeUserId === userId || activeUserId == null) {
    activeUserId = userId;
    desiredPresence = {
      state: 'in_game',
      currentRoom: roomId,
      currentGame: gameId,
    };
    ensureDisconnectHandler(userId);
    startHeartbeat();
  }
  await writePresence(userId, buildPresence());
}

export function getPresenceState(presence: RealtimePresence | null | undefined): PlayerPresenceState {
  if (!presence) return 'offline';

  const lastSeen = presence.updatedAt ?? presence.lastSeen ?? 0;
  const isStale = Date.now() - lastSeen > PRESENCE_STALE_MS;
  if (!presence.online || isStale) return 'offline';

  return presence.state ?? (presence.currentRoom ? 'in_game' : 'online');
}

export function getPresenceLabel(state: PlayerPresenceState): string {
  switch (state) {
    case 'online':
      return 'En ligne';
    case 'in_game':
      return 'En partie';
    default:
      return 'Hors ligne';
  }
}

export function subscribeToPresence(
  userIds: string[],
  callback: (presence: PresenceMap) => void
): () => void {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const state: PresenceMap = {};

  if (uniqueIds.length === 0) {
    callback({});
    return () => {};
  }

  const unsubscribers = uniqueIds.map((userId) => {
    const ref = database().ref(REALTIME_PATHS.userPresence(userId));
    const onValue = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      state[userId] = snapshot.exists()
        ? (snapshot.val() as RealtimePresence)
        : null;
      callback({ ...state });
    };
    ref.on('value', onValue);
    return () => ref.off('value', onValue);
  });

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
