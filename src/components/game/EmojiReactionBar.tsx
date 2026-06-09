/**
 * EmojiReactionBar - Barre de reactions emoji pour le jeu
 *
 * Affiche 5 icônes SVG en bas de l'écran pour réagir pendant la partie.
 * Chaque icône est dans un conteneur circulaire à bordure gradient SVG.
 */

import * as Haptics from 'expo-haptics';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// ===== ICÔNES SVG =====

function IconSad({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      {/* Fond blanc : transparaît à travers les yeux/bouche (trous du path doré) */}
      <Circle cx={11} cy={11} r={9.5} fill="#FFFFFF" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22ZM7.85011 14.9509C7.60207 14.5687 7.09116 14.4599 6.70895 14.708C6.32675 14.956 6.21798 15.4669 6.46601 15.8491C7.16549 16.927 8.58271 18.425 11.0002 18.425C13.4176 18.425 14.8349 16.927 15.5343 15.8491C15.7824 15.4669 15.6736 14.956 15.2914 14.708C14.9092 14.4599 14.3983 14.5687 14.1502 14.9509C13.604 15.7926 12.6288 16.775 11.0002 16.775C9.3716 16.775 8.39635 15.7926 7.85011 14.9509ZM8.8 8.25C8.8 9.16127 8.06127 9.9 7.15 9.9C6.23873 9.9 5.5 9.16127 5.5 8.25C5.5 7.33873 6.23873 6.6 7.15 6.6C8.06127 6.6 8.8 7.33873 8.8 8.25ZM17.0834 7.66664C15.8499 6.43319 13.8501 6.43319 12.6166 7.66664C12.2945 7.98882 12.2945 8.51118 12.6166 8.83336C12.9388 9.15555 13.4612 9.15555 13.7834 8.83336C14.3724 8.24428 15.3275 8.24428 15.9166 8.83336C16.2388 9.15555 16.7612 9.15555 17.0834 8.83336C17.4055 8.51118 17.4055 7.98882 17.0834 7.66664Z"
        fill="#FFBC40"
      />
    </Svg>
  );
}

function IconNeutral({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={9.5} fill="#FFFFFF" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22ZM7.7 14.575C7.24437 14.575 6.875 14.9444 6.875 15.4C6.875 15.8556 7.24437 16.225 7.7 16.225H14.3C14.7556 16.225 15.125 15.8556 15.125 15.4C15.125 14.9444 14.7556 14.575 14.3 14.575H7.7ZM8.8 8.25C8.8 9.16127 8.06127 9.9 7.15 9.9C6.23873 9.9 5.5 9.16127 5.5 8.25C5.5 7.33873 6.23873 6.6 7.15 6.6C8.06127 6.6 8.8 7.33873 8.8 8.25ZM14.85 9.9C15.7613 9.9 16.5 9.16127 16.5 8.25C16.5 7.33873 15.7613 6.6 14.85 6.6C13.9387 6.6 13.2 7.33873 13.2 8.25C13.2 9.16127 13.9387 9.9 14.85 9.9Z"
        fill="#FFBC40"
      />
    </Svg>
  );
}

