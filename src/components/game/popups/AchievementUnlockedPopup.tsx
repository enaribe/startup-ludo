/**
 * AchievementUnlockedPopup — popup de déblocage d'un succès.
 *
 * Reçoit une liste de succès nouvellement débloqués et les affiche un par un :
 * « Suivant » passe au succès suivant, le dernier ferme le popup.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GamePopup } from '@/components/ui/GamePopup';
import { GameButton } from '@/components/ui/GameButton';
import { RARITY_COLORS, RARITY_LABELS, type Achievement } from '@/config/achievements';
import { useTranslation } from '@/i18n';

interface AchievementUnlockedPopupProps {
  /** Succès à présenter (vide = popup masqué). */
  achievements: Achievement[];
  /** Appelé quand l'utilisateur a parcouru tous les succès. */
  onClose: () => void;
}

export function AchievementUnlockedPopup({
  achievements,
  onClose,
}: AchievementUnlockedPopupProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  // Réinitialise le curseur quand une nouvelle fournée arrive
  useEffect(() => {
    setIndex(0);
  }, [achievements]);

  if (achievements.length === 0) return null;

  const current = achievements[Math.min(index, achievements.length - 1)];
  if (!current) return null;

  const isLast = index >= achievements.length - 1;
  const rarityColor = RARITY_COLORS[current.rarity];

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <GamePopup
      visible
      onRequestClose={handleNext}
      header={
        achievements.length > 1
          ? t('achievementUnlocked.headerCounter', {
              current: index + 1,
              total: achievements.length,
            })
          : t('achievementUnlocked.header')
      }
      spinningShape
      icon={
        <View style={[styles.iconBadge, { borderColor: rarityColor }]}>
          <Ionicons
            name={current.icon}
            size={44}
            color={rarityColor}
          />
        </View>
      }
      title={current.title}
      footer={
        <GameButton
          title={isLast ? t('achievementUnlocked.done') : t('achievementUnlocked.next')}
          variant="yellow"
          fullWidth
          onPress={handleNext}
        />
      }
    >
      <View style={styles.content}>
        {/* Badge de rareté */}
        <View style={[styles.rarityChip, { backgroundColor: `${rarityColor}22`, borderColor: rarityColor }]}>
          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {RARITY_LABELS[current.rarity]}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{current.description}</Text>

        {/* Récompense XP */}
        <View style={styles.xpRow}>
          <Ionicons name="star" size={16} color={COLORS.success} />
          <Text style={styles.xpText}>+{current.xpReward} XP</Text>
        </View>
      </View>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  iconBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: SPACING[3],
  },
  rarityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarityText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    backgroundColor: 'rgba(76,175,80,0.15)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 10,
  },
  xpText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.success,
  },
});
