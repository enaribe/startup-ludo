import { memo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  SlideInUp,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { GameButton } from '@/components/ui/GameButton';
import { PopupFundingIcon } from '@/components/game/popups/PopupIcons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
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
      // Icon entrance: simple fade-in scale
      iconScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 280 })
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

      // Badge: simple apparition
      badgeBounce.value = withTiming(1, { duration: 250 });

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
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {isSpectator && (
            <View style={styles.spectatorBanner}>
              <Ionicons name="eye" size={14} color={COLORS.white} />
              <Text style={styles.spectatorText}>L'adversaire reçoit un financement</Text>
            </View>
          )}

          {/* Icon avec animation flottante */}
          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <PopupFundingIcon size={56} />
          </Animated.View>

          {/* Titre */}
          <Text style={styles.title}>FINANCEMENT</Text>

          {/* Description */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>{funding.description}</Text>
          </View>

          {/* Résultat */}
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>VOUS GAGNEZ</Text>
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Text style={styles.badgeText}>+{funding.amount}</Text>
            </Animated.View>
          </View>

          {/* Bouton */}
          {!isSpectator && (
            <Animated.View entering={FadeInDown.delay(500).duration(220)} style={styles.buttonWrap}>
              <GameButton title="Collecter" onPress={handleAccept} variant="green" fullWidth />
            </Animated.View>
          )}
        </ScrollView>
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
  scrollContent: {
    paddingTop: SPACING[5],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[4],
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  iconWrap: {
    marginBottom: SPACING[3],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(80, 200, 120, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.events.funding,
    letterSpacing: 2,
    marginBottom: SPACING[3],
  },
  descriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[4],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  resultSection: {
    alignItems: 'center',
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
    width: '100%',
    marginBottom: SPACING[4],
  },
  resultTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
    marginBottom: SPACING[3],
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: COLORS.success,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  buttonWrap: {
    width: '100%',
  },
});
