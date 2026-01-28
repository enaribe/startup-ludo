import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginAsGuest, isAuthenticated, isLoading } = useAuthStore();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // Logo pulse animation
  const logoScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [logoScale]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const handlePlayAsGuest = useCallback(async () => {
    setIsGuestLoading(true);
    await loginAsGuest();
    setIsGuestLoading(false);
    router.replace('/(tabs)/home');
  }, [loginAsGuest, router]);

  const handleLogin = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  const handleRegister = useCallback(() => {
    router.push('/(auth)/register');
  }, [router]);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[6],
        }}
      >
        {/* Logo Section */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Animated.View style={logoAnimatedStyle}>
            <View
              style={{
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: COLORS.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING[6],
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES['4xl'],
                  color: COLORS.background,
                }}
              >
                SL
              </Text>
            </View>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(300).duration(600)}
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['4xl'],
              color: COLORS.text,
              textAlign: 'center',
              marginBottom: SPACING[2],
            }}
          >
            STARTUP LUDO
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(500).duration(600)}
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.textSecondary,
              textAlign: 'center',
              maxWidth: 280,
            }}
          >
            Apprends l'entrepreneuriat en jouant !
          </Animated.Text>
        </View>

        {/* Buttons Section */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(600)}
          style={{
            gap: SPACING[4],
          }}
        >
          <Button
            title="Jouer en invité"
            variant="primary"
            size="lg"
            fullWidth
            loading={isGuestLoading}
            onPress={handlePlayAsGuest}
          />

          <Button
            title="Se connecter"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleLogin}
          />

          <Pressable onPress={handleRegister}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginTop: SPACING[2],
              }}
            >
              Pas encore de compte ?{' '}
              <Text style={{ color: COLORS.primary, fontFamily: FONTS.bodySemiBold }}>
                S'inscrire
              </Text>
            </Text>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: FONT_SIZES.xs,
            color: COLORS.textMuted,
            textAlign: 'center',
            marginTop: SPACING[6],
          }}
        >
          Version 1.0.0
        </Text>
      </View>
    </LinearGradient>
  );
}
