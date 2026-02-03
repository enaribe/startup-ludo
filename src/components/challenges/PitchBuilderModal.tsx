import { memo, useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RadialBackground } from '@/components/ui';
import { useChallengeStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeDeliverables } from '@/types/challenge';

type ModalMode = 'create' | 'view' | 'edit';

interface PitchBuilderModalProps {
  visible: boolean;
  enrollmentId: string;
  challengeId: string;
  sectorName?: string;
  mode?: ModalMode;
  initialData?: ChallengeDeliverables['pitch'];
  onComplete: () => void;
  onClose: () => void;
}

interface StepConfig {
  question: string;
  hint: string;
  placeholder: string;
  key: 'problem' | 'solution' | 'target' | 'viability' | 'impact';
}

const STEPS: StepConfig[] = [
  {
    question: 'Quel problème résolvez-vous ?',
    hint: '2.1 Problème / Besoin',
    placeholder: 'Décrivez le problème que votre projet résout...',
    key: 'problem',
  },
  {
    question: 'Quelle est votre solution ?',
    hint: '2.2 Solution',
    placeholder: 'Expliquez votre solution innovante...',
    key: 'solution',
  },
  {
    question: 'Qui sont vos clients ?',
    hint: '2.3 Cible et Marché',
    placeholder: 'Identifiez votre cible et votre marché...',
    key: 'target',
  },
  {
    question: 'Comment votre projet est-il viable ?',
    hint: '2.4 Faisabilité et Impact',
    placeholder: 'Démontrez la viabilité de votre projet...',
    key: 'viability',
  },
  {
    question: 'Quel impact visez-vous ?',
    hint: 'Impact social et environnemental',
    placeholder: "Décrivez l'impact social et environnemental visé...",
    key: 'impact',
  },
];

const MIN_CHARS = 20;
const MAX_CHARS = 500;

