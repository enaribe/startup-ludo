import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { DuelPopup, EventPopup, FundingPopup, QuizPopup } from '@/components/game/popups';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RadialBackground } from '@/components/ui';
import { AIPlayer } from '@/services/game/AIPlayer';
import { GameEngine } from '@/services/game/GameEngine';
import { useGameStore, useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeEvent, DuelEvent, FundingEvent, OpportunityEvent, Player, QuizEvent } from '@/types';

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  // Game store
  const {
    game,
    selectedPawnIndex,
    highlightedPositions,
    isAnimating,
    rollDice,
    getCurrentPlayer,
    canRollDice,
    canMove,
    selectPawn,
    setHighlightedPositions,
    clearSelection,
    setAnimating,
    executeMove,
    exitHome,
    handleCapture,
    checkWinCondition,
    getValidMoves,
    triggerEvent,
    resolveEvent,
    addTokens,
    removeTokens,
    nextTurn,
    grantExtraTurn,
    endGame,
  } = useGameStore();

  // Local state
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [_aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  // Event popups state
  const [quizData, setQuizData] = useState<QuizEvent | null>(null);
  const [fundingData, setFundingData] = useState<FundingEvent | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityEvent | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeEvent | null>(null);
  const [duelData, setDuelData] = useState<DuelEvent | null>(null);
  const [duelOpponent, setDuelOpponent] = useState<Player | null>(null);

  // AI Player ref
  const aiPlayerRef = useRef<AIPlayer | null>(null);

  const currentPlayer = getCurrentPlayer();

  // Initialize AI player
  useEffect(() => {
    if (game && game.mode === 'local') {
      const hasAI = game.players.some((p) => p.isAI);
      if (hasAI && !aiPlayerRef.current) {
        aiPlayerRef.current = new AIPlayer('medium');
      }
    }
  }, [game]);

  // AI turn handler - Fixed dependencies and added guard
  useEffect(() => {
    // Guard conditions
    if (!game || !currentPlayer?.isAI || isAnimating || game.pendingEvent || isAIPlaying) return;

    const handleAITurn = async () => {
      if (!aiPlayerRef.current) {
        aiPlayerRef.current = new AIPlayer('medium');
      }

      // Check if AI can roll dice
      const canAIRoll = game.status === 'playing' && !game.diceRolled && !game.pendingEvent && !isAnimating;

      if (canAIRoll) {
        setIsAIPlaying(true);
        setTimeout(() => {
          handleRollDice();
          setIsAIPlaying(false);
        }, 1000);
        return;
      }

      // Check if AI can move
      const canAIMove = game.status === 'playing' && game.diceRolled && !game.pendingEvent && !isAnimating;

      if (canAIMove && game.diceValue !== null) {
        setIsAIPlaying(true);

        const decision = await aiPlayerRef.current.makeDecision(
          currentPlayer,
          game.diceValue,
          game.players
        );

        setAiMessage(decision.reasoning);

        setTimeout(() => {
          if (decision.type === 'exit' && decision.pawnIndex !== undefined) {
            handleExitHome(decision.pawnIndex);
          } else if (decision.type === 'move' && decision.pawnIndex !== undefined) {
            handlePawnPress(currentPlayer.id, decision.pawnIndex);
          } else {
            // No valid moves, skip turn
            handleEndTurn();
          }

          setTimeout(() => {
            setAiMessage(null);
            setIsAIPlaying(false);
          }, 2000);
        }, 1500);
      }
    };

    handleAITurn();
  }, [
    game?.currentPlayerIndex,
    game?.diceValue,
    game?.diceRolled,
    game?.pendingEvent,
    game?.status,
    currentPlayer?.isAI,
    isAnimating,
    isAIPlaying,
  ]);

  // Get valid moves when dice is rolled
  const validMoves = useMemo(() => {
    if (!game || !game.diceRolled) return [];
    return getValidMoves();
  }, [game, game?.diceRolled, getValidMoves]);

  // Check if player can exit home
  const canExitHome = useMemo(() => {
    if (!currentPlayer || !game?.diceValue) return false;
    return GameEngine.canExitHome(currentPlayer, game.diceValue);
  }, [currentPlayer, game?.diceValue]);

  // Handle dice roll
  const handleRollDice = useCallback(() => {
    if (!canRollDice()) return;

    setIsRolling(true);
    const value = rollDice();
    setDiceValue(value);

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [canRollDice, rollDice, hapticsEnabled]);

  // Handle dice roll complete
  const handleDiceComplete = useCallback(
    (value: number) => {
      setIsRolling(false);
      setDiceValue(value);

      // Check for rolled 6
      if (value === 6 && hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Auto-select if only one valid move
      const moves = getValidMoves();
      if (moves.length === 1) {
        const move = moves[0]!;
        if (move.type === 'exit') {
          setTimeout(() => handleExitHome(move.pawnIndex), 500);
        } else if (move.type === 'move') {
          selectPawn(move.pawnIndex);
        }
      } else if (moves.length === 0) {
        // No valid moves - show message and end turn
        setTimeout(() => handleEndTurn(), 1500);
      }
    },
    [getValidMoves, hapticsEnabled, selectPawn]
  );

  // Handle exiting a pawn from home
  const handleExitHome = useCallback((pawnIndex: number) => {
    if (!currentPlayer || !canExitHome) return;

    setAnimating(true);
    const result = exitHome(pawnIndex);

    if (result) {
      // Handle capture at start position
      if (result.capturedPawn) {
        handleCapture(result.capturedPawn.playerId, result.capturedPawn.pawnIndex);
        if (hapticsEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Handle triggered event
      if (result.triggeredEvent) {
        handleTriggeredEvent(result.triggeredEvent);
        setTimeout(() => setAnimating(false), 800);
        return;
      }
    }

    setTimeout(() => {
      setAnimating(false);
      clearSelection();

      // Rolled 6 = extra turn
      if (game?.diceValue === 6) {
        grantExtraTurn();
      } else {
        handleEndTurn();
      }
    }, 800);
  }, [currentPlayer, canExitHome, exitHome, game, handleCapture, hapticsEnabled, clearSelection, grantExtraTurn]);

  // Handle pawn selection/movement
  const handlePawnPress = useCallback(
    (playerId: string, pawnIndex: number) => {
      if (!game || !currentPlayer || playerId !== currentPlayer.id || !canMove()) return;

      // Check if this pawn can move
      const move = validMoves.find((m) => m.pawnIndex === pawnIndex);
      if (!move) return;

      // If it's an exit move
      if (move.type === 'exit') {
        handleExitHome(pawnIndex);
        return;
      }

      if (selectedPawnIndex === pawnIndex) {
        // Execute move
        setAnimating(true);
        const result = executeMove(pawnIndex);

        if (result) {
          // Handle capture
          if (result.capturedPawn) {
            handleCapture(result.capturedPawn.playerId, result.capturedPawn.pawnIndex);
            if (hapticsEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }

          // Handle finish
          if (result.isFinished) {
            // Check win condition
            if (checkWinCondition(playerId)) {
              endGame(playerId);
              router.push(`/(game)/results/${game.id}`);
              return;
            }
          }

          // Handle triggered event
          if (result.triggeredEvent) {
            handleTriggeredEvent(result.triggeredEvent);
            setTimeout(() => setAnimating(false), 800);
            return;
          }
        }

        setTimeout(() => {
          setAnimating(false);
          clearSelection();

          // Rolled 6 = extra turn
          if (game?.diceValue === 6) {
            grantExtraTurn();
          } else {
            handleEndTurn();
          }
        }, 800);
      } else {
        // Select pawn and highlight destination
        selectPawn(pawnIndex);

        // Build highlighted positions
        if (move.result.newState.status === 'circuit') {
          setHighlightedPositions([{
            type: 'circuit',
            position: move.result.newState.position,
          }]);
        } else if (move.result.newState.status === 'final') {
          setHighlightedPositions([{
            type: 'final',
            position: move.result.newState.position,
            color: currentPlayer.color,
          }]);
        }
      }
    },
    [
      game,
      currentPlayer,
      canMove,
      validMoves,
      selectedPawnIndex,
      executeMove,
      handleCapture,
      checkWinCondition,
      endGame,
      clearSelection,
      selectPawn,
      setHighlightedPositions,
      hapticsEnabled,
      grantExtraTurn,
      handleExitHome,
    ]
  );

  // Handle triggered events
  const handleTriggeredEvent = useCallback(
    (eventType: string) => {
      const event = GameEngine.generateEvent(eventType as any, game?.edition || 'startup');
      if (!event) {
        handleEndTurn();
        return;
      }

      triggerEvent(event);

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
        case 'duel':
          setDuelData(event.data as DuelEvent);
          // Select random opponent for duel
          const opponents = game?.players.filter((p) => p.id !== currentPlayer?.id) || [];
          if (opponents.length > 0) {
            const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
            if (randomOpponent) {
              setDuelOpponent(randomOpponent);
            }
          }
          break;
      }
    },
    [game, currentPlayer, triggerEvent]
  );

  // Event handlers
  const handleQuizAnswer = useCallback(
    (correct: boolean, reward: number) => {
      if (currentPlayer && correct) {
        addTokens(currentPlayer.id, reward);
      }
      setQuizData(null);
      resolveEvent();
      handleEndTurn();
    },
    [currentPlayer, addTokens, resolveEvent]
  );

  const handleFundingAccept = useCallback(
    (amount: number) => {
      if (currentPlayer) {
        addTokens(currentPlayer.id, amount);
      }
      setFundingData(null);
      resolveEvent();
      handleEndTurn();
    },
    [currentPlayer, addTokens, resolveEvent]
  );

  const handleEventAccept = useCallback(
    (value: number, effect: string) => {
      if (!currentPlayer) return;

      switch (effect) {
        case 'tokens':
          addTokens(currentPlayer.id, value);
          break;
        case 'loseTokens':
          removeTokens(currentPlayer.id, value);
          break;
      }

      setOpportunityData(null);
      setChallengeData(null);
      resolveEvent();
      handleEndTurn();
    },
    [currentPlayer, addTokens, removeTokens, resolveEvent]
  );

  const handleDuelAnswer = useCallback(
    (won: boolean, stake: number) => {
      if (!currentPlayer) return;

      if (won) {
        addTokens(currentPlayer.id, stake);
      } else {
        removeTokens(currentPlayer.id, stake);
      }

      setDuelData(null);
      setDuelOpponent(null);
      resolveEvent();
      handleEndTurn();
    },
    [currentPlayer, addTokens, removeTokens, resolveEvent]
  );

  // End turn
  const handleEndTurn = useCallback(() => {
    clearSelection();
    setDiceValue(null);
    nextTurn();
  }, [clearSelection, nextTurn]);

  // Handle quit
  const handleQuit = useCallback(() => {
    setShowQuitConfirm(false);
    router.replace('/(tabs)/home');
  }, [router]);

  // Handle pawn move animation complete
  const handlePawnMoveComplete = useCallback(() => {
    // Animation completed
  }, []);

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

  return (
    <View style={styles.container}>
      <RadialBackground />
      <View style={[styles.content, { paddingTop: insets.top + 72, paddingBottom: insets.bottom }]}>
        {/* Fixed Header: Back, Logo Startupludo, Settings (design system: bg #0A1929) */}
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

        {/* Semi-transparent container: PlayerCards + Board */}
        <View style={styles.boardWrapper}>
          {/* Top Players Row — yellow (top-left) and blue (top-right) */}
          <View style={styles.playersRow}>
            {/* Top-left slot: yellow */}
            <View style={styles.playerSlot}>
              {game.players.find(p => p.color === 'yellow') && (
                <PlayerCard
                  player={game.players.find(p => p.color === 'yellow')!}
                  isCurrentTurn={game.players.find(p => p.color === 'yellow')!.id === currentPlayer?.id}
                  diceValue={game.players.find(p => p.color === 'yellow')!.id === currentPlayer?.id ? diceValue : (game.diceValue ?? null)}
                  isDiceRolling={game.players.find(p => p.color === 'yellow')!.id === currentPlayer?.id ? isRolling : false}
                  isDiceDisabled={game.players.find(p => p.color === 'yellow')!.id !== currentPlayer?.id || !canRollDice() || !!game.players.find(p => p.color === 'yellow')!.isAI}
                  onRollDice={game.players.find(p => p.color === 'yellow')!.id === currentPlayer?.id ? () => rollDice() : undefined}
                  onDiceComplete={game.players.find(p => p.color === 'yellow')!.id === currentPlayer?.id ? handleDiceComplete : undefined}
                />
              )}
            </View>
            {/* Top-right slot: blue */}
            <View style={styles.playerSlot}>
              {game.players.find(p => p.color === 'blue') && (
                <PlayerCard
                  player={game.players.find(p => p.color === 'blue')!}
                  isCurrentTurn={game.players.find(p => p.color === 'blue')!.id === currentPlayer?.id}
                  diceValue={game.players.find(p => p.color === 'blue')!.id === currentPlayer?.id ? diceValue : (game.diceValue ?? null)}
                  isDiceRolling={game.players.find(p => p.color === 'blue')!.id === currentPlayer?.id ? isRolling : false}
                  isDiceDisabled={game.players.find(p => p.color === 'blue')!.id !== currentPlayer?.id || !canRollDice() || !!game.players.find(p => p.color === 'blue')!.isAI}
                  onRollDice={game.players.find(p => p.color === 'blue')!.id === currentPlayer?.id ? () => rollDice() : undefined}
                  onDiceComplete={game.players.find(p => p.color === 'blue')!.id === currentPlayer?.id ? handleDiceComplete : undefined}
                />
              )}
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
            {/* Bottom-left slot: green */}
            <View style={styles.playerSlot}>
              {game.players.find(p => p.color === 'green') && (
                <PlayerCard
                  player={game.players.find(p => p.color === 'green')!}
                  isCurrentTurn={game.players.find(p => p.color === 'green')!.id === currentPlayer?.id}
                  diceValue={game.players.find(p => p.color === 'green')!.id === currentPlayer?.id ? diceValue : (game.diceValue ?? null)}
                  isDiceRolling={game.players.find(p => p.color === 'green')!.id === currentPlayer?.id ? isRolling : false}
                  isDiceDisabled={game.players.find(p => p.color === 'green')!.id !== currentPlayer?.id || !canRollDice() || !!game.players.find(p => p.color === 'green')!.isAI}
                  onRollDice={game.players.find(p => p.color === 'green')!.id === currentPlayer?.id ? () => rollDice() : undefined}
                  onDiceComplete={game.players.find(p => p.color === 'green')!.id === currentPlayer?.id ? handleDiceComplete : undefined}
                />
              )}
            </View>
            {/* Bottom-right slot: red */}
            <View style={styles.playerSlot}>
              {game.players.find(p => p.color === 'red') && (
                <PlayerCard
                  player={game.players.find(p => p.color === 'red')!}
                  isCurrentTurn={game.players.find(p => p.color === 'red')!.id === currentPlayer?.id}
                  diceValue={game.players.find(p => p.color === 'red')!.id === currentPlayer?.id ? diceValue : (game.diceValue ?? null)}
                  isDiceRolling={game.players.find(p => p.color === 'red')!.id === currentPlayer?.id ? isRolling : false}
                  isDiceDisabled={game.players.find(p => p.color === 'red')!.id !== currentPlayer?.id || !canRollDice() || !!game.players.find(p => p.color === 'red')!.isAI}
                  onRollDice={game.players.find(p => p.color === 'red')!.id === currentPlayer?.id ? () => rollDice() : undefined}
                  onDiceComplete={game.players.find(p => p.color === 'red')!.id === currentPlayer?.id ? handleDiceComplete : undefined}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Quit Confirmation Modal */}
      <Modal visible={showQuitConfirm} onClose={() => setShowQuitConfirm(false)}>
        {/* ... existing modal ... */}
        <View style={styles.modalContent}>
          <Ionicons name="warning" size={48} color={COLORS.warning} />
          <Text style={styles.modalTitle}>Quitter la partie ?</Text>
          <Text style={styles.modalText}>
            Ta progression sera perdue si tu quittes maintenant.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              title="Annuler"
              variant="secondary"
              onPress={() => setShowQuitConfirm(false)}
              style={styles.modalButton}
            />
            <Button
              title="Quitter"
              variant="primary"
              onPress={handleQuit}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Event Popups */}
      {/* ... existing popups ... */}
      <QuizPopup
        visible={!!quizData}
        quiz={quizData}
        onAnswer={handleQuizAnswer}
        onClose={() => setQuizData(null)}
      />

      <FundingPopup
        visible={!!fundingData}
        funding={fundingData}
        onAccept={handleFundingAccept}
        onClose={() => setFundingData(null)}
      />

      <EventPopup
        visible={!!opportunityData}
        eventType="opportunity"
        event={opportunityData}
        onAccept={handleEventAccept}
        onClose={() => setOpportunityData(null)}
      />

      <EventPopup
        visible={!!challengeData}
        eventType="challenge"
        event={challengeData}
        onAccept={handleEventAccept}
        onClose={() => setChallengeData(null)}
      />

      <DuelPopup
        visible={!!duelData}
        duel={duelData}
        currentPlayer={currentPlayer}
        opponent={duelOpponent}
        onAnswer={handleDuelAnswer}
        onClose={() => {
          setDuelData(null);
          setDuelOpponent(null);
        }}
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
  // Keep existing modal styles
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
  // Missing styles from original file to avoid errors
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    backgroundColor: `${COLORS.info}20`,
    marginHorizontal: SPACING[4],
    borderRadius: 8,
    marginBottom: SPACING[2],
  },
  aiMessageText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
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
