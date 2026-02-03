/**
 * Index des Challenges disponibles
 */

import { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS } from './yeah';
import type { Challenge } from '@/types/challenge';

// Liste de tous les Challenges disponibles
export const ALL_CHALLENGES: Challenge[] = [
  YEAH_CHALLENGE,
  // Ajouter d'autres Challenges ici (DER-FJ, FORCE-N, etc.)
];

// Obtenir un Challenge par son ID
export function getChallengeById(id: string): Challenge | undefined {
  return ALL_CHALLENGES.find((c) => c.id === id);
}

// Obtenir un Challenge par son slug
export function getChallengeBySlug(slug: string): Challenge | undefined {
  return ALL_CHALLENGES.find((c) => c.slug === slug);
}

// Obtenir les Challenges actifs
export function getActiveChallenges(): Challenge[] {
  return ALL_CHALLENGES.filter((c) => c.isActive);
}

// Exports
export { YEAH_CHALLENGE, YEAH_LEVELS, YEAH_SECTORS };
