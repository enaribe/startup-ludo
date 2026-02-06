// Firebase Configuration - SDK JavaScript
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
// @ts-expect-error - getReactNativePersistence is exported from this path
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import { Database, connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { Firestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  auth: 9099,
  firestore: 8080,
  database: 9000,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;

const initializeFirebase = (): void => {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    firebaseLog('Firebase initialized');

    // Initialize Auth with persistence for React Native
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    firebaseLog('Auth initialized with AsyncStorage persistence');
  } else {
    app = getApps()[0]!;
    auth = getAuth(app);
    firebaseLog('Firebase already initialized');
  }

  firestore = getFirestore(app);
  database = getDatabase(app);

  // Connect to emulators in development
  if (EMULATOR_CONFIG.enabled) {
    connectAuthEmulator(auth, `http://${EMULATOR_CONFIG.host}:${EMULATOR_CONFIG.auth}`);
    connectFirestoreEmulator(firestore, EMULATOR_CONFIG.host, EMULATOR_CONFIG.firestore);
    connectDatabaseEmulator(database, EMULATOR_CONFIG.host, EMULATOR_CONFIG.database);
    firebaseLog('Connected to Firebase emulators');
  }
};

// Initialize on import
initializeFirebase();

// Export Firebase services and utilities
export { app, auth, database, firebaseLog, firestore };

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
