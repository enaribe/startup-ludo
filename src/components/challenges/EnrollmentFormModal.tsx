/**
 * EnrollmentFormModal - Formulaire d'inscription au programme
 *
 * Collecte les informations du participant avant l'inscription:
 * - Nom, Prenom, Age, Region
 * - Questions Oui/Non sur le profil entrepreneur
 * - Numero de telephone (optionnel)
 */

import { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import type { EnrollmentFormData } from '@/types/challenge';

const { width: screenWidth } = Dimensions.get('window');

interface EnrollmentFormModalProps {
  visible: boolean;
  challengeName: string;
  onSubmit: (data: EnrollmentFormData) => void;
  onClose: () => void;
}

// ===== COMPOSANT BOUTON OUI / NON =====

interface YesNoButtonsProps {
  value: boolean | null;
  onChange: (val: boolean) => void;
}

const YesNoButtons = memo(function YesNoButtons({ value, onChange }: YesNoButtonsProps) {
  return (
    <View style={styles.yesNoRow}>
      <Pressable
        onPress={() => onChange(true)}
        style={[styles.yesNoBtn, value === true && styles.yesNoBtnActiveYes]}
      >
        <Text style={[styles.yesNoBtnText, value === true && styles.yesNoBtnTextActive]}>
          OUI
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(false)}
        style={[styles.yesNoBtn, value === false && styles.yesNoBtnActiveNo]}
      >
        <Text style={[styles.yesNoBtnText, value === false && styles.yesNoBtnTextActive]}>
          NON
        </Text>
      </Pressable>
    </View>
  );
});

// ===== COMPOSANT PRINCIPAL =====

export const EnrollmentFormModal = memo(function EnrollmentFormModal({
  visible,
  challengeName,
  onSubmit,
  onClose,
}: EnrollmentFormModalProps) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [region, setRegion] = useState('');
  const [isCurrentEntrepreneur, setIsCurrentEntrepreneur] = useState<boolean | null>(null);
  const [planToStart, setPlanToStart] = useState<boolean | null>(null);
  const [wantsContact, setWantsContact] = useState<boolean | null>(null);
  const [phone, setPhone] = useState('');

  const isValid = lastName.trim().length >= 2
    && firstName.trim().length >= 2
    && age.trim().length > 0
    && region.trim().length >= 2
    && isCurrentEntrepreneur !== null;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSubmit({
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      age: age.trim(),
      region: region.trim(),
      isCurrentEntrepreneur,
      planToStart,
      wantsContact,
      phone: phone.trim(),
    });
  }, [isValid, lastName, firstName, age, region, isCurrentEntrepreneur, planToStart, wantsContact, phone, onSubmit]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animated.View entering={SlideInUp.duration(300).springify().damping(20)} style={styles.container}>
            <DynamicGradientBorder borderRadius={24} fill="rgba(10,25,41,0.97)" boxWidth={screenWidth - 36}>
              <View style={styles.inner}>
                {/* Close button */}
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
                </Pressable>

                {/* Header */}
                <Text style={styles.badge}>INSCRIPTION</Text>
                <Text style={styles.title}>{challengeName}</Text>
                <Text style={styles.subtitle}>
                  Remplissez ce formulaire pour rejoindre le programme
                </Text>

                <ScrollView
                  style={styles.scroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Nom */}
                  <Animated.View entering={FadeInDown.delay(100).duration(300)}>
                    <Text style={styles.label}>NOM</Text>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Votre nom de famille"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      autoCapitalize="words"
                    />
                  </Animated.View>

                  {/* Prenom */}
                  <Animated.View entering={FadeInDown.delay(150).duration(300)}>
                    <Text style={styles.label}>PRENOM</Text>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Votre prenom"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      autoCapitalize="words"
                    />
                  </Animated.View>

                  {/* Age */}
                  <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                    <Text style={styles.label}>AGE</Text>
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      placeholder="Votre age"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="number-pad"
                    />
                  </Animated.View>

                  {/* Region */}
                  <Animated.View entering={FadeInDown.delay(250).duration(300)}>
                    <Text style={styles.label}>REGION</Text>
                    <TextInput
                      style={styles.input}
                      value={region}
                      onChangeText={setRegion}
                      placeholder="Votre region"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      autoCapitalize="words"
                    />
                  </Animated.View>

                  {/* Question 1: Entrepreneur actuel */}
                  <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                    <Text style={styles.questionLabel}>
                      ETES VOUS ACTUELLEMENT ENTREPRENEUR DANS L'AGRICULTURE?
                    </Text>
                    <YesNoButtons value={isCurrentEntrepreneur} onChange={setIsCurrentEntrepreneur} />
                  </Animated.View>

                  {/* Question 2: Prévoit de se lancer (visible si pas entrepreneur) */}
                  {isCurrentEntrepreneur === false && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                      <Text style={styles.questionLabel}>
                        SI NON, PREVOYEZ VOUS DE VOUS LANCER DANS L'AGRICULTURE DANS LES 6 - 12 PROCHAINS MOIS?
                      </Text>
                      <YesNoButtons value={planToStart} onChange={setPlanToStart} />
                    </Animated.View>
                  )}

                  {/* Question 3: Contact */}
                  <Animated.View entering={FadeInDown.delay(350).duration(300)}>
                    <Text style={styles.questionLabel}>
                      NUMERO DE TELEPHONE SI VOUS SOUHAITEZ ETRE CONTACTE POUR BENEFICIER DES OPPORTUNITES D'ACCOMPAGNEMENT DU PROGRAMME {challengeName.toUpperCase()}.
                    </Text>
                    <YesNoButtons value={wantsContact} onChange={setWantsContact} />
                  </Animated.View>

                  {/* Phone input (visible si veut être contacté) */}
                  {wantsContact === true && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                      <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Numero de telephone"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType="phone-pad"
                      />
                    </Animated.View>
                  )}

                  {/* Spacer */}
                  <View style={{ height: SPACING[4] }} />
                </ScrollView>

                {/* Submit button */}
                <GameButton
                  variant="green"
                  title="COMMENCER"
                  onPress={handleSubmit}
                  fullWidth
                  disabled={!isValid}
                />
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
});

// ===== STYLES =====

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxHeight: '90%',
  },
  inner: {
    padding: SPACING[5],
    paddingTop: SPACING[6],
  },
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
  badge: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING[1],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING[1],
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[4],
  },
  scroll: {
    maxHeight: 420,
    marginBottom: SPACING[4],
  },
  label: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: SPACING[2],
    marginTop: SPACING[3],
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  questionLabel: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginTop: SPACING[5],
    marginBottom: SPACING[3],
    lineHeight: FONT_SIZES.sm * 1.5,
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  yesNoBtn: {
    flex: 1,
    paddingVertical: SPACING[3],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  yesNoBtnActiveYes: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,188,64,0.12)',
  },
  yesNoBtnActiveNo: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,188,64,0.12)',
  },
  yesNoBtnText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  yesNoBtnTextActive: {
    color: COLORS.primary,
  },
});