function IconSlightSmile({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={9.5} fill="#FFFFFF" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22ZM6.23105 17.2379C6.63624 17.4405 7.12844 17.2784 7.33436 16.876L7.33604 16.8729C7.33948 16.8666 7.34703 16.8532 7.35891 16.8336C7.38272 16.7944 7.42363 16.731 7.48344 16.6513C7.60332 16.4914 7.79676 16.2691 8.07787 16.0442C8.62964 15.6028 9.55041 15.125 11 15.125C12.4496 15.125 13.3704 15.6028 13.9221 16.0442C14.2032 16.2691 14.3967 16.4914 14.5166 16.6513C14.5764 16.731 14.6173 16.7944 14.6411 16.8336C14.653 16.8532 14.6605 16.8666 14.664 16.8729L14.6656 16.876C14.8716 17.2784 15.3638 17.4405 15.769 17.2379C16.1765 17.0341 16.3417 16.5386 16.1379 16.1311L15.4 16.5C16.1379 16.1311 16.1381 16.1315 16.1379 16.1311L16.137 16.1292L16.136 16.1272L16.1336 16.1225L16.1274 16.1107C16.1228 16.1017 16.1169 16.0907 16.1097 16.0777C16.0954 16.0517 16.0761 16.0179 16.0515 15.9773C16.0023 15.8962 15.9314 15.7878 15.8366 15.6613C15.6471 15.4086 15.3593 15.0809 14.9529 14.7558C14.1296 14.0972 12.8504 13.475 11 13.475C9.14959 13.475 7.87036 14.0972 7.04713 14.7558C6.64074 15.0809 6.35293 15.4086 6.16344 15.6613C6.06856 15.7878 5.99775 15.8962 5.94851 15.9773C5.92387 16.0179 5.90456 16.0517 5.89028 16.0777C5.88314 16.0907 5.87724 16.1017 5.87256 16.1107L5.86644 16.1225L5.86405 16.1272L5.86302 16.1292C5.86279 16.1297 5.8621 16.1311 6.6 16.5L5.8621 16.1311C5.65833 16.5386 5.82352 17.0341 6.23105 17.2379ZM8.8 8.25C8.8 9.16127 8.06127 9.9 7.15 9.9C6.23873 9.9 5.5 9.16127 5.5 8.25C5.5 7.33873 6.23873 6.6 7.15 6.6C8.06127 6.6 8.8 7.33873 8.8 8.25ZM14.85 9.9C15.7613 9.9 16.5 9.16127 16.5 8.25C16.5 7.33873 15.7613 6.6 14.85 6.6C13.9387 6.6 13.2 7.33873 13.2 8.25C13.2 9.16127 13.9387 9.9 14.85 9.9Z"
        fill="#FFBC40"
      />
    </Svg>
  );
}

function IconBigSmile({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={9.5} fill="#FFFFFF" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22ZM6.23105 14.6621C6.63624 14.4595 7.12844 14.6216 7.33436 15.024L7.33604 15.0271C7.33948 15.0334 7.34703 15.0468 7.35891 15.0664C7.38272 15.1056 7.42363 15.169 7.48344 15.2488C7.60332 15.4086 7.79676 15.6309 8.07787 15.8558C8.62964 16.2972 9.55041 16.775 11 16.775C12.4496 16.775 13.3704 16.2972 13.9221 15.8558C14.2032 15.6309 14.3967 15.4086 14.5166 15.2488C14.5764 15.169 14.6173 15.1056 14.6411 15.0664C14.653 15.0468 14.6605 15.0334 14.664 15.0271L14.6656 15.024C14.8716 14.6216 15.3638 14.4595 15.769 14.6621C16.1765 14.8659 16.3417 15.3614 16.1379 15.769L16.137 15.7708L16.136 15.7728L16.1336 15.7775L16.1274 15.7893C16.1228 15.7983 16.1169 15.8093 16.1097 15.8223C16.0954 15.8483 16.0761 15.8821 16.0515 15.9227C16.0023 16.0038 15.9314 16.1122 15.8366 16.2388C15.6471 16.4914 15.3593 16.8191 14.9529 17.1442C14.1296 17.8028 12.8504 18.425 11 18.425C9.14959 18.425 7.87036 17.8028 7.04713 17.1442C6.64074 16.8191 6.35293 16.4914 6.16344 16.2388C6.06856 16.1122 5.99775 16.0038 5.94851 15.9227C5.92387 15.8821 5.90456 15.8483 5.89028 15.8223C5.88314 15.8093 5.87724 15.7983 5.87256 15.7893L5.86644 15.7775L5.86405 15.7728L5.86302 15.7708C5.86302 15.7708 5.89028 15.8223 5.8621 15.769C5.65833 15.3614 5.82352 14.8659 6.23105 14.6621ZM8.8 8.25C8.8 9.16127 8.06127 9.9 7.15 9.9C6.23873 9.9 5.5 9.16127 5.5 8.25C5.5 7.33873 6.23873 6.6 7.15 6.6C8.06127 6.6 8.8 7.33873 8.8 8.25ZM14.85 9.9C15.7613 9.9 16.5 9.16127 16.5 8.25C16.5 7.33873 15.7613 6.6 14.85 6.6C13.9387 6.6 13.2 7.33873 13.2 8.25C13.2 9.16127 13.9387 9.9 14.85 9.9Z"
        fill="#FFBC40"
      />
    </Svg>
  );
}

