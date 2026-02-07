/**
 * CompleteProfileScreen - Écran de complétion du profil après inscription
 *
 * Affiché après l'inscription par téléphone pour collecter
 * le nom d'affichage et autres informations.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { AuthInput, AuthHeader } from '@/components/auth';
import { useAuthStore, useUserStore } from '@/stores';
import { updateUserProfile } from '@/services/firebase/auth';
import { createUserProfile, getUserProfile } from '@/services/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearNeedsProfileCompletion = useAuthStore((state) => state.clearNeedsProfileCompletion);
  const setProfile = useUserStore((state) => state.setProfile);

  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = displayName.trim().length >= 2;

  const handleSubmit = useCallback(async () => {
    if (!isValid || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const trimmedName = displayName.trim();

      // Update Firebase Auth profile
      await updateUserProfile({ displayName: trimmedName });

      // Update or create Firestore profile
      let profile = await getUserProfile(user.id);
      if (profile) {
        // Update existing profile
        profile = { ...profile, displayName: trimmedName };
      } else {
        // Create new profile
        profile = await createUserProfile(user.id, {
          email: user.email || null,
          displayName: trimmedName,
        });
      }

      // Update local stores
      setUser({ ...user, displayName: trimmedName });
      setProfile(profile);
      clearNeedsProfileCompletion();

      // Navigate to home
      router.replace('/(tabs)/home');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  }, [displayName, isValid, user, setUser, setProfile, clearNeedsProfileCompletion, router]);

  const handleSkip = useCallback(() => {
    // Allow skipping - they can update later in settings
    clearNeedsProfileCompletion();
    router.replace('/(tabs)/home');
  }, [router, clearNeedsProfileCompletion]);

  return (
    <View style={styles.container}>
      {/* Fond radial */}
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      {/* Shape (rayons) en arrière-plan */}
      <View style={styles.shapeContainer}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <Text style={styles.title}>BIENVENUE !</Text>
            <Text style={styles.subtitle}>
              Comment veux-tu qu'on t'appelle{'\n'}dans le jeu ?
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.formSection}
          >
            <AuthInput
              label="TON PSEUDO"
              placeholder="Ex: Moussa, Fatou..."
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Text style={styles.hint}>
              Tu pourras le modifier plus tard dans les paramètres
            </Text>
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Buttons */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.buttonsSection}
          >
            <GameButton
              title="CONTINUER"
              variant="yellow"
              fullWidth
              loading={isLoading}
              disabled={!isValid}
              onPress={handleSubmit}
            />

            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>PASSER CETTE ÉTAPE</Text>
            </Pressable>
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: SPACING[3],
  },
  skipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
});
