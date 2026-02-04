/**
 * Index principal pour les données du jeu
 * Charge et expose les éditions, quiz, événements, etc.
 *
 * Cases du jeu :
 * - Quiz : Question à choix multiple
 * - Duel : Affrontement entre joueurs
 * - Financement : Gain de jetons
 * - Événement : Opportunité (positif) OU Challenge (négatif) - tirage aléatoire
 */

import type {
  Challenge,
  Duel,
  Edition,
  EditionId,
  Funding,
  GameEvent,
  Opportunity,
  Quiz,
  DifficultyLevel,
  StartupIdea,
} from './types';

import { fetchEditionsFromFirestore } from '@/services/firebase/editionService';

// Import des éditions JSON (fallback local)
import classicData from './editions/classic.json';
import agricultureData from './editions/agriculture.json';
import educationData from './editions/education.json';
import santeData from './editions/sante.json';
import tourismeData from './editions/tourisme.json';
import cultureData from './editions/culture.json';

// Import du layout du plateau
import boardLayoutData from './board-layout.json';

// ===== ÉDITIONS =====

// Données locales (fallback offline uniquement)
const LOCAL_EDITIONS: Record<EditionId, Edition> = {
  classic: classicData as Edition,
  agriculture: agricultureData as Edition,
  education: educationData as Edition,
  sante: santeData as Edition,
  tourisme: tourismeData as Edition,
  culture: cultureData as Edition,
};

// Mutable — commence vide, rempli par Firestore ou fallback local
// eslint-disable-next-line import/no-mutable-exports
export let EDITIONS: Record<EditionId, Edition> = {};

/**
 * Rafraîchit les éditions depuis Firestore.
 * Firestore est la source de vérité principale.
 * Les données locales ne sont utilisées qu'en fallback si Firestore échoue ou est vide.
 */
export async function refreshEditionsFromFirestore(): Promise<void> {
  try {
    const remote = await fetchEditionsFromFirestore();
    // Si Firestore retourne des éditions, les utiliser directement (priorité absolue)
    if (Object.keys(remote).length > 0) {
      EDITIONS = remote;
      console.log('[Data] Editions loaded from Firestore:', Object.keys(remote).length, 'editions');
    } else {
      // Firestore vide, utiliser le fallback local
      console.warn('[Data] Firestore returned no editions, using local fallback');
      EDITIONS = { ...LOCAL_EDITIONS };
    }
  } catch (error) {
    // Erreur Firestore, utiliser le fallback local
    console.warn('[Data] Firestore fetch failed, using local fallback:', error);
    EDITIONS = { ...LOCAL_EDITIONS };
  }
}

export function getEdition(id: EditionId): Edition {
  // Si EDITIONS est vide, utiliser le fallback local
  if (Object.keys(EDITIONS).length === 0) {
    return LOCAL_EDITIONS[id] ?? LOCAL_EDITIONS['classic']!;
  }
  return EDITIONS[id] ?? EDITIONS['classic'] ?? LOCAL_EDITIONS['classic']!;
}

export function getEditionList(): Edition[] {
  // Si EDITIONS est vide, utiliser le fallback local
  if (Object.keys(EDITIONS).length === 0) {
    return Object.values(LOCAL_EDITIONS);
  }
  return Object.values(EDITIONS);
}

// ===== BOARD LAYOUT =====

export const BOARD_LAYOUT = boardLayoutData;

// ===== HELPERS PRIVÉS =====

function getRandomItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

// ===== CASE QUIZ =====
/**
 * Récupère un quiz aléatoire d'une édition
 */
export function getRandomQuiz(editionId: EditionId, difficulty?: DifficultyLevel): Quiz | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  const quizzes = difficulty
    ? edition.quizzes.filter(q => q.difficulty === difficulty)
    : edition.quizzes;

  return getRandomItem(quizzes);
}

// ===== CASE DUEL =====
/**
 * Récupère une question de duel aléatoire
 */
export function getRandomDuel(editionId: EditionId): Duel | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  return getRandomItem(edition.duels);
}

// ===== CASE FINANCEMENT =====
/**
 * Récupère un financement aléatoire
 */
export function getRandomFunding(editionId: EditionId): Funding | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  return getRandomItem(edition.fundings);
}

// ===== CASE ÉVÉNEMENT (Opportunité OU Challenge) =====
/**
 * Récupère un événement aléatoire (50% opportunité, 50% challenge)
 * C'est la fonction principale pour la case "Événement"
 */
export function getRandomEvent(editionId: EditionId): GameEvent | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  const { opportunities, challenges } = edition;

  // Si les deux tableaux sont vides, retourner null
  if (opportunities.length === 0 && challenges.length === 0) {
    return null;
  }

  // Tirage aléatoire : 50% opportunité, 50% challenge
  const isOpportunity = Math.random() < 0.5;

  if (isOpportunity && opportunities.length > 0) {
    const opportunity = getRandomItem(opportunities);
    if (opportunity) {
      return { type: 'opportunity', data: opportunity };
    }
  }

  if (challenges.length > 0) {
    const challenge = getRandomItem(challenges);
    if (challenge) {
      return { type: 'challenge', data: challenge };
    }
  }

  // Fallback : si un des tableaux était vide, prendre dans l'autre
  if (opportunities.length > 0) {
    const opportunity = getRandomItem(opportunities);
    if (opportunity) {
      return { type: 'opportunity', data: opportunity };
    }
  }

  return null;
}

// ===== HELPERS SÉPARÉS POUR OPPORTUNITÉS/CHALLENGES =====
/**
 * Récupère une opportunité aléatoire (événement positif uniquement)
 */
export function getRandomOpportunity(editionId: EditionId): Opportunity | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  return getRandomItem(edition.opportunities);
}

/**
 * Récupère un challenge aléatoire (événement négatif uniquement)
 */
export function getRandomChallenge(editionId: EditionId): Challenge | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  return getRandomItem(edition.challenges);
}

// ===== IDÉES DE STARTUP =====
/**
 * Récupère une idée de startup aléatoire
 */
export function getRandomStartupIdea(editionId: EditionId): StartupIdea | null {
  const edition = EDITIONS[editionId];
  if (!edition) return null;
  return getRandomItem(edition.startupIdeas ?? []);
}

// ===== VALEURS PAR DÉFAUT POUR LES QUIZ =====
export const QUIZ_DEFAULTS = {
  rewardTokens: 2,
  penaltyTokens: 0,
  timeLimit: 30,
};

// ===== EXPORTS DES TYPES =====

export * from './types';
