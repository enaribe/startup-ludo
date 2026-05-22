/**
 * Social Service - Gestion des relations follow/unfollow
 */
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  Timestamp,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

type QDocSnap = FirebaseFirestoreTypes.QueryDocumentSnapshot;
import { firebaseLog, getFirebaseErrorMessage } from './config';

export const SOCIAL_COLLECTIONS = {
  follows: 'follows',
  users: 'users',
  userStats: 'userStats',
} as const;

export interface SocialUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  rank: string;
  xp: number;
  level: number;
  gamesPlayed: number;
  gamesWon: number;
  startupCount: number;
}

// ===== FOLLOW / UNFOLLOW =====

export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    firebaseLog('followUser', { currentUserId, targetUserId });
    const db = getFirestore();
    const followId = `${currentUserId}_${targetUserId}`;

    await runTransaction(db, async (tx) => {
      const followRef = doc(db, SOCIAL_COLLECTIONS.follows, followId);
      const currentUserRef = doc(db, SOCIAL_COLLECTIONS.users, currentUserId);

      const followSnap = await tx.get(followRef);
      if (followSnap.exists()) {
        return;
      }

      const currentSnap = await tx.get(currentUserRef);

      tx.set(followRef, {
        followerId: currentUserId,
        followingId: targetUserId,
        createdAt: Timestamp.now(),
      });

      const currentData = currentSnap.data() ?? {};

      tx.update(currentUserRef, {
        followingCount: ((currentData.followingCount as number) ?? 0) + 1,
      });
    });
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error));
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    firebaseLog('unfollowUser', { currentUserId, targetUserId });
    const db = getFirestore();
    const followId = `${currentUserId}_${targetUserId}`;

    await runTransaction(db, async (tx) => {
      const followRef = doc(db, SOCIAL_COLLECTIONS.follows, followId);
      const currentUserRef = doc(db, SOCIAL_COLLECTIONS.users, currentUserId);

      const followSnap = await tx.get(followRef);
      if (!followSnap.exists()) {
        return;
      }

      const currentSnap = await tx.get(currentUserRef);

      tx.delete(followRef);

      const currentData = currentSnap.data() ?? {};

      tx.update(currentUserRef, {
        followingCount: Math.max(0, ((currentData.followingCount as number) ?? 0) - 1),
      });
    });
  } catch (error) {
    throw new Error(getFirebaseErrorMessage(error));
  }
};

export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const db = getFirestore();
    const followId = `${currentUserId}_${targetUserId}`;
    const snap = await getDoc(doc(db, SOCIAL_COLLECTIONS.follows, followId));
    return snap.exists();
  } catch {
    return false;
  }
};

// ===== HELPERS =====

/** Tri des follows sans index composite (évite firestore/failed-precondition sur followerId + createdAt). */
function timestampMillisFromFirestore(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'object') {
    const withToMillis = value as { toMillis?: () => number };
    if (typeof withToMillis.toMillis === 'function') {
      return withToMillis.toMillis();
    }
    const withSeconds = value as { seconds?: number };
    if (typeof withSeconds.seconds === 'number') {
      return withSeconds.seconds * 1000;
    }
  }
  return 0;
}

const mapDocToSocialUser = async (db: ReturnType<typeof getFirestore>, userId: string): Promise<SocialUser | null> => {
  try {
    const [userSnap, statsSnap] = await Promise.all([
      getDoc(doc(db, SOCIAL_COLLECTIONS.users, userId)),
      getDoc(doc(db, SOCIAL_COLLECTIONS.userStats, userId)),
    ]);
    if (!userSnap.exists()) return null;
    const userData = userSnap.data() ?? {};
    const statsData = statsSnap.data() ?? {};
    return {
      id: userId,
      displayName: (userData.displayName as string) ?? 'Joueur',
      avatarUrl: (userData.avatarUrl as string | null) ?? null,
      rank: (statsData.rank as string) ?? 'Stagiaire',
      xp: (statsData.xp as number) ?? 0,
      level: (statsData.level as number) ?? 1,
      gamesPlayed: (statsData.totalGames as number) ?? 0,
      gamesWon: (statsData.gamesWon as number) ?? 0,
      startupCount: 0,
    };
  } catch {
    return null;
  }
};

