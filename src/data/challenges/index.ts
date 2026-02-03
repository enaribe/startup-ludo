/**
 * Index des programmes Challenge (accompagnement)
 */

import type { Challenge } from '@/types/challenge';
import { YEAH_CHALLENGE } from './yeah';

export const ALL_CHALLENGES: Challenge[] = [YEAH_CHALLENGE];

export function getChallengeById(id: string): Challenge | undefined {
  return ALL_CHALLENGES.find((c) => c.id === id);
}

export function getChallengeBySlug(slug: string): Challenge | undefined {
  return ALL_CHALLENGES.find((c) => c.slug === slug);
}

export { YEAH_CHALLENGE } from './yeah';
export {
  QUIZ_FINAL_QUESTIONS,
  QUIZ_PASS_THRESHOLD,
  type QuizFinalQuestion,
} from './quizQuestions';
