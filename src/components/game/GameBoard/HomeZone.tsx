/**
 * HomeZone - Zone maison du joueur
 *
 * Mode classique : yellowhouse, bluehouse, redhouse, greenhouse
 * Mode forum (appMode forum) : variantes *health* (Healthtech) pour les quatre couleurs
 */

import Constants from 'expo-constants';
import { memo } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View } from 'react-native';
import type { Player, PlayerColor } from '@/types';
import { BOARD_SIZE } from '@/config/boardConfig';

const IS_FORUM_MODE = Constants.expoConfig?.extra?.appMode === 'forum';

interface HomeZoneProps {
  color: PlayerColor;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: number;
  boardPadding: number;
  player?: Player;
}

const HOUSE_IMAGES_CLASSIC: Record<PlayerColor, ImageSourcePropType> = {
  yellow: require('../../../../assets/images/yellowhouse.png'),
  blue: require('../../../../assets/images/bluehouse.png'),
  red: require('../../../../assets/images/redhouse.png'),
  green: require('../../../../assets/images/greenhouse.png'),
};

/** Plateau forum uniquement — assets Healthtech */
const HOUSE_IMAGES_FORUM: Record<PlayerColor, ImageSourcePropType> = {
  yellow: require('../../../../assets/images/yellowhealth.png'),
  blue: require('../../../../assets/images/bluehealth.png'),
  red: require('../../../../assets/images/redhealth.png'),
  green: require('../../../../assets/images/greenhealth.png'),
};

export const HomeZone = memo(function HomeZone({
  color,
  position,
  size,
  boardPadding,
}: HomeZoneProps) {
  const houseSource = (IS_FORUM_MODE ? HOUSE_IMAGES_FORUM : HOUSE_IMAGES_CLASSIC)[color];

  const cellSize = size / 5;
  // Inset pour ne pas coller aux cases du chemin, tout en restant aligné
  const inset = 3;
  const displaySize = size - inset * 2;

  // Position absolue selon le coin (grille 13x13, zones 5x5)
  let top = boardPadding + inset;
  let left = boardPadding + inset;

  switch (position) {
    case 'top-left':
      top = boardPadding + inset;
      left = boardPadding + inset;
      break;
    case 'top-right':
      top = boardPadding + inset;
      left = boardPadding + cellSize * (BOARD_SIZE - 5) + inset;
      break;
    case 'bottom-left':
      top = boardPadding + cellSize * (BOARD_SIZE - 5) + inset;
      left = boardPadding + inset;
      break;
    case 'bottom-right':
      top = boardPadding + cellSize * (BOARD_SIZE - 5) + inset;
      left = boardPadding + cellSize * (BOARD_SIZE - 5) + inset;
      break;
  }

  return (
    <View
      style={[
        styles.container,
        {
          top,
          left,
          width: displaySize,
          height: displaySize,
        },
      ]}
    >
      <Image source={houseSource} style={styles.image} resizeMode="cover" />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
