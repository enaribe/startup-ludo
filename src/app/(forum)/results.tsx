/**
 * ForumResultsScreen — Écran de fin de partie mode forum
 *
 * Affiche le classement par jetons, sans XP ni valorisation.
 * Bouton "COMMENCER" → nouvelle partie (retour setup)
 * Bouton "ACCUEIL" → welcome forum
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { useSound } from '@/hooks/useSound';
import { saveForumSession, updateForumLeaderboard } from '@/services/firebase/forumService';
import { useGameStore } from '@/stores/useGameStore';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Player } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#6B8FBF'];
const PLAYER_COLOR_HEX: Record<string, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#FF6B6B',
};

// ===== Composant : carte joueur classement =====
function RankCard({
  player,
  rank,
  isWinner,
  delay,
}: {
  player: Player;
  rank: number;
  isWinner: boolean;
  delay: number;
}) {
  const colorHex = PLAYER_COLOR_HEX[player.color] ?? '#FFBC40';
  const medalColor = MEDAL_COLORS[rank - 1] ?? '#6B8FBF';
  const initials = player.name.trim().slice(0, 2).toUpperCase();

  if (isWinner) {
    return (
      <Animated.View entering={FadeInUp.delay(delay).duration(500)} style={styles.winnerCard}>
        <View style={[styles.winnerAvatar, { backgroundColor: colorHex }]}>
          <Text style={styles.winnerAvatarText}>{initials}</Text>
        </View>
        <Text style={styles.winnerName}>{player.name.toUpperCase()}</Text>
        <Text style={styles.winnerStartup}>{player.startupName ?? ''}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.rankRow}>
      {/* Rang */}
      <View style={[styles.rankBadge, { backgroundColor: medalColor }]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      {/* Avatar */}
      <View style={[styles.rankAvatar, { backgroundColor: colorHex }]}>
        <Text style={styles.rankAvatarText}>{initials}</Text>
      </View>

      {/* Nom + startup */}
      <View style={styles.rankInfo}>
        <Text style={styles.rankName}>{player.name.toUpperCase()}</Text>
        <Text style={styles.rankStartup}>{player.startupName ?? ''}</Text>
      </View>

      {/* Jetons */}
      <View style={styles.rankTokens}>
        <Text style={styles.rankTokensCount}>{player.tokens}</Text>
        <Ionicons name="logo-usd" size={14} color="rgba(255,255,255,0.5)" />
      </View>
    </Animated.View>
  );
}

// ===== SCREEN PRINCIPAL =====

export default function ForumResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { game, resetGame } = useGameStore();
  const { play: playSound } = useSound();
  const soundPlayed = useRef(false);
  const forumFirestoreSynced = useRef(false);

  const trophyScale = useSharedValue(0);

  // Données
  const sortedPlayers = game?.players.slice().sort((a, b) => b.tokens - a.tokens) ?? [];
  const winner = sortedPlayers[0] ?? null;

  // Son victoire
  useEffect(() => {
    if (soundPlayed.current || !game || game.status !== 'finished') return;
    soundPlayed.current = true;
    playSound('victory');
  }, [game, playSound]);

  // Phase 3 — Firestore forum (collections dédiées, sans bloquer l’UI)
  useEffect(() => {
    if (!game || game.status !== 'finished' || forumFirestoreSynced.current) return;
    if (game.players.length === 0) return;

    forumFirestoreSynced.current = true;

    const eventName = (Constants.expoConfig?.extra?.eventName as string | undefined) ?? '';
    const sorted = [...game.players].sort((a, b) => b.tokens - a.tokens);
    const winnerPlayer = sorted[0];
    if (!winnerPlayer) {
      return;
    }

    const playersPayload = sorted.map((p, i) => ({
      name: p.name,
      startupName: p.startupName ?? '',
      tokens: p.tokens,
      rank: i + 1,
    }));

    void saveForumSession({
      eventName,
      players: playersPayload,
      winnerName: winnerPlayer.name,
      totalPlayers: game.players.length,
    }).catch(() => {});

    void updateForumLeaderboard(
      sorted.map((p) => ({
        name: p.name,
        startupName: p.startupName ?? '',
        tokens: p.tokens,
        isWinner: p.id === winnerPlayer.id,
      }))
    ).catch(() => {});
  }, [game]);

  // Animation trophée
  useEffect(() => {
    trophyScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.2, { duration: 400 }),
        withTiming(1.0, { duration: 200 })
      )
    );
  }, [trophyScale]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const handleNewGame = () => {
    resetGame();
    router.replace('/(forum)/setup');
  };

  const handleHome = () => {
    resetGame();
    router.replace('/(forum)/welcome');
  };

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING[6], paddingBottom: insets.bottom + SPACING[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.titleSection}>
          <Animated.Image
            source={require('@/../assets/images/logostartupludo.png')}
            style={[styles.headerLogo, { opacity: 0.9 }]}
            resizeMode="contain"
          />
          <Animated.View style={trophyStyle}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </Animated.View>
          <Text style={styles.title}>PARTIE TERMINÉ</Text>
        </Animated.View>

        {/* Carte gagnant */}
        {winner && (
          <RankCard
            player={winner}
            rank={1}
            isWinner
            delay={300}
          />
        )}

        {/* Autres joueurs */}
        <View style={[styles.rankList, { width: contentWidth }]}>
          {sortedPlayers.slice(1).map((player, i) => (
            <RankCard
              key={player.id}
              player={player}
              rank={i + 2}
              isWinner={false}
              delay={400 + i * 80}
            />
          ))}
        </View>

        {/* Boutons */}
        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.buttons}>
          <GameButton
            title="COMMENCER"
            variant="yellow"
            fullWidth
            onPress={handleNewGame}
            style={styles.btn}
          />
          <GameButton
            title="ACCUEIL"
            variant="blue"
            fullWidth
            onPress={handleHome}
            style={styles.btn}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING[5],
  },
  headerLogo: {
    width: screenWidth * 0.45,
    height: 50,
    marginBottom: SPACING[4],
  },
  trophyEmoji: {
    fontSize: 64,
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFBC40',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Carte gagnant
  winnerCard: {
    width: contentWidth,
    backgroundColor: '#27AE60',
    borderRadius: 20,
    padding: SPACING[5],
    alignItems: 'center',
    marginBottom: SPACING[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  winnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  winnerAvatarText: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: '#FFFFFF',
  },
  winnerName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: SPACING[1],
  },
  winnerStartup: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  // Liste classement
  rankList: {
    gap: SPACING[3],
    marginBottom: SPACING[5],
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: SPACING[3],
    gap: SPACING[3],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
  },
  rankAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankAvatarText: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: '#FFFFFF',
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  rankStartup: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  rankTokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankTokensCount: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: '#FFBC40',
  },

  // Boutons
  buttons: {
    width: contentWidth,
    gap: SPACING[3],
  },
  btn: {
    marginVertical: 0,
  },
});
