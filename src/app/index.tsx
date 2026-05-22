/**
 * WelcomeScreen - Écran d'accueil avec le logo START UP LUDO
 *
 * Design basé sur le système de design avec RadialBackground,
 * GameButton et les assets existants (shape.png, logostartupludo.png).
 */

import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { PrivacyPolicyModal } from '@/components/common/PrivacyPolicyModal';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { usePrivacyAcceptance } from '@/hooks/usePrivacyAcceptance';
import { useAuthStore } from '@/stores/useAuthStore';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');
const logoImage = require('@/../assets/images/logostartupludo.png');
const splashIcon = require('@/../assets/images/ludol.png');

// Rayons tournants sous le logo (comme dans home.tsx)
const SpinningRays = memo(function SpinningRays() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.raysWrapper, animatedStyle]}>
      <Image
        source={shapeImage}
        style={styles.raysImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
});

const CircularLoader = memo(function CircularLoader({ size }: { size: number }) {
  const rotation = useSharedValue(0);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size, position: 'absolute' }, animatedStyle]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(26, 58, 94, 0.6)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#FFDC64"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.4} ${circumference * 0.6}`}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
});

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsGuest, isAuthenticated, isInitialized, phoneAuthStep, user, needsProfileCompletion } = useAuthStore();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { accepted, loading: privacyLoading, acceptPrivacy } = usePrivacyAcceptance();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Afficher le splash pendant 2.5s
    return () => clearTimeout(timer);
  }, []);

  // Show privacy modal on first visit
  useEffect(() => {
    if (!showSplash && !privacyLoading && accepted === false) {
      setShowPrivacyModal(true);
    }
  }, [showSplash, privacyLoading, accepted]);

  // Redirect if already authenticated (wait for auth to be initialized first)
  // Les invités restent sur l'accueil pour pouvoir choisir entre jouer en invité ou créer un compte.
  // Si le compte n'a pas de pseudo unique → écran de complétion du profil.
  useEffect(() => {
    if (!showSplash && isInitialized && isAuthenticated && !user?.isGuest) {
      if (needsProfileCompletion) {
        router.replace('/(auth)/complete-profile');
      } else {
        router.replace('/(tabs)/home');
      }
    }
  }, [showSplash, isAuthenticated, isInitialized, user?.isGuest, needsProfileCompletion, router]);

  // Retour depuis Safari (reCAPTCHA iOS) : phoneAuthStep est encore 'code_sent' ou 'verifying'
  // Expo Router atterrit sur index via le scheme URL → rediriger vers phone-auth pour afficher l'OTP
  useEffect(() => {
    if (!showSplash && isInitialized && !isAuthenticated && phoneAuthStep !== 'idle') {
      router.replace('/(auth)/phone-auth');
    }
  }, [showSplash, isInitialized, isAuthenticated, phoneAuthStep, router]);

  const handleAcceptPrivacy = useCallback(async () => {
    await acceptPrivacy();
    setShowPrivacyModal(false);
  }, [acceptPrivacy]);

  const handlePlayAsGuest = useCallback(async () => {
    if (accepted !== true) {
      setShowPrivacyModal(true);
      return;
    }
    setIsGuestLoading(true);
    await loginAsGuest();
    setIsGuestLoading(false);
    router.replace('/(tabs)/home');
  }, [loginAsGuest, router, accepted]);

  const handleLogin = useCallback(() => {
    if (accepted !== true) {
      setShowPrivacyModal(true);
      return;
    }
    router.push('/(auth)/login');
  }, [router, accepted]);

  const handleRegister = useCallback(() => {
    if (accepted !== true) {
      setShowPrivacyModal(true);
      return;
    }
    router.push('/(auth)/register');
  }, [router, accepted]);

  // Splash Screen initial
  if (showSplash) {
    return (
      <View style={[styles.container, styles.splashContainer]}>
        <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />
        <SpinningRays />
        <Animated.View 
          entering={FadeIn.duration(800)}
          style={styles.splashContent}
        >
          <CircularLoader size={SCREEN_WIDTH * 0.45} />
          <Image
            source={splashIcon}
            style={styles.splashIcon}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  // Show loading screen while auth is initializing (after splash)
  if (!isInitialized) {
    return <LoadingScreen variant="splash" />;
  }

  return (
    <View style={styles.container}>
      {/* Fond radial */}
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + SPACING[6],
            paddingBottom: insets.bottom + SPACING[6],
          },
        ]}
      >
        {/* Logo Section avec rayons tournants */}
        <View style={styles.logoSection}>
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.logoContainer}>
            <SpinningRays />
            <Image
              source={logoImage}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            entering={FadeInDown.delay(500).duration(600)}
            style={styles.tagline}
          >
            VOTRE EMPIRE{'\n'}ENTREPRENEURIAL GRANDIT À{'\n'}CHAQUE PARTIE !
          </Animated.Text>
        </View>

        {/* Buttons Section */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(600)}
          style={styles.buttonsSection}
        >
          <GameButton
            title="S'INSCRIRE"
            variant="yellow"
            fullWidth
            onPress={handleRegister}
            style={styles.button}
          />

          <GameButton
            title="SE CONNECTER"
            variant="blue"
            fullWidth
            onPress={handleLogin}
            style={styles.button}
          />

          <GameButton
            title="JOUER EN TANT QU'INVITÉ"
            variant="blue"
            fullWidth
            loading={isGuestLoading}
            onPress={handlePlayAsGuest}
            style={styles.button}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.Text
          entering={FadeIn.delay(900).duration(400)}
          style={styles.footer}
        >
          by concree
        </Animated.Text>
      </View>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onAccept={handleAcceptPrivacy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[6],
    justifyContent: 'space-between',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING[8],
  },
  logoContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raysWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raysImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  logoImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.45,
  },
  tagline: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: SPACING[8],
    lineHeight: FONT_SIZES.lg * 1.4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonsSection: {
    gap: SPACING[4],
    paddingBottom: SPACING[4],
  },
  button: {
    marginVertical: 0,
  },
  footer: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingBottom: SPACING[2],
  },
  splashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.25,
  },
});
