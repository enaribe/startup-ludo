import { memo } from 'react';
import { View, Text, ActivityIndicator, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const LoadingScreen = memo(function LoadingScreen({
  message = 'Chargement...',
  fullScreen = true,
  style,
}: LoadingScreenProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const containerStyle: ViewStyle = fullScreen
    ? {
        flex: 1,
        backgroundColor: COLORS.background,
      }
    : {};

  return (
    <View
      style={[
        containerStyle,
        {
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING[6],
        },
        style,
      ]}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 4,
            borderColor: COLORS.primary,
            borderTopColor: 'transparent',
          }}
        />
      </Animated.View>

      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.md,
          color: COLORS.text,
          marginTop: SPACING[4],
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
});

// Simple loading indicator for inline use
interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingIndicator = memo(function LoadingIndicator({
  size = 'small',
  color = COLORS.primary,
}: LoadingIndicatorProps) {
  return <ActivityIndicator size={size} color={color} />;
});
