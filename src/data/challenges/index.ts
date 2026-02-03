/**
 * Index des Challenges disponibles
 */

import { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS } from './yeah';
import type { Challenge } from '@/types/challenge';

export const ALL_CHALLENGES: Challenge[] = [YEAH_CHALLENGE];

export function getChallengeById(id: string): Challenge | undefined {
  return ALL_CHALLENGES.find((c) => c.id === id);
}

export function getChallengeBySlug(slug: string): Challenge | undefined {
  return ALL_CHALLENGES.find((c) => c.slug === slug);
}

export function getActiveChallenges(): Challenge[] {
  return ALL_CHALLENGES.filter((c) => c.isActive);
}

export { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS };
export { YEAH_FINAL_QUIZ, QUIZ_PASS_THRESHOLD, type FinalQuizQuestion } from './quizQuestions';
