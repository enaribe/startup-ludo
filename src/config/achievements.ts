/**
 * Système d'Achievements (Succès)
 *
 * Catégories :
 * - Débutant : Pour les nouveaux joueurs
 * - Joueur : Basés sur le nombre de parties
 * - Vainqueur : Basés sur les victoires
 * - Entrepreneur : Basés sur les startups
 * - Savant : Basés sur les quiz
 * - Social : Basés sur le multijoueur
 * - Collectionneur : Basés sur les jetons
 * - Légende : Achievements rares et difficiles
 */

import type { Ionicons } from '@expo/vector-icons';

// ===== TYPES =====

export type AchievementCategory =
  | 'debutant'
  | 'joueur'
  | 'vainqueur'
  | 'entrepreneur'
  | 'savant'
  | 'social'
  | 'collectionneur'
  | 'legende';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  condition: AchievementCondition;
  secret?: boolean; // Achievement caché jusqu'à déblocage
}

export type AchievementCondition =
  | { type: 'games_played'; count: number }
  | { type: 'games_won'; count: number }
  | { type: 'win_streak'; count: number }
  | { type: 'tokens_earned'; count: number }
  | { type: 'tokens_in_game'; count: number }
  | { type: 'quiz_correct'; count: number }
  | { type: 'quiz_streak'; count: number }
  | { type: 'duels_won'; count: number }
  | { type: 'startups_created'; count: number }
  | { type: 'rank_reached'; rank: string }
  | { type: 'level_reached'; level: number }
  | { type: 'perfect_game' } // Gagner sans perdre de jetons
  | { type: 'comeback' } // Gagner après avoir été dernier
  | { type: 'speed_win'; turns: number } // Gagner en X tours max
  | { type: 'first_game' }
  | { type: 'first_win' }
  | { type: 'multiplayer_games'; count: number };

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
}

// ===== CONFIGURATION DES COULEURS PAR RARETÉ =====

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

// ===== LISTE DES ACHIEVEMENTS =====

