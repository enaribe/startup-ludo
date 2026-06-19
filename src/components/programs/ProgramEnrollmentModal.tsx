import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

import { GameButton, GamePopupGradientBorder } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { ProfileMatch, ProgramEndForm, ProgramEnrollmentFormData, ProgramFormField } from '@/types/program';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(screenWidth - SPACING[6], 380);

interface ProgramEnrollmentModalProps {
  visible: boolean;
  programName: string;
  onSubmit: (formData: ProgramEnrollmentFormData) => void;
  onClose: () => void;
  /** Pré-remplissage depuis le compte connecté. */
  defaultFullName?: string;
  defaultEmail?: string;
  /** Formulaire de fin configuré côté admin. Si présent → rendu dynamique des champs. */
  endForm?: ProgramEndForm | null;
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
  endForm,
}: ProgramEnrollmentModalProps) {
  const dynamic = !!endForm && (endForm.fields.length > 0 || endForm.consents.length > 0);

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
  const [popupHeight, setPopupHeight] = useState(0);

  // Mode dynamique : réponses aux champs et consentements configurés côté admin.
  const [customResponses, setCustomResponses] = useState<Record<string, string | string[] | number | boolean>>({});
  const [customConsents, setCustomConsents] = useState<Record<string, boolean>>({});
  const setResponse = (id: string, value: string | string[] | number | boolean) =>
    setCustomResponses((prev) => ({ ...prev, [id]: value }));

  // Animation d'entrée façon GamePopup (scale + fade).
  const popupScale = useSharedValue(0.85);
  const popupOpacity = useSharedValue(0);
  useEffect(() => {
    if (visible) {
      popupOpacity.value = withTiming(1, { duration: 280 });
      popupScale.value = withSpring(1, { damping: 14, stiffness: 130 });
    } else {
      popupOpacity.value = 0;
      popupScale.value = 0.85;
    }
  }, [visible, popupOpacity, popupScale]);
  const popupAnimStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: popupScale.value }],
  }));

  // Pré-remplir nom/email à l'ouverture sans écraser une saisie en cours.
  useEffect(() => {
    if (visible) {
      setFullName((prev) => prev || defaultFullName || '');
      setEmail((prev) => prev || defaultEmail || '');
    }
  }, [visible, defaultFullName, defaultEmail]);

  // Validation d'une réponse dynamique selon le type/required du champ.
  const isFieldValid = (field: ProgramFormField): boolean => {
    if (!field.required) return true;
    const v = customResponses[field.id];
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'boolean') return v === true;
    return true;
  };

  const canSubmitDynamic =
    (endForm?.fields ?? []).every(isFieldValid) &&
    (endForm?.consents ?? []).filter((c) => c.enabled && c.required).every((c) => customConsents[c.id] === true);

  const canSubmitFixed =
    fullName.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    EMAIL_REGEX.test(email.trim()) &&
    consentContact;

  const canSubmit = dynamic ? canSubmitDynamic : canSubmitFixed;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (dynamic) {
      // On mappe quelques champs connus par leur label pour conserver le typage de base.
      const findByLabel = (re: RegExp) => {
        const f = endForm!.fields.find((x) => re.test(x.label));
        return f ? customResponses[f.id] : undefined;
      };
      const asStr = (v: unknown) => (typeof v === 'string' ? v : '');
      onSubmit({
        fullName: asStr(findByLabel(/nom/i)).trim(),
        phone: asStr(findByLabel(/t[ée]l/i)).trim(),
        email: asStr(findByLabel(/email|courriel/i)).trim(),
        city: asStr(findByLabel(/ville/i)).trim(),
        professionalStatus: asStr(findByLabel(/statut/i)).trim(),
        profileMatch,
        applicationIntent,
        consentDataProcessing,
        consentContact,
        newsletterOptIn,
        customResponses,
        customConsents,
      });
      return;
    }
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.popupWrapper, popupAnimStyle]}>
          {/* Bordure dégradée grise façon GamePopup */}
          <GamePopupGradientBorder
            width={MODAL_WIDTH}
            height={popupHeight}
            borderRadius={24}
            gradientId="enrollmentBorder"
          />
          <View
            style={styles.container}
            onLayout={(e) => setPopupHeight(e.nativeEvent.layout.height)}
          >
            {/* Fond radial façon GamePopup */}
            <Svg style={StyleSheet.absoluteFill} width={MODAL_WIDTH} height={popupHeight || 1}>
              <Defs>
                <RadialGradient id="enrollmentBg" cx="50%" cy="35%" r="75%">
                  <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
                </RadialGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#enrollmentBg)" rx="24" />
            </Svg>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.title}>VOS COORDONNÉES</Text>
              {!!programName && <Text style={styles.programName}>{programName}</Text>}

            {dynamic ? (
              endForm!.fields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={customResponses[field.id]}
                  onChange={(v) => setResponse(field.id, v)}
                />
              ))
            ) : (
              <>
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
              </>
            )}

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

            {dynamic ? (
              endForm!.consents.filter((c) => c.enabled).map((c) => (
                <ConsentRow
                  key={c.id}
                  checked={customConsents[c.id] === true}
                  onToggle={() => setCustomConsents((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                >
                  {c.label}{c.required ? ' ' : ''}
                  {c.required && <Text style={styles.consentEmphasis}>(Obligatoire)</Text>}
                </ConsentRow>
              ))
            ) : (
              <>
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
              </>
            )}

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
        </Animated.View>
      </KeyboardAvoidingView>
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

/** Rend un champ du formulaire de fin selon son type. */
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ProgramFormField;
  value: string | string[] | number | boolean | undefined;
  onChange: (v: string | string[] | number | boolean) => void;
}) {
  const label = field.required ? `${field.label} *` : field.label;

  switch (field.type) {
    case 'long_text':
      return (
        <Field label={label}>
          <TextInput
            value={typeof value === 'string' ? value : ''}
            onChangeText={onChange}
            placeholder={field.placeholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }]}
            multiline
            maxLength={field.maxLength}
          />
        </Field>
      );
    case 'select':
    case 'radio':
      return (
        <Field label={label}>
          <View style={styles.choicesWrap}>
            {(field.options ?? []).map((opt) => {
              const selected = value === opt;
              return (
                <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.choicePill, selected && styles.choiceSelected]}>
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      );
    case 'multi_select': {
      const arr = Array.isArray(value) ? value : [];
      return (
        <Field label={label}>
          <View style={styles.choicesWrap}>
            {(field.options ?? []).map((opt) => {
              const selected = arr.includes(opt);
              return (
                <Pressable
                  key={opt}
                  onPress={() => onChange(selected ? arr.filter((o) => o !== opt) : [...arr, opt])}
                  style={[styles.choicePill, selected && styles.choiceSelected]}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
      );
    }
    case 'checkbox':
      return (
        <Pressable onPress={() => onChange(!(value === true))} style={styles.consentRow}>
          <View style={[styles.checkbox, value === true && styles.checkboxChecked]}>
            {value === true && <Ionicons name="checkmark" size={16} color="#0A1929" />}
          </View>
          <Text style={styles.consentText}>{label}</Text>
        </Pressable>
      );
    case 'slider': {
      const min = field.min ?? 1;
      const max = field.max ?? 10;
      const current = typeof value === 'number' ? value : min;
      return (
        <Field label={`${label} : ${current}`}>
          <View style={styles.choicesWrap}>
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
              <Pressable key={n} onPress={() => onChange(n)} style={[styles.sliderDot, current === n && styles.choiceSelected]}>
                <Text style={[styles.choiceText, current === n && styles.choiceTextSelected]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
      );
    }
    case 'phone':
    case 'email':
    case 'date':
    case 'file':
    case 'short_text':
    default:
      return (
        <Field label={label}>
          <TextInput
            value={typeof value === 'string' ? value : ''}
            onChangeText={onChange}
            placeholder={field.placeholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType={field.type === 'phone' ? 'phone-pad' : field.type === 'email' ? 'email-address' : 'default'}
            autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
            style={styles.input}
          />
        </Field>
      );
  }
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.overlayDark,
  },
  popupWrapper: {
    width: MODAL_WIDTH,
    borderRadius: 24,
  },
  container: {
    width: MODAL_WIDTH,
    maxHeight: screenHeight * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#081A2A',
  },
  scrollContent: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[6],
    gap: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: COLORS.white,
    textAlign: 'center',
  },
  programName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING[2],
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
  choicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  choicePill: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#081A2A',
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
