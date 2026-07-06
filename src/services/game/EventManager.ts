/**
 * EventManager - Gestionnaire centralisé des événements de jeu
 *
 * Connecte les événements du plateau aux données réelles des éditions JSON.
 * Gère la sélection aléatoire et le suivi des événements déjà utilisés.
 */

import type { EventType } from '@/types';
import {
  getEdition,
  type EditionId,
  type Quiz,
  type Duel,
  type Funding,
  type Opportunity,
  type Challenge as ChallengeEventData,
  type DifficultyLevel,
} from '@/data';

// ===== CONTENT PACK (programme ou sous-niveau challenge legacy) =====

export interface GameContentPack {
  quizzes: Quiz[];
  duels: Duel[];
  fundings: Funding[];
  opportunities: Opportunity[];
  challengeEvents: ChallengeEventData[];
}

export type SubLevelContentPack = GameContentPack;

// ===== TYPES =====

export interface GeneratedQuizEvent {
  type: 'quiz';
  data: {
    id: string;
    category: string;
    question: string;
    options: string[];
    correctAnswer: number;
    difficulty: DifficultyLevel;
    reward: number;
    penalty: number;
    timeLimit: number;
    explanation?: string;
  };
}

export interface GeneratedFundingEvent {
  type: 'funding';
  data: {
    id: string;
    name: string;
    description: string;
    type: 'investisseur' | 'subvention' | 'crowdfunding' | 'concours' | 'partenariat';
    amount: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export interface GeneratedDuelEvent {
  type: 'duel';
  data: {
    id: string;
    question: string;
    options: { text: string; points: number }[];
    category: string;
  };
}

export interface GeneratedOpportunityEvent {
  type: 'opportunity';
  data: {
    id: string;
    title: string;
    description: string;
    effect: 'tokens' | 'extraTurn' | 'shield' | 'boost';
    value: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export interface GeneratedChallengeEvent {
  type: 'challenge';
  data: {
    id: string;
    title: string;
    description: string;
    effect: 'loseTokens' | 'skipTurn' | 'retreat' | 'returnBase';
    value: number;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export type GeneratedGameEvent =
  | GeneratedQuizEvent
  | GeneratedFundingEvent
  | GeneratedDuelEvent
  | GeneratedOpportunityEvent
  | GeneratedChallengeEvent;

// ===== CONSTANTES =====

const FIXED_POINTS = {
  quiz: { reward: 1, penalty: 0 },
  challenge: 2,
  opportunity: 2,
  funding: 4,
} as const;

const DEFAULT_QUIZ_CONFIG = {
  timeLimit: 30,
  rewards: {
    facile: { reward: FIXED_POINTS.quiz.reward, penalty: FIXED_POINTS.quiz.penalty },
    moyen: { reward: FIXED_POINTS.quiz.reward, penalty: FIXED_POINTS.quiz.penalty },
    difficile: { reward: FIXED_POINTS.quiz.reward, penalty: FIXED_POINTS.quiz.penalty },
  } as Record<DifficultyLevel, { reward: number; penalty: number }>,
};

const FUNDING_TYPES = ['investisseur', 'subvention', 'crowdfunding', 'concours', 'partenariat'] as const;

// ===== CLASSE PRINCIPALE =====

export class EventManager {
  private usedQuizIds: Set<string> = new Set();
  private usedDuelIds: Set<string> = new Set();
  private usedFundingIds: Set<string> = new Set();
  private usedOpportunityIds: Set<string> = new Set();
  private usedChallengeIds: Set<string> = new Set();
  // Mémoire des DERNIERS ids montrés par Set (partagée par référence du Set).
  // Sert à éviter qu'un contenu juste vu ressorte immédiatement après un
  // recyclage (pool épuisé — cas fréquent quand le pion refait un tour de plateau).
  private recentIds: WeakMap<Set<string>, string[]> = new WeakMap();
  private static readonly RECENT_WINDOW = 4;
  private contentPack: GameContentPack | null = null;
  /** Langue d'affichage du contenu (préférence joueur). Applique translations[lang] partout. */
  private lang: string = 'fr';

  constructor(private editionId: EditionId = 'classic') {}

  /** Définit la langue d'affichage du contenu (éditions ET programmes). */
  setLanguage(lang: string): void {
    this.lang = lang || 'fr';
  }

  // ===== Résolution de traduction (sur la carte tirée) =====
  private tQuiz(q: Quiz): Quiz {
    const t = this.lang !== 'fr' ? q.translations?.[this.lang] : undefined;
    return t ? { ...q, question: t.question, options: t.options, explanation: t.explanation ?? q.explanation } : q;
  }
  private tDuel(d: Duel): Duel {
    const t = this.lang !== 'fr' ? d.translations?.[this.lang] : undefined;
    return t ? { ...d, question: t.question, options: d.options.map((o, i) => ({ ...o, text: t.options[i] ?? o.text })) } : d;
  }
  private tFunding(f: Funding): Funding {
    const t = this.lang !== 'fr' ? f.translations?.[this.lang] : undefined;
    return t ? { ...f, title: t.title, description: t.description } : f;
  }
  private tOpportunity(o: Opportunity): Opportunity {
    const t = this.lang !== 'fr' ? o.translations?.[this.lang] : undefined;
    return t ? { ...o, title: t.title, description: t.description } : o;
  }
  private tChallenge(c: ChallengeEventData): ChallengeEventData {
    const t = this.lang !== 'fr' ? c.translations?.[this.lang] : undefined;
    return t ? { ...c, title: t.title, description: t.description } : c;
  }

  /**
   * Change l'édition active
   */
  setEdition(editionId: EditionId): void {
    this.editionId = editionId;
    this.reset();
  }

  /**
   * Définit le contenu d'un sous-niveau challenge (prioritaire sur l'édition)
   */
  setSubLevelContent(content: SubLevelContentPack): void {
    this.setContentPack(content);
  }

  /**
   * Définit le contenu prioritaire d'une partie programme.
   * (La traduction est résolue au tirage de chaque carte via this.lang.)
   */
  setContentPack(content: GameContentPack): void {
    this.contentPack = content;
    this.reset();
  }

  /**
   * Efface le contenu du sous-niveau (retour au mode édition)
   */
  clearSubLevelContent(): void {
    this.clearContentPack();
  }

  /**
   * Efface le contenu prioritaire (retour au mode édition).
   */
  clearContentPack(): void {
    this.contentPack = null;
  }

  /**
   * Réinitialise les événements utilisés
   */
  reset(): void {
    this.usedQuizIds.clear();
    this.usedDuelIds.clear();
    this.usedFundingIds.clear();
    this.usedOpportunityIds.clear();
    this.usedChallengeIds.clear();
    // Repart d'une mémoire « récents » vierge pour la nouvelle partie/niveau.
    this.recentIds = new WeakMap();
  }

  /**
   * Marque un événement comme déjà utilisé sans le tirer.
   * Indispensable en multijoueur : quand un joueur reçoit un événement
   * généré par un autre client, il l'enregistre dans son propre historique
   * pour ne pas le re-tirer plus tard. Garde les 4 EventManagers synchronisés.
   */
  markUsed(eventType: EventType, id: string): void {
    if (!id) return;
    switch (eventType) {
      case 'quiz':
        this.usedQuizIds.add(id);
        break;
      case 'duel':
        this.usedDuelIds.add(id);
        break;
      case 'funding':
        this.usedFundingIds.add(id);
        break;
      case 'opportunity':
        this.usedOpportunityIds.add(id);
        break;
      case 'challenge':
        this.usedChallengeIds.add(id);
        break;
      case 'event':
        // L'événement aléatoire est en réalité une opportunité ou un challenge.
        // L'ID préfixé indique lequel ; sinon on marque dans les deux par sécurité.
        if (id.startsWith('opp')) {
          this.usedOpportunityIds.add(id);
        } else if (id.startsWith('chal')) {
          this.usedChallengeIds.add(id);
        } else {
          this.usedOpportunityIds.add(id);
          this.usedChallengeIds.add(id);
        }
        break;
      default:
        break;
    }
  }

  /**
   * Génère un événement basé sur le type de case
   */
  generateEvent(eventType: EventType): GeneratedGameEvent | null {
    switch (eventType) {
      case 'quiz':
        return this.generateQuizEvent();
      case 'funding':
        return this.generateFundingEvent();
      case 'duel':
        return this.generateDuelEvent();
      case 'event':
        return this.generateRandomEvent();
      case 'opportunity':
        return this.generateOpportunityEvent();
      case 'challenge':
        return this.generateChallengeEvent();
      default:
        return null;
    }
  }

  /**
   * Génère un événement pour une édition spécifique (sans modifier l'état global).
   * Utilisé en mode online où chaque joueur a sa propre édition.
   */
  generateEventForEdition(eventType: EventType, editionId: EditionId): GeneratedGameEvent | null {
    const previousEdition = this.editionId;
    this.editionId = editionId;
    const event = this.generateEvent(eventType);
    this.editionId = previousEdition;
    return event;
  }

  /**
   * Sélectionne un élément aléatoire en évitant les IDs déjà utilisés.
   * Quand tous les items ont été utilisés, reset le Set et recycle.
   * Garantit qu'un même item ne reviendra pas avant d'avoir parcouru tout le pool.
   */
  private pickRandomUnused<T extends { id: string }>(items: T[], usedIds: Set<string>): T | null {
    if (items.length === 0) return null;

    let available = items.filter((item) => !usedIds.has(item.id));

    // Pool épuisé : on recycle en resettant le Set. Mais on EXCLUT les derniers
    // contenus montrés pour éviter qu'un item juste vu ressorte immédiatement
    // (ex. le pion refait un tour de plateau et retombe sur une case du même type).
    if (available.length === 0) {
      usedIds.clear();
      const recent = this.recentIds.get(usedIds) ?? [];
      // On garde au moins 1 candidat : la fenêtre d'exclusion ne dépasse jamais
      // la taille du pool - 1.
      const windowSize = Math.min(recent.length, Math.max(0, items.length - 1));
      const excluded = new Set(recent.slice(-windowSize));
      available = items.filter((item) => !excluded.has(item.id));
      if (available.length === 0) available = items; // filet de sécurité
    }

    const chosen = available[Math.floor(Math.random() * available.length)] ?? null;

    // Mémorise l'id choisi dans la fenêtre récente (borne à RECENT_WINDOW).
    if (chosen) {
      const recent = this.recentIds.get(usedIds) ?? [];
      recent.push(chosen.id);
      while (recent.length > EventManager.RECENT_WINDOW) recent.shift();
      this.recentIds.set(usedIds, recent);
    }

    return chosen;
  }

  /**
   * Génère un quiz aléatoire (évite les doublons tant qu'il reste des quiz non joués)
   */
  generateQuizEvent(difficulty?: DifficultyLevel): GeneratedQuizEvent | null {
    // Source : sous-niveau challenge si défini, sinon édition
    const pool = this.contentPack?.quizzes.length
      ? this.contentPack.quizzes
      : getEdition(this.editionId).quizzes;

    const filtered = difficulty ? pool.filter((q) => q.difficulty === difficulty) : pool;
    const picked = this.pickRandomUnused(filtered, this.usedQuizIds);

    if (!picked) {
      const fallback = this.getFallbackQuiz();
      this.usedQuizIds.add(fallback.data.id);
      return fallback;
    }

    // Marquer comme utilisé (sur l'id d'origine) puis localiser dans la langue du joueur
    this.usedQuizIds.add(picked.id);
    const quiz = this.tQuiz(picked);

    // Déterminer la difficulté
    const quizDifficulty = quiz.difficulty ?? this.inferDifficulty(quiz);

    return {
      type: 'quiz',
      data: {
        id: quiz.id,
        category: quiz.category,
        question: quiz.question,
        options: quiz.options,
        correctAnswer: quiz.correctAnswer,
        difficulty: quizDifficulty,
        reward: FIXED_POINTS.quiz.reward,
        penalty: FIXED_POINTS.quiz.penalty,
        timeLimit: quiz.timeLimit ?? DEFAULT_QUIZ_CONFIG.timeLimit,
        explanation: quiz.explanation || undefined,
      },
    };
  }

  /**
   * Génère un financement aléatoire (évite les doublons)
   */
  generateFundingEvent(): GeneratedFundingEvent | null {
    const pool = this.contentPack?.fundings.length
      ? this.contentPack.fundings
      : getEdition(this.editionId).fundings;

    const pickedFunding = this.pickRandomUnused(pool, this.usedFundingIds);

    if (!pickedFunding) {
      const fallback = this.getFallbackFunding();
      this.usedFundingIds.add(fallback.data.id);
      return fallback;
    }

    this.usedFundingIds.add(pickedFunding.id);
    const funding = this.tFunding(pickedFunding);

    return {
      type: 'funding',
      data: {
        id: funding.id,
        name: funding.title,
        description: funding.description,
        type: this.inferFundingType(funding.title),
        amount: FIXED_POINTS.funding,
        rarity: this.inferRarity(FIXED_POINTS.funding),
      },
    };
  }

  /**
   * Génère un duel aléatoire (évite les doublons)
   */
  generateDuelEvent(): GeneratedDuelEvent | null {
    const pool = this.contentPack?.duels.length
      ? this.contentPack.duels
      : getEdition(this.editionId).duels;

    const pickedDuel = this.pickRandomUnused(pool, this.usedDuelIds);

    if (!pickedDuel) {
      const fallback = this.getFallbackDuel();
      this.usedDuelIds.add(fallback.data.id);
      return fallback;
    }

    this.usedDuelIds.add(pickedDuel.id);
    const duel = this.tDuel(pickedDuel);

    return {
      type: 'duel',
      data: {
        id: duel.id,
        question: duel.question,
        options: duel.options,
        category: duel.category,
      },
    };
  }

  /**
   * Génère une opportunité aléatoire (évite les doublons)
   */
  generateOpportunityEvent(): GeneratedOpportunityEvent | null {
    const pool = this.contentPack?.opportunities.length
      ? this.contentPack.opportunities
      : getEdition(this.editionId).opportunities;

    const pickedOpportunity = this.pickRandomUnused(pool, this.usedOpportunityIds);

    if (!pickedOpportunity) {
      const fallback = this.getFallbackOpportunity();
      this.usedOpportunityIds.add(fallback.data.id);
      return fallback;
    }

    this.usedOpportunityIds.add(pickedOpportunity.id);
    const opportunity = this.tOpportunity(pickedOpportunity);

    return {
      type: 'opportunity',
      data: {
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        effect: 'tokens',
        value: FIXED_POINTS.opportunity,
        rarity: this.inferRarity(FIXED_POINTS.opportunity),
      },
    };
  }

  /**
   * Génère un challenge aléatoire (évite les doublons)
   */
  generateChallengeEvent(): GeneratedChallengeEvent | null {
    const pool = this.contentPack?.challengeEvents.length
      ? this.contentPack.challengeEvents
      : getEdition(this.editionId).challenges;

    const pickedChallenge = this.pickRandomUnused(pool, this.usedChallengeIds);

    if (!pickedChallenge) {
      const fallback = this.getFallbackChallenge();
      this.usedChallengeIds.add(fallback.data.id);
      return fallback;
    }

    this.usedChallengeIds.add(pickedChallenge.id);
    const challenge = this.tChallenge(pickedChallenge);

    return {
      type: 'challenge',
      data: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        effect: 'loseTokens',
        value: FIXED_POINTS.challenge,
        rarity: this.inferRarity(FIXED_POINTS.challenge),
      },
    };
  }

  /**
   * Génère un événement aléatoire (50% opportunité, 50% challenge) — évite les doublons
   */
  generateRandomEvent(): GeneratedOpportunityEvent | GeneratedChallengeEvent | null {
    // Source : sous-niveau si défini, sinon édition
    const opportunities = this.contentPack?.opportunities.length
      ? this.contentPack.opportunities
      : getEdition(this.editionId).opportunities;
    const challenges = this.contentPack?.challengeEvents.length
      ? this.contentPack.challengeEvents
      : getEdition(this.editionId).challenges;

    const hasOpp = opportunities.length > 0;
    const hasChal = challenges.length > 0;

    if (!hasOpp && !hasChal) {
      return Math.random() < 0.5 ? this.getFallbackOpportunity() : this.getFallbackChallenge();
    }

    // Choix du type : 50/50 si les deux sont dispo, sinon celui qui a des items
    const pickOpp = hasOpp && (!hasChal || Math.random() < 0.5);

    if (pickOpp) {
      const picked = this.pickRandomUnused(opportunities, this.usedOpportunityIds);
      if (picked) {
        this.usedOpportunityIds.add(picked.id);
        const opp = this.tOpportunity(picked);
        return {
          type: 'opportunity',
          data: {
            id: opp.id,
            title: opp.title,
            description: opp.description,
            effect: 'tokens',
            value: FIXED_POINTS.opportunity,
            rarity: this.inferRarity(FIXED_POINTS.opportunity),
          },
        };
      }
    }

    const pickedChal = this.pickRandomUnused(challenges, this.usedChallengeIds);
    if (pickedChal) {
      this.usedChallengeIds.add(pickedChal.id);
      const chal = this.tChallenge(pickedChal);
      return {
        type: 'challenge',
        data: {
          id: chal.id,
          title: chal.title,
          description: chal.description,
          effect: 'loseTokens',
          value: FIXED_POINTS.challenge,
          rarity: this.inferRarity(FIXED_POINTS.challenge),
        },
      };
    }

    // Fallback si tout est vide
    return Math.random() < 0.5 ? this.getFallbackOpportunity() : this.getFallbackChallenge();
  }

  // ===== HELPERS PRIVÉS =====

  private inferDifficulty(quiz: Quiz): DifficultyLevel {
    // Inférer la difficulté basée sur le nombre d'options ou la longueur de la question
    if (quiz.options.length > 4) return 'difficile';
    if (quiz.question.length > 100) return 'moyen';
    return 'facile';
  }

  private inferFundingType(title: string): typeof FUNDING_TYPES[number] {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('investiss')) return 'investisseur';
    if (lowerTitle.includes('subvention') || lowerTitle.includes('aide')) return 'subvention';
    if (lowerTitle.includes('crowd') || lowerTitle.includes('participatif')) return 'crowdfunding';
    if (lowerTitle.includes('concours') || lowerTitle.includes('prix')) return 'concours';
    if (lowerTitle.includes('partenariat') || lowerTitle.includes('contrat')) return 'partenariat';
    return FUNDING_TYPES[Math.floor(Math.random() * FUNDING_TYPES.length)]!;
  }

  private inferRarity(tokenValue: number): 'common' | 'rare' | 'epic' | 'legendary' {
    if (tokenValue >= 5) return 'legendary';
    if (tokenValue >= 4) return 'epic';
    if (tokenValue >= 3) return 'rare';
    return 'common';
  }

  // ===== FALLBACKS =====

  private getFallbackQuiz(): GeneratedQuizEvent {
    return {
      type: 'quiz',
      data: {
        id: `fallback_quiz_${Date.now()}`,
        category: 'Entrepreneuriat',
        question: 'Quel est le premier pas pour créer une entreprise ?',
        options: [
          'Chercher des investisseurs',
          'Identifier un problème à résoudre',
          'Créer un logo',
          'Ouvrir un compte bancaire',
        ],
        correctAnswer: 1,
        difficulty: 'facile',
        reward: FIXED_POINTS.quiz.reward,
        penalty: FIXED_POINTS.quiz.penalty,
        timeLimit: 30,
      },
    };
  }

  private getFallbackFunding(): GeneratedFundingEvent {
    return {
      type: 'funding',
      data: {
        id: `fallback_funding_${Date.now()}`,
        name: 'Investisseur Providentiel',
        description: 'Un investisseur croit en ton projet !',
        type: 'investisseur',
        amount: FIXED_POINTS.funding,
        rarity: this.inferRarity(FIXED_POINTS.funding),
      },
    };
  }

  private getFallbackDuel(): GeneratedDuelEvent {
    return {
      type: 'duel',
      data: {
        id: `fallback_duel_${Date.now()}`,
        question: 'Quelle est la meilleure stratégie pour convaincre un investisseur ?',
        options: [
          { text: 'Présenter des métriques de traction solides', points: 30 },
          { text: 'Montrer un business plan détaillé sur 5 ans', points: 20 },
          { text: 'Mettre en avant les diplômes de l\'équipe', points: 10 },
        ],
        category: 'pitch',
      },
    };
  }

  private getFallbackOpportunity(): GeneratedOpportunityEvent {
    return {
      type: 'opportunity',
      data: {
        id: `fallback_opportunity_${Date.now()}`,
        title: 'Partenariat stratégique',
        description: 'Une grande entreprise veut collaborer avec toi !',
        effect: 'tokens',
        value: FIXED_POINTS.opportunity,
        rarity: this.inferRarity(FIXED_POINTS.opportunity),
      },
    };
  }

  private getFallbackChallenge(): GeneratedChallengeEvent {
    return {
      type: 'challenge',
      data: {
        id: `fallback_challenge_${Date.now()}`,
        title: 'Problème de trésorerie',
        description: 'Des dépenses imprévues affectent ton budget.',
        effect: 'loseTokens',
        value: FIXED_POINTS.challenge,
        rarity: this.inferRarity(FIXED_POINTS.challenge),
      },
    };
  }
}

// ===== SINGLETON EXPORT =====

export const eventManager = new EventManager();
