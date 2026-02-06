/**
 * AuthInput - Input stylisé pour les écrans d'authentification
 * Utilise GradientBorder pour les bordures subtiles du design system
 */

import { memo, useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBorder } from '@/components/ui/GradientBorder';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const AuthInput = memo(function AuthInput({
  label,
  error,
  leftIcon,
  secureTextEntry,
  ...props
}: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const togglePassword = useCallback(() => setIsPasswordVisible(v => !v), []);

  const showPassword = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <GradientBorder
        boxHeight={52}
        boxWidth={SCREEN_WIDTH - 48}
        borderRadius={26}
        fill={isFocused ? 'rgba(255, 188, 64, 0.08)' : 'rgba(0, 0, 0, 0.2)'}
      >
        <View style={styles.inputWrapper}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? '#FFBC40' : 'rgba(255, 255, 255, 0.4)'}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            style={styles.input}
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={showPassword}
            {...props}
          />

          {secureTextEntry && (
            <Pressable onPress={togglePassword} hitSlop={8} style={styles.eyeButton}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color="rgba(255, 255, 255, 0.5)"
              />
            </Pressable>
          )}
        </View>
      </GradientBorder>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: SPACING[2],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[5],
  },
  leftIcon: {
    marginRight: SPACING[3],
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    paddingVertical: SPACING[3],
  },
  eyeButton: {
    padding: SPACING[2],
    marginLeft: SPACING[2],
  },
  error: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#E74C3C',
    marginTop: SPACING[1],
    marginLeft: SPACING[4],
  },
});
