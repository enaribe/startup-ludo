import { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import type { QuizEvent } from '@/types';

interface QuizPopupProps {
  visible: boolean;
  quiz: QuizEvent | null;
  onAnswer: (correct: boolean, reward: number) => void;
  onClose: () => void;
  /** When true, the popup is shown as read-only (spectating another player's quiz) */
  isSpectator?: boolean;
  /** Result from the active player (shown to spectators) */
  spectatorResult?: { ok: boolean; reward: number };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const QuizPopup = memo(function QuizPopup({
  visible,
  quiz,
  onAnswer,
  onClose,
  isSpectator = false,
  spectatorResult,
}: QuizPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);

  // Animation values
  const timerProgress = useSharedValue(1);
  const resultScale = useSharedValue(0);

  // Reset state when quiz changes
  useEffect(() => {
    if (visible && quiz) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setTimeRemaining(quiz.timeLimit || 30);
      timerProgress.value = 1;
      resultScale.value = 0;
    }
  }, [visible, quiz, timerProgress, resultScale]);

  // Timer countdown (disabled for spectators)
  useEffect(() => {
    if (!visible || hasAnswered || !quiz || isSpectator) return;

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

    // Animate timer bar
    timerProgress.value = withTiming(0, { duration: (quiz.timeLimit || 30) * 1000 });

    return () => clearInterval(interval);
  }, [visible, hasAnswered, quiz, timerProgress, isSpectator]);

  // Spectator: show result when it arrives
  useEffect(() => {
    if (!isSpectator || !spectatorResult || !quiz) return;

    setHasAnswered(true);
    // Show the correct answer highlighted
    setSelectedAnswer(spectatorResult.ok ? quiz.correctAnswer : -1);
    resultScale.value = withSpring(1);
  }, [isSpectator, spectatorResult, quiz, resultScale]);

  const handleTimeUp = useCallback(() => {
    if (hasAnswered) return;
    setHasAnswered(true);
    resultScale.value = withSpring(1);

    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Time's up = wrong answer
    setTimeout(() => {
      onAnswer(false, 0);
    }, 2000);
  }, [hasAnswered, hapticsEnabled, onAnswer, resultScale]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (hasAnswered || !quiz) return;

      setSelectedAnswer(index);
      setHasAnswered(true);

      const isCorrect = index === quiz.correctAnswer;
      const reward = isCorrect ? quiz.reward : 0;

      resultScale.value = withSpring(1);

      if (hapticsEnabled) {
        if (isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }

      // Delay before closing to show result
      setTimeout(() => {
        onAnswer(isCorrect, reward);
      }, 2000);
    },
    [hasAnswered, quiz, hapticsEnabled, onAnswer, resultScale]
  );

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  const isCorrect = isSpectator ? spectatorResult?.ok ?? false : selectedAnswer === quiz?.correctAnswer;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return COLORS.success;
      case 'medium':
        return COLORS.warning;
      case 'hard':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Moyen';
      case 'hard':
        return 'Difficile';
      default:
        return difficulty;
    }
  };

  if (!quiz) return null;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false}>
      <Animated.View entering={SlideInUp.springify()} style={styles.container}>
        {/* Spectator banner */}
        {isSpectator && (
          <View style={styles.spectatorBanner}>
            <Ionicons name="eye" size={16} color={COLORS.white} />
            <Text style={styles.spectatorText}>L'adversaire répond au quiz...</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="help-circle" size={28} color={COLORS.info} />
            <Text style={styles.title}>Quiz</Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(quiz.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>
              {getDifficultyLabel(quiz.difficulty)}
            </Text>
          </View>
        </View>

        {/* Timer bar */}
        <View style={styles.timerContainer}>
          <Animated.View
            style={[
              styles.timerBar,
              timerStyle,
              {
                backgroundColor:
                  timeRemaining <= 5 ? COLORS.error : COLORS.primary,
              },
            ]}
          />
          <View style={styles.timerTextContainer}>
            <Ionicons
              name="time"
              size={16}
              color={timeRemaining <= 5 ? COLORS.error : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.timerText,
                timeRemaining <= 5 && styles.timerTextUrgent,
              ]}
            >
              {timeRemaining}s
            </Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Catégorie:</Text>
          <Text style={styles.categoryValue}>{quiz.category}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.question}>{quiz.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {quiz.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectOption = quiz.correctAnswer === index;
            const showCorrect = hasAnswered && isCorrectOption;
            const showWrong = hasAnswered && isSelected && !isCorrectOption;

            return (
              <AnimatedPressable
                key={index}
                entering={FadeIn.delay(index * 100)}
                onPress={() => handleSelectAnswer(index)}
                disabled={hasAnswered || isSpectator}
                style={[
                  styles.option,
                  isSelected && !hasAnswered && styles.optionSelected,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                ]}
              >
                <View style={styles.optionIndex}>
                  <Text style={styles.optionIndexText}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    showCorrect && styles.optionTextCorrect,
                    showWrong && styles.optionTextWrong,
                  ]}
                >
                  {option}
                </Text>
                {showCorrect && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.success}
                  />
                )}
                {showWrong && (
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={COLORS.error}
                  />
                )}
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Result overlay */}
        {hasAnswered && (
          <Animated.View style={[styles.resultOverlay, resultStyle]}>
            <View
              style={[
                styles.resultBadge,
                {
                  backgroundColor: isCorrect ? COLORS.success : COLORS.error,
                },
              ]}
            >
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={COLORS.white}
              />
              <Text style={styles.resultText}>
                {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
              </Text>
              {isCorrect && (
                <View style={styles.rewardContainer}>
                  <Ionicons name="cash" size={20} color={COLORS.white} />
                  <Text style={styles.rewardText}>+{quiz.reward} jetons</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Reward preview */}
        {!hasAnswered && (
          <View style={styles.rewardPreview}>
            <Ionicons name="gift" size={16} color={COLORS.primary} />
            <Text style={styles.rewardPreviewText}>
              Récompense: {quiz.reward} jetons
            </Text>
          </View>
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
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: 8,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[3],
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  difficultyText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  timerContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: SPACING[3],
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 4,
  },
  timerTextContainer: {
    position: 'absolute',
    right: 0,
    top: -24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  timerTextUrgent: {
    color: COLORS.error,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  categoryLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  categoryValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  questionContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING[4],
    marginBottom: SPACING[4],
  },
  question: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: SPACING[3],
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
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  optionCorrect: {
    borderColor: COLORS.success,
    backgroundColor: `${COLORS.success}20`,
  },
  optionWrong: {
    borderColor: COLORS.error,
    backgroundColor: `${COLORS.error}20`,
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
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
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionTextCorrect: {
    color: COLORS.success,
    fontFamily: FONTS.bodySemiBold,
  },
  optionTextWrong: {
    color: COLORS.error,
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBadge: {
    padding: SPACING[6],
    borderRadius: 20,
    alignItems: 'center',
    gap: SPACING[2],
  },
  resultText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    textAlign: 'center',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[2],
  },
  rewardText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    marginTop: SPACING[4],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rewardPreviewText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
