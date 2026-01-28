import { memo, useState, useCallback, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const AnimatedView = Animated.createAnimatedComponent(View);

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input = memo(
  forwardRef<TextInput, InputProps>(function Input(
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      inputStyle,
      disabled = false,
      secureTextEntry,
      ...props
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const focusAnimation = useSharedValue(0);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
      focusAnimation.value = withTiming(1, { duration: 200 });
    }, [focusAnimation]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      focusAnimation.value = withTiming(0, { duration: 200 });
    }, [focusAnimation]);

    const togglePasswordVisibility = useCallback(() => {
      setIsPasswordVisible((prev) => !prev);
    }, []);

    const animatedContainerStyle = useAnimatedStyle(() => {
      const borderColor = error
        ? COLORS.error
        : interpolateColor(
            focusAnimation.value,
            [0, 1],
            [COLORS.border, COLORS.primary]
          );

      return {
        borderColor,
      };
    });

    const showPassword = secureTextEntry && !isPasswordVisible;
    const passwordIcon = isPasswordVisible ? 'eye-off' : 'eye';

    return (
      <View style={[{ width: '100%' }, containerStyle]}>
        {label && (
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: error ? COLORS.error : COLORS.textSecondary,
              marginBottom: SPACING[2],
            }}
          >
            {label}
          </Text>
        )}

        <AnimatedView
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.card,
              borderWidth: 2,
              borderRadius: BORDER_RADIUS.lg,
              paddingHorizontal: SPACING[4],
              minHeight: 52,
            },
            animatedContainerStyle,
            disabled && { opacity: 0.5 },
          ]}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: SPACING[3] }}
            />
          )}

          <TextInput
            ref={ref}
            style={[
              {
                flex: 1,
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                paddingVertical: SPACING[3],
              },
              inputStyle,
            ]}
            placeholderTextColor={COLORS.textMuted}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            secureTextEntry={showPassword}
            {...props}
          />

          {secureTextEntry && (
            <Pressable
              onPress={togglePasswordVisibility}
              hitSlop={8}
              style={{ marginLeft: SPACING[2] }}
            >
              <Ionicons
                name={passwordIcon}
                size={20}
                color={COLORS.textSecondary}
              />
            </Pressable>
          )}

          {rightIcon && !secureTextEntry && (
            <Pressable
              onPress={onRightIconPress}
              hitSlop={8}
              disabled={!onRightIconPress}
              style={{ marginLeft: SPACING[2] }}
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={COLORS.textSecondary}
              />
            </Pressable>
          )}
        </AnimatedView>

        {(error || hint) && (
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: error ? COLORS.error : COLORS.textMuted,
              marginTop: SPACING[2],
            }}
          >
            {error || hint}
          </Text>
        )}
      </View>
    );
  })
);
