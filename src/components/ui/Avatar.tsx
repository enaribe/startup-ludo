import { memo } from 'react';
import { View, Text, Image, type ViewStyle } from 'react-native';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { PlayerColor } from '@/types';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  playerColor?: PlayerColor;
  showBorder?: boolean;
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
  style,
}: AvatarProps) {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const borderColor = playerColor ? COLORS.players[playerColor] : COLORS.primary;
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
