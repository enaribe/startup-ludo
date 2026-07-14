/**
 * DiceChoiceButton / JokerButton — bouton d'accès à l'inventaire de jokers.
 * Affiche un badge avec le nombre de jokers disponibles. Au clic → ouverture
 * de l'inventaire via le callback onOpen.
 *
 * Exporte aussi DiceValuePickerPopup utilisé par le joker dice_choice.
 */

import { memo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { GamePopup } from '@/components/ui/GamePopup';
import { GameButton } from '@/components/ui/GameButton';
import { GradientSquareBorder } from '@/components/game/EmojiReactionBar';
import { useTranslation } from '@/i18n';

import { COLORS } from '@/styles/colors';
import { FONTS } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

// ── Icône Joker ───────────────────────────────────────────────────────────────

function JokerIconWhite({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 20 / 25} viewBox="0 0 25 20" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.63379 17.4216C6.00466 17.4354 6.46194 17.4226 6.84082 17.4226H16.8965L16.8984 18.783C16.8986 19.0405 16.9145 19.3681 16.8711 19.6189C16.8578 19.6959 16.7931 19.7767 16.7412 19.8347C16.5831 19.9747 16.4715 19.9898 16.2676 19.99H7.30176L6.54199 19.991C6.28281 19.9913 5.97677 20.0316 5.77832 19.8318C5.71372 19.7664 5.66922 19.6833 5.64941 19.5935C5.62118 19.4644 5.63085 19.0099 5.63086 18.8552L5.63379 17.4216ZM13.041 0.0144201C14.7921 -0.14552 16.475 1.04666 17.2979 2.5154C17.4499 2.78679 17.6674 3.10886 17.4268 3.40895C17.1468 3.75779 16.748 3.506 16.3975 3.47536C16.1318 3.44566 15.9475 3.44417 15.6768 3.47731C14.8527 3.57994 14.103 4.00548 13.5918 4.65993C12.7308 5.77292 12.9248 7.08554 13.8428 8.09157C13.9711 8.23219 14.0861 8.35825 14.2393 8.47633C14.3165 8.36501 14.4584 8.21843 14.5576 8.11989C15.5941 7.09047 17.0279 6.66458 18.4639 6.67262C19.7453 6.67981 20.8656 7.21525 21.7578 8.12282C22.5742 8.95342 23.1649 10.0398 23.5215 11.1433C23.5713 11.2974 23.6806 11.6533 23.6768 11.8035C23.6736 11.9447 23.6128 12.0782 23.5088 12.1736C23.3945 12.2768 23.2395 12.3218 23.0879 12.2957C22.9226 12.2656 22.5633 12.0648 22.3877 11.9851C21.2308 11.4601 19.2244 11.073 18.2168 12.0593C17.2393 13.0164 16.9194 15.0817 16.8965 16.4021C16.4378 16.4109 15.9593 16.4039 15.499 16.4041L5.62695 16.4021C5.63828 15.9673 5.58679 15.305 5.53906 14.8709C5.41377 13.7311 5.06474 11.6314 4.10645 10.8718C3.7731 10.6074 3.34674 10.4884 2.9248 10.5427C2.3772 10.6122 1.94346 11.0983 1.66797 11.5418C1.51738 11.7843 1.42269 12.1537 1.07227 12.1756C0.782857 12.1956 0.51156 11.9867 0.517578 11.6785C0.546107 10.2207 0.911247 8.58034 1.88867 7.45485C2.47657 6.77799 3.42304 6.3775 4.29688 6.32985C5.53887 6.26228 6.66702 6.88474 7.56152 7.69411C7.53882 5.69281 7.94536 3.56439 9.24902 1.98512C10.201 0.850635 11.5655 0.14172 13.041 0.0144201ZM0.700195 12.3543C0.961614 12.2706 1.2456 12.2931 1.49023 12.4177C1.73396 12.5428 1.91778 12.7604 2.00098 13.0213C2.08142 13.2809 2.05552 13.5621 1.92871 13.8025C1.79987 14.0434 1.57118 14.2348 1.30859 14.3123C1.04814 14.3884 0.767901 14.3573 0.530273 14.2263C0.324904 14.1116 0.162502 13.9388 0.0800781 13.7195C0.0675222 13.686 0.0124369 13.5381 0 13.5174V13.1355C0.0496132 13.0477 0.0635832 12.9548 0.105469 12.8709C0.227062 12.6274 0.43899 12.4371 0.700195 12.3543ZM23.1797 12.3718C23.4435 12.2727 23.7363 12.283 23.9922 12.4011C24.3556 12.5719 24.4538 12.8178 24.5771 13.1629V13.491C24.5481 13.5605 24.5258 13.6438 24.4951 13.7185C24.3894 13.9747 24.1841 14.1777 23.9268 14.281C23.4118 14.4896 22.8047 14.2213 22.6006 13.7078C22.4999 13.4505 22.5062 13.1638 22.6172 12.9109C22.7242 12.6628 22.9273 12.4683 23.1797 12.3718ZM18.3008 3.09352C18.8618 3.02218 19.3742 3.41938 19.4453 3.98024C19.5162 4.54147 19.118 5.05452 18.5566 5.12477C17.9964 5.19465 17.4848 4.79724 17.4141 4.23708C17.3434 3.67688 17.7406 3.16498 18.3008 3.09352Z"
        fill="white"
      />
    </Svg>
  );
}

