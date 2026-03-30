/**
 * ChallengeHomeCard - Carte Challenge pour l'ecran d'accueil
 * Structure unifiee avec bouton adaptatif selon l'etat d'inscription
 */

import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
        <DynamicGradientBorder borderRadius={24} fill="rgba(10, 25, 41, 0.6)">
          {/* Banner image at top */}
          {challenge.bannerUrl ? (
            <Image
              source={{ uri: challenge.bannerUrl }}
              style={styles.banner}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bannerFallback}>
              <Ionicons name="leaf" size={32} color="#4CAF50" />
              <Text style={styles.bannerFallbackText}>{challenge.name}</Text>
            </View>
          )}

          <View style={styles.container}>
            {/* Organization */}
            <Text style={styles.organizationName}>{challenge.organization}</Text>

            {/* Level & XP Info */}
            <View style={styles.levelXpRow}>
              <Text style={styles.levelText}>
                Niveau {enrollment?.currentLevel || 1} - {currentLevel?.name || 'Découverte'}
              </Text>
              <Text style={styles.xpText}>{enrollment?.totalXp || 0} XP</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
            </View>

            {/* Action Link/Button at bottom center */}
            <View style={styles.actionContainer}>
              <Ionicons name="trophy-outline" size={14} color="#FFBC40" />
              <Text style={styles.actionText}>
                {isEnrolled ? "Continuer" : "Rejoindre"}
              </Text>
            </View>
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    aspectRatio: 355 / 112,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bannerFallback: {
    width: '100%',
    aspectRatio: 355 / 112,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING[2],
  },
  bannerFallbackText: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  container: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    gap: SPACING[2],
  },
  organizationName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  levelXpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: '#FFBC40',
  },
  xpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFBC40',
    borderRadius: 3,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: SPACING[1],
  },
  actionText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#FFBC40',
  },
});
