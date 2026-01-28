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
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = useCallback(async () => {
    if (!email.trim()) return;
    clearError();
    await resetPassword(email);
    setEmailSent(true);
  }, [email, resetPassword, clearError]);

  const handleBack = () => {
    router.back();
  };

  if (emailSent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[6],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card padding={6} style={{ alignItems: 'center', maxWidth: 320 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.success,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: SPACING[4],
            }}
          >
            <Ionicons name="mail" size={32} color={COLORS.white} />
          </View>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES.xl,
              color: COLORS.text,
              textAlign: 'center',
              marginBottom: SPACING[2],
            }}
          >
            Email envoyé !
          </Text>

          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.base,
              color: COLORS.textSecondary,
              textAlign: 'center',
              marginBottom: SPACING[6],
            }}
          >
            Si un compte existe avec l'adresse {email}, tu recevras un email
            pour réinitialiser ton mot de passe.
          </Text>

          <Button
            title="Retour à la connexion"
            variant="primary"
            fullWidth
            onPress={() => router.replace('/(auth)/login')}
          />
        </Card>
      </View>
    );
  }

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
            Mot de passe oublié
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.md,
              color: COLORS.textSecondary,
              marginBottom: SPACING[8],
            }}
          >
            Entre ton adresse email pour recevoir un lien de réinitialisation.
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
            title="Envoyer le lien"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!email.trim()}
            onPress={handleResetPassword}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
