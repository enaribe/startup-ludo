/**
 * CenterZone - Zone centrale du plateau (arrivée)
 *
 * Mode forum : image Agribusiness (milieu.png) ; sinon logo Startup Ludo.
 */

import Constants from 'expo-constants';
import { memo } from 'react';
import { Image, View, Text, StyleSheet, type ImageSourcePropType } from 'react-native';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const IS_FORUM_MODE = Constants.expoConfig?.extra?.appMode === 'forum';

const CENTER_IMAGE_DEFAULT: ImageSourcePropType = require('../../../../assets/images/logostartupludo.png');
const CENTER_IMAGE_FORUM: ImageSourcePropType = require('../../../../assets/images/milieu.png');

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
  const centerSource = IS_FORUM_MODE ? CENTER_IMAGE_FORUM : CENTER_IMAGE_DEFAULT;
  /** Logo large horizontal ; milieu.png plutôt carré */
  const centerImageStyle = IS_FORUM_MODE
    ? { width: size * 0.88, height: size * 0.88 }
    : { width: size * 0.85, height: size * 0.45 };

  return (
    <View style={[styles.container, { width: size, height: size, left, top }]}>
      <View style={styles.centerContent}>
        <Image source={centerSource} style={centerImageStyle} resizeMode="contain" />
      </View>

      {/* Cases vert / jaune / rouge / bleu (pions terminés) – au-dessus, sans bordure jaune */}
      {finishedPawns.map((pawn, index) => {
        if (pawn.count === 0) return null;

        const angle = (index * 90) - 45;
        const radius = size * 0.38;

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
