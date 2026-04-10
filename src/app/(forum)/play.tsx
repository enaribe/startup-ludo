/**
 * ForumPlayScreen — Écran de jeu mode forum
 *
 * Réutilise tous les composants du jeu existant (GameBoard, popups, etc.)
 * Seule différence : redirection vers /(forum)/results à la fin.
 * Pas de online, pas de challenges, pas d'auth.
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
import { useGameStore, useSettingsStore, useAudioUiStore } from '@/stores';
import { useTurnMachine, type TurnActions } from '@/hooks/useTurnMachine';
import { useDuel } from '@/hooks/useDuel';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { getRandomDuelQuestions } from '@/data/duelQuestions';
import type { ChallengeEvent, FundingEvent, OpportunityEvent, Player, QuizEvent, DuelResult, DuelQuestion } from '@/types';

export default function ForumPlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sizes, spacing } = useResponsiveLayout();
  const setBgmGameplayDuck = useAudioUiStore((s) => s.setBgmGameplayDuck);

  useEffect(() => {
    setBgmGameplayDuck(true);
    return () => setBgmGameplayDuck(false);
  }, [setBgmGameplayDuck]);

  // Game store
  const storeRollDice = useGameStore((s) => s.rollDice);
  const storeSetDiceValue = useGameStore((s) => s.setDiceValue);
  const storeExecuteMove = useGameStore((s) => s.executeMove);
  const storeExitHome = useGameStore((s) => s.exitHome);
  const storeHandleCapture = useGameStore((s) => s.handleCapture);
  const storeCheckWinCondition = useGameStore((s) => s.checkWinCondition);
  const storeGetValidMoves = useGameStore((s) => s.getValidMoves);
  const storeResolveEvent = useGameStore((s) => s.resolveEvent);
  const addTokens = useGameStore((s) => s.addTokens);
  const removeTokens = useGameStore((s) => s.removeTokens);
  const storeNextTurn = useGameStore((s) => s.nextTurn);
  const storeGrantExtraTurn = useGameStore((s) => s.grantExtraTurn);
  const storeEndGame = useGameStore((s) => s.endGame);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const setAnimating = useGameStore((s) => s.setAnimating);
  const getCurrentPlayer = useGameStore((s) => s.getCurrentPlayer);

  const game = useGameStore((s) => s.game);
  const selectedPawnIndex = useGameStore((s) => s.selectedPawnIndex);
  const highlightedPositions = useGameStore((s) => s.highlightedPositions);
  const currentPlayer = useGameStore(
    (s) => s.game ? s.game.players[s.game.currentPlayerIndex] ?? null : null
  );

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [quizData, setQuizData] = useState<QuizEvent | null>(null);
  const [fundingData, setFundingData] = useState<FundingEvent | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityEvent | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeEvent | null>(null);
  const [activeReactions, setActiveReactions] = useState<EmojiReaction[]>([]);

  // ===== Duel (local seulement) =====
  const duel = useDuel({
    players: game?.players || [],
    isOnline: false,
    myPlayerId: null,
    onDuelComplete: useCallback((result: DuelResult) => {
      if (result.challengerReward > 0) addTokens(result.challengerId, result.challengerReward);
      else if (result.challengerReward < 0) removeTokens(result.challengerId, Math.abs(result.challengerReward));
      if (result.opponentReward > 0) addTokens(result.opponentId, result.opponentReward);
      else if (result.opponentReward < 0) removeTokens(result.opponentId, Math.abs(result.opponentReward));
    }, [addTokens, removeTokens]),
  } as Parameters<typeof useDuel>[0]);

  const duelRef = useRef(duel);
  duelRef.current = duel;

  // ===== Actions locales (pas de chosenDiceValue — géré par le turn machine) =====
  const actions: TurnActions = useMemo(() => ({
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
  }), [
    storeRollDice, storeSetDiceValue, storeExecuteMove, storeExitHome,
    storeNextTurn, storeGrantExtraTurn, storeHandleCapture, storeEndGame,
    storeResolveEvent, storeGetValidMoves, storeCheckWinCondition,
    getCurrentPlayer, addTokens, removeTokens,
  ]);

  const handleEventResolveRef = useRef<() => void>(() => {});
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  // ===== Turn machine =====
  const { turnState, diceProps, handleEventResolve, chosenDiceValue, hasUsedDiceChoice, setChosenDiceValue } = useTurnMachine({
    game,
    currentPlayer,
    actions,
    isOnline: false,
    userId: null,
    hapticsEnabled,
    setAnimating,
    clearSelection,
    onEvent: useCallback((_eventType: string) => {
      const pendingEvent = game?.pendingEvent;
      if (!pendingEvent) {
        handleEventResolveRef.current();
        return;
      }
      const { type, data } = pendingEvent;
      if (type === 'quiz') setQuizData(data as QuizEvent);
      else if (type === 'funding') setFundingData(data as FundingEvent);
      else if (type === 'opportunity') setOpportunityData(data as OpportunityEvent);
      else if (type === 'challenge') setChallengeData(data as ChallengeEvent);
      else if (type === 'duel') {
        // duel actif
        if (currentPlayer) duelRef.current.startDuel(currentPlayer.id);
      } else {
        handleEventResolveRef.current();
      }
    }, [game?.pendingEvent, currentPlayer]),
    onWin: useCallback((_playerId: string) => {
      // Le store endGame est appelé par la turn machine — la redirection est gérée
      // par l'effet sur game.status dans ce composant
    }, []),
  });

  useEffect(() => {
    handleEventResolveRef.current = handleEventResolve;
  });

  // ===== Redirection vers résultats forum quand la partie est finie =====
  useEffect(() => {
    if (!game || game.status !== 'finished' || !game.winner) return;
    const timer = setTimeout(() => {
      router.replace('/(forum)/results');
    }, 1500);
    return () => clearTimeout(timer);
  }, [game?.status, game?.winner, router, game]);

  // ===== Handlers events =====
  const handleQuizAnswer = useCallback((correct: boolean, reward: number, selectedIndex: number) => {
    actions.resolveEvent({ ok: correct, reward, selectedIndex });
    setQuizData(null);
    handleEventResolve();
  }, [actions, handleEventResolve]);

  const handleFundingAccept = useCallback((amount: number) => {
    actions.resolveEvent({ ok: true, reward: amount });
    setFundingData(null);
    handleEventResolve();
  }, [actions, handleEventResolve]);

  const handleEventAccept = useCallback((value: number, effect: string) => {
    const isPositive = effect === 'tokens';
    actions.resolveEvent({ ok: isPositive, reward: value });
    setOpportunityData(null);
    setChallengeData(null);
    handleEventResolve();
  }, [actions, handleEventResolve]);

  const handleDuelSelectOpponent = useCallback((opponent: Player) => {
    if (!duel.challenger) return;
    const questions = getRandomDuelQuestions(3, game?.edition);
    duel.startDuelWithQuestions(duel.challenger.id, opponent.id, questions);
  }, [duel, game?.edition]);

  const handleDuelAnswersComplete = useCallback((answers: number[], score: number) => {
    if (duel.currentPhase === 'challenger_turn') duel.submitChallengerAnswers(answers, score);
    else duel.submitOpponentAnswers(answers, score);
  }, [duel]);

  const handleDuelClose = useCallback(() => {
    const cp = currentPlayer;
    const amChallenger = cp?.id === duel.result?.challengerId;
    const isWinner = duel.result?.winnerId === cp?.id;
    const reward = isWinner
      ? (amChallenger ? (duel.result?.challengerReward || 0) : (duel.result?.opponentReward || 0))
      : 0;
    if (amChallenger) {
      actions.resolveEvent({ ok: isWinner, reward });
    }
    // duel terminé
    duel.resetDuel();
    if (amChallenger) handleEventResolve();
  }, [duel, currentPlayer, actions, handleEventResolve]);

  // ===== Emoji reactions =====
  const handleEmojiPress = useCallback((emoji: GameEmoji) => {
    const reaction: EmojiReaction = {
      id: `${currentPlayer?.id ?? 'local'}-${Date.now()}`,
      playerId: currentPlayer?.id ?? '',
      playerName: currentPlayer?.name ?? 'Joueur',
      emoji,
      timestamp: Date.now(),
    };
    setActiveReactions((prev) => [...prev, reaction]);
  }, [currentPlayer]);

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

  const getPlayerCardDiceProps = useCallback((pl: Player) => {
    const isTurn = pl.id === currentPlayer?.id;
    const isHuman = !pl.isAI;
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
      return {
        diceValue: turnState.diceValue,
        isDiceRolling: turnState.isRolling,
        isDiceDisabled: true,
        onRollDice: undefined,
        onDiceComplete: undefined,
      };
    }
    return { diceValue: null, isDiceRolling: false, isDiceDisabled: true, onRollDice: undefined, onDiceComplete: undefined };
  }, [currentPlayer, turnState, diceProps]);

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

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.content, { paddingTop: insets.top + sizes.header, paddingBottom: insets.bottom + sizes.footer }]}>

        {/* Header */}
        <View style={[styles.fixedHeader, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable onPress={() => setShowQuitConfirm(true)} hitSlop={8} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/../assets/images/logostartupludo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Pressable style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Board + PlayerCards */}
        <View style={[styles.boardWrapper, { marginHorizontal: spacing.screen }]}>
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>{renderPlayerCard('yellow')}</View>
            <View style={styles.playerSlot}>{renderPlayerCard('blue')}</View>
          </View>
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
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>{renderPlayerCard('green')}</View>
            <View style={styles.playerSlot}>{renderPlayerCard('red')}</View>
          </View>
        </View>
      </View>

      {/* Emoji bar */}
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

      {/* Quit confirm */}
      <QuitConfirmPopup
        visible={showQuitConfirm}
        onCancel={() => setShowQuitConfirm(false)}
        onConfirm={handleQuit}
        isOnline={false}
      />

      {/* Event popups */}
      <QuizPopup
        key={quizData?.id ?? 'quiz-idle'}
        visible={!!quizData}
        quiz={quizData}
        onAnswer={handleQuizAnswer}
        onClose={() => setQuizData(null)}
        isSpectator={false}
      />
      <FundingPopup
        visible={!!fundingData}
        funding={fundingData}
        onAccept={handleFundingAccept}
        onClose={() => setFundingData(null)}
        isSpectator={false}
      />
      <EventPopup
        visible={!!opportunityData}
        eventType="opportunity"
        event={opportunityData}
        onAccept={handleEventAccept}
        onClose={() => setOpportunityData(null)}
        isSpectator={false}
      />
      <EventPopup
        visible={!!challengeData}
        eventType="challenge"
        event={challengeData}
        onAccept={handleEventAccept}
        onClose={() => setChallengeData(null)}
        isSpectator={false}
      />

      {/* Duel popups */}
      {duel.challenger && (
        <DuelSelectOpponentPopup
          visible={duel.currentPhase === 'select_opponent'}
          opponents={duel.spectators}
          currentPlayer={duel.challenger}
          onSelectOpponent={handleDuelSelectOpponent}
          onClose={() => { duel.resetDuel(); handleEventResolve(); }}
        />
      )}

      {duel.challenger && duel.opponent && (
        <DuelPreparePopup
          visible={duel.currentPhase === 'intro' || duel.currentPhase === 'opponent_prepare'}
          phase={duel.currentPhase === 'intro' ? 'intro' : 'opponent_prepare'}
          challenger={duel.challenger}
          opponent={duel.opponent}
          currentPlayerId={currentPlayer?.id ?? ''}
          onStart={() => duel.startChallengerTurn()}
        />
      )}

      {duel.challenger && duel.opponent && duel.questions.length > 0 && (
        <DuelQuestionPopup
          visible={duel.currentPhase === 'challenger_turn' || duel.currentPhase === 'opponent_turn'}
          questions={duel.questions as DuelQuestion[]}
          onComplete={handleDuelAnswersComplete}
          onClose={handleDuelClose}
        />
      )}

      {duel.result && (
        <DuelResultPopup
          visible={duel.currentPhase === 'result'}
          result={duel.result}
          challenger={duel.challenger}
          opponent={duel.opponent}
          currentPlayerId={currentPlayer?.id ?? ''}
          onClose={handleDuelClose}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C243E' },
  content: { flex: 1 },
  noGame: { flex: 1, backgroundColor: '#0C243E', justifyContent: 'center', alignItems: 'center', gap: 16 },
  noGameText: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: '#FFFFFF' },
  noGameButton: { marginTop: 16 },
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[2],
    backgroundColor: 'rgba(12, 36, 62, 0.85)',
  },
  headerButton: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoContainer: { flex: 1, alignItems: 'center' },
  logoImage: { width: 100, height: 36 },
  boardWrapper: { flex: 1, justifyContent: 'center' },
  playersRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING[2] },
  playerSlot: { flex: 1 },
  boardContainer: { alignItems: 'center' },
  emojiBarFooter: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(12, 36, 62, 0.9)',
    paddingTop: SPACING[2],
    paddingHorizontal: SPACING[3],
  },
  emojiBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
