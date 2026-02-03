import { Avatar } from '@/components/ui/Avatar';
import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { DuelResult, Player } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
} from 'react-native-reanimated';

interface DuelResultPopupProps {
  visible: boolean;
  result: DuelResult | null;
  challenger: Player | null;
  opponent: Player | null;
  currentPlayerId: string;
  onClose: () => void;
}

export const DuelResultPopup = memo(function DuelResultPopup({
  visible,
  result,
  challenger,
  opponent,
  currentPlayerId,
  onClose,
}: DuelResultPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const badgeScale = useSharedValue(0);
  const scoresOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && result) {
      badgeScale.value = withSpring(1, { damping: 8, stiffness: 150 });
      scoresOpacity.value = withDelay(300, withSpring(1));

      if (hapticsEnabled) {
        const isWinner = result.winnerId === currentPlayerId;
        const isDraw = result.winnerId === null;

        if (isWinner) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (isDraw) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } else {
      badgeScale.value = 0;
      scoresOpacity.value = 0;
    }
  }, [visible, result, hapticsEnabled, currentPlayerId, badgeScale, scoresOpacity]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const scoresStyle = useAnimatedStyle(() => ({
    opacity: scoresOpacity.value,
  }));

  if (!result || !challenger || !opponent) return null;

  const isDraw = result.winnerId === null;
  const isCurrentPlayerWinner = result.winnerId === currentPlayerId;
  const isCurrentPlayerChallenger = currentPlayerId === challenger.id;
  const currentPlayerReward = isCurrentPlayerChallenger ? result.challengerReward : result.opponentReward;

  const statusText = isDraw ? 'ÉGALITÉ' : isCurrentPlayerWinner ? 'VICTOIRE' : 'DÉFAITE';
  const statusColor = isDraw ? COLORS.warning : isCurrentPlayerWinner ? COLORS.success : COLORS.error;
  const statusIcon = isDraw ? 'swap-horizontal' : isCurrentPlayerWinner ? 'trophy' : 'close-circle';

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.springify().damping(18)} style={styles.card}>
        <View style={styles.content}>
          {/* Badge de résultat */}
          <Animated.View style={[styles.resultBadge, { backgroundColor: statusColor }, badgeStyle]}>
            <Ionicons name={statusIcon as any} size={48} color={COLORS.white} />
            <Text style={styles.resultText}>{statusText}</Text>
          </Animated.View>

          {/* Scores */}
          <Animated.View style={[styles.scoresSection, scoresStyle]}>
            {/* Challenger */}
            <View style={styles.playerScore}>
              <Avatar
                name={challenger.name}
                playerColor={challenger.color}
                size="md"
                showBorder
              />
              <Text style={styles.playerScoreName}>{challenger.startupName}</Text>
              <Text style={[styles.scoreValue, result.challengerScore > result.opponentScore && styles.scoreWinner]}>
                {result.challengerScore} pts
              </Text>
            </View>

            <View style={styles.vsIndicator}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            {/* Opponent */}
            <View style={styles.playerScore}>
              <Avatar
                name={opponent.name}
                playerColor={opponent.color}
                size="md"
                showBorder
              />
              <Text style={styles.playerScoreName}>{opponent.startupName}</Text>
              <Text style={[styles.scoreValue, result.opponentScore > result.challengerScore && styles.scoreWinner]}>
                {result.opponentScore} pts
              </Text>
            </View>
          </Animated.View>

          {/* Récompense */}
          <View style={styles.rewardSection}>
            <Text style={styles.rewardLabel}>
              {currentPlayerReward > 0 ? 'Tu gagnes' : 'Pas de jetons'}
            </Text>
            {currentPlayerReward > 0 && (
              <View style={[styles.rewardBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.rewardText}>+{currentPlayerReward} jetons</Text>
              </View>
            )}
          </View>

          {/* Bouton */}
          <View style={styles.buttonWrapper}>
            <GameButton
              title="Continuer"
              onPress={onClose}
              variant="blue"
              fullWidth
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  content: {
    paddingTop: SPACING[6],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  resultBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[6],
    borderRadius: BORDER_RADIUS['2xl'],
    marginBottom: SPACING[5],
    ...SHADOWS.lg,
  },
  resultText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    marginTop: SPACING[2],
    letterSpacing: 2,
  },
  scoresSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING[5],
  },
  playerScore: {
    flex: 1,
    alignItems: 'center',
  },
  playerScoreName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    marginTop: SPACING[2],
    textAlign: 'center',
    maxWidth: 80,
  },
  scoreValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#8E99A4',
    marginTop: SPACING[1],
  },
  scoreWinner: {
    color: COLORS.success,
  },
  vsIndicator: {
    paddingHorizontal: SPACING[2],
  },
  vsText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
  },
  rewardSection: {
    alignItems: 'center',
    marginBottom: SPACING[5],
  },
  rewardLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
    marginBottom: SPACING[2],
  },
  rewardBadge: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: BORDER_RADIUS.full,
  },
  rewardText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  buttonWrapper: {
    width: '100%',
  },
});
