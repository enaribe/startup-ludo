/**
 * Événements Customer.io — catalogue typé.
 *
 * Chaque helper correspond à un déclencheur de la bibliothèque de
 * notifications push (doc interne CONCREE). Les campagnes côté dashboard
 * Customer.io s'appuient sur ces noms d'événements et attributs :
 * NE PAS les renommer sans mettre à jour les campagnes.
 */

import { setProfileAttributes, trackEvent } from './customerio';

// ─── Parties ────────────────────────────────────────────────────────────────

/** Fin de partie (solo ou en ligne). Alimente onboarding J0/J1 et rappels J+1. */
export function trackGameFinished(params: {
  mode: 'solo' | 'online';
  won: boolean;
  /** Nom du gagnant ou de l'adversaire principal (parties en ligne). */
  opponentName?: string;
  gamesPlayedTotal?: number;
}): void {
  trackEvent('game_finished', params);
  if (params.mode === 'online') {
    trackEvent(params.won ? 'online_game_won' : 'online_game_lost', {
      opponent_name: params.opponentName,
    });
  }
}

// ─── Startup & valorisation ─────────────────────────────────────────────────

/** Startup créée (fin du flux d'idéation). Coupe la campagne « crée ta startup ». */
export function trackStartupCreated(params: { sector?: string; name?: string }): void {
  trackEvent('startup_created', params);
  setProfileAttributes({ has_startup: true });
}

/** Attributs de valorisation (pour la campagne « cap franchi »). */
export function setValuationAttributes(params: {
  valorisationTotal: number;
  startupsCount: number;
}): void {
  setProfileAttributes({
    valorisation_total: params.valorisationTotal,
    startups_count: params.startupsCount,
    has_startup: params.startupsCount > 0,
  });
}

// ─── Progression (XP, rangs, badges) ────────────────────────────────────────

/** Attributs de progression (campagnes « il te manque X XP », segments par rang). */
export function setProgressionAttributes(params: {
  xp: number;
  rank: string;
  xpToNextRank: number | null;
  gamesPlayed: number;
  gamesWon: number;
}): void {
  setProfileAttributes({
    xp: params.xp,
    rank: params.rank,
    xp_to_next_rank: params.xpToNextRank,
    games_played: params.gamesPlayed,
    games_won: params.gamesWon,
  });
}

/** Nouveau rang atteint (rappel J+1 « {Rang}. Ça te va bien. »). */
export function trackRankReached(params: { rank: string; previousRank: string }): void {
  trackEvent('rank_reached', params);
}

/** Badge débloqué (rappel « Nouveau badge ! »). */
export function trackAchievementUnlocked(params: { achievementId: string; name: string }): void {
  trackEvent('achievement_unlocked', {
    achievement_id: params.achievementId,
    achievement_name: params.name,
  });
}

// ─── Récompenses ────────────────────────────────────────────────────────────

/** Bonus retour réclamé (coupe la campagne « ton bonus t'attend »). */
export function trackReturnBonusClaimed(params: { xp: number }): void {
  trackEvent('return_bonus_claimed', params);
}

// ─── Programmes partenaires ─────────────────────────────────────────────────

/** Inscription à un parcours partenaire (campagne « ton parcours t'attend »). */
export function trackProgramEnrolled(params: {
  programId: string;
  programName?: string;
  partnerId?: string;
}): void {
  trackEvent('program_enrolled', {
    program_id: params.programId,
    program_name: params.programName,
    partner_id: params.partnerId,
  });
}
