import { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import { PopupDuelIcon } from '@/components/game/popups/PopupIcons';
import { Avatar } from '@/components/ui/Avatar';
import { GameButton } from '@/components/ui/GameButton';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import type { Player, DuelResult } from '@/types';

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
  const contentOpacity = useSharedValue(0);

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
    } else {
      contentOpacity.value = 0;
    }
  }, [visible, result, hapticsEnabled, currentPlayerId, contentOpacity]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  if (!result || !challenger || !opponent) return null;

  const isDraw = result.winnerId === null;
  const isCurrentPlayerWinner = result.winnerId === currentPlayerId;
  const isCurrentPlayerChallenger = currentPlayerId === challenger.id;
  const currentPlayerReward = isCurrentPlayerChallenger ? result.challengerReward : result.opponentReward;

  const statusText = isDraw ? 'ÉGALITÉ' : isCurrentPlayerWinner ? 'VICTOIRE' : 'DÉFAITE';
  const statusColor = isDraw ? COLORS.warning : isCurrentPlayerWinner ? COLORS.success : COLORS.error;
  const challengerWon = result.challengerScore > result.opponentScore;
  const opponentWon = result.opponentScore > result.challengerScore;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <View style={styles.content}>
          {/* Header: icône + titre (même style que DuelPreparePopup) */}
          <View style={styles.header}>
            <PopupDuelIcon size={32} />
            <Text style={[styles.title, { color: statusColor }]}>{statusText}</Text>
          </View>

          {/* Carte challenger */}
          <Animated.View entering={SlideInLeft.duration(280)} style={styles.playerCardRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={challenger.name} playerColor={challenger.color} size="md" showBorder />
            </View>
            <View style={styles.playerCardText}>
              <Text style={styles.playerCardName} numberOfLines={1}>{challenger.startupName || 'Startup'}</Text>
              <Text style={styles.playerCardSubtitle}>{challenger.name}</Text>
              <Text style={[styles.scoreLine, challengerWon && styles.scoreWinner]}>{result.challengerScore} pts</Text>
            </View>
          </Animated.View>

          <View style={styles.vsCircle}>
            <PopupDuelIcon size={28} />
          </View>

          {/* Carte opponent */}
          <Animated.View entering={SlideInRight.duration(280)} style={styles.playerCardRow}>
            <View style={styles.avatarWrap}>
              <Avatar name={opponent.name} playerColor={opponent.color} size="md" showBorder />
            </View>
            <View style={styles.playerCardText}>
              <Text style={styles.playerCardName} numberOfLines={1}>{opponent.startupName || 'Startup'}</Text>
              <Text style={styles.playerCardSubtitle}>{opponent.name}</Text>
              <Text style={[styles.scoreLine, opponentWon && styles.scoreWinner]}>{result.opponentScore} pts</Text>
            </View>
          </Animated.View>

          {/* Récompense — même boîte que le message du popup préparation */}
          <Animated.View style={[styles.messageBox, contentStyle]}>
            {currentPlayerReward > 0 ? (
              <Text style={styles.message}>+{currentPlayerReward} jetons gagnés</Text>
            ) : (
              <Text style={styles.message}>Pas de jetons gagnés</Text>
            )}
          </Animated.View>

          {/* Bouton — même style que DuelPreparePopup: variant yellow */}
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
    paddingTop: SPACING[5],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: SPACING[4],
    gap: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    letterSpacing: 2,
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
  vsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(28, 107, 59, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING[2],
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
  buttonWrapper: {
    width: '100%',
  },
});
