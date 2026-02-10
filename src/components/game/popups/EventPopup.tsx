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
import { PopupOpportunityIcon, PopupChallengeIcon } from '@/components/game/popups/PopupIcons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
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
        withTiming(1, { duration: 280 })
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

      badgeBounce.value = withTiming(1, { duration: 250 });

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
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {isSpectator && (
            <View style={styles.spectatorBanner}>
              <Ionicons name="eye" size={14} color={COLORS.white} />
              <Text style={styles.spectatorText}>
                {isOpportunity ? "L'adversaire profite d'une opportunité" : "L'adversaire subit un challenge"}
              </Text>
            </View>
          )}

          {/* Icon avec animation */}
          <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
            <View style={isOpportunity ? styles.opportunityIconCircle : styles.challengeIconCircle}>
              {isOpportunity ? (
                <PopupOpportunityIcon size={48} />
              ) : (
                <PopupChallengeIcon size={48} />
              )}
            </View>
          </Animated.View>

          {/* Titre */}
          <Text
            style={[
              styles.title,
              !isOpportunity && styles.titleChallenge,
            ]}
          >
            {isOpportunity ? 'OPPORTUNITÉ' : 'CHALLENGE'}
          </Text>

          {/* Description */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Résultat */}
          <View style={styles.resultSection}>
            <Text style={[styles.resultTitle, isOpportunity ? styles.resultTitleGain : styles.resultTitleLoss]}>
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
          </View>

          {/* Bouton */}
          {!isSpectator && (
            <Animated.View entering={FadeInDown.delay(500).duration(220)} style={styles.buttonWrap}>
              <GameButton
                title={isOpportunity ? 'Profiter' : 'Continuer'}
                onPress={handleAccept}
                variant={isOpportunity ? 'green' : 'red'}
                fullWidth
              />
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
  opportunityIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.success,
  },
  challengeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.error,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.success,
    letterSpacing: 2,
    marginBottom: SPACING[3],
  },
  titleChallenge: {
    color: COLORS.error,
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
    marginBottom: SPACING[3],
  },
  resultTitleGain: {
    color: COLORS.success,
  },
  resultTitleLoss: {
    color: COLORS.error,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  badgeGain: {
    backgroundColor: COLORS.success,
    borderColor: '#2E7D32',
  },
  badgeLoss: {
    backgroundColor: COLORS.error,
    borderColor: '#C62828',
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
