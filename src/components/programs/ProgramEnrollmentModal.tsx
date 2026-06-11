import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GameButton } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { ProfileMatch, ProgramEnrollmentFormData } from '@/types/program';

interface ProgramEnrollmentModalProps {
  visible: boolean;
  programName: string;
  onSubmit: (formData: ProgramEnrollmentFormData) => void;
  onClose: () => void;
  /** Pré-remplissage depuis le compte connecté. */
  defaultFullName?: string;
  defaultEmail?: string;
}

const PROFILE_OPTIONS: { value: ProfileMatch; label: string }[] = [
  { value: 'yes', label: 'Oui' },
  { value: 'no', label: 'Non' },
  { value: 'partial', label: 'Un peu' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ProgramEnrollmentModal = memo(function ProgramEnrollmentModal({
  visible,
  programName,
  onSubmit,
  onClose,
  defaultFullName,
  defaultEmail,
}: ProgramEnrollmentModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [professionalStatus, setProfessionalStatus] = useState('');
  const [profileMatch, setProfileMatch] = useState<ProfileMatch | null>(null);
  const [applicationIntent, setApplicationIntent] = useState(5);
  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // Pré-remplir nom/email à l'ouverture sans écraser une saisie en cours.
  useEffect(() => {
    if (visible) {
      setFullName((prev) => prev || defaultFullName || '');
      setEmail((prev) => prev || defaultEmail || '');
    }
  }, [visible, defaultFullName, defaultEmail]);

  const canSubmit =
    fullName.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    EMAIL_REGEX.test(email.trim()) &&
    consentContact;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: city.trim(),
      professionalStatus: professionalStatus.trim(),
      profileMatch,
      applicationIntent,
      consentDataProcessing,
      consentContact,
      newsletterOptIn,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>VOS COORDONNÉES</Text>
            {!!programName && <Text style={styles.programName}>{programName}</Text>}

            <Field label="Nom complet">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
              />
            </Field>

            <Field label="Téléphone">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="77 000 00 00"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </Field>

            <Field label="Email">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vous@email.com"
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </Field>

            <Field label="Ville actuelle">
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Dakar, Thiès..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
              />
            </Field>

            <Field label="Statut professionnel">
              <TextInput
                value={professionalStatus}
                onChangeText={setProfessionalStatus}
                placeholder="Étudiant, salarié, entrepreneur..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
              />
            </Field>

            <Text style={styles.question}>
              Le profil que vous avez incarné correspond-il à votre situation réelle ?
            </Text>
            <View style={styles.choicesRow}>
              {PROFILE_OPTIONS.map((option) => {
                const selected = profileMatch === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setProfileMatch(option.value)}
                    style={[styles.choice, selected && styles.choiceSelected]}
                  >
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.question}>
              Sur une échelle de 1 à 10, votre intention sérieuse de candidater
            </Text>
            <IntentSlider value={applicationIntent} onChange={setApplicationIntent} />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Peu sûre</Text>
              <Text style={styles.sliderLabel}>Certain·e</Text>
            </View>

            <ConsentRow
              checked={consentDataProcessing}
              onToggle={() => setConsentDataProcessing((v) => !v)}
            >
              J'autorise le traitement de mes données dans le cadre du programme
            </ConsentRow>

            <ConsentRow checked={consentContact} onToggle={() => setConsentContact((v) => !v)}>
              J'accepte d'être contacté·e par le Consortium Jeunesse Sénégal.{' '}
              <Text style={styles.consentEmphasis}>(Obligatoire)</Text>
            </ConsentRow>

            <ConsentRow checked={newsletterOptIn} onToggle={() => setNewsletterOptIn((v) => !v)}>
              Je souhaite recevoir la newsletter Startup Ludo (Optionnel).
            </ConsentRow>

            <View style={styles.actions}>
              <GameButton
                title="ENVOYER MA CANDIDATURE"
                variant="yellow"
                fullWidth
                disabled={!canSubmit}
                onPress={handleSubmit}
              />
              <GameButton title="Fermer" variant="blue" fullWidth onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ConsentRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.consentRow}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color="#0A1929" />}
      </View>
      <Text style={styles.consentText}>{children}</Text>
    </Pressable>
  );
}

function IntentSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const setTrackWidth = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  const valueFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return value;
    const ratio = Math.max(0, Math.min(1, x / w));
    return Math.round(1 + ratio * 9);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => onChange(valueFromX(evt.nativeEvent.locationX)),
        onPanResponderMove: (evt) => onChange(valueFromX(evt.nativeEvent.locationX)),
      }),
    // onChange est stable (setState); on évite de recréer le responder à chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const ratio = (value - 1) / 9;
  const thumbLeft = width > 0 ? ratio * width : 0;

  return (
    <View style={styles.sliderWrap}>
      <Text style={styles.sliderValue}>{value}</Text>
      <View style={styles.sliderTrackArea} onLayout={setTrackWidth} {...panResponder.panHandlers}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: thumbLeft }]} />
        </View>
        <View style={[styles.sliderThumb, { left: thumbLeft - 12 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    maxHeight: '88%',
    paddingTop: SPACING[3],
    backgroundColor: '#0C243E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: SPACING[2],
  },
  scrollContent: {
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[6],
    gap: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.white,
  },
  programName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: SPACING[1],
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.white,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.white,
  },
  question: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.white,
    marginTop: SPACING[2],
  },
  choicesRow: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  choice: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255,188,64,0.16)',
  },
  choiceText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  choiceTextSelected: {
    color: COLORS.primary,
  },
  sliderWrap: {
    alignItems: 'center',
    gap: SPACING[2],
  },
  sliderValue: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.primary,
  },
  sliderTrackArea: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  sliderThumb: {
    position: 'absolute',
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#0C243E',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    padding: SPACING[4],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  consentText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  consentEmphasis: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.white,
  },
  actions: {
    gap: SPACING[2],
    marginTop: SPACING[3],
  },
});
