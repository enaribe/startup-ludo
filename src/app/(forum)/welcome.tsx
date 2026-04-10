/**
 * ForumWelcomeScreen — Écran d'accueil mode forum
 *
 * Parcours direct : pas d'auth, pas de compte.
 * "Touchez pour jouer" → setup
 * QR code store (si EXPO_PUBLIC_STORE_URL) sous « TOUCHEZ POUR JOUER »
 */

import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { memo, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
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

import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const shapeImage = require('@/../assets/images/shape.png');
const logoImage = require('@/../assets/images/logostartupludo.png');

// ===== Rayons tournants (réutilisé depuis WelcomeScreen) =====
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
      <Image source={shapeImage} style={styles.raysImage} resizeMode="contain" />
    </Animated.View>
  );
});

export default function ForumWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const eventName = Constants.expoConfig?.extra?.eventName as string | undefined;
  const storeUrlRaw = Constants.expoConfig?.extra?.storeUrl as string | undefined;
  const storeUrlForQr = typeof storeUrlRaw === 'string' ? storeUrlRaw.trim() : '';
  const hasStoreQr = storeUrlForQr.length > 0;

  const handlePlay = () => {
    router.push('/(forum)/setup');
  };

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + SPACING[4],
            paddingBottom: insets.bottom + SPACING[6],
          },
        ]}
      >
        {/* Logo section */}
        <View style={styles.logoSection}>
          <Animated.View entering={FadeIn.delay(200).duration(600)} style={styles.logoContainer}>
            <SpinningRays />
            {/* Badge CLASSIQUE */}
            <View style={styles.classiqueBadge}>
              <Text style={styles.classiqueText}>CLASSIQUE</Text>
            </View>
            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.tagline}
          >
            DEVIENS ENTREPRENEUR{'\n'}EN 15 MN
          </Animated.Text>

          {/* Nom de l'événement si configuré */}
          {eventName ? (
            <Animated.Text
              entering={FadeInDown.delay(500).duration(600)}
              style={styles.eventName}
            >
              {eventName}
            </Animated.Text>
          ) : null}
        </View>

        {/* Boutons */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.buttonsSection}
        >
          <GameButton
            title="TOUCHEZ POUR JOUER"
            variant="yellow"
            fullWidth
            onPress={handlePlay}
            style={styles.button}
          />

          {hasStoreQr ? (
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>POURSUIVRE ICI</Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={storeUrlForQr}
                  size={90}
                  backgroundColor="white"
                  color="#0C243E"
                />
              </View>
            </View>
          ) : null}
        </Animated.View>

        {/* Footer */}
        <Animated.Text
          entering={FadeIn.delay(800).duration(400)}
          style={styles.footer}
        >
          by concree
        </Animated.Text>
      </View>
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
    paddingTop: SPACING[4],
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
  classiqueBadge: {
    position: 'absolute',
    top: SCREEN_WIDTH * 0.14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 10,
  },
  classiqueText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: '#0C243E',
    letterSpacing: 1,
  },
  logoImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.45,
  },
  tagline: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFBC40',
    textAlign: 'center',
    marginTop: SPACING[6],
    lineHeight: FONT_SIZES.xl * 1.4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  eventName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  buttonsSection: {
    gap: SPACING[3],
    paddingBottom: SPACING[2],
  },
  button: {
    marginVertical: 0,
  },
  qrSection: {
    alignItems: 'center',
    marginTop: SPACING[3],
  },
  qrLabel: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING[2],
    letterSpacing: 1,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
  },
  footer: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingBottom: SPACING[2],
  },
});
