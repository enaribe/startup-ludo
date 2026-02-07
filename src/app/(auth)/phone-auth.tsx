/**
 * PhoneAuthScreen - Écran d'authentification par numéro de téléphone
 *
 * Design basé sur le système de design avec RadialBackground,
 * GameButton, GradientBorder et les assets existants.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { AuthHeader } from '@/components/auth';
import { useAuthStore } from '@/stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');

export default function PhoneAuthScreen() {
  const router = useRouter();

  const {
    isLoading,
    error,
    phoneAuthStep,
    phoneNumber: storedPhoneNumber,
    isAuthenticated,
    needsProfileCompletion,
    sendPhoneCode,
    verifyPhoneCode,
    resendPhoneCode,
    resetPhoneAuth,
    clearError,
  } = useAuthStore();

  const countryCode = '+221';
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);

  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Numéro sénégalais = 9 chiffres (77 XXX XX XX)
  const isPhoneValid = phoneNumber.replace(/\s/g, '').length >= 9;
  const isCodeValid = verificationCode.every(digit => digit !== '');

  // Reset phone auth state when component unmounts
  useEffect(() => {
    return () => {
      resetPhoneAuth();
    };
  }, [resetPhoneAuth]);

  // Redirect after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      if (needsProfileCompletion) {
        // New user - needs to complete profile
        router.replace('/(auth)/complete-profile');
      } else {
        // Returning user - go to home
        router.replace('/(tabs)/home');
      }
    }
  }, [isAuthenticated, needsProfileCompletion, router]);

  const handleSendCode = useCallback(async () => {
    if (!isPhoneValid) return;
    clearError();
    const fullNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
    await sendPhoneCode(fullNumber);
  }, [countryCode, phoneNumber, isPhoneValid, sendPhoneCode, clearError]);

  const handleVerifyCode = useCallback(async () => {
    if (!isCodeValid) return;
    clearError();
    const code = verificationCode.join('');
    await verifyPhoneCode(code);
  }, [verificationCode, isCodeValid, verifyPhoneCode, clearError]);

  const handleCodeChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      // Si l'utilisateur colle un code complet
      const digits = value.slice(0, 6).split('');
      const newCode = [...verificationCode];
      digits.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setVerificationCode(newCode);
      // Focus sur le dernier input rempli ou le suivant
      const focusIndex = Math.min(digits.length, 5);
      codeInputRefs.current[focusIndex]?.focus();
      return;
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus sur le prochain input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  }, [verificationCode]);

  const handleCodeKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }, [verificationCode]);

  const handleBack = () => {
    if (phoneAuthStep === 'code_sent' || phoneAuthStep === 'verifying') {
      resetPhoneAuth();
      setVerificationCode(['', '', '', '', '', '']);
    } else {
      router.back();
    }
  };

  const handleResendCode = useCallback(async () => {
    clearError();
    await resendPhoneCode();
  }, [resendPhoneCode, clearError]);

  const step = phoneAuthStep === 'idle' ? 'phone' : 'code';

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
          {step === 'phone' ? (
            <>
              {/* Title Section - Phone */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.titleSection}
              >
                <Text style={styles.title}>CONNEXION PAR{'\n'}TÉLÉPHONE</Text>
                <Text style={styles.subtitle}>
                  Entre ton numéro de téléphone pour{'\n'}recevoir un code de vérification.
                </Text>
              </Animated.View>

              {/* Form - Phone */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={styles.formSection}
              >
                <Text style={styles.inputLabel}>NUMÉRO DE TÉLÉPHONE</Text>
                <GradientBorder
                  boxHeight={56}
                  borderRadius={12}
                  fill="rgba(0, 0, 0, 0.2)"
                >
                  <View style={styles.phoneInputRow}>
                    {/* Préfixe +221 fixe */}
                    <View style={styles.countryCodeBox}>
                      <Text style={styles.countryCodeText}>{countryCode}</Text>
                    </View>
                    <View style={styles.phoneDivider} />
                    {/* Numéro de téléphone */}
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="77 123 45 67"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoComplete="tel"
                    />
                  </View>
                </GradientBorder>

                {error && (
                  <Text style={styles.globalError}>{error}</Text>
                )}
              </Animated.View>

              {/* Submit Button - Phone */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={styles.submitSection}
              >
                <GameButton
                  title="ENVOYER LE CODE"
                  variant="yellow"
                  fullWidth
                  loading={isLoading}
                  disabled={!isPhoneValid}
                  onPress={handleSendCode}
                />

                <Pressable
                  onPress={() => router.push('/(auth)/login')}
                  style={styles.loginLink}
                >
                  <Text style={styles.loginLinkText}>
                    UTILISER{' '}
                    <Text style={styles.loginLinkHighlight}>EMAIL / MOT DE PASSE</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <>
              {/* Title Section - Code */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.titleSection}
              >
                <Text style={styles.title}>VÉRIFICATION</Text>
                <Text style={styles.subtitle}>
                  Entre le code à 6 chiffres envoyé au{'\n'}
                  <Text style={styles.phoneHighlight}>{storedPhoneNumber || `${countryCode} ${phoneNumber}`}</Text>
                </Text>
              </Animated.View>

              {/* Code Input */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={styles.codeSection}
              >
                <View style={styles.codeInputsRow}>
                  {verificationCode.map((digit, index) => (
                    <GradientBorder
                      key={index}
                      boxHeight={56}
                      boxWidth={48}
                      borderRadius={12}
                      fill={digit ? 'rgba(255, 188, 64, 0.1)' : 'rgba(0, 0, 0, 0.2)'}
                    >
                      <View style={styles.codeInputWrapper}>
                        <TextInput
                          ref={ref => { codeInputRefs.current[index] = ref; }}
                          style={styles.codeInput}
                          value={digit}
                          onChangeText={value => handleCodeChange(index, value)}
                          onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                          keyboardType="number-pad"
                          maxLength={1}
                          selectTextOnFocus
                        />
                      </View>
                    </GradientBorder>
                  ))}
                </View>

                {error && (
                  <Text style={styles.globalError}>{error}</Text>
                )}

                <Pressable onPress={handleResendCode} disabled={isLoading} style={styles.resendLink}>
                  <Text style={styles.resendLinkText}>
                    Pas reçu ? <Text style={styles.resendLinkHighlight}>Renvoyer le code</Text>
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Submit Button - Code */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={styles.submitSection}
              >
                <GameButton
                  title="VÉRIFIER"
                  variant="yellow"
                  fullWidth
                  loading={isLoading}
                  disabled={!isCodeValid}
                  onPress={handleVerifyCode}
                />
              </Animated.View>
            </>
          )}
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
  phoneHighlight: {
    color: '#FFBC40',
    fontFamily: FONTS.bodySemiBold,
  },
  formSection: {
    gap: SPACING[2],
    marginBottom: SPACING[6],
  },
  inputLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: SPACING[1],
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: SPACING[3],
  },
  countryCodeBox: {
    paddingRight: SPACING[3],
  },
  countryCodeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#FFBC40',
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: SPACING[3],
  },
  phoneInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    height: '100%',
  },
  codeSection: {
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  codeInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING[2],
  },
  codeInputWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInput: {
    width: '100%',
    height: '100%',
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resendLink: {
    marginTop: SPACING[5],
  },
  resendLinkText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  resendLinkHighlight: {
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
});
