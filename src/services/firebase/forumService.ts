/**
 * Mode Forum — collections Firestore dédiées (forumSessions, forumLeaderboard).
 * Ne modifie pas users, userStats, gameSessions, etc.
 */
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';

export interface ForumSession {
  id: string;
  eventName: string;
  players: {
    name: string;
    startupName: string;
    tokens: number;
    rank: number;
  }[];
  winnerName: string;
  totalPlayers: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface ForumLeaderboardEntry {
  name: string;
  startupName: string;
  bestScore: number;
  totalWins: number;
  gamesPlayed: number;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface ForumLeaderboardPlayerInput {
  name: string;
  startupName: string;
  tokens: number;
  isWinner: boolean;
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** ID document leaderboard : nom en minuscules, espaces → tirets (spec Phase 3). */
export function forumPlayerNameToDocId(name: string): string {
  const base = stripDiacritics(name.trim().toLowerCase());
  const slug = base
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug.length > 0 ? slug : 'forum-player';
}

/**
 * Enregistre une session forum terminée.
 */
export async function saveForumSession(
  session: Omit<ForumSession, 'id' | 'createdAt'>
): Promise<void> {
  const db = getFirestore();
  const id = Date.now().toString();
  try {
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.forumSessions, id), {
      id,
      eventName: session.eventName,
      players: session.players,
      winnerName: session.winnerName,
      totalPlayers: session.totalPlayers,
      createdAt: serverTimestamp(),
    });
    firebaseLog('Forum session saved', { id });
  } catch (error) {
    firebaseLog('saveForumSession failed', error);
    throw error;
  }
}

/**
 * Met à jour le leaderboard forum (upsert par slug du nom de joueur).
 */
export async function updateForumLeaderboard(
  players: ForumLeaderboardPlayerInput[]
): Promise<void> {
  const db = getFirestore();
  const col = FIRESTORE_COLLECTIONS.forumLeaderboard;

  for (const p of players) {
    const docId = forumPlayerNameToDocId(p.name);
    const ref = doc(db, col, docId);
    try {
      const snap = await getDoc(ref);
      const prev = snap.exists()
        ? (snap.data() as Partial<ForumLeaderboardEntry>)
        : null;

      const gamesPlayed = (prev?.gamesPlayed ?? 0) + 1;
      const totalWins = (prev?.totalWins ?? 0) + (p.isWinner ? 1 : 0);
      const bestScore = Math.max(prev?.bestScore ?? 0, p.tokens);

      await setDoc(
        ref,
        {
          name: p.name.trim(),
          startupName: p.startupName.trim(),
          bestScore,
          totalWins,
          gamesPlayed,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      firebaseLog('updateForumLeaderboard failed for player', { docId, error });
      throw error;
    }
  }
  firebaseLog('Forum leaderboard updated', { count: players.length });
}

/**
 * Top N du leaderboard forum (meilleur score par partie).
 */
export async function getForumLeaderboard(
  limitCount: number = 10
): Promise<ForumLeaderboardEntry[]> {
  const db = getFirestore();
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.forumLeaderboard),
    orderBy('bestScore', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d: { data: () => Record<string, unknown> }) => {
    const data = d.data();
    return {
      name: String(data.name ?? ''),
      startupName: String(data.startupName ?? ''),
      bestScore: Number(data.bestScore ?? 0),
      totalWins: Number(data.totalWins ?? 0),
      gamesPlayed: Number(data.gamesPlayed ?? 0),
      updatedAt: data.updatedAt as FirebaseFirestoreTypes.Timestamp,
    };
  });
}
