import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import {
  EventPopup,
  FundingPopup,
  QuizPopup,
  QuitConfirmPopup,
  DuelSelectOpponentPopup,
  DuelPreparePopup,
  DuelSpectatorPopup,
  DuelQuestionPopup,
  DuelResultPopup,
} from '@/components/game/popups';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RadialBackground } from '@/components/ui';
import { eventManager } from '@/services/game/EventManager';
import { useGameStore, useSettingsStore, useAuthStore } from '@/stores';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { useTurnMachine, type TurnActions } from '@/hooks/useTurnMachine';
import { useDuel } from '@/hooks/useDuel';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { getRandomDuelQuestions } from '@/data/duelQuestions';
import type { ChallengeEvent, FundingEvent, OpportunityEvent, Player, QuizEvent, DuelResult, DuelQuestion } from '@/types';

// Données de test pour afficher les popups rapidement
const MOCK_QUIZ: QuizEvent = {
  id: 'test-quiz',
  category: 'business',
  question: "Quel document décrit la stratégie et le modèle économique d'une entreprise ?",
  options: ['Business Plan', 'Statut juridique', 'Contrat de travail'],
  correctAnswer: 0,
  difficulty: 'moyen',
  reward: 2,
  timeLimit: 30,
};

const MOCK_FUNDING: FundingEvent = {
  id: 'test-funding',
  name: 'Subvention BPI',
  description: "Quel document décrit la stratégie et le modèle économique d'une entreprise ?",
  type: 'subvention',
  amount: 2,
  rarity: 'common',
};

const MOCK_OPPORTUNITY: OpportunityEvent = {
  id: 'test-opp',
  title: 'Partenaire stratégique',
  description: "Quel document décrit la stratégie et le modèle économique d'une entreprise ?",
  effect: 'tokens',
  value: 2,
  rarity: 'common',
};

