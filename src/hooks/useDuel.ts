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
  /** My player ID (needed for online to know which role I play) */
  myPlayerId?: string | null;
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

  // My role in online duel
  myRole: 'challenger' | 'opponent' | 'spectator' | null;
  /** True when I submitted my answers but waiting for the other player */
  isWaitingForOpponent: boolean;

  // Actions
  startDuel: (challengerId: string) => void;
  /** Start duel with predefined questions (2 players or after selection) */
  startDuelWithQuestions: (challengerId: string, opponentId: string, questions: DuelQuestion[]) => void;
  /** Join online duel — opponent receives same questions, goes directly to 'answering' after intro */
  joinDuel: (challengerId: string, opponentId: string, questions: DuelQuestion[]) => void;
  selectOpponent: (opponentId: string) => void;
  /** Start answering questions (both challenger and opponent in online mode) */
  startAnswering: () => void;
  /** Legacy: start challenger turn (local mode) */
  startChallengerTurn: () => void;
  /** Submit my answers (works for both roles in online mode) */
  submitMyAnswers: (answers: number[], score: number) => void;
  /** Legacy: submit challenger answers (local mode) */
  submitChallengerAnswers: (answers: number[], score: number) => void;
  /** Start opponent's turn (local mode only) */
  startOpponentTurn: () => void;
  /** Submit opponent answers (local mode only) */
  submitOpponentAnswers: (answers: number[], score: number) => void;
  /** Receive remote player's score; calculates result when both present */
  receiveRemoteScore: (playerId: string, score: number) => void;
  endDuel: () => void;
  resetDuel: () => void;
}

// Safety timeout: auto-resolve duel if opponent doesn't respond in 60s
const DUEL_SAFETY_TIMEOUT_MS = 60000;

