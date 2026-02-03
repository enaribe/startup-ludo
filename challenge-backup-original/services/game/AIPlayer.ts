/**
 * AI Player - Intelligence artificielle pour le mode solo
 *
 * Utilise le nouveau système de pions (PawnState)
 */

import type { Player, PlayerColor } from '@/types';
import { GameEngine, type MoveResult, type ValidMove } from './GameEngine';
import { CIRCUIT_LENGTH } from '@/config/boardConfig';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

interface AIDecision {
  type: 'exit' | 'move' | 'skip';
  pawnIndex?: number;
  reasoning: string;
}

interface MoveEvaluation {
  type: 'exit' | 'move';
  pawnIndex: number;
  result: MoveResult;
  score: number;
  reasoning: string;
}

/**
 * Service d'IA pour le mode solo
 */
export class AIPlayer {
  private difficulty: AIDifficulty;
  private thinkingDelay: { min: number; max: number };

  constructor(difficulty: AIDifficulty = 'medium') {
    this.difficulty = difficulty;

    // Délai de réflexion selon la difficulté
    this.thinkingDelay = {
      easy: { min: 1500, max: 3000 },
      medium: { min: 1000, max: 2000 },
      hard: { min: 500, max: 1500 },
    }[difficulty];
  }

  /**
   * Prendre une décision de jeu
   */
  async makeDecision(
    player: Player,
    diceValue: number,
    allPlayers: Player[]
  ): Promise<AIDecision> {
    await this.simulateThinking();

    const validMoves = GameEngine.getValidMoves(player, diceValue, allPlayers);

    if (validMoves.length === 0) {
      return {
        type: 'skip',
        reasoning: 'Aucun mouvement possible',
      };
    }

    // Évaluer chaque mouvement
    const evaluations = this.evaluateMoves(player, validMoves, allPlayers);

    // Sélectionner selon la difficulté
    const decision = this.selectMove(evaluations);

    return decision;
  }

  /**
   * Évaluer tous les mouvements possibles
   */
  private evaluateMoves(
    player: Player,
    moves: ValidMove[],
    allPlayers: Player[]
  ): MoveEvaluation[] {
    return moves.map((move) => {
      let score = 0;
      let reasoning = '';

      if (move.type === 'exit') {
        score = this.evaluateExit(player, allPlayers);
        reasoning = 'Sortir un pion de la maison';
      } else {
        const evalResult = this.evaluateMove(player, move.result, allPlayers);
        score = evalResult.score;
        reasoning = evalResult.reasoning;
      }

      return {
        type: move.type,
        pawnIndex: move.pawnIndex,
        result: move.result,
        score,
        reasoning,
      };
    });
  }

  /**
   * Évaluer la sortie d'un pion
   */
  private evaluateExit(player: Player, allPlayers: Player[]): number {
    let score = 50; // Score de base

    // Compter les pions à la maison
    const pawnsAtHome = player.pawns.filter(p => p.status === 'home').length;
    const pawnsOnBoard = player.pawns.filter(p =>
      p.status === 'circuit' || p.status === 'final'
    ).length;

    // Bonus si beaucoup de pions à la maison
    if (pawnsAtHome >= 3) {
      score += 20;
    }

    // Bonus si aucun pion sur le plateau
    if (pawnsOnBoard === 0) {
      score += 30;
    }

    // Vérifier si on peut capturer à la sortie
    const canCapture = this.checkCaptureAtStart(player, allPlayers);
    if (canCapture) {
      score += 40;
    }

    return score;
  }

