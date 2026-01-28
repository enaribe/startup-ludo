import { memo, useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/styles/colors';
import { useSettingsStore } from '@/stores';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle; pressed: ViewStyle }
> = {
  primary: {
    container: {
      backgroundColor: COLORS.primary,
    },
    text: {
      color: COLORS.background,
    },
    pressed: {
      backgroundColor: COLORS.primaryDark,
    },
  },
  secondary: {
    container: {
      backgroundColor: COLORS.card,
    },
    text: {
      color: COLORS.text,
    },
    pressed: {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: COLORS.primary,
    },
    text: {
      color: COLORS.primary,
    },
    pressed: {
      backgroundColor: 'rgba(255, 188, 64, 0.1)',
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: COLORS.text,
    },
    pressed: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  danger: {
    container: {
      backgroundColor: COLORS.error,
    },
    text: {
      color: COLORS.white,
    },
    pressed: {
      backgroundColor: '#D32F2F',
    },
  },
};

const SIZE_STYLES: Record<
  ButtonSize,
  { container: ViewStyle; text: TextStyle }
> = {
  sm: {
    container: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    text: {
      fontSize: 14,
    },
  },
  md: {
    container: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    text: {
      fontSize: 16,
    },
  },
  lg: {
    container: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
    },
    text: {
      fontSize: 18,
    },
  },
};

export const Button = memo(function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticsEnabled]);

  const handlePressIn = useCallback(() => {
    'worklet';
    scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      runOnJS(triggerHaptic)();
      onPress?.(event);
    },
    [onPress, triggerHaptic]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        variantStyle.container,
        sizeStyle.container,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.5 },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyle.text.color}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              {
                fontFamily: 'LuckiestGuy_400Regular',
                letterSpacing: 0.5,
              },
              variantStyle.text,
              sizeStyle.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedPressable>
  );
});
