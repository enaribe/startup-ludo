/**
 * WelcomeScreen - Écran d'accueil avec le logo START UP LUDO
 *
 * Design basé sur le système de design avec RadialBackground,
 * GameButton et les assets existants (shape.png, logostartupludo.png).
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { PrivacyPolicyModal } from '@/components/common/PrivacyPolicyModal';
import { usePrivacyAcceptance } from '@/hooks/usePrivacyAcceptance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import des assets
const shapeImage = require('@/../assets/images/shape.png');
const logoImage = require('@/../assets/images/logostartupludo.png');

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

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsGuest, isAuthenticated, isInitialized } = useAuthStore();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { accepted, loading: privacyLoading, acceptPrivacy } = usePrivacyAcceptance();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Show privacy modal on first visit
  useEffect(() => {
    if (!privacyLoading && accepted === false) {
      setShowPrivacyModal(true);
    }
  }, [privacyLoading, accepted]);

  // Redirect if already authenticated (wait for auth to be initialized first)
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isInitialized, router]);

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

  // Show loading screen while auth is initializing
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
});
