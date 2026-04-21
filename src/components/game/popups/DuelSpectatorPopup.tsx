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
}

export const DuelSpectatorPopup = memo(function DuelSpectatorPopup({
  visible,
  challenger,
  opponent,
  onClose,
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
          {/* VS Section */}
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
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageBox}>
            <ActivityIndicator size="small" color={COLORS.success} style={styles.loader} />
            <Text style={styles.message}>
              En attente du résultat...
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
