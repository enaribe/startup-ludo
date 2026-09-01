/**
 * Mode Classe — types du parcours ÉLÈVE (lot 5).
 *
 * L'élève est un JOUEUR ordinaire : son compte n'a AUCUN claim scolaire.
 * Sa seule porte d'entrée est le rattachement par code (API back-office), puis
 * le miroir `classLinks/{uid}` — écrit par le seul Admin SDK — qui lui ouvre la
 * lecture des séances `running` de SA classe.
 *
 * Ces types reflètent EXACTEMENT les contrats déjà livrés côté back-office
 * (lots 1 à 4). Ne rien élargir sans vérifier la route ou la règle en face.
 */

import type { Challenge as ChallengeEventData, Duel, Funding, Opportunity, Quiz } from '@/data/types';

// ═══════════════════════════════════════════════════════════════════════════
// RATTACHEMENT (API publique du back-office)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Un élève tel que `GET /api/class/join/[code]` le projette.
 * Projection MINIMALE et voulue : prénom + initiale du nom (« Fatou D. »).
 * L'état civil complet n'est jamais exposé — il s'agit de mineurs.
 */
export interface ClassLearnerChoice {
  /** Id du document `classes/{cid}/learners/{lid}`, à renvoyer à `/api/class/link`. */
  id: string;
  /** « Fatou D. » — ce que l'élève lit dans la liste pour se reconnaître. */
  displayName: string;
  /** True = déjà rattaché à un autre compte → grisé et non sélectionnable. */
  taken: boolean;
}

/** Réponse de `GET /api/class/join/[code]` : la classe et sa liste d'élèves. */
export interface ClassJoinLookup {
  classId: string;
  className: string;
  learners: ClassLearnerChoice[];
}

/** Réponse de `POST /api/class/link` : le rattachement est posé, définitivement. */
export interface ClassLinkResult {
  classId: string;
  className: string;
  learnerId: string;
  displayName: string;
}

/**
 * Réponse de `GET /api/session/join/[code]` — la SALLE D'ATTENTE projetée par
 * l'enseignant (QR ou code dicté).
 *
 * Étend `ClassJoinLookup` : c'est la même projection de liste d'élèves, plus
 * ce qui identifie la séance. Un élève déjà rattaché à `classId` entre
 * directement ; les autres passent par le choix du nom, exactement comme au
 * rattachement classique.
 */
export interface ClassSessionLookup extends ClassJoinLookup {
  /** Séance à rejoindre. */
  sessionId: string;
  /** Titre donné par l'enseignant, pour l'annoncer avant d'entrer. */
  sessionTitle: string;
  /** Édition support de la séance. */
  editionId: string;
  /** True si la partie a déjà démarré — l'élève rejoint alors en cours de route. */
  demarree: boolean;
}

/**
 * Nature d'un échec de rattachement. L'écran en tire un message DISTINCT :
 * « code invalide » et « pas de réseau » n'appellent pas le même geste de la
 * part de l'élève, et le confondre bloque une classe entière.
 */
export type ClassJoinErrorKind =
  /** 404 — code inconnu OU fenêtre expirée (l'API ne distingue pas, à dessein). */
  | 'invalid_code'
  /** 429 — trop de tentatives depuis cette IP (souvent le wifi de l'établissement). */
  | 'rate_limited'
  /** 401 — pas connecté, session expirée, ou compte invité. */
  | 'unauthenticated'
  /** 409 — le nom vient d'être pris, ou ce compte est déjà rattaché ailleurs. */
  | 'conflict'
  /** Réseau injoignable, DNS, timeout : rien n'est parti côté serveur. */
  | 'offline'
  /** 500 et tout le reste. */
  | 'unknown';

/**
 * Erreur typée du service de classe.
 * Porte le `kind` (pour choisir la clé i18n) ET le message serveur quand il
 * existe : le back-office rédige des messages précis (« Votre compte est déjà
 * rattaché à "X" »), les perdre appauvrirait l'écran.
 */
export class ClassJoinError extends Error {
  readonly kind: ClassJoinErrorKind;
  /** Secondes à patienter, renseigné par l'en-tête `Retry-After` sur un 429. */
  readonly retryAfterSeconds: number | null;
  /** Message rédigé par le serveur, à préférer au message générique s'il existe. */
  readonly serverMessage: string | null;

