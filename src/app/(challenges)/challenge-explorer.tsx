/**
 * ChallengeExplorerScreen - Explore tous les programmes disponibles
 *
 * Design aligné sur mode-selection.tsx :
 * - Header sombre arrondi (#0A1929) avec chevron-back blanc
 * - Sous-titre OutlinedText
 * - Switch "Mes programmes / Découvrir" avec DynamicGradientBorder
 * - Cards programme avec gradient border + icône + badge d'état
 * - Empty state visuel + GameButton
 */

import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgramIcon } from '@/components/icons';

import {
  RadialBackground,
  DynamicGradientBorder,
  GuestGate,
  GameButton,
  OutlinedText,
} from '@/components/ui';
import { ChallengeHomeCard, EnrollmentFormModal } from '@/components/challenges';
import { useChallengeStore, useAuthStore } from '@/stores';
import { getActiveChallenges, ALL_CHALLENGES } from '@/data/challenges';
import { useChallengeEnroll } from '@/hooks/useChallengeEnroll';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const THEME = {
  accent: '#FFBC40',
  cardFill: 'rgba(0, 0, 0, 0.35)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(127, 142, 158, 0.95)',
};

type ViewMode = 'enrolled' | 'explore';

export default function ChallengeExplorerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;

  const enrollments = useChallengeStore((state) => state.enrollments);
  const getEnrollmentForChallenge = useChallengeStore((s) => s.getEnrollmentForChallenge);

  const {
    showEnrollmentForm,
    activeChallengeName,
    handleEnroll,
    handleContinue,
    handleFormSubmit: handleEnrollmentFormSubmit,
    handleFormClose,
  } = useChallengeEnroll();

  const [viewMode, setViewMode] = useState<ViewMode>('enrolled');

  const enrolledChallenges = useMemo(() => {
    if (!userId) return [];
    // Un enrollment ne compte comme inscription effective que si le formulaire
    // a été rempli (formData != null). Sinon le programme reste à découvrir.
    const userEnrollments = enrollments.filter(
      (e) => e.userId === userId && e.formData != null
    );
    const challengeIds = userEnrollments.map((e) => e.challengeId);
    return ALL_CHALLENGES.filter((c) => challengeIds.includes(c.id) && c.isActive);
  }, [enrollments, userId]);

  const availableChallenges = useMemo(() => {
    const enrolledIds = enrolledChallenges.map((c) => c.id);
    return getActiveChallenges().filter((c) => !enrolledIds.includes(c.id));
  }, [enrolledChallenges]);

  const displayedChallenges = viewMode === 'enrolled' ? enrolledChallenges : availableChallenges;
  const contentWidth = SCREEN_WIDTH - SPACING[4] * 2;
  const headerBlockHeight = insets.top + 72;

  if (isGuest) {
    return (
      <GuestGate
        featureName="Programmes"
        description="Rejoins des programmes d'accompagnement, progresse niveau par niveau et développe tes compétences entrepreneuriales."
      />
    );
  }

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: insets.top + SPACING[2],
            backgroundColor: '#0A1929',
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={THEME.text} />
          </Pressable>
          <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>PROGRAMMES</Text>
          </View>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerBlockHeight + SPACING[5],
            paddingBottom: insets.bottom + SPACING[20],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sous-titre stylisé */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.subtitleWrap}>
          <OutlinedText
            text="EXPLORE LES PROGRAMMES"
            style={styles.subtitle}
            outlineColor="#0A1929"
            outlineWidth={2}
          />
        </Animated.View>

        {/* Switch Mes Programmes / Découvrir */}
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.switchWrap}>
          <DynamicGradientBorder borderRadius={24} fill="rgba(0, 0, 0, 0.35)" boxWidth={contentWidth}>
            <View style={styles.switchInner}>
              <Pressable
                style={[styles.switchButton, viewMode === 'enrolled' && styles.switchButtonActive]}
                onPress={() => setViewMode('enrolled')}
              >
                <Text style={[styles.switchText, viewMode === 'enrolled' && styles.switchTextActive]}>
                  Mes programmes
                </Text>
                {enrolledChallenges.length > 0 && (
                  <View
                    style={[
                      styles.switchBadge,
                      viewMode === 'enrolled' && styles.switchBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.switchBadgeText,
                        viewMode === 'enrolled' && styles.switchBadgeTextActive,
                      ]}
                    >
                      {enrolledChallenges.length}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                style={[styles.switchButton, viewMode === 'explore' && styles.switchButtonActive]}
                onPress={() => setViewMode('explore')}
              >
                <Text style={[styles.switchText, viewMode === 'explore' && styles.switchTextActive]}>
                  Découvrir
                </Text>
                {availableChallenges.length > 0 && (
                  <View
                    style={[
                      styles.switchBadge,
                      viewMode === 'explore' && styles.switchBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.switchBadgeText,
                        viewMode === 'explore' && styles.switchBadgeTextActive,
                      ]}
                    >
                      {availableChallenges.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Contenu */}
        {displayedChallenges.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
            <DynamicGradientBorder
              borderRadius={24}
              fill={THEME.cardFill}
              boxWidth={contentWidth}
            >
              <View style={styles.emptyInner}>
                <View style={styles.emptyIconSlot}>
                  {viewMode === 'enrolled' ? (
                    <ProgramIcon size={64} color="#71808E" />
                  ) : (
                    <Ionicons name="compass-outline" size={64} color={THEME.accent} />
                  )}
                </View>
                <Text style={styles.emptyTitle}>
                  {viewMode === 'enrolled' ? 'AUCUN PROGRAMME' : 'TOUT EST DÉCOUVERT'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {viewMode === 'enrolled'
                    ? "Découvre les programmes disponibles et rejoins ceux qui t'inspirent."
                    : "Tu es déjà inscrit à tous les programmes actifs. Reviens plus tard !"}
                </Text>
                {viewMode === 'enrolled' && availableChallenges.length > 0 && (
                  <View style={styles.emptyButtonWrap}>
                    <GameButton
                      variant="yellow"
                      fullWidth
                      title="DÉCOUVRIR"
                      onPress={() => setViewMode('explore')}
                    />
                  </View>
                )}
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        ) : (
          <View style={styles.challengeList}>
            {displayedChallenges.map((challenge, index) => {
              const enrollment = getEnrollmentForChallenge(challenge.id, userId);
              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.delay(220 + index * 80).duration(400)}
                >
                  <ChallengeHomeCard
                    challenge={challenge}
                    enrollment={enrollment ?? null}
                    onEnroll={() => handleEnroll(challenge.id)}
                    onContinue={() => handleContinue(challenge.id)}
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
        challengeName={activeChallengeName}
        onSubmit={handleEnrollmentFormSubmit}
        onClose={handleFormClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[4],
    paddingHorizontal: SPACING[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 50, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
  },

  // Sous-titre
  subtitleWrap: {
    marginBottom: SPACING[4],
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Switch
  switchWrap: {
    marginBottom: SPACING[5],
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
    gap: SPACING[2],
    borderRadius: 20,
    paddingHorizontal: SPACING[3],
  },
  switchButtonActive: {
    backgroundColor: '#1F91D0',
  },
  switchText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  switchTextActive: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFFFFF',
  },
  switchBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  switchBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  switchBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  switchBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Liste challenges
  challengeList: {
    gap: SPACING[4],
  },

  // Empty state
  emptyState: {
    marginTop: SPACING[2],
  },
  emptyInner: {
    paddingVertical: SPACING[7],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  emptyIconSlot: {
    marginBottom: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: THEME.text,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: SPACING[5],
  },
  emptyButtonWrap: {
    width: '100%',
  },
});
