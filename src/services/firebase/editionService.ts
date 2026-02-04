/**
 * Edition Service - Fetch editions from Firestore
 * Used to hot-swap local JSON data with remote Firestore data.
 */

import { collection, getDocs } from 'firebase/firestore';
import { firestore, FIRESTORE_COLLECTIONS, firebaseLog } from './config';
import type { Edition, EditionId } from '@/data/types';

let cachedEditions: Record<EditionId, Edition> | null = null;

/**
 * Fetch all editions from Firestore.
 * Returns a map of EditionId -> Edition.
 */
export async function fetchEditionsFromFirestore(): Promise<Record<EditionId, Edition>> {
  try {
    const snapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.editions));
    const editions: Record<string, Edition> = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      editions[doc.id] = {
        id: doc.id as EditionId,
        name: data.name || '',
        description: data.description || '',
        icon: data.icon || 'game-controller-outline',
        color: data.color || '#FFBC40',
        quizzes: data.quizzes || [],
        duels: data.duels || [],
        fundings: data.fundings || [],
        opportunities: data.opportunities || [],
        challenges: data.challenges || [],
        startupIdeas: data.startupIdeas || [],
      } as Edition;
    });

    cachedEditions = editions as Record<EditionId, Edition>;
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
