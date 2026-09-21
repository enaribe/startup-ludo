/**
 * ProfileDetailsScreen — « Fais-nous connaissance », UNE question à la fois
 * (Suivant → Suivant), à la place des popups en cascade de l'accueil.
 *
 * Posée avant d'arriver sur l'accueil :
 *   - à la première inscription (après le choix du pseudo) ;
 *   - au lancement, pour un compte existant dont le profil déclaratif est
 *     incomplet (voir isProfileDetailsComplete).
 *
 * Seules les questions SANS réponse sont posées : la liste des étapes est
 * figée au montage à partir du profil (une question déjà remplie n'est
 * jamais reposée). Tout est enregistré en une fois à la dernière étape,
 * vers Firestore (users/{uid}) et Amplitude (propriétés utilisateur).
 */

import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialBackground } from '@/components/ui/RadialBackground';
import { GameButton } from '@/components/ui/GameButton';
import { PLAYER_REGIONS } from '@/data/regions';
import {
  ACQUISITION_SOURCES,
  AGE_RANGES,
  SITUATIONS,
} from '@/data/profileOptions';
import { useTranslation, type TranslationKey } from '@/i18n';
import { setProfileAttributes, trackEvent } from '@/services/analytics';
import { updateFirestoreUserProfile } from '@/services/firebase';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

type StepId = 'region' | 'age' | 'situation' | 'source';

const STEP_LABELS: Record<StepId, TranslationKey> = {
  region: 'profileDetails.regionLabel',
  age: 'profileDetails.ageLabel',
  situation: 'profileDetails.situationLabel',
  source: 'profileDetails.sourceLabel',
};