  constructor(
    kind: ClassJoinErrorKind,
    options?: { retryAfterSeconds?: number | null; serverMessage?: string | null }
  ) {
    super(options?.serverMessage ?? kind);
    this.name = 'ClassJoinError';
    this.kind = kind;
    this.retryAfterSeconds = options?.retryAfterSeconds ?? null;
    this.serverMessage = options?.serverMessage ?? null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RATTACHEMENT PERSISTÉ ET SÉANCES (Firestore, lecture directe)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Miroir `classLinks/{uid}` — LA source de vérité du rattachement.
 *
 * Écrit UNIQUEMENT par l'Admin SDK (`POST /api/class/link`), fermé en écriture
 * à tous par les règles Firestore, lisible par son seul propriétaire. C'est ce
 * qui le distingue de `users/{uid}.classIds`, que l'élève écrit lui-même et sur
 * lequel aucun droit ne peut donc être fondé.
 */
export interface ClassLink {
  classId: string;
  learnerId: string;
  /** Date du rattachement, en millisecondes epoch. */
  linkedAt: number;
}

/** Une classe telle que l'élève la voit sur son profil — projection minimale. */
export interface MyClass {
  classId: string;
  className: string;
  /** Le learner auquel CE compte est rattaché dans cette classe. */
  learnerId: string;
  linkedAt: number;
}

/** États d'une séance côté back-office. L'élève ne voit que `running`. */
export type ClassSessionStatus = 'scheduled' | 'running' | 'ended';

/**
 * Séance de classe, telle que l'élève la lit dans `classSessions/{sid}`.
 * Seuls les champs utiles au parcours élève sont typés : les champs de pilotage
 * (`teacherId`, `establishmentId`…) existent en base mais ne servent à rien ici.
 */
export interface ClassSessionSummary {
  id: string;
  classId: string;
  status: ClassSessionStatus;
  /** Édition dont le contenu est imposé à tous les élèves de la séance. */
  editionId: string;
  /** Pack de contenu retenu dans le programme d'origine, le cas échéant. */
  contentPackId?: string;
  /** Titre donné par l'enseignant, pour que l'élève reconnaisse la séance. */
  title?: string;
  /** Durée prévue, en minutes (20 à 45). */
  durationMinutes: number;
  /** Début effectif, en millisecondes epoch. */
  startedAt?: number;
  /**
   * Instant où l'enseignant a lancé la partie, en ms epoch.
   *
   * Absent = SALLE D'ATTENTE : la séance est ouverte, les élèves rejoignent et
   * patientent. Présent = le jeu est parti. C'est ce champ que l'écran d'attente
   * surveille pour démarrer tout le monde en même temps.
   */
  startedPlayingAt?: number;
}

/**
 * Contenu pédagogique d'une séance — le cours du prof passé à la moulinette IA,
 * relu par lui, puis figé. Même forme que `GameContentPack` de l'EventManager :
 * c'est ce qui permet de l'injecter SANS toucher au moteur de jeu.
 */
export interface ClassSessionContent {
  quizzes: Quiz[];
  duels: Duel[];
  fundings: Funding[];
  opportunities: Opportunity[];
  challengeEvents: ChallengeEventData[];
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICIPATION (ce que l'élève écrit pendant sa partie)
// ═══════════════════════════════════════════════════════════════════════════

/** État d'un élève dans une séance, vu par l'enseignant au lot 6. */
export type ClassParticipantStatus = 'joined' | 'playing' | 'finished' | 'abandoned';

/** Progression de l'élève sur le plateau, remontée par throttle. */
export interface ClassProgress {
  /** Case atteinte sur le circuit. */
  cellIndex: number;
  tokens: number;
  cardsPlayed: number;
}

/**
 * Une réponse de quiz — LA donnée qui alimentera le rapport pédagogique (lot 6).
 * `category` vient du quiz joué : c'est elle qui permet d'agréger les
 * « notions maîtrisées » par catégorie.
 */
export interface ClassAnswer {
  quizId: string;
  category: string;
  correct: boolean;
  /** Millisecondes epoch. */
  answeredAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTE DE JEU
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Contexte d'une partie jouée DANS une séance de classe.
 *
 * Calqué sur `ProgramGameContext` (`src/types/program.ts`) — même discriminant
 * `origin`, même rôle : il traverse `initGame` jusqu'au `GameState`, où l'écran
 * de jeu le relit pour savoir où remonter la progression et les réponses.
 *
 * Il ne PILOTE rien dans le moteur : il ne fait qu'identifier la destination
 * des écritures et le pack de contenu à charger.
 */
export interface ClassGameContext {
  origin: 'class';
  classId: string;
  sessionId: string;
  /** Le learner de CETTE classe auquel le compte est rattaché. */
  learnerId: string;
  /** Pack de contenu retenu par l'enseignant, le cas échéant. */
  contentPackId?: string;
  /** Édition imposée par l'enseignant — sert de repli si le pack est vide. */
  editionId: string;
}
