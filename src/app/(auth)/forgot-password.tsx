/**
 * ForgotPasswordScreen - Écran de récupération de mot de passe
 *
 * Design basé sur le système de design avec RadialBackground,
 * GameButton, GradientBorder et les assets existants.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuthHeader, AuthInput } from '@/components/auth';
import { GameButton } from '@/components/ui/GameButton';
import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { useAuthStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const isFormValid = email.trim().includes('@');

  const handleResetPassword = useCallback(async () => {
    if (!isFormValid) return;
    clearError();
    await resetPassword(email);
    setEmailSent(true);
  }, [email, resetPassword, clearError, isFormValid]);

  const handleBack = () => {
    router.back();
  };

  // Success state - Email sent
  if (emailSent) {
    return (
      <View style={styles.container}>
        <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

        <View style={styles.shapeContainer}>
          <Image
            source={shapeImage}
            style={styles.shapeImage}
            resizeMode="contain"
          />
        </View>

        {/* Header avec background */}
        <AuthHeader showBackButton={false} />

        <View style={styles.successSection}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.successCard}
          >
            <DynamicGradientBorder
              borderRadius={20}
              fill="rgba(0, 0, 0, 0.3)"
              boxWidth={SCREEN_WIDTH - 48}
            >
              <View style={styles.successContent}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="mail" size={40} color="#FFFFFF" />
                </View>

                <Text style={styles.successTitle}>Email envoyé !</Text>

                <Text style={styles.successDescription}>
                  Si un compte existe avec l'adresse{'\n'}
                  <Text style={styles.successEmail}>{email}</Text>
                  {'\n'}tu recevras un email pour réinitialiser ton mot de passe.
                </Text>

                <GameButton
                  title="RETOUR À LA CONNEXION"
                  variant="yellow"
                  fullWidth
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.successButton}
                />
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </View>
      </View>
    );
  }

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
            <Text style={styles.title}>MOT DE PASSE{'\n'}OUBLIÉ</Text>
            <Text style={styles.subtitle}>
              Entre ton adresse email pour recevoir{'\n'}un lien de réinitialisation.
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
              title="ENVOYER LE LIEN"
              variant="yellow"
              fullWidth
              loading={isLoading}
              disabled={!isFormValid}
              onPress={handleResetPassword}
            />

            <Pressable
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                RETOUR À LA{' '}
                <Text style={styles.loginLinkHighlight}>CONNEXION</Text>
              </Text>
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
    paddingBottom: SPACING[6],
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING[8],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFFFFF',
    marginBottom: SPACING[2],
    marginTop: SPACING[7],
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
    marginTop: SPACING[4],
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
  // Success state styles
  successSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[6],
  },
  successCard: {
    width: '100%',
  },
  successContent: {
    padding: SPACING[6],
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27AE60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  successTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    marginBottom: SPACING[3],
    textAlign: 'center',
  },
  successDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: FONT_SIZES.md * 1.5,
    marginBottom: SPACING[6],
  },
  successEmail: {
    color: '#FFBC40',
    fontFamily: FONTS.bodySemiBold,
  },
  successButton: {
    marginTop: SPACING[2],
  },
});
