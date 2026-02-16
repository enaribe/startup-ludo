import { memo, useCallback, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/styles/colors';
import { useSettingsStore } from '@/stores';

interface DiceProps {
  value: number | null;
  isRolling?: boolean;
  disabled?: boolean;
  size?: number;
  onRoll?: () => number;
  onRollComplete?: (value: number) => void;
}

const DOT_POSITIONS: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 0.5, y: 0.5 }],
  2: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.75 },
  ],
  3: [
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
  ],
  4: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  5: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
  6: [
    { x: 0.25, y: 0.25 },
    { x: 0.75, y: 0.25 },
    { x: 0.25, y: 0.5 },
    { x: 0.75, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.75, y: 0.75 },
  ],
};

export const Dice = memo(function Dice({
  value,
  isRolling: externalRolling = false,
  disabled = false,
  size = 80,
  onRoll,
  onRollComplete,
}: DiceProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const [internalRolling, setInternalRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(value ?? 1);

  const isRolling = externalRolling || internalRolling;

  // Animation values
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticsEnabled]);

  const handleRollComplete = useCallback(
    (finalValue: number) => {
      setDisplayValue(finalValue);
      setInternalRolling(false);
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onRollComplete?.(finalValue);
    },
    [hapticsEnabled, onRollComplete]
  );

  const handlePress = useCallback(() => {
    if (disabled || isRolling) return;

    setInternalRolling(true);
    triggerHaptic();

    // Get the final value
    const finalValue = onRoll?.() ?? Math.floor(Math.random() * 6) + 1;

    // Simulate rolling through random values
    let rollCount = 0;
    const maxRolls = 10;
    const rollInterval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;

      if (hapticsEnabled && rollCount % 2 === 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        handleRollComplete(finalValue);
      }
    }, 100);

    // Simple pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      ),
      10,
      false
    );
  }, [
    disabled,
    isRolling,
    triggerHaptic,
    onRoll,
    handleRollComplete,
    scale,
    hapticsEnabled,
  ]);

  // Update display value when external value changes
  useEffect(() => {
    if (value !== null && !isRolling) {
      setDisplayValue(value);
    }
  }, [value, isRolling]);

  // Handle external rolling (remote player dice animation)
  useEffect(() => {
    if (!externalRolling || internalRolling) return;

    // Animate dice rolling for remote player
    let rollCount = 0;
    const maxRolls = 8;
    const rollInterval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        if (value !== null) {
          setDisplayValue(value);
          onRollComplete?.(value);
        }
      }
    }, 100);

    // Simple pulse animation for remote dice
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 100 }),
        withTiming(1, { duration: 100 })
      ),
      8,
      false
    );

    return () => clearInterval(rollInterval);
  }, [externalRolling]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
    ],
  }));

  const dotSize = size * 0.15;
  const dots = DOT_POSITIONS[displayValue] ?? DOT_POSITIONS[1];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isRolling}
      style={[styles.pressable, disabled && styles.disabled]}
    >
      <Animated.View
        style={[
          styles.dice,
          {
            width: size,
            height: size,
            borderRadius: size * 0.15,
          },
          animatedStyle,
        ]}
      >
        {/* Dice face */}
        <View style={styles.face}>
          {dots?.map((dot, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  left: dot.x * size - dotSize / 2 - size * 0.1,
                  top: dot.y * size - dotSize / 2 - size * 0.1,
                },
              ]}
            />
          ))}
        </View>

        {/* Highlight */}
        <View style={[styles.highlight, { borderRadius: size * 0.15 }]} />

        {/* Shadow effect on dice */}
        <View
          style={[
            styles.innerShadow,
            {
              borderRadius: size * 0.15,
            },
          ]}
        />
      </Animated.View>

      {/* External shadow */}
      <View
        style={[
          styles.shadow,
          {
            width: size * 0.8,
            height: size * 0.15,
            borderRadius: size * 0.4,
            marginTop: size * 0.1,
          },
        ]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  dice: {
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  face: {
    position: 'relative',
    width: '80%',
    height: '80%',
  },
  dot: {
    position: 'absolute',
    backgroundColor: COLORS.background,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  innerShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});
