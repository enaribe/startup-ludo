/**
 * Carte programme Challenge pour l'écran home / découverte
 * 2 états : inscrit (progression + Continuer) / non-inscrit (description + Rejoindre)
 */

import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import { getChallengeProgress } from '@/types/challenge';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';

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
  const isEnrolled = Boolean(enrollment);
  const progress = enrollment
    ? getChallengeProgress(enrollment.totalXp, challenge.totalXpRequired)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(600).duration(500)}>
      <Pressable
        onPress={isEnrolled ? onContinue : onEnroll}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <DynamicGradientBorder
          borderRadius={16}
          fill="rgba(0, 0, 0, 0.35)"
          style={styles.border}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={[styles.logoPlaceholder, { backgroundColor: challenge.primaryColor }]}>
                <Ionicons name="trophy-outline" size={28} color="#1E325A" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name}>{challenge.name}</Text>
                <Text style={styles.org}>{challenge.organization}</Text>
              </View>
            </View>
            {isEnrolled ? (
              <>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Progression</Text>
                  <Text style={styles.progressValue}>{progress}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.levelText}>
                  Niveau {enrollment!.currentLevel} • Sous-niveau {enrollment!.currentSubLevel}
                </Text>
                <GameButton
                  variant="yellow"
                  title="CONTINUER"
                  onPress={() => onContinue?.()}
                  fullWidth
                />
              </>
            ) : (
              <>
                <Text style={styles.desc} numberOfLines={3}>
                  {challenge.description}
                </Text>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{challenge.totalLevels} niveaux</Text>
                  <Text style={styles.metaText}>•</Text>
                  <Text style={styles.metaText}>{challenge.totalXpRequired.toLocaleString('fr-FR')} XP</Text>
                </View>
                <GameButton
                  variant="green"
                  title="REJOINDRE"
                  onPress={() => onEnroll?.()}
                  fullWidth
                />
              </>
            )}
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  border: { marginTop: SPACING[2] },
  content: { padding: SPACING[4] },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[3],
  },
  headerText: { flex: 1 },
  name: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  org: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  desc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING[3],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  metaText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[1],
  },
  progressLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING[3],
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  levelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING[4],
  },
});
