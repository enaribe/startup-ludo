/**
 * Challenge Detail Screen - Écran de détails du programme
 *
 * Design premium avec animations staggered, GameButton,
 * DynamicGradientBorder et composants du design system.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { ALL_CHALLENGES } from '@/data/challenges';
import { useAuthStore, useChallengeStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeLevel, ChallengeSector } from '@/types/challenge';

// ===== COMPOSANTS INTERNES =====

const DELIVERABLE_LABELS: Record<string, string> = {
  sector_choice: 'Choix secteur',
  pitch: 'Pitch',
  business_plan_simple: 'BP Simplifié',
  business_plan_full: 'BP Complet + Certificat',
  custom: 'Livrable',
};

interface LevelTimelineItemProps {
  level: ChallengeLevel;
  index: number;
  isLast: boolean;
}

const LevelTimelineItem = memo(function LevelTimelineItem({
  level,
  index,
  isLast,
}: LevelTimelineItemProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 120).duration(500).springify()}
      style={styles.timelineItem}
    >
      {/* Connecteur vertical */}
      {!isLast && <View style={styles.timelineConnector} />}

      {/* Point animé */}
      <Animated.View
        entering={ZoomIn.delay(400 + index * 120).duration(400)}
        style={styles.timelinePoint}
      >
        <Ionicons
          name={(level.iconName as keyof typeof Ionicons.glyphMap) || 'ellipse'}
          size={22}
          color={COLORS.primary}
        />
      </Animated.View>

      {/* Contenu */}
      <View style={styles.timelineContent}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineLevelNumber}>NIVEAU {level.number}</Text>
          <View style={styles.deliverableBadge}>
            <Ionicons name="document-text-outline" size={10} color={COLORS.primary} />
            <Text style={styles.deliverableBadgeText}>
              {DELIVERABLE_LABELS[level.deliverableType] || 'Livrable'}
            </Text>
          </View>
        </View>
        <Text style={styles.timelineLevelName}>{level.name}</Text>
        <Text style={styles.timelinePosture}>{level.posture}</Text>

        {/* XP + Sub-levels count */}
        <View style={styles.timelineFooter}>
          <View style={styles.timelineXpBadge}>
            <Ionicons name="flash" size={12} color={COLORS.primary} />
            <Text style={styles.timelineXpText}>
              {level.xpRequired.toLocaleString()} XP
            </Text>
          </View>
          <Text style={styles.timelineSubCount}>
            {level.subLevels.length} sous-niveaux
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

interface SectorCardProps {
  sector: ChallengeSector;
  index: number;
}

const SectorCard = memo(function SectorCard({ sector, index }: SectorCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(400 + index * 100).duration(400).springify()}
      style={styles.sectorCard}
    >
      <View style={[styles.sectorCardContent, { borderColor: sector.color + '30' }]}>
        <View style={[styles.sectorIconContainer, { backgroundColor: sector.color + '20' }]}>
          <Ionicons
            name={(sector.iconName as keyof typeof Ionicons.glyphMap) || 'leaf-outline'}
            size={26}
            color={sector.color}
          />
        </View>
        <Text style={styles.sectorName} numberOfLines={2}>{sector.name}</Text>
        <Text style={styles.sectorCategory}>{sector.category}</Text>
      </View>
    </Animated.View>
  );
});

interface StatItemProps {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  delay: number;
}

const StatItem = memo(function StatItem({ value, label, icon, delay }: StatItemProps) {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay).duration(400)}
      style={styles.statItem}
    >
      <View style={styles.statIconCircle}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
});