export function JokerIconGold({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 20 / 25} viewBox="0 0 25 20" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.63379 17.4216C6.00466 17.4354 6.46194 17.4226 6.84082 17.4226H16.8965L16.8984 18.783C16.8986 19.0405 16.9145 19.3681 16.8711 19.6189C16.8578 19.6959 16.7931 19.7767 16.7412 19.8347C16.5831 19.9747 16.4715 19.9898 16.2676 19.99H7.30176L6.54199 19.991C6.28281 19.9913 5.97677 20.0316 5.77832 19.8318C5.71372 19.7664 5.66922 19.6833 5.64941 19.5935C5.62118 19.4644 5.63085 19.0099 5.63086 18.8552L5.63379 17.4216ZM13.041 0.0144201C14.7921 -0.14552 16.475 1.04666 17.2979 2.5154C17.4499 2.78679 17.6674 3.10886 17.4268 3.40895C17.1468 3.75779 16.748 3.506 16.3975 3.47536C16.1318 3.44566 15.9475 3.44417 15.6768 3.47731C14.8527 3.57994 14.103 4.00548 13.5918 4.65993C12.7308 5.77292 12.9248 7.08554 13.8428 8.09157C13.9711 8.23219 14.0861 8.35825 14.2393 8.47633C14.3165 8.36501 14.4584 8.21843 14.5576 8.11989C15.5941 7.09047 17.0279 6.66458 18.4639 6.67262C19.7453 6.67981 20.8656 7.21525 21.7578 8.12282C22.5742 8.95342 23.1649 10.0398 23.5215 11.1433C23.5713 11.2974 23.6806 11.6533 23.6768 11.8035C23.6736 11.9447 23.6128 12.0782 23.5088 12.1736C23.3945 12.2768 23.2395 12.3218 23.0879 12.2957C22.9226 12.2656 22.5633 12.0648 22.3877 11.9851C21.2308 11.4601 19.2244 11.073 18.2168 12.0593C17.2393 13.0164 16.9194 15.0817 16.8965 16.4021C16.4378 16.4109 15.9593 16.4039 15.499 16.4041L5.62695 16.4021C5.63828 15.9673 5.58679 15.305 5.53906 14.8709C5.41377 13.7311 5.06474 11.6314 4.10645 10.8718C3.7731 10.6074 3.34674 10.4884 2.9248 10.5427C2.3772 10.6122 1.94346 11.0983 1.66797 11.5418C1.51738 11.7843 1.42269 12.1537 1.07227 12.1756C0.782857 12.1956 0.51156 11.9867 0.517578 11.6785C0.546107 10.2207 0.911247 8.58034 1.88867 7.45485C2.47657 6.77799 3.42304 6.3775 4.29688 6.32985C5.53887 6.26228 6.66702 6.88474 7.56152 7.69411C7.53882 5.69281 7.94536 3.56439 9.24902 1.98512C10.201 0.850635 11.5655 0.14172 13.041 0.0144201ZM0.700195 12.3543C0.961614 12.2706 1.2456 12.2931 1.49023 12.4177C1.73396 12.5428 1.91778 12.7604 2.00098 13.0213C2.08142 13.2809 2.05552 13.5621 1.92871 13.8025C1.79987 14.0434 1.57118 14.2348 1.30859 14.3123C1.04814 14.3884 0.767901 14.3573 0.530273 14.2263C0.324904 14.1116 0.162502 13.9388 0.0800781 13.7195C0.0675222 13.686 0.0124369 13.5381 0 13.5174V13.1355C0.0496132 13.0477 0.0635832 12.9548 0.105469 12.8709C0.227062 12.6274 0.43899 12.4371 0.700195 12.3543ZM23.1797 12.3718C23.4435 12.2727 23.7363 12.283 23.9922 12.4011C24.3556 12.5719 24.4538 12.8178 24.5771 13.1629V13.491C24.5481 13.5605 24.5258 13.6438 24.4951 13.7185C24.3894 13.9747 24.1841 14.1777 23.9268 14.281C23.4118 14.4896 22.8047 14.2213 22.6006 13.7078C22.4999 13.4505 22.5062 13.1638 22.6172 12.9109C22.7242 12.6628 22.9273 12.4683 23.1797 12.3718ZM18.3008 3.09352C18.8618 3.02218 19.3742 3.41938 19.4453 3.98024C19.5162 4.54147 19.118 5.05452 18.5566 5.12477C17.9964 5.19465 17.4848 4.79724 17.4141 4.23708C17.3434 3.67688 17.7406 3.16498 18.3008 3.09352Z"
        fill="#FFBC40"
      />
    </Svg>
  );
}

