import { memo, useCallback, type ReactNode } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useSettingsStore } from '@/stores';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GameButtonVariant = 'green' | 'yellow' | 'blue' | 'red';
type GameButtonSize = 'default' | 'sm' | 'lg';

interface GameButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: GameButtonVariant;
  size?: GameButtonSize;
  /** Icône ou décor à gauche du titre (non affiché en chargement) */
  leftIcon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GameButton = memo(function GameButton({
  title,
  variant = 'green',
  size = 'default',
  leftIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  onPress,
  ...props
}: GameButtonProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticsEnabled]);

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(0.92, { damping: 10, stiffness: 400 });
  }, [scale, disabled, loading]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled || loading) return;
      triggerHaptic();
      onPress?.(event);
    },
    [onPress, triggerHaptic, disabled, loading]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;
  const isYellow = variant === 'yellow';
  const isBlue = variant === 'blue';
  const isRed = variant === 'red';
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  // Bleu proche du conteneur / fond (radial #0F3A6B, background #0C243E, backgroundLight #194F8A)
  const gradientColors: [string, string] =
    isYellow
      ? ['#FFDC64', '#F0B432']
      : isBlue
        ? (['#2A5A8A', '#1A3A5E'] as [string, string])
        : isRed
          ? (['#E57373', '#C62828'] as [string, string])
          : (['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)'] as [string, string]);

  const textColor = isYellow ? '#1E325A' : isBlue || isRed ? '#FFFFFF' : '#FFFFFF';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.container,
        isYellow && styles.containerYellow,
        isBlue && styles.containerBlue,
        isRed && styles.containerRed,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.7 },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={gradientColors}
        style={[
          styles.gradient,
          isSmall && styles.gradientSm,
          isLarge && styles.gradientLg,
          leftIcon ? styles.gradientWithIcon : undefined,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor}
          />
        ) : (
          <View style={[styles.labelRow, leftIcon && styles.labelRowWithIcon]}>
            {leftIcon ? <View style={styles.leftIconSlot}>{leftIcon}</View> : null}
            <Text
              style={[
                styles.text,
                isSmall && styles.textSm,
                isLarge && styles.textLg,
                isYellow && styles.textYellow,
                (isBlue || isRed) && styles.textLight,
                { color: textColor },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  containerYellow: {
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    shadowOpacity: 0.15,
  },
  containerBlue: {
    backgroundColor: 'transparent',
    borderColor: '#FFFFFF',
    shadowOpacity: 0.15,
  },
  containerRed: {
    backgroundColor: '#E57373',
    borderColor: '#FFFFFF',
    shadowOpacity: 0.15,
  },
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  gradientSm: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    minHeight: 38,
  },
  gradientLg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
  },
  gradientWithIcon: {
    paddingHorizontal: SPACING[4],
  },
  labelRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRowWithIcon: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  leftIconSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(24, 114, 54, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  textSm: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  textLg: {
    fontSize: 18,
    letterSpacing: 1.2,
  },
  textYellow: {
    color: '#1E325A',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textBlue: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textLight: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
