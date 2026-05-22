/**
 * Achievement Service — évaluation et déblocage des succès.
 *
 * `evaluateAchievements` est une fonction pure : on lui passe l'instantané des
 * stats du joueur + le contexte de la partie qui vient de se terminer, elle
 * renvoie les succès nouvellement débloqués (non encore présents dans la liste).
 */
import { ACHIEVEMENTS, type Achievement, type AchievementCondition } from '@/config/achievements';

/**
 * Instantané des stats utilisé pour évaluer les conditions.
 * Les valeurs reflètent l'état APRÈS la partie (stats déjà incrémentées).
 */
export interface AchievementStats {
  /** Parties jouées au total. */
  gamesPlayed: number;
  /** Victoires au total. */
  gamesWon: number;
  /** Jetons cumulés sur toutes les parties. */
  totalTokensEarned: number;
  /** Nombre de startups créées. */
  startupsCreated: number;
  /** Niveau actuel. */
  level: number;
  /** Rang actuel (titre). */
  rank: string;
  /** Parties multijoueur (online) jouées. */
  multiplayerGames: number;
  /** Bonnes réponses au quiz cumulées (0 si non tracké). */
  quizCorrect: number;
  /** Duels gagnés cumulés (0 si non tracké). */
  duelsWon: number;
  /** Plus longue série de victoires consécutives (0 si non tracké). */
  bestWinStreak: number;
  /** Meilleure série de bonnes réponses consécutives (0 si non tracké). */
  bestQuizStreak: number;
}

/**
 * Contexte de la partie qui vient de se terminer.
 * Sert pour les conditions liées à une partie précise.
 */
export interface GameEndContext {
  /** Le joueur a-t-il gagné cette partie ? */
  isWinner: boolean;
  /** Jetons en main à la fin de la partie. */
  tokensInGame: number;
  /** Nombre de tours qu'a duré la partie. */
  turnsPlayed: number;
  /** Le joueur a-t-il gagné sans jamais perdre de jetons ? */
  noTokensLost: boolean;
  /** Le joueur était-il dernier à un moment puis a gagné ? */
  wasLastThenWon: boolean;
}

/** Vrai si une condition est satisfaite par les stats / le contexte donnés. */
function isConditionMet(
  condition: AchievementCondition,
  stats: AchievementStats,
  ctx: GameEndContext
): boolean {
  switch (condition.type) {
    case 'first_game':
      return stats.gamesPlayed >= 1;
    case 'first_win':
      return stats.gamesWon >= 1;
    case 'games_played':
      return stats.gamesPlayed >= condition.count;
    case 'games_won':
      return stats.gamesWon >= condition.count;
    case 'tokens_earned':
      return stats.totalTokensEarned >= condition.count;
    case 'startups_created':
      return stats.startupsCreated >= condition.count;
    case 'level_reached':
      return stats.level >= condition.level;
    case 'rank_reached':
      return stats.rank === condition.rank;
    case 'multiplayer_games':
      return stats.multiplayerGames >= condition.count;
    case 'quiz_correct':
      return stats.quizCorrect >= condition.count;
    case 'duels_won':
      return stats.duelsWon >= condition.count;
    case 'win_streak':
      return stats.bestWinStreak >= condition.count;
    case 'quiz_streak':
      return stats.bestQuizStreak >= condition.count;
    // ─── Conditions liées à la partie qui vient de se terminer ───
    case 'tokens_in_game':
      return ctx.tokensInGame >= condition.count;
    case 'speed_win':
      return ctx.isWinner && ctx.turnsPlayed > 0 && ctx.turnsPlayed <= condition.turns;
    case 'perfect_game':
      return ctx.isWinner && ctx.noTokensLost;
    case 'comeback':
      return ctx.isWinner && ctx.wasLastThenWon;
    default:
      return false;
  }
}

/**
 * Évalue tous les succès et renvoie ceux qui viennent d'être débloqués.
 *
 * @param unlockedIds  IDs des succès déjà débloqués
 * @param stats        stats du joueur (état après la partie)
 * @param ctx          contexte de la partie terminée
 * @returns la liste des Achievement nouvellement débloqués
 */