export const PitchBuilderModal = memo(function PitchBuilderModal({
  visible,
  enrollmentId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  challengeId: _challengeId,
  sectorName,
  mode = 'create',
  initialData,
  onComplete,
  onClose,
}: PitchBuilderModalProps) {
  const insets = useSafeAreaInsets();
  const [currentMode, setCurrentMode] = useState<ModalMode>(mode);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    problem: '',
    solution: '',
    target: '',
    viability: '',
    impact: '',
  });

  // Initialize from props when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentMode(mode);
      if ((mode === 'view' || mode === 'edit') && initialData) {
        setAnswers({
          problem: initialData.problem,
          solution: initialData.solution,
          target: initialData.target,
          viability: initialData.viability,
          impact: initialData.impact,
        });
        // View mode starts at recap
        if (mode === 'view') {
          setCurrentStep(STEPS.length);
        } else {
          setCurrentStep(0);
        }
      } else {
        setCurrentStep(0);
      }
    }
  }, [visible, mode, initialData]);

  const isRecapStep = currentStep === STEPS.length;
  const currentStepConfig = !isRecapStep ? STEPS[currentStep] : null;
  const currentAnswer = currentStepConfig ? answers[currentStepConfig.key] : '';

  const handleAnswerChange = useCallback(
    (text: string) => {
      if (currentStepConfig && text.length <= MAX_CHARS) {
        setAnswers((prev) => ({
          ...prev,
          [currentStepConfig.key]: text,
        }));
      }
    },
    [currentStepConfig]
  );

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleValidate = useCallback(() => {
    const generatedDocument = `FICHE PITCH

PROBLÈME / BESOIN
${answers.problem}

SOLUTION
${answers.solution}

CIBLE ET MARCHÉ
${answers.target}

FAISABILITÉ ET IMPACT
${answers.viability}

IMPACT SOCIAL ET ENVIRONNEMENTAL
${answers.impact}`;

    useChallengeStore.getState().savePitch(enrollmentId, {
      problem: answers.problem,
      solution: answers.solution,
      target: answers.target,
      viability: answers.viability,
      impact: answers.impact,
      generatedDocument,
      completedAt: Date.now(),
    });

    onComplete();
  }, [enrollmentId, answers, onComplete]);

  const handleEdit = useCallback(() => {
    setCurrentMode('edit');
    setCurrentStep(0);
  }, []);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setCurrentMode('create');
    setAnswers({
      problem: '',
      solution: '',
      target: '',
      viability: '',
      impact: '',
    });
    onClose();
  }, [onClose]);

  const canProceed = currentAnswer.length >= MIN_CHARS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <RadialBackground />
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </Pressable>
            {!isRecapStep && (
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>Étape {currentStep + 1}/5</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          {!isRecapStep && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((currentStep + 1) / STEPS.length) * 100}%` },
                ]}
              />
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!isRecapStep && currentStepConfig ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.stepContainer}>
                {/* Question Title */}
                <Text style={styles.questionTitle}>{currentStepConfig.question}</Text>

                {/* Hint Badge */}
                <View style={styles.hintBadge}>
                  <Text style={styles.hintText}>{currentStepConfig.hint}</Text>
                </View>

                {/* Text Input */}
                <TextInput
                  style={styles.textInput}
                  value={currentAnswer}
                  onChangeText={handleAnswerChange}
                  placeholder={currentStepConfig.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={MAX_CHARS}
                />

                {/* Character Counter */}
                <Text style={styles.charCounter}>
                  {currentAnswer.length}/{MAX_CHARS}
                </Text>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.recapContainer}>
                {/* Recap Title */}
                <Text style={styles.recapTitle}>VOTRE FICHE PITCH</Text>

                {/* Sector Badge */}
                {sectorName && (
                  <View style={styles.sectorBadge}>
                    <Ionicons name="briefcase" size={16} color={COLORS.primary} />
                    <Text style={styles.sectorText}>{sectorName}</Text>
                  </View>
                )}

                {/* Recap Sections */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                  <View style={styles.recapCard}>
                    <Text style={styles.recapLabel}>PROBLÈME</Text>
                    <Text style={styles.recapAnswer}>{answers.problem}</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                  <View style={styles.recapCard}>
                    <Text style={styles.recapLabel}>SOLUTION</Text>
                    <Text style={styles.recapAnswer}>{answers.solution}</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                  <View style={styles.recapCard}>
                    <Text style={styles.recapLabel}>CIBLE</Text>
                    <Text style={styles.recapAnswer}>{answers.target}</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                  <View style={styles.recapCard}>
                    <Text style={styles.recapLabel}>VIABILITÉ</Text>
                    <Text style={styles.recapAnswer}>{answers.viability}</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(500).duration(400)}>
                  <View style={styles.recapCard}>
                    <Text style={styles.recapLabel}>IMPACT</Text>
                    <Text style={styles.recapAnswer}>{answers.impact}</Text>
                  </View>
                </Animated.View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {!isRecapStep ? (
              <>
                {currentStep > 0 && (
                  <Pressable onPress={handlePrevious} style={styles.previousButton}>
                    <Text style={styles.previousButtonText}>PRÉCÉDENT</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleNext}
                  style={[
                    styles.nextButton,
                    !canProceed && styles.nextButtonDisabled,
                    currentStep === 0 && styles.nextButtonFull,
                  ]}
                  disabled={!canProceed}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      !canProceed && styles.nextButtonTextDisabled,
                    ]}
                  >
                    SUIVANT
                  </Text>
                </Pressable>
              </>
            ) : currentMode === 'view' ? (
              <Pressable onPress={handleEdit} style={styles.validateButton}>
                <Ionicons name="create-outline" size={20} color={COLORS.background} style={{ marginRight: SPACING[2] }} />
                <Text style={styles.validateButtonText}>MODIFIER</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleValidate} style={styles.validateButton}>
                <Text style={styles.validateButtonText}>
                  {currentMode === 'edit' ? 'ENREGISTRER' : 'VALIDER MON PITCH'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  stepText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[6],
  },
  stepContainer: {
    gap: SPACING[4],
  },
  questionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  hintBadge: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    alignSelf: 'center',
  },
  hintText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  textInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    padding: SPACING[4],
    minHeight: 150,
    marginTop: SPACING[4],
  },
  charCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  recapContainer: {
    gap: SPACING[4],
  },
  recapTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    alignSelf: 'center',
    marginBottom: SPACING[4],
  },
  sectorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  recapCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    marginBottom: SPACING[3],
  },
  recapLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginBottom: SPACING[2],
    letterSpacing: 0.5,
  },
  recapAnswer: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    lineHeight: 22,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING[3],
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },
  previousButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5,
  },
  nextButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  nextButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  validateButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});