function IconStar({ size = 21 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      {/* Fond blanc : transparaît à travers les yeux/bouche (trous du path doré) */}
      <Circle cx={10.5} cy={11} r={8.5} fill="#FFFFFF" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 0C12.2046 0 13.8129 0.409088 15.2363 1.12998C15.2294 1.18989 15.225 1.25073 15.225 1.3125V1.8375H14.7C13.8302 1.8375 13.125 2.54265 13.125 3.4125C13.125 4.28235 13.8302 4.9875 14.7 4.9875H15.225V5.5125C15.225 6.38235 15.9302 7.0875 16.8 7.0875C17.6698 7.0875 18.375 6.38235 18.375 5.5125V4.9875H18.9C19.0698 4.9875 19.2328 4.95928 19.386 4.90957C20.4068 6.52868 21 8.44455 21 10.5C21 16.299 16.299 21 10.5 21C4.70101 21 0 16.299 0 10.5C0 4.70101 4.70101 0 10.5 0ZM7.02803 13.65C6.66989 13.6502 6.43061 13.9965 6.60146 14.3114C7.10285 15.2352 8.27983 16.8 10.5 16.8C12.7202 16.8 13.8971 15.2352 14.3985 14.3114C14.5694 13.9965 14.3301 13.6502 13.972 13.65H7.02803ZM6.825 6.3C5.95515 6.3 5.25 7.00515 5.25 7.875C5.25 8.74485 5.95515 9.45 6.825 9.45C7.69485 9.45 8.4 8.74485 8.4 7.875C8.4 7.00515 7.69485 6.3 6.825 6.3ZM14.175 6.3C13.3052 6.3 12.6 7.00515 12.6 7.875C12.6 8.74485 13.3052 9.45 14.175 9.45C15.0448 9.45 15.75 8.74485 15.75 7.875C15.75 7.00515 15.0448 6.3 14.175 6.3Z"
        fill="#FFBC40"
      />
      <Path
        d="M16.8 0.525C17.2349 0.525 17.5875 0.877576 17.5875 1.3125V2.625H18.9C19.3349 2.625 19.6875 2.97758 19.6875 3.4125C19.6875 3.84742 19.3349 4.2 18.9 4.2H17.5875V5.5125C17.5875 5.94742 17.2349 6.3 16.8 6.3C16.3651 6.3 16.0125 5.94742 16.0125 5.5125V4.2H14.7C14.2651 4.2 13.9125 3.84742 13.9125 3.4125C13.9125 2.97758 14.2651 2.625 14.7 2.625H16.0125V1.3125C16.0125 0.877576 16.3651 0.525 16.8 0.525Z"
        fill="#FFBC40"
      />
    </Svg>
  );
}

// ===== CONTENEUR CARRÉ À BORDURE GRADIENT (exporté pour les dés) =====

const STROKE = 1.5;

export function GradientSquareBorder({
  children,
  gradId,
  size,
  borderRadius = 14,
}: {
  children: React.ReactNode;
  gradId: string;
  size: number;
  borderRadius?: number;
}) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
            <Stop offset="0%"   stopColor="#9A9A9A" stopOpacity="0.3" />
            <Stop offset="25%"  stopColor="#707070" stopOpacity="0.2" />
            <Stop offset="50%"  stopColor="#B0B0B0" stopOpacity="0.35" />
            <Stop offset="75%"  stopColor="#606060" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Rect
          x={STROKE / 2}
          y={STROKE / 2}
          width={size - STROKE}
          height={size - STROKE}
          rx={borderRadius}
          ry={borderRadius}
          stroke={`url(#${gradId})`}
          strokeWidth={STROKE}
          fill="transparent"
        />
      </Svg>
      {children}
    </View>
  );
}

// ===== CONTENEUR CIRCULAIRE À BORDURE GRADIENT =====

const BORDER_SIZE = 52;
const ICON_SIZE = 44;
const R = BORDER_SIZE / 2 - STROKE / 2; // rayon du cercle de bordure