const MOCK_CHALLENGE: ChallengeEvent = {
  id: 'test-challenge',
  title: 'Imprévu fiscal',
  description: "Quel document décrit la stratégie et le modèle économique d'une entreprise ?",
  effect: 'loseTokens',
  value: 2,
  rarity: 'common',
};

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const params = useLocalSearchParams<{ mode?: string; roomId?: string }>();
  const isOnline = params.mode === 'online';
  const userId = useAuthStore((s) => s.user?.id) ?? null;

  // Online game hook (only active in online mode)
  const onlineGame = useOnlineGame(isOnline ? userId : null);

  // Game store — actions
  const storeRollDice = useGameStore((s) => s.rollDice);
  const storeExecuteMove = useGameStore((s) => s.executeMove);
  const storeExitHome = useGameStore((s) => s.exitHome);
  const storeHandleCapture = useGameStore((s) => s.handleCapture);
  const storeCheckWinCondition = useGameStore((s) => s.checkWinCondition);
  const storeGetValidMoves = useGameStore((s) => s.getValidMoves);
  const triggerEvent = useGameStore((s) => s.triggerEvent);
  const storeResolveEvent = useGameStore((s) => s.resolveEvent);
  const addTokens = useGameStore((s) => s.addTokens);
  const removeTokens = useGameStore((s) => s.removeTokens);
  const storeNextTurn = useGameStore((s) => s.nextTurn);
  const storeGrantExtraTurn = useGameStore((s) => s.grantExtraTurn);
  const storeEndGame = useGameStore((s) => s.endGame);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const setAnimating = useGameStore((s) => s.setAnimating);
  const getCurrentPlayer = useGameStore((s) => s.getCurrentPlayer);

  // Game store — reactive state (re-renders when these change)
  const game = useGameStore((s) => s.game);
  const selectedPawnIndex = useGameStore((s) => s.selectedPawnIndex);
  const highlightedPositions = useGameStore((s) => s.highlightedPositions);

  // Reactive current player — this MUST re-render when currentPlayerIndex changes
  const currentPlayer = useGameStore(
    (s) => s.game ? s.game.players[s.game.currentPlayerIndex] ?? null : null
  );

  // Local state
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Event popups state
  const [quizData, setQuizData] = useState<QuizEvent | null>(null);
  const [fundingData, setFundingData] = useState<FundingEvent | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityEvent | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeEvent | null>(null);
  const [duelTriggered, setDuelTriggered] = useState(false);
  const [isEventSpectator, setIsEventSpectator] = useState(false);
  const [spectatorDuelChallengerId, setSpectatorDuelChallengerId] = useState<string | null>(null);
  const [spectatorDuelOpponentId, setSpectatorDuelOpponentId] = useState<string | null>(null);

  // Duel system hook
  const duel = useDuel({
    players: game?.players || [],
    isOnline,
    myPlayerId: userId,
    onDuelComplete: useCallback((result: DuelResult) => {
      // Appliquer les récompenses aux joueurs
      if (result.challengerReward > 0) {
        addTokens(result.challengerId, result.challengerReward);
      }
      if (result.opponentReward > 0) {
        addTokens(result.opponentId, result.opponentReward);
      }
      // Broadcaster le résultat aux spectateurs en mode online
      if (isOnline) {
        onlineGame.broadcastDuelResult({
          challengerId: result.challengerId,
          opponentId: result.opponentId,
          challengerScore: result.challengerScore,
          opponentScore: result.opponentScore,
          winnerId: result.winnerId,
        });
      }
    }, [addTokens, isOnline, onlineGame]),
  });

  // Ref to access duel functions in effects without causing re-triggers
  const duelRef = useRef(duel);
  duelRef.current = duel;

  // Remote dice animation tracking
  const [remoteRollingPlayerId, setRemoteRollingPlayerId] = useState<string | null>(null);
  const [remoteDiceValue, setRemoteDiceValue] = useState<number | null>(null);

  // Online disconnection/forfeit state
  const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== UNIFIED ACTIONS (resolve online/local split once) =====

  const actions: TurnActions = useMemo(() => {
    if (isOnline) {
      return {
        rollDice: onlineGame.rollDice,
        executeMove: onlineGame.movePawn,
        exitHome: onlineGame.exitHome,
        nextTurn: () => onlineGame.endTurn(false),
        grantExtraTurn: () => onlineGame.endTurn(true),
        handleCapture: onlineGame.broadcastCapture,
        endGame: onlineGame.broadcastWin,
        resolveEvent: onlineGame.resolveEvent,
        broadcastEvent: onlineGame.broadcastEvent,
        getValidMoves: storeGetValidMoves,
        checkWinCondition: storeCheckWinCondition,
      };
    }
    return {
      rollDice: storeRollDice,
      executeMove: storeExecuteMove,
      exitHome: storeExitHome,
      nextTurn: storeNextTurn,
      grantExtraTurn: storeGrantExtraTurn,
      handleCapture: storeHandleCapture,
      endGame: storeEndGame,
      resolveEvent: (r: { ok: boolean; reward: number }) => {
        const cp = getCurrentPlayer();
        if (cp) {
          if (r.ok && r.reward > 0) {
            addTokens(cp.id, r.reward);
          } else if (!r.ok && r.reward > 0) {
            removeTokens(cp.id, r.reward);
          }
        }
        storeResolveEvent();
      },
      broadcastEvent: () => {},
      getValidMoves: storeGetValidMoves,
      checkWinCondition: storeCheckWinCondition,
    };
  }, [
    isOnline,
    onlineGame,
    storeRollDice,
    storeExecuteMove,
    storeExitHome,
    storeNextTurn,
    storeGrantExtraTurn,
    storeHandleCapture,
    storeEndGame,
    storeResolveEvent,
    storeGetValidMoves,
    storeCheckWinCondition,
    getCurrentPlayer,
    addTokens,
    removeTokens,
  ]);

  // Ref for handleEventResolve — allows handleTriggeredEvent to call it without circular dependency
  const handleEventResolveRef = useRef<() => void>(() => {});

  // ===== EVENT HANDLER (called by turn machine when phase enters 'event') =====

  const handleTriggeredEvent = useCallback(
    (eventType: string) => {
      // Utilise EventManager pour générer des événements depuis les données de l'édition
      if (game?.edition) {
        eventManager.setEdition(game.edition);
      }
      const event = eventManager.generateEvent(eventType as any);
      if (!event) {
        // No event generated — skip directly
        return;
      }

      // Cast pour compatibilité avec le type GameEvent du store
      const gameEvent = event as unknown as import('@/types').GameEvent;

      // ===== AI: show popup in spectator mode, then auto-resolve after delay =====
      // So the human sees what event the AI landed on before points are applied.
      if (currentPlayer?.isAI) {
        triggerEvent(gameEvent);
        setIsEventSpectator(true);

        const resolveAndClose = () => {
          switch (event.type) {
            case 'quiz': {
              const aiCorrect = Math.random() < 0.6;
              const quizEv = event.data as QuizEvent;
              const reward = quizEv.reward;
              actions.resolveEvent({ ok: aiCorrect, reward });
              break;
            }
            case 'duel': {
              const aiDuelScore = Math.floor(Math.random() * 4) + 1;
              actions.resolveEvent({ ok: true, reward: aiDuelScore });
              break;
            }
            case 'funding': {
              const fundingEv = event.data as FundingEvent;
              actions.resolveEvent({ ok: true, reward: fundingEv.amount });
              break;
            }
            case 'opportunity': {
              const oppEv = event.data as OpportunityEvent;
              actions.resolveEvent({ ok: oppEv.effect === 'tokens', reward: oppEv.value });
              break;
            }
            case 'challenge': {
              const chalEv = event.data as ChallengeEvent;
              actions.resolveEvent({ ok: false, reward: chalEv.value });
              break;
            }
            default:
              actions.resolveEvent({ ok: false, reward: 0 });
          }
          setQuizData(null);
          setFundingData(null);
          setOpportunityData(null);
          setChallengeData(null);
          setDuelTriggered(false);
          setIsEventSpectator(false);
          handleEventResolveRef.current();
        };

        // Show the same popups as for human, then auto-resolve after delay
        switch (event.type) {
          case 'quiz':
            setQuizData(event.data as QuizEvent);
            setTimeout(resolveAndClose, 2800);
            break;
          case 'funding':
            setFundingData(event.data as FundingEvent);
            setTimeout(resolveAndClose, 2500);
            break;
          case 'opportunity':
            setOpportunityData(event.data as OpportunityEvent);
            setTimeout(resolveAndClose, 2500);
            break;
          case 'challenge':
            setChallengeData(event.data as ChallengeEvent);
            setTimeout(resolveAndClose, 2500);
            break;
          case 'duel': {
            setDuelTriggered(true);
            const otherPlayers = game?.players?.filter((p) => p.id !== currentPlayer?.id) ?? [];
            if (otherPlayers.length >= 1) {
              const opponentId = otherPlayers[0]!.id;
              const questions = getRandomDuelQuestions(3, game?.edition);
              duel.startDuelWithQuestions(currentPlayer!.id, opponentId, questions);
              // Duel: show spectator popup then auto-resolve after a delay (no real Q&A for AI vs AI)
              setTimeout(resolveAndClose, 2000);
            } else {
              resolveAndClose();
            }
            break;
          }
          default:
            resolveAndClose();
        }
        return;
      }

      // ===== HUMAN PLAYER: show popups as usual =====
      triggerEvent(gameEvent);
      setIsEventSpectator(false);

      // Broadcast event to other players in online mode
      if (isOnline) {
        onlineGame.broadcastEvent(event.type, event.data as unknown as Record<string, unknown>);
      }

      switch (event.type) {
        case 'quiz':
          setQuizData(event.data as QuizEvent);
          break;
        case 'funding':
          setFundingData(event.data as FundingEvent);
          break;
        case 'opportunity':
          setOpportunityData(event.data as OpportunityEvent);
          break;
        case 'challenge':
          setChallengeData(event.data as ChallengeEvent);
          break;
        case 'duel': {
          setDuelTriggered(true);
          if (!currentPlayer) break;
          const otherPlayers = game?.players?.filter((p) => p.id !== currentPlayer.id) ?? [];
          if (otherPlayers.length === 1) {
            const opponentId = otherPlayers[0]!.id;
            const questions = getRandomDuelQuestions(3, game?.edition);
            duel.startDuelWithQuestions(currentPlayer.id, opponentId, questions);
            if (isOnline) {
              onlineGame.broadcastDuelStart(currentPlayer.id, opponentId, questions as unknown as Record<string, unknown>[]);
            }
          } else {
            duel.startDuel(currentPlayer.id);
          }
          break;
        }
      }
    },
    [game, currentPlayer, triggerEvent, isOnline, onlineGame, duel, actions]
  );

  // ===== WIN HANDLER =====

  const handleWin = useCallback(
    (playerId: string) => {
      if (isOnline) {
        onlineGame.broadcastWin(playerId);
      } else {
        storeEndGame(playerId);
      }
      router.push(`/(game)/results/${game?.id}`);
    },
    [isOnline, onlineGame, storeEndGame, router, game?.id]
  );

  // ===== TURN MACHINE =====

  const { turnState, diceProps, handleEventResolve } = useTurnMachine({
    game,
    currentPlayer,
    isOnline,
    userId,
    actions,
    onEvent: handleTriggeredEvent,
    onWin: handleWin,
    hapticsEnabled,
    setAnimating,
    clearSelection,
  });

  // Keep ref in sync so handleTriggeredEvent (AI path) can call it without circular dependency
  handleEventResolveRef.current = handleEventResolve;

  // ===== ONLINE: React to remote dice rolls =====

  useEffect(() => {
    if (!isOnline || !onlineGame.remoteDiceRoll) return;

    const { playerId, value } = onlineGame.remoteDiceRoll;
    setRemoteRollingPlayerId(playerId);
    setRemoteDiceValue(value);

    const timer = setTimeout(() => {
      setRemoteRollingPlayerId(null);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOnline, onlineGame.remoteDiceRoll]);

  // ===== ONLINE: React to remote event triggers =====
  // IMPORTANT: duel is NOT in the dependency array — we use duelRef to avoid infinite loops.
  // The effect only re-runs when remoteEvent changes (new event from RTDB).

  useEffect(() => {
    if (!isOnline || !onlineGame.remoteEvent) return;

    const { eventType, eventData } = onlineGame.remoteEvent;
    console.log('[PlayScreen] Affichage popup événement distant (spectateur):', {
      eventType,
      hasEventData: !!eventData && Object.keys(eventData).length > 0,
      eventData,
    });

    // Ne montrer le popup "Duel en cours" que pour un vrai duel ; pour quiz/funding/opportunity/challenge, s'assurer que duelTriggered est false
    if (eventType === 'duel') {
      // Extraire les données du duel
      const duelData = eventData as { challengerId?: string; opponentId?: string; questions?: DuelQuestion[] };
      const { challengerId, opponentId, questions } = duelData;

      console.log('[PlayScreen] Duel distant reçu:', { challengerId, opponentId, questionsCount: questions?.length, myId: userId });

      if (challengerId && opponentId && questions && questions.length > 0) {
        if (userId === challengerId) {
          // Je suis le challenger — j'ai déjà configuré le duel localement, ignorer
          console.log('[PlayScreen] Je suis le challenger (ignoré, duel déjà en cours)');
        } else if (userId === opponentId) {
          // Je suis l'adversaire — rejoindre le duel (seulement si pas déjà actif)
          if (!duelRef.current.isActive) {
            console.log('[PlayScreen] Je suis l\'adversaire, je rejoins le duel');
            setIsEventSpectator(false);
            setDuelTriggered(true);
            duelRef.current.joinDuel(challengerId, opponentId, questions);
          } else {
            console.log('[PlayScreen] Je suis l\'adversaire mais duel déjà actif, ignoré');
          }
        } else {
          // Je suis spectateur (3-4 joueurs)
          console.log('[PlayScreen] Je suis spectateur du duel');
          setIsEventSpectator(true);
          setDuelTriggered(true);
          setSpectatorDuelChallengerId(challengerId);
          setSpectatorDuelOpponentId(opponentId);
        }
      } else {
        // Données incomplètes, mode spectateur par défaut
        setIsEventSpectator(true);
        setDuelTriggered(true);
      }
      // Clear remoteEvent immediately for duels to prevent re-processing
      onlineGame.clearRemoteEvent();
    } else {
      setDuelTriggered(false);
      setIsEventSpectator(true);

      switch (eventType) {
        case 'quiz':
          setQuizData(eventData as unknown as QuizEvent);
          break;
        case 'funding':
          setFundingData(eventData as unknown as FundingEvent);
          break;
        case 'opportunity':
          setOpportunityData(eventData as unknown as OpportunityEvent);
          break;
        case 'challenge':
          setChallengeData(eventData as unknown as ChallengeEvent);
          break;
        default:
          console.warn('[PlayScreen] Type d\'événement distant inconnu:', eventType);
      }
    }
  }, [isOnline, onlineGame.remoteEvent, userId, onlineGame]);

  // ===== ONLINE: React to remote event result (close popup) =====
  // Note: ONLY close non-duel popups here. Duels have their own lifecycle.

  useEffect(() => {
    if (!isOnline || !onlineGame.remoteEventResult) return;

    // Don't interfere with an active duel (duel has its own score/result flow)
    if (duelRef.current.isActive) {
      onlineGame.clearRemoteEventResult();
      return;
    }

    const timer = setTimeout(() => {
      setQuizData(null);
      setFundingData(null);
      setOpportunityData(null);
      setChallengeData(null);
      setIsEventSpectator(false);
      onlineGame.clearRemoteEvent();
      onlineGame.clearRemoteEventResult();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isOnline, onlineGame.remoteEventResult, onlineGame]);

  // Clear remote dice value on turn change
  useEffect(() => {
    setRemoteDiceValue(null);
    setRemoteRollingPlayerId(null);
  }, [game?.currentPlayerIndex]);

  // ===== ONLINE: Réception du score duel de l'adversaire =====
  useEffect(() => {
    if (!isOnline || !onlineGame.remoteDuelScore) return;
    const { playerId, score } = onlineGame.remoteDuelScore;
    duelRef.current.receiveRemoteScore(playerId, score);
    onlineGame.clearRemoteDuelScore();
  }, [isOnline, onlineGame.remoteDuelScore, onlineGame]);

  // ===== ONLINE: Réception du résultat du duel (pour spectateurs) =====
  useEffect(() => {
    if (!isOnline || !onlineGame.remoteDuelResult) return;

    const result = onlineGame.remoteDuelResult;
    console.log('[PlayScreen] Résultat duel reçu (spectateur):', result);

    // Si je suis spectateur, fermer le popup spectateur après un délai
    if (isEventSpectator) {
      const timer = setTimeout(() => {
        setDuelTriggered(false);
        setIsEventSpectator(false);
        setSpectatorDuelChallengerId(null);
        setSpectatorDuelOpponentId(null);
        onlineGame.clearRemoteDuelResult();
        onlineGame.clearRemoteEvent();
      }, 2000);
      return () => clearTimeout(timer);
    }

    onlineGame.clearRemoteDuelResult();
    return undefined;
  }, [isOnline, onlineGame.remoteDuelResult, isEventSpectator, onlineGame]);

  // ===== ONLINE: Detect opponent disconnect → forfeit after 30s =====

  useEffect(() => {
    if (!isOnline) return;

    if (onlineGame.opponentDisconnected) {
      if (__DEV__) {
        console.log('[PlayScreen] Popup "Adversaire déconnecté" déclenché:', {
          opponentDisconnected: onlineGame.opponentDisconnected,
          disconnectedPlayerName: onlineGame.disconnectedPlayerName,
          timestamp: Date.now(),
        });
      }
      setShowDisconnectPopup(true);
      disconnectTimerRef.current = setTimeout(() => {
        if (userId) {
          onlineGame.broadcastWin(userId);
          router.push(`/(game)/results/${game?.id}`);
        }
      }, 30000);
    } else {
      setShowDisconnectPopup(false);
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    }

    return () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
      }
    };
  }, [isOnline, onlineGame.opponentDisconnected, userId, game?.id, router, onlineGame]);

  // ===== ONLINE: Detect game ended (forfeit from remote) =====

  useEffect(() => {
    if (!isOnline || !game) return;
    if (game.status === 'finished' && game.winner) {
      const timer = setTimeout(() => {
        router.push(`/(game)/results/${game.id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, game?.status, game?.winner, game?.id, router, game]);

  // ===== EVENT POPUP HANDLERS =====

  const handleQuizAnswer = useCallback(
    (correct: boolean, reward: number) => {
      actions.resolveEvent({ ok: correct, reward });
      setQuizData(null);
      handleEventResolve();
    },
    [actions, handleEventResolve]
  );

  const handleFundingAccept = useCallback(
    (amount: number) => {
      actions.resolveEvent({ ok: true, reward: amount });
      setFundingData(null);
      handleEventResolve();
    },
    [actions, handleEventResolve]
  );

  const handleEventAccept = useCallback(
    (value: number, effect: string) => {
      const isPositive = effect === 'tokens';
      actions.resolveEvent({ ok: isPositive, reward: value });
      setOpportunityData(null);
      setChallengeData(null);
      handleEventResolve();
    },
    [actions, handleEventResolve]
  );

  // Duel handlers
  const handleDuelSelectOpponent = useCallback(
    (opponent: Player) => {
      if (!duel.challenger) return;
      duel.selectOpponent(opponent.id);
      const questions = getRandomDuelQuestions(3, game?.edition);
      duel.startDuelWithQuestions(duel.challenger.id, opponent.id, questions);
      if (isOnline) {
        onlineGame.broadcastDuelStart(duel.challenger.id, opponent.id, questions as unknown as Record<string, unknown>[]);
      }
    },
    [duel, isOnline, onlineGame, game?.edition]
  );

  // Start answering — universal for online (both players), falls back to challenger for local
  const handleDuelStartAnswering = useCallback(() => {
    if (isOnline) {
      duel.startAnswering();
    } else {
      duel.startChallengerTurn();
    }
  }, [duel, isOnline]);

  const handleDuelStartOpponent = useCallback(() => {
    duel.startOpponentTurn();
  }, [duel]);

  // Submit answers — online: both use submitMyAnswers; local: challenger/opponent separate
  const handleDuelAnswersComplete = useCallback(
    (answers: number[], score: number) => {
      if (isOnline) {
        duel.submitMyAnswers(answers, score);
        onlineGame.broadcastDuelScore(score);
      } else {
        // Local mode: determine who just answered
        if (duel.currentPhase === 'challenger_turn') {
          duel.submitChallengerAnswers(answers, score);
        } else {
          duel.submitOpponentAnswers(answers, score);
        }
      }
    },
    [duel, isOnline, onlineGame]
  );

  // Legacy handlers kept for backward compatibility with local mode
  const handleDuelChallengerComplete = useCallback(
    (answers: number[], score: number) => {
      duel.submitChallengerAnswers(answers, score);
      if (isOnline) onlineGame.broadcastDuelScore(score);
    },
    [duel, isOnline, onlineGame]
  );

  const handleDuelOpponentComplete = useCallback(
    (answers: number[], score: number) => {
      duel.submitOpponentAnswers(answers, score);
      if (isOnline) onlineGame.broadcastDuelScore(score);
    },
    [duel, isOnline, onlineGame]
  );

  const handleDuelClose = useCallback(() => {
    // Identifier si je suis le challenger ou l'opponent
    const myId = userId || currentPlayer?.id;
    const amChallenger = myId === duel.result?.challengerId;
    const isWinner = duel.result?.winnerId === myId;

    // Calculer la récompense selon mon rôle
    let reward = 0;
    if (isWinner) {
      reward = amChallenger ? (duel.result?.challengerReward || 0) : (duel.result?.opponentReward || 0);
    }

    // En mode online, seul le joueur dont c'est le tour (challenger) résout l'événement
    // En mode local, le challenger résout aussi l'événement
    // Note: les récompenses sont déjà appliquées par onDuelComplete, donc on résout juste l'event
    const shouldResolveEvent = amChallenger || (!isOnline && currentPlayer?.id === duel.result?.challengerId);

    if (shouldResolveEvent) {
      // resolveEvent broadcasts the event resolution to other players
      actions.resolveEvent({ ok: isWinner, reward });
    }

    setDuelTriggered(false);
    setSpectatorDuelChallengerId(null);
    setSpectatorDuelOpponentId(null);
    duel.resetDuel();

    // Seul le challenger déclenche handleEventResolve (pour passer au tour suivant)
    if (shouldResolveEvent) {
      handleEventResolve();
    }
  }, [duel.result, currentPlayer?.id, userId, isOnline, actions, handleEventResolve, duel]);

  // ===== QUIT HANDLER =====

  const handleQuit = useCallback(() => {
    setShowQuitConfirm(false);
    if (isOnline) {
      onlineGame.forfeit();
    }
    router.replace('/(tabs)/home');
  }, [router, isOnline, onlineGame]);

  // ===== PAWN MOVE ANIMATION COMPLETE (kept for GameBoard) =====

  const handlePawnMoveComplete = useCallback(() => {
    // No-op: movement is handled by the turn machine
  }, []);

  // ===== PAWN PRESS (kept for GameBoard but simplified) =====

  const handlePawnPress = useCallback(
    (_playerId: string, _pawnIndex: number) => {
      // Auto-move is handled by the turn machine
      // This is kept for GameBoard's onPawnPress prop compatibility
    },
    []
  );

  // ===== RENDER HELPER: get dice props for a specific player card =====

  const getPlayerCardDiceProps = useCallback(
    (pl: Player) => {
      const isMe = isOnline ? pl.id === userId : !pl.isAI;
      const isTurn = pl.id === currentPlayer?.id;
      const isRemoteRolling = remoteRollingPlayerId === pl.id;

      let diceValue: number | null = null;
      let isDiceRolling = false;
      let isDiceDisabled = true;
      let onRollDice: (() => number) | undefined;
      let onDiceComplete: ((value: number) => void) | undefined;

      if (isMe && isTurn) {
        // My turn (human, local): use turn machine state + wire up dice controls
        diceValue = turnState.diceValue;
        isDiceRolling = turnState.isRolling;
        isDiceDisabled = turnState.phase !== 'idle' || (isOnline && !onlineGame.isMyTurn);
        onRollDice = diceProps.onRoll;
        onDiceComplete = diceProps.onDiceComplete;
      } else if (isRemoteRolling) {
        // Remote online player rolling (opponent's device)
        diceValue = remoteDiceValue;
        isDiceRolling = true;
      } else if (isTurn) {
        // AI or non-local player's turn: show turn machine dice state
        // This gives the AI rolling animation + dice value display
        diceValue = turnState.diceValue;
        isDiceRolling = turnState.isRolling;
      }

      return { diceValue, isDiceRolling, isDiceDisabled, onRollDice, onDiceComplete };
    },
    [
      isOnline,
      userId,
      currentPlayer,
      remoteRollingPlayerId,
      remoteDiceValue,
      turnState.diceValue,
      turnState.isRolling,
      turnState.phase,
      onlineGame.isMyTurn,
      diceProps,
    ]
  );

  if (!game) {
    return (
      <View style={styles.noGame}>
        <Text style={styles.noGameText}>Aucune partie en cours</Text>
        <Button
          title="Retour"
          variant="primary"
          style={styles.noGameButton}
          onPress={() => router.replace('/(tabs)/home')}
        />
      </View>
    );
  }

  // Helper to render a player card for a given color slot
  const renderPlayerCard = (color: string) => {
    const pl = game.players.find((p) => p.color === color);
    if (!pl) return null;

    const isTurn = pl.id === currentPlayer?.id;
    const dp = getPlayerCardDiceProps(pl);

    return (
      <PlayerCard
        player={pl}
        isCurrentTurn={isTurn}
        diceValue={dp.diceValue}
        isDiceRolling={dp.isDiceRolling}
        isDiceDisabled={dp.isDiceDisabled}
        onRollDice={dp.onRollDice}
        onDiceComplete={dp.onDiceComplete}
      />
    );
  };

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.content, { paddingTop: insets.top + 72, paddingBottom: insets.bottom }]}>
        {/* Fixed Header */}
        <View style={[styles.fixedHeader, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable onPress={() => setShowQuitConfirm(true)} hitSlop={8} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../../assets/images/logostartupludo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Pressable style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Board + PlayerCards */}
        <View style={styles.boardWrapper}>
          {/* Top Players Row — yellow (top-left) and blue (top-right) */}
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>
              {renderPlayerCard('yellow')}
            </View>
            <View style={styles.playerSlot}>
              {renderPlayerCard('blue')}
            </View>
          </View>

          {/* Game Board */}
          <View style={styles.boardContainer}>
            <GameBoard
              players={game.players}
              currentPlayerId={currentPlayer?.id || ''}
              selectedPawnIndex={selectedPawnIndex}
              highlightedPositions={highlightedPositions.filter(
                (hp): hp is { type: 'circuit' | 'final'; position: number; color?: typeof hp.color } =>
                  hp.type !== 'home'
              )}
              onPawnPress={handlePawnPress}
              onPawnMoveComplete={handlePawnMoveComplete}
            />
          </View>

          {/* Bottom Players Row — green (bottom-left) and red (bottom-right) */}
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>
              {renderPlayerCard('green')}
            </View>
            <View style={styles.playerSlot}>
              {renderPlayerCard('red')}
            </View>
          </View>

          {/* Boutons de test des popups (désactivés — décommenter pour debug) */}
          {/* <View style={styles.testPopupsRow}>
            <Pressable
              style={styles.testPopupButton}
              onPress={() => {
                setIsEventSpectator(false);
                setQuizData(MOCK_QUIZ);
              }}
            >
              <Text style={styles.testPopupLabel}>Quiz</Text>
            </Pressable>
            <Pressable
              style={styles.testPopupButton}
              onPress={() => {
                setIsEventSpectator(false);
                setFundingData(MOCK_FUNDING);
              }}
            >
              <Text style={styles.testPopupLabel}>Financement</Text>
            </Pressable>
            <Pressable
              style={styles.testPopupButton}
              onPress={() => {
                setIsEventSpectator(false);
                setOpportunityData(MOCK_OPPORTUNITY);
              }}
            >
              <Text style={styles.testPopupLabel}>Opportunité</Text>
            </Pressable>
            <Pressable
              style={styles.testPopupButton}
              onPress={() => {
                setIsEventSpectator(false);
                setChallengeData(MOCK_CHALLENGE);
              }}
            >
              <Text style={styles.testPopupLabel}>Challenge</Text>
            </Pressable>
            <Pressable
              style={[styles.testPopupButton, { backgroundColor: COLORS.success }]}
              onPress={() => {
                if (!currentPlayer) return;
                setIsEventSpectator(false);
                setDuelTriggered(true);
                const otherPlayers = game?.players?.filter((p) => p.id !== currentPlayer.id) ?? [];
                if (otherPlayers.length === 1) {
                  const opponentId = otherPlayers[0]!.id;
                  const questions = getRandomDuelQuestions(3, game?.edition);
                  duel.startDuelWithQuestions(currentPlayer.id, opponentId, questions);
                  if (isOnline) {
                    onlineGame.broadcastDuelStart(currentPlayer.id, opponentId, questions as unknown as Record<string, unknown>[]);
                  }
                } else {
                  duel.startDuel(currentPlayer.id);
                }
              }}
            >
              <Text style={[styles.testPopupLabel, { color: COLORS.white }]}>Duel</Text>
            </Pressable>
          </View> */}
        </View>
      </View>

      {/* Quit Confirmation Modal */}
      <QuitConfirmPopup
        visible={showQuitConfirm}
        onCancel={() => setShowQuitConfirm(false)}
        onConfirm={handleQuit}
        isOnline={isOnline}
      />

      {/* Opponent Disconnected Modal (online) */}
      {isOnline && (
        <Modal visible={showDisconnectPopup} onClose={() => {}} closeOnBackdrop={false}>
          <View style={styles.modalContent}>
            <Ionicons name="wifi" size={48} color={COLORS.warning} />
            <Text style={styles.modalTitle}>Adversaire deconnecte</Text>
            <Text style={styles.modalText}>
              {onlineGame.disconnectedPlayerName || 'Votre adversaire'} s'est deconnecte.{'\n'}
              Victoire par forfait dans 30 secondes...
            </Text>
            <Button
              title="Reclamer la victoire"
              variant="primary"
              onPress={() => {
                if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
                if (userId) {
                  onlineGame.broadcastWin(userId);
                  router.push(`/(game)/results/${game.id}`);
                }
              }}
              style={styles.modalButton}
            />
          </View>
        </Modal>
      )}

      {/* Event Popups */}
      <QuizPopup
        visible={!!quizData}
        quiz={quizData}
        onAnswer={handleQuizAnswer}
        onClose={() => setQuizData(null)}
        isSpectator={isEventSpectator}
        spectatorResult={onlineGame.remoteEventResult ? { ok: onlineGame.remoteEventResult.ok, reward: onlineGame.remoteEventResult.reward } : undefined}
      />

      <FundingPopup
        visible={!!fundingData}
        funding={fundingData}
        onAccept={handleFundingAccept}
        onClose={() => setFundingData(null)}
        isSpectator={isEventSpectator}
      />

      <EventPopup
        visible={!!opportunityData}
        eventType="opportunity"
        event={opportunityData}
        onAccept={handleEventAccept}
        onClose={() => setOpportunityData(null)}
        isSpectator={isEventSpectator}
      />

      <EventPopup
        visible={!!challengeData}
        eventType="challenge"
        event={challengeData}
        onAccept={handleEventAccept}
        onClose={() => setChallengeData(null)}
        isSpectator={isEventSpectator}
      />

      {/* New Duel System Popups */}
      {duel.challenger && (
        <DuelSelectOpponentPopup
          visible={duel.currentPhase === 'select_opponent'}
          opponents={duel.spectators}
          currentPlayer={duel.challenger}
          onSelectOpponent={handleDuelSelectOpponent}
          onClose={() => {
            setDuelTriggered(false);
            duel.resetDuel();
            handleEventResolve();
          }}
        />
      )}

      {(() => {
        // Online: intro for both players, then 'answering' for both in parallel
        // Local: intro for challenger, opponent_prepare for opponent, then challenger_turn / opponent_turn
        const showPrepare = (duel.currentPhase === 'intro' || duel.currentPhase === 'opponent_prepare') && !!duel.challenger && !!duel.opponent;
        const showQuestion = (duel.currentPhase === 'challenger_turn' || duel.currentPhase === 'opponent_turn' || duel.currentPhase === 'answering') && duel.questions.length > 0;
        return (
          <>
            {showPrepare && (
              <DuelPreparePopup
                visible
                phase={duel.currentPhase === 'intro' ? 'intro' : 'opponent_prepare'}
                challenger={duel.challenger}
                opponent={duel.opponent}
                currentPlayerId={userId || currentPlayer?.id || ''}
                isOnline={isOnline}
                onStart={
                  isOnline
                    ? handleDuelStartAnswering
                    : duel.currentPhase === 'intro'
                      ? handleDuelStartAnswering
                      : handleDuelStartOpponent
                }
              />
            )}

            {showQuestion && (
              <DuelQuestionPopup
                visible
                questions={duel.questions}
                onComplete={
                  isOnline
                    ? handleDuelAnswersComplete
                    : duel.currentPhase === 'challenger_turn'
                      ? handleDuelChallengerComplete
                      : handleDuelOpponentComplete
                }
                onClose={() => {
                  setDuelTriggered(false);
                  duel.resetDuel();
                }}
              />
            )}
          </>
        );
      })()}

      {(() => {
        const spectatorChallenger =
          spectatorDuelChallengerId && game
            ? game.players.find((p) => p.id === spectatorDuelChallengerId) ?? null
            : duel.challenger;
        const spectatorOpponent =
          spectatorDuelOpponentId && game
            ? game.players.find((p) => p.id === spectatorDuelOpponentId) ?? null
            : duel.opponent;
        const challengerForPopup = spectatorChallenger ?? duel.challenger;
        const opponentForPopup = spectatorOpponent ?? duel.opponent;
        const showSpectator =
          duelTriggered &&
          isEventSpectator &&
          duel.currentPhase !== 'result' &&
          challengerForPopup != null &&
          opponentForPopup != null;
        if (!challengerForPopup || !opponentForPopup) return null;
        return (
          <DuelSpectatorPopup
            visible={!!showSpectator}
            challenger={challengerForPopup}
            opponent={opponentForPopup}
          />
        );
      })()}

      <DuelResultPopup
        visible={duel.currentPhase === 'result' || duel.isWaitingForOpponent}
        result={duel.result}
        challenger={duel.challenger}
        opponent={duel.opponent}
        currentPlayerId={userId || currentPlayer?.id || ''}
        isWaitingForOpponent={duel.isWaitingForOpponent}
        waitingForName={
          duel.isWaitingForOpponent
            ? duel.myRole === 'challenger'
              ? duel.opponent?.name
              : duel.challenger?.name
            : undefined
        }
        onClose={handleDuelClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  content: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 48,
  },
  boardWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    marginHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[1],
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[1],
    gap: SPACING[1],
  },
  playerSlot: {
    width: '48%',
  },
  boardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: SPACING[1],
  },
  testPopupsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[3],
    marginTop: SPACING[2],
  },
  testPopupButton: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  testPopupLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  modalContent: {
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginTop: SPACING[3],
    marginBottom: SPACING[2],
  },
  modalText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  modalButton: {
    minWidth: 100,
  },
  noGame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C243E',
    padding: SPACING[4],
  },
  noGameText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    marginBottom: SPACING[4],
  },
  noGameButton: {
    minWidth: 140,
  },
});
