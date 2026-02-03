// ===== CHALLENGE (Programme d'accompagnement) =====

export interface Challenge {
  id: string;
  slug: string; // "yeah", "der-fj", "force-n"
  name: string;
  organization: string;
  description: string;

  // Visuels
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;

  // Configuration
  totalLevels: number; // généralement 4
  totalXpRequired: number;
  levels: ChallengeLevel[];
  sectors: ChallengeSector[];

  // Règles
  rules: ChallengeRules;

  // Métadonnées
  isActive: boolean;
  startDate: number | null;
  endDate: number | null;
  version: string; // "v1", "v2"
  createdAt: number;
  updatedAt: number;
}

export interface ChallengeRules {
  sequentialProgression: boolean; // Sous-niveaux dans l'ordre ?
  captureEnabled: boolean; // Méca Monopoly ?
  maxEnrollmentsPerUser: number; // Limite inscriptions simultanées
  allowLevelSkip: boolean;
}

// ===== NIVEAU =====

export interface ChallengeLevel {
  id: string;
  challengeId: string;
  number: number; // 1, 2, 3, 4
  name: string; // "Découverte", "Idéation"
  description: string;
  xpRequired: number;
  subLevels: ChallengeSubLevel[];
  deliverableType: DeliverableType;
  posture: string; // "Curieux", "Porteur de projet"
  iconName: string; // Icône Ionicons
}

export type DeliverableType =
  | 'sector_choice' // Niveau 1: Choix du secteur
  | 'pitch' // Niveau 2: Pitch assisté
  | 'business_plan_simple' // Niveau 3: BP simplifié
  | 'business_plan_full' // Niveau 4: BP complet + Certificat
  | 'custom';

// ===== SOUS-NIVEAU =====

export interface ChallengeSubLevel {
  id: string;
  levelId: string;
  number: number; // 1, 2, 3, 4
  name: string;
  description: string;
  xpRequired: number;
  cardCategories: string[]; // Types de cartes associés
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
  name: string; // "Production végétale", "Élevage"
  description: string;
  iconName: string; // Ionicons name
  category: SectorCategory;
  homeNames: [string, string, string, string]; // 4 maisons du plateau
  color: string;
}

export type SectorCategory =
  | 'agriculture'
  | 'technology'
  | 'services'
  | 'commerce'
  | 'artisanat';

// ===== INSCRIPTION (Enrollment) =====

export interface ChallengeEnrollment {
  id: string;
  challengeId: string;
  userId: string;

  // Progression
  currentLevel: number; // 1-4
  currentSubLevel: number; // 1-4
  totalXp: number;
  xpByLevel: Record<number, number>; // { 1: 6000, 2: 8500, ... }

  // Choix
  selectedSectorId: string | null;

  // Livrables
  deliverables: ChallengeDeliverables;

  // Statut
  status: EnrollmentStatus;
  championStatus: ChampionStatus | null;

  // Dates
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
  sectorId: string | null; // null = générique

  type: ChallengeCardType;

  // Contenu
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';

  // Quiz/Duel spécifique
  question?: string;
  options?: ChallengeCardOption[];
  correctAnswer?: number;

  // Récompense
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
  points?: number; // Pour duel (30/20/10)
  isCorrect?: boolean; // Pour quiz
}

// ===== HELPERS =====

/** Calcule le pourcentage de progression dans un niveau */
export function getLevelProgress(
  currentXp: number,
  levelXpRequired: number
): number {
  if (levelXpRequired <= 0) return 100;
  return Math.min(100, Math.round((currentXp / levelXpRequired) * 100));
}

/** Calcule le pourcentage de progression globale dans un Challenge */
export function getChallengeProgress(
  totalXp: number,
  totalXpRequired: number
): number {
  if (totalXpRequired <= 0) return 100;
  return Math.min(100, Math.round((totalXp / totalXpRequired) * 100));
}

/** Vérifie si un niveau est débloqué */
export function isLevelUnlocked(
  levelNumber: number,
  currentLevel: number,
  xpByLevel: Record<number, number>,
  levels: ChallengeLevel[]
): boolean {
  if (levelNumber === 1) return true;
  if (levelNumber > currentLevel + 1) return false;

  // Vérifier que le niveau précédent est complété
  const prevLevel = levels.find((l) => l.number === levelNumber - 1);
  if (!prevLevel) return false;

  const prevLevelXp = xpByLevel[levelNumber - 1] ?? 0;
  return prevLevelXp >= prevLevel.xpRequired;
}

/** Vérifie si un sous-niveau est débloqué */
export function isSubLevelUnlocked(
  levelNumber: number,
  subLevelNumber: number,
  currentLevel: number,
  currentSubLevel: number,
  sequentialRequired: boolean
): boolean {
  // Niveau pas encore atteint
  if (levelNumber > currentLevel) return false;

  // Niveau dépassé = tous les sous-niveaux débloqués
  if (levelNumber < currentLevel) return true;

  // Niveau courant
  if (!sequentialRequired) return true;
  return subLevelNumber <= currentSubLevel;
}
