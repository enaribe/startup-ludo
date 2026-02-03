/**
 * CenterZone - Zone centrale du plateau (arrivée)
 *
 * Affiche le trophée et les pions qui ont terminé
 */

import { memo } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
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
  return (
    <View style={[styles.container, { width: size, height: size, left, top }]}>
      {/* Centre : logo Startup Ludo */}
      <View style={styles.centerContent}>
        <Image
          source={require('../../../../assets/images/logostartupludo.png')}
          style={{ width: size * 0.85, height: size * 0.45 }}
          resizeMode="contain"
        />
      </View>

      {/* Cases vert / jaune / rouge / bleu (pions terminés) – au-dessus, sans bordure jaune */}
      {finishedPawns.map((pawn, index) => {
        if (pawn.count === 0) return null;

        const angle = (index * 90) - 45;
        const radius = size * 0.38;
        // Scale indicator with board size (proportional to center zone)
        const indicatorSize = Math.max(size * 0.2, 22);

        return (
          <View
            key={pawn.color}
            style={[
              styles.finishedPawn,
              {
                width: indicatorSize,
                height: indicatorSize,
                borderRadius: indicatorSize / 2,
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
            <Text style={[styles.pawnCountText, { fontSize: Math.max(indicatorSize * 0.45, 10) }]}>{pawn.count}</Text>
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
    borderWidth: 0,
    overflow: 'visible',
    zIndex: 2,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedPawn: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  pawnCountText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: '#FFFFFF',
  },
});
