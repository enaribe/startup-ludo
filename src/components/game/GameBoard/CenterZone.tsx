/**
 * CenterZone - Zone centrale du plateau (arrivée)
 *
 * Affiche le trophée et les pions qui ont terminé
 */

import { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';

interface CenterZoneProps {
  size: number;
  left: number;
  top: number;
  finishedPawns: { color: PlayerColor; count: number }[];
}

export const CenterZone = memo(function CenterZone({
  size,
  left,
  top,
  finishedPawns,
}: CenterZoneProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Rotation lente
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulsation subtile
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [rotation, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulse.value }],
  }));

  const totalFinished = finishedPawns.reduce((sum, p) => sum + p.count, 0);

  return (
    <View style={[styles.container, { width: size, height: size, left, top }]}>
      {/* Décoration rotative */}
      <Animated.View style={[styles.decorationRing, animatedStyle]}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <View
            key={angle}
            style={[
              styles.decorationDot,
              {
                transform: [
                  { rotate: `${angle}deg` },
                  { translateY: -size * 0.35 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Contenu central */}
      <View style={styles.centerContent}>
        <Ionicons name="trophy" size={size * 0.28} color={COLORS.primary} />

        {totalFinished > 0 && (
          <View style={styles.finishedCount}>
            <Text style={styles.countText}>{totalFinished}</Text>
          </View>
        )}
      </View>

      {/* Indicateurs de pions terminés */}
      {finishedPawns.map((pawn, index) => {
        if (pawn.count === 0) return null;

        const angle = (index * 90) - 45;
        const radius = size * 0.32;

        return (
          <View
            key={pawn.color}
            style={[
              styles.finishedPawn,
              {
                backgroundColor: COLORS.players[pawn.color],
                transform: [
                  {
                    translateX: Math.cos((angle * Math.PI) / 180) * radius,
                  },
                  {
                    translateY: Math.sin((angle * Math.PI) / 180) * radius,
                  },
                ],
              },
            ]}
          >
            <Text style={styles.pawnCountText}>{pawn.count}</Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    zIndex: 2,
  },
  decorationRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorationDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.5,
  },
  centerContent: {
    alignItems: 'center',
  },
  finishedCount: {
    marginTop: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
  },
  finishedPawn: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  pawnCountText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
  },
});