export default function ProfileDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  // Étapes figées AU MONTAGE : une question déjà répondue n'est pas reposée,
  // et la liste ne bouge pas pendant que l'utilisateur avance.
  const [steps] = useState<StepId[]>(() => {
    const missing: StepId[] = [];
    if (!profile?.region) missing.push('region');
    if (!profile?.ageRange) missing.push('age');
    if (!profile?.situations?.length) missing.push('situation');
    if (!profile?.acquisitionSource) missing.push('source');
    return missing;
  });
  const [stepIndex, setStepIndex] = useState(0);

  const [region, setRegion] = useState<string | null>(profile?.region ?? null);
  const [ageRange, setAgeRange] = useState<string | null>(profile?.ageRange ?? null);
  const [situations, setSituations] = useState<string[]>(profile?.situations ?? []);
  const [source, setSource] = useState<string | null>(profile?.acquisitionSource ?? null);
  const [sourceDetail, setSourceDetail] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  // Rien à demander (arrivée par erreur) → accueil direct
  useEffect(() => {
    if (steps.length === 0) router.replace('/(tabs)/home');
  }, [steps, router]);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const detail = sourceDetail.trim();

  const stepAnswered =
    step === 'region'
      ? !!region
      : step === 'age'
        ? !!ageRange
        : step === 'situation'
          ? situations.length > 0
          : !!source && (source !== 'autre' || detail.length >= 2);

  const toggleSituation = (id: string) => {
    setSituations((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  /**
   * Canal de provenance coché : événement immédiat + user property, sans
   * attendre la validation finale — si le joueur abandonne l'écran ensuite,
   * le canal est quand même capturé et segmentable partout dans Amplitude.
   * (Un changement de choix ré-émet l'événement ; la property garde le dernier.)
   */
  const choisirSource = (id: string) => {
    setSource(id);
    trackEvent('acquisition_source_selected', { source: id });
    setProfileAttributes({ acquisition_source: id });
  };

  const terminer = async () => {
    if (!user?.id || enregistrement) return;
    setEnregistrement(true);
    if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updates: {
      region?: string;
      ageRange?: string;
      situations?: string[];
      acquisitionSource?: string;
      acquisitionSourceDetail?: string;
    } = {};
    if (region) updates.region = region;
    if (ageRange) updates.ageRange = ageRange;
    if (situations.length > 0) updates.situations = situations;
    if (steps.includes('source') && source) {
      updates.acquisitionSource = source;
      if (source === 'autre' && detail) updates.acquisitionSourceDetail = detail;
    }

    // Amplitude d'abord : la donnée analytics est capturée même hors ligne
    trackEvent('profile_details_submitted', {
      ...(updates.region ? { region: updates.region } : {}),
      ...(updates.ageRange ? { age_range: updates.ageRange } : {}),
      ...(updates.situations ? { situations: updates.situations } : {}),
      ...(updates.acquisitionSource ? { source: updates.acquisitionSource } : {}),
      ...(updates.acquisitionSourceDetail ? { source_detail: updates.acquisitionSourceDetail } : {}),
    });
    setProfileAttributes({
      ...(updates.region ? { region: updates.region } : {}),
      ...(updates.ageRange ? { age_range: updates.ageRange } : {}),
      ...(updates.situations ? { situations: updates.situations } : {}),
      ...(updates.acquisitionSource ? { acquisition_source: updates.acquisitionSource } : {}),
      ...(updates.acquisitionSourceDetail
        ? { acquisition_source_detail: updates.acquisitionSourceDetail }
        : {}),
    });

    // Store local D'ABORD : même si Firestore échoue (hors ligne), la session
    // courante est débloquée — l'écran se re-proposera au prochain lancement
    // seulement si l'écriture distante n'est jamais passée.
    await updateProfile(updates);
    try {
      await updateFirestoreUserProfile(user.id, updates);
    } catch {
      // Non bloquant (voir ci-dessus)
    }
    setEnregistrement(false);
    router.replace('/(tabs)/home');
  };

  const suivant = () => {
    if (!stepAnswered) return;
    if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      void terminer();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const precedent = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  if (!step) return <View style={styles.container} />;

  const chip = (
    key: string,
    label: string,
    actif: boolean,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap,
    showCheck?: boolean
  ) => (
    <Pressable key={key} onPress={onPress} style={[styles.chip, actif && styles.chipActive]}>
      {showCheck && actif && (
        <Ionicons name="checkmark" size={16} color="#4CAF50" style={styles.chipIcon} />
      )}
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={actif ? '#4CAF50' : 'rgba(255,255,255,0.5)'}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.chipLabel, actif && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.content, { paddingTop: insets.top + SPACING[5], paddingBottom: insets.bottom + SPACING[5] }]}>
          {/* En-tête : progression + retour */}
          <View style={styles.header}>
            {stepIndex > 0 ? (
              <Pressable onPress={precedent} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.backBtn} />
            )}
            <View style={styles.progressRow}>
              {steps.map((s, i) => (
                <View
                  key={s}
                  style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]}
                />
              ))}
            </View>
            <View style={styles.backBtn} />
          </View>

          <Text style={styles.title}>{t('profileDetails.title')}</Text>
          <Text style={styles.stepCounter}>
            {t('profileDetails.stepCounter')
              .replace('{current}', String(stepIndex + 1))
              .replace('{total}', String(steps.length))}
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* key = re-déclenche l'animation à chaque étape */}
            <Animated.View key={step} entering={FadeInDown.duration(300)}>
              <Text style={styles.question}>{t(STEP_LABELS[step])}</Text>
              {step === 'situation' && (
                <Text style={styles.hint}>{t('profileDetails.situationHint')}</Text>
              )}

              <View style={styles.chipsWrap}>
                {step === 'region' &&
                  PLAYER_REGIONS.map((r) =>
                    chip(r.id, r.label, region === r.id, () => setRegion(r.id))
                  )}
                {step === 'age' &&
                  AGE_RANGES.map((a) =>
                    chip(a.id, t(a.labelKey), ageRange === a.id, () => setAgeRange(a.id))
                  )}
                {step === 'situation' &&
                  SITUATIONS.map((s) =>
                    chip(
                      s.id,
                      t(s.labelKey),
                      situations.includes(s.id),
                      () => toggleSituation(s.id),
                      undefined,
                      true
                    )
                  )}
                {step === 'source' &&
                  ACQUISITION_SOURCES.map((sc) =>
                    chip(sc.id, t(sc.labelKey), source === sc.id, () => choisirSource(sc.id), sc.icon)
                  )}
              </View>

              {step === 'source' && source === 'autre' && (
                <TextInput
                  style={styles.otherInput}
                  value={sourceDetail}
                  onChangeText={setSourceDetail}
                  placeholder={t('acquisition.otherPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  maxLength={80}
                  returnKeyType="done"
                />
              )}
            </Animated.View>
          </ScrollView>

          <View style={styles.submitSection}>
            <GameButton
              title={isLast ? t('profileDetails.finish') : t('profileDetails.next')}
              variant="yellow"
              fullWidth
              loading={enregistrement}
              disabled={!stepAnswered}
              onPress={suivant}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  backBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    backgroundColor: '#FFBC40',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFFFFF',
    textAlign: 'center',
  },
  stepCounter: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: SPACING[1],
    marginBottom: SPACING[4],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING[4],
  },
  question: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    marginBottom: SPACING[3],
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
    marginTop: -SPACING[2],
    marginBottom: SPACING[3],
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.85)',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  otherInput: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    marginTop: SPACING[3],
  },
  submitSection: {
    paddingTop: SPACING[3],
  },
});