function GradientCircleBorder({ children, gradId }: { children: React.ReactNode; gradId: string }) {
  return (
    <View style={{ width: BORDER_SIZE, height: BORDER_SIZE, justifyContent: 'center', alignItems: 'center' }}>
      {/* Bordure gradient via SVG */}
      <Svg
        width={BORDER_SIZE}
        height={BORDER_SIZE}
        style={{ position: 'absolute' }}
      >
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2={BORDER_SIZE} y2={BORDER_SIZE} gradientUnits="userSpaceOnUse">
            <Stop offset="0%"   stopColor="#9A9A9A" stopOpacity="0.3" />
            <Stop offset="25%"  stopColor="#707070" stopOpacity="0.2" />
            <Stop offset="50%"  stopColor="#B0B0B0" stopOpacity="0.35" />
            <Stop offset="75%"  stopColor="#606060" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={BORDER_SIZE / 2}
          cy={BORDER_SIZE / 2}
          r={R}
          stroke={`url(#${gradId})`}
          strokeWidth={STROKE}
          fill="transparent"
        />
      </Svg>
      {/* Icône centrée */}
      <View style={{ width: ICON_SIZE, height: ICON_SIZE, justifyContent: 'center', alignItems: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ===== COMPOSANT ICÔNE EXPORTÉ (pour l'overlay) =====

const ICON_RENDERERS: Record<string, (size: number) => React.ReactNode> = {
  sad:     (s) => <IconSad size={s} />,
  slight:  (s) => <IconSlightSmile size={s} />,
  neutral: (s) => <IconNeutral size={s} />,
  big:     (s) => <IconBigSmile size={s} />,
  star:    (s) => <IconStar size={s} />,
};

export function EmojiIcon({ id, size = 22 }: { id: GameEmoji | string; size?: number }) {
  const render = ICON_RENDERERS[id as string];
  if (!render) return null;
  return <>{render(size)}</>;
}

// ===== DONNÉES ICÔNES =====

const EMOJI_ICONS = [
  { id: 'sad' as const,    render: () => <IconSad size={22} /> },
  { id: 'slight' as const, render: () => <IconSlightSmile size={22} /> },
  { id: 'neutral' as const,render: () => <IconNeutral size={22} /> },
  { id: 'big' as const,    render: () => <IconBigSmile size={22} /> },
  { id: 'star' as const,   render: () => <IconStar size={21} /> },
] as const;

export type GameEmoji = typeof EMOJI_ICONS[number]['id'];
export const GAME_EMOJIS = EMOJI_ICONS.map((e) => e.id) as unknown as readonly GameEmoji[];

// ===== PROPS =====

interface EmojiReactionBarProps {
  onEmojiPress: (emoji: GameEmoji) => void;
  disabled?: boolean;
  visible?: boolean;
}

// ===== COMPOSANT PRINCIPAL =====

export const EmojiReactionBar = memo(function EmojiReactionBar({
  onEmojiPress,
  disabled = false,
  visible = true,
}: EmojiReactionBarProps) {
  const handlePress = useCallback(
    (emoji: GameEmoji) => {
      if (disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onEmojiPress(emoji);
    },
    [onEmojiPress, disabled]
  );

  if (!visible) return null;

  return (
    <>
      {EMOJI_ICONS.map((item) => (
        <EmojiButton
          key={item.id}
          emojiId={item.id}
          renderIcon={item.render}
          onPress={handlePress}
          disabled={disabled}
        />
      ))}
    </>
  );
});

// ===== BOUTON EMOJI INDIVIDUEL =====

interface EmojiButtonProps {
  emojiId: GameEmoji;
  renderIcon: () => React.ReactNode;
  onPress: (emoji: GameEmoji) => void;
  disabled?: boolean;
}

const EmojiButton = memo(function EmojiButton({ emojiId, renderIcon, onPress, disabled }: EmojiButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    scale.value = withSequence(withSpring(0.75), withSpring(1.1), withSpring(1));
    onPress(emojiId);
  }, [emojiId, onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} disabled={disabled} style={styles.pressable}>
      <Animated.View style={animatedStyle}>
        <GradientCircleBorder gradId={`grad_${emojiId}`}>
          {renderIcon()}
        </GradientCircleBorder>
      </Animated.View>
    </Pressable>
  );
});

// ===== STYLES =====

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
  },
});
