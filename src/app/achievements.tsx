import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUserStore } from '@/stores';
import {
  ACHIEVEMENTS_BY_CATEGORY,
  CATEGORY_LABELS,
  RARITY_COLORS,
  RARITY_LABELS,
  getCompletionPercentage,
  getUnlockedCount,
  getTotalAchievements,
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
} from '@/config';

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const unlockedAchievements = useUserStore((state) => state.getUnlockedAchievements());

  const totalAchievements = getTotalAchievements();
  const unlockedCount = getUnlockedCount(unlockedAchievements);
  const completionPercentage = getCompletionPercentage(unlockedAchievements);

  const categories = Object.keys(ACHIEVEMENTS_BY_CATEGORY) as AchievementCategory[];

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with back button */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING[6],
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </Pressable>
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
              marginLeft: SPACING[4],
              flex: 1,
            }}
          >
            Succès
          </Text>
        </Animated.View>

        {/* Progress Overview */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card style={{ marginBottom: SPACING[6] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="ribbon" size={32} color={COLORS.primary} />
              <View style={{ marginLeft: SPACING[4], flex: 1 }}>
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.xl,
                    color: COLORS.text,
                  }}
                >
                  {unlockedCount} / {totalAchievements}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Succès débloqués
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: COLORS.primary + '20',
                  paddingHorizontal: SPACING[3],
                  paddingVertical: SPACING[1],
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.md,
                    color: COLORS.primary,
                  }}
                >
                  {completionPercentage}%
                </Text>
              </View>
            </View>
            <ProgressBar progress={completionPercentage} size="md" variant="default" />
          </Card>
        </Animated.View>

        {/* Rarity Legend */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING[2],
            marginBottom: SPACING[6],
          }}
        >
          {(Object.keys(RARITY_COLORS) as AchievementRarity[]).map((rarity) => (
            <View
              key={rarity}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.card,
                paddingHorizontal: SPACING[3],
                paddingVertical: SPACING[1],
                borderRadius: 12,
              }}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: RARITY_COLORS[rarity],
                  marginRight: SPACING[2],
                }}
              />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                }}
              >
                {RARITY_LABELS[rarity]}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Categories */}
        {categories.map((category, categoryIndex) => {
          const categoryAchievements = ACHIEVEMENTS_BY_CATEGORY[category];
          const categoryUnlocked = categoryAchievements.filter((a) =>
            unlockedAchievements.includes(a.id)
          ).length;

          return (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(300 + categoryIndex * 100).duration(500)}
              style={{ marginBottom: SPACING[6] }}
            >
              {/* Category Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: SPACING[3],
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.lg,
                    color: COLORS.text,
                  }}
                >
                  {CATEGORY_LABELS[category]}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  {categoryUnlocked}/{categoryAchievements.length}
                </Text>
              </View>

              {/* Achievements Grid */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: SPACING[3],
                }}
              >
                {categoryAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={unlockedAchievements.includes(achievement.id)}
                  />
                ))}
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

function AchievementCard({ achievement, isUnlocked }: AchievementCardProps) {
  const isSecret = achievement.secret && !isUnlocked;

  return (
    <Card
      style={{
        width: '47%',
        opacity: isUnlocked ? 1 : 0.5,
        borderWidth: 2,
        borderColor: isUnlocked ? RARITY_COLORS[achievement.rarity] : 'transparent',
      }}
    >
      <View style={{ alignItems: 'center', padding: SPACING[3] }}>
        {/* Icon */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isUnlocked
              ? RARITY_COLORS[achievement.rarity] + '20'
              : COLORS.card,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: SPACING[2],
          }}
        >
          <Ionicons
            name={isSecret ? 'help' : (achievement.icon as keyof typeof Ionicons.glyphMap)}
            size={24}
            color={isUnlocked ? RARITY_COLORS[achievement.rarity] : COLORS.textSecondary}
          />
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily: FONTS.bodySemiBold,
            fontSize: FONT_SIZES.sm,
            color: isUnlocked ? COLORS.text : COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING[1],
          }}
          numberOfLines={1}
        >
          {isSecret ? '???' : achievement.title}
        </Text>

        {/* Description */}
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: FONT_SIZES.xs,
            color: COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: SPACING[2],
          }}
          numberOfLines={2}
        >
          {isSecret ? 'Succès secret' : achievement.description}
        </Text>

        {/* XP Reward */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isUnlocked ? COLORS.success + '20' : COLORS.card,
            paddingHorizontal: SPACING[2],
            paddingVertical: 2,
            borderRadius: 8,
          }}
        >
          <Ionicons
            name="star"
            size={12}
            color={isUnlocked ? COLORS.success : COLORS.textSecondary}
          />
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.xs,
              color: isUnlocked ? COLORS.success : COLORS.textSecondary,
              marginLeft: 4,
            }}
          >
            +{achievement.xpReward} XP
          </Text>
        </View>

        {/* Unlocked indicator */}
        {isUnlocked && (
          <View
            style={{
              position: 'absolute',
              top: SPACING[2],
              right: SPACING[2],
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          </View>
        )}
      </View>
    </Card>
  );
}