export const ACHIEVEMENTS: Achievement[] = [
  // ===== DÉBUTANT =====
  {
    id: 'first_steps',
    title: 'Premiers Pas',
    description: 'Joue ta première partie',
    icon: 'footsteps-outline',
    category: 'debutant',
    rarity: 'common',
    xpReward: 50,
    condition: { type: 'first_game' },
  },
  {
    id: 'first_victory',
    title: 'Première Victoire',
    description: 'Remporte ta première partie',
    icon: 'trophy-outline',
    category: 'debutant',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'first_win' },
  },
  {
    id: 'getting_started',
    title: 'C\'est parti !',
    description: 'Atteins le niveau 5',
    icon: 'rocket-outline',
    category: 'debutant',
    rarity: 'common',
    xpReward: 75,
    condition: { type: 'level_reached', level: 5 },
  },

  // ===== JOUEUR =====
  {
    id: 'regular_player',
    title: 'Joueur Régulier',
    description: 'Joue 10 parties',
    icon: 'game-controller-outline',
    category: 'joueur',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'games_played', count: 10 },
  },
  {
    id: 'dedicated_player',
    title: 'Joueur Dévoué',
    description: 'Joue 50 parties',
    icon: 'game-controller',
    category: 'joueur',
    rarity: 'rare',
    xpReward: 250,
    condition: { type: 'games_played', count: 50 },
  },
  {
    id: 'veteran_player',
    title: 'Vétéran',
    description: 'Joue 100 parties',
    icon: 'medal-outline',
    category: 'joueur',
    rarity: 'epic',
    xpReward: 500,
    condition: { type: 'games_played', count: 100 },
  },

  // ===== VAINQUEUR =====
  {
    id: 'winner_5',
    title: 'Gagnant',
    description: 'Remporte 5 parties',
    icon: 'trophy-outline',
    category: 'vainqueur',
    rarity: 'common',
    xpReward: 150,
    condition: { type: 'games_won', count: 5 },
  },
  {
    id: 'winner_25',
    title: 'Champion',
    description: 'Remporte 25 parties',
    icon: 'trophy',
    category: 'vainqueur',
    rarity: 'rare',
    xpReward: 400,
    condition: { type: 'games_won', count: 25 },
  },
  {
    id: 'winner_100',
    title: 'Grand Champion',
    description: 'Remporte 100 parties',
    icon: 'star',
    category: 'vainqueur',
    rarity: 'legendary',
    xpReward: 1000,
    condition: { type: 'games_won', count: 100 },
  },
  {
    id: 'win_streak_3',
    title: 'En Forme',
    description: 'Gagne 3 parties d\'affilée',
    icon: 'flame-outline',
    category: 'vainqueur',
    rarity: 'rare',
    xpReward: 200,
    condition: { type: 'win_streak', count: 3 },
  },
  {
    id: 'win_streak_5',
    title: 'Inarrêtable',
    description: 'Gagne 5 parties d\'affilée',
    icon: 'flame',
    category: 'vainqueur',
    rarity: 'epic',
    xpReward: 500,
    condition: { type: 'win_streak', count: 5 },
  },

  // ===== ENTREPRENEUR =====
  {
    id: 'first_startup',
    title: 'Fondateur',
    description: 'Crée ta première startup',
    icon: 'business-outline',
    category: 'entrepreneur',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'startups_created', count: 1 },
  },
  {
    id: 'serial_entrepreneur',
    title: 'Serial Entrepreneur',
    description: 'Crée 5 startups',
    icon: 'business',
    category: 'entrepreneur',
    rarity: 'rare',
    xpReward: 300,
    condition: { type: 'startups_created', count: 5 },
  },
  {
    id: 'empire_builder',
    title: 'Bâtisseur d\'Empire',
    description: 'Crée 10 startups',
    icon: 'globe-outline',
    category: 'entrepreneur',
    rarity: 'epic',
    xpReward: 750,
    condition: { type: 'startups_created', count: 10 },
  },

  // ===== SAVANT (Quiz) =====
  {
    id: 'quiz_novice',
    title: 'Apprenti',
    description: 'Réponds correctement à 25 quiz',
    icon: 'school-outline',
    category: 'savant',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'quiz_correct', count: 25 },
  },
  {
    id: 'quiz_expert',
    title: 'Expert',
    description: 'Réponds correctement à 100 quiz',
    icon: 'school',
    category: 'savant',
    rarity: 'rare',
    xpReward: 300,
    condition: { type: 'quiz_correct', count: 100 },
  },
  {
    id: 'quiz_master',
    title: 'Maître du Savoir',
    description: 'Réponds correctement à 500 quiz',
    icon: 'ribbon',
    category: 'savant',
    rarity: 'epic',
    xpReward: 750,
    condition: { type: 'quiz_correct', count: 500 },
  },
  {
    id: 'quiz_streak_5',
    title: 'Sans Faute',
    description: '5 bonnes réponses d\'affilée',
    icon: 'checkmark-circle-outline',
    category: 'savant',
    rarity: 'rare',
    xpReward: 150,
    condition: { type: 'quiz_streak', count: 5 },
  },
  {
    id: 'quiz_streak_10',
    title: 'Parfait',
    description: '10 bonnes réponses d\'affilée',
    icon: 'checkmark-circle',
    category: 'savant',
    rarity: 'epic',
    xpReward: 400,
    condition: { type: 'quiz_streak', count: 10 },
  },

  // ===== COLLECTIONNEUR (Jetons) =====
  {
    id: 'tokens_100',
    title: 'Économe',
    description: 'Accumule 100 jetons au total',
    icon: 'cash-outline',
    category: 'collectionneur',
    rarity: 'common',
    xpReward: 100,
    condition: { type: 'tokens_earned', count: 100 },
  },
  {
    id: 'tokens_500',
    title: 'Investisseur',
    description: 'Accumule 500 jetons au total',
    icon: 'cash',
    category: 'collectionneur',
    rarity: 'rare',
    xpReward: 300,
    condition: { type: 'tokens_earned', count: 500 },
  },
  {
    id: 'tokens_2000',
    title: 'Millionnaire',
    description: 'Accumule 2000 jetons au total',
    icon: 'diamond-outline',
    category: 'collectionneur',
    rarity: 'epic',
    xpReward: 750,
    condition: { type: 'tokens_earned', count: 2000 },
  },
  {
    id: 'tokens_in_game_8',
    title: 'Coffre-fort Plein',
    description: 'Termine une partie avec 8 jetons (maximum)',
    icon: 'wallet-outline',
    category: 'collectionneur',
    rarity: 'epic',
    xpReward: 250,
    condition: { type: 'tokens_in_game', count: 8 },
  },

  // ===== SOCIAL =====
  {
    id: 'multiplayer_first',
    title: 'Sociable',
    description: 'Joue ta première partie multijoueur',
    icon: 'people-outline',
    category: 'social',
    rarity: 'common',
    xpReward: 75,
    condition: { type: 'multiplayer_games', count: 1 },
  },
  {
    id: 'multiplayer_10',
    title: 'Joueur en Ligne',
    description: 'Joue 10 parties multijoueur',
    icon: 'people',
    category: 'social',
    rarity: 'rare',
    xpReward: 250,
    condition: { type: 'multiplayer_games', count: 10 },
  },
  {
    id: 'duel_master',
    title: 'Maître du Duel',
    description: 'Gagne 25 duels',
    icon: 'flash-outline',
    category: 'social',
    rarity: 'rare',
    xpReward: 300,
    condition: { type: 'duels_won', count: 25 },
  },

  // ===== LÉGENDE =====
  {
    id: 'rank_mogul',
    title: 'Le Mogul',
    description: 'Atteins le rang Mogul',
    icon: 'business',
    category: 'legende',
    rarity: 'epic',
    xpReward: 500,
    condition: { type: 'rank_reached', rank: 'Mogul' },
  },
  {
    id: 'rank_legend',
    title: 'Légende Vivante',
    description: 'Atteins le rang Légende',
    icon: 'star',
    category: 'legende',
    rarity: 'legendary',
    xpReward: 2000,
    condition: { type: 'rank_reached', rank: 'Légende' },
  },
  {
    id: 'perfect_game',
    title: 'Sans Accroc',
    description: 'Gagne une partie sans jamais perdre de jetons',
    icon: 'shield-checkmark-outline',
    category: 'legende',
    rarity: 'epic',
    xpReward: 500,
    condition: { type: 'perfect_game' },
    secret: true,
  },
  {
    id: 'comeback_king',
    title: 'Roi du Comeback',
    description: 'Gagne après avoir été dernier',
    icon: 'trending-up',
    category: 'legende',
    rarity: 'epic',
    xpReward: 400,
    condition: { type: 'comeback' },
    secret: true,
  },
  {
    id: 'speed_demon',
    title: 'Éclair',
    description: 'Gagne une partie en moins de 15 tours',
    icon: 'flash',
    category: 'legende',
    rarity: 'legendary',
    xpReward: 750,
    condition: { type: 'speed_win', turns: 15 },
    secret: true,
  },
];

