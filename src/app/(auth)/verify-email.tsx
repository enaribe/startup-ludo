/**
 * VerifyEmailScreen — saisie de l'OTP envoyé par email après l'inscription.
 *
 * Le code part automatiquement au premier affichage (Cloud Function
 * sendEmailOtp → Brevo), l'utilisateur le saisit ici, verifyEmailOtp marque
 * le compte `emailVerified` et le flux reprend (choix du pseudo).
 * Même design que l'OTP téléphone (phone-auth).
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
import { EMAIL_OTP_ENABLED } from '@/config/features';
import { useTranslation, type TranslationKey } from '@/i18n';
import { trackEvent } from '@/services/analytics';
import { sendEmailOtp, verifyEmailOtp, type EmailOtpError } from '@/services/firebase/emailOtpService';
import { useAuthStore } from '@/stores';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const shapeImage = require('@/../assets/images/shape.png');

const RESEND_COOLDOWN_S = 60;

const ERROR_KEYS: Record<EmailOtpError, TranslationKey> = {
  'invalid-code': 'verifyEmail.errInvalid',
  expired: 'verifyEmail.errExpired',
  'no-otp': 'verifyEmail.errExpired',
  'too-many-attempts': 'verifyEmail.errTooMany',
  cooldown: 'verifyEmail.errCooldown',
  'send-failed': 'verifyEmail.errSend',
  'no-email': 'verifyEmail.errSend',
  unauthenticated: 'verifyEmail.errNetwork',
  network: 'verifyEmail.errNetwork',
};

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);
  const sentOnceRef = useRef(false);

  // Parcours en pause : personne ne doit rester bloqué sur cet écran
  // (accès direct, écran restauré) tant que les functions ne sont pas prêtes.
  useEffect(() => {
    if (!EMAIL_OTP_ENABLED) {
      router.replace('/(auth)/complete-profile');
    }
  }, [router]);

  // Décompte du cooldown de renvoi
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const envoyerCode = useCallback(async () => {
    setError(null);
    setCooldown(RESEND_COOLDOWN_S);
    const result = await sendEmailOtp();
    if (result.ok) {
      trackEvent('email_otp_sent');
      if (result.alreadyVerified && user) {
        setUser({ ...user, emailVerified: true });
        router.replace('/(auth)/complete-profile');
      }
    } else if (result.error === 'cooldown' && result.retryInMs) {
      setCooldown(Math.ceil(result.retryInMs / 1000));
    } else if (result.error) {
      setError(t(ERROR_KEYS[result.error]));
    }
  }, [user, setUser, router, t]);

  // Envoi automatique au premier affichage
  useEffect(() => {
    if (!EMAIL_OTP_ENABLED) return;
    if (sentOnceRef.current) return;
    sentOnceRef.current = true;
    void envoyerCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      // Code complet collé d'un coup
      const pasted = digits.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      pasted.forEach((d, i) => { next[i] = d; });
      setCode(next);
      codeInputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const next = [...code];
    next[index] = digits;
    setCode(next);
    if (digits && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const isCodeValid = code.every((d) => d.length === 1);

  const handleVerify = useCallback(async () => {
    if (!isCodeValid || isLoading) return;
    setIsLoading(true);
    setError(null);
    const result = await verifyEmailOtp(code.join(''));
    setIsLoading(false);
    if (result.ok) {
      trackEvent('email_verified', { method: 'otp' });
      if (user) setUser({ ...user, emailVerified: true });
      router.replace('/(auth)/complete-profile');
    } else {
      setError(t(ERROR_KEYS[result.error ?? 'network']));
      if (result.error === 'expired' || result.error === 'no-otp') {
        setCode(['', '', '', '', '', '']);
      }
    }
  }, [isCodeValid, isLoading, code, user, setUser, router, t]);

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <View style={styles.shapeContainer} pointerEvents="none">
        <Image source={shapeImage} style={styles.shapeImage} resizeMode="contain" />
      </View>

      <AuthHeader onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.titleSection}
          >
            <Text style={styles.title}>{t('auth.verificationTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('verifyEmail.subtitle')}{'\n'}
              <Text style={styles.emailHighlight}>{user?.email}</Text>
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.codeSection}
          >
            <View style={styles.codeInputsRow}>
              {code.map((digit, index) => (
                <GradientBorder
                  key={index}
                  boxHeight={56}
                  boxWidth={48}
                  borderRadius={12}
                  fill={digit ? 'rgba(255, 188, 64, 0.1)' : 'rgba(0, 0, 0, 0.2)'}
                >
                  <View style={styles.codeInputWrapper}>
                    <TextInput
                      ref={(ref) => { codeInputRefs.current[index] = ref; }}
                      style={styles.codeInput}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(index, value)}
                      onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  </View>
                </GradientBorder>
              ))}
            </View>

            {error && <Text style={styles.globalError}>{error}</Text>}

            <Pressable
              onPress={() => void envoyerCode()}
              disabled={cooldown > 0}
              style={styles.resendLink}
            >
              <Text style={styles.resendLinkText}>
                {t('auth.notReceived')}{' '}
                <Text style={[styles.resendLinkHighlight, cooldown > 0 && styles.resendDisabled]}>
                  {cooldown > 0
                    ? `${t('auth.resendCode')} (${cooldown}s)`
                    : t('auth.resendCode')}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.submitSection}
          >
            <GameButton
              title={t('auth.verifyCta')}
              variant="yellow"
              fullWidth
              loading={isLoading}
              disabled={!isCodeValid}
              onPress={() => void handleVerify()}
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
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  emailHighlight: {
    color: '#FFBC40',
    fontFamily: FONTS.bodySemiBold,
  },
  codeSection: {
    alignItems: 'center',
  },
  codeInputsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  codeInputWrapper: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
  },
  globalError: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: SPACING[4],
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
    fontFamily: FONTS.bodySemiBold,
  },
  resendDisabled: {
    color: 'rgba(255, 255, 255, 0.35)',
  },
  submitSection: {
    marginTop: 'auto',
    paddingTop: SPACING[4],
  },
});
