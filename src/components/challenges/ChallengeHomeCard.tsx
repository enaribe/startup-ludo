/**
 * ChallengeHomeCard - Carte Challenge pour l'ecran d'accueil
 * Structure unifiee avec bouton adaptatif selon l'etat d'inscription
 */

import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';
import { getLevelProgress } from '@/types/challenge';

interface ChallengeHomeCardProps {
  challenge: Challenge;
  enrollment?: ChallengeEnrollment | null;
  onEnroll?: () => void;
  onContinue?: () => void;
}

export const ChallengeHomeCard = memo(function ChallengeHomeCard({
  challenge,
  enrollment,
  onEnroll,
  onContinue,
}: ChallengeHomeCardProps) {
  const isEnrolled = !!enrollment;

  // Calculs de progression (si inscrit)
  const currentLevel = useMemo(
    () => (enrollment ? challenge.levels.find((l) => l.number === enrollment.currentLevel) : null),
    [enrollment, challenge.levels]
  );

  const levelProgressPercent = useMemo(() => {
    if (!enrollment || !currentLevel) return 0;
    const levelXp = enrollment.xpByLevel[enrollment.currentLevel] ?? 0;
    return getLevelProgress(levelXp, currentLevel.xpRequired);
  }, [enrollment, currentLevel]);

  const handlePress = () => {
    if (isEnrolled) {
      onContinue?.();
    } else {
      onEnroll?.();
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(600).duration(500)}>
      <Pressable onPress={handlePress}>
        <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
          <View style={styles.container}>
            {/* Header - Toujours visible */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: challenge.primaryColor + '20' }]}>
                <Ionicons name="trophy-outline" size={32} color={challenge.primaryColor} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.challengeName}>{challenge.name}</Text>
                <Text style={styles.organizationName}>{challenge.organization}</Text>
              </View>
            </View>

            {/* Description - Toujours visible */}
            <Text style={styles.description} numberOfLines={2}>
              {challenge.description}
            </Text>

            {/* Progression (si inscrit) ou Stats (si non inscrit) */}
            {isEnrolled && enrollment ? (
              <View style={styles.progressContainer}>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelText}>
                    Niveau {enrollment.currentLevel} - {currentLevel?.name}
                  </Text>
                  <Text style={styles.xpText}>{enrollment.totalXp.toLocaleString()} XP</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
                </View>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{challenge.totalLevels}</Text>
                  <Text style={styles.statLabel}>Niveaux</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{challenge.totalXpRequired.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>XP a gagner</Text>
                </View>
              </View>
            )}

            {/* Bouton unique - texte et couleur adaptatifs */}
            <GameButton
              title={isEnrolled ? "CONTINUER" : "REJOINDRE"}
              variant={isEnrolled ? "green" : "yellow"}
              fullWidth
              onPress={handlePress}
            />
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: SPACING[4],
    gap: SPACING[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING[3],
    justifyContent: 'center',
  },
  challengeName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  organizationName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  // Stats (non inscrit)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Progression (inscrit)
  progressContainer: {
    gap: SPACING[2],
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  xpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
});
