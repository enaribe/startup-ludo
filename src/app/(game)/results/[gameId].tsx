/**
 * game-result - Popup de fin de partie
 *
 * Affiche: gagnant, classement avec XP par joueur, boutons action
 * Applique XP + stats au profil local (Zustand) et distant (Firestore)
 * Design: popup modal centré sur fond sombre semi-transparent
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import Svg, { Defs, G, Path, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';

import { GameButton } from '@/components/ui';
import { ProgramEnrollmentModal } from '@/components/programs';
import { AchievementUnlockedPopup } from '@/components/game/popups/AchievementUnlockedPopup';
import { XP_REWARDS, getChallengeXPReward } from '@/config/progression';
import type { Achievement } from '@/config/achievements';
import { isOwnStartup } from '@/data/defaultProjects';
import { useSound } from '@/hooks/useSound';
import { evaluateAchievements } from '@/services/game/achievementService';
import { saveGameSession, updateChallengeEnrollment, updateStartupValorisation, updateUserStats, updateUserAchievements } from '@/services/firebase/firestore';
import { useAuthStore, useChallengeStore, useGameStore, useProgramStore, useUserStore } from '@/stores';
import { payoutForRankFcfa } from '@/services/game/stakeService';
import { formatPtwRaw } from '@/utils/currency';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ProgramEnrollmentFormData } from '@/types/program';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const POPUP_WIDTH = Math.min(screenWidth - SPACING[8], 340);

// ===== OUTLINED TEXT =====

function OutlinedText({
  text,
  style,
  outlineColor = '#0C243E',
  outlineWidth = 3,
}: {
  text: string;
  style: object;
  outlineColor?: string;
  outlineWidth?: number;
}) {
  const offsets = [
    { x: -outlineWidth, y: -outlineWidth },
    { x: 0, y: -outlineWidth },
    { x: outlineWidth, y: -outlineWidth },
    { x: outlineWidth, y: 0 },
    { x: outlineWidth, y: outlineWidth },
    { x: 0, y: outlineWidth },
    { x: -outlineWidth, y: outlineWidth },
    { x: -outlineWidth, y: 0 },
  ];
  return (
    <View style={{ alignSelf: 'center' }}>
      {offsets.map((offset, i) => (
        <Text
          key={i}
          style={[style, { color: outlineColor, position: 'absolute', left: offset.x, top: offset.y }]}
        >
          {text}
        </Text>
      ))}
      <Text style={style}>{text}</Text>
    </View>
  );
}

// ===== ICÔNES SVG =====

function CrownIcon() {
  return (
    <Svg width={103} height={90} viewBox="0 0 103 90" fill="none">
      <Defs>
        <LinearGradient id="crownStroke" x1="51.0625" y1="11.8125" x2="51.0625" y2="72.8125" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#DFDFDF" />
          <Stop offset="1" stopColor="#A9A9A9" />
        </LinearGradient>
      </Defs>
      <G>
        <Path d="M53.0352 23.3499C55.3202 22.5323 56.9564 20.3345 56.9564 17.7516C56.9564 14.4715 54.3177 11.8125 51.0626 11.8125C47.8075 11.8125 45.1688 14.4715 45.1688 17.7516C45.1688 20.3342 46.8046 22.5318 49.0891 23.3496L41.9649 42.7377C41.5132 43.9669 39.9071 44.2362 39.0847 43.2208L24.0533 24.6606C25.1613 23.5808 25.8501 22.0671 25.8501 20.3912C25.8501 17.1111 23.2114 14.452 19.9563 14.452C16.7013 14.452 14.0625 17.1111 14.0625 20.3912C14.0625 23.6712 16.7013 26.3303 19.9563 26.3303C20.2957 26.3303 20.6283 26.3014 20.9519 26.2459L29.788 57.9085C30.4 60.1013 32.3846 61.6164 34.6451 61.6164H67.4901C69.7511 61.6164 71.736 60.1007 72.3475 57.9073L81.1748 26.2462C81.4979 26.3015 81.83 26.3303 82.1687 26.3303C85.4237 26.3303 88.0625 23.6712 88.0625 20.3912C88.0625 17.1111 85.4237 14.452 82.1687 14.452C78.9136 14.452 76.2749 17.1111 76.2749 20.3912C76.2749 22.0678 76.9643 23.5822 78.0732 24.6621L63.0512 43.2209C62.2291 44.2364 60.6232 43.9678 60.171 42.739L53.0352 23.3499Z" fill="#FFBC40" />
        <Path d="M35.414 65.4637C33.1539 65.4637 31.4381 67.5143 31.8201 69.759C32.1202 71.523 33.6379 72.8125 35.414 72.8125H66.7313C68.5077 72.8125 70.0256 71.5226 70.3254 69.7582C70.7067 67.5137 68.9911 65.4637 66.7313 65.4637H35.414Z" fill="#FFBC40" />
        <Path d="M66.7314 65.1826C69.1679 65.1827 71.0126 67.3921 70.6025 69.8057C70.2799 71.7035 68.6463 73.0937 66.7314 73.0938H35.4141C33.4995 73.0938 31.866 71.7041 31.543 69.8066C31.1322 67.3927 32.9772 65.1826 35.4141 65.1826H66.7314ZM51.0625 11.5312C54.4749 11.5312 57.2373 14.3186 57.2373 17.752C57.2372 20.3556 55.6486 22.5848 53.3936 23.5117L60.4346 42.6416C60.8119 43.6669 62.1492 43.8887 62.833 43.0439L77.6963 24.6797C76.6416 23.5639 75.9933 22.0537 75.9932 20.3916C75.9932 16.9582 78.7565 14.1709 82.1689 14.1709C85.5812 14.171 88.3438 16.9583 88.3438 20.3916C88.3435 23.8247 85.5811 26.6112 82.1689 26.6113C81.9011 26.6113 81.637 26.5939 81.3779 26.5605L72.6182 57.9824C71.9731 60.2962 69.8786 61.8974 67.4902 61.8975H34.6455C32.2577 61.8975 30.1632 60.2973 29.5176 57.9844L20.7471 26.5605C20.488 26.5939 20.2239 26.6113 19.9561 26.6113C16.5439 26.6112 13.7815 23.8247 13.7812 20.3916C13.7812 16.9583 16.5438 14.171 19.9561 14.1709C23.3685 14.1709 26.1318 16.9582 26.1318 20.3916C26.1317 22.0531 25.4828 23.562 24.4287 24.6777L39.3037 43.0439C39.9879 43.8883 41.3244 43.6661 41.7012 42.6406L48.7295 23.5117C46.4754 22.5843 44.8878 20.3549 44.8877 17.752C44.8877 14.3186 47.6501 11.5313 51.0625 11.5312Z" stroke="url(#crownStroke)" strokeWidth="0.5625" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

function SpinningShape() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: 240, height: 240, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
      <Image
        source={require('../../../../assets/images/shape.png')}
        style={{ width: 240, height: 240, opacity: 1 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function SadFaceIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 74 74" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M37 66C55.2254 66 70 51.2254 70 33C70 14.7746 55.2254 0 37 0C18.7746 0 4 14.7746 4 33C4 51.2254 18.7746 66 37 66ZM22.6931 51.7137C23.9087 52.3215 25.3853 51.8351 26.0031 50.6279L26.0081 50.6186C26.0184 50.5998 26.0411 50.5596 26.0767 50.5009C26.1482 50.3832 26.2709 50.193 26.4503 49.9537C26.81 49.4742 27.3903 48.8073 28.2336 48.1326C29.8889 46.8084 32.6512 45.375 37 45.375C41.3488 45.375 44.1111 46.8084 45.7664 48.1326C46.6097 48.8073 47.19 49.4742 47.5497 49.9537C47.7291 50.193 47.8518 50.3832 47.9233 50.5009C47.9589 50.5596 47.9816 50.5998 47.9919 50.6186L47.9969 50.6279C48.6147 51.8351 50.0913 52.3215 51.3069 51.7137C52.5294 51.1024 53.025 49.6157 52.4137 48.3931L50.2 49.5C52.4137 48.3931 52.4144 48.3945 52.4137 48.3931L52.4109 48.3876L52.4079 48.3815L52.4007 48.3674L52.3823 48.332C52.3683 48.3052 52.3506 48.2721 52.3292 48.2331C52.2863 48.1552 52.2284 48.0537 52.1545 47.9319C52.0068 47.6887 51.7943 47.3633 51.5097 46.9837C50.9412 46.2258 50.0778 45.2427 48.8586 44.2673C46.3889 42.2916 42.5512 40.425 37 40.425C31.4488 40.425 27.6111 42.2916 25.1414 44.2673C23.9222 45.2427 23.0588 46.2258 22.4903 46.9837C22.2057 47.3633 21.9932 47.6887 21.8455 47.9319C21.7716 48.0537 21.7137 48.1552 21.6708 48.2331C21.6494 48.2721 21.6317 48.3052 21.6177 48.332L21.5993 48.3674L21.5921 48.3815L21.5891 48.3876C21.5884 48.389 21.5863 48.3931 23.8 49.5L21.5863 48.3931C20.975 49.6157 21.4705 51.1024 22.6931 51.7137ZM30.4 24.75C30.4 27.4838 28.1838 29.7 25.45 29.7C22.7162 29.7 20.5 27.4838 20.5 24.75C20.5 22.0162 22.7162 19.8 25.45 19.8C28.1838 19.8 30.4 22.0162 30.4 24.75ZM48.55 29.7C51.2838 29.7 53.5 27.4838 53.5 24.75C53.5 22.0162 51.2838 19.8 48.55 19.8C45.8162 19.8 43.6 22.0162 43.6 24.75C43.6 27.4838 45.8162 29.7 48.55 29.7Z"
        fill="#F35145"
      />
    </Svg>
  );
}

// ===== RANK CARD avec bordure gradient =====

function RankCard({ rank, playerColor, gradId, startupName, playerName, xp, isForfeited }: {
  rank: number;
  playerColor: string;
  gradId: string;
  startupName?: string;
  playerName: string;
  xp: number;
  isForfeited?: boolean;
}) {
  const [h, setH] = useState(0);
  const w = POPUP_WIDTH - SPACING[5] * 2; // largeur de la carte dans le popup
  const borderW = 1;

  return (
    <View
      style={rankCardStyles.card}
      onLayout={(e) => setH(e.nativeEvent.layout.height)}
    >
      {/* Bordure gradient SVG */}
      {h > 0 && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={playerColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={playerColor} stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          <Rect
            x={borderW / 2}
            y={borderW / 2}
            width={w - borderW}
            height={h - borderW}
            rx={14}
            ry={14}
            fill="transparent"
            stroke={`url(#${gradId})`}
            strokeWidth={borderW}
          />
        </Svg>
      )}

      {/* Badge numéro */}
      <View style={[rankCardStyles.badge, { backgroundColor: playerColor }]}>
        <Text style={rankCardStyles.badgeText}>{rank}</Text>
      </View>

      {/* Infos */}
      <View style={rankCardStyles.info}>
        <Text style={rankCardStyles.name}>{startupName ?? playerName}</Text>
        {startupName ? <Text style={rankCardStyles.sub}>{playerName}</Text> : null}
      </View>

      {/* XP ou badge forfait */}
      {isForfeited ? (
        <Text style={rankCardStyles.forfeitTag}>Quitté</Text>
      ) : (
        <Text style={rankCardStyles.xp}>+{xp.toLocaleString()} XP</Text>
      )}
    </View>
  );
}

const rankCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
    gap: SPACING[3],
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#0C243E',
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  sub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  xp: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  forfeitTag: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
});

// ===== XP CALCULATION =====

interface XPBreakdown {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  amount: number;
}

function computeXP(
  userId: string | undefined,
  winnerId: string | null | undefined,
  playerTokens: number,
  playerRank: number,
  totalPlayers: number,
): { total: number; breakdown: XPBreakdown[] } {
  const breakdown: XPBreakdown[] = [];

  breakdown.push({
    label: 'Partie jouee',
    icon: 'game-controller',
    amount: XP_REWARDS.GAME_PLAYED!.amount,
  });

  if (userId && winnerId === userId) {
    breakdown.push({
      label: 'Victoire',
      icon: 'trophy',
      amount: XP_REWARDS.GAME_WON!.amount,
    });
  } else if (playerRank <= 3 && totalPlayers >= 3) {
    breakdown.push({
      label: `${playerRank}e place`,
      icon: 'medal',
      amount: XP_REWARDS.GAME_PODIUM!.amount,
    });
  }

  if (playerTokens >= 50) {
    breakdown.push({ label: '50+ jetons', icon: 'cash', amount: XP_REWARDS.TOKEN_MILESTONE_50!.amount });
  } else if (playerTokens >= 25) {
    breakdown.push({ label: '25+ jetons', icon: 'cash', amount: XP_REWARDS.TOKEN_MILESTONE_25!.amount });
  } else if (playerTokens >= 10) {
    breakdown.push({ label: '10+ jetons', icon: 'cash', amount: XP_REWARDS.TOKEN_MILESTONE_10!.amount });
  }

  const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
  return { total, breakdown };
}

