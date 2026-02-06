/**
 * Types pour les données de contenu du jeu
 * Structure des éditions, quiz, duels, événements, etc.
 *
 * Cases du jeu :
 * - Quiz : Question à choix multiple
 * - Duel : Affrontement entre joueurs
 * - Financement : Gain de jetons
 * - Événement : Opportunité (positif) OU Challenge (négatif) - aléatoire
 */

import type { Ionicons } from '@expo/vector-icons';

// ===== TYPES DE BASE =====

export type EditionId = string;

export type DifficultyLevel = 'facile' | 'moyen' | 'difficile';

export type QuizCategory =
  | 'business-model'
  | 'financement'
  | 'marketing'
  | 'legal'
  | 'management'
  | 'tech'
  | 'pitch'
  | 'strategie'
  | 'aspects-techniques'; // Pour les éditions spécialisées

// ===== QUIZ =====
// Case Quiz : Question à choix multiple avec timer

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index de la bonne réponse (0, 1, 2, ou 3)
  category: string;
  difficulty?: DifficultyLevel;
  explanation?: string;
  rewardTokens?: number;   // Jetons gagnés si bonne réponse (défaut: 2)
  penaltyTokens?: number;  // Jetons perdus si mauvaise réponse (défaut: 0)
  timeLimit?: number;      // Secondes (défaut: 30)
}

// ===== DUEL =====
// Case Duel : Affrontement entre 2 joueurs
// Format aligné avec DuelQuestion (question + 3 options avec points 30/20/10)

export interface DuelOption {
  text: string;
  points: number; // 30 (meilleure), 20 (bonne), 10 (acceptable)
}

export interface Duel {
  id: string;
  question: string;
  options: DuelOption[];
  category: string;
}

// ===== FINANCEMENT =====
// Case Financement : Gain de jetons

export interface Funding {
  id: string;
  title: string;
  description: string;
  tokens: number;
  source?: string; // Ex: "Tontine", "Microcrédit", "Investisseur"
}

// ===== ÉVÉNEMENTS : OPPORTUNITÉS =====
// Événement positif (tiré au hasard sur case Événement)

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  tokens: number; // Toujours positif
}

// ===== ÉVÉNEMENTS : CHALLENGES =====
// Événement négatif (tiré au hasard sur case Événement)

export interface Challenge {
  id: string;
  title: string;
  description: string;
  tokens: number; // Toujours négatif (ex: -2, -3)
}

// ===== TYPE UNION POUR ÉVÉNEMENT =====
// Une case "Événement" tire au hasard soit une opportunité soit un challenge

export type GameEvent =
  | { type: 'opportunity'; data: Opportunity }
  | { type: 'challenge'; data: Challenge };

// ===== IDÉES DE STARTUP (optionnel) =====

export interface StartupIdea {
  id: string;
  name: string;
  sector: string;
  description: string;
  problemSolved?: string;
  targetMarket?: string;
  revenueModel?: string;
}

// ===== PROJETS PAR DÉFAUT =====

export interface DefaultProject {
  id: string;
  name: string;
  description: string;
  sector: string;
  target: string;
  mission: string;
  initialBudget?: number;
  icon?: string;
}

// ===== ÉDITION COMPLÈTE =====

export interface Edition {
  id: EditionId;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  sectors?: string[];
  quizzes: Quiz[];
  duels: Duel[];
  fundings: Funding[];
  opportunities: Opportunity[];
  challenges: Challenge[];
  startupIdeas?: StartupIdea[];
  defaultProjects?: DefaultProject[];
}

// ===== HELPERS POUR VALIDATION =====

const KNOWN_EDITIONS = ['classic'];

export function isValidEditionId(id: string): id is EditionId {
  return KNOWN_EDITIONS.includes(id) || id.length > 0;
}

/**
 * Tire un élément aléatoire d'un tableau
 */
export function getRandomItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

/**
 * Tire un événement aléatoire (opportunité ou challenge)
 * 50% de chance pour chaque type
 */
export function getRandomEvent(opportunities: Opportunity[], challenges: Challenge[]): GameEvent | null {
  const isOpportunity = Math.random() < 0.5;

  if (isOpportunity) {
    const opportunity = getRandomItem(opportunities);
    if (opportunity) {
      return { type: 'opportunity', data: opportunity };
    }
  }

  const challenge = getRandomItem(challenges);
  if (challenge) {
    return { type: 'challenge', data: challenge };
  }

  // Fallback si un des tableaux est vide
  const opportunity = getRandomItem(opportunities);
  if (opportunity) {
    return { type: 'opportunity', data: opportunity };
  }

  return null;
}
