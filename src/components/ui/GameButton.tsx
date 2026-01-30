import { memo, useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  type GestureResponderEvent,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONTS } from '@/styles/typography';
import { useSettingsStore } from '@/stores';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GameButtonVariant = 'green' | 'yellow' | 'blue';
type GameButtonSize = 'default' | 'sm';

interface GameButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: GameButtonVariant;
  size?: GameButtonSize;
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
    'worklet';
    scale.value = withSpring(0.92, { damping: 10, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      runOnJS(triggerHaptic)();
      onPress?.(event);
    },
    [onPress, triggerHaptic]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;
  const isYellow = variant === 'yellow';
  const isBlue = variant === 'blue';
  const isSmall = size === 'sm';

  // Bleu proche du conteneur / fond (radial #0F3A6B, background #0C243E, backgroundLight #194F8A)
  const gradientColors: [string, string] =
    isYellow
      ? ['#FFDC64', '#F0B432']
      : isBlue
        ? (['#2A5A8A', '#1A3A5E'] as [string, string])
        : (['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)'] as [string, string]);

  const textColor = isYellow ? '#1E325A' : isBlue ? '#FFFFFF' : '#FFFFFF';

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.container,
        isYellow && styles.containerYellow,
        isBlue && styles.containerBlue,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.7 },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={gradientColors}
        style={[styles.gradient, isSmall && styles.gradientSm]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor}
          />
        ) : (
          <Text
            style={[
              styles.text,
              isSmall && styles.textSm,
              isYellow && styles.textYellow,
              isBlue && styles.textBlue,
              { color: textColor },
              textStyle,
            ]}
          >
            {title}
          </Text>
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
});
