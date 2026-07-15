/**
 * ForumResultsScreen — Fin de partie mode forum (maquette : carte gagnant vert, rangs bordure couleur, jetons)
 */

import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForumTrophyIcon } from '@/components/icons';
import { GameButton } from '@/components/ui/GameButton';
import { RadialBackground } from '@/components/ui/RadialBackground';
import { useForumScale } from '@/hooks/useForumScale';
import { useSound } from '@/hooks/useSound';
import { saveForumSession, updateForumLeaderboard } from '@/services/firebase/forumService';
import { useGameStore } from '@/stores/useGameStore';
import { SPACING } from '@/styles/spacing';
import { FONT_SIZES, FONTS } from '@/styles/typography';
import type { Player } from '@/types';


const PLAYER_COLOR_HEX: Record<string, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#FF6B6B',
};

/** Données factices pour `?preview=1` (test UI sans jouer une partie) */
const FORUM_PREVIEW_IDS = ['forum-prev-0', 'forum-prev-1', 'forum-prev-2', 'forum-prev-3'] as const;

function seedForumResultsPreview(): void {
  const { resetGame, initGame, addTokens, endGame } = useGameStore.getState();
  resetGame();
  initGame('local', 'classic', [
    {
      id: FORUM_PREVIEW_IDS[0],
      name: 'PAPE ELHADJ',
      color: 'green',
      isAI: false,
      startupName: 'Design for Citizens',
      startupId: 'fp-s0',
      isDefaultProject: true,
    },
    {
      id: FORUM_PREVIEW_IDS[1],
      name: 'BABACAR BIRANE',
      color: 'yellow',
      isAI: false,
      startupName: 'Concree SAS',
      startupId: 'fp-s1',
      isDefaultProject: true,
    },
    {
      id: FORUM_PREVIEW_IDS[2],
      name: 'Joueur 3',
      color: 'red',
      isAI: false,
      startupName: 'Fitwell',
      startupId: 'fp-s2',
      isDefaultProject: true,
    },
    {
      id: FORUM_PREVIEW_IDS[3],
      name: 'Joueur 4',
      color: 'blue',
      isAI: false,
      startupName: 'Agro Trip',
      startupId: 'fp-s3',
      isDefaultProject: true,
    },
  ]);
  addTokens(FORUM_PREVIEW_IDS[0], 8);
  addTokens(FORUM_PREVIEW_IDS[1], 5);
  addTokens(FORUM_PREVIEW_IDS[2], 3);
  addTokens(FORUM_PREVIEW_IDS[3], 2);
  endGame(FORUM_PREVIEW_IDS[0]);
}

