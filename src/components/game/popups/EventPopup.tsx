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
import type { OpportunityEvent, ChallengeEvent } from '@/types';

type EventData = OpportunityEvent | ChallengeEvent;

interface EventPopupProps {
  visible: boolean;
  eventType: 'opportunity' | 'challenge';
  event: EventData | null;
  onAccept: (value: number, effect: string) => void;
  onClose: () => void;
  isSpectator?: boolean;
}

const OPPORTUNITY_EFFECTS: Record<string, { icon: string; label: string }> = {
  tokens: { icon: 'cash', label: 'Jetons bonus' },
  extraTurn: { icon: 'reload', label: 'Tour supplémentaire' },
  shield: { icon: 'shield', label: 'Protection' },
  boost: { icon: 'rocket', label: 'Boost' },
};

const CHALLENGE_EFFECTS: Record<string, { icon: string; label: string }> = {
  loseTokens: { icon: 'trending-down', label: 'Perte de jetons' },
  skipTurn: { icon: 'pause', label: 'Tour perdu' },
  moveBack: { icon: 'arrow-back', label: 'Recule' },
  returnToBase: { icon: 'home', label: 'Retour à la base' },
};

const RARITY_COLORS: Record<string, string> = {
  common: COLORS.textSecondary,
  rare: COLORS.info,
  epic: COLORS.primary,
  legendary: COLORS.warning,
};

export const EventPopup = memo(function EventPopup({
  visible,
  eventType,
  event,
  onAccept,
  onClose,
  isSpectator = false,
}: EventPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const isOpportunity = eventType === 'opportunity';
  const eventColor = isOpportunity ? COLORS.success : COLORS.error;

  // Animation values
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (visible && event) {
      // Icon entrance animation
      iconScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.3, { damping: 6 }),
        withSpring(1, { damping: 10 })
      );

      // Shake for challenge, bounce for opportunity
      if (isOpportunity) {
        iconRotate.value = withSequence(
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
      } else {
        iconRotate.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 50 }),
            withTiming(5, { duration: 50 }),
            withTiming(-3, { duration: 50 }),
            withTiming(3, { duration: 50 }),
            withTiming(0, { duration: 50 })
          ),
          3,
          false
        );
      }

      // Pulse effect
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      if (hapticsEnabled) {
        if (isOpportunity) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }
  }, [visible, event, isOpportunity, iconScale, iconRotate, pulse, hapticsEnabled]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleAccept = () => {
    if (event) {
      if (hapticsEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onAccept(event.value, event.effect);
    }
  };

  if (!event) return null;

  const effects = isOpportunity ? OPPORTUNITY_EFFECTS : CHALLENGE_EFFECTS;
  const effectInfo = effects[event.effect] || { icon: 'help', label: event.effect };
  const rarityColor = RARITY_COLORS[event.rarity] || COLORS.textSecondary;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false}>
      <Animated.View entering={SlideInUp.springify()} style={styles.container}>
        {/* Background decoration */}
        <Animated.View style={[styles.backgroundDecoration, pulseStyle]}>
          <View
            style={[
              styles.decorationCircle,
              { borderColor: `${eventColor}20` },
            ]}
          />
          <View
            style={[
              styles.decorationCircleInner,
              { borderColor: `${eventColor}30` },
            ]}
          />
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name={isOpportunity ? 'star' : 'warning'}
            size={28}
            color={eventColor}
          />
          <Text style={[styles.title, { color: eventColor }]}>
            {isOpportunity ? 'Opportunité !' : 'Challenge !'}
          </Text>
        </View>

        {/* Rarity badge */}
        <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
          <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
          <Text style={[styles.rarityText, { color: rarityColor }]}>
            {event.rarity.toUpperCase()}
          </Text>
        </View>

        {/* Event icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: eventColor }]}>
            <Ionicons
              name={effectInfo.icon as keyof typeof Ionicons.glyphMap}
              size={48}
              color={COLORS.white}
            />
          </View>
        </Animated.View>

        {/* Event details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
        </View>

        {/* Effect */}
        <View
          style={[
            styles.effectContainer,
            { backgroundColor: `${eventColor}15` },
          ]}
        >
          <Text style={styles.effectLabel}>Effet</Text>
          <View style={styles.effectRow}>
            <Ionicons
              name={effectInfo.icon as keyof typeof Ionicons.glyphMap}
              size={24}
              color={eventColor}
            />
            <Text style={[styles.effectValue, { color: eventColor }]}>
              {isOpportunity ? '+' : '-'}{event.value}
            </Text>
            <Text style={styles.effectUnit}>{effectInfo.label}</Text>
          </View>
        </View>

        {/* Spectator banner */}
        {isSpectator && (
          <View style={styles.spectatorBanner}>
            <Ionicons name="eye" size={16} color={COLORS.white} />
            <Text style={styles.spectatorText}>
              {isOpportunity ? "L'adversaire profite d'une opportunité" : "L'adversaire subit un challenge"}
            </Text>
          </View>
        )}

        {/* Action button */}
        {!isSpectator && (
          <Button
            title={isOpportunity ? 'Profiter' : 'Subir'}
            onPress={handleAccept}
            variant={isOpportunity ? 'primary' : 'secondary'}
            size="lg"
            leftIcon={
              <Ionicons
                name={isOpportunity ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={isOpportunity ? COLORS.white : eventColor}
              />
            }
            style={
              !isOpportunity
                ? { width: '100%', borderColor: eventColor, borderWidth: 2 }
                : { width: '100%' }
            }
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
    overflow: 'hidden',
  },
  backgroundDecoration: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorationCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  decorationCircleInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
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
  iconContainer: {
    marginBottom: SPACING[4],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  eventTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  eventDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  effectContainer: {
    borderRadius: 16,
    padding: SPACING[4],
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  effectLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[2],
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  effectValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES['2xl'],
  },
  effectUnit: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
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
