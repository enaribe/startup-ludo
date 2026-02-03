// ===== CHALLENGE (Programme d'accompagnement) =====

export interface Challenge {
  id: string;
  slug: string;
  name: string;
  organization: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  totalLevels: number;
  totalXpRequired: number;
  levels: ChallengeLevel[];
  sectors: ChallengeSector[];
  rules: ChallengeRules;
  isActive: boolean;
  startDate: number | null;
  endDate: number | null;
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChallengeRules {
  sequentialProgression: boolean;
  captureEnabled: boolean;
  maxEnrollmentsPerUser: number;
  allowLevelSkip: boolean;
}

// ===== NIVEAU =====

export interface ChallengeLevel {
  id: string;
  challengeId: string;
  number: number;
  name: string;
  description: string;
  xpRequired: number;
  subLevels: ChallengeSubLevel[];
  deliverableType: DeliverableType;
  posture: string;
  iconName: string;
}

export type DeliverableType =
  | 'sector_choice'
  | 'pitch'
  | 'business_plan_simple'
  | 'business_plan_full'
  | 'custom';

// ===== SOUS-NIVEAU =====

export interface ChallengeSubLevel {
  id: string;
  levelId: string;
  number: number;
  name: string;
  description: string;
  xpRequired: number;
  cardCategories: string[];
  rules: SubLevelRules;
}

export interface SubLevelRules {
  captureEnabled: boolean;
  sequentialRequired: boolean;
}

// ===== SECTEUR =====

export interface ChallengeSector {
  id: string;
  challengeId: string;
  name: string;
  description: string;
  iconName: string;
  category: SectorCategory;
  homeNames: [string, string, string, string];
  color: string;
}

export type SectorCategory =
  | 'agriculture'
  | 'technology'
  | 'services'
  | 'commerce'
  | 'artisanat';

// ===== FORMULAIRE D'INSCRIPTION =====

export interface EnrollmentFormData {
  lastName: string;
  firstName: string;
  age: string;
  region: string;
  isCurrentEntrepreneur: boolean | null;
  planToStart: boolean | null;
  wantsContact: boolean | null;
  phone: string;
}

// ===== INSCRIPTION (Enrollment) =====

export interface ChallengeEnrollment {
  id: string;
  challengeId: string;
  userId: string;
  currentLevel: number;
  currentSubLevel: number;
  totalXp: number;
  xpByLevel: Record<number, number>;
  selectedSectorId: string | null;
  deliverables: ChallengeDeliverables;
  formData: EnrollmentFormData | null;
  status: EnrollmentStatus;
  championStatus: ChampionStatus | null;
  enrolledAt: number;
  lastPlayedAt: number;
  completedAt: number | null;
}

export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type ChampionStatus = 'local' | 'regional' | 'national';

export interface ChallengeDeliverables {
  sectorChoice?: {
    sectorId: string;
    completedAt: number;
  };
  pitch?: {
    problem: string;
    solution: string;
    target: string;
    viability: string;
    impact: string;
    generatedDocument: string;
    completedAt: number;
  };
  businessPlanSimple?: {
    content: Record<string, string>;
    generatedDocument: string;
    completedAt: number;
  };
  businessPlanFull?: {
    content: Record<string, string>;
    generatedDocument: string;
    certificate: string;
    completedAt: number;
  };
}

// ===== CARTE PÉDAGOGIQUE =====

export interface ChallengeCard {
  id: string;
  challengeId: string;
  levelNumber: number;
  subLevelNumber: number;
  sectorId: string | null;
  type: ChallengeCardType;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  question?: string;
  options?: ChallengeCardOption[];
  correctAnswer?: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'legendary';
  createdAt: number;
}

export type ChallengeCardType =
  | 'opportunity'
  | 'challenge'
  | 'quiz'
  | 'duel'
  | 'funding';

export interface ChallengeCardOption {
  text: string;
  points?: number;
  isCorrect?: boolean;
}

// ===== HELPERS =====

export function getLevelProgress(
  currentXp: number,
  levelXpRequired: number
): number {
  if (levelXpRequired <= 0) return 100;
  return Math.min(100, Math.round((currentXp / levelXpRequired) * 100));
}

export function getChallengeProgress(
  totalXp: number,
  totalXpRequired: number
): number {
  if (totalXpRequired <= 0) return 100;
  return Math.min(100, Math.round((totalXp / totalXpRequired) * 100));
}

export function isLevelUnlocked(
  levelNumber: number,
  currentLevel: number,
  xpByLevel: Record<number, number>,
  levels: ChallengeLevel[]
): boolean {
  if (levelNumber === 1) return true;
  if (levelNumber > currentLevel + 1) return false;
  const prevLevel = levels.find((l) => l.number === levelNumber - 1);
  if (!prevLevel) return false;
  const prevLevelXp = xpByLevel[levelNumber - 1] ?? 0;
  return prevLevelXp >= prevLevel.xpRequired;
}

export function isSubLevelUnlocked(
  levelNumber: number,
  subLevelNumber: number,
  currentLevel: number,
  currentSubLevel: number,
  sequentialRequired: boolean
): boolean {
  if (levelNumber > currentLevel) return false;
  if (levelNumber < currentLevel) return true;
  if (!sequentialRequired) return true;
  return subLevelNumber <= currentSubLevel;
}
