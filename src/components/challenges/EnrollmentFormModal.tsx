/**
 * EnrollmentFormModal - Formulaire d'inscription au programme
 *
 * Collecte les informations du participant avant l'inscription:
 * - Nom, Prenom, Age, Pays, Region, Genre, Situation de handicap
 * - Questions Oui/Non sur le profil entrepreneur
 * - Numero de telephone (optionnel)
 */

import { GameButton } from '@/components/ui';
import { GamePopup } from '@/components/ui/GamePopup';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { EnrollmentFormData } from '@/types/challenge';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
// Pressable gardé pour GradientPressable
import Animated, { FadeInDown } from 'react-native-reanimated';

const { height: screenHeight } = Dimensions.get('window');

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
      <GradientPressable onPress={() => onChange(true)} active={value === true}>
        <Text style={[styles.yesNoBtnText, value === true && styles.yesNoBtnTextActive]}>OUI</Text>
      </GradientPressable>
      <GradientPressable onPress={() => onChange(false)} active={value === false}>
        <Text style={[styles.yesNoBtnText, value === false && styles.yesNoBtnTextActive]}>NON</Text>
      </GradientPressable>
    </View>
  );
});

// ===== COMPOSANT SÉLECTEUR GENRE =====

type Genre = 'homme' | 'femme';

interface GenreSelectProps {
  value: Genre | null;
  onChange: (val: Genre) => void;
}

const GenreSelect = memo(function GenreSelect({ value, onChange }: GenreSelectProps) {
  return (
    <View style={styles.yesNoRow}>
      <GradientPressable onPress={() => onChange('homme')} active={value === 'homme'}>
        <Text style={[styles.yesNoBtnText, value === 'homme' && styles.yesNoBtnTextActive]}>HOMME</Text>
      </GradientPressable>
      <GradientPressable onPress={() => onChange('femme')} active={value === 'femme'}>
        <Text style={[styles.yesNoBtnText, value === 'femme' && styles.yesNoBtnTextActive]}>FEMME</Text>
      </GradientPressable>
    </View>
  );
});

// ===== PRESSABLE AVEC BORDURE GRADIENT =====

let _gradBtnCounter = 0;
function GradientPressable({
  children,
  style,
  activeStyle,
  active,
  onPress,
}: {
  children: React.ReactNode;
  style?: object;
  activeStyle?: object;
  active?: boolean;
  onPress: () => void;
}) {
  const idRef = useRef(`gb_${++_gradBtnCounter}`);
  const id = idRef.current;
  const [h, setH] = useState(0);
  const [w, setW] = useState(0);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.yesNoBtn, active && styles.yesNoBtnActive, style, activeStyle && active ? activeStyle : undefined]}
      onLayout={(e) => { setH(e.nativeEvent.layout.height); setW(e.nativeEvent.layout.width); }}
    >
      {h > 0 && !active && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgLinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#9A9A9A" stopOpacity="0.3"  />
              <Stop offset="25%"  stopColor="#707070" stopOpacity="0.2"  />
              <Stop offset="50%"  stopColor="#B0B0B0" stopOpacity="0.35" />
              <Stop offset="75%"  stopColor="#606060" stopOpacity="0.2"  />
              <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3"  />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0.75" y="0.75" width={String(w - 1.5)} height={String(h - 1.5)} rx="13.25" ry="13.25"
            fill="transparent" stroke={`url(#${id})`} strokeWidth="1.5" />
        </Svg>
      )}
      {children}
    </Pressable>
  );
}

// ===== INPUT AVEC BORDURE GRADIENT =====

