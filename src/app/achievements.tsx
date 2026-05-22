/**
 * AchievementsScreen — écran des succès.
 *
 * Design aligné sur les autres écrans (profil, statistiques, paramètres) :
 * header fixe #0A1929 arrondi, cartes DynamicGradientBorder fond rgba(0,0,0,0.35).
 */
import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { AchievementDetailPopup } from '@/components/game/popups/AchievementDetailPopup';
import { describeAchievementProgress } from '@/services/game/achievementService';
import { useUserStore } from '@/stores';
import {
  ACHIEVEMENTS_BY_CATEGORY,
  CATEGORY_LABELS,
  RARITY_COLORS,
  getCompletionPercentage,
  getUnlockedCount,
  getTotalAchievements,
  type Achievement,
  type AchievementCategory,
} from '@/config';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;
const cardGap = SPACING[3];
const cardWidth = (contentWidth - cardGap) / 2;

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const unlockedAchievements = useMemo(
    () => profile?.achievements ?? [],
    [profile?.achievements]
  );

  const totalAchievements = getTotalAchievements();
  const unlockedCount = getUnlockedCount(unlockedAchievements);
  const completionPercentage = getCompletionPercentage(unlockedAchievements);

  const categories = Object.keys(ACHIEVEMENTS_BY_CATEGORY) as AchievementCategory[];

  // Succès sélectionné — affiché dans le popup de détail
  const [selected, setSelected] = useState<Achievement | null>(null);

  // Instantané des stats du joueur pour calculer la progression d'un succès
  const progressInput = useMemo(
    () => ({
      gamesPlayed: profile?.gamesPlayed ?? 0,
      gamesWon: profile?.gamesWon ?? 0,
      totalTokensEarned: profile?.totalTokensEarned ?? 0,
      startupsCreated: profile?.startups?.length ?? 0,
      level: profile?.level ?? 1,
      rank: profile?.rank ?? '',
    }),
    [profile]
  );

  const selectedIsUnlocked = selected ? unlockedAchievements.includes(selected.id) : false;
  const selectedProgress = selected
    ? describeAchievementProgress(selected, progressInput)
    : null;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>SUCCÈS</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Vue d'ensemble */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
            <View style={styles.overviewCard}>
              <View style={styles.overviewTop}>
                <Ionicons name="ribbon" size={32} color={COLORS.primary} />
                <View style={styles.overviewTextWrap}>
                  <Text style={styles.overviewCount}>
                    {unlockedCount} / {totalAchievements}
                  </Text>
                  <Text style={styles.overviewLabel}>Succès débloqués</Text>
                </View>
                <Text style={styles.overviewPercent}>{completionPercentage}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Catégories */}
        {categories.map((category, categoryIndex) => {
          const categoryAchievements = ACHIEVEMENTS_BY_CATEGORY[category];
          const categoryUnlocked = categoryAchievements.filter((a) =>
            unlockedAchievements.includes(a.id)
          ).length;

          return (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(140 + categoryIndex * 70).duration(450)}
              style={styles.categoryBlock}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
                <Text style={styles.categoryCount}>
                  {categoryUnlocked}/{categoryAchievements.length}
                </Text>
              </View>

              <View style={styles.grid}>
                {categoryAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={unlockedAchievements.includes(achievement.id)}
                    onPress={() => setSelected(achievement)}
                  />
                ))}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Popup de détail — comment débloquer le succès */}
      <AchievementDetailPopup
        achievement={selected}
        isUnlocked={selectedIsUnlocked}
        progress={selectedProgress}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  onPress: () => void;
}

function AchievementCard({ achievement, isUnlocked, onPress }: AchievementCardProps) {
  const isSecret = achievement.secret && !isUnlocked;
  const rarityColor = RARITY_COLORS[achievement.rarity];

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ width: cardWidth }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.cardPressed}
      >
        <DynamicGradientBorder
          borderRadius={16}
          fill="rgba(0,0,0,0.35)"
          boxWidth={cardWidth}
        >
          <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
          {/* Icône — sans conteneur coloré, couleur = rareté si débloqué */}
          <Ionicons
            name={isSecret ? 'help' : achievement.icon}
            size={32}
            color={isUnlocked ? rarityColor : 'rgba(255,255,255,0.35)'}
            style={styles.cardIcon}
          />

          <Text
            style={[styles.cardTitle, !isUnlocked && styles.cardTitleLocked]}
            numberOfLines={1}
          >
            {isSecret ? '???' : achievement.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {isSecret ? 'Succès secret' : achievement.description}
          </Text>

          <View style={styles.cardXpRow}>
            <Ionicons
              name="star"
              size={12}
              color={isUnlocked ? COLORS.success : 'rgba(255,255,255,0.35)'}
            />
            <Text style={[styles.cardXpText, isUnlocked && styles.cardXpTextUnlocked]}>
              +{achievement.xpReward} XP
            </Text>
          </View>

          {isUnlocked && (
            <View style={styles.cardCheck}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            </View>
          )}
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnPlaceholder: { width: 40, height: 40 },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Vue d'ensemble
  overviewCard: {
    padding: SPACING[4],
    width: '100%',
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  overviewTextWrap: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  overviewCount: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  overviewLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  overviewPercent: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },

  // Catégories
  categoryBlock: {
    marginTop: SPACING[5],
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  categoryTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  categoryCount: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },

  // Grille de cartes
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: cardGap,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING[3],
  },
  cardLocked: {
    opacity: 0.55,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  cardIcon: {
    marginBottom: SPACING[2],
  },
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 2,
  },
  cardTitleLocked: {
    color: 'rgba(255,255,255,0.6)',
  },
  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: SPACING[2],
    minHeight: 30,
  },
  cardXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardXpText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.35)',
  },
  cardXpTextUnlocked: {
    color: COLORS.success,
  },
  cardCheck: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
  },
});
