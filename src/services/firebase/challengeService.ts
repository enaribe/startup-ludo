/**
 * Challenge Service - Fetch challenge programs from Firestore
 * MIGRATED TO @react-native-firebase/firestore
 * Maps admin-simplified data to the rich mobile Challenge type.
 */

import firestore from '@react-native-firebase/firestore';
import { FIRESTORE_COLLECTIONS, firebaseLog } from './config';
import type {
  Challenge,
  ChallengeLevel,
  ChallengeSubLevel,
  ChallengeSector,
  DeliverableType,
  SectorCategory,
} from '@/types/challenge';
import type { Quiz, Duel, Funding, Opportunity, Challenge as ChallengeEventData } from '@/data/types';

let cachedChallenges: Challenge[] | null = null;

/**
 * Fetch all challenge programs from Firestore.
 * Maps the admin-simplified structure to the full mobile Challenge type.
 */
export async function fetchChallengesFromFirestore(): Promise<Challenge[]> {
  console.log('[ChallengeService] Starting Firestore fetch...');
  console.log('[ChallengeService] Collection path:', FIRESTORE_COLLECTIONS.challenges);

  try {
    const snapshot = await firestore()
      .collection(FIRESTORE_COLLECTIONS.challenges)
      .get();

    console.log('[ChallengeService] Snapshot received, docs count:', snapshot.docs.length);

    const challenges: Challenge[] = snapshot.docs.map((doc) => {
      console.log('[ChallengeService] Processing doc:', doc.id);
      const d = doc.data();
      return mapFirestoreToChallenge(doc.id, d);
    });

    cachedChallenges = challenges;
    firebaseLog(`Fetched ${challenges.length} challenges from Firestore`);
    console.log('[ChallengeService] Active challenges:', challenges.filter(c => c.isActive).length);
    return challenges;
  } catch (error) {
    console.error('[ChallengeService] FETCH ERROR:', error);
    firebaseLog('Failed to fetch challenges from Firestore', error);
    throw error;
  }
}

/**
 * Get cached challenges (if previously fetched).
 */
export function getCachedChallenges(): Challenge[] | null {
  return cachedChallenges;
}

// ===== MAPPING FUNCTIONS =====

// Default values for levels based on position
const DEFAULT_DELIVERABLES: DeliverableType[] = [
  'sector_choice',
  'pitch',
  'business_plan_simple',
  'business_plan_full',
];
const DEFAULT_ICONS = [
  'compass-outline',
  'bulb-outline',
  'rocket-outline',
  'trophy-outline',
];
const DEFAULT_POSTURES = [
  'Curieux',
  'Porteur de projet',
  'Entrepreneur',
  'Champion',
];

function mapFirestoreToChallenge(
  id: string,
  d: Record<string, unknown>
): Challenge {
  const rawLevels = Array.isArray(d.levels) ? d.levels : [];
  const rawSectors = Array.isArray(d.sectors) ? d.sectors : [];

  const levels = rawLevels.map((lvl: unknown, i: number) =>
    mapLevel(id, lvl as Record<string, unknown>, i)
  );
  const sectors = rawSectors.map((sec: unknown) =>
    mapSector(id, sec as Record<string, unknown>)
  );
  const totalXp = levels.reduce((sum, l) => sum + l.xpRequired, 0);

  return {
    id,
    slug: id,
    name: (d.name as string) || id,
    organization: (d.organization as string) || '',
    description: (d.description as string) || '',
    logoUrl: (d.logoUrl as string) || '',
    bannerUrl: (d.bannerUrl as string) || '',
    primaryColor: (d.primaryColor as string) || '#FFBC40',
    secondaryColor: (d.secondaryColor as string) || '#EB001B',
    totalLevels: levels.length,
    totalXpRequired: totalXp,
    levels,
    sectors,
    rules: (d.rules as Challenge['rules']) || {
      sequentialProgression: true,
      captureEnabled: true,
      maxEnrollmentsPerUser: 5,
      allowLevelSkip: false,
    },
    isActive: d.enabled !== false,
    startDate: (d.startDate as number) || null,
    endDate: (d.endDate as number) || null,
    version: (d.version as string) || 'v1',
    createdAt: (d.createdAt as number) || Date.now(),
    updatedAt: (d.updatedAt as number) || Date.now(),
  };
}

