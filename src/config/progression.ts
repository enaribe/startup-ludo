/**
 * Système de Progression - Rangs, XP et Niveaux
 *
 * Parcours entrepreneurial du joueur :
 * Stagiaire → Aspirant → Entrepreneur → Expert → Mogul → CEO → Légende
 */

import type { Ionicons } from '@expo/vector-icons';

// ===== TYPES =====

export type UserRank =
  | 'Stagiaire'
  | 'Aspirant'
  | 'Entrepreneur Débutant'
  | 'Entrepreneur Confirmé'
  | 'Expert Business'
  | 'Mogul'
  | 'CEO'
  | 'Légende';

export interface RankInfo {
  id: UserRank;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  minXP: number;
  badge: string; // Emoji badge
}

export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpTotal: number; // XP cumulé depuis le niveau 1
}

export interface XPReward {
  type: string;
  amount: number;
  description: string;
}

// ===== CONFIGURATION DES RANGS =====

export const RANKS: RankInfo[] = [
  {
    id: 'Stagiaire',
    title: 'Stagiaire',
    description: 'Tu commences ton aventure entrepreneuriale',
    icon: 'school-outline',
    color: '#9E9E9E',
    minXP: 0,
    badge: '🎓',
  },
  {
    id: 'Aspirant',
    title: 'Aspirant',
    description: 'Tu as les bases, continue !',
    icon: 'bulb-outline',
    color: '#8BC34A',
    minXP: 100,
    badge: '💡',
  },
  {
    id: 'Entrepreneur Débutant',
    title: 'Entrepreneur Débutant',
    description: 'Tu lances tes premiers projets',
    icon: 'rocket-outline',
    color: '#03A9F4',
    minXP: 500,
    badge: '🚀',
  },
  {
    id: 'Entrepreneur Confirmé',
    title: 'Entrepreneur Confirmé',
    description: 'Tes projets prennent de l\'ampleur',
    icon: 'trending-up-outline',
    color: '#FF9800',
    minXP: 1500,
    badge: '📈',
  },
  {
    id: 'Expert Business',
    title: 'Expert Business',
    description: 'Tu maîtrises l\'art des affaires',
    icon: 'briefcase-outline',
    color: '#E91E63',
    minXP: 4000,
    badge: '💼',
  },
  {
    id: 'Mogul',
    title: 'Mogul',
    description: 'Tu bâtis un empire',
    icon: 'business-outline',
    color: '#9C27B0',
    minXP: 10000,
    badge: '🏢',
  },
  {
    id: 'CEO',
    title: 'CEO',
    description: 'Tu diriges avec excellence',
    icon: 'ribbon-outline',
    color: '#FF5722',
    minXP: 25000,
    badge: '👔',
  },
  {
    id: 'Légende',
    title: 'Légende',
    description: 'Tu es une icône de l\'entrepreneuriat',
    icon: 'star',
    color: '#FFD700',
    minXP: 50000,
    badge: '👑',
  },
];

// Map pour accès rapide par ID
export const RANKS_MAP: Record<UserRank, RankInfo> = RANKS.reduce(
  (acc, rank) => ({ ...acc, [rank.id]: rank }),
  {} as Record<UserRank, RankInfo>
);

// ===== CONFIGURATION DES NIVEAUX =====

// Formule XP par niveau : 100 * niveau (niveau 1 = 100 XP, niveau 10 = 1000 XP)
export function getXPForLevel(level: number): number {
  return level * 100;
}

// Calcule le niveau à partir de l'XP total
export function getLevelFromXP(totalXP: number): { level: number; currentXP: number; xpForNext: number } {
  let level = 1;
  let xpRemaining = totalXP;

  while (xpRemaining >= getXPForLevel(level)) {
    xpRemaining -= getXPForLevel(level);
    level++;
  }

  return {
    level,
    currentXP: xpRemaining,
    xpForNext: getXPForLevel(level),
  };
}

