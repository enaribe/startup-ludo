/**
 * DiceChoiceButton — Bouton pour choisir la valeur du dé (usage unique par partie)
 *
 * Affiche un bouton dé magique à côté de l'EmojiReactionBar.
 * Au tap, ouvre un picker animé comme le QuizPopup (SlideInUp).
 * Une fois utilisé, disparaît définitivement.
 */

import { memo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Modal } from '@/components/ui/Modal';
import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { GameButton } from '@/components/ui/GameButton';
import { PopupDiceMagicIcon } from '@/components/game/popups/PopupIcons';

import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HORIZONTAL_MARGIN = SPACING[5] * 2; // marginHorizontal SPACING[5] de chaque côté
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN;

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

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          animStyle,
          styles.diceFace,
          { width: size, height: size, borderRadius: size * 0.2 },
          selected && styles.diceFaceSelected,
        ]}
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
                backgroundColor: selected ? COLORS.background : COLORS.white,
              },
            ]}
          />
        ))}
      </Animated.View>
    </Pressable>
  );
});

// ── Composant principal ───────────────────────────────────────────────────────

interface DiceChoiceButtonProps {
  available: boolean;
  chosenValue: number | null;
  canUse: boolean;
  onChoose: (value: number) => void;
}

export const DiceChoiceButton = memo(function DiceChoiceButton({
  available,
  chosenValue,
  canUse,
  onChoose,
}: DiceChoiceButtonProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  if (!available) return null;

  const handleSelect = (value: number) => {
    onChoose(value);
    setPickerVisible(false);
  };

  return (
    <>
      {/* Bouton déclencheur */}
      <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
        <Pressable
          onPress={() => canUse && setPickerVisible(true)}
          style={[styles.triggerBtn, !canUse && styles.triggerBtnDisabled]}
        >
          <PopupDiceMagicIcon size={28} />
          {chosenValue && (
            <View style={styles.chosenBadge}>
              <Text style={styles.chosenBadgeText}>{chosenValue}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Picker — même animation que QuizPopup */}
      <Modal visible={pickerVisible} onClose={() => setPickerVisible(false)} closeOnBackdrop showCloseButton={false} bareContent>
        <Animated.View entering={SlideInUp.duration(280)} style={styles.cardWrapper}>
          <DynamicGradientBorder boxWidth={CARD_WIDTH} borderRadius={BORDER_RADIUS['2xl']} fill={COLORS.background}>
            <View style={styles.cardInner}>
              {/* Icône + en-tête */}
              <View style={styles.iconWrap}>
                <View style={styles.iconCircle}>
                  <PopupDiceMagicIcon size={52} />
                </View>
              </View>

              <Text style={styles.title}>DÉ MAGIQUE</Text>
              <Text style={styles.subtitle}>Usage unique · La valeur s'applique à ton prochain lancer</Text>

              {/* Grille 2×3 */}
              <View style={styles.diceGrid}>
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <DiceFace
                    key={v}
                    value={v}
                    size={68}
                    selected={chosenValue === v}
                    onPress={() => handleSelect(v)}
                  />
                ))}
              </View>

              {/* Note */}
              <View style={styles.noteRow}>
                <Text style={styles.noteText}>
                  Tu n'as droit qu'à une seule utilisation par partie
                </Text>
              </View>

              {/* Bouton Annuler */}
              <GameButton
                title="Annuler"
                variant="blue"
                fullWidth
                onPress={() => setPickerVisible(false)}
              />
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  // ── Bouton déclencheur ──
  triggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerBtnDisabled: {
    opacity: 0.4,
  },
  chosenBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chosenBadgeText: {
    fontFamily: FONTS.title,
    fontSize: 10,
    color: COLORS.primary,
  },

  // ── Picker card (style QuizPopup) ──
  cardWrapper: {
    marginHorizontal: SPACING[5],
    width: CARD_WIDTH,
  },
  cardInner: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[6],
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: SPACING[3],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,188,64,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,188,64,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    letterSpacing: 1.5,
    marginBottom: SPACING[1],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING[5],
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING[3],
    marginBottom: SPACING[4],
    width: '100%',
  },
  diceFace: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    position: 'relative',
  },
  diceFaceSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dot: {
    position: 'absolute',
  },
  noteRow: {
    backgroundColor: 'rgba(255,188,64,0.08)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    marginBottom: SPACING[4],
    width: '100%',
  },
  noteText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    textAlign: 'center',
  },
});

export default DiceChoiceButton;
