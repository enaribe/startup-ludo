import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/common/EmptyState';

// Mock data for leaderboard
const MOCK_LEADERBOARD = [
  { id: '1', name: 'Amadou', rank: 'Mogul', score: 12500, avatar: null },
  { id: '2', name: 'Fatou', rank: 'Expert Business', score: 8750, avatar: null },
  { id: '3', name: 'Ibrahim', rank: 'Expert Business', score: 7200, avatar: null },
  { id: '4', name: 'Mariama', rank: 'Entrepreneur Confirmé', score: 5100, avatar: null },
  { id: '5', name: 'Ousmane', rank: 'Entrepreneur Confirmé', score: 4800, avatar: null },
];

const RANK_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

export default function ClassementScreen() {
  const insets = useSafeAreaInsets();

  const leaderboard = MOCK_LEADERBOARD;

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
          paddingBottom: SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
              marginBottom: SPACING[1],
            }}
          >
            Classement
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.base,
              color: COLORS.textSecondary,
            }}
          >
            Les meilleurs entrepreneurs de la semaine
          </Text>
        </Animated.View>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-end',
              marginBottom: SPACING[6],
              paddingHorizontal: SPACING[2],
            }}
          >
            {/* 2nd Place */}
            <PodiumItem
              rank={2}
              player={leaderboard[1]}
              height={80}
            />

            {/* 1st Place */}
            <PodiumItem
              rank={1}
              player={leaderboard[0]}
              height={100}
              isFirst
            />

            {/* 3rd Place */}
            <PodiumItem
              rank={3}
              player={leaderboard[2]}
              height={60}
            />
          </Animated.View>
        )}

        {/* Full List */}
        {leaderboard.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="Aucun classement"
            description="Joue des parties pour apparaître dans le classement !"
          />
        ) : (
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ gap: SPACING[3] }}
          >
            {leaderboard.map((player, index) => (
              <Animated.View
                key={player.id}
                entering={FadeInDown.delay(400 + index * 50).duration(500)}
              >
                <LeaderboardItem
                  rank={index + 1}
                  player={player}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

interface PodiumItemProps {
  rank: number;
  player: typeof MOCK_LEADERBOARD[0] | undefined;
  height: number;
  isFirst?: boolean;
}

function PodiumItem({ rank, player, height, isFirst = false }: PodiumItemProps) {
  if (!player) return null;

  const rankColor = RANK_COLORS[rank as keyof typeof RANK_COLORS] ?? COLORS.textSecondary;

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Avatar
        name={player.name}
        source={player.avatar}
        size={isFirst ? 'lg' : 'md'}
        showBorder
      />

      <Text
        style={{
          fontFamily: FONTS.bodySemiBold,
          fontSize: isFirst ? FONT_SIZES.md : FONT_SIZES.sm,
          color: COLORS.text,
          marginTop: SPACING[2],
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {player.name}
      </Text>

      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.xs,
          color: COLORS.primary,
          marginBottom: SPACING[2],
        }}
      >
        {player.score.toLocaleString()}
      </Text>

      <View
        style={{
          width: '100%',
          height,
          backgroundColor: rankColor,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: isFirst ? FONT_SIZES['2xl'] : FONT_SIZES.xl,
            color: COLORS.background,
          }}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
}

interface LeaderboardItemProps {
  rank: number;
  player: typeof MOCK_LEADERBOARD[0];
}

function LeaderboardItem({ rank, player }: LeaderboardItemProps) {
  const isTopThree = rank <= 3;
  const rankColor = isTopThree
    ? RANK_COLORS[rank as keyof typeof RANK_COLORS]
    : COLORS.textSecondary;

  return (
    <Card
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isTopThree ? rankColor : COLORS.card,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING[3],
        }}
      >
        {isTopThree ? (
          <Ionicons name="trophy" size={16} color={COLORS.background} />
        ) : (
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.sm,
              color: COLORS.text,
            }}
          >
            {rank}
          </Text>
        )}
      </View>

      <Avatar name={player.name} source={player.avatar} size="sm" />

      <View style={{ flex: 1, marginLeft: SPACING[3] }}>
        <Text
          style={{
            fontFamily: FONTS.bodySemiBold,
            fontSize: FONT_SIZES.md,
            color: COLORS.text,
          }}
        >
          {player.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: FONT_SIZES.xs,
            color: COLORS.textSecondary,
          }}
        >
          {player.rank}
        </Text>
      </View>

      <Text
        style={{
          fontFamily: FONTS.bodyBold,
          fontSize: FONT_SIZES.md,
          color: COLORS.primary,
        }}
      >
        {player.score.toLocaleString()}
      </Text>
    </Card>
  );
}