/**
 * Map admin level (title/order/xpReward) -> mobile level (number/xpRequired/deliverableType/posture/iconName)
 */
function mapLevel(
  challengeId: string,
  lvl: Record<string, unknown>,
  index: number
): ChallengeLevel {
  const number =
    (lvl.order as number) || (lvl.number as number) || index + 1;
  const rawSubLevels = Array.isArray(lvl.subLevels) ? lvl.subLevels : [];
  const subLevels = rawSubLevels.map((sub: unknown, si: number) =>
    mapSubLevel(
      (lvl.id as string) || `lvl_${index + 1}`,
      sub as Record<string, unknown>,
      si,
      number
    )
  );

  // xpRequired: use admin value, or derive from last sublevel, or default
  const lastSubXp =
    subLevels.length > 0
      ? subLevels[subLevels.length - 1]!.xpRequired
      : 1000 * number;
  const xpRequired =
    (lvl.xpRequired as number) ||
    (subLevels.length > 0
      ? Math.max(...subLevels.map((s) => s.xpRequired))
      : lastSubXp);

  const clampedIndex = Math.min(index, 3);

  return {
    id: (lvl.id as string) || `lvl_${number}`,
    challengeId,
    number,
    name: (lvl.title as string) || (lvl.name as string) || `Niveau ${number}`,
    description: (lvl.description as string) || '',
    xpRequired,
    subLevels,
    deliverableType:
      (lvl.deliverableType as DeliverableType) ||
      DEFAULT_DELIVERABLES[clampedIndex]!,
    posture: (lvl.posture as string) || DEFAULT_POSTURES[clampedIndex]!,
    iconName:
      (lvl.icon as string) ||
      (lvl.iconName as string) ||
      DEFAULT_ICONS[clampedIndex]!,
  };
}

function mapSubLevel(
  levelId: string,
  sub: Record<string, unknown>,
  index: number,
  levelNumber: number
): ChallengeSubLevel {
  const number =
    (sub.order as number) || (sub.number as number) || index + 1;
  // xpReward from admin, or xpRequired directly, or default
  const xpReward =
    (sub.xpReward as number) || (sub.xpRequired as number) || 50 * number;
  // Cumulative XP (progressive within level)
  const xpRequired = (sub.xpRequired as number) || xpReward * number;

  return {
    id: (sub.id as string) || `sub_${levelNumber}_${number}`,
    levelId,
    number,
    name:
      (sub.title as string) ||
      (sub.name as string) ||
      `Sous-niveau ${number}`,
    description: (sub.description as string) || '',
    xpRequired,
    cardCategories: (sub.cardCategories as string[]) || [
      'quiz',
      'opportunity',
      'challenge',
    ],
    rules: (sub.rules as ChallengeSubLevel['rules']) || {
      captureEnabled: levelNumber > 1,
      sequentialRequired: true,
    },
    // Content pack from admin
    ...(Array.isArray(sub.quizzes) && sub.quizzes.length > 0
      ? { quizzes: sub.quizzes as Quiz[] }
      : {}),
    ...(Array.isArray(sub.duels) && sub.duels.length > 0
      ? { duels: sub.duels as Duel[] }
      : {}),
    ...(Array.isArray(sub.fundings) && sub.fundings.length > 0
      ? { fundings: sub.fundings as Funding[] }
      : {}),
    ...(Array.isArray(sub.opportunities) && sub.opportunities.length > 0
      ? { opportunities: sub.opportunities as Opportunity[] }
      : {}),
    ...(Array.isArray(sub.challengeEvents) && sub.challengeEvents.length > 0
      ? { challengeEvents: sub.challengeEvents as ChallengeEventData[] }
      : {}),
  };
}

function mapSector(
  challengeId: string,
  sec: Record<string, unknown>
): ChallengeSector {
  const name = (sec.name as string) || '';
  return {
    id: (sec.id as string) || `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    challengeId,
    name,
    description: (sec.description as string) || '',
    iconName:
      (sec.icon as string) ||
      (sec.iconName as string) ||
      'business-outline',
    category: (sec.category as SectorCategory) || 'services',
    homeNames: (sec.homeNames as [string, string, string, string]) || [
      name || 'Base 1',
      'Base 2',
      'Base 3',
      'Base 4',
    ],
    color: (sec.color as string) || '#9B59B6',
  };
}
