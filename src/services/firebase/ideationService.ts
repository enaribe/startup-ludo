/**
 * Ideation Service - Fetch ideation decks from Firestore
 * Downloads target, mission, and sector cards to replace hardcoded data.
 */

import { collection, getDocs } from 'firebase/firestore';
import { firestore, FIRESTORE_COLLECTIONS, firebaseLog } from './config';
import type { TargetCard, MissionCard, SectorCard } from '@/types';

// ===== Firestore types (matches admin IdeationCard/IdeationDeck) =====

interface FirestoreIdeationCard {
  id: string;
  type: 'target' | 'mission' | 'sector';
  text: string;
  icon?: string;
  category?: string;
  xpMultiplier?: number;
  rarity?: 'common' | 'rare' | 'legendary';
}

interface FirestoreIdeationDeck {
  id: string;
  name: string;
  cards: FirestoreIdeationCard[];
}

// ===== Cache =====

export interface IdeationData {
  targets: TargetCard[];
  missions: MissionCard[];
  sectors: SectorCard[];
}

let cachedIdeation: IdeationData | null = null;

// ===== Helpers =====

function toTargetCard(card: FirestoreIdeationCard): TargetCard {
  return {
    id: card.id,
    category: (card.category as TargetCard['category']) || 'demographic',
    title: card.text,
    description: '',
    rarity: card.rarity || 'common',
    xpMultiplier: card.xpMultiplier,
  };
}

function toMissionCard(card: FirestoreIdeationCard): MissionCard {
  return {
    id: card.id,
    category: (card.category as MissionCard['category']) || 'efficiency',
    title: card.text,
    description: '',
    rarity: card.rarity || 'common',
    xpMultiplier: card.xpMultiplier,
  };
}

function toSectorCard(card: FirestoreIdeationCard): SectorCard {
  return {
    id: card.id,
    title: card.text,
    rarity: card.rarity || 'common',
    xpMultiplier: card.xpMultiplier ?? 1,
  };
}

// ===== Fetch =====

/**
 * Fetch all ideation decks from Firestore and convert to mobile card types.
 * Returns { targets, missions, sectors }.
 */
export async function fetchIdeationFromFirestore(): Promise<IdeationData> {
  try {
    const snapshot = await getDocs(collection(firestore, FIRESTORE_COLLECTIONS.ideationCards));
    const decks: FirestoreIdeationDeck[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FirestoreIdeationDeck));

    const targets: TargetCard[] = [];
    const missions: MissionCard[] = [];
    const sectors: SectorCard[] = [];

    for (const deck of decks) {
      if (!Array.isArray(deck.cards)) continue;
      for (const card of deck.cards) {
        switch (card.type) {
          case 'target':
            targets.push(toTargetCard(card));
            break;
          case 'mission':
            missions.push(toMissionCard(card));
            break;
          case 'sector':
            sectors.push(toSectorCard(card));
            break;
        }
      }
    }

    cachedIdeation = { targets, missions, sectors };
    firebaseLog(`Fetched ideation from Firestore: ${targets.length} targets, ${missions.length} missions, ${sectors.length} sectors`);
    return cachedIdeation;
  } catch (error) {
    firebaseLog('Failed to fetch ideation from Firestore', error);
    throw error;
  }
}

/**
 * Get cached ideation data (if previously fetched).
 */
export function getCachedIdeation(): IdeationData | null {
  return cachedIdeation;
}
