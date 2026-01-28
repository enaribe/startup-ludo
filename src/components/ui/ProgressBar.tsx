import { memo, useEffect } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

type ProgressBarSize = 'sm' | 'md' | 'lg';
type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger' | 'player';

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: ProgressBarSize;
  variant?: ProgressBarVariant;
  playerColor?: keyof typeof COLORS.players;
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<ProgressBarSize, number> = {
  sm: 4,
  md: 8,
  lg: 12,
};

const VARIANT_COLORS: Record<ProgressBarVariant, string> = {
  default: COLORS.primary,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.error,
  player: COLORS.primary, // Will be overridden by playerColor
};

export const ProgressBar = memo(function ProgressBar({
  progress,
  size = 'md',
  variant = 'default',
  playerColor,
  showLabel = false,
  label,
  showPercentage = false,
  animated = true,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const animatedWidth = useSharedValue(animated ? 0 : clampedProgress);

  useEffect(() => {
    if (animated) {
      animatedWidth.value = withTiming(clampedProgress, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      animatedWidth.value = clampedProgress;
    }
  }, [clampedProgress, animated, animatedWidth]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const height = SIZE_MAP[size];
  const barColor =
    variant === 'player' && playerColor
      ? COLORS.players[playerColor]
      : VARIANT_COLORS[variant];

  return (
    <View style={[{ width: '100%' }, style]}>
      {(showLabel || showPercentage) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING[2],
          }}
        >
          {showLabel && (
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.sm,
                color: COLORS.text,
              }}
            >
              {label ?? ''}
            </Text>
          )}
          {showPercentage && (
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: FONT_SIZES.sm,
                color: barColor,
              }}
            >
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          height,
          backgroundColor: COLORS.card,
          borderRadius: BORDER_RADIUS.full,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: barColor,
              borderRadius: BORDER_RADIUS.full,
            },
            animatedBarStyle,
          ]}
        />
      </View>
    </View>
  );
});