export function useDuel({
  players,
  isOnline = false,
  myPlayerId = null,
  onDuelComplete,
}: UseDuelOptions): UseDuelReturn {
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [result, setResult] = useState<DuelResult | null>(null);
  const hasReceivedRemoteScoreRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Track my local score before remote arrives */
  const myLocalScoreRef = useRef<number | null>(null);

  // Helpers
  const getPlayerById = useCallback((id: string) => {
    return players.find((p) => p.id === id) || null;
  }, [players]);

  const challenger = duelState ? getPlayerById(duelState.challengerId) : null;
  const opponent = duelState ? getPlayerById(duelState.opponentId) : null;

  const spectators = duelState
    ? players.filter((p) => p.id !== duelState.challengerId && p.id !== duelState.opponentId)
    : [];

  // Determine my role in the duel
  const myRole = duelState
    ? myPlayerId === duelState.challengerId
      ? 'challenger' as const
      : myPlayerId === duelState.opponentId
        ? 'opponent' as const
        : 'spectator' as const
    : null;

  const isWaitingForOpponent = duelState?.phase === 'waiting' && result === null;

  // Log state changes (debug)
  useEffect(() => {
    if (duelState) {
      logDuel('state', {
        phase: duelState.phase,
        questionsLength: duelState.questions?.length ?? 0,
        challengerId: duelState.challengerId,
        opponentId: duelState.opponentId,
        myRole,
      });
    } else {
      logDuel('state', null);
    }
  }, [duelState, myRole]);

  // Clear safety timer on unmount or duel end
  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, []);

  // Start safety timeout when entering 'waiting' phase
  useEffect(() => {
    if (!isOnline || duelState?.phase !== 'waiting') {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      return;
    }

    logDuel('Starting safety timeout for waiting phase');
    safetyTimerRef.current = setTimeout(() => {
      logDuel('Safety timeout expired — auto-resolving duel');
      setDuelState((prev) => {
        if (!prev || prev.phase !== 'waiting') return prev;
        // Give the waiting player a default win (opponent didn't respond)
        const myScore = myRole === 'challenger' ? prev.challengerScore : prev.opponentScore;
        const duelResult = calculateResult(
          prev.challengerId,
          prev.opponentId,
          myRole === 'challenger' ? myScore : 0,
          myRole === 'opponent' ? myScore : 0
        );
        setTimeout(() => {
          setResult(duelResult);
          onDuelComplete?.(duelResult);
        }, 0);
        return { ...prev, phase: 'result' as const };
      });
    }, DUEL_SAFETY_TIMEOUT_MS);

    return () => {
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [duelState?.phase, isOnline, myRole, onDuelComplete]);

  // ===== ACTIONS =====

  // Start duel (select opponent phase if 3+ players, or intro if 2)
  const startDuel = useCallback((challengerId: string) => {
    const questions = getRandomDuelQuestions(3);
    const otherPlayers = players.filter((p) => p.id !== challengerId);
    logDuel('startDuel', { challengerId, questionsLength: questions.length, otherPlayersCount: otherPlayers.length });

    hasReceivedRemoteScoreRef.current = false;
    myLocalScoreRef.current = null;

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
      setDuelState({
        challengerId,
        opponentId: '',
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

  // Start duel with predefined questions (online 2 players or after opponent selection)
  const startDuelWithQuestions = useCallback((challengerId: string, opponentId: string, questions: DuelQuestion[]) => {
    logDuel('startDuelWithQuestions', { challengerId, opponentId, questionsLength: questions.length });
    hasReceivedRemoteScoreRef.current = false;
    myLocalScoreRef.current = null;
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

  // Join duel online (opponent side) — same questions, goes to intro then answering
  const joinDuel = useCallback((challengerId: string, opponentId: string, questions: DuelQuestion[]) => {
    logDuel('joinDuel', { challengerId, opponentId, questionsLength: questions.length });
    hasReceivedRemoteScoreRef.current = false;
    myLocalScoreRef.current = null;
    setDuelState({
      challengerId,
      opponentId,
      questions,
      challengerAnswers: [],
      opponentAnswers: [],
      challengerScore: 0,
      opponentScore: 0,
      // In online mode, opponent also goes to 'intro' first (both see the VS screen)
      phase: 'intro',
      currentQuestionIndex: 0,
    });
    setResult(null);
  }, []);

  // Select opponent (3+ players)
  const selectOpponent = useCallback((opponentId: string) => {
    if (!duelState) return;
    setDuelState((prev) => {
      if (!prev) return prev;
      return { ...prev, opponentId, phase: 'intro' };
    });
  }, [duelState]);

  // Start answering — universal function for online mode (both players call this)
  const startAnswering = useCallback(() => {
    logDuel('startAnswering called', { isOnline });
    setDuelState((prev) => {
      if (!prev) {
        logDuel('startAnswering: no prev state');
        return prev;
      }
      const questions = prev.questions?.length ? prev.questions : getRandomDuelQuestions(3);
      logDuel('startAnswering: setting phase answering', { questionsLength: questions.length });
      return {
        ...prev,
        questions,
        phase: isOnline ? 'answering' as const : 'challenger_turn' as const,
        currentQuestionIndex: 0,
      };
    });
  }, [isOnline]);

  // Legacy: start challenger turn (works for local mode + backward compat)
  const startChallengerTurn = useCallback(() => {
    logDuel('startChallengerTurn called');
    setDuelState((prev) => {
      if (!prev) return prev;
      const questions = prev.questions?.length ? prev.questions : getRandomDuelQuestions(3);
      return {
        ...prev,
        questions,
        phase: isOnline ? 'answering' as const : 'challenger_turn' as const,
      };
    });
  }, [isOnline]);

  // Submit my answers (online mode — works for both challenger and opponent)
  const submitMyAnswers = useCallback((answers: number[], score: number) => {
    if (!duelState) return;
    logDuel('submitMyAnswers', { myRole, score, isOnline });

    myLocalScoreRef.current = score;

    setDuelState((prev) => {
      if (!prev) return prev;

      // Update my score in the state
      const updatedState = { ...prev };
      if (myRole === 'challenger') {
        updatedState.challengerAnswers = answers;
        updatedState.challengerScore = score;
      } else {
        updatedState.opponentAnswers = answers;
        updatedState.opponentScore = score;
      }

      // Check if remote score already arrived
      if (hasReceivedRemoteScoreRef.current) {
        const challengerScore = myRole === 'challenger' ? score : prev.challengerScore;
        const opponentScore = myRole === 'opponent' ? score : prev.opponentScore;
        const duelResult = calculateResult(prev.challengerId, prev.opponentId, challengerScore, opponentScore);
        setTimeout(() => {
          setResult(duelResult);
          onDuelComplete?.(duelResult);
        }, 0);
        return { ...updatedState, phase: 'result' as const };
      }

      // Go to waiting
      return { ...updatedState, phase: 'waiting' as const };
    });
  }, [duelState, myRole, isOnline, onDuelComplete]);

  // Legacy: submit challenger answers (local + AI mode)
  const submitChallengerAnswers = useCallback((answers: number[], score: number) => {
    if (!duelState) return;

    const opponentPlayer = getPlayerById(duelState.opponentId);

    setDuelState((prev) => {
      if (!prev) return prev;

      // AI opponent — calculate immediately
      if (opponentPlayer?.isAI) {
        const aiScore = generateAIScore();
        const duelResult = calculateResult(prev.challengerId, prev.opponentId, score, aiScore);
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

      // Local mode: go to opponent prepare
      if (!isOnline) {
        return {
          ...prev,
          challengerAnswers: answers,
          challengerScore: score,
          phase: 'opponent_prepare' as const,
        };
      }

      // Online mode: use submitMyAnswers logic
      myLocalScoreRef.current = score;
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

  // Start opponent turn (local mode only)
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

  // Submit opponent answers (local mode only)
  const submitOpponentAnswers = useCallback((answers: number[], score: number) => {
    if (!duelState) return;

    if (isOnline) {
      // In online mode, opponent should use submitMyAnswers instead
      myLocalScoreRef.current = score;
      setDuelState((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          opponentAnswers: answers,
          opponentScore: score,
          phase: 'waiting' as const,
        };
        if (hasReceivedRemoteScoreRef.current) {
          const duelResult = calculateResult(prev.challengerId, prev.opponentId, prev.challengerScore, score);
          setTimeout(() => {
            setResult(duelResult);
            onDuelComplete?.(duelResult);
          }, 0);
          return { ...next, phase: 'result' as const };
        }
        return next;
      });
      return;
    }

    // Local mode: calculate result immediately
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

  // Receive remote score
  const receiveRemoteScore = useCallback((playerId: string, score: number) => {
    logDuel('receiveRemoteScore', { playerId, score });
    hasReceivedRemoteScoreRef.current = true;

    // Clear safety timer
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }

    setDuelState((prev) => {
      if (!prev) return prev;
      const challengerScore = playerId === prev.challengerId ? score : prev.challengerScore;
      const opponentScore = playerId === prev.opponentId ? score : prev.opponentScore;
      const next = { ...prev, challengerScore, opponentScore };

      const isRemoteScore = playerId === prev.challengerId || playerId === prev.opponentId;
      // We're done if we're already waiting (submitted our own answers)
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

  // End / reset
  const endDuel = useCallback(() => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    setDuelState(null);
  }, []);

  const resetDuel = useCallback(() => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    hasReceivedRemoteScoreRef.current = false;
    myLocalScoreRef.current = null;
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

    myRole,
    isWaitingForOpponent,

    startDuel,
    startDuelWithQuestions,
    joinDuel,
    selectOpponent,
    startAnswering,
    startChallengerTurn,
    submitMyAnswers,
    submitChallengerAnswers,
    startOpponentTurn,
    submitOpponentAnswers,
    receiveRemoteScore,
    endDuel,
    resetDuel,
  };
}

// Helper to calculate result
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
