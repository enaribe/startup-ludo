import type { Challenge as ChallengeEventData, Duel, Funding, Opportunity, Quiz } from '@/data/types';

export interface ProgramPartner {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  logoUrl?: string | null;
  /** Image de fond de la carte partenaire sur l'accueil (visuel vertical avec bouton PARTICIPER). */
  bannerUrl?: string | null;
  /** PNG détouré (fond transparent) affiché à droite du header de l'écran partenaire, par-dessus le dégradé. */
  heroImageUrl?: string | null;
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

/** Niveau entrepreneurial couvert par une partie. */
export type ProgramLevelTier = 'idea' | 'preparation' | 'launch' | 'development';

export interface ProgramContentPack {
  id: string;
  programId: string;
  name: string;
  description?: string;
  /** Titre affiché de la partie (ex: « Validation du problème »). */
  title?: string;
  /** Niveau entrepreneurial de la partie (Idée / Préparation / Lancement / Développement). */
  levelTier?: ProgramLevelTier;
  quizzes: Quiz[];
  duels: Duel[];
  fundings: Funding[];
  opportunities: Opportunity[];
  challengeEvents: ChallengeEventData[];
}

export type ProgramGameMode = 'solo' | 'duel' | 'tournament';
export type ProgramLanguage = 'fr' | 'en' | 'wo';

/** Critères d'éligibilité affichés et utilisés pour cibler le parcours. */
export interface ProgramEligibility {
  ageMin?: number;
  ageMax?: number;
  regions: string[];
  sectors: string[];
  /** Profils éligibles (porteurs d'idée, en démarrage, en croissance, reconversion, étudiants...). */
  audienceProfiles: string[];
}

/** Réglages avancés du parcours (toggles de l'onglet « Avancé »). */
export interface ProgramAdvancedSettings {
  rule7030: boolean;
  concreeValidationRequired: boolean;
  frequencyCap: boolean;
  publicPreview: boolean;
}

// ===== Formulaire de fin (form builder) =====

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'phone'
  | 'email'
  | 'select'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'slider'
  | 'date'
  | 'file';

/** Un champ configurable du formulaire de fin de parcours. */
/** Groupe d'options pour les champs liste : un titre (grande liste) + ses sous-items. */
export interface ProgramFormOptionGroup {
  /** Titre du groupe (grand titre). Vide/absent = items sans en-tête. */
  title?: string;
  /** Sous-items sélectionnables de ce groupe. */
  items: string[];
}

export interface ProgramFormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  /** Liste PLATE de tous les items sélectionnables (select / multi_select / radio). */
  options?: string[];
  /** Structure hiérarchique (titres + sous-items) pour l'affichage. Dérivée d'options. */
  optionGroups?: ProgramFormOptionGroup[];
  /** Bornes pour slider. */
  min?: number;
  max?: number;
  /** Longueur max pour long_text. */
  maxLength?: number;
}

/** Une case de consentement RGPD du formulaire de fin. */
export interface ProgramFormConsent {
  id: string;
  label: string;
  /** Coché par défaut requis pour valider (obligatoire). */
  required: boolean;
  /** Affiché et activé dans le formulaire. */
  enabled: boolean;
}

/** Configuration complète du formulaire rempli par le joueur en fin de parcours. */
export interface ProgramEndForm {
  fields: ProgramFormField[];
  consents: ProgramFormConsent[];
  /**
   * Le bloc « Questions de qualification CONCREE » (profil incarné + intention 1-10)
   * est TOUJOURS présent et non éditable — il n'est pas stocké ici, il est rendu en dur.
   */
}

