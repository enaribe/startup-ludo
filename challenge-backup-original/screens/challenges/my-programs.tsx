/**
 * MyProgramsScreen - Liste des programmes de l'utilisateur
 *
 * Affiche:
 * - Programme actif en grand
 * - Autres programmes en liste
 * - Lien pour découvrir d'autres programmes
 */

import { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialBackground, GradientBorder, DynamicGradientBorder } from '@/components/ui';
import { useChallengeStore, useAuthStore } from '@/stores';
import { getChallengeProgress, getLevelProgress } from '@/types/challenge';
import type { Challenge, ChallengeEnrollment } from '@/types/challenge';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';

// Composant EnrollmentCard
const EnrollmentCard = memo(function EnrollmentCard({
  enrollment,
  challenge,
  isActive,
  onPress,
  onSetActive,
}: {
  enrollment: ChallengeEnrollment;
  challenge: Challenge;
  isActive: boolean;
  onPress: () => void;
  onSetActive: () => void;
}) {
  const currentLevel = challenge.levels.find((l) => l.number === enrollment.currentLevel);
  const selectedSector = enrollment.selectedSectorId
    ? challenge.sectors.find((s) => s.id === enrollment.selectedSectorId)
    : null;
  const progressPercent = getChallengeProgress(enrollment.totalXp, challenge.totalXpRequired);
  const levelProgressPercent = currentLevel
    ? getLevelProgress(enrollment.xpByLevel[enrollment.currentLevel] || 0, currentLevel.xpRequired)
    : 0;

  if (isActive) {
    // Carte active (plus grande)
    return (
      <Animated.View entering={FadeIn.duration(400)}>
        <Pressable onPress={onPress}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.activeCard}>
              {/* Header */}
              <View style={styles.activeCardHeader}>
                <View style={[styles.activeLogo, { backgroundColor: challenge.primaryColor + '20' }]}>
                  <Ionicons name="school" size={32} color={challenge.primaryColor} />
                </View>
                <View style={styles.activeCardInfo}>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>ACTIF</Text>
                  </View>
                  <Text style={styles.activeChallengeName}>{challenge.name}</Text>
                  <Text style={styles.activeOrgName}>{challenge.organization}</Text>
                </View>
              </View>

              {/* Progression */}
              <View style={styles.activeProgressSection}>
                <View style={styles.levelRow}>
                  <View style={styles.levelBadge}>
                    <Ionicons
                      name={(currentLevel?.iconName as keyof typeof Ionicons.glyphMap) || 'star'}
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.levelText}>
                      Niveau {enrollment.currentLevel} - {currentLevel?.name}
                    </Text>
                  </View>
                  <Text style={styles.xpText}>{enrollment.totalXp.toLocaleString()} XP</Text>
                </View>

                <View style={styles.progressBarLarge}>
                  <View style={[styles.progressBarFill, { width: `${levelProgressPercent}%` }]} />
                </View>

                {selectedSector && (
                  <View style={styles.sectorRow}>
                    <Ionicons
                      name={(selectedSector.iconName as keyof typeof Ionicons.glyphMap) || 'leaf'}
                      size={16}
                      color={selectedSector.color}
                    />
                    <Text style={styles.sectorText}>{selectedSector.name}</Text>
                  </View>
                )}
              </View>

              {/* Bouton */}
              <Pressable style={styles.continueButton} onPress={onPress}>
                <Text style={styles.continueButtonText}>CONTINUER</Text>
                <Ionicons name="play" size={18} color={COLORS.background} />
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Pressable>
      </Animated.View>
    );
  }

  // Carte normale (compacte)
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(300)}>
      <Pressable onPress={onPress}>
        <GradientBorder boxHeight={90} borderRadius={16} fill="rgba(0, 0, 0, 0.25)">
          <View style={styles.compactCard}>
            <View style={[styles.compactLogo, { backgroundColor: challenge.primaryColor + '15' }]}>
              <Ionicons name="school" size={24} color={challenge.primaryColor} />
            </View>

            <View style={styles.compactInfo}>
              <Text style={styles.compactName}>{challenge.name}</Text>
              <Text style={styles.compactLevel}>
                Niveau {enrollment.currentLevel} • {enrollment.totalXp.toLocaleString()} XP
              </Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            <Pressable style={styles.activateButton} onPress={onSetActive}>
              <Text style={styles.activateButtonText}>Activer</Text>
            </Pressable>
          </View>
        </GradientBorder>
      </Pressable>
    </Animated.View>
  );
});

