/**
 * Pawn - Composant de pion animé
 *
 * Gère les animations de déplacement case par case et les interactions
 */

import { memo, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';

interface PawnProps {
  color: PlayerColor;
  targetX: number;
  targetY: number;
  cellSize: number;
  movePath?: { x: number; y: number }[];
  isActive?: boolean;
  isSelected?: boolean;
  isInHome?: boolean;
  isAI?: boolean;
  pawnIndex: number;
  onAnimationComplete?: () => void;
  onPress?: () => void;
}

const STEP_DURATION = 100; // ms par case (augmenté pour stabilité)

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Pawn = memo(function Pawn({
  color,
  targetX,
  targetY,
  cellSize,
  movePath,
  isActive = false,
  isSelected = false,
  isInHome = false,
  isAI = false,
  pawnIndex,
  onAnimationComplete,
  onPress,
}: PawnProps) {
  const pawnSize = cellSize * 0.7;
  const isFirstRender = useRef(true);
  const lastTargetRef = useRef<string>('');

  // Valeurs d'animation
  const translateX = useSharedValue(targetX - pawnSize / 2);
  const translateY = useSharedValue(targetY - pawnSize / 2);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const bounce = useSharedValue(0);

  // Callback stable pour éviter les re-renders
  const handleAnimationComplete = useCallback(() => {
    console.log(`[Pawn ${pawnIndex}] Animation complete`);
    onAnimationComplete?.();
  }, [onAnimationComplete, pawnIndex]);

  // Animation de déplacement
  useEffect(() => {
    const newX = targetX - pawnSize / 2;
    const newY = targetY - pawnSize / 2;
    const targetKey = `${targetX},${targetY}`;

    console.log(`[Pawn ${pawnIndex}] useEffect triggered`, {
      targetX,
      targetY,
      newX,
      newY,
      isFirstRender: isFirstRender.current,
      lastTarget: lastTargetRef.current,
      hasMovePath: !!movePath,
      movePathLength: movePath?.length ?? 0,
    });

    // Premier rendu : positionnement direct sans animation
    if (isFirstRender.current) {
      console.log(`[Pawn ${pawnIndex}] First render - direct positioning`);
      translateX.value = newX;
      translateY.value = newY;
      isFirstRender.current = false;
      lastTargetRef.current = targetKey;
      return;
    }

    // Si la cible n'a pas changé, ne rien faire
    if (targetKey === lastTargetRef.current) {
      console.log(`[Pawn ${pawnIndex}] Target unchanged, skipping animation`);
      return;
    }

    lastTargetRef.current = targetKey;

    // Annuler les animations en cours pour éviter les conflits
    try {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(bounce);
    } catch (e) {
      console.warn(`[Pawn ${pawnIndex}] cancelAnimation error:`, e);
    }

    // Animation simple et robuste : spring direct vers la cible
    console.log(`[Pawn ${pawnIndex}] Starting spring animation to (${newX}, ${newY})`);
    
    try {
      translateX.value = withSpring(newX, { 
        damping: 15, 
        stiffness: 120,
        mass: 0.8,
      });
      
      translateY.value = withSpring(newY, { 
        damping: 15, 
        stiffness: 120,
        mass: 0.8,
      }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(handleAnimationComplete)();
        }
      });

      // Petit rebond
      bounce.value = withSequence(
        withTiming(-6, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 180, easing: Easing.inOut(Easing.quad) })
      );
    } catch (error) {
      console.error(`[Pawn ${pawnIndex}] Animation error:`, error);
      // Fallback : positionnement direct
      translateX.value = newX;
      translateY.value = newY;
      bounce.value = 0;
      handleAnimationComplete();
    }
  }, [targetX, targetY, pawnSize, pawnIndex, handleAnimationComplete, translateX, translateY, bounce]);

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

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Protection contre les valeurs NaN
    const tx = isNaN(translateX.value) ? 0 : translateX.value;
    const ty = isNaN(translateY.value) ? 0 : translateY.value;
    const b = isNaN(bounce.value) ? 0 : bounce.value;
    const s = isNaN(scale.value) || scale.value <= 0 ? 1 : scale.value;
    const r = isNaN(rotation.value) ? 0 : rotation.value;
    
    return {
      transform: [
        { translateX: tx },
        { translateY: ty + b },
        { scale: s },
        { rotate: `${r}deg` },
      ],
    };
  });

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
