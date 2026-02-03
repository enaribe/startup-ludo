import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { EventPopup, FundingPopup, QuitConfirmPopup, QuizPopup } from '@/components/game/popups';
import { RadialBackground } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import { AIPlayer } from '@/services/game/AIPlayer';
import { GameEngine } from '@/services/game/GameEngine';
import { useAuthStore, useGameStore, useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeEvent, DuelEvent, FundingEvent, OpportunityEvent, Player, PlayerColor, QuizEvent } from '@/types';

const PAWN_STEP_MS = 80; // Doit correspondre à STEP_DURATION dans Pawn.tsx

export default function PlayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const params = useLocalSearchParams<{ mode?: string; roomId?: string }>();
  const isOnline = params.mode === 'online';
  const userId = useAuthStore((s) => s.user?.id) ?? null;

  // Online game hook (only active in online mode)
  const onlineGame = useOnlineGame(isOnline ? userId : null);

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
  const [_aiMessage, _setAiMessage] = useState<string | null>(null);

  // Event popups state
  const [quizData, setQuizData] = useState<QuizEvent | null>(null);
  const [fundingData, setFundingData] = useState<FundingEvent | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityEvent | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeEvent | null>(null);
  const [duelData, setDuelData] = useState<DuelEvent | null>(null);
  const [duelOpponent, setDuelOpponent] = useState<Player | null>(null);
  const [isEventSpectator, setIsEventSpectator] = useState(false);

  // Remote dice animation tracking: which player is currently rolling remotely
  const [remoteRollingPlayerId, setRemoteRollingPlayerId] = useState<string | null>(null);
  const [remoteDiceValue, setRemoteDiceValue] = useState<number | null>(null);

  // Online disconnection/forfeit state
  const [showDisconnectPopup, setShowDisconnectPopup] = useState(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deferred event: when player rolls 6 and lands on event, defer until 6-chain ends
  const deferredEventRef = useRef<string | null>(null);

  // Refs to break circular dependencies between callbacks
  const handleTriggeredEventRef = useRef<(eventType: string) => void>(() => {});
  const handlePawnPressRef = useRef<(playerId: string, pawnIndex: number) => void>(() => {});

  // AI Player ref
  const aiPlayerRef = useRef<AIPlayer | null>(null);

  const currentPlayer = getCurrentPlayer() ?? null;

  // Initialize AI player
  useEffect(() => {
    if (game && game.mode === 'local') {
      const hasAI = game.players.some((p) => p.isAI);
      if (hasAI && !aiPlayerRef.current) {
        aiPlayerRef.current = new AIPlayer('medium');
      }
    }
  }, [game]);

  // AI turn handler — AI only needs to trigger the dice roll.
  // The auto-move in handleDiceComplete handles movement automatically.
  useEffect(() => {
    if (!game || !currentPlayer?.isAI || isAnimating || game.pendingEvent) return;
    if (game.status !== 'playing') return;

    // Only trigger dice roll — handleDiceComplete will auto-move
    if (!game.diceRolled) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [
    game?.currentPlayerIndex,
    game?.diceRolled,
    game?.pendingEvent,
    game?.status,
    currentPlayer?.isAI,
    isAnimating,
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

  // ===== ONLINE: React to remote dice rolls =====
  useEffect(() => {
    if (!isOnline || !onlineGame.remoteDiceRoll) return;

    const { playerId, value } = onlineGame.remoteDiceRoll;
    setRemoteRollingPlayerId(playerId);
    setRemoteDiceValue(value);

    // Clear rolling state after dice animation time (~1200ms)
    const timer = setTimeout(() => {
      setRemoteRollingPlayerId(null);
      // Keep remoteDiceValue visible until next turn
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOnline, onlineGame.remoteDiceRoll]);

  // ===== ONLINE: React to remote event triggers =====
  useEffect(() => {
    if (!isOnline || !onlineGame.remoteEvent) return;

    const { eventType, eventData } = onlineGame.remoteEvent;
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
      case 'duel':
        setDuelData(eventData as unknown as DuelEvent);
        break;
    }
  }, [isOnline, onlineGame.remoteEvent]);

  // ===== ONLINE: React to remote event result (close popup) =====
  useEffect(() => {
    if (!isOnline || !onlineGame.remoteEventResult) return;

    // Close all spectator popups after a short delay to show the result
    const timer = setTimeout(() => {
      setQuizData(null);
      setFundingData(null);
      setOpportunityData(null);
      setChallengeData(null);
      setDuelData(null);
      setDuelOpponent(null);
      setIsEventSpectator(false);
      onlineGame.clearRemoteEvent();
      onlineGame.clearRemoteEventResult();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isOnline, onlineGame.remoteEventResult]);

  // Clear remote dice value on turn change
  useEffect(() => {
    setRemoteDiceValue(null);
    setRemoteRollingPlayerId(null);
  }, [game?.currentPlayerIndex]);

  // ===== ONLINE: Detect opponent disconnect → forfeit after 30s =====
  useEffect(() => {
    if (!isOnline) return;

    if (onlineGame.opponentDisconnected) {
      setShowDisconnectPopup(true);
      // Auto-win after 30 seconds if opponent doesn't reconnect
      disconnectTimerRef.current = setTimeout(() => {
        if (userId) {
          onlineGame.broadcastWin(userId);
          router.push(`/(game)/results/${game?.id}`);
        }
      }, 30000);
    } else {
      // Opponent reconnected
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
      // Game ended — navigate to results
      const timer = setTimeout(() => {
        router.push(`/(game)/results/${game.id}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, game?.status, game?.winner, game?.id, router]);

  // End turn — defined early so all callbacks can reference it
  const handleEndTurn = useCallback((extra = false) => {
    setAnimating(false);
    clearSelection();
    setDiceValue(null);
    setIsRolling(false);

    // If we have a deferred event (from landing on event square after rolling 6)
    // and the 6-chain just ended (extra=false), trigger it now
    if (!extra && deferredEventRef.current) {
      const eventType = deferredEventRef.current;
      deferredEventRef.current = null;
      // Use ref to avoid circular dependency with handleTriggeredEvent
      handleTriggeredEventRef.current(eventType);
      return;
    }

    if (isOnline) {
      onlineGame.endTurn(extra);
    } else if (extra) {
      grantExtraTurn();
    } else {
      nextTurn();
    }
  }, [clearSelection, nextTurn, grantExtraTurn, setAnimating, isOnline, onlineGame]);

  // Handle dice roll
  const handleRollDice = useCallback((): number => {
    if (!canRollDice()) return 0;
    if (isOnline && !onlineGame.isMyTurn) return 0;

    setIsRolling(true);
    const value = isOnline ? onlineGame.rollDice() : rollDice();
    setDiceValue(value);

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    return value;
  }, [canRollDice, rollDice, hapticsEnabled, isOnline, onlineGame]);

  // Handle exiting a pawn from home
  const handleExitHome = useCallback((pawnIndex: number) => {
    if (!currentPlayer || !canExitHome) return;

    // Capture dice value NOW before any async operations
    const rolledSix = game?.diceValue === 6;

    setAnimating(true);
    const result = isOnline ? onlineGame.exitHome(pawnIndex) : exitHome(pawnIndex);

    const animDelay = result?.path?.length
      ? result.path.length * PAWN_STEP_MS + 150
      : 400;

    if (result) {
      // Handle capture at start position (after animation)
      if (result.capturedPawn) {
        setTimeout(() => {
          if (isOnline) {
            onlineGame.broadcastCapture(result.capturedPawn!.playerId, result.capturedPawn!.pawnIndex);
          } else {
            handleCapture(result.capturedPawn!.playerId, result.capturedPawn!.pawnIndex);
          }
          if (hapticsEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }, animDelay);
      }

      // Handle triggered event (after animation)
      // If rolled 6, defer event until the extra turn chain ends
      if (result.triggeredEvent) {
        if (rolledSix) {
          deferredEventRef.current = result.triggeredEvent;
        } else {
          setTimeout(() => {
            handleTriggeredEventRef.current(result.triggeredEvent!);
            setAnimating(false);
          }, animDelay);
          return;
        }
      }
    }

    setTimeout(() => {
      handleEndTurn(rolledSix);
    }, animDelay);
  }, [currentPlayer, canExitHome, exitHome, game, handleCapture, hapticsEnabled, handleEndTurn, setAnimating, isOnline, onlineGame]);

  // Handle dice roll complete
  const handleDiceComplete = useCallback(
    (value: number) => {
      setIsRolling(false);
      setDiceValue(value);

      // Check for rolled 6
      if (value === 6 && hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // With 1 pawn per player, auto-execute the move
      const moves = getValidMoves();
      if (moves.length >= 1) {
        const move = moves[0]!;
        if (move.type === 'exit') {
          setTimeout(() => handleExitHome(move.pawnIndex), 500);
        } else if (move.type === 'move') {
          // Auto-execute: select then immediately move via ref
          selectPawn(move.pawnIndex);
          setTimeout(() => handlePawnPressRef.current(currentPlayer?.id || '', move.pawnIndex), 500);
        }
      } else {
        // No valid moves - end turn
        setTimeout(() => handleEndTurn(), 1500);
      }
    },
    [getValidMoves, hapticsEnabled, selectPawn, handleEndTurn, handleExitHome, currentPlayer]
  );

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
        // Capture dice value NOW before any async operations
        const rolledSix = game.diceValue === 6;

        // Execute move (online or local)
        setAnimating(true);
        const result = isOnline ? onlineGame.movePawn(pawnIndex) : executeMove(pawnIndex);

        // Step-by-step animation duration
        const animDelay = result?.path?.length
          ? result.path.length * PAWN_STEP_MS + 150
          : 400;

        if (result) {
          // Handle capture (after animation)
          if (result.capturedPawn) {
            setTimeout(() => {
              if (isOnline) {
                onlineGame.broadcastCapture(result.capturedPawn!.playerId, result.capturedPawn!.pawnIndex);
              } else {
                handleCapture(result.capturedPawn!.playerId, result.capturedPawn!.pawnIndex);
              }
              if (hapticsEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }, animDelay);
          }

          // Handle finish - no extra turn even on 6
          if (result.isFinished) {
            setTimeout(() => {
              if (checkWinCondition(playerId)) {
                if (isOnline) {
                  onlineGame.broadcastWin(playerId);
                } else {
                  endGame(playerId);
                }
                router.push(`/(game)/results/${game.id}`);
              }
            }, animDelay);
            return;
          }

          // Handle triggered event (after animation)
          // If rolled 6, defer event until the extra turn chain ends
          if (result.triggeredEvent) {
            if (rolledSix) {
              deferredEventRef.current = result.triggeredEvent;
            } else {
              setTimeout(() => {
                handleTriggeredEventRef.current(result.triggeredEvent!);
                setAnimating(false);
              }, animDelay);
              return;
            }
          }
        }

        setTimeout(() => {
          handleEndTurn(rolledSix && !result?.isFinished);
        }, animDelay);
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
      selectPawn,
      setHighlightedPositions,
      hapticsEnabled,
      handleExitHome,
      handleEndTurn,
      setAnimating,
      isOnline,
      onlineGame,
      router,
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
      setIsEventSpectator(false); // Active player, not spectator

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
    [game, currentPlayer, triggerEvent, handleEndTurn, isOnline, onlineGame]
  );

  // Keep refs in sync with the latest callback versions
  useEffect(() => { handleTriggeredEventRef.current = handleTriggeredEvent; }, [handleTriggeredEvent]);
  useEffect(() => { handlePawnPressRef.current = handlePawnPress; }, [handlePawnPress]);

  // Event handlers — resolve locally and broadcast result in online mode
  const handleQuizAnswer = useCallback(
    (correct: boolean, reward: number) => {
      if (isOnline) {
        onlineGame.resolveEvent({ ok: correct, reward });
      } else {
        if (currentPlayer && correct) {
          addTokens(currentPlayer.id, reward);
        }
        resolveEvent();
      }
      setQuizData(null);
      handleEndTurn();
    },
    [currentPlayer, addTokens, resolveEvent, handleEndTurn, isOnline, onlineGame]
  );

  const handleFundingAccept = useCallback(
    (amount: number) => {
      if (isOnline) {
        onlineGame.resolveEvent({ ok: true, reward: amount });
      } else {
        if (currentPlayer) {
          addTokens(currentPlayer.id, amount);
        }
        resolveEvent();
      }
      setFundingData(null);
      handleEndTurn();
    },
    [currentPlayer, addTokens, resolveEvent, handleEndTurn, isOnline, onlineGame]
  );

  const handleEventAccept = useCallback(
    (value: number, effect: string) => {
      if (!currentPlayer) return;

      const isPositive = effect === 'tokens';
      if (isOnline) {
        onlineGame.resolveEvent({ ok: isPositive, reward: value });
      } else {
        if (isPositive) {
          addTokens(currentPlayer.id, value);
        } else {
          removeTokens(currentPlayer.id, value);
        }
        resolveEvent();
      }

      setOpportunityData(null);
      setChallengeData(null);
      handleEndTurn();
    },
    [currentPlayer, addTokens, removeTokens, resolveEvent, handleEndTurn, isOnline, onlineGame]
  );

  const handleDuelAnswer = useCallback(
    (won: boolean, stake: number) => {
      if (!currentPlayer) return;

      if (isOnline) {
        onlineGame.resolveEvent({ ok: won, reward: stake });
      } else {
        if (won) {
          addTokens(currentPlayer.id, stake);
        } else {
          removeTokens(currentPlayer.id, stake);
        }
        resolveEvent();
      }

      setDuelData(null);
      setDuelOpponent(null);
      handleEndTurn();
    },
    [currentPlayer, addTokens, removeTokens, resolveEvent, handleEndTurn, isOnline, onlineGame]
  );

  // Handle quit
  const handleQuit = useCallback(() => {
    setShowQuitConfirm(false);
    if (isOnline) {
      onlineGame.forfeit();
    }
    router.replace('/(tabs)/home');
  }, [router, isOnline, onlineGame]);

  // Handle pawn move animation complete
  const handlePawnMoveComplete = useCallback(() => {
    console.log('[PlayScreen] Pawn animation completed');
  }, []);

  // ===== RESPONSIVE: Tablet + rotation support =====
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;

  // Calculate optimal board size based on available space
  const headerHeight = insets.top + 72;
  const sideColumnWidth = isTablet ? 180 : 130;
  let computedBoardSize: number;

  if (isLandscape) {
    // Landscape: board height-constrained, players on sides
    const availableHeight = windowHeight - headerHeight - insets.bottom - SPACING[4] * 2;
    const availableWidth = windowWidth - sideColumnWidth * 2 - SPACING[3] * 4;
    computedBoardSize = Math.min(availableHeight, availableWidth);
  } else {
    // Portrait: board fills width, height constrained by player rows
    const playerRowHeight = isTablet ? 72 : 60;
    const verticalChrome = headerHeight + insets.bottom + playerRowHeight * 2 + SPACING[4] * 2;
    const availableHeight = windowHeight - verticalChrome;
    const availableWidth = windowWidth - SPACING[2] * 2 - SPACING[1] * 2;
    computedBoardSize = Math.min(availableWidth, availableHeight);
  }
  // Ensure minimum playable size
  computedBoardSize = Math.max(computedBoardSize, 280);

  // Helper: render a PlayerCard for a given color (avoids 4x copy-paste)
  const renderPlayerCard = (playerColor: PlayerColor) => {
    const pl = game?.players.find(p => p.color === playerColor);
    if (!pl) return null;

    const isTurn = pl.id === currentPlayer?.id;
    const isRemoteRolling = remoteRollingPlayerId === pl.id;
    // En solo/local: tout joueur humain peut interagir
    // En online: seul le joueur authentifié peut interagir
    const canInteract = isOnline ? (pl.id === userId) : !pl.isAI;

    return (
      <PlayerCard
        player={pl}
        isCurrentTurn={isTurn}
        diceValue={canInteract && isTurn ? diceValue : isRemoteRolling ? remoteDiceValue : isTurn ? (game?.diceValue ?? null) : null}
        isDiceRolling={canInteract && isTurn ? isRolling : isRemoteRolling}
        isDiceDisabled={!canInteract || !isTurn || !canRollDice()}
        onRollDice={canInteract && isTurn ? handleRollDice : undefined}
        onDiceComplete={canInteract && isTurn ? handleDiceComplete : undefined}
      />
    );
  };

  // Pre-build GameBoard element (same in both layouts)
  const gameBoardElement = game ? (
    <GameBoard
      size={computedBoardSize}
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
  ) : null;

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

        {/* Board + Players — responsive layout */}
        {isLandscape ? (
          /* LANDSCAPE: players on left/right, board centered */
          <View style={styles.landscapeContainer}>
            {/* Left column: Yellow (top-left) + Green (bottom-left) */}
            <View style={[styles.landscapeSide, { width: sideColumnWidth }]}>
              <View style={styles.landscapePlayerSlot}>{renderPlayerCard('yellow')}</View>
              <View style={styles.landscapePlayerSlot}>{renderPlayerCard('green')}</View>
            </View>

            {/* Board */}
            <View style={styles.boardContainer}>
              {gameBoardElement}
            </View>

            {/* Right column: Blue (top-right) + Red (bottom-right) */}
            <View style={[styles.landscapeSide, { width: sideColumnWidth }]}>
              <View style={styles.landscapePlayerSlot}>{renderPlayerCard('blue')}</View>
              <View style={styles.landscapePlayerSlot}>{renderPlayerCard('red')}</View>
            </View>
          </View>
        ) : (
          /* PORTRAIT: players above/below board */
          <View style={styles.boardWrapper}>
            <View style={styles.playersRow}>
              <View style={styles.playerSlot}>{renderPlayerCard('yellow')}</View>
              <View style={styles.playerSlot}>{renderPlayerCard('blue')}</View>
            </View>

            <View style={styles.boardContainer}>
              {gameBoardElement}
            </View>

            <View style={styles.playersRow}>
              <View style={styles.playerSlot}>{renderPlayerCard('green')}</View>
              <View style={styles.playerSlot}>{renderPlayerCard('red')}</View>
            </View>
          </View>
        )}
      </View>

      {/* Quit Confirmation Popup (design system) */}
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

      {/* Duel popups - temporairement désactivé jusqu'à implémentation complète */}
      {duelData && currentPlayer && duelOpponent && (
        <View>
          {/* TODO: Implémenter les popups de duel appropriés selon l'état */}
        </View>
      )}
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
  // Portrait layout
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
  // Landscape layout (tablets + rotation)
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[3],
    gap: SPACING[2],
  },
  landscapeSide: {
    justifyContent: 'center',
    gap: SPACING[2],
  },
  landscapePlayerSlot: {
    width: '100%',
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
