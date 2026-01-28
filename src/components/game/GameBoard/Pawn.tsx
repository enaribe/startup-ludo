/**
 * Pawn - Composant de pion animé
 *
 * Gère les animations de déplacement et les interactions
 */

import { memo, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';

interface PawnProps {
  color: PlayerColor;
  targetX: number;
  targetY: number;
  cellSize: number;
  isActive?: boolean;
  isSelected?: boolean;
  isInHome?: boolean;
  isAI?: boolean;
  pawnIndex: number;
  onAnimationComplete?: () => void;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Pawn = memo(function Pawn({
  color,
  targetX,
  targetY,
  cellSize,
  isActive = false,
  isSelected = false,
  isInHome = false,
  isAI = false,
  pawnIndex: _pawnIndex,
  onAnimationComplete,
  onPress,
}: PawnProps) {
  const pawnSize = cellSize * 0.7;
  const isFirstRender = useRef(true);

  // Valeurs d'animation
  const translateX = useSharedValue(targetX - pawnSize / 2);
  const translateY = useSharedValue(targetY - pawnSize / 2);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  // Animation de déplacement
  useEffect(() => {
    const newX = targetX - pawnSize / 2;
    const newY = targetY - pawnSize / 2;

    if (isFirstRender.current) {
      translateX.value = newX;
      translateY.value = newY;
      isFirstRender.current = false;
      return;
    }

    // Animation de déplacement avec rebond
    translateX.value = withSpring(newX, {
      damping: 12,
      stiffness: 100,
    });

    translateY.value = withSpring(
      newY,
      {
        damping: 12,
        stiffness: 100,
      },
      (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      }
    );

    // Effet de rebond pendant le mouvement
    bounce.value = withSequence(
      withTiming(-8, { duration: 150, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 8 })
    );
  }, [targetX, targetY, pawnSize, translateX, translateY, bounce, onAnimationComplete]);

  // Animation de pulsation pour pion actif
  useEffect(() => {
    if (isActive && !isInHome) {
      const doPulse = () => {
        scale.value = withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 })
        );
      };

      doPulse();
      const interval = setInterval(doPulse, 1500);
      return () => clearInterval(interval);
    }
    scale.value = withSpring(1);
    return undefined;
  }, [isActive, isInHome, scale]);

  // Animation de sélection
  useEffect(() => {
    if (isSelected) {
      rotation.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      scale.value = withSpring(1.25);
    } else {
      scale.value = withSpring(isActive ? 1.1 : 1);
    }
  }, [isSelected, isActive, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + bounce.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const pawnColor = COLORS.players[color];

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.container,
        {
          width: pawnSize,
          height: pawnSize,
        },
        animatedStyle,
      ]}
    >
      {/* Corps du pion */}
      <View
        style={[
          styles.pawn,
          {
            width: pawnSize,
            height: pawnSize,
            backgroundColor: pawnColor,
            borderRadius: pawnSize / 2,
            shadowColor: pawnColor,
          },
          isActive && !isInHome && styles.activePawn,
          isSelected && styles.selectedPawn,
          isInHome && styles.homePawn,
        ]}
      >
        {/* Indicateur IA */}
        {isAI ? (
          <Ionicons
            name="hardware-chip"
            size={pawnSize * 0.4}
            color={COLORS.background}
          />
        ) : (
          <View style={styles.pawnInner}>
            <View
              style={[
                styles.pawnDot,
                {
                  width: pawnSize * 0.3,
                  height: pawnSize * 0.3,
                  borderRadius: pawnSize * 0.15,
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Anneau de sélection */}
      {isSelected && (
        <View
          style={[
            styles.selectionRing,
            {
              width: pawnSize + 10,
              height: pawnSize + 10,
              borderRadius: (pawnSize + 10) / 2,
              borderColor: COLORS.primary,
            },
          ]}
        />
      )}

      {/* Ombre */}
      <View
        style={[
          styles.shadow,
          {
            width: pawnSize * 0.7,
            height: pawnSize * 0.15,
            borderRadius: pawnSize * 0.35,
            bottom: -pawnSize * 0.08,
          },
        ]}
      />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pawn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activePawn: {
    shadowOpacity: 0.6,
    shadowRadius: 10,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  selectedPawn: {
    shadowOpacity: 0.8,
    shadowRadius: 15,
    borderColor: COLORS.white,
    borderWidth: 3,
  },
  homePawn: {
    opacity: 0.85,
  },
  pawnInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pawnDot: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  selectionRing: {
    position: 'absolute',
    borderWidth: 3,
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
});
