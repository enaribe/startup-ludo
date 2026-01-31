import { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
  SlideInUp,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PopupFundingIcon } from '@/components/game/popups/PopupIcons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import type { FundingEvent } from '@/types';

interface FundingPopupProps {
  visible: boolean;
  funding: FundingEvent | null;
  onAccept: (amount: number) => void;
  onClose: () => void;
  isSpectator?: boolean;
}

export const FundingPopup = memo(function FundingPopup({
  visible,
  funding,
  onAccept,
  onClose,
  isSpectator = false,
}: FundingPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const iconScale = useSharedValue(0);
  const iconFloat = useSharedValue(0);
  const badgeBounce = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (visible && funding) {
      // Icon entrance: pop in with bounce
      iconScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.15, { damping: 8, stiffness: 150 }),
        withSpring(1, { damping: 12 })
      );

      // Gentle floating animation
      iconFloat.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Badge bounce in delayed
      badgeBounce.value = withDelay(
        400,
        withSpring(1, { damping: 6, stiffness: 120 })
      );

      // Shimmer effect
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );

      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      badgeBounce.value = 0;
    }
  }, [visible, funding, iconScale, iconFloat, badgeBounce, shimmer, hapticsEnabled]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { translateY: iconFloat.value },
    ],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeBounce.value }],
    opacity: badgeBounce.value,
  }));

  const handleAccept = () => {
    if (funding) {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onAccept(funding.amount);
    }
  };

  if (!funding) return null;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.springify().damping(18)} style={styles.card}>
        {isSpectator && (
          <View style={styles.spectatorBanner}>
            <Ionicons name="eye" size={14} color={COLORS.white} />
            <Text style={styles.spectatorText}>L'adversaire recoit un financement</Text>
          </View>
        )}

        {/* Icon with float */}
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <PopupFundingIcon size={80} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>FINANCEMENT</Text>

        {/* Description */}
        <View style={styles.descriptionBox}>
          <Text style={styles.description}>{funding.description}</Text>
        </View>

        {/* Result */}
        <Text style={styles.resultTitle}>VOUS GAGNEZ</Text>
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>+{funding.amount}</Text>
        </Animated.View>

        {/* Button */}
        {!isSpectator && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.buttonWrap}>
            <Button
              title="Collecter"
              onPress={handleAccept}
              variant="primary"
              size="lg"
              leftIcon={<Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
              style={styles.button}
            />
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: SPACING[6],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    maxWidth: 340,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
    overflow: 'hidden',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[3],
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  iconWrap: {
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#4CAF50',
    letterSpacing: 2,
    marginBottom: SPACING[3],
  },
  descriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#1B2A4A',
    marginBottom: SPACING[3],
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
  },
  buttonWrap: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});