// ===== ÉCRAN PRINCIPAL =====

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId: string }>();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((state) => state.user);
  const challenges = useChallengeStore((state) => state.challenges);
  const enrollments = useChallengeStore((state) => state.enrollments);
  const enrollInChallenge = useChallengeStore((state) => state.enrollInChallenge);

  const challenge = useMemo(() => {
    const storeChallenge = challenges.find((c) => c.id === params.challengeId);
    if (storeChallenge) return storeChallenge;
    return ALL_CHALLENGES.find((c) => c.id === params.challengeId);
  }, [challenges, params.challengeId]);

  const enrollment = useMemo(
    () => enrollments.find((e) => e.challengeId === params.challengeId),
    [enrollments, params.challengeId]
  );

  const isEnrolled = !!enrollment;

  const stats = useMemo(() => {
    if (!challenge) return { levels: 0, sectors: 0, totalXp: 0 };
    return {
      levels: challenge.totalLevels,
      sectors: challenge.sectors.length,
      totalXp: challenge.totalXpRequired,
    };
  }, [challenge]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEnroll = useCallback(() => {
    if (!challenge) return;
    const userId = user?.id || 'guest_user';

    if (!isEnrolled) {
      enrollInChallenge(challenge.id, userId);
    }
    router.push({
      pathname: '/(challenges)/challenge-hub',
      params: { challengeId: challenge.id },
    });
  }, [challenge, user, isEnrolled, enrollInChallenge, router]);

  if (!challenge) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Programme non trouvé</Text>
          <GameButton title="Retour" variant="yellow" onPress={handleBack} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Programme</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* === HERO BANNER === */}
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.4)">
            <View style={styles.heroCard}>
              {/* Icon */}
              <Animated.View
                entering={ZoomIn.delay(300).duration(500)}
                style={styles.heroIconContainer}
              >
                <Ionicons name="school" size={36} color={COLORS.primary} />
              </Animated.View>

              {/* Title */}
              <Animated.Text
                entering={FadeInDown.delay(350).duration(400)}
                style={styles.heroName}
              >
                {challenge.name}
              </Animated.Text>

              {/* Organization badge */}
              <Animated.View
                entering={FadeInDown.delay(450).duration(400)}
                style={styles.orgBadge}
              >
                <Ionicons name="business-outline" size={14} color={COLORS.primary} />
                <Text style={styles.orgText}>{challenge.organization}</Text>
              </Animated.View>

              {/* Description */}
              <Animated.Text
                entering={FadeInDown.delay(550).duration(400)}
                style={styles.heroDescription}
              >
                {challenge.description}
              </Animated.Text>

              {/* Quick stats row */}
              <Animated.View
                entering={FadeInDown.delay(650).duration(400)}
                style={styles.heroStatsRow}
              >
                <View style={styles.heroStat}>
                  <Ionicons name="layers-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.heroStatText}>{stats.levels} niveaux</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Ionicons name="grid-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.heroStatText}>{stats.sectors} secteurs</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Ionicons name="flash-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.heroStatText}>{(stats.totalXp / 1000).toFixed(0)}K XP</Text>
                </View>
              </Animated.View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* === SECTION: PARCOURS === */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="map-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>PARCOURS</Text>
          </View>
        </Animated.View>

        <View style={styles.timelineContainer}>
          {challenge.levels.map((level, index) => (
            <LevelTimelineItem
              key={level.id}
              level={level}
              index={index}
              isLast={index === challenge.levels.length - 1}
            />
          ))}
        </View>

        {/* === SECTION: SECTEURS === */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="apps-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>SECTEURS D'ACTIVITÉ</Text>
          </View>
        </Animated.View>

        <View style={styles.sectorsGrid}>
          {challenge.sectors.map((sector, index) => (
            <SectorCard key={sector.id} sector={sector} index={index} />
          ))}
        </View>

        {/* === SECTION: LIVRABLES === */}
        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>LIVRABLES</Text>
          </View>
        </Animated.View>

        <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.3)">
          <View style={styles.deliverablesContainer}>
            {[
              { icon: 'apps-outline' as const, label: 'Choix du secteur d\'activité', level: 'Fin niveau 1' },
              { icon: 'megaphone-outline' as const, label: 'Fiche Pitch du projet', level: 'Fin niveau 2' },
              { icon: 'document-text-outline' as const, label: 'Business Plan Simplifié', level: 'Fin niveau 3' },
              { icon: 'trophy-outline' as const, label: 'Business Plan Complet + Certificat', level: 'Fin niveau 4' },
            ].map((item, index) => (
              <Animated.View
                key={item.label}
                entering={FadeInDown.delay(1000 + index * 80).duration(400)}
                style={[
                  styles.deliverableItem,
                  index < 3 && styles.deliverableItemBorder,
                ]}
              >
                <View style={styles.deliverableIconCircle}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.deliverableInfo}>
                  <Text style={styles.deliverableLabel}>{item.label}</Text>
                  <Text style={styles.deliverableLevel}>{item.level}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </Animated.View>
            ))}
          </View>
        </DynamicGradientBorder>

        {/* === SECTION: CHIFFRES CLÉS === */}
        <Animated.View entering={FadeInDown.delay(1100).duration(400)}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconCircle}>
              <Ionicons name="stats-chart-outline" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>CHIFFRES CLÉS</Text>
          </View>
        </Animated.View>

        <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.3)">
          <View style={styles.statsContainer}>
            <StatItem value={String(stats.levels)} label="Niveaux" icon="layers" delay={1200} />
            <StatItem value={String(stats.levels * 4)} label="Étapes" icon="footsteps" delay={1300} />
            <StatItem value={String(stats.sectors)} label="Secteurs" icon="grid" delay={1400} />
            <StatItem value="1" label="Certificat" icon="ribbon" delay={1500} />
          </View>
        </DynamicGradientBorder>

        {/* Espace pour le bouton fixe */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* === BOUTON FIXE === */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(500)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}
      >
        <GameButton
          title={isEnrolled ? 'Continuer' : 'Rejoindre ce programme'}
          variant="yellow"
          fullWidth
          onPress={handleEnroll}
        />
      </Animated.View>
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
  },

  // Hero
  heroCard: {
    padding: SPACING[6],
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  heroName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[2],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.25)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[1],
    marginBottom: SPACING[4],
  },
  orgText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  heroDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: FONT_SIZES.base * 1.6,
    marginBottom: SPACING[5],
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  heroStatText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  heroStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[7],
    marginBottom: SPACING[4],
  },
  sectionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },

  // Timeline
  timelineContainer: {
    gap: SPACING[3],
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 21,
    top: 48,
    bottom: -SPACING[3],
    width: 2,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
  },
  timelinePoint: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    marginLeft: SPACING[3],
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[2],
  },
  timelineLevelNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  deliverableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  deliverableBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 9,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  timelineLevelName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    marginBottom: SPACING[1],
  },
  timelinePosture: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: SPACING[3],
  },
  timelineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineXpText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  timelineSubCount: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },

  // Secteurs
  sectorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  sectorCard: {
    width: '47%',
    flexGrow: 1,
  },
  sectorCardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[4],
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  sectorIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  sectorName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 2,
  },
  sectorCategory: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },

  // Livrables
  deliverablesContainer: {
    padding: SPACING[4],
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[3],
  },
  deliverableItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  deliverableIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliverableInfo: {
    flex: 1,
  },
  deliverableLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    marginBottom: 2,
  },
  deliverableLevel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[5],
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING[1],
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[1],
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 36, 62, 0.95)',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[6],
    gap: SPACING[4],
  },
  errorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
});
