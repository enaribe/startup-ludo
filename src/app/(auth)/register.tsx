/**
 * RegisterScreen - Écran d'inscription avec avatar et formulaire
 *
 * Design basé sur le système de design avec RadialBackground,
 * GameButton, GradientBorder et les assets existants.
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
import { Ionicons } from '@expo/vector-icons';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { AuthInput, AuthHeader, SocialAuthButtons } from '@/components/auth';
import { useAuthStore } from '@/stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithApple, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid =
    displayName.trim().length >= 2 &&
    email.trim().includes('@') &&
    password.trim().length >= 6;

  const handleRegister = useCallback(async () => {
    if (!isFormValid) return;
    clearError();
    await register(email, password, displayName);
  }, [email, password, displayName, register, clearError, isFormValid]);

  const handleBack = () => {
    router.back();
  };

  const handleGoogleAuth = useCallback(async () => {
    clearError();
    await loginWithGoogle();
  }, [loginWithGoogle, clearError]);

  const handleAppleAuth = useCallback(async () => {
    clearError();
    await loginWithApple();
  }, [loginWithApple, clearError]);

  const handlePhoneAuth = useCallback(() => {
    router.push('/(auth)/phone-auth');
  }, [router]);

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
      <AuthHeader onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.avatarSection}
          >
            <GradientBorder boxHeight={100} boxWidth={100} borderRadius={50} fill="rgba(0, 0, 0, 0.2)">
              <View style={styles.avatarContent}>
                <Ionicons name="person" size={48} color="rgba(255, 255, 255, 0.3)" />
              </View>
            </GradientBorder>
            <Pressable style={styles.avatarButton}>
              <Text style={styles.avatarButtonText}>Ajouter un avatar</Text>
            </Pressable>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.formSection}
          >
            <AuthInput
              label="VOTRE NOM D'ENTREPRENEUR"
              placeholder="Nom d'entrepreneur"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoComplete="name"
              leftIcon="person-outline"
            />

            <AuthInput
              label="E-MAIL"
              placeholder="Votre adresse mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon="mail-outline"
            />

            <AuthInput
              label="MOT DE PASSE"
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              leftIcon="lock-closed-outline"
              error={password.length > 0 && password.length < 6 ? 'Minimum 6 caractères' : undefined}
            />

            {error && (
              <Text style={styles.globalError}>{error}</Text>
            )}
          </Animated.View>

          {/* Submit Button */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.submitSection}
          >
            <GameButton
              title="COMMENCER"
              variant="yellow"
              fullWidth
              loading={isLoading}
              disabled={!isFormValid}
              onPress={handleRegister}
            />

            {/* Social Auth */}
            <SocialAuthButtons
              onGooglePress={handleGoogleAuth}
              onApplePress={handleAppleAuth}
              onPhonePress={handlePhoneAuth}
              isLoading={isLoading}
            />

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                DÉJÀ UN COMPTE ?{' '}
                <Text style={styles.loginLinkHighlight}>SE CONNECTER</Text>
              </Text>
            </Pressable>

            {/* Privacy Policy Link */}
            <Text style={styles.privacyText}>
              CGU et politique de confidentialité
            </Text>
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
    paddingBottom: SPACING[6],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  avatarContent: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarButton: {
    marginTop: SPACING[3],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarButtonText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formSection: {
    gap: SPACING[4],
    marginBottom: SPACING[6],
  },
  globalError: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  submitSection: {
    marginTop: 'auto',
    paddingTop: SPACING[4],
  },
  loginLink: {
    marginTop: SPACING[5],
    alignItems: 'center',
  },
  loginLinkText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  loginLinkHighlight: {
    color: '#3498DB',
  },
  privacyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: SPACING[3],
  },
});
