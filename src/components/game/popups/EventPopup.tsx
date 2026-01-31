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
import { PopupOpportunityIcon, PopupChallengeIcon } from '@/components/game/popups/PopupIcons';
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

const CARD_STYLE = {
  backgroundColor: '#FFFFFF',
  borderRadius: 24,
  padding: SPACING[6],
  maxWidth: 340,
  width: '90%' as const,
  alignItems: 'center' as const,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.15,
  shadowRadius: 16,
  elevation: 12,
  overflow: 'hidden' as const,
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

  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const iconFloat = useSharedValue(0);
  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    if (visible && event) {
      badgeBounce.value = 0;

      iconScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.25, { damping: 7, stiffness: 140 }),
        withSpring(1, { damping: 12 })
      );

      if (isOpportunity) {
        iconRotate.value = withSequence(
          withTiming(-10, { duration: 100 }),
          withTiming(10, { duration: 100 }),
          withTiming(-5, { duration: 80 }),
          withTiming(0, { duration: 80 })
        );
        iconFloat.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(3, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      } else {
        iconRotate.value = withRepeat(
          withSequence(
            withTiming(-6, { duration: 40 }),
            withTiming(6, { duration: 40 }),
            withTiming(-4, { duration: 40 }),
            withTiming(4, { duration: 40 }),
            withTiming(0, { duration: 40 })
          ),
          3,
          false
        );
        iconFloat.value = 0;
      }

      badgeBounce.value = withDelay(
        400,
        withSpring(1, { damping: 6, stiffness: 120 })
      );

      if (hapticsEnabled) {
        if (isOpportunity) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } else {
      badgeBounce.value = 0;
    }
  }, [visible, event, isOpportunity, iconScale, iconRotate, iconFloat, badgeBounce, hapticsEnabled]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
      { translateY: iconFloat.value },
    ],
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeBounce.value }],
    opacity: badgeBounce.value,
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

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.springify().damping(18)} style={[styles.card, CARD_STYLE]}>
        {isSpectator && (
          <View style={styles.spectatorBanner}>
            <Ionicons name="eye" size={14} color={COLORS.white} />
            <Text style={styles.spectatorText}>
              {isOpportunity ? "L'adversaire profite d'une opportunité" : "L'adversaire subit un challenge"}
            </Text>
          </View>
        )}

        <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
          {isOpportunity ? (
            <PopupOpportunityIcon size={56} />
          ) : (
            <View style={styles.challengeIconCircle}>
              <PopupChallengeIcon size={56} />
            </View>
          )}
        </Animated.View>

        <Text
          style={[
            styles.title,
            isOpportunity ? styles.titleOpportunity : styles.titleChallenge,
          ]}
        >
          {isOpportunity ? 'OPPORTUNITÉ' : 'CHALLENGE'}
        </Text>

        <Text style={styles.description}>{event.description}</Text>

        <Text style={styles.resultTitle}>
          {isOpportunity ? 'VOUS GAGNEZ' : 'VOUS PERDEZ'}
        </Text>
        <Animated.View
          style={[
            styles.badge,
            isOpportunity ? styles.badgeGain : styles.badgeLoss,
            badgeAnimStyle,
          ]}
        >
          <Text style={styles.badgeText}>
            {isOpportunity ? `+${event.value}` : `-${event.value}`}
          </Text>
        </Animated.View>

        {!isSpectator && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.buttonWrap}>
            <Button
              title={isOpportunity ? 'Profiter' : 'Subir'}
              onPress={handleAccept}
              variant={isOpportunity ? 'primary' : 'secondary'}
              size="lg"
              leftIcon={
                <Ionicons
                  name={isOpportunity ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={isOpportunity ? COLORS.white : '#E57373'}
                />
              }
              style={
                !isOpportunity
                  ? { width: '100%', borderColor: '#E57373', borderWidth: 2 }
                  : styles.button
              }
            />
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {},
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
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  iconWrap: {
    marginBottom: SPACING[3],
  },
  challengeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229, 115, 115, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    marginBottom: SPACING[4],
  },
  titleOpportunity: {
    color: '#4CAF50',
    textShadowColor: '#2E7D32',
  },
  titleChallenge: {
    color: '#E57373',
    textShadowColor: '#C62828',
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING[4],
  },
  resultTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#1B2A4A',
    marginBottom: SPACING[3],
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  badgeGain: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
  },
  badgeLoss: {
    backgroundColor: '#E57373',
    borderColor: '#C62828',
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
