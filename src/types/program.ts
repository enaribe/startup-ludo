import type { Challenge as ChallengeEventData, Duel, Funding, Opportunity, Quiz } from '@/data/types';

export interface ProgramPartner {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
}

export interface ProgramAudience {
  ageRange?: string;
  locations: string[];
  sector: string;
  profile: string;
}

export interface ProgramContentPack {
  id: string;
  programId: string;
  name: string;
  description?: string;
  quizzes: Quiz[];
  duels: Duel[];
  fundings: Funding[];
  opportunities: Opportunity[];
  challengeEvents: ChallengeEventData[];
}

export interface PartnerProgram {
  id: string;
  slug: string;
  /** Partenaire principal (porteur du programme). */
  partnerId: string;
  /** Co-partenaires affichés en « En partenariat avec » (ex: YEAH x Mastercard Foundation). */
  coPartnerIds?: string[];
  name: string;
  subtitle?: string;
  description: string;
  /** Image de fond de la carte programme (photo plein cadre derrière le titre). */
  heroImageUrl?: string | null;
  /** Bannière du header de l'écran programme. */
  bannerUrl?: string | null;
  /** Logo du programme (ex: logo YEAH). */
  logoUrl?: string | null;
  playerCount: number;
  sessionCount: number;
  audience: ProgramAudience;
  tags: string[];
  primaryColor: string;
  secondaryColor: string;
  contentPacks: ProgramContentPack[];
  isActive: boolean;
  sortOrder: number;
}

export type ProgramEnrollmentStatus = 'active' | 'completed' | 'paused';

export interface ProgramEnrollment {
  id: string;
  userId: string;
  partnerId: string;
  programId: string;
  status: ProgramEnrollmentStatus;
  formData: ProgramEnrollmentFormData | null;
  totalSessions: number;
  totalWins: number;
  totalXp: number;
  enrolledAt: number;
  lastPlayedAt: number | null;
  completedAt: number | null;
}

export type ProfileMatch = 'yes' | 'no' | 'partial';

export interface ProgramEnrollmentFormData {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  professionalStatus: string;
  profileMatch: ProfileMatch | null;
  /** Intention de candidater, de 1 (peu sûre) à 10 (certain·e). */
  applicationIntent: number;
  /** Consentement au traitement des données dans le cadre du programme. */
  consentDataProcessing: boolean;
  /** Consentement à être contacté par le Consortium Jeunesse Sénégal (obligatoire). */
  consentContact: boolean;
  /** Abonnement à la newsletter Startup Ludo (optionnel). */
  newsletterOptIn: boolean;
}

export interface ProgramSession {
  id: string;
  userId: string;
  partnerId: string;
  programId: string;
  gameId: string;
  isTrial: boolean;
  won: boolean | null;
  xpGained: number;
  tokensEarned: number;
  startedAt: number;
  completedAt: number | null;
}

export interface ProgramGameContext {
  origin: 'program';
  partnerId: string;
  programId: string;
  enrollmentId?: string | null;
  sessionId: string;
  isTrial: boolean;
  contentPackId?: string;
}

export type ProgramPlayAccessReason =
  | 'trial_available'
  | 'enrolled'
  | 'trial_used'
  | 'guest_blocked'
  | 'program_not_found';

export interface ProgramPlayAccess {
  canPlay: boolean;
  reason: ProgramPlayAccessReason;
  requiresEnrollment: boolean;
  isTrial: boolean;
}

export function createProgramSessionId(): string {
  return `program_session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

