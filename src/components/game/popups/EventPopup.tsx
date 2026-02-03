import { PopupChallengeIcon, PopupOpportunityIcon } from '@/components/game/popups/PopupIcons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useSettingsStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeEvent, OpportunityEvent } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    SlideInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

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
      <Animated.View entering={SlideInUp.springify().damping(18)} style={styles.card}>
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
              isOpportunity ? styles.titleOpportunity : styles.titleChallenge,
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
            <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.buttonWrap}>
              <Button
                title={isOpportunity ? 'Profiter' : 'Continuer'}
                onPress={handleAccept}
                variant={isOpportunity ? 'primary' : 'secondary'}
                size="lg"
                leftIcon={
                  <Ionicons
                    name={isOpportunity ? 'checkmark-circle' : 'arrow-forward-circle'}
                    size={20}
                    color={isOpportunity ? COLORS.white : COLORS.error}
                  />
                }
                style={
                  !isOpportunity
                    ? styles.buttonChallenge
                    : styles.button
                }
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
    maxHeight: '85%',
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
    backgroundColor: 'rgba(255, 179, 71, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(155, 89, 182, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    letterSpacing: 2,
    marginBottom: SPACING[3],
  },
  titleOpportunity: {
    color: COLORS.events.opportunity,
  },
  titleChallenge: {
    color: COLORS.events.challenge,
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
  button: {
    width: '100%',
  },
  buttonChallenge: {
    width: '100%',
    borderColor: COLORS.error,
    borderWidth: 2,
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
  },
});
