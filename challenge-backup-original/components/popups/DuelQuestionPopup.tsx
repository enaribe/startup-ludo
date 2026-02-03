import { PopupDuelIcon } from '@/components/game/popups/PopupIcons';
import { Modal } from '@/components/ui/Modal';
import { useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { DuelQuestion } from '@/types';
import * as Haptics from 'expo-haptics';
import { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface DuelQuestionPopupProps {
  visible: boolean;
  questions: DuelQuestion[];
  onComplete: (answers: number[], totalScore: number) => void;
  onClose: () => void;
}

export const DuelQuestionPopup = memo(function DuelQuestionPopup({
  visible,
  questions,
  onComplete,
  onClose,
}: DuelQuestionPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

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

  const handleSelectAnswer = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null) return;

    const question = questions[currentIndex];
    if (!question) return;
    const points = question.options[answerIndex]?.points || 0;

    setSelectedAnswer(answerIndex);
    setTotalScore((prev) => prev + points);
    setAnswers((prev) => [...prev, answerIndex]);

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Passer à la question suivante après un délai
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
      } else {
        // Toutes les questions répondues
        const finalAnswers = [...answers, answerIndex];
        const finalScore = totalScore + points;
        onComplete(finalAnswers, finalScore);
      }
    }, 600);
  }, [selectedAnswer, currentIndex, questions, answers, totalScore, hapticsEnabled, onComplete]);

  const currentQuestion = questions[currentIndex];

  if (!visible || questions.length === 0 || !currentQuestion) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.springify().damping(18)} style={styles.card}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <PopupDuelIcon size={32} />
            <Text style={styles.title}>DUEL</Text>
          </View>

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
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;

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
                          isSelected && styles.optionPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                          numberOfLines={2}
                        >
                          {option.text}
                        </Text>
                        {isSelected && (
                          <View style={styles.pointsBadge}>
                            <Text style={styles.pointsText}>+{option.points}</Text>
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
    paddingTop: SPACING[5],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.success,
    letterSpacing: 2,
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
    minHeight: 60,
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
