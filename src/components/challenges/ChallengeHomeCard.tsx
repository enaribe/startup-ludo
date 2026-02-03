/**
 * ChallengeHomeCard - Carte Challenge pour l'écran d'accueil
 * Non inscrit: infos + Rejoindre. Inscrit: progression + Continuer.
 */

import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';
import { getLevelProgress, getChallengeProgress } from '@/types/challenge';

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
  const currentLevel = useMemo(
    () => (enrollment ? challenge.levels.find((l) => l.number === enrollment.currentLevel) : null),
    [enrollment, challenge.levels]
  );
  const selectedSector = useMemo(
    () => (enrollment?.selectedSectorId ? challenge.sectors.find((s) => s.id === enrollment.selectedSectorId) : null),
    [enrollment?.selectedSectorId, challenge.sectors]
  );
  const levelProgressPercent = useMemo(() => {
    if (!enrollment || !currentLevel) return 0;
    const levelXp = enrollment.xpByLevel[enrollment.currentLevel] ?? 0;
    return getLevelProgress(levelXp, currentLevel.xpRequired);
  }, [enrollment, currentLevel]);
  const totalProgressPercent = useMemo(
    () => (enrollment ? getChallengeProgress(enrollment.totalXp, challenge.totalXpRequired) : 0),
    [enrollment, challenge.totalXpRequired]
  );

  return (
    <Animated.View entering={FadeInDown.delay(600).duration(500)}>
      <Pressable onPress={isEnrolled ? onContinue : onEnroll}>
        <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={[styles.logoContainer, { backgroundColor: challenge.primaryColor + '20' }]}>
                <Ionicons name="trophy-outline" size={32} color={challenge.primaryColor} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.challengeName}>{challenge.name}</Text>
                <Text style={styles.organizationName}>{challenge.organization}</Text>
                {isEnrolled && (
                  <View style={[styles.badge, { backgroundColor: challenge.primaryColor }]}>
                    <Text style={styles.badgeText}>INSCRIT</Text>
                  </View>
                )}
              </View>
            </View>

            {isEnrolled && enrollment ? (
              <Animated.View entering={FadeIn.duration(300)} style={styles.progressSection}>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelText}>
                    Niveau {enrollment.currentLevel} - {currentLevel?.name}
                  </Text>
                  <Text style={styles.xpText}>{enrollment.totalXp.toLocaleString()} XP</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
                </View>
                {selectedSector && (
                  <View style={styles.sectorRow}>
                    <Ionicons name={selectedSector.iconName as keyof typeof Ionicons.glyphMap} size={16} color={selectedSector.color} />
                    <Text style={styles.sectorText}>{selectedSector.name}</Text>
                  </View>
                )}
                <GameButton title="CONTINUER" variant="green" size="sm" fullWidth onPress={() => onContinue?.()} />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(300)} style={styles.descriptionSection}>
                <Text style={styles.description} numberOfLines={2}>{challenge.description}</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statValue}>{challenge.totalLevels}</Text>
                  <Text style={styles.statLabel}>Niveaux</Text>
                  <View style={styles.statDivider} />
                  <Text style={styles.statValue}>{challenge.totalXpRequired.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>XP</Text>
                </View>
                <GameButton title="REJOINDRE" variant="yellow" fullWidth onPress={() => onEnroll?.()} />
              </Animated.View>
            )}
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { padding: SPACING[4] },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING[3] },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, marginLeft: SPACING[3] },
  badge: { alignSelf: 'flex-start', paddingHorizontal: SPACING[2], paddingVertical: 2, borderRadius: BORDER_RADIUS.sm, marginTop: 4 },
  badgeText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.xs, color: COLORS.white, letterSpacing: 0.5 },
  challengeName: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: COLORS.text },
  organizationName: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  progressSection: { gap: SPACING[3] },
  levelInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.sm, color: COLORS.primary },
  xpText: { fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.sm, color: COLORS.primary },
  progressBarContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  sectorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING[2] },
  sectorText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  descriptionSection: { gap: SPACING[3] },
  description: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING[3] },
  statValue: { fontFamily: FONTS.title, fontSize: FONT_SIZES.lg, color: COLORS.primary },
  statLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
});
