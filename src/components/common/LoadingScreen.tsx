/**
 * LoadingScreen - Écran de chargement avec logo LUDO et cercle de progression
 */

import { memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground } from '@/components/ui/RadialBackground';

const CIRCLE_SIZE = 180;
const STROKE_WIDTH = 6;

// Import des assets
const logoImage = require('@/../assets/images/logostartupludo.png');

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
  variant?: 'default' | 'splash';
}

export const LoadingScreen = memo(function LoadingScreen({
  message,
  fullScreen = true,
  style,
  variant = 'default',
}: LoadingScreenProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Rotation continue du cercle
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const containerStyle: ViewStyle = fullScreen
    ? { flex: 1 }
    : {};

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  if (variant === 'splash') {
    return (
      <View style={[containerStyle, styles.container, style]}>
        <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

        <View style={styles.content}>
          {/* Cercle de progression autour du logo */}
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.circleContainer, rotationStyle]}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
                <Defs>
                  <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#FFBC40" stopOpacity="1" />
                    <Stop offset="50%" stopColor="#F0B432" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#FFBC40" stopOpacity="0.3" />
                  </LinearGradient>
                </Defs>

                {/* Cercle de fond */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={radius}
                  stroke="rgba(255, 188, 64, 0.15)"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />

                {/* Cercle de progression avec dégradé */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={radius}
                  stroke="url(#progressGradient)"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
                  transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                />
              </Svg>
            </Animated.View>

            {/* Logo au centre */}
            <View style={styles.logoCenter}>
              <Image
                source={logoImage}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
        </View>
      </View>
    );
  }

  // Variante par défaut (simple spinner)
  return (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: COLORS.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING[6],
        },
        style,
      ]}
    >
      <Animated.View style={rotationStyle}>
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

      {message && (
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
      )}
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

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    position: 'absolute',
  },
  logoCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: CIRCLE_SIZE * 0.55,
    height: CIRCLE_SIZE * 0.4,
  },
  message: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    marginTop: SPACING[6],
    textAlign: 'center',
  },
});
