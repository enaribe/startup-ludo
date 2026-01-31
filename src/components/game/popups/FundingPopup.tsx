import { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  SlideInUp,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
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

const FUNDING_ICONS: Record<string, string> = {
  investisseur: 'person',
  subvention: 'document-text',
  crowdfunding: 'people',
  concours: 'trophy',
  partenariat: 'handshake',
};

const RARITY_COLORS: Record<string, string> = {
  common: COLORS.textSecondary,
  rare: COLORS.info,
  epic: COLORS.primary,
  legendary: COLORS.warning,
};

export const FundingPopup = memo(function FundingPopup({
  visible,
  funding,
  onAccept,
  onClose,
  isSpectator = false,
}: FundingPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  // Animation values
  const coinScale = useSharedValue(0);
  const coinRotate = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    if (visible && funding) {
      // Coin entrance animation
      coinScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );

      // Coin rotation
      coinRotate.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );

      // Sparkle effect
      sparkle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.5, { duration: 500 })
        ),
        -1,
        true
      );

      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [visible, funding, coinScale, coinRotate, sparkle, hapticsEnabled]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: coinScale.value },
      { rotateY: `${coinRotate.value}deg` },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
    transform: [{ scale: sparkle.value }],
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

  const iconName = FUNDING_ICONS[funding.type] || 'cash';
  const rarityColor = RARITY_COLORS[funding.rarity] || COLORS.textSecondary;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false}>
      <Animated.View entering={SlideInUp.springify()} style={styles.container}>
        {/* Sparkle decoration */}
        <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <View
              key={angle}
              style={[
                styles.sparkleDot,
                {
                  transform: [
                    { rotate: `${angle}deg` },
                    { translateY: -60 },
                  ],
                  backgroundColor: COLORS.primary,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="cash" size={28} color={COLORS.success} />
          <Text style={styles.title}>Financement !</Text>
        </View>

        {/* Rarity badge */}
        <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {funding.rarity.toUpperCase()}
          </Text>
        </View>

        {/* Coin animation */}
        <Animated.View style={[styles.coinContainer, coinStyle]}>
          <View style={styles.coin}>
            <Ionicons
              name={iconName as keyof typeof Ionicons.glyphMap}
              size={40}
              color={COLORS.white}
            />
          </View>
        </Animated.View>

        {/* Funding details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.fundingName}>{funding.name}</Text>
          <Text style={styles.fundingDescription}>{funding.description}</Text>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Tu reçois</Text>
          <View style={styles.amountRow}>
            <Ionicons name="cash" size={32} color={COLORS.primary} />
            <Text style={styles.amountValue}>+{funding.amount}</Text>
            <Text style={styles.amountUnit}>jetons</Text>
          </View>
        </View>

        {/* Spectator banner */}
        {isSpectator && (
          <View style={styles.spectatorBanner}>
            <Ionicons name="eye" size={16} color={COLORS.white} />
            <Text style={styles.spectatorText}>L'adversaire reçoit un financement</Text>
          </View>
        )}

        {/* Action button */}
        {!isSpectator && (
          <Button
            title="Collecter"
            onPress={handleAccept}
            variant="primary"
            size="lg"
            leftIcon={<Ionicons name="checkmark-circle" size={20} color={COLORS.white} />}
            style={styles.button}
          />
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING[5],
    maxWidth: 360,
    width: '100%',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 100,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
    borderWidth: 1,
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarityText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1,
  },
  coinContainer: {
    marginBottom: SPACING[4],
  },
  coin: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  fundingName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  fundingDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  amountContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: SPACING[4],
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  amountLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  amountValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.success,
  },
  amountUnit: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  button: {
    width: '100%',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: 8,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[3],
    width: '100%',
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
});
