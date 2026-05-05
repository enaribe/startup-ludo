import { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { DuelHeader, VsBadge } from '@/components/game/popups/DuelHeader';
import { Avatar } from '@/components/ui/Avatar';
import { GameButton } from '@/components/ui/GameButton';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { useSound, usePlaySoundOnOpen } from '@/hooks/useSound';
import type { Player, DuelResult } from '@/types';

interface DuelResultPopupProps {
  visible: boolean;
  result: DuelResult | null;
  challenger: Player | null;
  opponent: Player | null;
  currentPlayerId: string;
  /** True when this player finished but waiting for opponent's score */
  isWaitingForOpponent?: boolean;
  /** Name of the opponent we're waiting for */
  waitingForName?: string;
  onClose: () => void;
}

export const DuelResultPopup = memo(function DuelResultPopup({
  visible,
  result,
  challenger,
  opponent,
  currentPlayerId,
  isWaitingForOpponent = false,
  waitingForName,
  onClose,
}: DuelResultPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const { play: playSound } = useSound();
  usePlaySoundOnOpen(visible && isWaitingForOpponent && !result, 'popup-open');

  const duelResultSoundPlayed = useRef(false);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      duelResultSoundPlayed.current = false;
      return;
    }
    if (!result || isWaitingForOpponent) return;
    if (duelResultSoundPlayed.current) return;
    duelResultSoundPlayed.current = true;
    if (result.winnerId === null) return;
    playSound(result.winnerId === currentPlayerId ? 'victory' : 'defeat');
  }, [visible, result, isWaitingForOpponent, currentPlayerId, playSound]);

  useEffect(() => {
    if (visible && result) {
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));

      if (hapticsEnabled) {
        const isWinner = result.winnerId === currentPlayerId;
        const isDraw = result.winnerId === null;
        if (isWinner) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (isDraw) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else if (visible && isWaitingForOpponent) {
      contentOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));
    } else {
      contentOpacity.value = 0;
    }
  }, [visible, result, isWaitingForOpponent, hapticsEnabled, currentPlayerId, contentOpacity]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  if (!challenger || !opponent) return null;

  // ===== WAITING STATE: show "waiting for opponent" =====
  if (isWaitingForOpponent && !result) {
    const opponentName = currentPlayerId === challenger.id
      ? (waitingForName || opponent.name)
      : (waitingForName || challenger.name);

    return (
      <Modal visible={visible} onClose={() => {}} closeOnBackdrop={false} showCloseButton={false} bareContent>
        <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
          <DuelHeader />
          <View style={styles.content}>
            <Animated.View entering={SlideInLeft.duration(280)} style={styles.playerCardRow}>
              <View style={styles.avatarWrap}>
                <Avatar name={challenger.name} playerColor={challenger.color} size="md" showBorder />
              </View>
              <View style={styles.playerCardText}>
                <Text style={styles.playerCardName} numberOfLines={1}>{challenger.startupName || 'Entreprise'}</Text>
                <Text style={styles.playerCardSubtitle}>{challenger.name}</Text>
              </View>
            </Animated.View>

            <VsBadge />

            <Animated.View entering={SlideInRight.duration(280)} style={styles.playerCardRow}>
              <View style={styles.avatarWrap}>
                <Avatar name={opponent.name} playerColor={opponent.color} size="md" showBorder />
              </View>
              <View style={styles.playerCardText}>
                <Text style={styles.playerCardName} numberOfLines={1}>{opponent.startupName || 'Entreprise'}</Text>
                <Text style={styles.playerCardSubtitle}>{opponent.name}</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.messageBox, contentStyle]}>
              <View style={styles.waitingRow}>
                <ActivityIndicator size="small" color={COLORS.warning} />
                <Text style={styles.message}>
                  {opponentName} est en train de répondre...
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </Modal>
    );
  }

  // ===== RESULT STATE: show final scores =====
  if (!result) return null;

  const isCurrentPlayerChallenger = currentPlayerId === challenger.id;
  const currentPlayerReward = isCurrentPlayerChallenger ? result.challengerReward : result.opponentReward;

  const challengerWon = result.challengerScore > result.opponentScore;
  const opponentWon = result.opponentScore > result.challengerScore;
  const isDraw = result.winnerId === null;
  const isWinner = result.winnerId === currentPlayerId;

  const feedbackIconColor = isDraw ? '#FF9800' : '#ffffff';
  const feedbackLabelColor = isDraw ? '#FF9800' : '#ffffff';
  const feedbackRewardColor = isDraw ? (currentPlayerReward > 0 ? COLORS.primary : '#8E99A4') : '#ffffff';
  const feedbackBg = isDraw ? 'rgba(255,152,0,0.08)' : 'transparent';
  const feedbackBorder = isDraw ? 'rgba(255,152,0,0.25)' : isWinner ? '#2ECC71' : '#F35145';
  const feedbackDividerColor = isDraw ? 'rgba(255,152,0,0.3)' : 'rgba(255,255,255,0.2)';
  const feedbackIcon = isDraw ? 'remove-circle' : isWinner ? 'trophy' : 'close-circle';
  const feedbackLabel = isDraw ? 'ÉGALITÉ' : isWinner ? 'VOUS AVEZ GAGNÉ !' : 'VOUS AVEZ PERDU';
  const feedbackGradStart = isWinner ? '#2ECC71' : '#F35145';
  const feedbackGradEnd = isWinner ? '#1A9E50' : '#C0392B';

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <DuelHeader />
        <View style={styles.content}>
          <Animated.View entering={SlideInLeft.duration(280)} style={styles.playerCardRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={challenger.name} playerColor={challenger.color} size="md" showBorder />
            </View>
            <View style={styles.playerCardText}>
              <Text style={styles.playerCardName} numberOfLines={1}>{challenger.startupName || 'Entreprise'}</Text>
              <Text style={styles.playerCardSubtitle}>{challenger.name}</Text>
              <Text style={[styles.scoreLine, challengerWon && styles.scoreWinner]}>{result.challengerScore} pts</Text>
            </View>
          </Animated.View>

          <VsBadge />

          <Animated.View entering={SlideInRight.duration(280)} style={styles.playerCardRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={opponent.name} playerColor={opponent.color} size="md" showBorder />
            </View>
            <View style={styles.playerCardText}>
              <Text style={styles.playerCardName} numberOfLines={1}>{opponent.startupName || 'Entreprise'}</Text>
              <Text style={styles.playerCardSubtitle}>{opponent.name}</Text>
              <Text style={[styles.scoreLine, opponentWon && styles.scoreWinner]}>{result.opponentScore} pts</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.feedbackBox, { backgroundColor: feedbackBg, borderColor: feedbackBorder }, contentStyle]}>
            {/* Gradient SVG en fond pour victoire et défaite */}
            {!isDraw && (
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
                <Defs>
                  <SvgLinearGradient id="feedback_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={feedbackGradStart} stopOpacity="1" />
                    <Stop offset="100%" stopColor={feedbackGradEnd} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#feedback_grad)" rx={12} />
              </Svg>
            )}
            {/* Ligne feedback */}
            <View style={styles.feedbackRow}>
              <Ionicons name={feedbackIcon as any} size={22} color={feedbackIconColor} />
              <Text style={[styles.feedbackLabel, { color: feedbackLabelColor }]}>{feedbackLabel}</Text>
            </View>
            {/* Séparateur */}
            <View style={[styles.feedbackDivider, { backgroundColor: feedbackDividerColor }]} />
            {/* Récompense */}
            <View style={styles.rewardRow}>
              <Ionicons name="logo-bitcoin" size={16} color={feedbackRewardColor} />
              <Text style={[styles.rewardText, { color: feedbackRewardColor }]}>
                {currentPlayerReward > 0 ? `+${currentPlayerReward} jetons gagnés` : 'Aucun jeton gagné'}
              </Text>
            </View>
          </Animated.View>

          <View style={styles.buttonWrapper}>
            <GameButton title="Continuer" onPress={onClose} variant="yellow" fullWidth />
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
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  playerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[2],
    borderWidth: 1,
    borderColor: '#E8EEF4',
    ...SHADOWS.sm,
  },
  avatarWrap: {
    marginRight: SPACING[3],
  },
  playerCardText: {
    flex: 1,
  },
  playerCardName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerCardSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginTop: 2,
  },
  scoreLine: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
    marginTop: 4,
  },
  scoreWinner: {
    color: COLORS.success,
  },
  messageBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginTop: SPACING[2],
    marginBottom: SPACING[5],
  },
  message: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
  },
  feedbackBox: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    width: '100%',
    marginTop: SPACING[3],
    marginBottom: SPACING[5],
    overflow: 'hidden',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  feedbackLabel: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 1,
  },
  feedbackDivider: {
    height: 1,
    marginHorizontal: SPACING[4],
    opacity: 0.5,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  rewardText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
  },
  buttonWrapper: {
    width: '100%',
  },
});
