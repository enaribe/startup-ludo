// Firebase Firestore Service
import { DEFAULT_RANK, getRankFromXP } from '@/config/progression';
import type { ChallengeEnrollment } from '@/types/challenge';
import type { Startup, UserProfile } from '@/types';
import {
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryConstraint,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import {
    firebaseLog,
    firestore,
    FIRESTORE_COLLECTIONS,
    getFirebaseErrorMessage,
    type FirestoreUser,
    type FirestoreUserStats,
} from './config';

// ===== USER PROFILE =====

// Create initial user profile in Firestore
export const createUserProfile = async (
  userId: string,
  data: { email: string | null; displayName: string }
): Promise<UserProfile> => {
  try {
    firebaseLog('Creating user profile', { userId, displayName: data.displayName });

    const now = Timestamp.now();
    const userData: FirestoreUser = {
      id: userId,
      email: data.email,
      displayName: data.displayName,
      avatarUrl: null,
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
    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, userId);
    await setDoc(userRef, userData);

    // Create user stats document
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
    };

    const statsRef = doc(firestore, FIRESTORE_COLLECTIONS.userStats, userId);
    await setDoc(statsRef, statsData);

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

    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, userId);
    const statsRef = doc(firestore, FIRESTORE_COLLECTIONS.userStats, userId);

    const [userSnap, statsSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(statsRef),
    ]);

    if (!userSnap.exists()) {
      firebaseLog('User profile not found');
      return null;
    }

    const userData = userSnap.data() as FirestoreUser;
    const statsData = statsSnap.exists() ? statsSnap.data() as FirestoreUserStats : null;

    // Fetch user startups
    const startupsRef = collection(firestore, FIRESTORE_COLLECTIONS.userStartups(userId));
    const startupsSnap = await getDocs(startupsRef);
    const startups = startupsSnap.docs.map((d) => d.data() as Startup);

    firebaseLog('User profile fetched successfully');

    const xp = statsData?.xp ?? 0;
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
      createdAt: userData.createdAt.seconds * 1000,
    };
  } catch (error) {
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

    const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

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

    const statsRef = doc(firestore, FIRESTORE_COLLECTIONS.userStats, userId);
    const statsSnap = await getDoc(statsRef);

    const now = Timestamp.now();

    if (!statsSnap.exists()) {
      // Créer le document stats s'il n'existe pas encore
      firebaseLog('User stats not found, creating document', { userId });
      const newStats: FirestoreUserStats = {
        id: userId,
        xp: stats.xpGained ?? 0,
        level: 1,
        totalGames: 1,
        gamesWon: stats.won ? 1 : 0,
        totalTokensEarned: stats.tokensEarned ?? 0,
        weeklyXP: stats.xpGained ?? 0,
        monthlyXP: stats.xpGained ?? 0,
        lastGameAt: now,
        updatedAt: now,
      };
      await setDoc(statsRef, newStats);
      firebaseLog('User stats document created successfully');
      return;
    }

    const currentStats = statsSnap.data() as FirestoreUserStats;
    const newXP = currentStats.xp + (stats.xpGained ?? 0);
    const newLevel = Math.floor(newXP / 100) + 1;

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

    const startupRef = doc(
      firestore,
      FIRESTORE_COLLECTIONS.userStartups(userId),
      startup.id
    );
    await setDoc(startupRef, {
      ...startup,
      createdAt: serverTimestamp(),
    });

    firebaseLog('Startup added successfully');
  } catch (error) {
    firebaseLog('Failed to add startup', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Delete a startup
export const deleteStartup = async (userId: string, startupId: string): Promise<void> => {
  try {
    firebaseLog('Deleting startup', { userId, startupId });

    const startupRef = doc(
      firestore,
      FIRESTORE_COLLECTIONS.userStartups(userId),
      startupId
    );
    await deleteDoc(startupRef);

    firebaseLog('Startup deleted successfully');
  } catch (error) {
    firebaseLog('Failed to delete startup', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
};

// Get all startups across all users (for leaderboard)
export const getAllStartups = async (limitCount: number = 100): Promise<Startup[]> => {
  try {
    firebaseLog('Fetching all startups', { limit: limitCount });

    const startupsGroup = collectionGroup(firestore, 'startups');
    const q = query(startupsGroup, limit(limitCount));
    const snapshot = await getDocs(q);

    const startups = snapshot.docs.map((d) => d.data() as Startup);

    firebaseLog('All startups fetched successfully', { count: startups.length });
    return startups;
  } catch (error) {
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
export const getLeaderboard = async (
  type: 'allTime' | 'weekly' | 'monthly' = 'allTime',
  limitCount: number = 50
): Promise<LeaderboardEntry[]> => {
  try {
    firebaseLog('Fetching leaderboard', { type, limit: limitCount });

    const statsRef = collection(firestore, FIRESTORE_COLLECTIONS.userStats);
    const orderField = type === 'weekly' ? 'weeklyXP' : type === 'monthly' ? 'monthlyXP' : 'xp';

    const constraints: QueryConstraint[] = [
      orderBy(orderField, 'desc'),
      limit(limitCount),
    ];

    const q = query(statsRef, ...constraints);
    const snapshot = await getDocs(q);

    // Fetch user display names
    const entries: LeaderboardEntry[] = [];
    let rank = 1;

    for (const statDoc of snapshot.docs) {
      const stats = statDoc.data() as FirestoreUserStats;
      const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, stats.id);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as FirestoreUser;
        entries.push({
          id: stats.id,
          displayName: userData.displayName,
          avatarUrl: userData.avatarUrl,
          xp: type === 'weekly' ? stats.weeklyXP : type === 'monthly' ? stats.monthlyXP : stats.xp,
          level: stats.level,
          gamesWon: stats.gamesWon,
          rank: rank++,
        });
      }
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

    const sessionRef = doc(firestore, FIRESTORE_COLLECTIONS.gameSessions, session.id);
    await setDoc(sessionRef, {
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

    const sessionsRef = collection(firestore, FIRESTORE_COLLECTIONS.gameSessions);
    const q = query(
      sessionsRef,
      where('playerIds', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as GameSession[];

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
    const ref = doc(firestore, FIRESTORE_COLLECTIONS.challengeEnrollments, docId);
    await setDoc(ref, {
      ...enrollment,
      updatedAt: serverTimestamp(),
    });

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

    const ref = doc(
      firestore,
      FIRESTORE_COLLECTIONS.challengeEnrollments,
      enrollmentDocId(userId, challengeId)
    );
    // setDoc + merge pour créer le doc s'il n'existe pas encore
    // userId et challengeId inclus pour satisfaire les règles Firestore
    await setDoc(ref, {
      ...updates,
      userId,
      challengeId,
      updatedAt: serverTimestamp(),
    }, { merge: true });

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

    const ref = collection(firestore, FIRESTORE_COLLECTIONS.challengeEnrollments);
    const q = query(ref, where('userId', '==', userId));
    const snapshot = await getDocs(q);
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

  const ref = collection(firestore, FIRESTORE_COLLECTIONS.challengeEnrollments);
  const q = query(ref, where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    q,
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

  const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, userId);

  const unsubscribe = onSnapshot(
    userRef,
    async (snapshot) => {
      if (snapshot.exists()) {
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
export const subscribeToLeaderboard = (
  type: 'allTime' | 'weekly' | 'monthly',
  callback: (entries: LeaderboardEntry[]) => void,
  limitCount: number = 50
): (() => void) => {
  firebaseLog('Subscribing to leaderboard', { type, limit: limitCount });

  const statsRef = collection(firestore, FIRESTORE_COLLECTIONS.userStats);
  const orderField = type === 'weekly' ? 'weeklyXP' : type === 'monthly' ? 'monthlyXP' : 'xp';

  const q = query(
    statsRef,
    orderBy(orderField, 'desc'),
    limit(limitCount)
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const entries: LeaderboardEntry[] = [];
      let rank = 1;

      for (const statDoc of snapshot.docs) {
        const stats = statDoc.data() as FirestoreUserStats;
        const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, stats.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as FirestoreUser;
          entries.push({
            id: stats.id,
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
            xp: type === 'weekly' ? stats.weeklyXP : type === 'monthly' ? stats.monthlyXP : stats.xp,
            level: stats.level,
            gamesWon: stats.gamesWon,
            rank: rank++,
          });
        }
      }

      callback(entries);
    },
    (error) => {
      firebaseLog('Leaderboard subscription error', error);
    }
  );

  return unsubscribe;
};
