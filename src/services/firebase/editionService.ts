/**
 * Edition Service - Fetch editions from Firestore
 * MIGRATED TO @react-native-firebase/firestore
 * Used to hot-swap local JSON data with remote Firestore data.
 */

import firestore from '@react-native-firebase/firestore';
import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';
import type { Edition, EditionId } from '@/data/types';

let cachedEditions: Record<EditionId, Edition> | null = null;

/**
 * Fetch all editions from Firestore.
 * Returns a map of EditionId -> Edition.
 */
export async function fetchEditionsFromFirestore(): Promise<Record<EditionId, Edition>> {
  try {
    const snapshot = await firestore()
      .collection(FIRESTORE_COLLECTIONS.editions)
      .get();

    const editions: Record<string, Edition> = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      editions[doc.id] = {
        id: doc.id as EditionId,
        name: data.name || '',
        description: data.description || '',
        icon: data.icon || 'game-controller-outline',
        color: data.color || '#FFBC40',
        sectors: data.sectors || [],
        quizzes: data.quizzes || [],
        duels: data.duels || [],
        fundings: data.fundings || [],
        opportunities: data.opportunities || [],
        challenges: data.challenges || [],
        startupIdeas: data.startupIdeas || [],
        defaultProjects: data.defaultProjects || [],
      } as Edition;
    });

    cachedEditions = editions as Record<EditionId, Edition>;
    // Log les détails pour debug
    for (const [id, ed] of Object.entries(editions)) {
      firebaseLog(`Edition ${id}: ${ed.defaultProjects?.length || 0} defaultProjects, ${ed.sectors?.length || 0} sectors`);
    }
    firebaseLog(`Fetched ${snapshot.docs.length} editions from Firestore`);
    return cachedEditions;
  } catch (error) {
    firebaseLog('Failed to fetch editions from Firestore', error);
    throw error;
  }
}

/**
 * Get cached editions (if previously fetched).
 */
export function getCachedEditions(): Record<EditionId, Edition> | null {
  return cachedEditions;
}