let _gradInputCounter = 0;
function GradientInput(props: React.ComponentProps<typeof TextInput>) {
  const idRef = useRef(`gi_${++_gradInputCounter}`);
  const id = idRef.current;
  const [h, setH] = useState(0);
  return (
    <View style={styles.inputWrap} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      {h > 0 && (
        <Svg width="100%" height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgLinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%"   stopColor="#9A9A9A" stopOpacity="0.3"  />
              <Stop offset="25%"  stopColor="#707070" stopOpacity="0.2"  />
              <Stop offset="50%"  stopColor="#B0B0B0" stopOpacity="0.35" />
              <Stop offset="75%"  stopColor="#606060" stopOpacity="0.2"  />
              <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3"  />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0.75" y="0.75" width="99.5%" height={String(h - 1.5)} rx="13.25" ry="13.25"
            fill="transparent" stroke={`url(#${id})`} strokeWidth="1.5" />
        </Svg>
      )}
      <TextInput {...props} style={[styles.input, props.style]} />
    </View>
  );
}

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
  const [pays, setPays] = useState('');
  const [region, setRegion] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);
  const [situationHandicap, setSituationHandicap] = useState<boolean | null>(null);
  const [isCurrentEntrepreneur, setIsCurrentEntrepreneur] = useState<boolean | null>(null);
  const [planToStart, setPlanToStart] = useState<boolean | null>(null);
  const [phone, setPhone] = useState('');

  const isValid = lastName.trim().length >= 2
    && firstName.trim().length >= 2
    && age.trim().length > 0
    && pays.trim().length >= 2
    && region.trim().length >= 2
    && genre !== null
    && situationHandicap !== null
    && isCurrentEntrepreneur !== null
    && phone.trim().length >= 6;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSubmit({
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      age: age.trim(),
      pays: pays.trim(),
      region: region.trim(),
      genre,
      situationHandicap,
      isCurrentEntrepreneur,
      planToStart,
      wantsContact: true,
      phone: phone.trim(),
    });
  }, [isValid, lastName, firstName, age, pays, region, genre, situationHandicap, isCurrentEntrepreneur, planToStart, phone, onSubmit]);

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onClose}
      footer={
        <GameButton
          variant="green"
          title="COMMENCER"
          onPress={handleSubmit}
          fullWidth
          disabled={!isValid}
        />
      }
    >
      {/* Header avec bouton fermer */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTexts}>
          <Text style={styles.headerBadge}>INSCRIPTION</Text>
          <Text style={styles.headerTitle}>{challengeName}</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Remplissez ce formulaire pour rejoindre le programme
        </Text>

        {/* Nom */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text style={styles.label}>NOM</Text>
          <GradientInput
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
          <Text style={styles.label}>PRÉNOM</Text>
          <GradientInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Votre prénom"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="words"
          />
        </Animated.View>

        {/* Age */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={styles.label}>ÂGE</Text>
          <GradientInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Votre âge"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="number-pad"
          />
        </Animated.View>

        {/* Pays */}
        <Animated.View entering={FadeInDown.delay(250).duration(300)}>
          <Text style={styles.label}>PAYS</Text>
          <GradientInput
            style={styles.input}
            value={pays}
            onChangeText={setPays}
            placeholder="Votre pays"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="words"
          />
        </Animated.View>

        {/* Region */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Text style={styles.label}>RÉGION</Text>
          <GradientInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="Votre région"
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="words"
          />
        </Animated.View>

        {/* Genre */}
        <Animated.View entering={FadeInDown.delay(350).duration(300)}>
          <Text style={styles.questionLabel}>GENRE</Text>
          <GenreSelect value={genre} onChange={setGenre} />
        </Animated.View>

        {/* Situation de handicap */}
        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <Text style={styles.questionLabel}>
            ÊTES-VOUS EN SITUATION DE HANDICAP ?
          </Text>
          <YesNoButtons value={situationHandicap} onChange={setSituationHandicap} />
        </Animated.View>

        {/* Question 1: Entrepreneur actuel */}
        <Animated.View entering={FadeInDown.delay(450).duration(300)}>
          <Text style={styles.questionLabel}>
            ÊTES-VOUS ACTUELLEMENT ENTREPRENEUR DANS L'AGRICULTURE ?
          </Text>
          <YesNoButtons value={isCurrentEntrepreneur} onChange={setIsCurrentEntrepreneur} />
        </Animated.View>

        {/* Question 2: Prévoit de se lancer (visible si pas entrepreneur) */}
        {isCurrentEntrepreneur === false && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.questionLabel}>
              SI NON, PRÉVOYEZ-VOUS DE VOUS LANCER DANS L'AGRICULTURE DANS LES 6 - 12 PROCHAINS MOIS ?
            </Text>
            <YesNoButtons value={planToStart} onChange={setPlanToStart} />
          </Animated.View>
        )}

        {/* Phone — obligatoire pour être contacté */}
        <Animated.View entering={FadeInDown.delay(500).duration(300)}>
          <Text style={styles.label}>NUMÉRO DE TÉLÉPHONE</Text>
          <Text style={styles.helper}>
            Pour bénéficier des opportunités d'accompagnement du programme {challengeName}.
          </Text>
          <GradientInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Numéro de téléphone"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="phone-pad"
          />
        </Animated.View>

        <View style={{ height: SPACING[4] }} />
      </ScrollView>
    </GamePopup>
  );
});

// ===== STYLES =====

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING[3],
  },
  headerTexts: {
    flex: 1,
    marginRight: SPACING[3],
  },
  headerBadge: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: SPACING[1],
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  scroll: {
    maxHeight: screenHeight * 0.45,
    width: '100%',
  },
  label: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: SPACING[2],
    marginTop: SPACING[3],
  },
  helper: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.xs * 1.5,
    marginTop: -SPACING[1],
    marginBottom: SPACING[2],
  },
  inputWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 2,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.15)',
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
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  yesNoBtnActive: {
    backgroundColor: 'rgba(255,188,64,0.12)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
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