// ===== GETTERS =====

export const getFollowing = async (userId: string, limitCount = 50): Promise<SocialUser[]> => {
  try {
    firebaseLog('getFollowing', { userId });
    const db = getFirestore();
    const q = query(collection(db, SOCIAL_COLLECTIONS.follows), where('followerId', '==', userId));
    const snap = await getDocs(q);
    const sortedDocs = [...snap.docs]
      .sort((a, b) => {
        const ta = timestampMillisFromFirestore(a.data().createdAt);
        const tb = timestampMillisFromFirestore(b.data().createdAt);
        return tb - ta;
      })
      .slice(0, limitCount);
    const ids = sortedDocs.map((d) => d.data().followingId as string);
    const users = await Promise.all(ids.map((id) => mapDocToSocialUser(db, id)));
    return users.filter((u): u is SocialUser => u !== null);
  } catch (error) {
    firebaseLog('getFollowing error', error);
    return [];
  }
};

export const getFollowers = async (userId: string, limitCount = 50): Promise<SocialUser[]> => {
  try {
    firebaseLog('getFollowers', { userId });
    const db = getFirestore();
    const q = query(collection(db, SOCIAL_COLLECTIONS.follows), where('followingId', '==', userId));
    const snap = await getDocs(q);
    const sortedDocs = [...snap.docs]
      .sort((a, b) => {
        const ta = timestampMillisFromFirestore(a.data().createdAt);
        const tb = timestampMillisFromFirestore(b.data().createdAt);
        return tb - ta;
      })
      .slice(0, limitCount);
    const ids = sortedDocs.map((d) => d.data().followerId as string);
    const users = await Promise.all(ids.map((id) => mapDocToSocialUser(db, id)));
    return users.filter((u): u is SocialUser => u !== null);
  } catch (error) {
    firebaseLog('getFollowers error', error);
    return [];
  }
};

/**
 * Recherche d'utilisateurs par pseudo, via la collection `usernames`.
 * Les pseudos \u00e9tant uniques et stock\u00e9s en minuscules (id du doc), la recherche
 * est insensible \u00e0 la casse et ne renvoie jamais de doublon.
 */
export const searchUsers = async (queryStr: string, limitCount = 20): Promise<SocialUser[]> => {
  try {
    const normalized = queryStr.trim().toLowerCase();
    if (!normalized) return [];
    firebaseLog('searchUsers', { queryStr: normalized });
    const db = getFirestore();

    // Recherche par pr\u00e9fixe sur le champ usernameLower (pseudo en minuscules)
    const end = normalized + '\uf8ff';
    const q = query(
      collection(db, 'usernames'),
      where('usernameLower', '>=', normalized),
      where('usernameLower', '<=', end),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    const userIds: string[] = (snap.docs as QDocSnap[])
      .map((d) => d.data().userId as string)
      .filter((id): id is string => !!id);
    const users = await Promise.all(userIds.map((id) => mapDocToSocialUser(db, id)));
    return users.filter((u): u is SocialUser => u !== null);
  } catch (error) {
    firebaseLog('searchUsers error', error);
    return [];
  }
};

export const getFollowCounts = async (userId: string): Promise<{ followersCount: number; followingCount: number }> => {
  try {
    const db = getFirestore();
    const userSnap = await getDoc(doc(db, SOCIAL_COLLECTIONS.users, userId));
    const data = userSnap.data() ?? {};
    const followingCount = (data.followingCount as number) ?? 0;

    const followersQ = query(
      collection(db, SOCIAL_COLLECTIONS.follows),
      where('followingId', '==', userId)
    );
    const followersSnap = await getDocs(followersQ);
    const followersCount = followersSnap.docs.length;

    return { followersCount, followingCount };
  } catch {
    return { followersCount: 0, followingCount: 0 };
  }
};
