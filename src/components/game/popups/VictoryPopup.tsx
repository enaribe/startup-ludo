/**
 * VictoryPopup - Popup de victoire avec animations de célébration
 */

import { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
  FadeIn,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import type { Player } from '@/types';

interface VictoryPopupProps {
  visible: boolean;
  winner: Player | null;
  players: Player[];
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const VictoryPopup = memo(function VictoryPopup({
  visible,
  winner,
  players,
  onPlayAgain,
  onGoHome,
}: VictoryPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  // Animation values
  const trophyScale = useSharedValue(0);
  const trophyRotation = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const starScale = useSharedValue(0);

  useEffect(() => {
    if (visible && winner) {
      // Haptic feedback
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Trophy animation
      trophyScale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );

      trophyRotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withRepeat(withSequence(
          withTiming(10, { duration: 200 }),
          withTiming(-10, { duration: 200 })
        ), 3, true),
        withTiming(0, { duration: 100 })
      );

      // Confetti
      confettiOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));

      // Stars
      starScale.value = withDelay(500, withSpring(1, { damping: 10 }));
    } else {
      trophyScale.value = 0;
      trophyRotation.value = 0;
      confettiOpacity.value = 0;
      starScale.value = 0;
    }
  }, [visible, winner, hapticsEnabled, trophyScale, trophyRotation, confettiOpacity, starScale]);

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotation.value}deg` },
    ],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  // Sort players by tokens for leaderboard
  const sortedPlayers = [...players].sort((a, b) => b.tokens - a.tokens);

  if (!winner) return null;

  return (
    <Modal visible={visible} onClose={() => {}} closeOnBackdrop={false}>
      <Animated.View entering={ZoomIn.duration(300)} style={styles.container}>
        {/* Confetti background */}
        <Animated.View style={[styles.confettiContainer, confettiStyle]}>
          {[...Array(12)].map((_, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(i * 50)}
              style={[
                styles.confetti,
                {
                  left: `${(i % 4) * 30 + 5}%`,
                  top: `${Math.floor(i / 4) * 25 + 5}%`,
                  backgroundColor: [
                    COLORS.primary,
                    COLORS.success,
                    COLORS.info,
                    COLORS.warning,
                  ][i % 4],
                  transform: [{ rotate: `${i * 30}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Stars */}
        <Animated.View style={[styles.starsContainer, starStyle]}>
          <Ionicons name="star" size={24} color={COLORS.warning} style={styles.starLeft} />
          <Ionicons name="star" size={24} color={COLORS.warning} style={styles.starRight} />
        </Animated.View>

        {/* Trophy */}
        <Animated.View style={[styles.trophyContainer, trophyStyle]}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={60} color={COLORS.warning} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={SlideInUp.delay(200).duration(280)}
          style={styles.title}
        >
          Victoire !
        </Animated.Text>

        {/* Winner Info */}
        <Animated.View
          entering={FadeIn.delay(400)}
          style={styles.winnerContainer}
        >
          <Avatar
            name={winner.name}
            playerColor={winner.color}
            size="lg"
            showBorder
          />
          <Text style={[styles.winnerName, { color: COLORS.players[winner.color] }]}>
            {winner.name}
          </Text>
          <View style={styles.winnerStats}>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{winner.tokens}</Text>
              <Text style={styles.statLabel}>jetons</Text>
            </View>
          </View>
        </Animated.View>

        {/* Leaderboard */}
        <Animated.View
          entering={FadeIn.delay(600)}
          style={styles.leaderboard}
        >
          <Text style={styles.leaderboardTitle}>Classement final</Text>
          {sortedPlayers.map((player, index) => (
            <View
              key={player.id}
              style={[
                styles.leaderboardItem,
                index === 0 && styles.leaderboardItemFirst,
              ]}
            >
              <View style={styles.leaderboardRank}>
                {index === 0 ? (
                  <Ionicons name="trophy" size={16} color={COLORS.warning} />
                ) : (
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                )}
              </View>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: COLORS.players[player.color] },
                ]}
              />
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerTokens}>{player.tokens}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeIn.delay(800)}
          style={styles.actions}
        >
          <Button
            title="Rejouer"
            variant="primary"
            size="lg"
            fullWidth
            onPress={onPlayAgain}
            leftIcon={<Ionicons name="refresh" size={20} color={COLORS.white} />}
          />
          <Button
            title="Retour à l'accueil"
            variant="outline"
            size="md"
            fullWidth
            onPress={onGoHome}
            style={styles.homeButton}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: SPACING[6],
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  starsContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[6],
  },
  starLeft: {
    transform: [{ rotate: '-15deg' }],
  },
  starRight: {
    transform: [{ rotate: '15deg' }],
  },
  trophyContainer: {
    marginBottom: SPACING[4],
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.warning,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  winnerContainer: {
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  winnerName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    marginTop: SPACING[2],
  },
  winnerStats: {
    flexDirection: 'row',
    marginTop: SPACING[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  leaderboard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  leaderboardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  leaderboardItemFirst: {
    backgroundColor: `${COLORS.warning}10`,
    marginHorizontal: -SPACING[3],
    paddingHorizontal: SPACING[3],
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  leaderboardRank: {
    width: 24,
    alignItems: 'center',
  },
  rankNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: SPACING[2],
  },
  playerName: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginLeft: SPACING[2],
  },
  playerTokens: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  actions: {
    width: '100%',
    gap: SPACING[3],
  },
  homeButton: {
    marginTop: SPACING[1],
  },
});
