import { memo, useId } from 'react';
import { View, Text, Image, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { PlayerColor } from '@/types';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type AvatarVariant = 'default' | 'homeHeader';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  playerColor?: PlayerColor;
  showBorder?: boolean;
  borderColor?: string;
  /**
   * En-tête accueil : dégradé radial bleu (comme boutons bleus), bordure blanche, initiales blanches.
   * Ignore toujours la photo de profil (ex. Google) pour garder le même rendu que sans OAuth.
   */
  variant?: AvatarVariant;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: FONT_SIZES.xs,
  sm: FONT_SIZES.sm,
  md: FONT_SIZES.md,
  lg: FONT_SIZES.xl,
  xl: FONT_SIZES['3xl'],
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first?.charAt(0) ?? ''}${last?.charAt(0) ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colors = [
    COLORS.players.yellow,
    COLORS.players.blue,
    COLORS.players.green,
    COLORS.players.red,
    COLORS.primary,
    COLORS.events.quiz,
    COLORS.events.funding,
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index] ?? COLORS.primary;
};

export const Avatar = memo(function Avatar({
  source,
  name = '',
  size = 'md',
  playerColor,
  showBorder = false,
  borderColor: borderColorProp,
  variant = 'default',
  style,
}: AvatarProps) {
  const gradientId = useId().replace(/:/g, '_');
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const borderColor = borderColorProp ?? (playerColor ? COLORS.players[playerColor] : COLORS.primary);
  const backgroundColor = playerColor
    ? COLORS.players[playerColor]
    : getColorFromName(name);

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor,
    ...(showBorder && {
      borderWidth: 3,
      borderColor,
    }),
  };

  // En-tête accueil : même palette que GameButton variant blue (#2A5A8A → #1A3A5E), radial + anneau blanc
  if (variant === 'homeHeader') {
    const initials = getInitials(name);
    const titleSize = Math.min(fontSize + 3, dimension * 0.42);
    return (
      <View
        style={[
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            overflow: 'hidden',
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Svg width={dimension} height={dimension} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="55%">
              <Stop offset="0%" stopColor="#3A6B9E" />
              <Stop offset="45%" stopColor="#2A5A8A" />
              <Stop offset="100%" stopColor="#1A3A5E" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={dimension / 2}
            fill={`url(#${gradientId})`}
          />
        </Svg>
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: titleSize,
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          {initials}
        </Text>
      </View>
    );
  }

  if (source) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri: source }}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Text
        style={{
          fontFamily: FONTS.title,
          fontSize,
          color: COLORS.background,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
});
