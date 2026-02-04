import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { useAuthStore, useUserStore } from '@/stores';
import { getGameHistory, type GameSession } from '@/services/firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

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

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?.id);
  const profile = useUserStore((state) => state.profile);
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

  // Stats from profile (lifetime) + history
  const totalGames = profile?.gamesPlayed ?? history.length;
  const totalWins = profile?.gamesWon ?? history.filter((g) => g.result === 'win').length;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const totalTokens = profile?.totalTokensEarned ?? history.reduce((sum, g) => sum + g.tokensEarned, 0);
  const totalXP = profile?.xp ?? 0;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>STATISTIQUES</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 188, 64, 0.15)' }]}>
                  <Ionicons name="game-controller" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{totalGames}</Text>
                <Text style={styles.statLabel}>Parties</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                  <Ionicons name="trophy" size={20} color={COLORS.success} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.success }]}>{winRate}%</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                  <Ionicons name="cash" size={20} color={COLORS.warning} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.warning }]}>{totalTokens}</Text>
                <Text style={styles.statLabel}>Jetons</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                  <Ionicons name="star" size={20} color={COLORS.info} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.info }]}>{totalXP}</Text>
                <Text style={styles.statLabel}>XP Total</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Section Title */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>HISTORIQUE DES PARTIES</Text>
        </Animated.View>

        {/* History List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : history.length > 0 ? (
          history.map((game, index) => (
            <Animated.View
              key={game.id}
              entering={FadeInDown.delay(250 + index * 80).duration(400)}
            >
              <DynamicGradientBorder
                borderRadius={16}
                fill="rgba(10, 25, 41, 0.6)"
                boxWidth={contentWidth}
                style={{ marginBottom: 10 }}
              >
                <View style={styles.gameCard}>
                  {/* Left indicator */}
                  <View style={[
                    styles.gameIndicator,
                    { backgroundColor: game.result === 'win' ? COLORS.success : COLORS.error },
                  ]} />

                  <View style={styles.gameCardContent}>
                    {/* Top row: result + date + mode */}
                    <View style={styles.gameCardHeader}>
                      <View style={styles.gameResultRow}>
                        <View style={[
                          styles.resultBadge,
                          { backgroundColor: game.result === 'win' ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)' },
                        ]}>
                          <Ionicons
                            name={game.result === 'win' ? 'trophy' : 'close-circle'}
                            size={14}
                            color={game.result === 'win' ? COLORS.success : COLORS.error}
                          />
                          <Text style={[
                            styles.resultText,
                            { color: game.result === 'win' ? COLORS.success : COLORS.error },
                          ]}>
                            {game.result === 'win' ? 'Victoire' : 'Defaite'}
                          </Text>
                        </View>
                        <Text style={styles.gameDate}>{formatDate(game.date)}</Text>
                      </View>

                      <View style={styles.modeBadge}>
                        <Ionicons name={getModeIcon(game.mode)} size={12} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.modeText}>{getModeLabel(game.mode)}</Text>
                      </View>
                    </View>

                    {/* Bottom row: stats */}
                    <View style={styles.gameStatsRow}>
                      <View style={styles.gameStat}>
                        <Ionicons name="cash" size={14} color={COLORS.primary} />
                        <Text style={[styles.gameStatValue, { color: COLORS.primary }]}>+{game.tokensEarned}</Text>
                      </View>
                      <View style={styles.gameStat}>
                        <Ionicons name="star" size={14} color={COLORS.warning} />
                        <Text style={[styles.gameStatValue, { color: COLORS.warning }]}>+{game.xpEarned}</Text>
                      </View>
                      <View style={styles.gameStat}>
                        <Ionicons name="people" size={14} color={COLORS.info} />
                        <Text style={[styles.gameStatValue, { color: COLORS.info }]}>{game.players}</Text>
                      </View>
                      <View style={styles.gameStat}>
                        <Ionicons name="time" size={14} color="rgba(255,255,255,0.5)" />
                        <Text style={styles.gameDuration}>{game.duration} min</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </DynamicGradientBorder>
            </Animated.View>
          ))
        ) : (
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="game-controller-outline" size={48} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>Aucune partie jouee</Text>
            <Text style={styles.emptySubtitle}>
              Lance ta premiere partie pour voir ton historique ici !
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING[4],
    gap: SPACING[3],
  },
  statItem: {
    width: '46%',
    alignItems: 'center',
    paddingVertical: SPACING[3],
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: 'white',
    marginTop: SPACING[6],
    marginBottom: SPACING[3],
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING[8],
  },
  gameCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gameIndicator: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  gameCardContent: {
    flex: 1,
    padding: SPACING[3],
    gap: SPACING[2],
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING[2],
    paddingVertical: 3,
    borderRadius: 8,
  },
  resultText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
  },
  gameDate: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.4)',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  gameStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  gameStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameStatValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
  },
  gameDuration: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING[10],
    gap: SPACING[3],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: 'white',
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    maxWidth: 260,
  },
});
