/**
 * Index des Challenges disponibles
 * Firestore est la source de verite. Les donnees locales sont un fallback.
 */

import { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS } from './yeah';
import { fetchChallengesFromFirestore } from '@/services/firebase/challengeService';
import { cachedFetch } from '@/services/firebase/cacheHelper';
import type { Challenge } from '@/types/challenge';

// Donnees locales (fallback offline)
const LOCAL_CHALLENGES: Challenge[] = [YEAH_CHALLENGE];

// Mutable — commence vide, rempli par Firestore ou fallback local
// eslint-disable-next-line import/no-mutable-exports
export let ALL_CHALLENGES: Challenge[] = [];

/**
 * Charge les challenges : AsyncStorage d'abord, puis Firestore si stale (>24h).
 * Les donnees locales ne sont utilisees qu'en fallback si aucune donnee disponible.
 */
export async function refreshChallengesFromFirestore(): Promise<void> {
  console.log('[Challenges] Starting refresh...');
  console.log('[Challenges] LOCAL_CHALLENGES count:', LOCAL_CHALLENGES.length);

  try {
    await cachedFetch<Challenge[]>(
      'challenges',
      fetchChallengesFromFirestore,
      (remote) => {
        console.log('[Challenges] Received data, count:', remote.length);
        if (remote.length > 0) {
          const remoteIds = new Set(remote.map((c) => c.id));
          const localOnly = LOCAL_CHALLENGES.filter((c) => !remoteIds.has(c.id));
          ALL_CHALLENGES = [...remote, ...localOnly];
          console.log('[Challenges] Merged with local, total:', ALL_CHALLENGES.length);
        } else {
          // Firestore vide = suppression → fallback local
          ALL_CHALLENGES = [...LOCAL_CHALLENGES];
          console.log('[Challenges] Empty remote, using local fallback:', ALL_CHALLENGES.length);
        }
        console.log('[Challenges] Active challenges:', ALL_CHALLENGES.filter(c => c.isActive).length);
      }
    );
  } catch (error) {
    console.error('[Challenges] Refresh failed:', error);
    if (ALL_CHALLENGES.length === 0) {
      console.warn('[Challenges] No challenges available, using local fallback');
      ALL_CHALLENGES = [...LOCAL_CHALLENGES];
    }
  }
}

export function getChallengeById(id: string): Challenge | undefined {
  if (ALL_CHALLENGES.length === 0) return LOCAL_CHALLENGES.find((c) => c.id === id);
  return ALL_CHALLENGES.find((c) => c.id === id);
}

export function getChallengeBySlug(slug: string): Challenge | undefined {
  if (ALL_CHALLENGES.length === 0) return LOCAL_CHALLENGES.find((c) => c.slug === slug);
  return ALL_CHALLENGES.find((c) => c.slug === slug);
}

export function getActiveChallenges(): Challenge[] {
  if (ALL_CHALLENGES.length === 0) return LOCAL_CHALLENGES.filter((c) => c.isActive);
  return ALL_CHALLENGES.filter((c) => c.isActive);
}

export { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS };
export { YEAH_FINAL_QUIZ, QUIZ_PASS_THRESHOLD, type FinalQuizQuestion } from './quizQuestions';
