import { useState, useCallback } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;
    clearError();
    await login(email, password);
    // Navigation will be handled by auth state change
  }, [email, password, login, clearError]);

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[6],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Pressable
          onPress={handleBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING[8],
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.text,
              marginLeft: SPACING[2],
            }}
          >
            Retour
          </Text>
        </Pressable>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['3xl'],
              color: COLORS.text,
              marginBottom: SPACING[2],
            }}
          >
            Connexion
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.textSecondary,
              marginBottom: SPACING[8],
            }}
          >
            Content de te revoir !
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ gap: SPACING[4] }}
        >
          <Input
            label="Email"
            placeholder="ton@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon="mail-outline"
          />

          <Input
            label="Mot de passe"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            leftIcon="lock-closed-outline"
          />

          {error && (
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.error,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          )}

          <Pressable onPress={handleForgotPassword}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.primary,
                textAlign: 'right',
              }}
            >
              Mot de passe oublié ?
            </Text>
          </Pressable>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: SPACING[8] }} />

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Button
            title="Se connecter"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!email.trim() || !password.trim()}
            onPress={handleLogin}
          />

          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginTop: SPACING[4],
              }}
            >
              Pas encore de compte ?{' '}
              <Text style={{ color: COLORS.primary, fontFamily: FONTS.bodySemiBold }}>
                S'inscrire
              </Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
