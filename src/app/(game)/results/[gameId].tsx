/**
 * game-result - Écran de fin de partie
 *
 * Affiche: gagnant, XP, valorisation projet, cagnotte (online), classement
 * Boutons: Nouvelle partie, Retour à l'accueil
 * ConvertGuestPopup pour invités
 * Design system: RadialBackground, DynamicGradientBorder, GameButton, StyleSheet
 */

import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Avatar } from '@/components/ui/Avatar';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { useGameStore, useAuthStore, useUserStore } from '@/stores';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

const PLAYER_COLORS: Record<string, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#FF6B6B',
};

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

  const isGuest = user?.isGuest ?? true;
  const isOnline = params.isOnline === 'true' || params.mode === 'online';

  const [showConvertPopup, setShowConvertPopup] = useState(false);

  const xpAnimValue = useSharedValue(0);
  const valorisationAnimValue = useSharedValue(0);

  const winner = game?.players.find((p) => p.id === game.winner);
  const sortedPlayers =
    game?.players.slice().sort((a, b) => b.tokens - a.tokens) ?? [];

  const xpGained = winner ? Math.floor(winner.tokens * 0.5) : 0;
  const xpDetails = {
    victoire: winner?.id === (profile?.userId ?? user?.id) ? 100 : 0,
    jetons: Math.floor((winner?.tokens ?? 0) * 0.3),
    questions: Math.floor(Math.random() * 50) + 20,
  };

  const valorisationBefore = profile?.startups?.[0]?.tokensInvested ?? 50000;
  const valorisationGain = isOnline ? xpGained * 100 : xpGained * 50;
  const valorisationAfter = valorisationBefore + valorisationGain;

  const cagnotte = isOnline ? (game?.players.length ?? 0) * 100 : 0;

  useEffect(() => {
    xpAnimValue.value = withDelay(
      500,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
    valorisationAnimValue.value = withDelay(
      800,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpAnimValue.value,
    transform: [{ scale: 0.8 + xpAnimValue.value * 0.2 }],
  }));

  const valorisationStyle = useAnimatedStyle(() => ({
    opacity: valorisationAnimValue.value,
    transform: [{ translateY: (1 - valorisationAnimValue.value) * 20 }],
  }));

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

      <Animated.View
        entering={FadeInDown.delay(200).duration(1000)}
        style={styles.victoryGlow}
      >
        <Svg width={300} height={300}>
          <Defs>
            <RadialGradient id="victoryGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFBC40" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#FFBC40" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={150} cy={150} r={150} fill="url(#victoryGrad)" />
        </Svg>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + SPACING[4],
            paddingBottom: insets.bottom + SPACING[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerBlock}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={50} color={COLORS.background} />
          </View>
          <Text style={styles.title}>Partie terminée !</Text>
        </Animated.View>

        {winner && (
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.sectionWrapper}>
            <DynamicGradientBorder
              borderRadius={20}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
              style={[styles.winnerCardBorder, { borderColor: PLAYER_COLORS[winner.color] ?? COLORS.primary }]}
            >
              <View style={styles.winnerCard}>
                <Text style={styles.winnerLabel}>🏆 Vainqueur</Text>
                <Avatar
                  name={winner.name}
                  playerColor={winner.color}
                  size="lg"
                  showBorder
                />
                <Text style={[styles.winnerName, { color: PLAYER_COLORS[winner.color] ?? COLORS.primary }]}>
                  {winner.name}
                </Text>
                {winner.startupName && (
                  <Text style={styles.winnerStartup}>{winner.startupName}</Text>
                )}
                <View style={styles.winnerTokensBadge}>
                  <Ionicons name="cash" size={20} color="#FFBC40" />
                  <Text style={styles.winnerTokensText}>{winner.tokens} jetons</Text>
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        <Animated.View style={[styles.sectionWrapper, xpStyle]}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.xpBlock}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpTitle}>XP gagnée</Text>
                <View style={styles.xpBadge}>
                  <Ionicons name="star" size={16} color="#4CAF50" />
                  <Text style={styles.xpBadgeText}>+{xpGained} XP</Text>
                </View>
              </View>
              <View style={styles.xpRows}>
                {xpDetails.victoire > 0 && (
                  <View style={styles.xpRow}>
                    <Text style={styles.xpRowLabel}>Victoire</Text>
                    <Text style={styles.xpRowValue}>+{xpDetails.victoire}</Text>
                  </View>
                )}
                <View style={styles.xpRow}>
                  <Text style={styles.xpRowLabel}>Jetons collectés</Text>
                  <Text style={styles.xpRowValue}>+{xpDetails.jetons}</Text>
                </View>
                <View style={styles.xpRow}>
                  <Text style={styles.xpRowLabel}>Questions réussies</Text>
                  <Text style={styles.xpRowValue}>+{xpDetails.questions}</Text>
                </View>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        <Animated.View style={[styles.sectionWrapper, valorisationStyle]}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.valorisationBlock}>
              <Text style={styles.valorisationTitle}>Valorisation du projet</Text>
              <View style={styles.valorisationRow}>
                <View style={styles.valorisationCol}>
                  <Text style={styles.valorisationLabel}>Avant</Text>
                  <Text style={styles.valorisationValue}>{valorisationBefore.toLocaleString('fr-FR')} €</Text>
                </View>
                <View style={styles.valorisationCol}>
                  <Ionicons name="arrow-forward" size={24} color="#4CAF50" />
                  <Text style={styles.valorisationGain}>+{valorisationGain.toLocaleString('fr-FR')} €</Text>
                </View>
                <View style={styles.valorisationCol}>
                  <Text style={styles.valorisationLabel}>Après</Text>
                  <Text style={styles.valorisationAfter}>{valorisationAfter.toLocaleString('fr-FR')} €</Text>
                </View>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {isOnline && cagnotte > 0 && (
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.sectionWrapper}>
            <DynamicGradientBorder
              borderRadius={20}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
              style={styles.cagnotteBorder}
            >
              <View style={styles.cagnotteRow}>
                <View style={styles.cagnotteLeft}>
                  <Ionicons name="gift" size={24} color="#FFBC40" />
                  <Text style={styles.cagnotteTitle}>Cagnotte</Text>
                </View>
                <Text style={styles.cagnotteValue}>{cagnotte} jetons</Text>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.rankingWrapper}>
          <Text style={styles.rankingTitle}>Classement</Text>
          <View style={styles.rankingList}>
            {sortedPlayers.map((player, index) => (
              <DynamicGradientBorder
                key={player.id}
                borderRadius={14}
                fill="rgba(0, 0, 0, 0.35)"
                boxWidth={contentWidth - 24}
                style={styles.rankingRowBorder}
              >
                <View style={[styles.rankingRow, { borderLeftColor: PLAYER_COLORS[player.color] ?? COLORS.primary }]}>
                  <Text style={[styles.rankingRank, index === 0 && styles.rankingRankFirst]}>
                    {index + 1}
                  </Text>
                  <Avatar name={player.name} playerColor={player.color} size="sm" />
                  <View style={styles.rankingPlayerInfo}>
                    <Text style={styles.rankingPlayerName}>{player.name}</Text>
                    {player.startupName && (
                      <Text style={styles.rankingPlayerStartup}>{player.startupName}</Text>
                    )}
                  </View>
                  <View style={styles.rankingPlayerTokens}>
                    <Text style={styles.rankingTokensValue}>{player.tokens}</Text>
                    <Text style={styles.rankingTokensLabel}>jetons</Text>
                  </View>
                </View>
              </DynamicGradientBorder>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(600)} style={styles.actionsBlock}>
          <GameButton
            variant="yellow"
            fullWidth
            title="NOUVELLE PARTIE"
            onPress={handlePlayAgain}
          />
          <Pressable style={styles.backButton} onPress={handleGoHome}>
            <Text style={styles.backButtonText}>Retour à l'accueil</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

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
            style={styles.modalCardBorder}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="person-add" size={32} color="#FFBC40" />
              </View>
              <Text style={styles.modalTitle}>Sauvegarder ta progression ?</Text>
              <Text style={styles.modalBody}>
                Crée un compte pour conserver tes XP, ton projet et accéder au mode en ligne !
              </Text>
              <GameButton
                variant="yellow"
                fullWidth
                title="CRÉER UN COMPTE"
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
  victoryGlow: {
    position: 'absolute',
    top: -50,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    opacity: 0.4,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: SPACING[6],
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
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
  sectionWrapper: {
    marginBottom: SPACING[4],
  },
  winnerCardBorder: {
    borderWidth: 2,
  },
  winnerCard: {
    alignItems: 'center',
    padding: SPACING[5],
  },
  winnerLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[3],
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
  winnerTokensBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[3],
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
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
  xpBlock: {
    padding: SPACING[4],
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  xpTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
    gap: SPACING[1],
  },
  xpBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
  },
  xpRows: {
    gap: SPACING[2],
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpRowLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  xpRowValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  valorisationBlock: {
    padding: SPACING[4],
  },
  valorisationTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  valorisationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valorisationCol: {
    alignItems: 'center',
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
  valorisationGain: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  valorisationAfter: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
  },
  cagnotteBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
  },
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
  rankingWrapper: {
    marginBottom: SPACING[6],
  },
  rankingTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  rankingList: {
    gap: SPACING[2],
  },
  rankingRowBorder: {
    width: '100%',
    overflow: 'hidden',
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    borderLeftWidth: 4,
  },
  rankingRank: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    width: 30,
  },
  rankingRankFirst: {
    color: COLORS.primary,
  },
  rankingPlayerInfo: {
    flex: 1,
    marginLeft: SPACING[3],
  },
  rankingPlayerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  rankingPlayerStartup: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  rankingPlayerTokens: {
    alignItems: 'flex-end',
  },
  rankingTokensValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
  },
  rankingTokensLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  actionsBlock: {
    gap: SPACING[3],
  },
  backButton: {
    paddingVertical: SPACING[4],
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  modalCardBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.2)',
  },
  modalCard: {
    padding: SPACING[6],
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
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
