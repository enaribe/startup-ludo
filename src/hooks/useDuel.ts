import { useState, useCallback, useEffect, useRef } from 'react';
import type { Player, DuelQuestion, DuelState, DuelResult } from '@/types';
import { getRandomDuelQuestions, generateAIScore } from '@/data/duelQuestions';

const DEBUG_DUEL = __DEV__;
function logDuel(...args: unknown[]) {
  if (DEBUG_DUEL) console.log('[useDuel]', ...args);
}

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
  /** Démarrer un duel avec adversaire et questions déjà définis (2 joueurs ou après sélection) */
  startDuelWithQuestions: (challengerId: string, opponentId: string, questions: DuelQuestion[]) => void;
  /** Rejoindre un duel en ligne avec les mêmes questions que le challenger */
  joinDuel: (challengerId: string, opponentId: string, questions: DuelQuestion[]) => void;
  selectOpponent: (opponentId: string) => void;
  startChallengerTurn: () => void;
  submitChallengerAnswers: (answers: number[], score: number) => void;
  startOpponentTurn: () => void;
  submitOpponentAnswers: (answers: number[], score: number) => void;
  /** Reçoit le score d'un joueur distant ; calcule le résultat si les deux scores sont présents */
  receiveRemoteScore: (playerId: string, score: number) => void;
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
  const hasReceivedRemoteScoreRef = useRef(false);

  // Helpers
  const getPlayerById = useCallback((id: string) => {
    return players.find((p) => p.id === id) || null;
  }, [players]);

  const challenger = duelState ? getPlayerById(duelState.challengerId) : null;
  const opponent = duelState ? getPlayerById(duelState.opponentId) : null;

  const spectators = duelState
    ? players.filter((p) => p.id !== duelState.challengerId && p.id !== duelState.opponentId)
    : [];

  // Log état duel à chaque changement (debug)
  useEffect(() => {
    if (duelState) {
      logDuel('state', {
        phase: duelState.phase,
        questionsLength: duelState.questions?.length ?? 0,
        challengerId: duelState.challengerId,
        opponentId: duelState.opponentId,
      });
    } else {
      logDuel('state', null);
    }
  }, [duelState]);

  // Démarrer un duel (phase sélection adversaire ou intro si 2 joueurs)
  const startDuel = useCallback((challengerId: string) => {
    const questions = getRandomDuelQuestions(3);
    const otherPlayers = players.filter((p) => p.id !== challengerId);
    logDuel('startDuel', { challengerId, questionsLength: questions.length, otherPlayersCount: otherPlayers.length });

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

  // Démarrer un duel avec adversaire et questions déjà définis (online 2 joueurs ou après sélection)
  const startDuelWithQuestions = useCallback((challengerId: string, opponentId: string, questions: DuelQuestion[]) => {
    logDuel('startDuelWithQuestions', { challengerId, opponentId, questionsLength: questions.length });
    setDuelState({
      challengerId,
      opponentId,
      questions,
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      phase: 'intro',
      currentQuestionIndex: 0,
    });
    setResult(null);
  }, []);

  // Rejoindre un duel en ligne (adversaire reçoit les mêmes questions)
  const joinDuel = useCallback((challengerId: string, opponentId: string, questions: DuelQuestion[]) => {
    logDuel('joinDuel', { challengerId, opponentId, questionsLength: questions.length });
    setDuelState({
      challengerId,
      opponentId,
      questions,
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      phase: 'opponent_prepare',
      currentQuestionIndex: 0,
    });
    setResult(null);
  }, []);

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
    logDuel('startChallengerTurn called');
    setDuelState((prev) => {
      if (!prev) {
        logDuel('startChallengerTurn: no prev state');
        return prev;
      }
      // Garantir que les questions sont présentes (évite popup vide si perdues)
      const questions = prev.questions?.length ? prev.questions : getRandomDuelQuestions(3);
      logDuel('startChallengerTurn: setting phase challenger_turn', { questionsLength: questions.length, hadQuestions: !!prev.questions?.length });
      return {
        ...prev,
        questions,
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
          phase: 'result' as const,
        };
      }

      // Mode local: passer au tour de préparation de l'adversaire
      if (!isOnline) {
        return {
          ...prev,
          challengerAnswers: answers,
          challengerScore: score,
          phase: 'opponent_prepare' as const,
        };
      }

      // Mode online: attendre le score de l'adversaire
      const next: DuelState = {
        ...prev,
        challengerAnswers: answers,
        challengerScore: score,
        phase: 'waiting' as const,
      };
      if (hasReceivedRemoteScoreRef.current) {
        const duelResult = calculateResult(prev.challengerId, prev.opponentId, score, prev.opponentScore);
        setTimeout(() => {
          setResult(duelResult);
          onDuelComplete?.(duelResult);
        }, 0);
        return { ...next, phase: 'result' as const };
      }
      return next;
    });
  }, [duelState, getPlayerById, isOnline, onDuelComplete]);

  // Commencer le tour de l'adversaire (local)
  const startOpponentTurn = useCallback(() => {
    setDuelState((prev) => {
      if (!prev) return prev;
      const questions = prev.questions?.length ? prev.questions : getRandomDuelQuestions(3);
      return {
        ...prev,
        questions,
        phase: 'opponent_turn',
        currentQuestionIndex: 0,
      };
    });
  }, []);

  // Soumettre les réponses de l'adversaire
  const submitOpponentAnswers = useCallback((answers: number[], score: number) => {
    if (!duelState) return;

    // Mode online : attendre le score du challenger, ne pas calculer tout de suite
    if (isOnline) {
      setDuelState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          opponentAnswers: answers,
          opponentScore: score,
          phase: 'waiting',
        };
      });
      return;
    }

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
  }, [duelState, isOnline, onDuelComplete]);

  // Reçoit le score d'un joueur distant ; calcule le résultat quand les deux scores sont présents
  const receiveRemoteScore = useCallback((playerId: string, score: number) => {
    hasReceivedRemoteScoreRef.current = true;
    setDuelState((prev) => {
      if (!prev) return prev;
      const challengerScore = playerId === prev.challengerId ? score : prev.challengerScore;
      const opponentScore = playerId === prev.opponentId ? score : prev.opponentScore;
      const next = {
        ...prev,
        challengerScore,
        opponentScore,
      };
      const isRemoteScore = playerId === prev.challengerId || playerId === prev.opponentId;
      const weAlreadySubmitted = prev.phase === 'waiting';
      if (!isRemoteScore || !weAlreadySubmitted) return next;

      const duelResult = calculateResult(prev.challengerId, prev.opponentId, challengerScore, opponentScore);
      setTimeout(() => {
        setResult(duelResult);
        onDuelComplete?.(duelResult);
      }, 0);
      return { ...next, phase: 'result' as const };
    });
  }, [onDuelComplete]);

  // Terminer le duel
  const endDuel = useCallback(() => {
    setDuelState(null);
  }, []);

  // Réinitialiser le duel
  const resetDuel = useCallback(() => {
    hasReceivedRemoteScoreRef.current = false;
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
    startDuelWithQuestions,
    joinDuel,
    selectOpponent,
    startChallengerTurn,
    submitChallengerAnswers,
    startOpponentTurn,
    submitOpponentAnswers,
    receiveRemoteScore,
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
