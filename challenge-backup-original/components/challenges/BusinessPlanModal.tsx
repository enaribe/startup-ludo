import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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

interface BusinessPlanModalProps {
  visible: boolean;
  enrollmentId: string;
  challengeId: string;
  type: 'simple' | 'full';
  mode?: ModalMode;
  initialBPData?: ChallengeDeliverables['businessPlanSimple'] | ChallengeDeliverables['businessPlanFull'];
  existingData?: {
    sectorName?: string;
    pitch?: ChallengeDeliverables['pitch'];
    businessPlanSimple?: ChallengeDeliverables['businessPlanSimple'];
  };
  onComplete: () => void;
  onClose: () => void;
}

interface FormData {
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
}

const TOTAL_STEPS = 6;
const MIN_CHARS = 20;

export const BusinessPlanModal = memo(function BusinessPlanModal({
  visible,
  enrollmentId,
  challengeId: _challengeId,
  type,
  mode = 'create',
  initialBPData,
  existingData,
  onComplete,
  onClose,
}: BusinessPlanModalProps) {
  void _challengeId;
  const insets = useSafeAreaInsets();
  const [currentMode, setCurrentMode] = useState<ModalMode>(mode);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    answer1: '',
    answer2: '',
    answer3: '',
    answer4: '',
  });

  // Initialize from props when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentMode(mode);
      if ((mode === 'view' || mode === 'edit') && initialBPData?.content) {
        const c = initialBPData.content;
        if (type === 'simple') {
          setFormData({
            answer1: c['businessModel'] || '',
            answer2: c['organization'] || '',
            answer3: c['financialPlan'] || '',
            answer4: c['formalities'] || '',
          });
        } else {
          setFormData({
            answer1: c['growthStrategy'] || '',
            answer2: c['innovation'] || '',
            answer3: c['measurableImpact'] || '',
            answer4: c['leadership'] || '',
          });
        }
        if (mode === 'view') {
          setCurrentStep(TOTAL_STEPS); // Jump to generated document
        } else {
          setCurrentStep(2); // Start at first question
        }
      } else {
        setCurrentStep(1);
      }
    }
  }, [visible, mode, initialBPData, type]);

  const questions = useMemo(() => {
    if (type === 'simple') {
      return [
        {
          question: 'Quel est votre modèle économique ?',
          placeholder: 'Comment allez-vous générer des revenus ?',
          key: 'answer1' as keyof FormData,
        },
        {
          question: 'Comment organisez-vous votre équipe ?',
          placeholder: 'Décrivez la structure de votre équipe...',
          key: 'answer2' as keyof FormData,
        },
        {
          question: 'Quel est votre plan financier ?',
          placeholder: 'Détaillez vos prévisions financières...',
          key: 'answer3' as keyof FormData,
        },
        {
          question: 'Quelles formalités avez-vous identifiées ?',
          placeholder: 'Listez les démarches administratives...',
          key: 'answer4' as keyof FormData,
        },
      ];
    } else {
      return [
        {
          question: 'Quelle est votre stratégie de croissance ?',
          placeholder: 'Décrivez votre plan de développement...',
          key: 'answer1' as keyof FormData,
        },
        {
          question: 'Comment innovez-vous dans votre secteur ?',
          placeholder: 'Expliquez vos innovations et différenciateurs...',
          key: 'answer2' as keyof FormData,
        },
        {
          question: 'Quel est votre impact mesurable ?',
          placeholder: 'Décrivez les indicateurs de votre impact...',
          key: 'answer3' as keyof FormData,
        },
        {
          question: 'Comment développez-vous votre leadership ?',
          placeholder: 'Présentez votre vision du leadership...',
          key: 'answer4' as keyof FormData,
        },
      ];
    }
  }, [type]);

  const canProceed = useMemo(() => {
    if (currentStep === 1) return true;
    if (currentStep === TOTAL_STEPS) return true;

    const questionIndex = currentStep - 2;
    const q = questionIndex >= 0 && questionIndex < questions.length ? questions[questionIndex] : undefined;
    if (q) {
      return formData[q.key].length >= MIN_CHARS;
    }

    return false;
  }, [currentStep, formData, questions]);

  const generatedDocument = useMemo(() => {
    const sections: string[] = [];

    if (type === 'full') {
      sections.push(`BUSINESS PLAN COMPLET\n${'='.repeat(40)}\n`);
    } else {
      sections.push(`BUSINESS PLAN SIMPLIFIÉ\n${'='.repeat(40)}\n`);
    }

    if (existingData?.sectorName) {
      sections.push(`SECTEUR\n${existingData.sectorName}\n`);
    }

    if (existingData?.pitch) {
      sections.push(`PROBLÈME\n${existingData.pitch.problem}\n`);
      sections.push(`SOLUTION\n${existingData.pitch.solution}\n`);
      sections.push(`CIBLE\n${existingData.pitch.target}\n`);
      sections.push(`VIABILITÉ\n${existingData.pitch.viability}\n`);
      sections.push(`IMPACT\n${existingData.pitch.impact}\n`);
    }

    if (type === 'simple') {
      if (formData.answer1) sections.push(`MODÈLE ÉCONOMIQUE\n${formData.answer1}\n`);
      if (formData.answer2) sections.push(`ORGANISATION\n${formData.answer2}\n`);
      if (formData.answer3) sections.push(`PLAN FINANCIER\n${formData.answer3}\n`);
      if (formData.answer4) sections.push(`FORMALITÉS\n${formData.answer4}\n`);
    } else {
      if (existingData?.businessPlanSimple) {
        const bpContent = existingData.businessPlanSimple.content;
        sections.push(`MODÈLE ÉCONOMIQUE\n${bpContent['businessModel'] || ''}\n`);
        sections.push(`ORGANISATION\n${bpContent['organization'] || ''}\n`);
        sections.push(`PLAN FINANCIER\n${bpContent['financialPlan'] || ''}\n`);
        sections.push(`FORMALITÉS\n${bpContent['formalities'] || ''}\n`);
      }

      if (formData.answer1) sections.push(`STRATÉGIE DE CROISSANCE\n${formData.answer1}\n`);
      if (formData.answer2) sections.push(`INNOVATION\n${formData.answer2}\n`);
      if (formData.answer3) sections.push(`IMPACT MESURABLE\n${formData.answer3}\n`);
      if (formData.answer4) sections.push(`LEADERSHIP\n${formData.answer4}\n`);
    }

    return sections.join('\n');
  }, [type, existingData, formData]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleValidate = useCallback(() => {
    const content: Record<string, string> = type === 'simple'
      ? {
          businessModel: formData.answer1,
          organization: formData.answer2,
          financialPlan: formData.answer3,
          formalities: formData.answer4,
        }
      : {
          growthStrategy: formData.answer1,
          innovation: formData.answer2,
          measurableImpact: formData.answer3,
          leadership: formData.answer4,
        };

    useChallengeStore.getState().saveBusinessPlan(
      enrollmentId,
      type,
      content,
      generatedDocument
    );

    onComplete();
  }, [enrollmentId, type, formData, generatedDocument, onComplete]);

  const handleEdit = useCallback(() => {
    setCurrentMode('edit');
    setCurrentStep(2); // Jump to first question
  }, []);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setCurrentMode('create');
    setFormData({
      answer1: '',
      answer2: '',
      answer3: '',
      answer4: '',
    });
    onClose();
  }, [onClose]);

  const renderStepIndicator = useCallback(() => (
    <View style={styles.stepIndicatorContainer}>
      <Text style={styles.stepText}>
        Étape {currentStep}/{TOTAL_STEPS}
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / TOTAL_STEPS) * 100}%` }
          ]}
        />
      </View>
    </View>
  ), [currentStep]);

  const renderRecapStep = useCallback(() => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.contentContainer}>
        <Text style={styles.stepTitle}>VOTRE PARCOURS</Text>

        {existingData?.sectorName && (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.sectorBadge}>
            <Ionicons name="briefcase" size={16} color={COLORS.primary} />
            <Text style={styles.sectorText}>{existingData.sectorName}</Text>
          </Animated.View>
        )}

        {existingData?.pitch && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.pitchContainer}>
            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Problème</Text>
              <Text style={styles.pitchValue}>{existingData.pitch.problem}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Solution</Text>
              <Text style={styles.pitchValue}>{existingData.pitch.solution}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Cible</Text>
              <Text style={styles.pitchValue}>{existingData.pitch.target}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Viabilité</Text>
              <Text style={styles.pitchValue}>{existingData.pitch.viability}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Impact</Text>
              <Text style={styles.pitchValue}>{existingData.pitch.impact}</Text>
            </View>
          </Animated.View>
        )}

        {type === 'full' && existingData?.businessPlanSimple && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.pitchContainer}>
            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Modèle économique</Text>
              <Text style={styles.pitchValue}>{existingData.businessPlanSimple.content['businessModel'] || ''}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Organisation</Text>
              <Text style={styles.pitchValue}>{existingData.businessPlanSimple.content['organization'] || ''}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Plan financier</Text>
              <Text style={styles.pitchValue}>{existingData.businessPlanSimple.content['financialPlan'] || ''}</Text>
            </View>

            <View style={styles.pitchCard}>
              <Text style={styles.pitchLabel}>Formalités</Text>
              <Text style={styles.pitchValue}>{existingData.businessPlanSimple.content['formalities'] || ''}</Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(500)}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}
          >
            <Text style={styles.continueButtonText}>CONTINUER</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </ScrollView>
  ), [existingData, type, handleNext]);

  const renderQuestionStep = useCallback(() => {
    const questionIndex = currentStep - 2;
    if (questionIndex < 0 || questionIndex >= questions.length) return null;

    const question = questions[questionIndex];
    if (!question) return null;
    const currentAnswer = formData[question.key];

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.contentContainer}>
          <Text style={styles.stepTitle}>{question.question}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={currentAnswer}
              onChangeText={(text) => setFormData(prev => ({ ...prev, [question.key]: text }))}
              placeholder={question.placeholder}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>
              {currentAnswer.length} / {MIN_CHARS} caractères minimum
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    );
  }, [currentStep, questions, formData]);

  const renderGeneratedView = useCallback(() => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(100)} style={styles.contentContainer}>
        <Text style={styles.stepTitle}>
          {type === 'full' ? 'BUSINESS PLAN COMPLET' : 'VOTRE BUSINESS PLAN'}
        </Text>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.documentCard}>
          <View style={styles.documentContent}>
            {existingData?.sectorName && (
              <View style={styles.documentSection}>
                <Text style={styles.documentSectionTitle}>SECTEUR</Text>
                <Text style={styles.documentSectionText}>{existingData.sectorName}</Text>
              </View>
            )}

            {existingData?.pitch && (
              <>
                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>PROBLÈME</Text>
                  <Text style={styles.documentSectionText}>{existingData.pitch.problem}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>SOLUTION</Text>
                  <Text style={styles.documentSectionText}>{existingData.pitch.solution}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>CIBLE</Text>
                  <Text style={styles.documentSectionText}>{existingData.pitch.target}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>VIABILITÉ</Text>
                  <Text style={styles.documentSectionText}>{existingData.pitch.viability}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>IMPACT</Text>
                  <Text style={styles.documentSectionText}>{existingData.pitch.impact}</Text>
                </View>
              </>
            )}

            {type === 'simple' ? (
              <>
                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>MODÈLE ÉCONOMIQUE</Text>
                  <Text style={styles.documentSectionText}>{formData.answer1}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>ORGANISATION</Text>
                  <Text style={styles.documentSectionText}>{formData.answer2}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>PLAN FINANCIER</Text>
                  <Text style={styles.documentSectionText}>{formData.answer3}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>FORMALITÉS</Text>
                  <Text style={styles.documentSectionText}>{formData.answer4}</Text>
                </View>
              </>
            ) : (
              <>
                {existingData?.businessPlanSimple && (
                  <>
                    <View style={styles.documentSection}>
                      <Text style={styles.documentSectionTitle}>MODÈLE ÉCONOMIQUE</Text>
                      <Text style={styles.documentSectionText}>{existingData.businessPlanSimple.content['businessModel'] || ''}</Text>
                    </View>

                    <View style={styles.documentSection}>
                      <Text style={styles.documentSectionTitle}>ORGANISATION</Text>
                      <Text style={styles.documentSectionText}>{existingData.businessPlanSimple.content['organization'] || ''}</Text>
                    </View>

                    <View style={styles.documentSection}>
                      <Text style={styles.documentSectionTitle}>PLAN FINANCIER</Text>
                      <Text style={styles.documentSectionText}>{existingData.businessPlanSimple.content['financialPlan'] || ''}</Text>
                    </View>

                    <View style={styles.documentSection}>
                      <Text style={styles.documentSectionTitle}>FORMALITÉS</Text>
                      <Text style={styles.documentSectionText}>{existingData.businessPlanSimple.content['formalities'] || ''}</Text>
                    </View>
                  </>
                )}

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>STRATÉGIE DE CROISSANCE</Text>
                  <Text style={styles.documentSectionText}>{formData.answer1}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>INNOVATION</Text>
                  <Text style={styles.documentSectionText}>{formData.answer2}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>IMPACT MESURABLE</Text>
                  <Text style={styles.documentSectionText}>{formData.answer3}</Text>
                </View>

                <View style={styles.documentSection}>
                  <Text style={styles.documentSectionTitle}>LEADERSHIP</Text>
                  <Text style={styles.documentSectionText}>{formData.answer4}</Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          {currentMode === 'view' ? (
            <Pressable
              style={({ pressed }) => [
                styles.validateButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.white} style={{ marginRight: SPACING[2] }} />
              <Text style={styles.validateButtonText}>MODIFIER</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.validateButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleValidate}
            >
              <Text style={styles.validateButtonText}>
                {currentMode === 'edit' ? 'ENREGISTRER' : 'VALIDER MON BUSINESS PLAN'}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </Animated.View>
    </ScrollView>
  ), [type, existingData, formData, currentMode, handleValidate, handleEdit]);

  const renderCurrentStep = useCallback(() => {
    if (currentStep === 1) {
      return renderRecapStep();
    } else if (currentStep === TOTAL_STEPS) {
      return renderGeneratedView();
    } else {
      return renderQuestionStep();
    }
  }, [currentStep, renderRecapStep, renderGeneratedView, renderQuestionStep]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <RadialBackground />

        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </Pressable>

            {renderStepIndicator()}
          </View>

          {renderCurrentStep()}

          {currentStep > 1 && currentStep < TOTAL_STEPS && (
            <Animated.View
              entering={FadeIn}
              style={[styles.navigationContainer, { paddingBottom: insets.bottom + SPACING[4] }]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.navigationButton,
                  styles.previousButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handlePrevious}
              >
                <Ionicons name="arrow-back" size={20} color={COLORS.white} />
                <Text style={styles.navigationButtonText}>PRÉCÉDENT</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.navigationButton,
                  styles.nextButton,
                  !canProceed && styles.navigationButtonDisabled,
                  pressed && canProceed && styles.buttonPressed,
                ]}
                onPress={handleNext}
                disabled={!canProceed}
              >
                <Text style={styles.navigationButtonText}>SUIVANT</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  stepIndicatorContainer: {
    gap: SPACING[2],
  },
  stepText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[4],
  },
  contentContainer: {
    gap: SPACING[6],
  },
  stepTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'center',
  },
  sectorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  pitchContainer: {
    gap: SPACING[3],
  },
  pitchCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    gap: SPACING[2],
  },
  pitchLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pitchValue: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[6],
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  inputContainer: {
    gap: SPACING[2],
  },
  textInput: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    minHeight: 150,
  },
  charCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  documentCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  documentContent: {
    padding: SPACING[5],
    gap: SPACING[5],
  },
  documentSection: {
    gap: SPACING[2],
    paddingBottom: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  documentSectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  documentSectionText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    lineHeight: FONT_SIZES.sm * 1.6,
  },
  validateButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[6],
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  validateButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
    gap: SPACING[3],
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[5],
    borderRadius: BORDER_RADIUS.xl,
    flex: 1,
  },
  previousButton: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
  },
  navigationButtonDisabled: {
    opacity: 0.5,
  },
  navigationButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
