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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordError = password && confirmPassword && password !== confirmPassword
    ? 'Les mots de passe ne correspondent pas'
    : undefined;

  const isFormValid = displayName.trim() && email.trim() && password.trim() &&
    confirmPassword.trim() && password === confirmPassword && password.length >= 6;

  const handleRegister = useCallback(async () => {
    if (!isFormValid) return;
    clearError();
    await register(email, password, displayName);
    // Navigation will be handled by auth state change
  }, [email, password, displayName, register, clearError, isFormValid]);

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
            Inscription
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.textSecondary,
              marginBottom: SPACING[8],
            }}
          >
            Crée ton compte et deviens entrepreneur !
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ gap: SPACING[4] }}
        >
          <Input
            label="Nom d'entrepreneur"
            placeholder="Ton nom dans le jeu"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoComplete="name"
            leftIcon="person-outline"
          />

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
            placeholder="Minimum 6 caractères"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            leftIcon="lock-closed-outline"
            hint={password && password.length < 6 ? 'Minimum 6 caractères' : undefined}
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            leftIcon="lock-closed-outline"
            error={passwordError}
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
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: SPACING[8] }} />

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Button
            title="Créer mon compte"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!isFormValid}
            onPress={handleRegister}
          />

          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginTop: SPACING[4],
              }}
            >
              Déjà un compte ?{' '}
              <Text style={{ color: COLORS.primary, fontFamily: FONTS.bodySemiBold }}>
                Se connecter
              </Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