// ===== COMPONENT =====

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    gameId: string;
    mode?: string;
    isOnline?: string;
    roomId?: string;
    stake?: string;
    programId?: string;
    programSessionId?: string;
  }>();

  const { game, resetGame, initGame } = useGameStore();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const addXP = useUserStore((s) => s.addXP);
  const incrementGamesPlayed = useUserStore((s) => s.incrementGamesPlayed);
  const incrementGamesWon = useUserStore((s) => s.incrementGamesWon);
  const addTokensEarned = useUserStore((s) => s.addTokensEarned);
  const updateStartup = useUserStore((s) => s.updateStartup);
  const addAchievement = useUserStore((s) => s.addAchievement);

  const challengeAddXp = useChallengeStore((s) => s.addXp);
  const checkAndUnlockNextSubLevel = useChallengeStore((s) => s.checkAndUnlockNextSubLevel);
  const checkAndUnlockNextLevel = useChallengeStore((s) => s.checkAndUnlockNextLevel);
  const challenges = useChallengeStore((s) => s.challenges);
  const enrollments = useChallengeStore((s) => s.enrollments);
  const completeProgramSession = useProgramStore((s) => s.completeProgramSession);
  const enrollInProgram = useProgramStore((s) => s.enrollInProgram);
  const getProgramById = useProgramStore((s) => s.getProgramById);
  const getProgramProgress = useProgramStore((s) => s.getProgramProgress);
  // S'abonner aux enrollments pour recalculer la progression après completeProgramSession.
  const programEnrollments = useProgramStore((s) => s.enrollments);

  const isGuest = user?.isGuest ?? true;
  const isOnline = params.isOnline === 'true' || params.mode === 'online';
  const hasAppliedRewards = useRef(false);
  const endGameSoundPlayed = useRef(false);
  const { play: playEndGameSound } = useSound();

  const [showConvertPopup, setShowConvertPopup] = useState(false);
  const [showProgramEnroll, setShowProgramEnroll] = useState(false);
  const [showXpNeededMessage, setShowXpNeededMessage] = useState(false);
  const [xpNeededAmount, setXpNeededAmount] = useState(0);
  // Succès débloqués par cette partie — affichés dans AchievementUnlockedPopup
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  // Animations
  const crownScale = useSharedValue(0);
  const crownRotation = useSharedValue(-15);
  const popupScale = useSharedValue(0.8);
  const popupOpacity = useSharedValue(0);

  // Données de test quand game est null (bouton de dev)
  const isTestMode = !game;
  const testUserId = 'player_0';
  const testPlayers = [
    { id: 'player_0', name: user?.displayName ?? 'Pape Abdoulaye', color: 'green' as const, tokens: 12, startupName: 'FoodieBot', startupId: undefined, isAI: false, isHost: true, isConnected: true, pawns: [] },
    { id: 'player_1', name: 'Moi', color: 'yellow' as const, tokens: 10, startupName: 'Ecocharge', startupId: undefined, isAI: true, isHost: false, isConnected: true, pawns: [] },
  ];

  // Game data (réel ou test)
  const effectivePlayers = isTestMode ? testPlayers : (game?.players ?? []);
  const effectiveWinnerId = isTestMode ? 'player_0' : game?.winner;
  const winner = effectivePlayers.find((p) => p.id === effectiveWinnerId);

  // Classement final : si un rank est défini (multi 3+ joueurs), il prime.
  // Sinon (2 joueurs ou modes sans ranking), fallback sur le tri par tokens.
  // Les joueurs forfait sont placés en dernier (rank = +Infinity).
  const sortedPlayers = effectivePlayers.slice().sort((a, b) => {
    const aAny = a as { rank?: number; isForfeited?: boolean };
    const bAny = b as { rank?: number; isForfeited?: boolean };
    const aRank = aAny.isForfeited ? Number.POSITIVE_INFINITY : (aAny.rank ?? Number.POSITIVE_INFINITY);
    const bRank = bAny.isForfeited ? Number.POSITIVE_INFINITY : (bAny.rank ?? Number.POSITIVE_INFINITY);
    if (aRank !== bRank) return aRank - bRank;
    return b.tokens - a.tokens;
  });

  const userId = isTestMode ? testUserId : (profile?.userId ?? user?.id);
  const myPlayer = effectivePlayers.find((p) => p.id === userId);
  const myRank = myPlayer ? sortedPlayers.findIndex((p) => p.id === myPlayer.id) + 1 : 0;
  const isWinner = userId != null && effectiveWinnerId === userId;

  // Mode local = tous joueurs humains, pas de perspective individuelle
  const isLocalMode = !isTestMode && game?.mode === 'local';
  const showCrown = isLocalMode || isWinner;

  // Titre principal selon le mode
  const mainTitleText = (() => {
    if (isLocalMode) {
      return winner ? `${winner.name.toUpperCase()} GAGNE !` : 'PARTIE TERMINÉE';
    }
    return isWinner ? 'VOUS GAGNEZ !' : (winner ? `${winner.name.toUpperCase()} GAGNE` : 'PARTIE TERMINÉE');
  })();

  // Son fin de partie
  useEffect(() => {
    if (endGameSoundPlayed.current) return;
    if (!game || game.status !== 'finished' || userId == null) return;
    if (game.winner === null) return;
    endGameSoundPlayed.current = true;
    playEndGameSound(game.winner === userId ? 'victory' : 'defeat');
  }, [game, userId, playEndGameSound]);

  // XP calculation
  const { total: xpGained } = computeXP(
    userId,
    effectiveWinnerId,
    myPlayer?.tokens ?? 0,
    myRank,
    sortedPlayers.length,
  );

  // XP par joueur dans le classement
  function getPlayerXP(player: typeof sortedPlayers[0], rank: number) {
    const { total } = computeXP(player.id, effectiveWinnerId, player.tokens, rank, sortedPlayers.length);
    return total;
  }

  const isChallengeGame = !!game?.challengeContext;
  const isProgramGame = !!game?.programContext;
  const resultProgram = game?.programContext ? getProgramById(game.programContext.programId) : undefined;

  // Progression du parcours après cette partie (le store a déjà été mis à jour dans l'effet de fin).
  const programProgress = isProgramGame && game?.programContext
    ? getProgramProgress(game.programContext.programId, userId ?? undefined)
    : null;
  // On a gagné CE niveau si le niveau courant a avancé au-delà de celui qu'on jouait.
  const playedLevelIndex = game?.programContext?.levelIndex ?? 0;
  const programLevelCleared =
    isProgramGame && isWinner && !!programProgress && programProgress.currentLevel > playedLevelIndex;
  const programJustCompleted = isProgramGame && !!programProgress?.isCompleted;
  // référence programEnrollments pour que ce calcul se réévalue après mise à jour du store.
  void programEnrollments;

  // Sous-titre header
  const subtitleText = isProgramGame
    ? 'Partie Programme'
    : isChallengeGame
    ? 'Partie Challenge'
    : isOnline
      ? 'Multijoueur en ligne'
      : isLocalMode
        ? 'Partie locale'
        : 'Partie solo';

  const challengeXpGained = isChallengeGame
    ? getChallengeXPReward(game!.challengeContext!.levelNumber, isWinner)
    : 0;

  const usedOwnStartup = isOwnStartup(myPlayer?.startupId);
  const firstPersonalStartup = profile?.startups?.[0] ?? null;
  const myStartup = usedOwnStartup
    ? profile?.startups?.find((s) => s.id === myPlayer?.startupId)
    : firstPersonalStartup;

  const hasAnyStartup = myStartup !== null;
  const valorisationBefore = myStartup?.valorisation ?? 0;
  const valorisationGain = hasAnyStartup
    ? Math.round((myPlayer?.tokens ?? 0) * 6250 * (isOnline ? 1.5 : 1))
    : 0;
  const defaultProjectXPBonus = !usedOwnStartup && myPlayer?.startupId ? 5 : 0;

  // ===== MISE (stake) — payout du pot selon le rang =====
  // La mise a été débitée au lancement (game-preparation). Ici on crédite le gain
  // sur l'entreprise principale. Un joueur forfait ne reçoit rien (perd sa mise).
  const stakeFcfa = parseInt(params.stake ?? '0', 10) || 0;
  const myIsForfeited = (myPlayer as { isForfeited?: boolean } | undefined)?.isForfeited === true;
  const stakePayoutFcfa =
    isOnline && stakeFcfa > 0 && !myIsForfeited
      ? payoutForRankFcfa(stakeFcfa, sortedPlayers.length, myRank)
      : 0;

  // Le payout du pot vient s'ajouter au gain de valorisation, sur la même entreprise.
  const valorisationAfter = valorisationBefore + valorisationGain + stakePayoutFcfa;

  // ===== APPLY REWARDS =====
  useEffect(() => {
    if (hasAppliedRewards.current) return;
    if (!game || game.status !== 'finished') return;
    hasAppliedRewards.current = true;

    incrementGamesPlayed();
    if (isWinner) incrementGamesWon();
    const totalXP = xpGained + defaultProjectXPBonus;
    if (totalXP > 0) addXP(totalXP);
    if (myPlayer) addTokensEarned(myPlayer.tokens);

    if (myStartup && (valorisationGain > 0 || stakePayoutFcfa > 0)) {
      updateStartup(myStartup.id, { valorisation: valorisationAfter });
      if (userId && !isGuest) {
        updateStartupValorisation(userId, myStartup.id, valorisationAfter).catch((err) => {
          console.warn('[Results] Failed to update startup valorisation:', err);
        });
      }
    }

    const ctx = game.challengeContext;
    if (ctx?.enrollmentId && challengeXpGained > 0) {
      challengeAddXp(ctx.enrollmentId, challengeXpGained);
      checkAndUnlockNextSubLevel(ctx.enrollmentId);
      checkAndUnlockNextLevel(ctx.enrollmentId);

      if (userId && !isGuest) {
        const enrollment = useChallengeStore.getState().enrollments.find((e) => e.id === ctx.enrollmentId);
        if (enrollment) {
          updateChallengeEnrollment(userId, enrollment.challengeId, {
            totalXp: enrollment.totalXp,
            xpByLevel: enrollment.xpByLevel,
            currentLevel: enrollment.currentLevel,
            currentSubLevel: enrollment.currentSubLevel,
            lastPlayedAt: enrollment.lastPlayedAt,
            status: enrollment.status,
          }).catch((err) => {
            console.warn('[Results] Failed to sync challenge progression:', err);
          });
        }
      }
    }

    const programCtx = game.programContext;
    if (programCtx?.sessionId) {
      completeProgramSession(programCtx.sessionId, {
        won: isWinner,
        xpGained,
        tokensEarned: myPlayer?.tokens ?? 0,
      });
    }

    if (userId && !isGuest) {
      updateUserStats(userId, {
        xpGained,
        tokensEarned: myPlayer?.tokens ?? 0,
        won: isWinner,
      }).catch((err) => {
        console.warn('[Results] Failed to update Firestore stats:', err);
      });
    }

    // ===== ACHIEVEMENTS =====
    // Évalue les succès avec les stats APRÈS partie (incréments synchrones déjà faits).
    if (profile) {
      const tokensInGame = myPlayer?.tokens ?? 0;
      const statsAfter = {
        gamesPlayed: profile.gamesPlayed + 1,
        gamesWon: profile.gamesWon + (isWinner ? 1 : 0),
        totalTokensEarned: profile.totalTokensEarned + tokensInGame,
        startupsCreated: profile.startups.length,
        level: profile.level,
        rank: profile.rank,
        // multijoueur : approximé par les parties online (compteur dédié non encore tracké)
        multiplayerGames: isOnline ? profile.gamesPlayed + 1 : 0,
        // compteurs non encore persistés — restent à 0 tant que le tracking n'existe pas
        quizCorrect: 0,
        duelsWon: 0,
        bestWinStreak: 0,
        bestQuizStreak: 0,
      };
      const gameCtx = {
        isWinner,
        tokensInGame,
        turnsPlayed: game.currentTurn ?? 0,
        // approximations prudentes : non débloqué tant que non tracké finement
        noTokensLost: false,
        wasLastThenWon: false,
      };
      const newlyUnlocked = evaluateAchievements(
        profile.achievements,
        statsAfter,
        gameCtx
      );

      if (newlyUnlocked.length > 0) {
        for (const ach of newlyUnlocked) {
          addAchievement(ach.id);
          if (ach.xpReward > 0) addXP(ach.xpReward);
        }
        setUnlockedAchievements(newlyUnlocked);
        // Persiste la liste complète des succès dans Firestore
        if (userId && !isGuest) {
          const allIds = [...profile.achievements, ...newlyUnlocked.map((a) => a.id)];
          updateUserAchievements(userId, allIds).catch((err) => {
            console.warn('[Results] Failed to persist achievements:', err);
          });
        }
      }
    }

    if (game && userId && !isGuest) {
      const gameMode = game.challengeContext || game.programContext ? 'solo' : (game.mode ?? 'solo');
      const finalScores: Record<string, number> = {};
      for (const p of game.players) {
        finalScores[p.id] = p.tokens;
      }
      const startTime = game.createdAt ?? Date.now();
      const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      saveGameSession({
        id: game.id,
        mode: gameMode as 'solo' | 'local' | 'online',
        playerIds: game.players.map((p) => p.id),
        winnerId: game.winner ?? null,
        duration: durationMinutes,
        finalScores,
        createdAt: Date.now(),
      }).catch((err) => {
        console.warn('[Results] Failed to save game session:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  // ===== ANIMATIONS =====
  useEffect(() => {
    // Popup apparait
    popupOpacity.value = withTiming(1, { duration: 300 });
    popupScale.value = withSpring(1, { damping: 14, stiffness: 120 });

    // Icône : entrée spring puis pendule angulaire
    crownScale.value = withSpring(1, { damping: 8, stiffness: 180 });
    crownRotation.value = withDelay(
      200,
      withSequence(
        withTiming(15, { duration: 180, easing: Easing.out(Easing.quad) }),
        withRepeat(
          withSequence(
            withTiming(-15, { duration: 260, easing: Easing.inOut(Easing.quad) }),
            withTiming(15, { duration: 260, easing: Easing.inOut(Easing.quad) }),
          ),
          3,
          true,
        ),
        withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }),
      ),
    );
  }, [crownScale, crownRotation, popupScale, popupOpacity]);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: crownScale.value },
      { rotate: `${crownRotation.value}deg` },
    ],
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: popupScale.value }],
  }));

  // ===== ACTIONS =====
  const handlePlayAgain = () => {
    resetGame();
    router.replace({
      pathname: '/(game)/mode-selection',
      params: { showProgression: '1', xpGained: String(xpGained), valorisationGain: String(valorisationGain) },
    });
  };

  const handleGoHome = () => {
    if (isGuest) {
      setShowConvertPopup(true);
    } else {
      resetGame();
      router.replace({
        pathname: '/(tabs)/home',
        params: { showProgression: '1', xpGained: String(xpGained), valorisationGain: String(valorisationGain) },
      });
    }
  };

  const handleChallengeReplay = () => {
    if (!game?.challengeContext) return;
    const ctx = game.challengeContext;
    const playerId = user?.id || 'player_0';
    resetGame();
    initGame('solo', 'classic', [
      { id: playerId, name: user?.displayName || 'Vous', color: 'green' as const, isAI: false, isHost: true, isConnected: true },
      { id: 'ai_challenge', name: 'IA Challenge', color: 'blue' as const, isAI: true, isHost: false, isConnected: true },
    ], {
      challengeId: ctx.challengeId,
      enrollmentId: ctx.enrollmentId,
      levelNumber: ctx.levelNumber,
      subLevelNumber: ctx.subLevelNumber,
      sectorId: ctx.sectorId,
    });
    const gameId = `challenge_${Date.now()}`;
    router.replace(`/(game)/play/${gameId}`);
  };

  const handleProgramReplay = () => {
    const programId = game?.programContext?.programId ?? params.programId;
    if (!programId) return;
    resetGame();
    router.replace({
      pathname: '/(programs)/play/[programId]',
      params: { programId },
    });
  };

  const handleProgramEnrollSubmit = (formData: ProgramEnrollmentFormData) => {
    const programId = game?.programContext?.programId ?? params.programId;
    if (!programId || !userId) return;
    enrollInProgram(programId, userId, formData, {
      profileId: game?.programContext?.profileId ?? null,
      profileName: game?.programContext?.profileName ?? null,
    });
    setShowProgramEnroll(false);
  };

  const handleNextLevel = () => {
    if (!game?.challengeContext) return;
    const ctx = game.challengeContext;
    const enrollment = enrollments.find((e) => e.id === ctx.enrollmentId);
    if (!enrollment) return;
    const challenge = challenges.find((c) => c.id === ctx.challengeId);
    if (!challenge) return;

    const isUnlocked = enrollment.currentLevel !== ctx.levelNumber || enrollment.currentSubLevel !== ctx.subLevelNumber;
    if (!isUnlocked) {
      const level = challenge.levels.find((l) => l.number === ctx.levelNumber);
      const currentSub = level?.subLevels.find((s) => s.number === ctx.subLevelNumber);
      if (currentSub && level) {
        const currentXp = enrollment.xpByLevel[ctx.levelNumber] ?? 0;
        const remaining = currentSub.xpRequired - currentXp;
        setXpNeededAmount(Math.max(0, remaining));
        setShowXpNeededMessage(true);
      }
      return;
    }

    const playerId = user?.id || 'player_0';
    resetGame();
    initGame('solo', 'classic', [
      { id: playerId, name: user?.displayName || 'Vous', color: 'green' as const, isAI: false, isHost: true, isConnected: true },
      { id: 'ai_challenge', name: 'IA Challenge', color: 'blue' as const, isAI: true, isHost: false, isConnected: true },
    ], {
      challengeId: ctx.challengeId,
      enrollmentId: ctx.enrollmentId,
      levelNumber: enrollment.currentLevel,
      subLevelNumber: enrollment.currentSubLevel,
      sectorId: ctx.sectorId,
    });
    const gameId = `challenge_${Date.now()}`;
    router.replace(`/(game)/play/${gameId}`);
  };

  const handleConvert = () => {
    setShowConvertPopup(false);
    resetGame();
    router.replace('/(auth)/register');
  };

  const handleSkipConvert = () => {
    setShowConvertPopup(false);
    resetGame();
    router.replace('/(tabs)/home');
  };

  // Confetti dots (décoratifs)
  const confettiItems = [
    { top: 60, left: 30, color: '#FFD700', size: 8, rotate: '20deg' },
    { top: 40, left: 80, color: '#FF6B6B', size: 6, rotate: '-15deg' },
    { top: 70, right: 30, color: '#4ECDC4', size: 7, rotate: '45deg' },
    { top: 50, right: 70, color: '#FFD700', size: 5, rotate: '-30deg' },
    { top: 90, left: 50, color: '#FF6B6B', size: 6, rotate: '10deg' },
    { top: 100, right: 50, color: '#4ECDC4', size: 5, rotate: '-20deg' },
  ];

  return (
    <View style={styles.backdrop}>
      <Animated.View style={[styles.popup, popupStyle]}>
        {/* Background gradient radial */}
        <Svg style={StyleSheet.absoluteFill} width={POPUP_WIDTH} height="100%">
          <Defs>
            <RadialGradient id="popupBg" cx="50%" cy="35%" r="75%">
              <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
              <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#popupBg)" rx="24" />
        </Svg>

        {/* Confetti */}
        {confettiItems.map((item, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(400 + i * 80).duration(400)}
            style={[
              styles.confettiDot,
              {
                top: item.top,
                left: 'left' in item ? item.left : undefined,
                right: 'right' in item ? (item as any).right : undefined,
                backgroundColor: item.color,
                width: item.size,
                height: item.size,
                transform: [{ rotate: item.rotate }],
              },
            ]}
          />
        ))}

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <Text style={styles.headerSubtitle}>{subtitleText}</Text>
        </Animated.View>

        {/* Icône : couronne avec shape tournante (victoire) ou smiley triste (défaite) */}
        <View style={styles.iconWrapper}>
          {showCrown && <SpinningShape />}
          <Animated.View style={[styles.iconContainer, crownStyle]}>
            {showCrown ? <CrownIcon /> : <SadFaceIcon />}
          </Animated.View>
        </View>

        {/* Titre principal avec stroke */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.mainTitleWrapper}>
          <OutlinedText
            text={mainTitleText}
            style={[styles.mainTitle, { color: COLORS.text }]}
            outlineColor={showCrown ? COLORS.primary : COLORS.error}
            outlineWidth={1}
          />
        </Animated.View>

        {/* Récap de la mise (parties en ligne avec mise) */}
        {isOnline && stakeFcfa > 0 && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.stakeRecap}>
            <Ionicons
              name={stakePayoutFcfa > 0 ? 'trophy' : 'cash-outline'}
              size={20}
              color={stakePayoutFcfa > 0 ? '#FFBC40' : 'rgba(255,255,255,0.6)'}
            />
            <Text style={styles.stakeRecapText}>
              {stakePayoutFcfa > stakeFcfa
                ? `Mise ${formatPtwRaw(stakeFcfa)} · Tu remportes ${formatPtwRaw(stakePayoutFcfa)} !`
                : stakePayoutFcfa > 0
                  ? `Mise ${formatPtwRaw(stakeFcfa)} · Récupéré ${formatPtwRaw(stakePayoutFcfa)}`
                  : `Mise ${formatPtwRaw(stakeFcfa)} · Perdue cette fois`}
            </Text>
          </Animated.View>
        )}

        {/* Classement */}
        <View style={styles.rankingContainer}>
          {sortedPlayers.map((player, index) => {
            const rank = index + 1;
            const playerXP = getPlayerXP(player, rank);
            const playerColor = COLORS.players[player.color];
            const gradId = `rankGrad_${player.id}`;

            return (
              <Animated.View
                key={player.id}
                entering={FadeInUp.delay(450 + index * 80).duration(350)}
              >
                <RankCard
                  rank={rank}
                  playerColor={playerColor}
                  gradId={gradId}
                  startupName={player.startupName}
                  playerName={player.name}
                  xp={playerXP}
                  isForfeited={(player as { isForfeited?: boolean }).isForfeited}
                />
              </Animated.View>
            );
          })}
        </View>

        {/* XP needed banner (challenge) */}
        {showXpNeededMessage && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.xpNeededBanner}>
            <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
            <Text style={styles.xpNeededText}>
              Il te manque {xpNeededAmount.toLocaleString()} XP pour le niveau suivant
            </Text>
          </Animated.View>
        )}

        {isProgramGame && programProgress && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.programTrialBanner}>
            <Ionicons
              name={programJustCompleted ? 'trophy-outline' : programLevelCleared ? 'arrow-up-circle-outline' : 'refresh-outline'}
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.programTrialText}>
              {programJustCompleted
                ? 'Parcours terminé ! Vous pouvez remplir le formulaire de candidature.'
                : programLevelCleared
                  ? `Niveau réussi ! Niveau ${Math.min(programProgress.currentLevel + 1, programProgress.totalLevels)}/${programProgress.totalLevels} débloqué.`
                  : `Niveau non validé. Rejouez le niveau ${playedLevelIndex + 1}/${programProgress.totalLevels} pour avancer.`}
            </Text>
          </Animated.View>
        )}

        {/* Boutons */}
        <Animated.View
          entering={FadeInUp.delay(650).duration(400)}
          style={styles.actionsContainer}
        >
          {isProgramGame ? (
            <>
              {programJustCompleted ? (
                <>
                  <GameButton variant="yellow" fullWidth title="REMPLIR LE FORMULAIRE" onPress={() => setShowProgramEnroll(true)} />
                  <GameButton variant="blue" fullWidth title="RETOUR À L'ACCUEIL" onPress={handleGoHome} />
                </>
              ) : programLevelCleared ? (
                <>
                  <GameButton variant="yellow" fullWidth title="NIVEAU SUIVANT" onPress={handleProgramReplay} />
                  <GameButton variant="blue" fullWidth title="RETOUR À L'ACCUEIL" onPress={handleGoHome} />
                </>
              ) : (
                <>
                  <GameButton variant="yellow" fullWidth title="REJOUER CE NIVEAU" onPress={handleProgramReplay} />
                  <GameButton variant="blue" fullWidth title="RETOUR À L'ACCUEIL" onPress={handleGoHome} />
                </>
              )}
            </>
          ) : isChallengeGame ? (
            <>
              <GameButton variant="yellow" fullWidth title="REJOUER" onPress={handleChallengeReplay} />
              <GameButton variant="blue" fullWidth title="NIVEAU SUIVANT" onPress={handleNextLevel} />
              <GameButton variant="red" fullWidth title="RETOUR À L'ACCUEIL" onPress={handleGoHome} />
            </>
          ) : (
            <>
              <GameButton variant="yellow" fullWidth title="NOUVELLE PARTIE" onPress={handlePlayAgain} />
              <GameButton variant="blue" fullWidth title="RETOUR À L'ACCUEIL" onPress={handleGoHome} />
            </>
          )}
        </Animated.View>
      </Animated.View>

      {/* Guest Convert Modal */}
      <Modal
        visible={showConvertPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConvertPopup(false)}
      >
        <View style={styles.convertBackdrop}>
          <View style={styles.convertCard}>
            <View style={styles.convertIconCircle}>
              <Ionicons name="person-add" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.convertTitle}>Sauvegarder ta progression ?</Text>
            <Text style={styles.convertBody}>
              Cree un compte pour conserver tes XP, ton projet et acceder au mode en ligne !
            </Text>
            <GameButton variant="yellow" fullWidth title="CREER UN COMPTE" onPress={handleConvert} />
            <Pressable style={styles.convertSkip} onPress={handleSkipConvert}>
              <Text style={styles.convertSkipText}>Plus tard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Popup de déblocage de succès — affiché par-dessus les résultats */}
      <AchievementUnlockedPopup
        achievements={unlockedAchievements}
        onClose={() => setUnlockedAchievements([])}
      />

      {resultProgram && (
        <ProgramEnrollmentModal
          visible={showProgramEnroll}
          programName={resultProgram.name}
          defaultFullName={user?.displayName}
          defaultEmail={user?.email}
          endForm={resultProgram.endForm}
          onSubmit={handleProgramEnrollSubmit}
          onClose={() => setShowProgramEnroll(false)}
        />
      )}
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  // Backdrop plein écran sombre
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },

  // Carte popup
  popup: {
    width: POPUP_WIDTH,
    backgroundColor: '#081A2A',
    borderRadius: 24,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[5],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
    maxHeight: screenHeight * 0.85,
    overflow: 'hidden',
  },

  // Confetti
  confettiDot: {
    position: 'absolute',
    borderRadius: 2,
  },

  // Header
  header: {
    marginBottom: SPACING[1],
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },

  // Wrapper icône + shape tournante
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    zIndex: 1,
  },

  // Titre principal
  mainTitleWrapper: {
    alignSelf: 'center',
    marginBottom: SPACING[4],
  },
  mainTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Classement
  stakeRecap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255,188,64,0.10)',
    borderRadius: 14,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
    width: '100%',
  },
  stakeRecapText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    textAlign: 'center',
    flexShrink: 1,
  },
  rankingContainer: {
    width: '100%',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
    gap: SPACING[3],
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rankNumber: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  rankSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  rankXP: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },

  // XP needed
  xpNeededBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.12)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 10,
    marginBottom: SPACING[3],
    width: '100%',
  },
  xpNeededText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  programTrialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.10)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 10,
    marginBottom: SPACING[3],
    width: '100%',
  },
  programTrialText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },

  // Boutons
  actionsContainer: {
    width: '100%',
    gap: SPACING[3],
  },

  // Convert popup
  convertBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  convertCard: {
    width: Math.min(screenWidth - SPACING[4] * 2, 340),
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  convertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  convertTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  convertBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[5],
  },
  convertSkip: {
    marginTop: SPACING[3],
  },
  convertSkipText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
