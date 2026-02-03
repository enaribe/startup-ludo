/**
 * Modal pitch guidé en 5 étapes (Niveau 2)
 */

import { memo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';
import { useSettingsStore } from '@/stores';

const { width: screenWidth } = Dimensions.get('window');

const PITCH_STEPS = [
  { key: 'problem', label: 'Problème / Besoin', min: 20, max: 500 },
  { key: 'solution', label: 'Solution', min: 20, max: 500 },
  { key: 'target', label: 'Marché cible', min: 20, max: 500 },
  { key: 'viability', label: 'Faisabilité', min: 20, max: 500 },
  { key: 'impact', label: 'Impact social/environnemental', min: 20, max: 500 },
];

export interface PitchData {
  problem: string;
  solution: string;
  target: string;
  viability: string;
  impact: string;
  generatedDocument: string;
}

interface PitchBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onValidate: (pitch: PitchData) => void;
  initialData?: Partial<PitchData>;
  mode: 'create' | 'view' | 'edit';
  sectorName?: string;
}

export const PitchBuilderModal = memo(function PitchBuilderModal({
  visible,
  onClose,
  onValidate,
  initialData,
  mode,
}: PitchBuilderModalProps) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    problem: initialData?.problem ?? '',
    solution: initialData?.solution ?? '',
    target: initialData?.target ?? '',
    viability: initialData?.viability ?? '',
    impact: initialData?.impact ?? '',
  });

  const handleClose = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(0);
    onClose();
  };

  const currentStep = PITCH_STEPS[step];
  const currentValue = currentStep ? values[currentStep.key] ?? '' : '';
  const isValid = currentValue.length >= (currentStep?.min ?? 0) && currentValue.length <= (currentStep?.max ?? 500);

  const handleNext = () => {
    if (step < PITCH_STEPS.length - 1) {
      setStep((s) => s + 1);
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      const doc = PITCH_STEPS.map(
        (s) => `**${s.label}**\n${values[s.key] ?? ''}\n`
      ).join('\n');
      onValidate({
        problem: values.problem ?? '',
        solution: values.solution ?? '',
        target: values.target ?? '',
        viability: values.viability ?? '',
        impact: values.impact ?? '',
        generatedDocument: doc,
      });
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View entering={SlideInUp.duration(300).springify().damping(20)} style={styles.container}>
          <DynamicGradientBorder borderRadius={24} fill="rgba(10, 25, 41, 0.95)" boxWidth={screenWidth - 36}>
            <View style={styles.inner}>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <Text style={styles.title}>Pitch - Étape {step + 1}/{PITCH_STEPS.length}</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${((step + 1) / PITCH_STEPS.length) * 100}%` }]} />
              </View>
              {currentStep && (
                <>
                  <Text style={styles.label}>{currentStep.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={currentValue}
                    onChangeText={(t) => setValues((v) => ({ ...v, [currentStep.key]: t }))}
                    placeholder={`Min ${currentStep.min} caractères...`}
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    editable={mode !== 'view'}
                    maxLength={currentStep.max}
                  />
                  <Text style={styles.hint}>{currentValue.length}/{currentStep.max}</Text>
                </>
              )}
              <View style={styles.actions}>
                {step > 0 && (
                  <GameButton variant="blue" title="PRÉCÉDENT" onPress={handlePrev} fullWidth style={styles.actionBtn} />
                )}
                <GameButton
                  variant="yellow"
                  title={step < PITCH_STEPS.length - 1 ? 'SUIVANT' : 'VALIDER'}
                  onPress={handleNext}
                  fullWidth
                  disabled={!isValid}
                />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  container: { width: '100%' },
  inner: { padding: SPACING[5], paddingTop: SPACING[6] },
  closeBtn: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  title: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: COLORS.text, marginBottom: SPACING[2] },
  progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: SPACING[4], overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginBottom: SPACING[2] },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: SPACING[3],
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING[1],
  },
  hint: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginBottom: SPACING[4] },
  actions: { gap: SPACING[2] },
  actionBtn: {},
});
