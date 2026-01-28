// Firebase Configuration
// Note: @react-native-firebase auto-configures from google-services.json (Android)
// and GoogleService-Info.plist (iOS). This file provides TypeScript types and helpers.

// Environment detection
const IS_DEV = __DEV__;

// Firebase project configuration
// These values should match your Firebase Console settings
export const FIREBASE_CONFIG = {
  // Emulator settings for development
  emulators: {
    enabled: IS_DEV && false, // Set to true to use emulators
    host: 'localhost',
    auth: 9099,
    firestore: 8080,
    database: 9000,
    functions: 5001,
    storage: 9199,
  },

  // Realtime Database paths
  realtimePaths: {
    rooms: 'rooms',
    gameState: (roomId: string) => `rooms/${roomId}/state`,
    players: (roomId: string) => `rooms/${roomId}/players`,
    actions: (roomId: string) => `rooms/${roomId}/actions`,
    presence: 'presence',
  },

  // Firestore collections
  firestoreCollections: {
    users: 'users',
    userStartups: (userId: string) => `users/${userId}/startups`,
    editions: 'editions',
    leaderboard: 'leaderboard',
    quizzes: 'quizzes',
    achievements: 'achievements',
  },

  // Storage paths
  storagePaths: {
    avatars: 'avatars',
    userAvatar: (userId: string) => `avatars/${userId}`,
  },
} as const;

// Error messages for Firebase operations
export const FIREBASE_ERRORS: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/email-already-in-use': 'Cet email est déjà utilisé.',
  'auth/weak-password': 'Le mot de passe est trop faible.',
  'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
  'auth/operation-not-allowed': 'Opération non autorisée.',

  // Firestore errors
  'firestore/permission-denied': "Vous n'avez pas les droits nécessaires.",
  'firestore/unavailable': 'Service temporairement indisponible.',
  'firestore/not-found': 'Document non trouvé.',

  // Database errors
  'database/permission-denied': "Vous n'avez pas les droits nécessaires.",
  'database/disconnected': 'Connexion interrompue.',

  // Default
  default: 'Une erreur est survenue. Veuillez réessayer.',
};

export const getFirebaseErrorMessage = (errorCode: string): string => {
  return FIREBASE_ERRORS[errorCode] ?? FIREBASE_ERRORS['default'] ?? 'Une erreur est survenue.';
};

// Logging helper (only in dev)
export const firebaseLog = (message: string, data?: unknown): void => {
  if (IS_DEV) {
    console.log(`[Firebase] ${message}`, data ?? '');
  }
};

// Type definitions for Firebase data
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

// Realtime Database room structure
export interface RealtimeRoom {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  edition: string;
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
}

export interface RealtimePlayer {
  id: string;
  name: string;
  color: 'yellow' | 'blue' | 'green' | 'red';
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  lastSeen: number;
}

export interface RealtimeGameState {
  currentPlayerIndex: number;
  currentTurn: number;
  diceValue: number | null;
  diceRolled: boolean;
  phase: 'rolling' | 'moving' | 'event' | 'waiting';
  updatedAt: number;
}

export interface RealtimeAction {
  id: string;
  playerId: string;
  type: 'roll' | 'move' | 'answer' | 'skip' | 'emoji';
  data: Record<string, unknown>;
  timestamp: number;
}
