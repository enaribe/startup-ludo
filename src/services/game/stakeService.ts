/**
 * stakeService — Logique pure du système de mise (Ptw) pour les parties en ligne.
 *
 * Modèle économique (voir [[project_petaw_currency]] et [[project_valorisation_field]]) :
 * - Le solde misable d'un joueur = somme des valorisations de ses startups (en FCFA).
 * - Miser X Ptw débite la valorisation : on prend d'abord sur une entreprise « principale »,
 *   puis on puise dans les autres (de la plus riche à la moins riche) jusqu'à couvrir la mise.
 * - Le gagnant remporte une part du pot (podium dégressif), créditée sur son entreprise principale.
 *
 * Les montants de mise sont exprimés en Ptw côté UI mais convertis en FCFA en interne
 * (1 Ptw = 1000 FCFA), comme partout dans le jeu.
 *
 * Fonctions PURES (aucun accès réseau / store) → faciles à tester et à appeler côté client.
 */
import { FCFA_PER_PTW } from '@/utils/currency';
import type { Startup } from '@/types';

/** Mises proposées, en Ptw. 0 = partie sans mise. */
export const STAKE_OPTIONS_PTW = [0, 50, 100, 250, 500] as const;
export type StakePtw = (typeof STAKE_OPTIONS_PTW)[number];

/** Convertit une mise en Ptw vers sa valeur interne en FCFA. */
export function stakePtwToFcfa(stakePtw: number): number {
  return Math.round(stakePtw * FCFA_PER_PTW);
}

/** Somme des valorisations des startups = solde misable (en FCFA). */
export function getStakableBalanceFcfa(startups: Startup[] | undefined | null): number {
  return (startups ?? []).reduce((sum, s) => sum + (s.valorisation ?? 0), 0);
}

/** Le joueur peut-il couvrir cette mise (FCFA) avec ses startups ? */
export function canAffordStake(startups: Startup[] | undefined | null, stakeFcfa: number): boolean {
  if (stakeFcfa <= 0) return true;
  return getStakableBalanceFcfa(startups) >= stakeFcfa;
}

/**
 * Répartition du pot selon le nombre de joueurs (podium dégressif).
 * Les valeurs sont des fractions du pot, sommant à 1. Index 0 = 1er, etc.
 */
function payoutSplit(nbPlayers: number): number[] {
  switch (nbPlayers) {
    case 2:
      return [1];
    case 3:
      return [0.6, 0.3, 0.1];
    case 4:
      return [0.5, 0.3, 0.15, 0.05];
    default:
      // 1 joueur (cas dégénéré) ou >4 : tout au premier
      return [1];
  }
}

/**
 * Calcule le montant (FCFA) remporté par chaque rang à partir d'une mise par joueur.
 * Retourne un tableau indexé par rang-1 (index 0 = 1er).
 * L'arrondi est absorbé par le 1er pour que la somme = pot exact.
 *
 * @param stakeFcfa  mise par joueur (FCFA)
 * @param nbPlayers  nombre de joueurs ayant misé
 */
export function computePayoutsFcfa(stakeFcfa: number, nbPlayers: number): number[] {
  if (stakeFcfa <= 0 || nbPlayers <= 1) return [];
  const pot = stakeFcfa * nbPlayers;
  const split = payoutSplit(nbPlayers);

  // Arrondit chaque part sauf la 1re, puis donne le reste au 1er (pot exact préservé).
  const payouts: number[] = new Array(split.length).fill(0);
  let distributed = 0;
  for (let i = split.length - 1; i >= 1; i--) {
    const part = Math.round(pot * split[i]!);
    payouts[i] = part;
    distributed += part;
  }
  payouts[0] = pot - distributed; // le 1er absorbe le reste
  return payouts;
}

/**
 * Montant remporté (FCFA) pour un rang donné (1 = 1er). 0 si hors podium.
 * Un joueur forfait (pas de rang) reçoit 0 → il perd sa mise.
 */
export function payoutForRankFcfa(
  stakeFcfa: number,
  nbPlayers: number,
  rank: number | null | undefined,
): number {
  if (!rank || rank < 1) return 0;
  const payouts = computePayoutsFcfa(stakeFcfa, nbPlayers);
  return payouts[rank - 1] ?? 0;
}

export interface StartupDelta {
  startupId: string;
  newValorisation: number;
}

/**
 * Débite `amountFcfa` de la valorisation des startups.
 * Stratégie : on prend d'abord sur `primaryStartupId` (l'entreprise « principale »),
 * puis on puise dans les autres de la plus riche à la moins riche.
 *
 * Retourne la liste des startups modifiées avec leur nouvelle valorisation.
 * Si le solde total est insuffisant, débite jusqu'à 0 (ne descend jamais sous 0).
 */
export function debitFromStartups(
  startups: Startup[],
  amountFcfa: number,
  primaryStartupId?: string | null,
): StartupDelta[] {
  if (amountFcfa <= 0 || startups.length === 0) return [];

  // Ordre de prélèvement : principale d'abord, puis les plus riches.
  const ordered = [...startups].sort((a, b) => {
    if (a.id === primaryStartupId) return -1;
    if (b.id === primaryStartupId) return 1;
    return (b.valorisation ?? 0) - (a.valorisation ?? 0);
  });

  const deltas: StartupDelta[] = [];
  let remaining = amountFcfa;

  for (const s of ordered) {
    if (remaining <= 0) break;
    const available = s.valorisation ?? 0;
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    deltas.push({ startupId: s.id, newValorisation: available - take });
    remaining -= take;
  }

  return deltas;
}

/**
 * Crédite `amountFcfa` sur l'entreprise principale.
 * Retourne le delta (startupId + nouvelle valorisation) ou null si aucune startup.
 */
export function creditMainStartup(
  startups: Startup[],
  amountFcfa: number,
  primaryStartupId?: string | null,
): StartupDelta | null {
  if (amountFcfa <= 0 || startups.length === 0) return null;
  const main =
    startups.find((s) => s.id === primaryStartupId) ?? startups[0]!;
  return {
    startupId: main.id,
    newValorisation: (main.valorisation ?? 0) + amountFcfa,
  };
}