/** Profil-personnage que le joueur incarne pendant le parcours (« VOTRE PROFIL »). */
export interface ProgramProfile {
  id: string;
  name: string;
  age: number;
  description: string;
  location: string;
  sector: string;
  avatarUrl?: string | null;
  /** Statut entrepreneurial du persona (ex: Informel, Formalisé, En croissance, Idée). */
  status?: string;
  /** Nombre de jetons de départ associé au persona. */
  tokens?: number;
  /** Persona activé (jouable) ou désactivé. Défaut: true. */
  enabled?: boolean;
  /** Brouillon non encore publié (n'apparaît pas côté joueur). */
  isDraft?: boolean;
  /**
   * Contenu de jeu propre à ce persona, par niveau (même structure que program.contentPacks).
   * S'il existe un pack pour le niveau joué, il REMPLACE le contenu commun ; sinon on
   * retombe sur program.contentPacks[niveau] (remplace + fallback).
   */
  contentPacks?: ProgramContentPack[];
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
  /** Logo d'un co-partenaire affiché en haut-droite de la carte (« En partenariat avec »), uploadé directement sur le programme. */
  bannerUrl?: string | null;
  /** Logo du programme (ex: logo YEAH), affiché au milieu-gauche de la carte. */
  logoUrl?: string | null;
  playerCount: number;
  sessionCount: number;
  audience: ProgramAudience;
  tags: string[];
  primaryColor: string;
  secondaryColor: string;
  contentPacks: ProgramContentPack[];
  /** Profils que le joueur peut incarner pendant le parcours. */
  profiles?: ProgramProfile[];
  /** Langue du parcours. */
  language?: ProgramLanguage;
  /** Modes de jeu autorisés (Solo toujours inclus). */
  allowedModes?: ProgramGameMode[];
  /** Mode recommandé côté joueur. */
  recommendedMode?: ProgramGameMode;
  /** Critères d'éligibilité étendus (régions, secteurs, profils...). */
  eligibility?: ProgramEligibility;
  /** Réglages avancés (règle 70/30, validation, frequency cap, preview). */
  advancedSettings?: ProgramAdvancedSettings;
  /** Formulaire de fin de parcours configurable (form builder). */
  endForm?: ProgramEndForm;
  /** uid de l'admin propriétaire de ce programme (multi-tenant, côté back-office). */
  ownerId?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export type ProgramEnrollmentStatus = 'active' | 'completed' | 'paused';

/** Statut CRM d'un lead/candidat (suivi commercial côté back-office). */
export type ProgramLeadStatus = 'new' | 'contacted' | 'converted' | 'rejected';

/** Profil entrepreneur déduit du gameplay (rempli plus tard par le moteur). */
export type EntrepreneurProfile = 'strategist' | 'goer' | 'cautious' | 'creative' | 'builder';

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
  /** Index du niveau (contentPack) en cours, 0-based. Égale le nombre de niveaux gagnés. */
  currentLevel: number;
  /** Nombre de niveaux validés (gagnés). Quand il atteint le nombre de packs, le parcours est terminé. */
  completedLevels: number;
  /** Persona (profil incarné) choisi par le joueur. */
  profileId?: string | null;
  profileName?: string | null;
  /** Profil entrepreneur déduit du gameplay (optionnel, rempli plus tard). */
  entrepreneurProfile?: EntrepreneurProfile | null;
  /** Statut CRM du lead (back-office). Défaut 'new'. */
  leadStatus?: ProgramLeadStatus;
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
  /** Réponses aux champs personnalisés du formulaire de fin (clé = field.id). */
  customResponses?: Record<string, string | string[] | number | boolean>;
  /** Réponses aux consentements personnalisés (clé = consent.id → accepté ou non). */
  customConsents?: Record<string, boolean>;
}

export interface ProgramSession {
  id: string;
  userId: string;
  partnerId: string;
  programId: string;
  gameId: string;
  isTrial: boolean;
  /** Index du niveau (contentPack) joué pendant cette partie, 0-based. */
  levelIndex: number;
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
  // null = partie « pour le fun » (ex. tour par tour) sans progression enregistrée.
  sessionId: string | null;
  isTrial: boolean;
  contentPackId?: string;
  /** Index du niveau joué (0-based), pour faire progresser la barre de niveaux à la fin. */
  levelIndex: number;
  /** Persona (profil incarné) choisi par le joueur, propagé jusqu'aux leads. */
  profileId?: string | null;
  profileName?: string | null;
}

export type ProgramPlayAccessReason =
  | 'trial_available'
  | 'enrolled'
  | 'trial_used'
  | 'guest_blocked'
  | 'program_completed'
  | 'program_not_found';

export interface ProgramPlayAccess {
  canPlay: boolean;
  reason: ProgramPlayAccessReason;
  requiresEnrollment: boolean;
  isTrial: boolean;
}

/** Progression d'un utilisateur dans un programme à niveaux. */
export interface ProgramProgress {
  /** Index du niveau courant à jouer (0-based). */
  currentLevel: number;
  /** Nombre total de niveaux (contentPacks) du programme. */
  totalLevels: number;
  /** True quand tous les niveaux ont été gagnés. */
  isCompleted: boolean;
}

export function createProgramSessionId(): string {
  return `program_session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

