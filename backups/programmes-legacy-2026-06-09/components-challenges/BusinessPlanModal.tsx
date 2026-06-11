/**
 * BusinessPlanModal - Business plan simple ou complet (Niveaux 3-4)
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

const SIMPLE_STEPS = ['modele', 'organisation', 'finances', 'formalites'];
const FULL_STEPS = ['croissance', 'innovation', 'impact', 'leadership'];

export const BusinessPlanModal = memo(function BusinessPlanModal({
  visible,
  onClose,
  onValidate,
  type,
  initialData,
  mode,
}: BusinessPlanModalProps) {
  const steps = type === 'simple' ? SIMPLE_STEPS : FULL_STEPS;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>(initialData ?? {});

  if (!visible) return null;

  const key = steps[step] ?? steps[0];
  const value = key ? values[key] ?? '' : '';
  const isValid = value.length >= 20;

  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else {
      const doc = steps.map((k) => `**${k}**\n${values[k] ?? ''}\n`).join('\n');
      onValidate({
        content: { ...values },
        generatedDocument: doc,
        ...(type === 'full' ? { certificate: `Certificat-${Date.now()}` } : {}),
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
              <Text style={styles.title}>BP {type === 'simple' ? 'Simple' : 'Complet'} - Étape {step + 1}/{steps.length}</Text>
              <Text style={styles.label}>{key}</Text>
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={(t) => key && setValues((v) => ({ ...v, [key]: t }))}
                placeholder="Min 20 caractères..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                editable={mode !== 'view'}
                maxLength={500}
              />
              <View style={styles.actions}>
                {step > 0 && <GameButton variant="blue" title="PRÉCÉDENT" onPress={handlePrev} fullWidth style={styles.actionBtn} />}
                <GameButton variant="yellow" title={step < steps.length - 1 ? 'SUIVANT' : 'VALIDER'} onPress={handleNext} fullWidth disabled={!isValid} />
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