// Map pour accès rapide par ID
export const ACHIEVEMENTS_MAP: Record<string, Achievement> = ACHIEVEMENTS.reduce(
  (acc, achievement) => ({ ...acc, [achievement.id]: achievement }),
  {} as Record<string, Achievement>
);

// Groupement par catégorie
export const ACHIEVEMENTS_BY_CATEGORY: Record<AchievementCategory, Achievement[]> = {
  debutant: ACHIEVEMENTS.filter((a) => a.category === 'debutant'),
  joueur: ACHIEVEMENTS.filter((a) => a.category === 'joueur'),
  vainqueur: ACHIEVEMENTS.filter((a) => a.category === 'vainqueur'),
  entrepreneur: ACHIEVEMENTS.filter((a) => a.category === 'entrepreneur'),
  savant: ACHIEVEMENTS.filter((a) => a.category === 'savant'),
  social: ACHIEVEMENTS.filter((a) => a.category === 'social'),
  collectionneur: ACHIEVEMENTS.filter((a) => a.category === 'collectionneur'),
  legende: ACHIEVEMENTS.filter((a) => a.category === 'legende'),
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  debutant: 'Débutant',
  joueur: 'Joueur',
  vainqueur: 'Vainqueur',
  entrepreneur: 'Entrepreneur',
  savant: 'Savant',
  social: 'Social',
  collectionneur: 'Collectionneur',
  legende: 'Légende',
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Récupère un achievement par son ID
 */
export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS_MAP[id];
}

/**
 * Calcule le nombre total d'achievements
 */
export function getTotalAchievements(): number {
  return ACHIEVEMENTS.length;
}

/**
 * Calcule le nombre d'achievements débloqués
 */
export function getUnlockedCount(unlockedIds: string[]): number {
  return unlockedIds.filter((id) => ACHIEVEMENTS_MAP[id]).length;
}

/**
 * Calcule le pourcentage de complétion
 */
export function getCompletionPercentage(unlockedIds: string[]): number {
  return Math.floor((getUnlockedCount(unlockedIds) / getTotalAchievements()) * 100);
}

/**
 * Récupère les achievements non débloqués (non secrets)
 */
export function getLockedAchievements(unlockedIds: string[]): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => !unlockedIds.includes(a.id) && !a.secret
  );
}

/**
 * Récupère le prochain achievement le plus proche à débloquer
 */
export function getNextAchievements(
  unlockedIds: string[],
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    tokensEarned: number;
    quizCorrect: number;
    startupsCreated: number;
  },
  limit = 3
): Achievement[] {
  const locked = getLockedAchievements(unlockedIds);

  // Trier par proximité de déblocage (simplifié)
  return locked
    .map((a) => {
      let progress = 0;
      const condition = a.condition;

      switch (condition.type) {
        case 'games_played':
          progress = stats.gamesPlayed / condition.count;
          break;
        case 'games_won':
          progress = stats.gamesWon / condition.count;
          break;
        case 'tokens_earned':
          progress = stats.tokensEarned / condition.count;
          break;
        case 'quiz_correct':
          progress = stats.quizCorrect / condition.count;
          break;
        case 'startups_created':
          progress = stats.startupsCreated / condition.count;
          break;
        default:
          progress = 0;
      }

      return { achievement: a, progress };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit)
    .map((item) => item.achievement);
}
