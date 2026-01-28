import { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  FadeIn,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import type { DuelEvent, Player } from '@/types';

interface DuelPopupProps {
  visible: boolean;
  duel: DuelEvent | null;
  currentPlayer: Player | null;
  opponent: Player | null;
  onAnswer: (won: boolean, stake: number) => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DuelPopup = memo(function DuelPopup({
  visible,
  duel,
  currentPlayer,
  opponent,
  onAnswer,
  onClose,
}: DuelPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const [phase, setPhase] = useState<'intro' | 'question' | 'result'>('intro');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [opponentAnswer, setOpponentAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(15);

  // Animation values
  const vsScale = useSharedValue(0);
  const vsRotate = useSharedValue(0);
  const timerProgress = useSharedValue(1);
  const resultScale = useSharedValue(0);

  // Reset state when duel changes
  useEffect(() => {
    if (visible && duel) {
      setPhase('intro');
      setSelectedAnswer(null);
      setOpponentAnswer(null);
      setTimeRemaining(15);
      timerProgress.value = 1;
      resultScale.value = 0;

      // VS animation
      vsScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.5, { duration: 300, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 8 })
      );

      vsRotate.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 100 }),
          withTiming(5, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        3,
        false
      );

      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      // Auto transition to question phase
      const timer = setTimeout(() => {
        setPhase('question');
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duel, vsScale, vsRotate, timerProgress, resultScale, hapticsEnabled]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'question' || selectedAnswer !== null || !duel) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerProgress.value = withTiming(0, { duration: 15000 });

    return () => clearInterval(interval);
  }, [phase, selectedAnswer, duel, timerProgress]);

  const handleTimeUp = useCallback(() => {
    if (selectedAnswer !== null) return;

    // Time's up = automatic loss
    setSelectedAnswer(-1); // No answer
    simulateOpponentAnswer();
  }, [selectedAnswer]);

  const simulateOpponentAnswer = useCallback(() => {
    if (!duel || !opponent) return;

    // AI opponent answers after 1-3 seconds
    const delay = opponent.isAI ? 500 + Math.random() * 1500 : 1000 + Math.random() * 2000;

    setTimeout(() => {
      // AI has 60% chance of correct answer
      const aiCorrect = Math.random() < (opponent.isAI ? 0.6 : 0.5);
      const aiAnswer = aiCorrect ? duel.correctAnswer : (duel.correctAnswer + 1) % duel.options.length;
      setOpponentAnswer(aiAnswer);
    }, delay);
  }, [duel, opponent]);

  // Check result when both have answered
  useEffect(() => {
    if (selectedAnswer !== null && opponentAnswer !== null && duel) {
      const playerCorrect = selectedAnswer === duel.correctAnswer;
      const opponentCorrect = opponentAnswer === duel.correctAnswer;

      // Determine winner
      let playerWon = false;
      if (playerCorrect && !opponentCorrect) {
        playerWon = true;
      } else if (!playerCorrect && opponentCorrect) {
        playerWon = false;
      } else {
        // Both correct or both wrong - faster answer wins (player wins ties)
        playerWon = playerCorrect;
      }

      resultScale.value = withSpring(1);
      setPhase('result');

      if (hapticsEnabled) {
        if (playerWon) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      // Delay before closing
      setTimeout(() => {
        onAnswer(playerWon, duel.stake);
      }, 2500);
    }
  }, [selectedAnswer, opponentAnswer, duel, hapticsEnabled, onAnswer, resultScale]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null || phase !== 'question') return;

      setSelectedAnswer(index);

      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      simulateOpponentAnswer();
    },
    [selectedAnswer, phase, hapticsEnabled, simulateOpponentAnswer]
  );

  const vsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: vsScale.value }, { rotate: `${vsRotate.value}deg` }],
  }));

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  if (!duel || !currentPlayer || !opponent) return null;

  const playerCorrect = selectedAnswer === duel.correctAnswer;
  const opponentCorrect = opponentAnswer === duel.correctAnswer;
  const playerWon = playerCorrect && !opponentCorrect;
  const isDraw = playerCorrect === opponentCorrect;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false}>
      <Animated.View entering={SlideInUp.springify()} style={styles.container}>
        {/* Intro phase - VS screen */}
        {phase === 'intro' && (
          <View style={styles.introContainer}>
            <Animated.View entering={SlideInLeft.springify()} style={styles.playerSide}>
              <Avatar
                name={currentPlayer.name}
                playerColor={currentPlayer.color}
                size="lg"
                showBorder
              />
              <Text style={styles.playerName}>{currentPlayer.name}</Text>
            </Animated.View>

            <Animated.View style={[styles.vsContainer, vsStyle]}>
              <Text style={styles.vsText}>VS</Text>
            </Animated.View>

            <Animated.View entering={SlideInRight.springify()} style={styles.playerSide}>
              <Avatar
                name={opponent.name}
                playerColor={opponent.color}
                size="lg"
                showBorder
              />
              <Text style={styles.playerName}>{opponent.name}</Text>
              {opponent.isAI && (
                <View style={styles.aiBadge}>
                  <Ionicons name="hardware-chip" size={12} color={COLORS.white} />
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* Question phase */}
        {phase === 'question' && (
          <View style={styles.questionContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="flash" size={28} color={COLORS.warning} />
              <Text style={styles.title}>Duel !</Text>
            </View>

            {/* Players status */}
            <View style={styles.playersStatus}>
              <View style={styles.playerStatus}>
                <Avatar
                  name={currentPlayer.name}
                  playerColor={currentPlayer.color}
                  size="sm"
                />
                <Text style={styles.playerStatusName}>{currentPlayer.name}</Text>
                {selectedAnswer !== null && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                )}
              </View>
              <View style={styles.playerStatus}>
                <Avatar
                  name={opponent.name}
                  playerColor={opponent.color}
                  size="sm"
                />
                <Text style={styles.playerStatusName}>{opponent.name}</Text>
                {opponentAnswer !== null && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                )}
              </View>
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
              <Animated.View
                style={[
                  styles.timerBar,
                  timerStyle,
                  {
                    backgroundColor: timeRemaining <= 5 ? COLORS.error : COLORS.warning,
                  },
                ]}
              />
              <Text style={styles.timerText}>{timeRemaining}s</Text>
            </View>

            {/* Stake */}
            <View style={styles.stakeContainer}>
              <Ionicons name="trophy" size={16} color={COLORS.warning} />
              <Text style={styles.stakeText}>Enjeu: {duel.stake} jetons</Text>
            </View>

            {/* Question */}
            <View style={styles.questionBox}>
              <Text style={styles.category}>{duel.category}</Text>
              <Text style={styles.question}>{duel.question}</Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {duel.options.map((option, index) => {
                const isSelected = selectedAnswer === index;

                return (
                  <AnimatedPressable
                    key={index}
                    entering={FadeIn.delay(index * 100)}
                    onPress={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                  >
                    <View style={styles.optionIndex}>
                      <Text style={styles.optionIndexText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Result phase */}
        {phase === 'result' && (
          <Animated.View style={[styles.resultContainer, resultStyle]}>
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor: playerWon ? COLORS.success : isDraw ? COLORS.warning : COLORS.error,
                },
              ]}
            >
              <Ionicons
                name={playerWon ? 'trophy' : isDraw ? 'swap-horizontal' : 'close-circle'}
                size={64}
                color={COLORS.white}
              />
              <Text style={styles.resultText}>
                {playerWon ? 'Victoire !' : isDraw ? 'Égalité !' : 'Défaite'}
              </Text>

              {/* Answers summary */}
              <View style={styles.answersSummary}>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>{currentPlayer.name}:</Text>
                  <Ionicons
                    name={playerCorrect ? 'checkmark' : 'close'}
                    size={20}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.answerRow}>
                  <Text style={styles.answerLabel}>{opponent.name}:</Text>
                  <Ionicons
                    name={opponentCorrect ? 'checkmark' : 'close'}
                    size={20}
                    color={COLORS.white}
                  />
                </View>
              </View>

              {/* Reward/Penalty */}
              <View style={styles.rewardContainer}>
                <Ionicons name="cash" size={24} color={COLORS.white} />
                <Text style={styles.rewardText}>
                  {playerWon ? `+${duel.stake}` : isDraw ? '±0' : `-${duel.stake}`} jetons
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING[5],
    maxWidth: 400,
    width: '100%',
    minHeight: 400,
  },
  // Intro phase
  introContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[8],
  },
  playerSide: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: SPACING[2],
    textAlign: 'center',
  },
  aiBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 4,
    marginTop: SPACING[1],
  },
  vsContainer: {
    backgroundColor: COLORS.error,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: SPACING[2],
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  vsText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  // Question phase
  questionContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  playersStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING[3],
  },
  playerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  playerStatusName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  timerContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: SPACING[2],
    overflow: 'hidden',
    position: 'relative',
  },
  timerBar: {
    height: '100%',
    borderRadius: 4,
  },
  timerText: {
    position: 'absolute',
    right: 0,
    top: -20,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  stakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  stakeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
  },
  questionBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  category: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  question: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: SPACING[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING[3],
    borderWidth: 2,
    borderColor: 'transparent',
    gap: SPACING[3],
  },
  optionSelected: {
    borderColor: COLORS.warning,
    backgroundColor: `${COLORS.warning}10`,
  },
  optionIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIndexText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  // Result phase
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBadge: {
    padding: SPACING[6],
    borderRadius: 24,
    alignItems: 'center',
    gap: SPACING[3],
    minWidth: 200,
  },
  resultText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
  },
  answersSummary: {
    marginTop: SPACING[2],
    gap: SPACING[1],
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  answerLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[3],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  rewardText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
});