export default function MyProgramsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  // Store
  const challenges = useChallengeStore((state) => state.challenges);
  const enrollments = useChallengeStore((state) => state.enrollments);
  const activeChallengeId = useChallengeStore((state) => state.activeChallengeId);
  const setActiveChallenge = useChallengeStore((state) => state.setActiveChallenge);

  // Filtrer les inscriptions de l'utilisateur
  const userEnrollments = useMemo(() => {
    if (!user?.id) return [];
    return enrollments.filter((e) => e.userId === user.id);
  }, [enrollments, user?.id]);

  // Séparer inscription active et autres
  const activeEnrollment = useMemo(() => {
    return userEnrollments.find((e) => e.challengeId === activeChallengeId);
  }, [userEnrollments, activeChallengeId]);

  const otherEnrollments = useMemo(() => {
    return userEnrollments.filter((e) => e.challengeId !== activeChallengeId);
  }, [userEnrollments, activeChallengeId]);

  // Obtenir le Challenge pour une inscription
  const getChallengeForEnrollment = useCallback(
    (enrollment: ChallengeEnrollment) => {
      return challenges.find((c) => c.id === enrollment.challengeId);
    },
    [challenges]
  );

  // Handlers
  const handleSetActive = useCallback(
    (challengeId: string) => {
      setActiveChallenge(challengeId);
    },
    [setActiveChallenge]
  );

  const handleContinue = useCallback(() => {
    router.push('/(game)/mode-selection');
  }, [router]);

  const handleViewDetail = useCallback(
    (challengeId: string) => {
      router.push(`/(challenges)/${challengeId}`);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Mes Programmes</Text>
        <View style={styles.headerBackBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {userEnrollments.length === 0 ? (
          // État vide
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aucun programme</Text>
            <Text style={styles.emptySubtitle}>
              Rejoignez un programme pour commencer votre parcours entrepreneurial.
            </Text>
            <Pressable style={styles.discoverButton} onPress={() => router.push('/(tabs)/home')}>
              <Text style={styles.discoverButtonText}>Découvrir les programmes</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.background} />
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {/* Programme actif */}
            {activeEnrollment && getChallengeForEnrollment(activeEnrollment) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROGRAMME ACTIF</Text>
                <EnrollmentCard
                  enrollment={activeEnrollment}
                  challenge={getChallengeForEnrollment(activeEnrollment)!}
                  isActive={true}
                  onPress={handleContinue}
                  onSetActive={() => {}}
                />
              </View>
            )}

            {/* Autres programmes */}
            {otherEnrollments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AUTRES PROGRAMMES</Text>
                <View style={styles.otherList}>
                  {otherEnrollments.map((enrollment) => {
                    const challenge = getChallengeForEnrollment(enrollment);
                    if (!challenge) return null;
                    return (
                      <EnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        challenge={challenge}
                        isActive={false}
                        onPress={() => handleViewDetail(challenge.id)}
                        onSetActive={() => handleSetActive(challenge.id)}
                      />
                    );
                  })}
                </View>
              </View>
            )}

            {/* Découvrir plus */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.discoverSection}>
              <Pressable style={styles.discoverCard} onPress={() => router.push('/(tabs)/home')}>
                <Ionicons name="add-circle-outline" size={32} color={COLORS.primary} />
                <Text style={styles.discoverCardText}>Découvrir d'autres programmes</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[5],
  },

  // Sections
  section: {
    marginBottom: SPACING[6],
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: SPACING[3],
  },

  // Carte active
  activeCard: {
    padding: SPACING[4],
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING[4],
  },
  activeLogo: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCardInfo: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  activeBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: SPACING[1],
  },
  activeBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  activeChallengeName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  activeOrgName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  activeProgressSection: {
    marginBottom: SPACING[4],
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
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
  progressBarLarge: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING[3],
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    borderRadius: BORDER_RADIUS.lg,
  },
  continueButtonText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    letterSpacing: 1,
  },

  // Carte compacte
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    height: 90,
  },
  compactLogo: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  compactName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  compactLevel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginVertical: 4,
  },
  progressBarSmall: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  activateButton: {
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.md,
  },
  activateButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  otherList: {
    gap: SPACING[3],
  },

  // Découvrir
  discoverSection: {
    marginTop: SPACING[2],
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING[4],
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  discoverCardText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },

  // État vide
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[16],
    gap: SPACING[3],
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[5],
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING[4],
  },
  discoverButtonText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
  },
});
