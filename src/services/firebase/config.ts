/**
 * Firebase Configuration
 * - Auth: Uses @react-native-firebase/auth (native)
 * - Firestore & Realtime Database: Uses Firebase JS SDK
 */
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Database, connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Environment detection
const IS_DEV = __DEV__;

// ===== LOGGING =====
// Defined early to be available during initialization
const firebaseLog = (message: string, data?: unknown): void => {
  if (IS_DEV) {
    console.log(`[Firebase] ${message}`, data ?? '');
  }
};

// Firebase configuration from your Firebase Console
// Note: Auth is handled by @react-native-firebase/auth using GoogleService-Info.plist / google-services.json
const firebaseConfig = {
  apiKey: 'AIzaSyB3TEuMAMfV0crfAMc0u63EFy-9rXwFRYc',
  authDomain: 'startup-ludo-new.firebaseapp.com',
  projectId: 'startup-ludo-new',
  storageBucket: 'startup-ludo-new.firebasestorage.app',
  messagingSenderId: '767192713144',
  appId: '1:767192713144:ios:d0dae4035cf900e1c6714d',
  databaseURL: 'https://startup-ludo-new-default-rtdb.firebaseio.com',
};

// Emulator configuration
const EMULATOR_CONFIG = {
  enabled: IS_DEV && false, // Set to true to use emulators
  host: 'localhost',
  firestore: 8080,
  database: 9000,
};

// Initialize Firebase JS SDK for Firestore and Realtime Database only
let app: FirebaseApp;
let firestore: Firestore;
let database: Database;

const initializeFirebase = (): void => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    firebaseLog('Firebase JS SDK initialized (Firestore + Realtime Database)');
  } else {
    app = getApps()[0]!;
    firebaseLog('Firebase JS SDK already initialized');
  }

  firestore = getFirestore(app);
  database = getDatabase(app);

  // Connect to emulators in development
  if (EMULATOR_CONFIG.enabled) {
    connectFirestoreEmulator(firestore, EMULATOR_CONFIG.host, EMULATOR_CONFIG.firestore);
    connectDatabaseEmulator(database, EMULATOR_CONFIG.host, EMULATOR_CONFIG.database);
    firebaseLog('Connected to Firebase emulators (Firestore + Database)');
  }
};

// Initialize on import
initializeFirebase();

// Export Firebase services and utilities
// Note: Auth is NOT exported here - use @react-native-firebase/auth directly
export { app, database, firebaseLog, firestore };

// ===== PATH CONSTANTS =====

// Realtime Database paths
export const REALTIME_PATHS = {
  rooms: 'rooms',
  room: (roomId: string) => `rooms/${roomId}`,
  roomState: (roomId: string) => `rooms/${roomId}/state`,
  roomPlayers: (roomId: string) => `rooms/${roomId}/players`,
  roomPlayer: (roomId: string, playerId: string) => `rooms/${roomId}/players/${playerId}`,
  roomActions: (roomId: string) => `rooms/${roomId}/actions`,
  roomChat: (roomId: string) => `rooms/${roomId}/chat`,
  presence: 'presence',
  userPresence: (userId: string) => `presence/${userId}`,
  matchmaking: 'matchmaking',
} as const;

// Firestore collections
export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  userStats: 'userStats',
  userStartups: (userId: string) => `users/${userId}/startups`,
  editions: 'editions',
  defaultProjects: 'defaultProjects',
  leaderboards: 'leaderboards',
  gameSessions: 'gameSessions',
  achievements: 'achievements',
  reports: 'reports',
  challenges: 'challenges',
  challengeEnrollments: 'challengeEnrollments',
  ideationCards: 'ideationCards',
} as const;

// ===== ERROR HANDLING =====

export const FIREBASE_ERRORS: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/weak-password': 'Le mot de passe est trop faible (minimum 6 caractères).',
  'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
  'auth/operation-not-allowed': 'Opération non autorisée.',
  'auth/invalid-credential': 'Identifiants invalides.',
  'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',

  // Firestore errors
  'permission-denied': "Vous n'avez pas les droits nécessaires.",
  'unavailable': 'Service temporairement indisponible.',
  'not-found': 'Document non trouvé.',
  'already-exists': 'Ce document existe déjà.',

  // Database errors
  'PERMISSION_DENIED': "Vous n'avez pas les droits nécessaires.",

  // Default
  default: 'Une erreur est survenue. Veuillez réessayer.',
};

export const getFirebaseErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return FIREBASE_ERRORS[code] ?? FIREBASE_ERRORS['default']!;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return FIREBASE_ERRORS['default']!;
};

/** Returns true if the error is due to offline / Firestore unavailable (no network). */
export const isFirebaseOfflineError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  const message = typeof (error as { message?: string }).message === 'string'
    ? (error as { message: string }).message
    : '';
  if (code === 'unavailable') return true;
  if (/offline|client is offline|could not reach/i.test(message)) return true;
  return false;
};

// ===== TYPE DEFINITIONS =====

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

// Firestore User document
export interface FirestoreUser {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
    language: 'fr' | 'en';
  };
}

// Firestore UserStats document
export interface FirestoreUserStats {
  id: string;
  xp: number;
  level: number;
  totalGames: number;
  gamesWon: number;
  totalTokensEarned: number;
  weeklyXP: number;
  monthlyXP: number;
  lastGameAt: FirebaseTimestamp | null;
  updatedAt: FirebaseTimestamp;
}

// Realtime Database room structure
export interface RealtimeRoom {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  updatedAt?: number;
  edition?: string;
  maxPlayers?: number; // Direct field for backward compat
  gameId?: string;
  gameSettings?: {
    maxPlayers: number;
    maxTurns: number;
    tokenGoal: number;
  };
}

export interface RealtimePlayer {
  id: string;
  displayName: string;
  name?: string; // Alias for displayName (backward compat)
  color: 'yellow' | 'blue' | 'green' | 'red';
  isHost?: boolean;
  isReady: boolean;
  isConnected?: boolean;
  joinedAt: number;
  lastSeen?: number;
  startupId?: string;
  startupName?: string;
  isDefaultProject?: boolean;
  sector?: string;    // Secteur du projet (online - éditions par joueur)
  edition?: string;   // Édition dérivée du secteur (online)
}

// Compact game state for bandwidth efficiency
export interface RealtimeGameState {
  s: string; // status
  t: number; // current turn (player index)
  d: number | null; // dice value
  p: Record<string, number>; // positions
  j: Record<string, number>; // jetons (tokens)
}

export interface RealtimeAction {
  id?: string; // Optional for push
  t: string; // type
  type?: string; // Alias (verbose)
  p: string; // player ID
  playerId?: string; // Alias (verbose)
  d: Record<string, unknown>; // data
  data?: Record<string, unknown>; // Alias (verbose)
  ts: number; // timestamp
  timestamp?: number; // Alias (verbose)
}

export interface RealtimePresence {
  online: boolean;
  lastSeen: number;
  currentRoom: string | null;
}

// ===== EMOJI REACTIONS =====

/** Emojis disponibles pour les reactions en jeu */
export const REACTION_EMOJIS = ['👍', '👏', '😂', '😱', '🔥'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Structure d'une reaction emoji pour synchronisation */
export interface RealtimeEmojiReaction {
  emoji: ReactionEmoji;
  playerName: string;
}
