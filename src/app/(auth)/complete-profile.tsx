/**
 * CompleteProfileScreen - Écran de complétion du profil après inscription
 *
 * Affiché après l'inscription par téléphone pour collecter
 * le nom d'affichage et autres informations.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { AuthInput, AuthHeader } from '@/components/auth';
import { useTranslation } from '@/i18n';
import { useAuthStore, useUserStore } from '@/stores';
import { updateUserProfile } from '@/services/firebase/auth';
import { createUserProfile, getUserProfile, updateFirestoreUserProfile } from '@/services/firebase';
import {
  isUsernameAvailable,
  reserveUsername,
  validateUsernameFormat,
  getUsernameErrorMessage,
  USERNAME_MAX_LENGTH,
} from '@/services/firebase';

/** État de la vérification de disponibilité du pseudo. */
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearNeedsProfileCompletion = useAuthStore((state) => state.clearNeedsProfileCompletion);
  const setProfile = useUserStore((state) => state.setProfile);

  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');

  // Jeton pour ignorer les résultats de vérifications obsolètes (course de debounce)
  const checkSeqRef = useRef(0);

  const formatError = validateUsernameFormat(displayName);
  const canSubmit = availability === 'available' && !isLoading;

  // Vérification de disponibilité en temps réel (debounce 500ms)
  useEffect(() => {
    const trimmed = displayName.trim();

    if (trimmed.length === 0) {
      setAvailability('idle');
      return;
    }
    if (formatError) {
      setAvailability('invalid');
      return;
    }

    setAvailability('checking');
    const seq = ++checkSeqRef.current;
    const timer = setTimeout(async () => {
      const free = await isUsernameAvailable(trimmed);
      // Ignorer si une saisie plus récente a eu lieu entre-temps
      if (seq !== checkSeqRef.current) return;
      setAvailability(free ? 'available' : 'taken');
    }, 500);

    return () => clearTimeout(timer);
  }, [displayName, formatError]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const trimmedName = displayName.trim();

      // Réserve le pseudo — échoue si pris entre-temps (anti-course)
      await reserveUsername(trimmedName, user.id, trimmedName);

      // Update Firebase Auth profile
      await updateUserProfile({ displayName: trimmedName });

      // Update or create Firestore profile
      let profile = await getUserProfile(user.id);
      if (profile) {
        // Propage le pseudo dans users + userStats (classement, recherche)
        await updateFirestoreUserProfile(user.id, { displayName: trimmedName });
        profile = { ...profile, displayName: trimmedName };
      } else {
        profile = await createUserProfile(user.id, {
          email: user.email || null,
          displayName: trimmedName,
        });
      }

      // Update local stores
      setUser({ ...user, displayName: trimmedName });
      setProfile(profile);
      clearNeedsProfileCompletion();

      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Si la réservation a échoué, le pseudo a été pris entre-temps
      setAvailability('taken');
      setError(
        err instanceof Error && err.message.includes('déjà utilisé')
          ? t('auth.usernameJustTaken')
          : err instanceof Error
            ? err.message
            : t('auth.profileUpdateError')
      );
    } finally {
      setIsLoading(false);
    }
  }, [displayName, canSubmit, user, setUser, setProfile, clearNeedsProfileCompletion, router]);

  return (
    <View style={styles.container}>
      {/* Fond radial */}
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      {/* Shape (rayons) en arrière-plan */}
      <View style={styles.shapeContainer} pointerEvents="none">
        <Image
          source={shapeImage}
          style={styles.shapeImage}
          resizeMode="contain"
        />
      </View>

      {/* Header avec background */}
      <AuthHeader showBackButton={false} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING[6] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.titleSection}
          >
            <Text style={styles.title}>{t('auth.completeProfileTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.completeProfileSubtitle')}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.formSection}
          >
            <AuthInput
              label={t('auth.uniqueUsernameLabel')}
              placeholder={t('auth.uniqueUsernamePlaceholder')}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={USERNAME_MAX_LENGTH}
            />

            {/* Indicateur de disponibilité en temps réel */}
            {availability === 'checking' && (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
                <Text style={styles.statusChecking}>{t('auth.checkingUsername')}</Text>
              </View>
            )}
            {availability === 'available' && (
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.statusOk}>{t('auth.usernameAvailable')}</Text>
              </View>
            )}
            {availability === 'taken' && (
              <View style={styles.statusRow}>
                <Ionicons name="close-circle" size={16} color="#E74C3C" />
                <Text style={styles.statusError}>{t('auth.usernameTaken')}</Text>
              </View>
            )}
            {availability === 'invalid' && formatError && (
              <View style={styles.statusRow}>
                <Ionicons name="alert-circle" size={16} color="#E67E22" />
                <Text style={styles.statusWarn}>{getUsernameErrorMessage(formatError)}</Text>
              </View>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Text style={styles.hint}>
              {t('auth.usernameHint', { max: USERNAME_MAX_LENGTH })}
            </Text>
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Buttons — pas de "passer" : le pseudo unique est obligatoire */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.buttonsSection}
          >
            <GameButton
              title={t('common.continue')}
              variant="yellow"
              fullWidth
              loading={isLoading}
              disabled={!canSubmit}
              onPress={handleSubmit}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shapeContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: -Dimensions.get('window').height * 0.3,
  },
  shapeImage: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
    opacity: 0.15,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING[6],
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING[8],
    marginTop: SPACING[4],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFFFFF',
    marginBottom: SPACING[2],
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: FONT_SIZES.md * 1.4,
  },
  formSection: {
    gap: SPACING[3],
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#E74C3C',
    textAlign: 'center',
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  spacer: {
    flex: 1,
    minHeight: SPACING[8],
  },
  buttonsSection: {
    gap: SPACING[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[1],
  },
  statusChecking: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statusOk: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#4CAF50',
  },
  statusError: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#E74C3C',
  },
  statusWarn: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#E67E22',
    flex: 1,
  },
});