export function evaluateAchievements(
  unlockedIds: string[],
  stats: AchievementStats,
  ctx: GameEndContext
): Achievement[] {
  const already = new Set(unlockedIds);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (already.has(achievement.id)) continue;
    if (isConditionMet(achievement.condition, stats, ctx)) {
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

// ===== PROGRESSION (affichage dans le détail d'un succès) =====

/** Sous-ensemble du profil suffisant pour décrire la progression d'un succès. */
export interface AchievementProgressInput {
  gamesPlayed: number;
  gamesWon: number;
  totalTokensEarned: number;
  startupsCreated: number;
  level: number;
  rank: string;
}

/** Description de la progression d'un succès, prête pour l'affichage. */
export interface AchievementProgress {
  /** Phrase expliquant comment débloquer le succès. */
  howTo: string;
  /** True si la progression est chiffrable (barre affichable). */
  measurable: boolean;
  /** Valeur courante (si measurable). */
  current: number;
  /** Valeur cible (si measurable). */
  target: number;
  /** Pourcentage 0-100 (si measurable). */
  percent: number;
}

/** Construit une progression chiffrée bornée à la cible. */
function counted(current: number, target: number, howTo: string): AchievementProgress {
  const clamped = Math.min(current, target);
  return {
    howTo,
    measurable: true,
    current: clamped,
    target,
    percent: target > 0 ? Math.round((clamped / target) * 100) : 0,
  };
}

/** Progression non chiffrable (condition événementielle). */
function unmeasured(howTo: string): AchievementProgress {
  return { howTo, measurable: false, current: 0, target: 0, percent: 0 };
}

/**
 * Décrit comment débloquer un succès et où en est le joueur.
 * Utilisé par le popup de détail au clic sur une carte.
 */
export function describeAchievementProgress(
  achievement: Achievement,
  stats: AchievementProgressInput
): AchievementProgress {
  const c = achievement.condition;
  switch (c.type) {
    case 'first_game':
      return counted(stats.gamesPlayed, 1, 'Joue ta première partie.');
    case 'first_win':
      return counted(stats.gamesWon, 1, 'Remporte ta première partie.');
    case 'games_played':
      return counted(stats.gamesPlayed, c.count, `Joue ${c.count} parties au total.`);
    case 'games_won':
      return counted(stats.gamesWon, c.count, `Remporte ${c.count} parties au total.`);
    case 'tokens_earned':
      return counted(stats.totalTokensEarned, c.count, `Cumule ${c.count} jetons sur l'ensemble de tes parties.`);
    case 'startups_created':
      return counted(stats.startupsCreated, c.count, `Crée ${c.count} startup${c.count > 1 ? 's' : ''}.`);
    case 'level_reached':
      return counted(stats.level, c.level, `Atteins le niveau ${c.level}.`);
    case 'multiplayer_games':
      return unmeasured(`Joue ${c.count} partie${c.count > 1 ? 's' : ''} en multijoueur en ligne.`);
    case 'rank_reached':
      return unmeasured(`Atteins le rang « ${c.rank} ».`);
    case 'tokens_in_game':
      return unmeasured(`Termine une partie avec ${c.count} jetons en main.`);
    case 'win_streak':
      return unmeasured(`Remporte ${c.count} parties d'affilée sans défaite.`);
    case 'quiz_correct':
      return unmeasured(`Réponds correctement à ${c.count} questions de quiz.`);
    case 'quiz_streak':
      return unmeasured(`Enchaîne ${c.count} bonnes réponses de quiz sans erreur.`);
    case 'duels_won':
      return unmeasured(`Remporte ${c.count} duels.`);
    case 'speed_win':
      return unmeasured(`Remporte une partie en ${c.turns} tours ou moins.`);
    case 'perfect_game':
      return unmeasured('Remporte une partie sans jamais perdre de jetons.');
    case 'comeback':
      return unmeasured('Remporte une partie après avoir été dernier.');
    default:
      return unmeasured(achievement.description);
  }
}
