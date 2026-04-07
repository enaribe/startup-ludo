// Firebase Firestore Service - MIGRATED TO @react-native-firebase/firestore
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  collectionGroup,
  serverTimestamp,
  Timestamp,
} from '@react-native-firebase/firestore';
import { DEFAULT_RANK, getRankFromXP, getLevelFromXP } from '@/config/progression';
import type { ChallengeEnrollment } from '@/types/challenge';
import type { Startup, UserProfile } from '@/types';
import {
    firebaseLog,
    FIRESTORE_COLLECTIONS,
    getFirebaseErrorMessage,
    isFirebaseOfflineError,
    type FirestoreUser,
    type FirestoreUserStats,
} from './config';

// ===== USER PROFILE =====

// Create initial user profile in Firestore
export const createUserProfile = async (
  userId: string,
  data: { email: string | null; displayName: string; photoURL?: string | null }
): Promise<UserProfile> => {
  try {
    firebaseLog('Creating user profile', { userId, displayName: data.displayName });

    const now = Timestamp.now();
    const userData: FirestoreUser = {
      id: userId,
      email: data.email,
      displayName: data.displayName,
      avatarUrl: data.photoURL ?? null,
      createdAt: now,
      updatedAt: now,
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        hapticsEnabled: true,
        language: 'fr',
      },
    };

    // Create user document
    await setDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.users, userId), userData);

    // Create user stats document (displayName + avatarUrl dénormalisés pour éviter les N+1 dans le classement)
    const statsData: FirestoreUserStats = {
      id: userId,
      xp: 0,
      level: 1,
      totalGames: 0,
      gamesWon: 0,
      totalTokensEarned: 0,
      weeklyXP: 0,
      monthlyXP: 0,
      lastGameAt: null,
      updatedAt: now,
      displayName: data.displayName,
      avatarUrl: data.photoURL ?? null,
    };

    await setDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.userStats, userId), statsData);

    firebaseLog('User profile created successfully');

    // Return as UserProfile type
    return {
      userId,
      displayName: data.displayName,
      avatarUrl: null,
      xp: 0,
      level: 1,
      rank: DEFAULT_RANK.id,
      gamesPlayed: 0,
      gamesWon: 0,
      totalTokensEarned: 0,
      achievements: [],
      startups: [],
      createdAt: now.toMillis(),
    };
  } catch (error) {
    firebaseLog('Failed to create user profile', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    firebaseLog('Fetching user profile', { userId });

    const [userSnap, statsSnap] = await Promise.all([
      getDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.users, userId)),
      getDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.userStats, userId)),
    ]);

    if (!userSnap.exists) {
      firebaseLog('User profile not found');
      return null;
    }

    const userData = userSnap.data() as FirestoreUser;
    const statsData = statsSnap.exists ? statsSnap.data() as FirestoreUserStats : null;

    // Fetch user startups
    const startupsSnap = await getDocs(collection(getFirestore(), FIRESTORE_COLLECTIONS.userStartups(userId)));
    const startups = startupsSnap.docs.map((d) => d.data() as Startup);

    firebaseLog('User profile fetched successfully');

    const xp = statsData?.xp ?? 0;

    // Handle timestamp - could be Firestore Timestamp or plain object
    let createdAtMs: number;
    if (userData.createdAt && typeof userData.createdAt === 'object') {
      if ('toMillis' in userData.createdAt && typeof (userData.createdAt as { toMillis?: unknown }).toMillis === 'function') {
        createdAtMs = (userData.createdAt as { toMillis: () => number }).toMillis();
      } else if ('seconds' in userData.createdAt) {
        createdAtMs = (userData.createdAt as { seconds: number }).seconds * 1000;
      } else {
        createdAtMs = Date.now();
      }
    } else {
      createdAtMs = Date.now();
    }

    return {
      userId,
      displayName: userData.displayName,
      avatarUrl: userData.avatarUrl,
      xp,
      level: statsData?.level ?? 1,
      rank: getRankFromXP(xp).id,
      gamesPlayed: statsData?.totalGames ?? 0,
      gamesWon: statsData?.gamesWon ?? 0,
      totalTokensEarned: statsData?.totalTokensEarned ?? 0,
      achievements: [], // TODO: Fetch from achievements subcollection
      startups,
      createdAt: createdAtMs,
    };
  } catch (error) {
    if (isFirebaseOfflineError(error)) {
      firebaseLog('User profile not loaded (device offline or Firestore unavailable)');
      return null;
    }
    firebaseLog('Failed to fetch user profile', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update user profile
export const updateFirestoreUserProfile = async (
  userId: string,
  updates: { displayName?: string; avatarUrl?: string | null }
): Promise<void> => {
  try {
    firebaseLog('Updating user profile', { userId, updates });

    const db = getFirestore();
    // Met à jour users/ + maintient la dénormalisation dans userStats/ en parallèle
    const writes: Promise<void>[] = [
      updateDoc(doc(db, FIRESTORE_COLLECTIONS.users, userId), {
        ...updates,
        updatedAt: serverTimestamp(),
      }),
    ];
    if (updates.displayName !== undefined || updates.avatarUrl !== undefined) {
      const statsUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.displayName !== undefined) statsUpdates.displayName = updates.displayName;
      if (updates.avatarUrl !== undefined) statsUpdates.avatarUrl = updates.avatarUrl;
      writes.push(updateDoc(doc(db, FIRESTORE_COLLECTIONS.userStats, userId), statsUpdates));
    }
    await Promise.all(writes);

    firebaseLog('User profile updated successfully');
  } catch (error) {
    firebaseLog('Failed to update user profile', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== USER STATS =====

// Update user stats after a game
export const updateUserStats = async (
  userId: string,
  stats: {
    xpGained?: number;
    tokensEarned?: number;
    won?: boolean;
  }
): Promise<void> => {
  try {
    firebaseLog('Updating user stats', { userId, stats });

    const statsRef = doc(getFirestore(), FIRESTORE_COLLECTIONS.userStats, userId);
    const statsSnap = await getDoc(statsRef);

    const now = Timestamp.now();

    if (!statsSnap.exists) {
      // Créer le document stats s'il n'existe pas encore
      firebaseLog('User stats not found, creating document', { userId });
      const firstXP = stats.xpGained ?? 0;
      const firstLevel = getLevelFromXP(firstXP).level;
      const newStats: FirestoreUserStats = {
        id: userId,
        xp: firstXP,
        level: firstLevel,
        totalGames: 1,
        gamesWon: stats.won ? 1 : 0,
        totalTokensEarned: stats.tokensEarned ?? 0,
        weeklyXP: firstXP,
        monthlyXP: firstXP,
        lastGameAt: now,
        updatedAt: now,
      };
      await setDoc(statsRef, newStats);
      // Sync to main user profile for new users too
      await updateDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.users, userId), {
        xp: firstXP,
        level: firstLevel,
        updatedAt: now,
      });
      firebaseLog('User stats document created successfully');
      return;
    }

    const currentStats = statsSnap.data() as FirestoreUserStats;
    const newXP = currentStats.xp + (stats.xpGained ?? 0);
    const newLevel = getLevelFromXP(newXP).level;

    const updates: Partial<FirestoreUserStats> = {
      totalGames: currentStats.totalGames + 1,
      xp: newXP,
      level: newLevel,
      weeklyXP: currentStats.weeklyXP + (stats.xpGained ?? 0),
      monthlyXP: currentStats.monthlyXP + (stats.xpGained ?? 0),
      totalTokensEarned: currentStats.totalTokensEarned + (stats.tokensEarned ?? 0),
      lastGameAt: now,
      updatedAt: now,
    };

    if (stats.won) {
      updates.gamesWon = currentStats.gamesWon + 1;
    }

    await updateDoc(statsRef, updates);

    // Sync level + XP to main user profile so it survives app restarts
    await updateDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.users, userId), {
      xp: newXP,
      level: newLevel,
      updatedAt: now,
    });

    firebaseLog('User stats updated successfully');
  } catch (error) {
    firebaseLog('Failed to update user stats', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== STARTUPS =====

// Add a startup to user's collection
export const addStartup = async (userId: string, startup: Startup): Promise<void> => {
  try {
    firebaseLog('Adding startup', { userId, startupId: startup.id });

    await setDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.userStartups(userId), startup.id), {
      ...startup,
      createdAt: serverTimestamp(),
    });

    firebaseLog('Startup added successfully');
  } catch (error) {
    firebaseLog('Failed to add startup', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Update startup valorisation
export const updateStartupValorisation = async (
  userId: string,
  startupId: string,
  newValorisation: number,
): Promise<void> => {
  try {
    firebaseLog('Updating startup valorisation', { userId, startupId, newValorisation });

    await updateDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.userStartups(userId), startupId),
      { valorisation: newValorisation }
    );

    firebaseLog('Startup valorisation updated successfully');
  } catch (error) {
    firebaseLog('Failed to update startup valorisation', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Delete a startup
export const deleteStartup = async (userId: string, startupId: string): Promise<void> => {
  try {
    firebaseLog('Deleting startup', { userId, startupId });

    await deleteDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.userStartups(userId), startupId));

    firebaseLog('Startup deleted successfully');
  } catch (error) {
    firebaseLog('Failed to delete startup', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get all startups across all users (for leaderboard)
export const getAllStartups = async (limitCount: number = 100): Promise<Startup[]> => {
  try {
    console.log('[Firestore] getAllStartups: Starting fetch...');
    firebaseLog('Fetching all startups', { limit: limitCount });

    const snapshot = await getDocs(
      query(collectionGroup(getFirestore(), 'startups'), limit(limitCount))
    );

    const startups = snapshot.docs.map((d) => d.data() as Startup);

    console.log('[Firestore] getAllStartups: Success, count:', startups.length);
    firebaseLog('All startups fetched successfully', { count: startups.length });
    return startups;
  } catch (error) {
    console.error('[Firestore] getAllStartups: ERROR', error);
    firebaseLog('Failed to fetch all startups', error);
    return [];
  }
};

// ===== LEADERBOARD =====

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  gamesWon: number;
  rank: number;
}

// Get leaderboard (all-time, weekly, or monthly)
// Stratégie : si displayName est dénormalisé dans userStats → 1 seule requête.
// Sinon → lectures parallèles via Promise.all (évite la boucle séquentielle).
export const getLeaderboard = async (
  type: 'allTime' | 'weekly' | 'monthly' = 'allTime',
  limitCount: number = 50
): Promise<LeaderboardEntry[]> => {
  try {
    firebaseLog('Fetching leaderboard', { type, limit: limitCount });

    const orderField = type === 'weekly' ? 'weeklyXP' : type === 'monthly' ? 'monthlyXP' : 'xp';

    const snapshot = await getDocs(
      query(
        collection(getFirestore(), FIRESTORE_COLLECTIONS.userStats),
        orderBy(orderField, 'desc'),
        limit(limitCount)
      )
    );

    const statsDocs = snapshot.docs;
    const allStats = statsDocs.map((d) => d.data() as FirestoreUserStats);

    // Identifier les docs qui n'ont pas encore displayName dénormalisé
    const missingIndices: number[] = [];
    allStats.forEach((s, i) => { if (!s.displayName) missingIndices.push(i); });

    // Charger les profils manquants en parallèle (au lieu de séquentiellement)
    let missingUserSnaps: Awaited<ReturnType<typeof getDoc>>[] = [];
    if (missingIndices.length > 0) {
      const db = getFirestore();
      missingUserSnaps = await Promise.all(
        missingIndices.map((i) => getDoc(doc(db, FIRESTORE_COLLECTIONS.users, allStats[i].id)))
      );
    }

    const entries: LeaderboardEntry[] = [];
    let rank = 1;
    let missingCursor = 0;

    for (let i = 0; i < allStats.length; i++) {
      const stats = allStats[i];
      let displayName: string;
      let avatarUrl: string | null;

      if (stats.displayName) {
        displayName = stats.displayName;
        avatarUrl = stats.avatarUrl ?? null;
      } else {
        const userSnap = missingUserSnaps[missingCursor++];
        if (!userSnap?.exists) continue;
        const userData = userSnap.data() as FirestoreUser;
        displayName = userData.displayName;
        avatarUrl = userData.avatarUrl;
      }

      entries.push({
        id: stats.id,
        displayName,
        avatarUrl,
        xp: type === 'weekly' ? stats.weeklyXP : type === 'monthly' ? stats.monthlyXP : stats.xp,
        level: stats.level,
        gamesWon: stats.gamesWon,
        rank: rank++,
      });
    }

    firebaseLog('Leaderboard fetched successfully', { count: entries.length });
    return entries;
  } catch (error) {
    firebaseLog('Failed to fetch leaderboard', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== GAME SESSIONS =====

export interface GameSession {
  id: string;
  mode: 'solo' | 'local' | 'online';
  playerIds: string[];
  winnerId: string | null;
  duration: number;
  finalScores: Record<string, number>;
  createdAt: number;
}

// Save game session
export const saveGameSession = async (session: GameSession): Promise<void> => {
  try {
    firebaseLog('Saving game session', { sessionId: session.id });

    await setDoc(doc(getFirestore(), FIRESTORE_COLLECTIONS.gameSessions, session.id), {
      ...session,
      createdAt: serverTimestamp(),
    });

    firebaseLog('Game session saved successfully');
  } catch (error) {
    firebaseLog('Failed to save game session', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get user's game history
export const getGameHistory = async (
  userId: string,
  limitCount: number = 20
): Promise<GameSession[]> => {
  try {
    firebaseLog('Fetching game history', { userId, limit: limitCount });

    const snapshot = await getDocs(
      query(
        collection(getFirestore(), FIRESTORE_COLLECTIONS.gameSessions),
        where('playerIds', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      )
    );

    const sessions = snapshot.docs.map((d) => {
      const data = d.data();
      // Convert Firestore Timestamp to milliseconds if needed
      let createdAt = data.createdAt;
      if (createdAt && typeof createdAt === 'object' && 'toMillis' in createdAt) {
        createdAt = createdAt.toMillis();
      } else if (typeof createdAt !== 'number') {
        createdAt = Date.now();
      }
      return {
        ...data,
        id: d.id,
        createdAt,
      } as GameSession;
    });

    firebaseLog('Game history fetched successfully', { count: sessions.length });
    return sessions;
  } catch (error) {
    firebaseLog('Failed to fetch game history', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// ===== CHALLENGE ENROLLMENTS =====

function enrollmentDocId(userId: string, challengeId: string): string {
  return `${userId}_${challengeId}`;
}

/** Crée ou écrase une inscription à un challenge dans Firestore */
export const setChallengeEnrollment = async (
  enrollment: ChallengeEnrollment
): Promise<void> => {
  try {
    firebaseLog('Setting challenge enrollment', { enrollmentId: enrollment.id });

    const docId = enrollmentDocId(enrollment.userId, enrollment.challengeId);
    await setDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.challengeEnrollments, docId),
      {
        ...enrollment,
        updatedAt: serverTimestamp(),
      }
    );

    firebaseLog('Challenge enrollment set successfully');
  } catch (error) {
    firebaseLog('Failed to set challenge enrollment', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/** Met à jour partiellement une inscription (crée le doc si absent) */
export const updateChallengeEnrollment = async (
  userId: string,
  challengeId: string,
  updates: Partial<Omit<ChallengeEnrollment, 'id' | 'userId' | 'challengeId'>>
): Promise<void> => {
  try {
    firebaseLog('Updating challenge enrollment', { userId, challengeId });

    const docId = enrollmentDocId(userId, challengeId);
    // set + merge pour créer le doc s'il n'existe pas encore
    // userId et challengeId inclus pour satisfaire les règles Firestore
    await setDoc(
      doc(getFirestore(), FIRESTORE_COLLECTIONS.challengeEnrollments, docId),
      {
        ...updates,
        userId,
        challengeId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    firebaseLog('Challenge enrollment updated successfully');
  } catch (error) {
    firebaseLog('Failed to update challenge enrollment', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/** Récupère toutes les inscriptions d'un utilisateur */
export const getChallengeEnrollmentsForUser = async (
  userId: string
): Promise<ChallengeEnrollment[]> => {
  try {
    firebaseLog('Fetching challenge enrollments', { userId });

    const snapshot = await getDocs(
      query(
        collection(getFirestore(), FIRESTORE_COLLECTIONS.challengeEnrollments),
        where('userId', '==', userId)
      )
    );

    const enrollments = snapshot.docs.map((d) => {
      const data = d.data();
      return { ...data, id: (data as { id?: string }).id ?? d.id } as ChallengeEnrollment;
    });

    firebaseLog('Challenge enrollments fetched', { count: enrollments.length });
    return enrollments;
  } catch (error) {
    firebaseLog('Failed to fetch challenge enrollments', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

/** Abonnement temps réel aux inscriptions de l'utilisateur */
export const subscribeToChallengeEnrollments = (
  userId: string,
  callback: (enrollments: ChallengeEnrollment[]) => void
): (() => void) => {
  firebaseLog('Subscribing to challenge enrollments', { userId });

  const unsubscribe = onSnapshot(
    query(
      collection(getFirestore(), FIRESTORE_COLLECTIONS.challengeEnrollments),
      where('userId', '==', userId)
    ),
    (snapshot) => {
      const enrollments = snapshot.docs.map((d) => {
        const data = d.data();
        return { ...data, id: (data as { id?: string }).id ?? d.id } as ChallengeEnrollment;
      });
      callback(enrollments);
    },
    (error) => {
      firebaseLog('Challenge enrollments subscription error', error);
    }
  );

  return unsubscribe;
};

// ===== REAL-TIME SUBSCRIPTIONS =====

// Subscribe to user profile changes
export const subscribeToUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): (() => void) => {
  firebaseLog('Subscribing to user profile', { userId });

  const unsubscribe = onSnapshot(
    doc(getFirestore(), FIRESTORE_COLLECTIONS.users, userId),
    async (snapshot) => {
      if (snapshot.exists) {
        // Fetch full profile including stats
        const profile = await getUserProfile(userId);
        callback(profile);
      } else {
        callback(null);
      }
    },
    (error) => {
      firebaseLog('User profile subscription error', error);
    }
  );

  return unsubscribe;
};

// Subscribe to leaderboard changes
// Même stratégie que getLeaderboard : pas de join si displayName dénormalisé, sinon Promise.all.
export const subscribeToLeaderboard = (
  type: 'allTime' | 'weekly' | 'monthly',
  callback: (entries: LeaderboardEntry[]) => void,
  limitCount: number = 50
): (() => void) => {
  firebaseLog('Subscribing to leaderboard', { type, limit: limitCount });

  const orderField = type === 'weekly' ? 'weeklyXP' : type === 'monthly' ? 'monthlyXP' : 'xp';

  const unsubscribe = onSnapshot(
    query(
      collection(getFirestore(), FIRESTORE_COLLECTIONS.userStats),
      orderBy(orderField, 'desc'),
      limit(limitCount)
    ),
    async (snapshot) => {
      const allStats = snapshot.docs.map((d) => d.data() as FirestoreUserStats);
      const missingIndices: number[] = [];
      allStats.forEach((s, i) => { if (!s.displayName) missingIndices.push(i); });

      let missingUserSnaps: Awaited<ReturnType<typeof getDoc>>[] = [];
      if (missingIndices.length > 0) {
        const db = getFirestore();
        missingUserSnaps = await Promise.all(
          missingIndices.map((i) => getDoc(doc(db, FIRESTORE_COLLECTIONS.users, allStats[i].id)))
        );
      }

      const entries: LeaderboardEntry[] = [];
      let rank = 1;
      let missingCursor = 0;

      for (let i = 0; i < allStats.length; i++) {
        const stats = allStats[i];
        let displayName: string;
        let avatarUrl: string | null;

        if (stats.displayName) {
          displayName = stats.displayName;
          avatarUrl = stats.avatarUrl ?? null;
        } else {
          const userSnap = missingUserSnaps[missingCursor++];
          if (!userSnap?.exists) continue;
          const userData = userSnap.data() as FirestoreUser;
          displayName = userData.displayName;
          avatarUrl = userData.avatarUrl;
        }

        entries.push({
          id: stats.id,
          displayName,
          avatarUrl,
          xp: type === 'weekly' ? stats.weeklyXP : type === 'monthly' ? stats.monthlyXP : stats.xp,
          level: stats.level,
          gamesWon: stats.gamesWon,
          rank: rank++,
        });
      }

      callback(entries);
    },
    (error) => {
      firebaseLog('Leaderboard subscription error', error);
    }
  );

  return unsubscribe;
};
