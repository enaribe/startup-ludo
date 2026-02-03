import { generateAIScore, getRandomDuelQuestions } from '@/data/duelQuestions';
import type { DuelQuestion, DuelResult, DuelState, Player } from '@/types';
import { useCallback, useState } from 'react';

interface UseDuelOptions {
  players: Player[];
  isOnline?: boolean;
  onDuelComplete?: (result: DuelResult) => void;
}

interface UseDuelReturn {
  // État
  duelState: DuelState | null;
  isActive: boolean;
  currentPhase: DuelState['phase'] | null;

  // Joueurs
  challenger: Player | null;
  opponent: Player | null;
  spectators: Player[];

  // Questions
  questions: DuelQuestion[];

  // Résultat
  result: DuelResult | null;

  // Actions
  startDuel: (challengerId: string) => void;
  selectOpponent: (opponentId: string) => void;
  startChallengerTurn: () => void;
  submitChallengerAnswers: (answers: number[], score: number) => void;
  startOpponentTurn: () => void;
  submitOpponentAnswers: (answers: number[], score: number) => void;
  endDuel: () => void;
  resetDuel: () => void;
}

export function useDuel({
  players,
  isOnline = false,
  onDuelComplete,
}: UseDuelOptions): UseDuelReturn {
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [result, setResult] = useState<DuelResult | null>(null);

  // Helpers
  const getPlayerById = useCallback((id: string) => {
    return players.find((p) => p.id === id) || null;
  }, [players]);

  const challenger = duelState ? getPlayerById(duelState.challengerId) : null;
  const opponent = duelState ? getPlayerById(duelState.opponentId) : null;

  const spectators = duelState
    ? players.filter((p) => p.id !== duelState.challengerId && p.id !== duelState.opponentId)
    : [];

  // Démarrer un duel (phase sélection adversaire ou intro si 2 joueurs)
  const startDuel = useCallback((challengerId: string) => {
    const questions = getRandomDuelQuestions(3);
    const otherPlayers = players.filter((p) => p.id !== challengerId);

    // Si seulement 2 joueurs, on passe directement à l'intro
    if (otherPlayers.length === 1 && otherPlayers[0]) {
      setDuelState({
        challengerId,
        opponentId: otherPlayers[0].id,
        questions,
        challengerAnswers: [],
        opponentAnswers: [],
        challengerScore: 0,
        opponentScore: 0,
        phase: 'intro',
        currentQuestionIndex: 0,
      });
    } else {
      // Plusieurs adversaires possibles, phase de sélection
      setDuelState({
        challengerId,
        opponentId: '', // Sera défini après sélection
        questions,
        challengerAnswers: [],
        opponentAnswers: [],
        challengerScore: 0,
        opponentScore: 0,
        phase: 'select_opponent',
        currentQuestionIndex: 0,
      });
    }
    setResult(null);
  }, [players]);

  // Sélectionner un adversaire
  const selectOpponent = useCallback((opponentId: string) => {
    if (!duelState) return;

    setDuelState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        opponentId,
        phase: 'intro',
      };
    });
  }, [duelState]);

  // Commencer le tour du challenger
  const startChallengerTurn = useCallback(() => {
    setDuelState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phase: 'challenger_turn',
      };
    });
  }, []);

  // Soumettre les réponses du challenger
  const submitChallengerAnswers = useCallback((answers: number[], score: number) => {
    if (!duelState) return;

    const opponentPlayer = getPlayerById(duelState.opponentId);

    setDuelState((prev) => {
      if (!prev) return prev;

      // Si l'adversaire est une IA, on génère directement son score
      if (opponentPlayer?.isAI) {
        const aiScore = generateAIScore();

        // Calculer le résultat immédiatement
        const duelResult = calculateResult(
          prev.challengerId,
          prev.opponentId,
          score,
          aiScore
        );

        // Stocker le résultat
        setTimeout(() => {
          setResult(duelResult);
          onDuelComplete?.(duelResult);
        }, 500);

        return {
          ...prev,
          challengerAnswers: answers,
          challengerScore: score,
          opponentScore: aiScore,
          phase: 'result',
        };
      }

      // Mode local: passer au tour de préparation de l'adversaire
      if (!isOnline) {
        return {
          ...prev,
          challengerAnswers: answers,
          challengerScore: score,
          phase: 'opponent_prepare',
        };
      }

      // Mode online: attendre l'adversaire
      return {
        ...prev,
        challengerAnswers: answers,
        challengerScore: score,
        phase: 'waiting',
      };
    });
  }, [duelState, getPlayerById, isOnline, onDuelComplete]);

  // Commencer le tour de l'adversaire (local)
  const startOpponentTurn = useCallback(() => {
    setDuelState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        phase: 'opponent_turn',
        currentQuestionIndex: 0,
      };
    });
  }, []);

  // Soumettre les réponses de l'adversaire
  const submitOpponentAnswers = useCallback((answers: number[], score: number) => {
    if (!duelState) return;

    const duelResult = calculateResult(
      duelState.challengerId,
      duelState.opponentId,
      duelState.challengerScore,
      score
    );

    setDuelState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        opponentAnswers: answers,
        opponentScore: score,
        phase: 'result',
      };
    });

    setResult(duelResult);
    onDuelComplete?.(duelResult);
  }, [duelState, onDuelComplete]);

  // Terminer le duel
  const endDuel = useCallback(() => {
    setDuelState(null);
  }, []);

  // Réinitialiser le duel
  const resetDuel = useCallback(() => {
    setDuelState(null);
    setResult(null);
  }, []);

  return {
    duelState,
    isActive: duelState !== null,
    currentPhase: duelState?.phase || null,

    challenger,
    opponent,
    spectators,

    questions: duelState?.questions || [],

    result,

    startDuel,
    selectOpponent,
    startChallengerTurn,
    submitChallengerAnswers,
    startOpponentTurn,
    submitOpponentAnswers,
    endDuel,
    resetDuel,
  };
}

// Helper pour calculer le résultat
function calculateResult(
  challengerId: string,
  opponentId: string,
  challengerScore: number,
  opponentScore: number
): DuelResult {
  let winnerId: string | null = null;
  let challengerReward = 0;
  let opponentReward = 0;

  if (challengerScore > opponentScore) {
    winnerId = challengerId;
    challengerReward = 3;
    opponentReward = 0;
  } else if (opponentScore > challengerScore) {
    winnerId = opponentId;
    challengerReward = 0;
    opponentReward = 3;
  } else {
    // Égalité
    winnerId = null;
    challengerReward = 1;
    opponentReward = 1;
  }

  return {
    winnerId,
    challengerId,
    opponentId,
    challengerScore,
    opponentScore,
    challengerReward,
    opponentReward,
  };
}
