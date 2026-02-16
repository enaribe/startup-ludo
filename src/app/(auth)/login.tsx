/**
 * LoginScreen - Écran de connexion
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

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { AuthInput, AuthHeader, SocialAuthButtons } from '@/components/auth';
import { useAuthStore } from '@/stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = email.trim().includes('@') && password.trim().length >= 6;

  const handleLogin = useCallback(async () => {
    if (!isFormValid) return;
    clearError();
    await login(email, password);
  }, [email, password, login, clearError, isFormValid]);

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

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
          {/* Title Section */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.titleSection}
          >
            <Text style={styles.title}>CONNEXION</Text>
            <Text style={styles.subtitle}>
              Content de te revoir !
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.formSection}
          >
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
              autoComplete="password"
              leftIcon="lock-closed-outline"
            />

            {/* Forgot Password Link */}
            <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </Pressable>

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
              title="SE CONNECTER"
              variant="yellow"
              fullWidth
              loading={isLoading}
              disabled={!isFormValid}
              onPress={handleLogin}
            />

            {/* Social Auth */}
            <SocialAuthButtons
              onGooglePress={handleGoogleAuth}
              onApplePress={handleAppleAuth}
              onPhonePress={handlePhoneAuth}
              isLoading={isLoading}
            />

            <Pressable
              onPress={() => router.push('/(auth)/register')}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>
                PAS ENCORE DE COMPTE ?{' '}
                <Text style={styles.registerLinkHighlight}>S'INSCRIRE</Text>
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
  titleSection: {
    alignItems: 'center',
    marginTop: SPACING[6],
    marginBottom: SPACING[8],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: '#FFFFFF',
    marginBottom: SPACING[2],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formSection: {
    gap: SPACING[4],
    marginBottom: SPACING[6],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING[1],
  },
  forgotPasswordText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#3498DB',
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
  registerLink: {
    marginTop: SPACING[5],
    alignItems: 'center',
  },
  registerLinkText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  registerLinkHighlight: {
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