  /**
   * Vérifier si on peut capturer à la position de départ
   */
  private checkCaptureAtStart(player: Player, allPlayers: Player[]): boolean {
    const startPosition = this.getStartPosition(player.color);

    for (const opponent of allPlayers) {
      if (opponent.id === player.id) continue;

      for (const pawn of opponent.pawns) {
        if (pawn.status === 'circuit' && pawn.position === startPosition) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Obtenir la position de départ pour une couleur
   */
  private getStartPosition(color: PlayerColor): number {
    const starts: Record<PlayerColor, number> = {
      yellow: 0,
      blue: 11,
      red: 22,
      green: 33,
    };
    return starts[color];
  }

  /**
   * Évaluer un mouvement normal
   */
  private evaluateMove(
    player: Player,
    result: MoveResult,
    allPlayers: Player[]
  ): { score: number; reasoning: string } {
    let score = 0;
    const reasons: string[] = [];

    // Finir un pion est toujours excellent
    if (result.isFinished) {
      score += 100;
      reasons.push('Arriver au centre');
    }

    // Entrer dans le chemin final est bon
    if (result.newState.status === 'final' && !result.isFinished) {
      score += 60;
      reasons.push("Entrer dans le chemin final");
    }

    // Capturer un adversaire est très bon
    if (result.capturedPawn) {
      score += 80;
      reasons.push('Capturer un adversaire');
    }

    // Événements sur la case
    if (result.triggeredEvent) {
      switch (result.triggeredEvent) {
        case 'funding':
          score += 30;
          reasons.push('Case financement');
          break;
        case 'opportunity':
          score += 25;
          reasons.push('Case opportunité');
          break;
        case 'quiz':
          score += 15;
          reasons.push('Case quiz');
          break;
        case 'duel':
          score += 10;
          reasons.push('Case duel');
          break;
        case 'challenge':
          score -= 10;
          reasons.push('Case challenge (risqué)');
          break;
      }
    }

    // Évaluer le danger de la nouvelle position
    if (result.newState.status === 'circuit') {
      const dangerScore = this.evaluateDanger(
        result.newState.position,
        player,
        allPlayers
      );
      score -= dangerScore;

      if (dangerScore > 30) {
        reasons.push('Position dangereuse');
      }
    }

    // Score de progression basique
    score += 10;

    return {
      score,
      reasoning: reasons.join(', ') || 'Avancer',
    };
  }

  /**
   * Évaluer le danger à une position
   */
  private evaluateDanger(
    position: number,
    player: Player,
    allPlayers: Player[]
  ): number {
    let danger = 0;

    for (const opponent of allPlayers) {
      if (opponent.id === player.id) continue;

      for (const pawn of opponent.pawns) {
        if (pawn.status !== 'circuit') continue;

        // Distance que l'adversaire devrait parcourir pour nous capturer
        const distance = this.getDistance(pawn.position, position);

        // Plus c'est proche, plus c'est dangereux
        if (distance <= 6) {
          danger += (7 - distance) * 10;
        }
      }
    }

    return danger;
  }

  /**
   * Calculer la distance entre deux positions
   */
  private getDistance(from: number, to: number): number {
    if (to >= from) {
      return to - from;
    }
    return CIRCUIT_LENGTH - from + to;
  }

  /**
   * Sélectionner le meilleur mouvement selon la difficulté
   */
  private selectMove(evaluations: MoveEvaluation[]): AIDecision {
    if (evaluations.length === 0) {
      return { type: 'skip', reasoning: 'Aucun mouvement possible' };
    }

    // Trier par score décroissant
    const sorted = [...evaluations].sort((a, b) => b.score - a.score);

    let selectedIndex: number;

    switch (this.difficulty) {
      case 'hard':
        // Toujours le meilleur
        selectedIndex = 0;
        break;

      case 'medium':
        // 70% meilleur, 30% second
        if (sorted.length > 1 && Math.random() > 0.7) {
          selectedIndex = 1;
        } else {
          selectedIndex = 0;
        }
        break;

      case 'easy':
      default:
        // 50% meilleur, 30% second, 20% aléatoire
        const roll = Math.random();
        if (roll < 0.5) {
          selectedIndex = 0;
        } else if (roll < 0.8 && sorted.length > 1) {
          selectedIndex = 1;
        } else {
          selectedIndex = Math.floor(Math.random() * sorted.length);
        }
        break;
    }

    const selected = sorted[selectedIndex]!;

    return {
      type: selected.type,
      pawnIndex: selected.pawnIndex,
      reasoning: selected.reasoning,
    };
  }

  /**
   * Répondre à une question de quiz
   */
  async answerQuiz(correctAnswer: number, optionsCount: number): Promise<number> {
    await this.simulateThinking();

    const correctProbability = {
      easy: 0.4,
      medium: 0.6,
      hard: 0.85,
    }[this.difficulty];

    if (Math.random() < correctProbability) {
      return correctAnswer;
    }

    // Retourner une mauvaise réponse aléatoire
    let wrongAnswer;
    do {
      wrongAnswer = Math.floor(Math.random() * optionsCount);
    } while (wrongAnswer === correctAnswer);

    return wrongAnswer;
  }

  /**
   * Répondre à un duel
   */
  async answerDuel(correctAnswer: number, optionsCount: number): Promise<number> {
    await this.simulateThinking();

    const correctProbability = {
      easy: 0.35,
      medium: 0.55,
      hard: 0.75,
    }[this.difficulty];

    if (Math.random() < correctProbability) {
      return correctAnswer;
    }

    let wrongAnswer;
    do {
      wrongAnswer = Math.floor(Math.random() * optionsCount);
    } while (wrongAnswer === correctAnswer);

    return wrongAnswer;
  }

  /**
   * Simuler un temps de réflexion
   */
  private async simulateThinking(): Promise<void> {
    const delay =
      this.thinkingDelay.min +
      Math.random() * (this.thinkingDelay.max - this.thinkingDelay.min);

    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Obtenir une réplique de l'IA
   */
  getTaunt(situation: 'captured' | 'gotCaptured' | 'winning' | 'losing' | 'rolled6'): string {
    const taunts = {
      captured: [
        'Bien joué... pour cette fois !',
        'Tu vas me le payer !',
        "Ce n'était que de la chance !",
      ],
      gotCaptured: [
        'Oups, je me suis fait avoir !',
        "Tu ne m'auras pas deux fois !",
        "Bon coup, je dois l'admettre.",
      ],
      winning: [
        'Je sens la victoire !',
        'Tu ne peux pas me battre !',
        'Trop facile !',
      ],
      losing: [
        "Ce n'est pas fini !",
        'Je vais me rattraper !',
        'Attend un peu...',
      ],
      rolled6: [
        'Un 6 ! Parfait !',
        'La chance est de mon côté !',
        'Encore un tour pour moi !',
      ],
    };

    const options = taunts[situation];
    return options[Math.floor(Math.random() * options.length)] ?? 'Hmm...';
  }

  /**
   * Créer des joueurs IA
   */
  static createAIPlayers(
    count: number,
    _difficulty: AIDifficulty,
    availableColors: PlayerColor[],
    startId: number = 1
  ): Omit<Player, 'tokens' | 'pawns'>[] {
    const aiNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta'];

    const players: Omit<Player, 'tokens' | 'pawns'>[] = [];

    for (let i = 0; i < count && i < availableColors.length; i++) {
      const color = availableColors[i];
      if (color) {
        players.push({
          id: `ai_${startId + i}`,
          name: aiNames[i] || `Bot ${i + 1}`,
          color,
          isAI: true,
          isReady: true,
        });
      }
    }

    return players;
  }
}