// ── Dot positions per face ────────────────────────────────────────────────────

const DOT_COUNTS: Record<number, number[][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

interface DiceFaceProps {
  value: number;
  size: number;
  selected: boolean;
  onPress: () => void;
}

const DiceFace = memo(function DiceFace({ value, size, selected, onPress }: DiceFaceProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.85), withSpring(1.1), withSpring(1));
    onPress();
  };

  const dotSize = size * 0.14;
  const dots = DOT_COUNTS[value] ?? [];

  const br = size * 0.2;

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animStyle}>
        <GradientSquareBorder gradId={`dice_${value}_${selected}`} size={size} borderRadius={br}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: br,
              backgroundColor: selected ? '#FFBC40' : 'transparent',
              position: 'relative',
            }}
          >
            {dots.map(([x, y], i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    left: `${x}%` as unknown as number,
                    top: `${y}%` as unknown as number,
                    marginLeft: -dotSize / 2,
                    marginTop: -dotSize / 2,
                    backgroundColor: selected ? '#0A1929' : COLORS.white,
                  },
                ]}
              />
            ))}
          </View>
        </GradientSquareBorder>
      </Animated.View>
    </Pressable>
  );
});

// ─── Popup de sélection de valeur de dé (joker dice_choice) ──────────────────

interface DiceValuePickerPopupProps {
  visible: boolean;
  onPick: (value: number) => void;
  onCancel: () => void;
}

export const DiceValuePickerPopup = memo(function DiceValuePickerPopup({
  visible,
  onPick,
  onCancel,
}: DiceValuePickerPopupProps) {
  const { t } = useTranslation();
  const [pendingValue, setPendingValue] = useState<number | null>(null);

  useEffect(() => {
    if (visible) setPendingValue(null);
  }, [visible]);

  const handleSelect = (value: number) => {
    setPendingValue((prev) => (prev === value ? null : value));
  };

  const handleConfirm = () => {
    if (pendingValue != null) {
      onPick(pendingValue);
    } else {
      onCancel();
    }
  };

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onCancel}
      icon={<JokerIconGold size={80} />}
      spinningShape
      title={t('joker.dicePicker.title')}
      header={t('joker.dicePicker.header')}
      footer={
        <GameButton
          title={pendingValue != null ? t('joker.dicePicker.use') : t('joker.dicePicker.cancel')}
          variant={pendingValue != null ? 'yellow' : 'blue'}
          fullWidth
          onPress={handleConfirm}
        />
      }
    >
      <View style={styles.diceGrid}>
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <DiceFace
            key={v}
            value={v}
            size={56}
            selected={pendingValue === v}
            onPress={() => handleSelect(v)}
          />
        ))}
      </View>
    </GamePopup>
  );
});

// ─── Bouton Joker (ouvre l'inventaire) ───────────────────────────────────────

interface JokerButtonProps {
  /** Nombre de jokers disponibles */
  count: number;
  /** Désactivé si hors phase idle */
  canUse: boolean;
  /** Callback d'ouverture du popup inventaire */
  onOpen: () => void;
}

export const DiceChoiceButton = memo(function DiceChoiceButton({
  count,
  canUse,
  onOpen,
}: JokerButtonProps) {
  if (count <= 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
      <Pressable
        onPress={() => canUse && onOpen()}
        style={[styles.triggerBtn, !canUse && styles.triggerBtnDisabled]}
      >
        <JokerIconWhite size={26} />
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  // ── Bouton déclencheur ──
  triggerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  triggerBtnDisabled: {
    opacity: 0.4,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#0A1929',
    borderWidth: 1.5,
    borderColor: '#FFBC40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontFamily: FONTS.title,
    fontSize: 10,
    color: '#FFBC40',
  },

  // ── Grille de dés ──
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING[3],
    width: '100%',
    marginBottom: SPACING[4],
  },
  dot: {
    position: 'absolute',
  },
});

export default DiceChoiceButton;
