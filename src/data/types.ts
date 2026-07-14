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

/** Traductions d'un quiz (par code langue, ex: 'en'). Seuls les champs textuels sont traduits. */
export interface QuizTranslation {
  question: string;
  options: string[];
  explanation?: string;
}

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
  sectorId?: string;       // Secteur associé (si absent = générique, montré à tous)
  /** Traductions (clé = code langue). La bonne réponse/jetons restent inchangés. */
  translations?: Record<string, QuizTranslation>;
}

// ===== DUEL =====
// Case Duel : Affrontement entre 2 joueurs
// Format aligné avec DuelQuestion (question + 3 options avec points 30/20/10)

export interface DuelOption {
  text: string;
  points: number; // 30 (meilleure), 20 (bonne), 10 (acceptable)
}

/** Traduction d'un duel : question + textes des options (les points restent identiques). */
export interface DuelTranslation {
  question: string;
  options: string[]; // textes traduits, dans le même ordre que options[]
}

export interface Duel {
  id: string;
  question: string;
  options: DuelOption[];
  category: string;
  sectorId?: string;       // Secteur associé (si absent = générique, montré à tous)
  translations?: Record<string, DuelTranslation>;
}

// ===== FINANCEMENT =====
// Case Financement : Gain de jetons

/** Traduction d'un contenu titre + description (Funding / Opportunity / Challenge). */
export interface TitleDescTranslation {
  title: string;
  description: string;
}

export interface Funding {
  id: string;
  title: string;
  description: string;
  tokens: number;
  source?: string; // Ex: "Tontine", "Microcrédit", "Investisseur"
  sectorId?: string;       // Secteur associé (si absent = générique, montré à tous)
  translations?: Record<string, TitleDescTranslation>;
}

// ===== ÉVÉNEMENTS : OPPORTUNITÉS =====
// Événement positif (tiré au hasard sur case Événement)

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  tokens: number; // Toujours positif
  sectorId?: string;       // Secteur associé (si absent = générique, montré à tous)
  translations?: Record<string, TitleDescTranslation>;
}

// ===== ÉVÉNEMENTS : CHALLENGES =====
// Événement négatif (tiré au hasard sur case Événement)

export interface Challenge {
  id: string;
  title: string;
  description: string;
  tokens: number; // Toujours négatif (ex: -2, -3)
  sectorId?: string;       // Secteur associé (si absent = générique, montré à tous)
  translations?: Record<string, TitleDescTranslation>;
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

export interface DefaultProjectTranslation {
  name?: string;
  description?: string;
  target?: string;
  mission?: string;
}

export interface DefaultProject {
  id: string;
  name: string;
  description: string;
  sector: string;
  target: string;
  mission: string;
  initialBudget?: number;
  icon?: string;
  /** Traductions par langue (ex: translations.en). Seuls les champs textuels. */
  translations?: Record<string, DefaultProjectTranslation>;
}

// ===== ÉDITION COMPLÈTE =====

/** Traduction des métadonnées d'une édition (nom / description). FR = source. */
export interface EditionTranslation {
  name?: string;
  description?: string;
}

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
  /** Traductions du nom / description par langue (ex. `en`). */
  translations?: Record<string, EditionTranslation>;
}

/**
 * Nom et description d'une édition dans la langue demandée.
 * FR = source ; pour toute autre langue, lit `translations[lang]` avec repli
 * sur le champ original si la traduction manque.
 */
export function getLocalizedEdition(
  edition: Pick<Edition, 'name' | 'description' | 'translations'>,
  lang: string,
): { name: string; description: string } {
  const tr = lang !== 'fr' ? edition.translations?.[lang] : undefined;
  return {
    name: tr?.name || edition.name,
    description: tr?.description || edition.description,
  };
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
