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
};

export const ALL_JOKER_TYPES: JokerType[] = ['dice_choice', 'reroll', 'shield', 'steal'];

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
