/**
 * Firebase Configuration
 * MIGRATED TO @react-native-firebase (native modules)
 * - Auth: @react-native-firebase/auth
 * - Firestore: @react-native-firebase/firestore
 * - Realtime Database: @react-native-firebase/database
 */
import { getFirestore, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import database from '@react-native-firebase/database';

// Environment detection
const IS_DEV = __DEV__;

// ===== LOGGING =====
export const firebaseLog = (message: string, data?: unknown): void => {
  if (IS_DEV) {
    console.log(`[Firebase] ${message}`, data ?? '');
  }
};

// Log initialization
console.log('[Firebase Config] Using @react-native-firebase native modules');
console.log('[Firebase Config] Firestore and Database auto-initialized via native SDK');

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
  matchmakingQueue: 'matchmaking/queue',
  matchmakingTicket: (ticketId: string) => `matchmaking/queue/${ticketId}`,
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
  partners: 'partners',
  programs: 'programs',
  programEnrollments: 'programEnrollments',
  programSessions: 'programSessions',
  ideationCards: 'ideationCards',
  partnershipApplications: 'partnershipApplications',
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
  createdAt: FirebaseTimestamp | FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseTimestamp | FirebaseFirestoreTypes.Timestamp;
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
  lastGameAt: FirebaseTimestamp | FirebaseFirestoreTypes.Timestamp | null;
  updatedAt: FirebaseTimestamp | FirebaseFirestoreTypes.Timestamp;
  // Dénormalisé depuis users/ pour éviter les N+1 dans le classement
  displayName?: string;
  avatarUrl?: string | null;
  // IDs des succès débloqués
  achievements?: string[];
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
  /** Mise par joueur en FCFA (1 Ptw = 1000 FCFA). 0 ou absent = partie sans mise. */
  stake?: number;
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

export type RealtimePresenceState = 'online' | 'in_game' | 'offline';

export interface RealtimePresence {
  /** Champ historique conservé pour compatibilité avec les anciennes présences. */
  online: boolean;
  /** Statut exploitable par l'écran Joueurs disponibles. */
  state?: RealtimePresenceState;
  lastSeen: number;
  updatedAt?: number;
  currentRoom: string | null;
  currentGame?: string | null;
}

// ===== MATCHMAKING =====

/** Status d'un ticket dans la file d'attente match rapide */
export type MatchmakingStatus = 'waiting' | 'matching' | 'matched' | 'cancelled';

/**
 * Ticket de match rapide dans la file d'attente.
 * Déposé par chaque joueur qui lance une recherche.
 * Supprimé via onDisconnect() si le joueur ferme l'app.
 */
export interface MatchmakingTicket {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  maxPlayers: 2 | 3 | 4;
  startupId: string;
  startupName: string;
  isDefaultProject: boolean;
  sector: string;
  edition: string;
  createdAt: number;
  status: MatchmakingStatus;
  /** Rempli quand le ticket est matché : ID de la room à rejoindre */
  roomId: string | null;
  /** Mise par joueur en FCFA. Seuls les tickets de même mise sont appariés. */
  stake?: number;
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

// ===== NATIVE MODULE EXPORTS =====
// Export the native modules directly for use in services
export { getFirestore, database };
