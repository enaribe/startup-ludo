import { memo, useCallback } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
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

type GameButtonVariant = 'green' | 'yellow';

interface GameButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: GameButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GameButton = memo(function GameButton({
  title,
  variant = 'green',
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
    (event: any) => {
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

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.container,
        isYellow && styles.containerYellow,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.7 },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={
          isYellow
            ? (['#FFDC64', '#F0B432'] as [string, string])
            : (['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)'] as [string, string])
        }
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isYellow ? '#1E325A' : '#FFFFFF'}
          />
        ) : (
          <Text
            style={[
              styles.text,
              isYellow && styles.textYellow,
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
  gradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
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
  textYellow: {
    color: '#1E325A',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
