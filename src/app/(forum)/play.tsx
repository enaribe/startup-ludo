/**
 * ForumPlayScreen — Écran de jeu mode forum
 *
 * Logique identique au jeu normal (handleTriggeredEvent, branche IA, duel complet).
 * Seule différence : pas de online, redirection vers /(forum)/results.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  EmojiReactionBar,
  EmojiReactionOverlay,
  type GameEmoji,
  type EmojiReaction,
} from '@/components/game';
import { DiceChoiceButton } from '@/components/game/DiceChoiceButton';
import {
  EventPopup,
  FundingPopup,
  QuizPopup,
  QuitConfirmPopup,
  DuelSelectOpponentPopup,
  DuelPreparePopup,
  DuelQuestionPopup,
  DuelResultPopup,
} from '@/components/game/popups';
import { Button } from '@/components/ui/Button';
import { RadialBackground } from '@/components/ui';
import { eventManager } from '@/services/game/EventManager';
import { useGameStore, useSettingsStore, useAudioUiStore } from '@/stores';
import { useTurnMachine, type TurnActions } from '@/hooks/useTurnMachine';
import { useDuel } from '@/hooks/useDuel';
import { useForumScale } from '@/hooks/useForumScale';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { refreshEditionsFromFirestore } from '@/data';
import { getRandomDuelQuestions } from '@/data/duelQuestions';
import type {
  ChallengeEvent,
  FundingEvent,
  OpportunityEvent,
  Player,
  QuizEvent,
  DuelResult,
  DuelQuestion,
} from '@/types';

export default function ForumPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sizes, spacing } = useResponsiveLayout();
  const { sp } = useForumScale();
  const setBgmGameplayDuck = useAudioUiStore((s) => s.setBgmGameplayDuck);

  useEffect(() => {
    setBgmGameplayDuck(true);
    return () => setBgmGameplayDuck(false);
  }, [setBgmGameplayDuck]);

  // Même source de contenu que le jeu classique : s'assurer que EDITIONS (cache / Firestore) est à jour
  useEffect(() => {
    void refreshEditionsFromFirestore();
  }, []);

  // ===== Game store — actions =====
  const storeRollDice = useGameStore((s) => s.rollDice);
  const storeSetDiceValue = useGameStore((s) => s.setDiceValue);
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

  // ===== Game store — état réactif =====
  const game = useGameStore((s) => s.game);
  const selectedPawnIndex = useGameStore((s) => s.selectedPawnIndex);
  const highlightedPositions = useGameStore((s) => s.highlightedPositions);
  const currentPlayer = useGameStore(
    (s) => (s.game ? s.game.players[s.game.currentPlayerIndex] ?? null : null)
  );

  // ===== État local =====
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [quizData, setQuizData] = useState<QuizEvent | null>(null);
  const [fundingData, setFundingData] = useState<FundingEvent | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityEvent | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeEvent | null>(null);
  const [_duelTriggered, setDuelTriggered] = useState(false);
  const [isEventSpectator, setIsEventSpectator] = useState(false);
  const [aiSpectatorResult, setAiSpectatorResult] = useState<{
    ok: boolean;
    reward: number;
    selectedIndex?: number;
  } | null>(null);
  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);

  // ===== Duel =====
  const duel = useDuel({
    players: game?.players ?? [],
    isOnline: false,
    myPlayerId: null,
    onDuelComplete: useCallback(
      (result: DuelResult) => {
        if (result.challengerReward > 0) addTokens(result.challengerId, result.challengerReward);
        else if (result.challengerReward < 0)
          removeTokens(result.challengerId, Math.abs(result.challengerReward));
        if (result.opponentReward > 0) addTokens(result.opponentId, result.opponentReward);
        else if (result.opponentReward < 0)
          removeTokens(result.opponentId, Math.abs(result.opponentReward));
      },
      [addTokens, removeTokens]
    ),
  } as Parameters<typeof useDuel>[0]);

  const duelRef = useRef(duel);
  duelRef.current = duel;

  // ===== Timers IA =====
  const aiResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAiTimers = useCallback(() => {
    if (aiResultTimerRef.current) {
      clearTimeout(aiResultTimerRef.current);
      aiResultTimerRef.current = null;
    }
    if (aiCloseTimerRef.current) {
      clearTimeout(aiCloseTimerRef.current);
      aiCloseTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAiTimers(), [clearAiTimers]);

  // ===== Actions =====
  const actions: TurnActions = useMemo(
    () => ({
      rollDice: storeRollDice,
      setDiceValue: storeSetDiceValue,
      executeMove: storeExecuteMove,
      exitHome: storeExitHome,
      nextTurn: storeNextTurn,
      grantExtraTurn: storeGrantExtraTurn,
      handleCapture: storeHandleCapture,
      endGame: storeEndGame,
      resolveEvent: (r: { ok: boolean; reward: number }) => {
        const cp = getCurrentPlayer();
        if (cp) {
          if (r.ok && r.reward > 0) addTokens(cp.id, r.reward);
          else if (!r.ok && r.reward > 0) removeTokens(cp.id, r.reward);
        }
        storeResolveEvent();
      },
      broadcastEvent: () => {},
      getValidMoves: storeGetValidMoves,
      checkWinCondition: storeCheckWinCondition,
    }),
    [
      storeRollDice,
      storeSetDiceValue,
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
    ]
  );

  const handleEventResolveRef = useRef<() => void>(() => {});
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  // ===== Gestionnaire d'événement — identique au jeu normal =====
  const handleTriggeredEvent = useCallback(
    (eventType: string) => {
      const raw =
        game?.edition?.trim() ||
        currentPlayer?.edition?.trim() ||
        'classic';
      const playerEdition = raw as import('@/data').EditionId;

      const event = eventManager.generateEventForEdition(eventType as Parameters<typeof eventManager.generateEventForEdition>[0], playerEdition);
      if (!event) return;

      const gameEvent = event as unknown as import('@/types').GameEvent;

      // ===== Tour de l'IA : popup en mode spectateur + résolution auto =====
      if (currentPlayer?.isAI) {
        triggerEvent(gameEvent);
        setIsEventSpectator(true);
        setAiSpectatorResult(null);

        const resolveAndClose = (result: { ok: boolean; reward: number }) => {
          clearAiTimers();
          setAiSpectatorResult(null);
          setIsEventSpectator(false);
          actions.resolveEvent(result);
          setQuizData(null);
          setFundingData(null);
          setOpportunityData(null);
          setChallengeData(null);
          setDuelTriggered(false);
          handleEventResolveRef.current();
        };

        clearAiTimers();

        switch (event.type) {
          case 'quiz': {
            const aiCorrect = Math.random() < 0.6;
            const quizEv = event.data as QuizEvent;
            const reward = quizEv.reward;
            const optionsCount = quizEv.options.length;
            let selectedIndex: number;
            if (aiCorrect) {
              selectedIndex = quizEv.correctAnswer;
            } else {
              const wrongOptions = Array.from({ length: optionsCount }, (_, i) => i).filter(
                (i) => i !== quizEv.correctAnswer
              );
              selectedIndex = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] ?? 0;
            }
            const result = { ok: aiCorrect, reward, selectedIndex };
            setQuizData(quizEv);
            aiResultTimerRef.current = setTimeout(() => setAiSpectatorResult(result), 1500);
            aiCloseTimerRef.current = setTimeout(() => resolveAndClose(result), 3500);
            break;
          }
          case 'funding': {
            const fundingEv = event.data as FundingEvent;
            setFundingData(fundingEv);
            aiCloseTimerRef.current = setTimeout(
              () => resolveAndClose({ ok: true, reward: fundingEv.amount }),
              2500
            );
            break;
          }
          case 'opportunity': {
            const oppEv = event.data as OpportunityEvent;
            setOpportunityData(oppEv);
            aiCloseTimerRef.current = setTimeout(
              () => resolveAndClose({ ok: oppEv.effect === 'tokens', reward: oppEv.value }),
              2500
            );
            break;
          }
          case 'challenge': {
            const chalEv = event.data as ChallengeEvent;
            setChallengeData(chalEv);
            aiCloseTimerRef.current = setTimeout(
              () => resolveAndClose({ ok: false, reward: chalEv.value }),
              2500
            );
            break;
          }
          case 'duel': {
            const otherPlayers =
              game?.players?.filter((p) => p.id !== currentPlayer?.id) ?? [];
            if (otherPlayers.length >= 1) {
              const humanPlayer = otherPlayers[0]!;
              const questions = getRandomDuelQuestions(3, playerEdition);
              setDuelTriggered(true);
              setIsEventSpectator(false);
              duelRef.current.startDuelWithQuestions(
                currentPlayer!.id,
                humanPlayer.id,
                questions
              );
              // Soumission auto des réponses de l'IA challenger après un court délai
              setTimeout(() => {
                const aiScore = Math.floor(Math.random() * 60) + 30;
                duelRef.current.submitChallengerAnswers([], aiScore);
              }, 500);
            } else {
              resolveAndClose({ ok: true, reward: 1 });
            }
            break;
          }
          default:
            resolveAndClose({ ok: false, reward: 0 });
        }
        return;
      }

      // ===== Tour humain =====
      clearAiTimers();
      setAiSpectatorResult(null);
      triggerEvent(gameEvent);
      setIsEventSpectator(false);

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
          const otherPlayers =
            game?.players?.filter((p) => p.id !== currentPlayer.id) ?? [];
          if (otherPlayers.length === 1) {
            const opponentId = otherPlayers[0]!.id;
            const questions = getRandomDuelQuestions(3, playerEdition);
            duelRef.current.startDuelWithQuestions(currentPlayer.id, opponentId, questions);
          } else {
            duelRef.current.startDuel(currentPlayer.id);
          }
          break;
        }
      }
    },
    [game, currentPlayer, triggerEvent, clearAiTimers, actions]
  );

  // ===== Turn machine =====
  const {
    turnState,
    diceProps,
    handleEventResolve,
    chosenDiceValue,
    hasUsedDiceChoice,
    setChosenDiceValue,
  } = useTurnMachine({
    game,
    currentPlayer,
    actions,
    isOnline: false,
    userId: null,
    hapticsEnabled,
    setAnimating,
    clearSelection,
    onEvent: handleTriggeredEvent,
    onWin: useCallback(
      (winnerId: string) => {
        storeEndGame(winnerId);
      },
      [storeEndGame]
    ),
  });

  useEffect(() => {
    handleEventResolveRef.current = handleEventResolve;
  });

  // ===== Redirection résultats forum =====
  useEffect(() => {
    if (!game || game.status !== 'finished' || !game.winner) return;
    const timer = setTimeout(() => router.replace('/(forum)/results'), 1500);
    return () => clearTimeout(timer);
  }, [game?.status, game?.winner, router, game]);

  // ===== Handlers événements =====
  const handleQuizAnswer = useCallback(
    (correct: boolean, reward: number, selectedIndex: number) => {
      actions.resolveEvent({ ok: correct, reward, selectedIndex });
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

  // ===== Handlers duel =====
  const handleDuelSelectOpponent = useCallback(
    (opponent: Player) => {
      if (!duel.challenger) return;
      duel.selectOpponent(opponent.id);
      const challengerEdition =
        duel.challenger.edition?.trim() || game?.edition?.trim() || 'classic';
      const questions = getRandomDuelQuestions(3, challengerEdition);
      duel.startDuelWithQuestions(duel.challenger.id, opponent.id, questions);
    },
    [duel, game?.edition]
  );

  const handleDuelStartOpponent = useCallback(() => {
    duel.startOpponentTurn();
  }, [duel]);

  const handleDuelChallengerComplete = useCallback(
    (answers: number[], score: number) => {
      duel.submitChallengerAnswers(answers, score);
    },
    [duel]
  );

  const handleDuelOpponentComplete = useCallback(
    (answers: number[], score: number) => {
      duel.submitOpponentAnswers(answers, score);
    },
    [duel]
  );

  const handleDuelClose = useCallback(() => {
    const myId = currentPlayer?.id;
    const amChallenger = myId === duel.result?.challengerId;
    const isWinner = duel.result?.winnerId === myId;
    let reward = 0;
    if (isWinner) {
      reward = amChallenger
        ? (duel.result?.challengerReward ?? 0)
        : (duel.result?.opponentReward ?? 0);
    }
    const shouldResolveEvent =
      amChallenger || currentPlayer?.id === duel.result?.challengerId;
    if (shouldResolveEvent) {
      actions.resolveEvent({ ok: isWinner, reward });
    }
    setDuelTriggered(false);
    duel.resetDuel();
    if (shouldResolveEvent) handleEventResolve();
  }, [duel, currentPlayer?.id, actions, handleEventResolve]);

  // ===== Emoji =====
  const handleEmojiPress = useCallback(
    (emoji: GameEmoji) => {
      const reaction: EmojiReaction = {
        id: `${currentPlayer?.id ?? 'local'}-${Date.now()}`,
        playerId: currentPlayer?.id ?? '',
        playerName: currentPlayer?.name ?? 'Joueur',
        emoji,
        timestamp: Date.now(),
      };
      setActiveReactions((prev) => [...prev, reaction]);
    },
    [currentPlayer]
  );

  const handleEmojiAnimationComplete = useCallback((reactionId: string) => {
    setActiveReactions((prev) => prev.filter((r) => r.id !== reactionId));
  }, []);

  // ===== Quit =====
  const handleQuit = useCallback(() => {
    setShowQuitConfirm(false);
    router.replace('/(forum)/welcome');
  }, [router]);

  const handlePawnMoveComplete = useCallback(() => {}, []);
  const handlePawnPress = useCallback((_playerId: string, _pawnIndex: number) => {}, []);

  // ===== Props dé par joueur =====
  const getPlayerCardDiceProps = useCallback(
    (pl: Player) => {
      const isHuman = !pl.isAI;
      const isTurn = pl.id === currentPlayer?.id;

      if (isHuman && isTurn) {
        return {
          diceValue: turnState.diceValue,
          isDiceRolling: turnState.isRolling,
          isDiceDisabled: turnState.phase !== 'idle',
          onRollDice: diceProps.onRoll,
          onDiceComplete: diceProps.onDiceComplete,
        };
      }
      if (isTurn) {
        // IA : on montre l'état du dé (animation + valeur)
        return {
          diceValue: turnState.diceValue,
          isDiceRolling: turnState.isRolling,
          isDiceDisabled: true,
          onRollDice: undefined,
          onDiceComplete: undefined,
        };
      }
      return {
        diceValue: null,
        isDiceRolling: false,
        isDiceDisabled: true,
        onRollDice: undefined,
        onDiceComplete: undefined,
      };
    },
    [currentPlayer, turnState, diceProps]
  );

  if (!game) {
    return (
      <View style={styles.noGame}>
        <Text style={styles.noGameText}>Aucune partie en cours</Text>
        <Button
          title="Retour"
          variant="primary"
          onPress={() => router.replace('/(forum)/welcome')}
          style={styles.noGameButton}
        />
      </View>
    );
  }

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

  // Pour DuelPreparePopup : si l'IA est challenger, ignorer la phase intro
  const aiIsChallenger = duel.challenger?.isAI === true;
  const showDuelPrepare =
    ((duel.currentPhase === 'intro' && !aiIsChallenger) ||
      duel.currentPhase === 'opponent_prepare') &&
    !!duel.challenger &&
    !!duel.opponent;
  const showDuelQuestion =
    (duel.currentPhase === 'challenger_turn' || duel.currentPhase === 'opponent_turn') &&
    duel.questions.length > 0;

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + sizes.header, paddingBottom: insets.bottom + sizes.footer },
        ]}
      >
        {/* Header */}
        <View style={[styles.fixedHeader, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable
            onPress={() => setShowQuitConfirm(true)}
            hitSlop={8}
            style={[styles.headerButton, { width: sp(44), height: sp(44), borderRadius: sp(22) }]}
          >
            <Ionicons name="arrow-back" size={sp(24)} color="#FFFFFF" />
          </Pressable>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/../assets/images/logostartupludo.png')}
              style={[styles.logoImage, { width: sp(140), height: sp(48) }]}
              resizeMode="contain"
            />
          </View>
          <Pressable
            style={[styles.headerButton, { width: sp(44), height: sp(44), borderRadius: sp(22) }]}
          >
            <Ionicons name="settings-outline" size={sp(24)} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Plateau + cartes joueurs */}
        <View style={[styles.boardWrapper, { marginHorizontal: spacing.screen }]}>
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>{renderPlayerCard('yellow')}</View>
            <View style={styles.playerSlot}>{renderPlayerCard('blue')}</View>
          </View>
          <View style={styles.boardContainer}>
            <GameBoard
              players={game.players}
              currentPlayerId={currentPlayer?.id ?? ''}
              selectedPawnIndex={selectedPawnIndex}
              highlightedPositions={highlightedPositions.filter(
                (hp): hp is { type: 'circuit' | 'final'; position: number; color?: typeof hp.color } =>
                  hp.type !== 'home'
              )}
              onPawnPress={handlePawnPress}
              onPawnMoveComplete={handlePawnMoveComplete}
            />
          </View>
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>{renderPlayerCard('green')}</View>
            <View style={styles.playerSlot}>{renderPlayerCard('red')}</View>
          </View>
        </View>
      </View>

      {/* Barre emoji */}
      <View style={[styles.emojiBarFooter, { paddingBottom: insets.bottom + SPACING[2] }]}>
        <View style={styles.emojiBarRow}>
          <EmojiReactionBar onEmojiPress={handleEmojiPress} />
          {!currentPlayer?.isAI && (
            <DiceChoiceButton
              available={!hasUsedDiceChoice}
              chosenValue={chosenDiceValue}
              canUse={turnState.phase === 'idle'}
              onChoose={setChosenDiceValue}
            />
          )}
        </View>
      </View>

      <EmojiReactionOverlay
        reactions={activeReactions}
        onAnimationComplete={handleEmojiAnimationComplete}
      />

      {/* Confirmation quitter */}
      <QuitConfirmPopup
        visible={showQuitConfirm}
        onCancel={() => setShowQuitConfirm(false)}
        onConfirm={handleQuit}
        isOnline={false}
      />

      {/* ===== Popups événements ===== */}
      <QuizPopup
        key={quizData?.id ?? 'quiz-idle'}
        visible={!!quizData}
        quiz={quizData}
        onAnswer={handleQuizAnswer}
        onClose={() => setQuizData(null)}
        isSpectator={isEventSpectator}
        spectatorResult={aiSpectatorResult ?? undefined}
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

      {/* ===== Popups duel ===== */}
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

      {showDuelPrepare && duel.challenger && duel.opponent && (
        <DuelPreparePopup
          visible
          phase={duel.currentPhase === 'intro' ? 'intro' : 'opponent_prepare'}
          challenger={duel.challenger}
          opponent={duel.opponent}
          currentPlayerId={currentPlayer?.id ?? ''}
          isOnline={false}
          onStart={
            duel.currentPhase === 'intro'
              ? () => duel.startChallengerTurn()
              : handleDuelStartOpponent
          }
        />
      )}

      {showDuelQuestion && duel.challenger && duel.opponent && (
        <DuelQuestionPopup
          visible
          questions={duel.questions as DuelQuestion[]}
          onComplete={
            duel.currentPhase === 'challenger_turn'
              ? handleDuelChallengerComplete
              : handleDuelOpponentComplete
          }
          onClose={() => {
            setDuelTriggered(false);
            duel.resetDuel();
          }}
        />
      )}

      <DuelResultPopup
        visible={duel.currentPhase === 'result'}
        result={duel.result}
        challenger={duel.challenger}
        opponent={duel.opponent}
        currentPlayerId={currentPlayer?.id ?? ''}
        onClose={handleDuelClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C243E' },
  content: { flex: 1 },
  noGame: {
    flex: 1,
    backgroundColor: '#0C243E',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  noGameText: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: '#FFFFFF' },
  noGameButton: { marginTop: 16 },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[2],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoContainer: { flex: 1, alignItems: 'center' },
  logoImage: { width: 100, height: 36 },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[1],
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[1],
    gap: SPACING[1],
  },
  playerSlot: { width: '48%' },
  boardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: SPACING[1],
  },
  emojiBarFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 36, 62, 0.9)',
    paddingTop: SPACING[2],
    paddingHorizontal: SPACING[3],
  },
  emojiBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