// ===== RÉCOMPENSES XP =====

export const XP_REWARDS: Record<string, XPReward> = {
  // Parties
  GAME_PLAYED: { type: 'game', amount: 10, description: 'Partie jouée' },
  GAME_WON: { type: 'game', amount: 50, description: 'Partie gagnée' },
  GAME_PODIUM: { type: 'game', amount: 25, description: 'Podium (2ème ou 3ème)' },

  // Quiz
  QUIZ_CORRECT: { type: 'quiz', amount: 5, description: 'Bonne réponse au quiz' },
  QUIZ_PERFECT: { type: 'quiz', amount: 15, description: 'Réponse parfaite (temps record)' },
  QUIZ_STREAK_3: { type: 'quiz', amount: 10, description: '3 bonnes réponses d\'affilée' },
  QUIZ_STREAK_5: { type: 'quiz', amount: 25, description: '5 bonnes réponses d\'affilée' },

  // Duel
  DUEL_WON: { type: 'duel', amount: 20, description: 'Duel gagné' },
  DUEL_LOST: { type: 'duel', amount: 5, description: 'Duel perdu (participation)' },

  // Tokens
  TOKEN_MILESTONE_10: { type: 'token', amount: 15, description: '10 jetons accumulés' },
  TOKEN_MILESTONE_25: { type: 'token', amount: 30, description: '25 jetons accumulés' },
  TOKEN_MILESTONE_50: { type: 'token', amount: 50, description: '50 jetons accumulés' },

  // Startups
  STARTUP_CREATED: { type: 'startup', amount: 25, description: 'Startup créée' },
  STARTUP_UPGRADED: { type: 'startup', amount: 10, description: 'Startup améliorée' },

  // Social
  FIRST_GAME: { type: 'social', amount: 50, description: 'Première partie' },
  DAILY_LOGIN: { type: 'social', amount: 5, description: 'Connexion quotidienne' },
  INVITE_FRIEND: { type: 'social', amount: 100, description: 'Ami invité' },
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Calcule le rang à partir de l'XP total
 */
export function getRankFromXP(totalXP: number): RankInfo {
  let currentRank = RANKS[0]!;

  for (const rank of RANKS) {
    if (totalXP >= rank.minXP) {
      currentRank = rank;
    } else {
      break;
    }
  }

  return currentRank;
}

/**
 * Calcule l'XP nécessaire pour le prochain rang
 */
export function getXPForNextRank(totalXP: number): { nextRank: RankInfo | null; xpNeeded: number } {
  const currentRank = getRankFromXP(totalXP);
  const currentIndex = RANKS.findIndex((r) => r.id === currentRank.id);
  const nextRank = RANKS[currentIndex + 1] ?? null;

  if (!nextRank) {
    return { nextRank: null, xpNeeded: 0 };
  }

  return {
    nextRank,
    xpNeeded: nextRank.minXP - totalXP,
  };
}

/**
 * Calcule le pourcentage de progression vers le prochain rang
 */
export function getRankProgress(totalXP: number): number {
  const currentRank = getRankFromXP(totalXP);
  const currentIndex = RANKS.findIndex((r) => r.id === currentRank.id);
  const nextRank = RANKS[currentIndex + 1];

  if (!nextRank) {
    return 100; // Rang max atteint
  }

  const xpInCurrentRank = totalXP - currentRank.minXP;
  const xpNeededForNext = nextRank.minXP - currentRank.minXP;

  return Math.min(100, Math.floor((xpInCurrentRank / xpNeededForNext) * 100));
}

/**
 * Vérifie si un rang up est possible
 */
export function checkRankUp(oldXP: number, newXP: number): RankInfo | null {
  const oldRank = getRankFromXP(oldXP);
  const newRank = getRankFromXP(newXP);

  if (newRank.id !== oldRank.id) {
    return newRank;
  }

  return null;
}

/**
 * Formate l'affichage de l'XP
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`;
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`;
  }
  return xp.toString();
}
