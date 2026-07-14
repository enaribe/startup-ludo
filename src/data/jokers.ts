/**
 * Catalogue des jokers — métadonnées UI et logique de tirage aléatoire.
 * Chaque joker est identifié par son `JokerType`.
 */

import type { JokerType } from '@/types';

export interface JokerMetadata {
  title: string;
  shortTitle: string; // pour les badges/boutons
  description: string;
  iconName: string; // Ionicons name
  color: string; // couleur accent du joker
}

export const JOKER_CATALOG: Record<JokerType, JokerMetadata> = {
  dice_choice: {
    title: 'CHOISIR SON DÉ',
    shortTitle: 'Dé choisi',
    description: 'Fixe la valeur de ton prochain lancer (1-6).',
    iconName: 'dice',
    color: '#FFBC40',
  },
  reroll: {
    title: 'RELANCER',
    shortTitle: 'Relance',
    description: 'Tire une nouvelle valeur aléatoire pour ton prochain lancer.',
    iconName: 'refresh',
    color: '#1F91D0',
  },
  shield: {
    title: 'BOUCLIER',
    shortTitle: 'Bouclier',
    description: 'Immunise ton pion contre la prochaine capture.',
    iconName: 'shield-checkmark',
    color: '#4CAF50',
  },
  steal: {
    title: 'VOL ÉCLAIR',
    shortTitle: 'Vol éclair',
    description: 'Vole 3 jetons au joueur le mieux classé.',
    iconName: 'flash',
    color: '#F35145',
  },
  investment: {
    title: 'INVESTISSEMENT',
    shortTitle: 'Investir',
    description: 'Mise 1 ou 2 jetons. Si tu gagnes des jetons à ton prochain tour, remporte le double de ta mise. Sinon, tu perds ta mise.',
    iconName: 'trending-up',
    color: '#9C27B0',
  },
};

export const ALL_JOKER_TYPES: JokerType[] = ['dice_choice', 'reroll', 'shield', 'steal', 'investment'];

/**
 * Libellés traduits d'un joker. `JOKER_CATALOG` reste la source des données
 * non textuelles (icône, couleur) ; le texte vient de l'i18n (clés joker.<type>.*).
 */
export function getJokerText(
  type: JokerType,
  t: (key: string) => string,
): { title: string; shortTitle: string; description: string } {
  return {
    title: t(`joker.${type}.title`),
    shortTitle: t(`joker.${type}.short`),
    description: t(`joker.${type}.desc`),
  };
}

/** Historique anti-répétition : jokers déjà tirés depuis le dernier reset. */
const usedJokerTypes = new Set<JokerType>();

/** Réinitialise l'historique des jokers tirés (à appeler au début d'une partie). */
export function resetJokerPool(): void {
  usedJokerTypes.clear();
}

/**
 * Tire un joker aléatoire en évitant les répétitions : un même joker ne
 * revient pas tant que les 4 types n'ont pas tous été tirés.
 */
export function rollRandomJoker(): JokerType {
  let available = ALL_JOKER_TYPES.filter((t) => !usedJokerTypes.has(t));
  // Pool épuisé : on recycle
  if (available.length === 0) {
    usedJokerTypes.clear();
    available = [...ALL_JOKER_TYPES];
  }
  const index = Math.floor(Math.random() * available.length);
  const picked = available[index] ?? 'dice_choice';
  usedJokerTypes.add(picked);
  return picked;
}

/**
 * Marque un type de joker comme déjà tiré sans le tirer.
 * Utilisé en multijoueur quand un autre client tire un joker (sync de l'historique).
 */
export function markJokerUsed(type: JokerType): void {
  usedJokerTypes.add(type);
  if (usedJokerTypes.size >= ALL_JOKER_TYPES.length) {
    usedJokerTypes.clear();
  }
}

/** Génère un ID unique pour une instance de joker */
export function newJokerId(): string {
  return `jk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
