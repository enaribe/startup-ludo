/**
 * EventManager - Gestionnaire centralisé des événements de jeu
 *
 * Connecte les événements du plateau aux données réelles des éditions JSON.
 * Gère la sélection aléatoire et le suivi des événements déjà utilisés.
 */

import type { EventType } from '@/types';
import {
  getRandomQuiz,
  getRandomDuel,
  getRandomFunding,
  getRandomEvent,
  getRandomOpportunity,
  getRandomChallenge,
  type EditionId,
  type Quiz,
  type Duel,
  type Funding,
  type Opportunity,
  type Challenge as ChallengeEventData,
  type DifficultyLevel,
} from '@/data';

// ===== CONTENT PACK (sous-niveau challenge) =====

export interface SubLevelContentPack {
  quizzes: Quiz[];
  duels: Duel[];
  fundings: Funding[];
  opportunities: Opportunity[];
  challengeEvents: ChallengeEventData[];
}

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

const DEFAULT_QUIZ_CONFIG = {
  timeLimit: 30,
  rewards: {
    facile: { reward: 2, penalty: 0 },
    moyen: { reward: 3, penalty: 1 },
    difficile: { reward: 5, penalty: 2 },
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
  private subLevelContent: SubLevelContentPack | null = null;

  constructor(private editionId: EditionId = 'classic') {}

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
    this.subLevelContent = content;
    this.reset();
  }

  /**
   * Efface le contenu du sous-niveau (retour au mode édition)
   */
  clearSubLevelContent(): void {
    this.subLevelContent = null;
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
      case 'opportunity':
        return this.generateOpportunityEvent();
      case 'challenge':
        return this.generateChallengeEvent();
      default:
        return null;
    }
  }

  /**
   * Sélectionne un élément aléatoire d'un tableau
   */
  private pickRandom<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)] ?? null;
  }

  /**
   * Génère un quiz aléatoire
   */
  generateQuizEvent(difficulty?: DifficultyLevel): GeneratedQuizEvent | null {
    // Priorité : contenu du sous-niveau, puis édition
    const quiz = this.subLevelContent?.quizzes.length
      ? this.pickRandom(
          difficulty
            ? this.subLevelContent.quizzes.filter(q => q.difficulty === difficulty)
            : this.subLevelContent.quizzes
        )
      : getRandomQuiz(this.editionId, difficulty);

    if (!quiz) {
      return this.getFallbackQuiz();
    }

    // Marquer comme utilisé
    this.usedQuizIds.add(quiz.id);

    // Déterminer la difficulté
    const quizDifficulty = quiz.difficulty ?? this.inferDifficulty(quiz);
    const config = DEFAULT_QUIZ_CONFIG.rewards[quizDifficulty];

    return {
      type: 'quiz',
      data: {
        id: quiz.id,
        category: quiz.category,
        question: quiz.question,
        options: quiz.options,
        correctAnswer: quiz.correctAnswer,
        difficulty: quizDifficulty,
        reward: quiz.rewardTokens ?? config.reward,
        penalty: quiz.penaltyTokens ?? config.penalty,
        timeLimit: quiz.timeLimit ?? DEFAULT_QUIZ_CONFIG.timeLimit,
      },
    };
  }

  /**
   * Génère un financement aléatoire
   */
  generateFundingEvent(): GeneratedFundingEvent | null {
    const funding = this.subLevelContent?.fundings.length
      ? this.pickRandom(this.subLevelContent.fundings)
      : getRandomFunding(this.editionId);

    if (!funding) {
      return this.getFallbackFunding();
    }

    this.usedFundingIds.add(funding.id);

    return {
      type: 'funding',
      data: {
        id: funding.id,
        name: funding.title,
        description: funding.description,
        type: this.inferFundingType(funding.title),
        amount: funding.tokens,
        rarity: this.inferRarity(funding.tokens),
      },
    };
  }

  /**
   * Génère un duel aléatoire (format DuelQuestion : question + 3 options avec points)
   */
  generateDuelEvent(): GeneratedDuelEvent | null {
    const duel = this.subLevelContent?.duels.length
      ? this.pickRandom(this.subLevelContent.duels)
      : getRandomDuel(this.editionId);

    if (!duel) {
      return this.getFallbackDuel();
    }

    this.usedDuelIds.add(duel.id);

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
   * Génère une opportunité aléatoire
   */
  generateOpportunityEvent(): GeneratedOpportunityEvent | null {
    const opportunity = this.subLevelContent?.opportunities.length
      ? this.pickRandom(this.subLevelContent.opportunities)
      : getRandomOpportunity(this.editionId);

    if (!opportunity) {
      return this.getFallbackOpportunity();
    }

    this.usedOpportunityIds.add(opportunity.id);

    return {
      type: 'opportunity',
      data: {
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        effect: 'tokens',
        value: opportunity.tokens,
        rarity: this.inferRarity(opportunity.tokens),
      },
    };
  }

  /**
   * Génère un challenge aléatoire
   */
  generateChallengeEvent(): GeneratedChallengeEvent | null {
    const challenge = this.subLevelContent?.challengeEvents.length
      ? this.pickRandom(this.subLevelContent.challengeEvents)
      : getRandomChallenge(this.editionId);

    if (!challenge) {
      return this.getFallbackChallenge();
    }

    this.usedChallengeIds.add(challenge.id);

    return {
      type: 'challenge',
      data: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        effect: 'loseTokens',
        value: Math.abs(challenge.tokens),
        rarity: this.inferRarity(Math.abs(challenge.tokens)),
      },
    };
  }

  /**
   * Génère un événement aléatoire (50% opportunité, 50% challenge)
   */
  generateRandomEvent(): GeneratedOpportunityEvent | GeneratedChallengeEvent | null {
    // Si contenu sous-niveau, tirer de là
    if (this.subLevelContent) {
      const hasOpp = this.subLevelContent.opportunities.length > 0;
      const hasChal = this.subLevelContent.challengeEvents.length > 0;
      if (!hasOpp && !hasChal) {
        return Math.random() < 0.5 ? this.getFallbackOpportunity() : this.getFallbackChallenge();
      }
      const pickOpp = hasOpp && (!hasChal || Math.random() < 0.5);
      if (pickOpp) {
        const opp = this.pickRandom(this.subLevelContent.opportunities);
        if (opp) {
          this.usedOpportunityIds.add(opp.id);
          return {
            type: 'opportunity',
            data: { id: opp.id, title: opp.title, description: opp.description, effect: 'tokens', value: opp.tokens, rarity: this.inferRarity(opp.tokens) },
          };
        }
      }
      const chal = this.pickRandom(this.subLevelContent.challengeEvents);
      if (chal) {
        this.usedChallengeIds.add(chal.id);
        return {
          type: 'challenge',
          data: { id: chal.id, title: chal.title, description: chal.description, effect: 'loseTokens', value: Math.abs(chal.tokens), rarity: this.inferRarity(Math.abs(chal.tokens)) },
        };
      }
    }

    const event = getRandomEvent(this.editionId);

    if (!event) {
      return Math.random() < 0.5
        ? this.getFallbackOpportunity()
        : this.getFallbackChallenge();
    }

    if (event.type === 'opportunity') {
      this.usedOpportunityIds.add(event.data.id);
      return {
        type: 'opportunity',
        data: {
          id: event.data.id,
          title: event.data.title,
          description: event.data.description,
          effect: 'tokens',
          value: event.data.tokens,
          rarity: this.inferRarity(event.data.tokens),
        },
      };
    } else {
      this.usedChallengeIds.add(event.data.id);
      return {
        type: 'challenge',
        data: {
          id: event.data.id,
          title: event.data.title,
          description: event.data.description,
          effect: 'loseTokens',
          value: Math.abs(event.data.tokens),
          rarity: this.inferRarity(Math.abs(event.data.tokens)),
        },
      };
    }
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
        question: 'Quel est le premier pas pour créer une startup ?',
        options: [
          'Chercher des investisseurs',
          'Identifier un problème à résoudre',
          'Créer un logo',
          'Ouvrir un compte bancaire',
        ],
        correctAnswer: 1,
        difficulty: 'facile',
        reward: 2,
        penalty: 0,
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
        amount: 3,
        rarity: 'common',
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
        value: 3,
        rarity: 'common',
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
        value: 2,
        rarity: 'common',
      },
    };
  }
}

// ===== SINGLETON EXPORT =====

export const eventManager = new EventManager();
