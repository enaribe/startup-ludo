import { memo, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { DuelHeader, VsBadge } from '@/components/game/popups/DuelHeader';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { Player } from '@/types';

interface DuelSpectatorPopupProps {
  visible: boolean;
  challenger: Player;
  opponent: Player;
  onClose?: () => void;
  /** Score live du challenger (progression en direct). */
  challengerScore?: number;
  /** Score live de l'opponent (progression en direct). */
  opponentScore?: number;
  /** Nombre de questions répondues par le challenger. */
  challengerAnswered?: number;
  /** Nombre de questions répondues par l'opponent. */
  opponentAnswered?: number;
  /** Nombre total de questions du duel. */
  totalQuestions?: number;
}

export const DuelSpectatorPopup = memo(function DuelSpectatorPopup({
  visible,
  challenger,
  opponent,
  onClose,
  challengerScore = 0,
  opponentScore = 0,
  challengerAnswered = 0,
  opponentAnswered = 0,
  totalQuestions = 3,
}: DuelSpectatorPopupProps) {
  usePlaySoundOnOpen(visible, 'popup-open');

  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [visible, pulseAnim]);

  const vsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <Modal
      visible={visible}
      onClose={onClose || (() => {})}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <DuelHeader />
        <View style={styles.content}>
          {/* Bandeau spectateur */}
          <View style={styles.spectatorBadge}>
            <Text style={styles.spectatorBadgeText}>MODE SPECTATEUR</Text>
          </View>

          {/* VS Section avec scores live */}
          <View style={styles.vsSection}>
            {/* Challenger */}
            <View style={styles.playerSide}>
              <Avatar
                name={challenger.name}
                playerColor={challenger.color}
                size="lg"
                showBorder
              />
              <Text style={styles.playerName} numberOfLines={1}>
                {challenger.startupName}
              </Text>
              <View style={styles.scoreChip}>
                <Text style={styles.scoreChipValue}>{challengerScore}</Text>
              </View>
              <Text style={styles.answeredText}>
                {challengerAnswered}/{totalQuestions} répondu
              </Text>
            </View>

            {/* VS Badge animé */}
            <Animated.View style={vsStyle}>
              <VsBadge />
            </Animated.View>

            {/* Opponent */}
            <View style={styles.playerSide}>
              <Avatar
                name={opponent.name}
                playerColor={opponent.color}
                size="lg"
                showBorder
              />
              <Text style={styles.playerName} numberOfLines={1}>
                {opponent.startupName}
              </Text>
              <View style={styles.scoreChip}>
                <Text style={styles.scoreChipValue}>{opponentScore}</Text>
              </View>
              <Text style={styles.answeredText}>
                {opponentAnswered}/{totalQuestions} répondu
              </Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageBox}>
            <ActivityIndicator size="small" color={COLORS.success} style={styles.loader} />
            <Text style={styles.message}>
              Duel en cours...
            </Text>
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
  vsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING[4],
  },
  playerSide: {
    flex: 1,
    alignItems: 'center',
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    marginTop: SPACING[2],
    textAlign: 'center',
    maxWidth: 80,
  },
  spectatorBadge: {
    backgroundColor: '#EAF4FB',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[3],
  },
  spectatorBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  scoreChip: {
    marginTop: SPACING[2],
    minWidth: 44,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[2],
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    alignItems: 'center',
  },
  scoreChipValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.success,
  },
  answeredText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginTop: 3,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    gap: SPACING[2],
  },
  loader: {
    marginRight: SPACING[1],
  },
  message: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#8E99A4',
  },
});
