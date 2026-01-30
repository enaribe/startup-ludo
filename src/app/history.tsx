import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores';
import { getGameHistory, type GameSession } from '@/services/firebase/firestore';

// Type pour une partie enregistrée
interface GameHistory {
  id: string;
  date: number;
  mode: 'solo' | 'local' | 'online';
  result: 'win' | 'loss';
  tokensEarned: number;
  xpEarned: number;
  players: number;
  duration: number; // en minutes
}

function mapSessionToHistory(session: GameSession, userId: string): GameHistory {
  const isWin = session.winnerId === userId;
  const userScore = session.finalScores[userId] ?? 0;
  return {
    id: session.id,
    date: session.createdAt,
    mode: session.mode,
    result: isWin ? 'win' : 'loss',
    tokensEarned: userScore,
    xpEarned: isWin ? 50 : 10,
    players: session.playerIds.length,
    duration: session.duration,
  };
}

function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  } else if (hours < 24) {
    return `Il y a ${hours}h`;
  } else if (days === 1) {
    return 'Hier';
  } else if (days < 7) {
    return `Il y a ${days} jours`;
  } else {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}

function getModeLabel(mode: GameHistory['mode']): string {
  switch (mode) {
    case 'solo':
      return 'Solo vs IA';
    case 'local':
      return 'Multijoueur local';
    case 'online':
      return 'En ligne';
    default:
      return mode;
  }
}

function getModeIcon(mode: GameHistory['mode']): keyof typeof Ionicons.glyphMap {
  switch (mode) {
    case 'solo':
      return 'person';
    case 'local':
      return 'people';
    case 'online':
      return 'globe';
    default:
      return 'game-controller';
  }
}

interface GameHistoryCardProps {
  game: GameHistory;
  index: number;
}

function GameHistoryCard({ game, index }: GameHistoryCardProps) {
  const isWin = game.result === 'win';

  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 100).duration(400)}>
      <Card
        style={{
          marginBottom: SPACING[3],
          borderLeftWidth: 4,
          borderLeftColor: isWin ? COLORS.success : COLORS.error,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING[3],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isWin ? `${COLORS.success}20` : `${COLORS.error}20`,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={isWin ? 'trophy' : 'close-circle'}
                size={18}
                color={isWin ? COLORS.success : COLORS.error}
              />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.base,
                  color: isWin ? COLORS.success : COLORS.error,
                }}
              >
                {isWin ? 'Victoire' : 'Défaite'}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                }}
              >
                {formatDate(game.date)}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING[1],
              backgroundColor: COLORS.background,
              paddingHorizontal: SPACING[2],
              paddingVertical: SPACING[1],
              borderRadius: 8,
            }}
          >
            <Ionicons name={getModeIcon(game.mode)} size={14} color={COLORS.textSecondary} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              {getModeLabel(game.mode)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingTop: SPACING[3],
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
              <Ionicons name="cash" size={16} color={COLORS.primary} />
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.lg,
                  color: COLORS.primary,
                }}
              >
                +{game.tokensEarned}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              Jetons
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
              <Ionicons name="star" size={16} color={COLORS.warning} />
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.lg,
                  color: COLORS.warning,
                }}
              >
                +{game.xpEarned}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              XP
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
              <Ionicons name="people" size={16} color={COLORS.info} />
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.lg,
                  color: COLORS.info,
                }}
              >
                {game.players}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              Joueurs
            </Text>
          </View>

          <View style={{ alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[1] }}>
              <Ionicons name="time" size={16} color={COLORS.textSecondary} />
              <Text
                style={{
                  fontFamily: FONTS.title,
                  fontSize: FONT_SIZES.lg,
                  color: COLORS.text,
                }}
              >
                {game.duration}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              min
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getGameHistory(userId, 20)
      .then((sessions) => {
        const mapped = sessions.map((s) => mapSessionToHistory(s, userId));
        setHistory(mapped);
      })
      .catch((err) => {
        console.warn('[History] Failed to fetch:', err);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleBack = () => {
    router.back();
  };

  // Calculate stats
  const totalGames = history.length;
  const wins = history.filter((g) => g.result === 'win').length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const totalTokens = history.reduce((sum, g) => sum + g.tokensEarned, 0);

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
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SPACING[4],
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginLeft: SPACING[2],
              }}
            >
              Retour
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
            }}
          >
            Historique des parties
          </Text>
        </Animated.View>

        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Card style={{ marginBottom: SPACING[4] }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES['2xl'],
                    color: COLORS.primary,
                  }}
                >
                  {totalGames}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Parties
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES['2xl'],
                    color: COLORS.success,
                  }}
                >
                  {winRate}%
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Victoires
                </Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES['2xl'],
                    color: COLORS.warning,
                  }}
                >
                  {totalTokens}
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Jetons gagnés
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* History List */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: SPACING[8] }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : history.length > 0 ? (
          history.map((game, index) => (
            <GameHistoryCard key={game.id} game={game} index={index} />
          ))
        ) : (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ alignItems: 'center', paddingVertical: SPACING[8] }}
          >
            <Ionicons name="game-controller-outline" size={64} color={COLORS.textSecondary} />
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.lg,
                color: COLORS.text,
                marginTop: SPACING[4],
              }}
            >
              Aucune partie jouée
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginTop: SPACING[2],
              }}
            >
              Lance ta première partie pour voir ton historique ici !
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}
