/**
 * SocialAuthButtons - Boutons d'authentification sociale
 * Google, Apple et Téléphone
 */

import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

interface SocialAuthButtonsProps {
  onGooglePress?: () => void;
  onApplePress?: () => void;
  onPhonePress?: () => void;
  isLoading?: boolean;
}

export const SocialAuthButtons = memo(function SocialAuthButtons({
  onGooglePress,
  onApplePress,
  onPhonePress,
  isLoading = false,
}: SocialAuthButtonsProps) {
  const showApple = Platform.OS === 'ios';

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OU</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttonsRow}>
        {/* Google */}
        <Pressable
          onPress={onGooglePress}
          disabled={isLoading}
          style={styles.socialButton}
        >
          <GradientBorder
            boxHeight={56}
            boxWidth={56}
            borderRadius={28}
            fill="rgba(0, 0, 0, 0.2)"
          >
            <View style={styles.buttonContent}>
              <Ionicons name="logo-google" size={24} color="#FFFFFF" />
            </View>
          </GradientBorder>
        </Pressable>

        {/* Apple (iOS only) */}
        {showApple && (
          <Pressable
            onPress={onApplePress}
            disabled={isLoading}
            style={styles.socialButton}
          >
            <GradientBorder
              boxHeight={56}
              boxWidth={56}
              borderRadius={28}
              fill="rgba(0, 0, 0, 0.2)"
            >
              <View style={styles.buttonContent}>
                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
              </View>
            </GradientBorder>
          </Pressable>
        )}

        {/* Phone */}
        <Pressable
          onPress={onPhonePress}
          disabled={isLoading}
          style={styles.socialButton}
        >
          <GradientBorder
            boxHeight={56}
            boxWidth={56}
            borderRadius={28}
            fill="rgba(0, 0, 0, 0.2)"
          >
            <View style={styles.buttonContent}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
            </View>
          </GradientBorder>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: SPACING[6],
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: SPACING[4],
    letterSpacing: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING[3],
  },
  socialButton: {
    opacity: 1,
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
