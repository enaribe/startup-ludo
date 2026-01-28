import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Dice } from '@/components/game/Dice';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { DuelPopup, EventPopup, FundingPopup, QuizPopup } from '@/components/game/popups';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  const [aiMessage, setAiMessage] = useState<string | null>(null);
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
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.turnText}>Tour {game.currentTurn}</Text>
            {game.diceValue === 6 && (
              <View style={styles.extraTurnBadge}>
                <Ionicons name="reload" size={12} color={COLORS.white} />
                <Text style={styles.extraTurnText}>+1</Text>
              </View>
            )}
          </View>
          <Button
            title="Quitter"
            variant="ghost"
            size="sm"
            onPress={() => setShowQuitConfirm(true)}
          />
        </Animated.View>

        {/* Player Cards - Compact Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playersContainer}
        >
          {game.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={player.id === currentPlayer?.id}
              isCompact
            />
          ))}
        </ScrollView>

        {/* AI Message */}
        {aiMessage && (
          <Animated.View entering={SlideInDown} style={styles.aiMessageContainer}>
            <Ionicons name="hardware-chip" size={16} color={COLORS.info} />
            <Text style={styles.aiMessageText}>{aiMessage}</Text>
          </Animated.View>
        )}

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

        {/* Bottom Controls */}
        <View style={styles.controls}>
          {currentPlayer && (
            <>
              <Text style={styles.currentPlayerText}>
                Tour de{' '}
                <Text style={[styles.playerNameText, { color: COLORS.players[currentPlayer.color] }]}>
                  {currentPlayer.name}
                </Text>
                {currentPlayer.isAI && ' (IA)'}
              </Text>

              {/* Dice */}
              <Dice
                value={diceValue}
                isRolling={isRolling}
                disabled={!canRollDice() || currentPlayer.isAI}
                size={80}
                onRoll={() => rollDice()}
                onRollComplete={handleDiceComplete}
              />

              {/* Action Buttons */}
              {canMove() && !currentPlayer.isAI && (
                <View style={styles.actionButtons}>
                  {canExitHome && (
                    <Button
                      title="Sortir un pion"
                      variant="primary"
                      size="md"
                      leftIcon={<Ionicons name="exit" size={18} color={COLORS.white} />}
                      onPress={() => {
                        // Find first pawn at home
                        const homeIndex = currentPlayer.pawns.findIndex(p => p.status === 'home');
                        if (homeIndex !== -1) {
                          handleExitHome(homeIndex);
                        }
                      }}
                    />
                  )}

                  {validMoves.length === 0 && !canExitHome && (
                    <Text style={styles.noMovesText}>Aucun mouvement possible</Text>
                  )}

                  {selectedPawnIndex !== null && (
                    <Button
                      title="Déplacer"
                      variant="primary"
                      size="md"
                      leftIcon={<Ionicons name="arrow-forward" size={18} color={COLORS.white} />}
                      onPress={() => handlePawnPress(currentPlayer.id, selectedPawnIndex)}
                    />
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {/* Quit Confirmation Modal */}
      <Modal visible={showQuitConfirm} onClose={() => setShowQuitConfirm(false)}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  turnText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  extraTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  extraTurnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  playersContainer: {
    paddingHorizontal: SPACING[3],
    gap: SPACING[2],
  },
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
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  controls: {
    padding: SPACING[4],
    alignItems: 'center',
    gap: SPACING[3],
  },
  currentPlayerText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  playerNameText: {
    fontFamily: FONTS.bodySemiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[2],
  },
  noMovesText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  noGame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  noGameText: {
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  noGameButton: {
    marginTop: SPACING[4],
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
});
