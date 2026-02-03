import { PopupQuizIcon } from '@/components/game/popups/PopupIcons';
import { Modal } from '@/components/ui/Modal';
import { useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { QuizEvent } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface QuizPopupProps {
  visible: boolean;
  quiz: QuizEvent | null;
  onAnswer: (correct: boolean, reward: number) => void;
  onClose: () => void;
  isSpectator?: boolean;
  spectatorResult?: { ok: boolean; reward: number };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_STYLE = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: SPACING[6],
  maxWidth: 340,
  width: '90%' as const,
  alignItems: 'center' as const,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 12,
  overflow: 'hidden' as const,
};

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
        withSpring(1.2, { damping: 8, stiffness: 140 }),
        withSpring(1, { damping: 12 })
      );
      iconRotate.value = withSequence(
        withTiming(-8, { duration: 100 }),
        withTiming(8, { duration: 100 }),
        withTiming(-4, { duration: 80 }),
        withTiming(0, { duration: 80 })
      );
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
    resultScale.value = withSpring(1);
    badgeBounce.value = withDelay(200, withSpring(1, { damping: 6 }));
  }, [isSpectator, spectatorResult, quiz, resultScale, badgeBounce]);

  const handleTimeUp = useCallback(() => {
    if (hasAnswered) return;
    setHasAnswered(true);
    resultScale.value = withSpring(1);
    badgeBounce.value = withDelay(200, withSpring(1, { damping: 6 }));
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
      resultScale.value = withSpring(1);
      badgeBounce.value = withDelay(200, withSpring(1, { damping: 6 }));
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
      <Animated.View entering={SlideInUp.springify().damping(18)} style={[styles.card, CARD_STYLE]}>
        {isSpectator && (
          <View style={styles.spectatorBanner}>
            <Ionicons name="eye" size={14} color={COLORS.white} />
            <Text style={styles.spectatorText}>L'adversaire répond au quiz...</Text>
          </View>
        )}

        <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
          <PopupQuizIcon size={56} />
        </Animated.View>

        <Text style={styles.title}>QUIZZ</Text>
        <Text style={styles.question}>{quiz.question}</Text>

        {!hasAnswered && (
          <>
            <View style={styles.timerTrack}>
              <Animated.View style={[styles.timerFillWrap, timerAnimStyle]}>
                <LinearGradient
                  colors={['#FFBC40', '#90CAF9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
            <View style={styles.options}>
              {quiz.options.map((option, index) => (
                <AnimatedPressable
                  key={index}
                  entering={FadeInDown.delay(index * 80).springify()}
                  onPress={() => handleSelectAnswer(index)}
                  disabled={isSpectator}
                  style={({ pressed }) => [
                    styles.optionPill,
                    pressed && styles.optionPillPressed,
                  ]}
                >
                  <Text style={styles.optionPrefix}>{String.fromCharCode(65 + index)}. </Text>
                  <Text style={styles.optionLabel}>{option}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </>
        )}

        {hasAnswered && (
          <>
            <View style={styles.options}>
              {quiz.options.map((option, index) => {
                const isCorrectOption = index === quiz.correctAnswer;
                const isSelectedWrong = selectedAnswer === index && !isCorrectOption;
                const isSelectedCorrect = index === quiz.correctAnswer;
                const pillStyle =
                  isSelectedCorrect && isCorrect
                    ? styles.optionPillCorrect
                    : isSelectedWrong
                      ? styles.optionPillWrong
                      : isCorrectOption && !isCorrect
                        ? styles.optionPillCorrectBorder
                        : styles.optionPillDisabled;
                const textStyle =
                  isSelectedCorrect && isCorrect
                    ? styles.optionTextCorrect
                    : isSelectedWrong
                      ? styles.optionTextWrong
                      : styles.optionLabel;
                return (
                  <Animated.View
                    key={index}
                    entering={FadeIn.delay(index * 60)}
                    style={[styles.optionPill, pillStyle]}
                  >
                    <Text
                      style={[
                        styles.optionPrefix,
                        (isSelectedCorrect && isCorrect) || isSelectedWrong
                          ? styles.optionTextCorrect
                          : undefined,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}.{' '}
                    </Text>
                    <Text style={[styles.optionLabel, textStyle]}>{option}</Text>
                    {isSelectedCorrect && isCorrect && (
                      <View style={styles.optionRewardBadge}>
                        <Text style={styles.optionRewardText}>+{quiz.reward}</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            <Animated.View style={[styles.resultWrap, resultAnimStyle]}>
              <Text style={styles.resultTitle}>
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
          </>
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {},
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
  iconWrap: {
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#4CAF50',
    textShadowColor: '#2E7D32',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: SPACING[4],
  },
  question: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING[4],
  },
  timerTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: SPACING[4],
  },
  timerFillWrap: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  options: {
    width: '100%',
    gap: SPACING[3],
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionPillPressed: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  optionPillCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionPillWrong: {
    backgroundColor: '#E57373',
    borderColor: '#E57373',
  },
  optionPillCorrectBorder: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  optionPillDisabled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    opacity: 0.85,
  },
  optionPrefix: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#546E7A',
  },
  optionLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#546E7A',
    flex: 1,
  },
  optionTextCorrect: {
    color: '#FFFFFF',
  },
  optionTextWrong: {
    color: '#FFFFFF',
  },
  optionRewardBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING[2],
  },
  optionRewardText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#4CAF50',
  },
  resultWrap: {
    alignItems: 'center',
    marginTop: SPACING[4],
  },
  resultTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#1B2A4A',
    marginBottom: SPACING[3],
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeGain: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  badgeLoss: {
    backgroundColor: '#E57373',
    borderColor: '#C62828',
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
  },
});
