/**
 * game-result - Ecran de fin de partie
 *
 * Affiche: gagnant, XP, valorisation projet, cagnotte (online), classement
 * Applique XP + stats au profil local (Zustand) et distant (Firestore)
 * Design system: RadialBackground, DynamicGradientBorder, GameButton, COLORS/FONTS/SPACING
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Avatar } from '@/components/ui/Avatar';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { useGameStore, useAuthStore, useUserStore } from '@/stores';
import { XP_REWARDS } from '@/config/progression';
import { updateUserStats } from '@/services/firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

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

  // Always: game played
  breakdown.push({
    label: 'Partie jouee',
    icon: 'game-controller',
    amount: XP_REWARDS.GAME_PLAYED!.amount,
  });

  // Win
  if (userId && winnerId === userId) {
    breakdown.push({
      label: 'Victoire',
      icon: 'trophy',
      amount: XP_REWARDS.GAME_WON!.amount,
    });
  } else if (playerRank <= 3 && totalPlayers >= 3) {
    // Podium (2nd or 3rd)
    breakdown.push({
      label: `${playerRank}e place`,
      icon: 'medal',
      amount: XP_REWARDS.GAME_PODIUM!.amount,
    });
  }

  // Token milestones
  if (playerTokens >= 50) {
    breakdown.push({
      label: '50+ jetons',
      icon: 'cash',
      amount: XP_REWARDS.TOKEN_MILESTONE_50!.amount,
    });
  } else if (playerTokens >= 25) {
    breakdown.push({
      label: '25+ jetons',
      icon: 'cash',
      amount: XP_REWARDS.TOKEN_MILESTONE_25!.amount,
    });
  } else if (playerTokens >= 10) {
    breakdown.push({
      label: '10+ jetons',
      icon: 'cash',
      amount: XP_REWARDS.TOKEN_MILESTONE_10!.amount,
    });
  }

  const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
  return { total, breakdown };
}

// ===== COMPONENT =====

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    gameId: string;
    mode?: string;
    isOnline?: string;
  }>();

  const { game, resetGame } = useGameStore();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const addXP = useUserStore((s) => s.addXP);
  const incrementGamesPlayed = useUserStore((s) => s.incrementGamesPlayed);
  const incrementGamesWon = useUserStore((s) => s.incrementGamesWon);
  const addTokensEarned = useUserStore((s) => s.addTokensEarned);

  const isGuest = user?.isGuest ?? true;
  const isOnline = params.isOnline === 'true' || params.mode === 'online';
  const hasAppliedRewards = useRef(false);

  const [showConvertPopup, setShowConvertPopup] = useState(false);

  // Animations
  const xpAnimValue = useSharedValue(0);
  const valorisationAnimValue = useSharedValue(0);
  const trophyScale = useSharedValue(0);

  // Game data
  const winner = game?.players.find((p) => p.id === game.winner);
  const sortedPlayers =
    game?.players.slice().sort((a, b) => b.tokens - a.tokens) ?? [];

  // Find current user's player
  const userId = profile?.userId ?? user?.id;
  const myPlayer = game?.players.find((p) => p.id === userId);
  const myRank = myPlayer ? sortedPlayers.findIndex((p) => p.id === myPlayer.id) + 1 : 0;
  const isWinner = userId != null && game?.winner === userId;

  // XP calculation
  const { total: xpGained, breakdown: xpBreakdown } = computeXP(
    userId,
    game?.winner,
    myPlayer?.tokens ?? 0,
    myRank,
    sortedPlayers.length,
  );

  // Valorisation
  const valorisationBefore = profile?.startups?.[0]?.tokensInvested ?? 50000;
  const valorisationGain = isOnline ? xpGained * 100 : xpGained * 50;
  const valorisationAfter = valorisationBefore + valorisationGain;

  // Cagnotte (online only)
  const cagnotte = isOnline ? (game?.players.length ?? 0) * 100 : 0;

  // ===== APPLY REWARDS =====
  useEffect(() => {
    if (hasAppliedRewards.current) return;
    if (!game || game.status !== 'finished') return;
    hasAppliedRewards.current = true;

    // 1. Local store updates
    incrementGamesPlayed();
    if (isWinner) incrementGamesWon();
    if (xpGained > 0) addXP(xpGained);
    if (myPlayer) addTokensEarned(myPlayer.tokens);

    // 2. Firestore update (non-blocking, guests excluded)
    if (userId && !isGuest) {
      updateUserStats(userId, {
        xpGained,
        tokensEarned: myPlayer?.tokens ?? 0,
        won: isWinner,
      }).catch((err) => {
        console.warn('[Results] Failed to update Firestore stats:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  // ===== ANIMATIONS =====
  useEffect(() => {
    trophyScale.value = withDelay(
      200,
      withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 200 }),
      ),
    );
    xpAnimValue.value = withDelay(
      600,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
    valorisationAnimValue.value = withDelay(
      900,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
  }, [trophyScale, xpAnimValue, valorisationAnimValue]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpAnimValue.value,
    transform: [{ scale: 0.85 + xpAnimValue.value * 0.15 }],
  }));

  const valorisationStyle = useAnimatedStyle(() => ({
    opacity: valorisationAnimValue.value,
    transform: [{ translateY: (1 - valorisationAnimValue.value) * 20 }],
  }));

  // ===== ACTIONS =====
  const handlePlayAgain = () => {
    resetGame();
    router.replace('/(game)/mode-selection');
  };

  const handleGoHome = () => {
    if (isGuest) {
      setShowConvertPopup(true);
    } else {
      resetGame();
      router.replace('/(tabs)/home');
    }
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

  return (
    <View style={styles.container}>
      <RadialBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + SPACING[6],
            paddingBottom: insets.bottom + SPACING[8],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Trophy + Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerBlock}>
          <Animated.View style={[styles.trophyCircle, trophyStyle]}>
            <Ionicons name="trophy" size={44} color={COLORS.background} />
          </Animated.View>
          <Text style={styles.title}>Partie terminee !</Text>
          <Text style={styles.subtitle}>
            {isOnline ? 'Multijoueur en ligne' : 'Partie locale'}
          </Text>
        </Animated.View>

        {/* Winner Card */}
        {winner && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <DynamicGradientBorder
              borderRadius={20}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
            >
              <View style={styles.winnerCard}>
                <View style={styles.winnerBadge}>
                  <Ionicons name="trophy" size={14} color={COLORS.primary} />
                  <Text style={styles.winnerBadgeText}>VAINQUEUR</Text>
                </View>
                <Avatar
                  name={winner.name}
                  playerColor={winner.color}
                  size="lg"
                  showBorder
                />
                <Text style={[styles.winnerName, { color: COLORS.players[winner.color] }]}>
                  {winner.name}
                </Text>
                {winner.startupName && (
                  <Text style={styles.winnerStartup}>{winner.startupName}</Text>
                )}
                <View style={styles.winnerTokensRow}>
                  <Ionicons name="cash" size={18} color={COLORS.primary} />
                  <Text style={styles.winnerTokensText}>{winner.tokens} jetons</Text>
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        {/* XP Gained */}
        <Animated.View style={[styles.section, xpStyle]}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.xpBlock}>
              <View style={styles.xpHeader}>
                <View style={styles.xpTitleRow}>
                  <Ionicons name="star" size={18} color={COLORS.success} />
                  <Text style={styles.xpTitle}>XP gagnee</Text>
                </View>
                <View style={styles.xpTotalBadge}>
                  <Text style={styles.xpTotalText}>+{xpGained}</Text>
                </View>
              </View>
              <View style={styles.xpDivider} />
              <View style={styles.xpRows}>
                {xpBreakdown.map((item, i) => (
                  <View key={i} style={styles.xpRow}>
                    <View style={styles.xpRowLeft}>
                      <Ionicons name={item.icon} size={14} color={COLORS.textSecondary} />
                      <Text style={styles.xpRowLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.xpRowValue}>+{item.amount}</Text>
                  </View>
                ))}
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Valorisation */}
        <Animated.View style={[styles.section, valorisationStyle]}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.valorisationBlock}>
              <View style={styles.valorisationHeader}>
                <Ionicons name="trending-up" size={18} color={COLORS.success} />
                <Text style={styles.valorisationTitle}>Valorisation du projet</Text>
              </View>
              <View style={styles.valorisationRow}>
                <View style={styles.valorisationCol}>
                  <Text style={styles.valorisationLabel}>Avant</Text>
                  <Text style={styles.valorisationValue}>
                    {valorisationBefore.toLocaleString('fr-FR')} C
                  </Text>
                </View>
                <View style={styles.valorisationArrow}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.success} />
                  <Text style={styles.valorisationGain}>
                    +{valorisationGain.toLocaleString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.valorisationCol}>
                  <Text style={styles.valorisationLabel}>Apres</Text>
                  <Text style={styles.valorisationAfterText}>
                    {valorisationAfter.toLocaleString('fr-FR')} C
                  </Text>
                </View>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Cagnotte (online only) */}
        {isOnline && cagnotte > 0 && (
          <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.section}>
            <DynamicGradientBorder
              borderRadius={16}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
            >
              <View style={styles.cagnotteRow}>
                <View style={styles.cagnotteLeft}>
                  <Ionicons name="gift" size={22} color={COLORS.primary} />
                  <Text style={styles.cagnotteTitle}>Cagnotte</Text>
                </View>
                <Text style={styles.cagnotteValue}>{cagnotte} jetons</Text>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        {/* Classement de la partie */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.rankingSection}>
          <Text style={styles.rankingTitle}>Classement</Text>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.rankingInner}>
              {sortedPlayers.map((player, index) => {
                const playerColor = COLORS.players[player.color];
                const isFirst = index === 0;
                const isMe = player.id === userId;

                return (
                  <View
                    key={player.id}
                    style={[
                      styles.rankingRow,
                      isMe && styles.rankingRowMe,
                      index < sortedPlayers.length - 1 && styles.rankingRowBorder,
                    ]}
                  >
                    {/* Rank number */}
                    <View style={[styles.rankBadge, { backgroundColor: isFirst ? COLORS.primary : 'rgba(255,255,255,0.08)' }]}>
                      <Text style={[styles.rankNumber, isFirst && { color: COLORS.background }]}>
                        {index + 1}
                      </Text>
                    </View>

                    {/* Avatar */}
                    <Avatar name={player.name} playerColor={player.color} size="sm" />

                    {/* Player info */}
                    <View style={styles.rankPlayerInfo}>
                      <Text style={[styles.rankPlayerName, { color: isFirst ? playerColor : COLORS.text }]}>
                        {player.name}
                      </Text>
                      {player.startupName && (
                        <Text style={styles.rankPlayerStartup}>{player.startupName}</Text>
                      )}
                    </View>

                    {/* Tokens */}
                    <View style={styles.rankTokens}>
                      <Text style={styles.rankTokenValue}>{player.tokens}</Text>
                      <Text style={styles.rankTokenLabel}>jetons</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(900).duration(500)} style={styles.actionsBlock}>
          <GameButton
            variant="yellow"
            fullWidth
            title="NOUVELLE PARTIE"
            onPress={handlePlayAgain}
          />
          <Pressable style={styles.backButton} onPress={handleGoHome}>
            <Text style={styles.backButtonText}>Retour a l'accueil</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Guest Convert Modal */}
      <Modal
        visible={showConvertPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConvertPopup(false)}
      >
        <View style={styles.modalBackdrop}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(12, 36, 62, 0.98)"
            boxWidth={Math.min(screenWidth - SPACING[4] * 2, 340)}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="person-add" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Sauvegarder ta progression ?</Text>
              <Text style={styles.modalBody}>
                Cree un compte pour conserver tes XP, ton projet et acceder au mode en ligne !
              </Text>
              <GameButton
                variant="yellow"
                fullWidth
                title="CREER UN COMPTE"
                onPress={handleConvert}
              />
              <Pressable style={styles.modalSkip} onPress={handleSkipConvert}>
                <Text style={styles.modalSkipText}>Plus tard</Text>
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </View>
      </Modal>
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
  },

  // Header
  headerBlock: {
    alignItems: 'center',
    marginBottom: SPACING[5],
  },
  trophyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING[1],
  },

  // Sections
  section: {
    marginBottom: SPACING[3],
  },

  // Winner card
  winnerCard: {
    alignItems: 'center',
    padding: SPACING[5],
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
    gap: SPACING[1],
    marginBottom: SPACING[3],
  },
  winnerBadgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  winnerName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    marginTop: SPACING[3],
  },
  winnerStartup: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING[1],
  },
  winnerTokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[3],
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 20,
    gap: SPACING[2],
  },
  winnerTokensText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },

  // XP Block
  xpBlock: {
    padding: SPACING[4],
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  xpTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  xpTotalBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  xpTotalText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
  },
  xpDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: SPACING[3],
  },
  xpRows: {
    gap: SPACING[2],
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  xpRowLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  xpRowValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },

  // Valorisation
  valorisationBlock: {
    padding: SPACING[4],
  },
  valorisationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  valorisationTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  valorisationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valorisationCol: {
    alignItems: 'center',
    flex: 1,
  },
  valorisationLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  valorisationValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  valorisationArrow: {
    alignItems: 'center',
  },
  valorisationGain: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    marginTop: 2,
  },
  valorisationAfterText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
  },

  // Cagnotte
  cagnotteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
  },
  cagnotteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  cagnotteTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  cagnotteValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
  },

  // Ranking
  rankingSection: {
    marginBottom: SPACING[5],
  },
  rankingTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  rankingInner: {
    padding: SPACING[2],
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
    gap: SPACING[3],
  },
  rankingRowMe: {
    backgroundColor: 'rgba(255, 188, 64, 0.06)',
    borderRadius: 12,
  },
  rankingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  rankPlayerInfo: {
    flex: 1,
  },
  rankPlayerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
  },
  rankPlayerStartup: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  rankTokens: {
    alignItems: 'flex-end',
  },
  rankTokenValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  rankTokenLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textSecondary,
  },

  // Actions
  actionsBlock: {
    gap: SPACING[3],
  },
  backButton: {
    paddingVertical: SPACING[4],
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalCard: {
    padding: SPACING[6],
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  modalTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  modalBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[5],
  },
  modalSkip: {
    marginTop: SPACING[3],
  },
  modalSkipText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
