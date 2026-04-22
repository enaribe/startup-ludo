import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInUp,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { DuelHeader } from '@/components/game/popups/DuelHeader';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { DuelQuestion } from '@/types';

interface DuelQuestionPopupProps {
  visible: boolean;
  questions: DuelQuestion[];
  onComplete: (answers: number[], totalScore: number) => void;
  onClose: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export const DuelQuestionPopup = memo(function DuelQuestionPopup({
  visible,
  questions,
  onComplete,
  onClose,
}: DuelQuestionPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  usePlaySoundOnOpen(visible && questions.length > 0, 'popup-open');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const progressAnim = useSharedValue(0);

  // Reset quand le popup s'ouvre
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setAnswers([]);
      setTotalScore(0);
      setSelectedAnswer(null);
      isTransitioningRef.current = false;
      progressAnim.value = 0;
    }
  }, [visible, progressAnim]);

  // Animation de progression
  useEffect(() => {
    progressAnim.value = withTiming((currentIndex / questions.length) * 100, { duration: 300 });
  }, [currentIndex, questions.length, progressAnim]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  const isTransitioningRef = useRef(false);

  const currentQuestion = questions[currentIndex];

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return shuffleArray(currentQuestion.options);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id]);

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || isTransitioningRef.current) return;
    if (!questions[currentIndex]) return;

    const points = shuffledOptions[answerIndex]?.points || 0;
    isTransitioningRef.current = true;

    setSelectedAnswer(answerIndex);

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Passer à la question suivante après un délai
    setTimeout(() => {
      // Important: éviter les side-effects (onComplete / setState multiples)
      // à l'intérieur des updaters setState pour ne pas déclencher
      // "Cannot update a component while rendering a different component".
      const newAnswers = [...answers, answerIndex];
      const newScore = totalScore + points;

      setAnswers(newAnswers);
      setTotalScore(newScore);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        isTransitioningRef.current = false;
      } else {
        onComplete(newAnswers, newScore);
      }
    }, 600);
  }, [selectedAnswer, currentIndex, questions, shuffledOptions, hapticsEnabled, onComplete, answers, totalScore]);

  if (!visible || questions.length === 0 || !currentQuestion) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <DuelHeader />
        <View style={styles.content}>
          {/* Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
          </View>

          {/* Question */}
          <View style={styles.questionBox}>
            <Text style={styles.question}>{currentQuestion.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.options}>
            {shuffledOptions.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const pts = option.points ?? 0;
              const selectedColor = pts === 0
                ? COLORS.error
                : pts <= 15
                  ? COLORS.warning
                  : COLORS.success;

              return (
                <Animated.View
                  key={`${currentQuestion.id}-${index}`}
                  entering={FadeIn.delay(index * 100)}
                >
                  <Pressable
                    onPress={() => handleSelectAnswer(index)}
                    disabled={selectedAnswer !== null}
                  >
                    {({ pressed }) => (
                      <View
                        style={[
                          styles.optionPill,
                          pressed && !selectedAnswer && styles.optionPillPressed,
                          isSelected && { backgroundColor: selectedColor, borderColor: selectedColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                          numberOfLines={3}
                        >
                          {option.text}
                        </Text>
                        {isSelected && (
                          <View style={[styles.pointsBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                            <Text style={[styles.pointsText, { color: COLORS.white }]}>+{pts} pts</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Score actuel */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel}>Score actuel</Text>
            <Text style={styles.scoreValue}>{totalScore}</Text>
          </View>
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
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  progressSection: {
    width: '100%',
    marginBottom: SPACING[4],
  },
  progressText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E8EEF4',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
  },
  questionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  question: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
  },
  options: {
    width: '100%',
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    minHeight: 52,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  optionPillPressed: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderColor: COLORS.success,
  },
  optionPillSelected: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  optionText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  pointsBadge: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginLeft: SPACING[2],
    ...SHADOWS.sm,
  },
  pointsText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
    width: '100%',
  },
  scoreLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
  },
  scoreValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.success,
  },
});