/** Paire de jetons (cercles superposés) couleur joueur */
function TokenPairIcon({ color, dotSize }: { color: string; dotSize: number }) {
  const wrapW = dotSize + dotSize * 0.7;
  const r = dotSize / 2;
  return (
    <View style={{ width: wrapW, height: dotSize, justifyContent: 'center' }} accessibilityLabel="Jetons">
      <View style={{ position: 'absolute', left: 0, width: dotSize, height: dotSize, borderRadius: r, backgroundColor: color, opacity: 0.75 }} />
      <View style={{ position: 'absolute', left: dotSize * 0.5, width: dotSize, height: dotSize, borderRadius: r, backgroundColor: color, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' }} />
    </View>
  );
}

function RankRow({
  player,
  rank,
  delay,
  fs,
  sp,
  contentWidth: cw,
}: {
  player: Player;
  rank: number;
  delay: number;
  fs: (n: number) => number;
  sp: (n: number) => number;
  contentWidth: number;
}) {
  const colorHex = PLAYER_COLOR_HEX[player.color] ?? '#FFBC40';
  const badgeSize = sp(36);

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(420)}
      style={[
        styles.rankRow,
        {
          borderColor: colorHex,
          borderRadius: sp(16),
          paddingVertical: sp(14),
          paddingHorizontal: sp(14),
          gap: sp(12),
          marginBottom: sp(10),
          width: cw,
        },
      ]}
    >
      <View style={[styles.rankBadge, { backgroundColor: colorHex, width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}>
        <Text style={[styles.rankBadgeText, { fontSize: fs(FONT_SIZES.md) }]}>{rank}</Text>
      </View>

      <View style={styles.rankInfo}>
        <Text style={[styles.rankName, { fontSize: fs(FONT_SIZES.base) }]}>{player.name.toUpperCase()}</Text>
        <Text style={[styles.rankStartup, { fontSize: fs(FONT_SIZES.sm) }]} numberOfLines={1}>
          {player.startupName ?? ''}
        </Text>
      </View>

      <View style={styles.rankTokens}>
        <Text style={[styles.rankTokensCount, { color: colorHex, fontSize: fs(FONT_SIZES.xl) }]}>{player.tokens}</Text>
        <TokenPairIcon color={colorHex} dotSize={sp(16)} />
      </View>
    </Animated.View>
  );
}

function WinnerCard({
  player,
  delay,
  fs,
  sp,
  contentWidth: cw,
}: {
  player: Player;
  delay: number;
  fs: (n: number) => number;
  sp: (n: number) => number;
  contentWidth: number;
}) {
  const startup = player.startupName?.trim() ?? '';
  const circleSize = sp(60);

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(520)}
      style={[styles.winnerOuter, { width: cw, borderRadius: sp(22), marginBottom: sp(20) }]}
    >
      <LinearGradient
        colors={['#6EDC8C', '#2FA653', '#1E7A3D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.winnerGradient, { paddingVertical: sp(28), paddingHorizontal: sp(24) }]}
      >
        <View style={[styles.winnerRankCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2, marginBottom: sp(12) }]}>
          <Text style={[styles.winnerRankDigit, { fontSize: fs(FONT_SIZES['2xl']) }]}>1</Text>
        </View>
        <Text style={[styles.winnerName, { fontSize: fs(FONT_SIZES['2xl']), marginBottom: sp(10) }]}>
          {player.name.toUpperCase()}
        </Text>
        {startup.length > 0 ? (
          <View style={[styles.winnerPill, { paddingVertical: sp(8), paddingHorizontal: sp(16) }]}>
            <Text style={[styles.winnerPillText, { fontSize: fs(FONT_SIZES.base) }]}>{startup}</Text>
          </View>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
}

export default function ForumResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidthDyn } = useWindowDimensions();
  const { fs, sp, contentWidth } = useForumScale();
  const params = useLocalSearchParams<{ preview?: string }>();
  const isPreview = params.preview === '1';
  const previewSeeded = useRef(false);

  const { game, resetGame } = useGameStore();
  const { play: playSound } = useSound();
  const soundPlayed = useRef(false);
  const forumFirestoreSynced = useRef(false);

  useLayoutEffect(() => {
    if (!isPreview || previewSeeded.current) return;
    previewSeeded.current = true;
    seedForumResultsPreview();
  }, [isPreview]);

  const sortedPlayers = game?.players.slice().sort((a, b) => b.tokens - a.tokens) ?? [];
  const winner = sortedPlayers[0] ?? null;
  const editionLabel = game?.edition === 'classic' ? 'CLASSIQUE' : (game?.edition ?? '').toUpperCase();

  useEffect(() => {
    if (soundPlayed.current || !game || game.status !== 'finished') return;
    soundPlayed.current = true;
    playSound('victory');
  }, [game, playSound]);

  useEffect(() => {
    if (isPreview) return;
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
  }, [game, isPreview]);

  const handleNewGame = () => {
    resetGame();
    router.replace('/(forum)/setup');
  };

  const handleHome = () => {
    resetGame();
    router.replace('/(forum)/welcome');
  };

  const trophyW = Math.min(sp(100), screenWidthDyn * 0.28);

  if (!isPreview && (!game || game.status !== 'finished')) {
    return <Redirect href="/(forum)/welcome" />;
  }

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + sp(20),
            paddingBottom: insets.bottom + sp(40),
            paddingHorizontal: (screenWidthDyn - contentWidth) / 2,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(480)} style={[styles.hero, { marginBottom: sp(20) }]}>
          <Animated.Image
            source={require('@/../assets/images/logostartupludo.png')}
            style={[styles.headerLogo, { width: screenWidthDyn * 0.42, height: sp(56), marginBottom: sp(8) }]}
            resizeMode="contain"
          />
          
          <View style={[styles.trophyWrap, { marginBottom: sp(10) }]}>
            <ForumTrophyIcon width={trophyW} />
          </View>
          <Text style={[styles.title, { fontSize: fs(FONT_SIZES['2xl']) }]}>PARTIE TERMINÉE</Text>
        </Animated.View>

        {winner ? (
          <WinnerCard player={winner} delay={280} fs={fs} sp={sp} contentWidth={contentWidth} />
        ) : null}

        <View style={styles.rankList}>
          {sortedPlayers.slice(1).map((player, i) => (
            <RankRow
              key={player.id}
              player={player}
              rank={i + 2}
              delay={360 + i * 70}
              fs={fs}
              sp={sp}
              contentWidth={contentWidth}
            />
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(620).duration(480)}
          style={[styles.buttons, { width: contentWidth, gap: sp(12) }]}
        >
          <GameButton
            title="RECOMMENCER"
            variant="yellow"
            size="lg"
            fullWidth
            onPress={handleNewGame}
          />
          <GameButton title="ACCUEIL" variant="blue" fullWidth onPress={handleHome} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
  },
  headerLogo: {},
  editionTag: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.45)',
  },
  editionTagText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFBC40',
    letterSpacing: 1,
  },
  trophyWrap: {},
  title: {
    fontFamily: FONTS.title,
    color: '#FFBC40',
    letterSpacing: 1.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  winnerOuter: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  winnerGradient: {
    alignItems: 'center',
  },
  winnerRankCircle: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winnerRankDigit: {
    fontFamily: FONTS.title,
    color: '#1B5E20',
  },
  winnerName: {
    fontFamily: FONTS.title,
    color: '#0D3D16',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  winnerPill: {
    backgroundColor: '#0D4A1A',
    borderRadius: 999,
    maxWidth: '100%',
  },
  winnerPillText: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  rankList: {
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
  },
  rankBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontFamily: FONTS.title,
    color: '#FFFFFF',
  },
  rankInfo: {
    flex: 1,
    minWidth: 0,
  },
  rankName: {
    fontFamily: FONTS.title,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  rankStartup: {
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 3,
  },
  rankTokens: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankTokensCount: {
    fontFamily: FONTS.title,
  },
  buttons: {
    alignItems: 'stretch',
  },
});
