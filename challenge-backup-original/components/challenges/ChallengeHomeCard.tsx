/**
 * ChallengeHomeCard - Carte Challenge pour l'écran d'accueil
 *
 * Affiche le Challenge à la une avec:
 * - Si non inscrit: infos + bouton "Rejoindre"
 * - Si inscrit: progression + bouton "Continuer"
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

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
  const router = useRouter();
  const isEnrolled = !!enrollment;

  // Obtenir le niveau actuel
  const currentLevel = useMemo(() => {
    if (!enrollment) return null;
    return challenge.levels.find((l) => l.number === enrollment.currentLevel);
  }, [enrollment, challenge.levels]);

  // Obtenir le secteur sélectionné
  const selectedSector = useMemo(() => {
    if (!enrollment?.selectedSectorId) return null;
    return challenge.sectors.find((s) => s.id === enrollment.selectedSectorId);
  }, [enrollment?.selectedSectorId, challenge.sectors]);

  // Calculer la progression du niveau actuel
  const levelProgressPercent = useMemo(() => {
    if (!enrollment || !currentLevel) return 0;
    const levelXp = enrollment.xpByLevel[enrollment.currentLevel] || 0;
    return getLevelProgress(levelXp, currentLevel.xpRequired);
  }, [enrollment, currentLevel]);

  const handlePress = () => {
    if (isEnrolled) {
      onContinue?.();
    } else {
      // Naviguer vers la page détail du Challenge
      router.push(`/(challenges)/${challenge.id}`);
    }
  };

  const handleButtonPress = () => {
    if (isEnrolled) {
      onContinue?.();
    } else {
      onEnroll?.();
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
        <View style={styles.container}>
          {/* Header avec logo et infos */}
          <View style={styles.header}>
            {/* Logo placeholder */}
            <View style={[styles.logoContainer, { backgroundColor: challenge.primaryColor + '20' }]}>
              <Ionicons
                name="school-outline"
                size={32}
                color={challenge.primaryColor}
              />
            </View>

            {/* Infos Challenge */}
            <View style={styles.headerInfo}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.badgeText}>PROGRAMME</Text>
                </View>
                {isEnrolled && (
                  <View style={[styles.badge, { backgroundColor: challenge.primaryColor }]}>
                    <Text style={styles.badgeText}>INSCRIT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.challengeName}>{challenge.name}</Text>
              <Text style={styles.organizationName}>{challenge.organization}</Text>
            </View>
          </View>

          {/* Contenu selon l'état d'inscription */}
          {isEnrolled && enrollment ? (
            // Vue inscrit: Progression
            <Animated.View entering={FadeIn.duration(300)} style={styles.progressSection}>
              {/* Niveau actuel */}
              <View style={styles.levelInfo}>
                <View style={styles.levelBadge}>
                  <Ionicons
                    name={(currentLevel?.iconName as keyof typeof Ionicons.glyphMap) || 'star-outline'}
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.levelText}>
                    Niveau {enrollment.currentLevel} - {currentLevel?.name}
                  </Text>
                </View>
                <Text style={styles.xpText}>{enrollment.totalXp.toLocaleString()} XP</Text>
              </View>

              {/* Barre de progression */}
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
              </View>

              {/* Secteur sélectionné (si applicable) */}
              {selectedSector && (
                <View style={styles.sectorRow}>
                  <Ionicons
                    name={(selectedSector.iconName as keyof typeof Ionicons.glyphMap) || 'leaf-outline'}
                    size={16}
                    color={selectedSector.color}
                  />
                  <Text style={styles.sectorText}>{selectedSector.name}</Text>
                </View>
              )}

              {/* Bouton Continuer — composant GameButton vert avec gradient */}
              <GameButton
                title="Continuer"
                variant="green"
                size="sm"
                fullWidth
                onPress={handleButtonPress}
              />
            </Animated.View>
          ) : (
            // Vue non inscrit: Description + Rejoindre
            <Animated.View entering={FadeIn.duration(300)} style={styles.descriptionSection}>
              <Text style={styles.description} numberOfLines={2}>
                {challenge.description}
              </Text>

              {/* Stats rapides */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{challenge.totalLevels}</Text>
                  <Text style={styles.statLabel}>Niveaux</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{challenge.sectors.length}</Text>
                  <Text style={styles.statLabel}>Secteurs</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Ionicons name="trophy-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.statLabel}>Certificat</Text>
                </View>
              </View>

              {/* Bouton Rejoindre */}
              <Pressable style={styles.primaryButton} onPress={handleButtonPress}>
                <Text style={styles.primaryButtonText}>REJOINDRE</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.background} />
              </Pressable>
            </Animated.View>
          )}
        </View>
      </DynamicGradientBorder>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: SPACING[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING[3],
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
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[1],
  },
  badge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  challengeName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  organizationName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Section progression (inscrit)
  progressSection: {
    gap: SPACING[3],
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.md,
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
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  sectorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Section description (non inscrit)
  descriptionSection: {
    gap: SPACING[3],
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
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
    gap: SPACING[1],
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
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Bouton primaire
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    borderRadius: BORDER_RADIUS.lg,
  },
  primaryButtonText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    letterSpacing: 1,
  },
});

export default ChallengeHomeCard;
