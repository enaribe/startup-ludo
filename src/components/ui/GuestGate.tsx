/**
 * GuestGate — Écran de blocage pour les fonctionnalités réservées aux comptes enregistrés.
 * Remplace le contenu d'un écran si l'utilisateur est invité.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

function LockIcon() {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 11H7C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11Z"
        stroke="#FFBC40"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 11V7C8 5.67392 8.52678 4.40215 9.46447 3.46447C10.4021 2.52678 11.6739 2 13 2C14.3261 2 15.5979 2.52678 16.5355 3.46447C17.4732 4.40215 18 5.67392 18 7V11"
        stroke="#FFBC40"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 16V16.01"
        stroke="#FFBC40"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface GuestGateProps {
  /** Titre de la fonctionnalité bloquée (ex: "Programmes") */
  featureName: string;
  /** Description courte de la valeur de la fonctionnalité */
  description?: string;
  /** Affiche le bouton retour */
  showBack?: boolean;
}

export function GuestGate({ featureName, description, showBack = true }: GuestGateProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RadialBackground />

      {showBack && (
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
      )}

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <LockIcon />
        </View>
        <Text style={styles.title}>{(featureName || t('guestGate.defaultTitle')).toUpperCase()}</Text>
        <Text style={styles.subtitle}>{t('guestGate.defaultTitle')}</Text>
        {description && <Text style={styles.description}>{description}</Text>}

        <View style={styles.actions}>
          <GameButton
            title={t('guestGate.createAccount')}
            variant="yellow"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />
          <GameButton
            title={t('guestGate.signIn')}
            variant="blue"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: SPACING[3] }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[6],
    gap: SPACING[3],
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING[1],
  },
  actions: {
    width: '100%',
    marginTop: SPACING[5],
  },
});
