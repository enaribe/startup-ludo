/**
 * ChallengeExplorerScreen - Explore tous les challenges disponibles
 *
 * Affiche:
 * - Switch pour naviguer entre "Mes challenges" et "Explorer"
 * - Liste des challenges inscrits OU challenges disponibles
 * - Design system cohérent avec gradients et bordures
 */

import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialBackground, GradientBorder } from '@/components/ui';
import { ChallengeHomeCard, EnrollmentFormModal } from '@/components/challenges';
import { useChallengeStore, useAuthStore } from '@/stores';
import { getActiveChallenges, ALL_CHALLENGES } from '@/data/challenges';
import type { EnrollmentFormData } from '@/types/challenge';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';

type ViewMode = 'enrolled' | 'explore';

export default function ChallengeExplorerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';

  // Store
  const enrollments = useChallengeStore((state) => state.enrollments);
  const enrollInChallenge = useChallengeStore((s) => s.enrollInChallenge);
  const submitEnrollmentForm = useChallengeStore((s) => s.submitEnrollmentForm);
  const setActiveChallenge = useChallengeStore((s) => s.setActiveChallenge);
  const getEnrollmentForChallenge = useChallengeStore((s) => s.getEnrollmentForChallenge);
  const getActiveChallenge = useChallengeStore((s) => s.getActiveChallenge);
  const getActiveEnrollment = useChallengeStore((s) => s.getActiveEnrollment);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('enrolled');
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

  // Challenges inscrits
  const enrolledChallenges = useMemo(() => {
    if (!userId) return [];
    const userEnrollments = enrollments.filter((e) => e.userId === userId);
    const challengeIds = userEnrollments.map((e) => e.challengeId);
    return ALL_CHALLENGES.filter((c) => challengeIds.includes(c.id));
  }, [enrollments, userId]);

  // Challenges disponibles (non inscrits)
  const availableChallenges = useMemo(() => {
    if (!userId) return getActiveChallenges();
    const enrolledIds = enrolledChallenges.map((c) => c.id);
    return getActiveChallenges().filter((c) => !enrolledIds.includes(c.id));
  }, [enrolledChallenges, userId]);

  // Challenges à afficher selon le mode
  const displayedChallenges = viewMode === 'enrolled' ? enrolledChallenges : availableChallenges;

  const handleEnrollmentFormSubmit = (formData: EnrollmentFormData) => {
    const enrollment = getActiveEnrollment();
    if (enrollment) {
      submitEnrollmentForm(enrollment.id, formData);
      setShowEnrollmentForm(false);
      router.push('/(challenges)/challenge-hub');
    }
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Programmes</Text>
        <View style={styles.headerBackBtn} />
      </View>

      {/* Switch */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.switchContainer}>
        <GradientBorder boxHeight={48} borderRadius={24} fill="rgba(0, 0, 0, 0.25)">
          <View style={styles.switchInner}>
            <Pressable
              style={[styles.switchButton, viewMode === 'enrolled' && styles.switchButtonActive]}
              onPress={() => setViewMode('enrolled')}
            >
              <Text style={[styles.switchText, viewMode === 'enrolled' && styles.switchTextActive]}>
                Mes Challenges
              </Text>
              {enrolledChallenges.length > 0 && (
                <View style={styles.switchBadge}>
                  <Text style={styles.switchBadgeText}>{enrolledChallenges.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[styles.switchButton, viewMode === 'explore' && styles.switchButtonActive]}
              onPress={() => setViewMode('explore')}
            >
              <Text style={[styles.switchText, viewMode === 'explore' && styles.switchTextActive]}>
                Explorer
              </Text>
              {availableChallenges.length > 0 && (
                <View style={styles.switchBadge}>
                  <Text style={styles.switchBadgeText}>{availableChallenges.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </GradientBorder>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING[20] }]}
        showsVerticalScrollIndicator={false}
      >
        {displayedChallenges.length === 0 ? (
          // État vide
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
            <Ionicons
              name={viewMode === 'enrolled' ? 'school-outline' : 'search-outline'}
              size={64}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {viewMode === 'enrolled' ? 'Aucun challenge inscrit' : 'Aucun challenge disponible'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {viewMode === 'enrolled'
                ? 'Explorez les challenges disponibles et commencez votre parcours.'
                : 'Tous les challenges actifs sont déjà inscrits.'}
            </Text>
            {viewMode === 'enrolled' && availableChallenges.length > 0 && (
              <Pressable style={styles.exploreButton} onPress={() => setViewMode('explore')}>
                <Text style={styles.exploreButtonText}>Explorer les challenges</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.background} />
              </Pressable>
            )}
          </Animated.View>
        ) : (
          // Liste des challenges
          <View style={styles.challengeList}>
            {displayedChallenges.map((challenge, index) => {
              const enrollment = getEnrollmentForChallenge(challenge.id);
              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.delay(index * 100).duration(400)}
                  style={styles.challengeCardWrapper}
                >
                  <ChallengeHomeCard
                    challenge={challenge}
                    enrollment={enrollment ?? null}
                    onEnroll={() => {
                      if (!userId) return;
                      enrollInChallenge(challenge.id, userId);
                      setActiveChallenge(challenge.id);
                      setShowEnrollmentForm(true);
                    }}
                    onContinue={() => {
                      setActiveChallenge(challenge.id);
                      if (enrollment && enrollment.formData == null) {
                        setShowEnrollmentForm(true);
                      } else {
                        router.push('/(challenges)/challenge-hub');
                      }
                    }}
                  />
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Formulaire d'inscription au challenge */}
      <EnrollmentFormModal
        visible={showEnrollmentForm}
        challengeName={getActiveChallenge()?.name ?? 'Programme'}
        onSubmit={handleEnrollmentFormSubmit}
        onClose={() => setShowEnrollmentForm(false)}
      />
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

  // Switch
  switchContainer: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },
  switchInner: {
    flexDirection: 'row',
    padding: 4,
    height: 48,
  },
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
    borderRadius: 20,
    paddingHorizontal: SPACING[3],
  },
  switchButtonActive: {
    backgroundColor: COLORS.primary,
  },
  switchText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  switchTextActive: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.background,
  },
  switchBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  switchBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },
  challengeList: {
    gap: SPACING[4],
  },
  challengeCardWrapper: {
    marginBottom: SPACING[2],
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[20],
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
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[5],
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING[4],
  },
  exploreButtonText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
  },
});
