import { memo, useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder, RadialBackground } from '@/components/ui';
import { useChallengeStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { YEAH_FINAL_QUIZ, QUIZ_PASS_THRESHOLD } from '@/data/challenges/quizQuestions';
import type { ChallengeDeliverables, ChampionStatus } from '@/types/challenge';

interface FinalQuizModalProps {
  visible: boolean;
  enrollmentId: string;
  challengeId: string;
  existingData: {
    sectorName: string;
    pitch?: ChallengeDeliverables['pitch'];
    businessPlanSimple?: ChallengeDeliverables['businessPlanSimple'];
  };
  onComplete: (champion: ChampionStatus) => void;
  onClose: () => void;
}

type Phase = 'intro' | 'quiz' | 'results' | 'certificate';

interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

export const FinalQuizModal = memo(function FinalQuizModal({
  visible,
  enrollmentId,
  challengeId: _challengeId,
  existingData,
  onComplete,
  onClose,
}: FinalQuizModalProps) {
  void _challengeId;
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const trophyScale = useSharedValue(0);

  const currentQuestion = YEAH_FINAL_QUIZ[currentQuestionIndex] as (typeof YEAH_FINAL_QUIZ)[number] | undefined;
  const totalQuestions = YEAH_FINAL_QUIZ.length;
  const progress = (currentQuestionIndex + 1) / totalQuestions;

  // Calculate scores
  const totalScore = answers.filter((a) => a.isCorrect).length;
  const scorePercentage = totalScore / totalQuestions;
  const hasPassed = scorePercentage >= QUIZ_PASS_THRESHOLD;

  const blockScores = [1, 2, 3, 4].map((blockNum) => {
    const blockAnswers = answers.filter((a) => {
      const q = YEAH_FINAL_QUIZ.find((q) => q.id === a.questionId);
      return q?.block === blockNum;
    });
    const blockCorrect = blockAnswers.filter((a) => a.isCorrect).length;
    const blockTotal = YEAH_FINAL_QUIZ.filter((q) => q.block === blockNum).length;
    return { block: blockNum, score: blockCorrect, total: blockTotal };
  });

  const handleStart = useCallback(() => {
    setPhase('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowFeedback(false);
  }, []);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (showFeedback) return; // Prevent selection during feedback

      if (!currentQuestion) return;
      setSelectedOption(optionIndex);
      setShowFeedback(true);

      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      const newAnswer: QuizAnswer = {
        questionId: currentQuestion.id,
        selectedAnswer: optionIndex,
        isCorrect,
      };

      setAnswers((prev) => [...prev, newAnswer]);

      // Move to next question after delay
      setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedOption(null);
          setShowFeedback(false);
        } else {
          // Quiz finished
          setPhase('results');
          if (isCorrect && answers.filter((a) => a.isCorrect).length + 1 >= QUIZ_PASS_THRESHOLD * totalQuestions) {
            // Trigger trophy animation
            trophyScale.value = withSequence(
              withSpring(1.2, { damping: 8 }),
              withSpring(1, { damping: 10 })
            );
          }
        }
      }, 1500);
    },
    [showFeedback, currentQuestion, currentQuestionIndex, totalQuestions, answers, trophyScale]
  );

  const handleRetry = useCallback(() => {
    setPhase('intro');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowFeedback(false);
  }, []);

  const handleViewCertificate = useCallback(() => {
    setPhase('certificate');
  }, []);

  const handleFinish = useCallback(() => {
    // Generate certificate document
    const certificateDocument = `CERTIFICAT DE RÉUSSITE\n\nChallenge: YEAH - Young Entrepreneurs in Agriculture Hub\nStatut: Champion Local\nSecteur: ${existingData.sectorName}\nDate: ${new Date().toLocaleDateString('fr-FR')}\nScore: ${totalScore}/${totalQuestions} (${Math.round(scorePercentage * 100)}%)`;

    // Save to store
    useChallengeStore.getState().saveBusinessPlan(enrollmentId, 'full', {}, certificateDocument);
    useChallengeStore.getState().setChampionStatus(enrollmentId, 'local');

    // Call parent callback
    onComplete('local');
  }, [enrollmentId, existingData.sectorName, totalScore, totalQuestions, onComplete]);

  const trophyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const renderIntro = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeIn} style={styles.phaseContainer}>
        <Text style={styles.titleMain}>QUIZ FINAL</Text>
        <Text style={styles.subtitle}>Testez votre maîtrise globale</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="list" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>16 questions (4 par niveau)</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trophy" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>Seuil de réussite : 75% (12/16)</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>4 blocs : Découverte, Idéation, Démarrage, Réussite</Text>
          </View>
        </View>

        <Pressable style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>COMMENCER</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );

  const renderQuiz = () => {
    if (!currentQuestion) return null;
    return (
    <View style={styles.quizContainer}>
      <View style={styles.quizHeader}>
        <View style={styles.blockBadge}>
          <Text style={styles.blockBadgeText}>{currentQuestion.blockName}</Text>
        </View>
        <Text style={styles.progressText}>Question {currentQuestionIndex + 1}/{totalQuestions}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.quizScrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    showCorrect && styles.optionButtonCorrect,
                    showWrong && styles.optionButtonWrong,
                  ]}
                  onPress={() => handleSelectOption(index)}
                  disabled={showFeedback}
                >
                  <Text
                    style={[
                      styles.optionText,
                      (isSelected || showCorrect || showWrong) && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                  {showCorrect && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  )}
                  {showWrong && (
                    <Ionicons name="close-circle" size={24} color={COLORS.error} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
    );
  };

  const renderResults = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeIn} style={styles.phaseContainer}>
        {hasPassed ? (
          <>
            <Animated.View style={trophyAnimatedStyle}>
              <Ionicons name="trophy" size={80} color={COLORS.primary} />
            </Animated.View>
            <Text style={styles.titleMain}>FÉLICITATIONS !</Text>
            <Text style={styles.scoreText}>
              {totalScore}/{totalQuestions} bonnes réponses
            </Text>
            <Text style={styles.scorePercentage}>{Math.round(scorePercentage * 100)}%</Text>

            <View style={styles.blockScoresContainer}>
              <Text style={styles.blockScoresTitle}>Score par bloc :</Text>
              {blockScores.map(({ block, score, total }) => {
                const blockName = YEAH_FINAL_QUIZ.find((q) => q.block === block)?.blockName || '';
                return (
                  <View key={block} style={styles.blockScoreRow}>
                    <Text style={styles.blockScoreName}>{blockName}</Text>
                    <Text style={styles.blockScoreValue}>
                      {score}/{total}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.championBadge}>
              <Ionicons name="star" size={20} color={COLORS.primary} />
              <Text style={styles.championBadgeText}>CHAMPION LOCAL</Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleViewCertificate}>
              <Text style={styles.primaryButtonText}>VOIR MON CERTIFICAT</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Ionicons name="sad-outline" size={80} color={COLORS.textSecondary} />
            <Text style={styles.titleSecondary}>CONTINUEZ VOS EFFORTS</Text>
            <Text style={styles.scoreText}>
              {totalScore}/{totalQuestions} bonnes réponses
            </Text>
            <Text style={styles.scorePercentage}>{Math.round(scorePercentage * 100)}%</Text>

            <View style={styles.blockScoresContainer}>
              <Text style={styles.blockScoresTitle}>Score par bloc :</Text>
              {blockScores.map(({ block, score, total }) => {
                const blockName = YEAH_FINAL_QUIZ.find((q) => q.block === block)?.blockName || '';
                return (
                  <View key={block} style={styles.blockScoreRow}>
                    <Text style={styles.blockScoreName}>{blockName}</Text>
                    <Text style={styles.blockScoreValue}>
                      {score}/{total}
                    </Text>
                  </View>
                );
              })}
            </View>

            <Text style={styles.encouragementText}>
              Il vous faut au moins 12 bonnes réponses pour réussir.
            </Text>

            <Pressable style={styles.primaryButton} onPress={handleRetry}>
              <Text style={styles.primaryButtonText}>RÉESSAYER</Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>FERMER</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </ScrollView>
  );

  const renderCertificate = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeIn} style={styles.phaseContainer}>
        <DynamicGradientBorder borderRadius={BORDER_RADIUS.xl}>
          <View style={styles.certificateCard}>
            <Ionicons name="ribbon" size={48} color={COLORS.primary} />
            <Text style={styles.certificateTitle}>CERTIFICAT DE RÉUSSITE</Text>

            <View style={styles.certificateDivider} />

            <View style={styles.certificateInfo}>
              <Text style={styles.certificateLabel}>Challenge</Text>
              <Text style={styles.certificateValue}>YEAH - Young Entrepreneurs in Agriculture Hub</Text>
            </View>

            <View style={styles.certificateInfo}>
              <Text style={styles.certificateLabel}>Statut</Text>
              <View style={styles.certificateStatusBadge}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={styles.certificateStatusText}>Champion Local</Text>
              </View>
            </View>

            <View style={styles.certificateInfo}>
              <Text style={styles.certificateLabel}>Secteur</Text>
              <Text style={styles.certificateValue}>{existingData.sectorName}</Text>
            </View>

            <View style={styles.certificateInfo}>
              <Text style={styles.certificateLabel}>Date</Text>
              <Text style={styles.certificateValue}>
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View style={styles.certificateInfo}>
              <Text style={styles.certificateLabel}>Score</Text>
              <Text style={styles.certificateValue}>
                {totalScore}/{totalQuestions} ({Math.round(scorePercentage * 100)}%)
              </Text>
            </View>
          </View>
        </DynamicGradientBorder>

        <Pressable style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>TERMINER</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <RadialBackground />
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </Pressable>
        </View>

        {phase === 'intro' && renderIntro()}
        {phase === 'quiz' && renderQuiz()}
        {phase === 'results' && renderResults()}
        {phase === 'certificate' && renderCertificate()}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  closeButton: {
    padding: SPACING[2],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[6],
  },
  phaseContainer: {
    alignItems: 'center',
    gap: SPACING[4],
  },
  titleMain: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['4xl'],
    color: COLORS.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleSecondary: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  subtitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[5],
    gap: SPACING[4],
    marginTop: SPACING[4],
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  infoText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    flex: 1,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[8],
    borderRadius: BORDER_RADIUS['2xl'],
    marginTop: SPACING[5],
    minWidth: 200,
    alignItems: 'center',
  },
  startButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
  },
  quizContainer: {
    flex: 1,
    paddingHorizontal: SPACING[4],
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  blockBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
  },
  blockBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
  },
  progressText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING[6],
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  quizScrollContent: {
    flexGrow: 1,
  },
  questionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    marginBottom: SPACING[6],
    lineHeight: FONT_SIZES.xl * 1.4,
  },
  optionsContainer: {
    gap: SPACING[3],
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[3],
  },
  optionButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
  },
  optionButtonCorrect: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  optionButtonWrong: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  optionText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  scoreText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    textAlign: 'center',
  },
  scorePercentage: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.primary,
    textAlign: 'center',
  },
  blockScoresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    gap: SPACING[3],
    width: '100%',
    marginTop: SPACING[4],
  },
  blockScoresTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    marginBottom: SPACING[2],
  },
  blockScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockScoreName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  blockScoreValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  championBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[5],
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: SPACING[2],
  },
  championBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  encouragementText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[8],
    borderRadius: BORDER_RADIUS['2xl'],
    marginTop: SPACING[5],
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.white,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[8],
    borderRadius: BORDER_RADIUS['2xl'],
    marginTop: SPACING[3],
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  certificateCard: {
    backgroundColor: COLORS.background,
    padding: SPACING[6],
    alignItems: 'center',
    gap: SPACING[4],
  },
  certificateTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
    textAlign: 'center',
  },
  certificateDivider: {
    width: '80%',
    height: 2,
    backgroundColor: COLORS.primary,
    marginVertical: SPACING[2],
  },
  certificateInfo: {
    width: '100%',
    gap: SPACING[1],
  },
  certificateLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  certificateValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  certificateStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    alignSelf: 'flex-start',
  },
  certificateStatusText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  finishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[8],
    borderRadius: BORDER_RADIUS['2xl'],
    marginTop: SPACING[6],
    minWidth: 200,
    alignItems: 'center',
  },
  finishButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
  },
});
