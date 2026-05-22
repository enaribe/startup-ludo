/**
 * AchievementDetailPopup — détail d'un succès au clic sur sa carte.
 *
 * Explique comment débloquer le succès et, quand c'est mesurable, affiche la
 * progression actuelle du joueur (ex. « 7 / 10 parties »).
 */
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { GamePopup } from '@/components/ui/GamePopup';
import { GameButton } from '@/components/ui/GameButton';
import { RARITY_COLORS, RARITY_LABELS, type Achievement } from '@/config/achievements';
import { describeAchievementProgress } from '@/services/game/achievementService';

interface AchievementDetailPopupProps {
  /** Succès sélectionné (null = popup masqué). */
  achievement: Achievement | null;
  /** Le succès est-il déjà débloqué ? */
  isUnlocked: boolean;
  /** Stats du joueur pour calculer la progression. */
  progress: ReturnType<typeof describeAchievementProgress> | null;
  onClose: () => void;
}

export function AchievementDetailPopup({
  achievement,
  isUnlocked,
  progress,
  onClose,
}: AchievementDetailPopupProps) {
  if (!achievement) return null;

  const isSecret = achievement.secret && !isUnlocked;
  const rarityColor = RARITY_COLORS[achievement.rarity];

  // Un succès secret non débloqué reste mystérieux
  const title = isSecret ? '???' : achievement.title;
  const iconName = isSecret ? 'help' : achievement.icon;

  return (
    <GamePopup
      visible
      onRequestClose={onClose}
      header={isUnlocked ? 'SUCCÈS DÉBLOQUÉ' : 'COMMENT DÉBLOQUER'}
      icon={
        <View style={[styles.iconBadge, { borderColor: isUnlocked ? rarityColor : 'rgba(255,255,255,0.2)' }]}>
          <Ionicons
            name={iconName}
            size={42}
            color={isUnlocked ? rarityColor : 'rgba(255,255,255,0.4)'}
          />
          {isUnlocked && (
            <View style={styles.checkCorner}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </View>
          )}
        </View>
      }
      title={title}
      footer={
        <GameButton title="FERMÉ" variant="yellow" fullWidth onPress={onClose} />
      }
    >
      <View style={styles.content}>
        {/* Rareté */}
        <View style={[styles.rarityChip, { backgroundColor: `${rarityColor}22`, borderColor: rarityColor }]}>
          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {RARITY_LABELS[achievement.rarity]}
          </Text>
        </View>

        {/* Explication : comment débloquer */}
        <View style={styles.howBlock}>
          <Text style={styles.howLabel}>OBJECTIF</Text>
          <Text style={styles.howText}>
            {isSecret
              ? 'Ce succès est secret — joue pour le découvrir !'
              : (progress?.howTo ?? achievement.description)}
          </Text>
        </View>

        {/* Barre de progression — seulement si mesurable et non débloqué */}
        {!isUnlocked && !isSecret && progress?.measurable && (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.percent}%`, backgroundColor: rarityColor },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.current} / {progress.target}
            </Text>
          </View>
        )}

        {/* Statut débloqué */}
        {isUnlocked && (
          <View style={styles.unlockedRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.unlockedText}>Succès obtenu</Text>
          </View>
        )}

        {/* Récompense XP */}
        <View style={styles.xpRow}>
          <Ionicons name="star" size={16} color={COLORS.success} />
          <Text style={styles.xpText}>Récompense : +{achievement.xpReward} XP</Text>
        </View>
      </View>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCorner: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#081A2A',
    borderRadius: 12,
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
  howBlock: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 14,
    padding: SPACING[3],
    gap: SPACING[1],
  },
  howLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
  howText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  progressBlock: {
    width: '100%',
    gap: SPACING[1],
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  unlockedText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
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
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
});
