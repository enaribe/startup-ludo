/**
 * Modal Business Plan simple ou complet (Niveaux 3-4)
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

const BP_SIMPLE_STEPS = [
  { key: 'modele', label: 'Modèle économique' },
  { key: 'organisation', label: 'Organisation équipe' },
  { key: 'finances', label: 'Plan financier' },
  { key: 'formalites', label: 'Formalités administratives' },
];

const BP_FULL_STEPS = [
  { key: 'croissance', label: 'Stratégie de croissance' },
  { key: 'innovation', label: 'Innovation' },
  { key: 'impact', label: 'Impact mesurable' },
  { key: 'leadership', label: 'Développement leadership' },
];

interface BusinessPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onValidate: (bp: { content: Record<string, string>; generatedDocument: string; certificate?: string }) => void;
  type: 'simple' | 'full';
  initialData?: Record<string, string>;
  mode: 'create' | 'view' | 'edit';
  sectorName?: string;
  pitchData?: { problem: string; solution: string; target: string; viability: string; impact: string };
  bpSimpleData?: Record<string, string>;
}

export const BusinessPlanModal = memo(function BusinessPlanModal({
  visible,
  onClose,
  onValidate,
  type,
  initialData,
  mode,
}: BusinessPlanModalProps) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const steps = type === 'simple' ? BP_SIMPLE_STEPS : BP_FULL_STEPS;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initialData ?? {});

  const handleClose = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(0);
    onClose();
  };

  const currentStep = steps[step];
  const currentValue = currentStep ? values[currentStep.key] ?? '' : '';
  const isValid = currentValue.length >= 20;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      const doc = steps.map((s) => `**${s.label}**\n${values[s.key] ?? ''}\n`).join('\n');
      onValidate({
        content: { ...values },
        generatedDocument: doc,
        ...(type === 'full' ? { certificate: `Certificat Champion - ${Date.now()}` } : {}),
      });
      handleClose();
    }
  };

  const handlePrev = () => { if (step > 0) setStep((s) => s - 1); };

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
              <Text style={styles.title}>
                BP {type === 'simple' ? 'Simple' : 'Complet'} - Étape {step + 1}/{steps.length}
              </Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%` }]} />
              </View>
              {currentStep && (
                <>
                  <Text style={styles.label}>{currentStep.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={currentValue}
                    onChangeText={(t) => setValues((v) => ({ ...v, [currentStep.key]: t }))}
                    placeholder="Min 20 caractères..."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    editable={mode !== 'view'}
                    maxLength={500}
                  />
                </>
              )}
              <View style={styles.actions}>
                {step > 0 && (
                  <GameButton variant="blue" title="PRÉCÉDENT" onPress={handlePrev} fullWidth style={styles.actionBtn} />
                )}
                <GameButton
                  variant="yellow"
                  title={step < steps.length - 1 ? 'SUIVANT' : 'VALIDER'}
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
    marginBottom: SPACING[4],
  },
  actions: { gap: SPACING[2] },
  actionBtn: {},
});
