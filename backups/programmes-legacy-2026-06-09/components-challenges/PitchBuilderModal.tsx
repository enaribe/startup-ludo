/**
 * PitchBuilderModal - Construction du pitch (Niveau 2)
 */

import { memo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';

const { width: screenWidth } = Dimensions.get('window');

const STEPS = [
  { key: 'problem', label: 'Problème / Besoin' },
  { key: 'solution', label: 'Solution' },
  { key: 'target', label: 'Marché cible' },
  { key: 'viability', label: 'Faisabilité' },
  { key: 'impact', label: 'Impact social/environnemental' },
];

interface PitchBuilderModalProps {
  visible: boolean;
  onClose: () => void;
  onValidate: (pitch: {
    problem: string;
    solution: string;
    target: string;
    viability: string;
    impact: string;
    generatedDocument: string;
  }) => void;
  initialData?: Partial<{ problem: string; solution: string; target: string; viability: string; impact: string }>;
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
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    problem: initialData?.problem ?? '',
    solution: initialData?.solution ?? '',
    target: initialData?.target ?? '',
    viability: initialData?.viability ?? '',
    impact: initialData?.impact ?? '',
  });

  if (!visible) return null;

  const currentKey = STEPS[step]?.key as keyof typeof values;
  const currentValue = values[currentKey] ?? '';
  const isValid = currentValue.length >= 20;

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else {
      const doc = STEPS.map((s) => `**${s.label}**\n${values[s.key as keyof typeof values] ?? ''}\n`).join('\n');
      onValidate({
        problem: values.problem,
        solution: values.solution,
        target: values.target,
        viability: values.viability,
        impact: values.impact,
        generatedDocument: doc,
      });
      setStep(0);
      onClose();
    }
  };

  const handlePrev = () => { if (step > 0) setStep((s) => s - 1); };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(300).springify().damping(20)} style={styles.container}>
          <DynamicGradientBorder borderRadius={24} fill="rgba(10,25,41,0.95)" boxWidth={screenWidth - 36}>
            <View style={styles.inner}>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <Text style={styles.title}>Pitch - Étape {step + 1}/{STEPS.length}</Text>
              <Text style={styles.label}>{STEPS[step]?.label}</Text>
              <TextInput
                style={styles.input}
                value={currentValue}
                onChangeText={(t) => setValues((v) => ({ ...v, [currentKey]: t }))}
                placeholder="Min 20 caractères..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                editable={mode !== 'view'}
                maxLength={500}
              />
              <View style={styles.actions}>
                {step > 0 && <GameButton variant="blue" title="PRÉCÉDENT" onPress={handlePrev} fullWidth style={styles.actionBtn} />}
                <GameButton variant="yellow" title={step < STEPS.length - 1 ? 'SUIVANT' : 'VALIDER'} onPress={handleNext} fullWidth disabled={!isValid} />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  container: { width: '100%' },
  inner: { padding: SPACING[5], paddingTop: SPACING[6] },
  closeBtn: { position: 'absolute', top: SPACING[3], right: SPACING[3], width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  title: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: COLORS.text, marginBottom: SPACING[2] },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginBottom: SPACING[2] },
  input: { fontFamily: FONTS.body, fontSize: FONT_SIZES.base, color: COLORS.text, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: SPACING[3], minHeight: 100, textAlignVertical: 'top', marginBottom: SPACING[4] },
  actions: { gap: SPACING[2] },
  actionBtn: {},
});
