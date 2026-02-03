import { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  SlideInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal } from '@/components/ui/Modal';
import { PopupQuizIcon } from '@/components/game/popups/PopupIcons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import type { QuizEvent } from '@/types';

interface QuizPopupProps {
  visible: boolean;
  quiz: QuizEvent | null;
  onAnswer: (correct: boolean, reward: number) => void;
  onClose: () => void;
  isSpectator?: boolean;
  spectatorResult?: { ok: boolean; reward: number };
}


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
  const [, setTimeRemaining] = useState(30);

  const timerProgress = useSharedValue(1);
  const resultScale = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    if (visible && quiz) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setTimeRemaining(quiz.timeLimit || 30);
      timerProgress.value = 1;
      resultScale.value = 0;
      badgeBounce.value = 0;
      iconScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 280 })
      );
      iconRotate.value = 0;
    }
  }, [visible, quiz, timerProgress, resultScale, iconScale, iconRotate, badgeBounce]);

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
    timerProgress.value = withTiming(0, { duration: (quiz.timeLimit || 30) * 1000 });
    return () => clearInterval(interval);
  }, [visible, hasAnswered, quiz, timerProgress, isSpectator]);

  useEffect(() => {
    if (!isSpectator || !spectatorResult || !quiz) return;
    setHasAnswered(true);
    setSelectedAnswer(spectatorResult.ok ? quiz.correctAnswer : -1);
    resultScale.value = withTiming(1, { duration: 220 });
    badgeBounce.value = withTiming(1, { duration: 220 });
  }, [isSpectator, spectatorResult, quiz, resultScale, badgeBounce]);

  const handleTimeUp = useCallback(() => {
    if (hasAnswered) return;
    setHasAnswered(true);
    resultScale.value = withTiming(1, { duration: 220 });
    badgeBounce.value = withTiming(1, { duration: 220 });
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => onAnswer(false, 0), 2000);
  }, [hasAnswered, hapticsEnabled, onAnswer, resultScale, badgeBounce]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (hasAnswered || !quiz) return;
      setSelectedAnswer(index);
      setHasAnswered(true);
      const isCorrect = index === quiz.correctAnswer;
      const reward = isCorrect ? quiz.reward : 0;
      resultScale.value = withTiming(1, { duration: 220 });
      badgeBounce.value = withTiming(1, { duration: 220 });
      if (hapticsEnabled) {
        if (isCorrect) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setTimeout(() => onAnswer(isCorrect, reward), 2000);
    },
    [hasAnswered, quiz, hapticsEnabled, onAnswer, resultScale, badgeBounce]
  );

  const timerAnimStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%`,
  }));

  const resultAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeBounce.value }],
    opacity: badgeBounce.value,
  }));

  const isCorrect =
    isSpectator ? spectatorResult?.ok ?? false : selectedAnswer === quiz?.correctAnswer;

  if (!quiz) return null;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <View style={styles.content}>
          {isSpectator && (
            <View style={styles.spectatorBanner}>
              <Ionicons name="eye" size={14} color={COLORS.white} />
              <Text style={styles.spectatorText}>L'adversaire répond au quiz...</Text>
            </View>
          )}

          {/* Icon avec animation */}
          <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
            <View style={styles.iconCircle}>
              <PopupQuizIcon size={48} />
            </View>
          </Animated.View>

          {/* Titre */}
          <Text style={styles.title}>QUIZ</Text>

          {/* Question dans une box */}
          <View style={styles.questionBox}>
            <Text style={styles.question}>{quiz.question}</Text>
          </View>

          {/* Timer bar - visible seulement avant réponse */}
          {!hasAnswered && (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={COLORS.events.quiz} />
              <View style={styles.timerTrack}>
                <Animated.View style={[styles.timerFillWrap, timerAnimStyle]}>
                  <LinearGradient
                    colors={[COLORS.events.quiz, COLORS.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </View>
          )}

          {/* Options de réponse - structure unique */}
          <View style={styles.options}>
            {quiz.options.map((option, index) => {
              const isCorrectOption = index === quiz.correctAnswer;
              const isSelected = selectedAnswer === index;
              const isSelectedWrong = isSelected && !isCorrectOption;
              const showAsCorrect = hasAnswered && isCorrectOption;

              // Styles conditionnels
              const pillStyle = !hasAnswered
                ? undefined
                : showAsCorrect
                  ? styles.optionPillCorrect
                  : isSelectedWrong
                    ? styles.optionPillWrong
                    : styles.optionPillDisabled;

              const prefixStyle = !hasAnswered
                ? styles.optionPrefixBadge
                : showAsCorrect
                  ? styles.optionPrefixBadgeCorrect
                  : isSelectedWrong
                    ? styles.optionPrefixBadgeWrong
                    : styles.optionPrefixBadge;

              const showCheckmark = hasAnswered && showAsCorrect;
              const showCross = hasAnswered && isSelectedWrong;

              return (
                <Pressable
                  key={index}
                  onPress={() => handleSelectAnswer(index)}
                  disabled={isSpectator || hasAnswered}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.optionPill,
                        pressed && !hasAnswered && styles.optionPillPressed,
                        pillStyle,
                      ]}
                    >
                      <View style={prefixStyle}>
                        {showCheckmark ? (
                          <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        ) : showCross ? (
                          <Ionicons name="close" size={16} color={COLORS.white} />
                        ) : (
                          <Text style={[
                            styles.optionPrefixText,
                            (showAsCorrect || isSelectedWrong) && styles.optionPrefixTextLight
                          ]}>
                            {String.fromCharCode(65 + index)}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          showAsCorrect && styles.optionLabelCorrect,
                          isSelectedWrong && styles.optionLabelWrong,
                        ]}
                        numberOfLines={2}
                      >
                        {option}
                      </Text>
                      {showAsCorrect && isCorrect && (
                        <View style={styles.optionRewardBadge}>
                          <Text style={styles.optionRewardText}>+{quiz.reward}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Résultat - visible après réponse */}
          {hasAnswered && (
            <Animated.View style={[styles.resultWrap, resultAnimStyle]}>
              <Text style={[styles.resultTitle, !isCorrect && styles.resultTitleLoss]}>
                {isCorrect ? 'VOUS GAGNEZ' : 'VOUS PERDEZ'}
              </Text>
              <Animated.View
                style={[
                  styles.badge,
                  isCorrect ? styles.badgeGain : styles.badgeLoss,
                  badgeAnimStyle,
                ]}
              >
                <Text style={styles.badgeText}>
                  {isCorrect ? `+${quiz.reward}` : `-${quiz.reward}`}
                </Text>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  content: {
    paddingTop: SPACING[5],
    paddingBottom: SPACING[8],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[4],
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  iconWrap: {
    marginBottom: SPACING[3],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.events.quiz,
    letterSpacing: 2,
    marginBottom: SPACING[3],
  },
  questionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  question: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    width: '100%',
    marginBottom: SPACING[4],
  },
  timerTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8EEF4',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  timerFillWrap: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  options: {
    width: '100%',
    gap: SPACING[3],
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    minHeight: 56,
    ...SHADOWS.sm,
  },
  optionPillPressed: {
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    transform: [{ scale: 0.98 }],
  },
  optionPillCorrect: {
    backgroundColor: COLORS.success,
  },
  optionPillWrong: {
    backgroundColor: COLORS.error,
  },
  optionPillDisabled: {
    backgroundColor: '#EAEEF2',
    opacity: 0.6,
  },
  optionPrefixBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
    ...SHADOWS.sm,
  },
  optionPrefixBadgeCorrect: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  optionPrefixBadgeWrong: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  optionPrefixText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.events.quiz,
  },
  optionPrefixTextLight: {
    color: COLORS.white,
  },
  optionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 22,
  },
  optionLabelCorrect: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  optionLabelWrong: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  optionRewardBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING[2],
    ...SHADOWS.sm,
  },
  optionRewardText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  resultWrap: {
    alignItems: 'center',
    marginTop: SPACING[5],
    paddingTop: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
    width: '100%',
  },
  resultTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
    marginBottom: SPACING[3],
  },
  resultTitleLoss: {
    color: COLORS.error,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  badgeGain: {
    backgroundColor: COLORS.success,
    borderColor: '#2E7D32',
  },
  badgeLoss: {
    backgroundColor: COLORS.error,
    borderColor: '#C62828',
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
});
