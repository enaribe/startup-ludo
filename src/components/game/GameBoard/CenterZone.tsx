/**
 * CenterZone - Zone centrale du plateau (arrivée)
 *
 * Mode forum : carte Healthtech (Africa Health + Mastercard + logo AFYA FEST) ; sinon logo Startup Ludo.
 */

import Constants from 'expo-constants';
import { memo } from 'react';
import { Image, View, Text, StyleSheet, type ImageSourcePropType } from 'react-native';
import type { PlayerColor } from '@/types';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const IS_FORUM_MODE = Constants.expoConfig?.extra?.appMode === 'forum';

const CENTER_IMAGE_DEFAULT: ImageSourcePropType = require('../../../../assets/images/logostartupludo.png');
const AFRICA_HEALTH_IMAGE: ImageSourcePropType = require('../../../../assets/images/africa-health-collaborative.png');
const MASTERCARD_IMAGE: ImageSourcePropType = require('../../../../assets/images/mastercard-foundation.png');
const AFYA_FEST_IMAGE: ImageSourcePropType = require('../../../../assets/images/afya-fest-2026.png');

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
      {IS_FORUM_MODE ? (
        <View style={[styles.forumCard, { width: size, height: size, padding: size * 0.08 }]}>
          <View style={styles.forumPartnerRow}>
            <Image
              source={AFRICA_HEALTH_IMAGE}
              style={{ width: size * 0.2, height: size * 0.2 * (512 / 1205) }}
              resizeMode="contain"
              accessibilityLabel="Africa Health Collaborative"
            />
            <Image
              source={MASTERCARD_IMAGE}
              style={{ width: size * 0.11, height: size * 0.11 * (114 / 109) }}
              resizeMode="contain"
              accessibilityLabel="En partenariat avec Mastercard Foundation"
            />
          </View>
          <View style={styles.forumAfyaWrap}>
            <Image
              source={AFYA_FEST_IMAGE}
              style={{ width: size * 0.62, height: size * 0.62 * (512 / 809) }}
              resizeMode="contain"
              accessibilityLabel="AFYA FEST 2026"
            />
          </View>
        </View>
      ) : (
        <View style={styles.centerContent}>
          <Image source={CENTER_IMAGE_DEFAULT} style={{ width: size * 0.85, height: size * 0.45 }} resizeMode="contain" />
        </View>
      )}

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
  forumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forumPartnerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forumAfyaWrap: {
    flex: 1,
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
