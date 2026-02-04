/**
 * Index des Challenges disponibles
 * Firestore est la source de verite. Les donnees locales sont un fallback.
 */

import { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS } from './yeah';
import { fetchChallengesFromFirestore } from '@/services/firebase/challengeService';
import type { Challenge } from '@/types/challenge';

// Donnees locales (fallback offline)
const LOCAL_CHALLENGES: Challenge[] = [YEAH_CHALLENGE];

// Mutable — commence vide, rempli par Firestore ou fallback local
// eslint-disable-next-line import/no-mutable-exports
export let ALL_CHALLENGES: Challenge[] = [];

/**
 * Rafraichit les challenges depuis Firestore.
 * Firestore est la source de verite principale.
 * Les donnees locales ne sont utilisees qu'en fallback.
 */
export async function refreshChallengesFromFirestore(): Promise<void> {
  try {
    const remote = await fetchChallengesFromFirestore();
    if (remote.length > 0) {
      // Merger: Firestore + local fallback pour ceux qui manquent
      const remoteIds = new Set(remote.map((c) => c.id));
      const localOnly = LOCAL_CHALLENGES.filter((c) => !remoteIds.has(c.id));
      ALL_CHALLENGES = [...remote, ...localOnly];
      console.log(
        '[Challenges] Loaded from Firestore:',
        remote.length,
        'challenges' + (localOnly.length > 0 ? ` + ${localOnly.length} local` : '')
      );
    } else {
      console.warn('[Challenges] Firestore returned no challenges, using local fallback');
      ALL_CHALLENGES = [...LOCAL_CHALLENGES];
    }
  } catch (error) {
    console.warn('[Challenges] Firestore fetch failed, using local fallback:', error);
    ALL_CHALLENGES = [...LOCAL_CHALLENGES];
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
