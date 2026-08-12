import { memo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Path, G, Text as SvgText } from 'react-native-svg';
import { Modal } from '@/components/ui/Modal';
import { GameButton } from '@/components/ui/GameButton';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { PopupHeader } from './PopupHeader';
import { OpportunityHeader, SHARED_DECOR_RIGHT } from './OpportunityHeader';
import { SponsorEventPopup } from './SponsorEventPopup';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { OpportunityEvent, ChallengeEvent } from '@/types';
import { crashLog } from '@/utils/gameLog';

type EventData = OpportunityEvent | ChallengeEvent;

// ─── Header Opportunité — partagé avec SponsorEventPopup (cartes sponsor) ────
// OPP_ICON / label / déco dés vivent désormais dans OpportunityHeader.tsx.

// ─── Header Challenge ─────────────────────────────────────────────────────────

// Icône triangle danger (SVG fourni, 39×35) — centré dans le viewBox
// translateX: (83-39)/2 ≈ 7 pour laisser la même marge gauche que l'ampoule
const CHAL_ICON = (
  <G translateX={18} translateY={24}>
    <Path
      d="M16.9414 1.97461C18.0805 0.00906264 20.9195 0.00906092 22.0586 1.97461L38.0967 29.6475C39.2391 31.6186 37.8163 34.0869 35.5381 34.0869H3.46191C1.18365 34.0869 -0.239054 31.6186 0.90332 29.6475L16.9414 1.97461Z"
      fill="#F35145"
      stroke="white"
      strokeWidth="1"
    />
    <Path
      d="M21.7894 13.4062L20.9719 23.8943H17.2831L16.9043 13.4062H21.7894ZM21.1314 26.965C21.1314 27.2574 21.0749 27.5299 20.9619 27.7825C20.849 28.035 20.6961 28.2544 20.5033 28.4405C20.3172 28.6332 20.0979 28.7828 19.8453 28.8891C19.5928 29.0021 19.3236 29.0586 19.0378 29.0586C18.7454 29.0586 18.4729 29.0021 18.2203 28.8891C17.9677 28.7828 17.7451 28.6332 17.5523 28.4405C17.3662 28.2544 17.2167 28.035 17.1037 27.7825C16.9973 27.5299 16.9442 27.2574 16.9442 26.965C16.9442 26.6792 16.9973 26.4067 17.1037 26.1474C17.2167 25.8882 17.3662 25.6656 17.5523 25.4795C17.7451 25.2867 17.9677 25.1339 18.2203 25.0209C18.4729 24.9079 18.7454 24.8514 19.0378 24.8514C19.3236 24.8514 19.5928 24.9079 19.8453 25.0209C20.0979 25.1339 20.3172 25.2867 20.5033 25.4795C20.6961 25.6656 20.849 25.8882 20.9619 26.1474C21.0749 26.4067 21.1314 26.6792 21.1314 26.965Z"
      fill="#FEEEEC"
    />
  </G>
);

const makeChalLabel = (text: string) => (
  <SvgText
    x="68"
    y="50"
    fill="white"
    fontSize="17"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    {text}
  </SvgText>
);

function ChallengeHeader({ label }: { label: string }) {
  return (
    <PopupHeader
      color="#F35145"
      icon={CHAL_ICON}
      label={makeChalLabel(label)}
      decorRight={SHARED_DECOR_RIGHT}
    />
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface EventPopupProps {
  visible: boolean;
  eventType: 'opportunity' | 'challenge';
  event: EventData | null;
  onAccept: (value: number, effect: string) => void;
  onClose: () => void;
  isSpectator?: boolean;
  /** En mode spectateur (IA joue), callback pour fermer manuellement le popup */
  onSpectatorClose?: () => void;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export const EventPopup = memo(function EventPopup({
  visible,
  eventType,
  event,
  onAccept,
  onClose,
  isSpectator = false,
  onSpectatorClose,
}: EventPopupProps) {
  const { t } = useTranslation();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  usePlaySoundOnOpen(visible && !!event, 'popup-open');

  const isOpportunity = eventType === 'opportunity';

  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    crashLog('EventPopup mount/update', { visible, eventType, hasEvent: !!event });
    return () => {
      crashLog('EventPopup unmount', { eventType });
      // Couper l'animation de badge avant unmount — sinon une animation en
      // cours peut tenter d'écrire sur une SharedValue libérée et crasher
      // l'app sur Android (SIGSEGV worklet Reanimated).
      try {
        cancelAnimation(badgeBounce);
      } catch {
        // ignore
      }
    };
  }, [visible, event, eventType, badgeBounce]);

  useEffect(() => {
    if (visible && event) {
      badgeBounce.value = 0;
      badgeBounce.value = withTiming(1, { duration: 250 });
      if (hapticsEnabled) {
        if (isOpportunity) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    } else {
      cancelAnimation(badgeBounce);
      badgeBounce.value = 0;
    }
  }, [visible, event, isOpportunity, badgeBounce, hapticsEnabled]);

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

  // Carte SPONSOR (édition sponsorisée) → habillage dédié avec logo
  if (isOpportunity && (event as OpportunityEvent).sponsored) {
    return (
      <SponsorEventPopup
        visible={visible}
        label={t('eventPopup.opportunityLabel')}
        description={event.description}
        value={event.value}
        logoUrl={(event as OpportunityEvent).sponsorLogoUrl}
        savePayload={
          (event as OpportunityEvent).sponsorLinkUrl
            ? {
                id: event.id,
                kind: 'opportunity',
                text: event.description,
                logoUrl: (event as OpportunityEvent).sponsorLogoUrl,
                linkUrl: (event as OpportunityEvent).sponsorLinkUrl as string,
              }
            : undefined
        }
        cardId={event.id}
        editionId={(event as OpportunityEvent).sponsorEditionId}
        spectatorText={t('eventPopup.spectatorOpportunity')}
        onAccept={handleAccept}
        onClose={onClose}
        isSpectator={isSpectator}
        onSpectatorClose={onSpectatorClose}
      />
    );
  }

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
        {isOpportunity ? (
          <OpportunityHeader label={t('eventPopup.opportunityLabel')} />
        ) : (
          <ChallengeHeader label={t('eventPopup.challengeLabel')} />
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {isSpectator && (
            <View style={styles.spectatorBanner}>
              <Ionicons name="eye" size={14} color={COLORS.white} />
              <Text style={styles.spectatorText}>
                {isOpportunity ? t('eventPopup.spectatorOpportunity') : t('eventPopup.spectatorChallenge')}
              </Text>
            </View>
          )}

          {isOpportunity ? (
            /* ── Design Opportunité ── */
            <>
              {/* Nom de l'événement */}
              <OutlinedText
                text={(event as OpportunityEvent).title}
                style={styles.oppEventName}
                outlineColor="#2E7D32"
                outlineWidth={2}
              />

              {/* Description */}
              <View style={styles.descriptionBox}>
                <Text style={styles.description}>{event.description}</Text>
              </View>

              {/* Badge gain */}
              <View style={styles.gainRow}>
                <Animated.View style={[styles.badge, styles.badgeGain, badgeAnimStyle]}>
                  <OutlinedText
                    text={`+${event.value}`}
                    style={styles.badgeText}
                    outlineColor="#2E7D32"
                    outlineWidth={2}
                  />
                </Animated.View>
              </View>

              {/* Bouton */}
              {!isSpectator && (
                <Animated.View entering={FadeInDown.delay(500).duration(220)} style={styles.buttonWrap}>
                  <GameButton
                    title={t('eventPopup.benefit')}
                    onPress={handleAccept}
                    variant="green"
                    fullWidth
                  />
                </Animated.View>
              )}
            </>
          ) : (
            /* ── Design Challenge ── */
            <>
              {/* Nom de l'événement */}
              <OutlinedText
                text={(event as ChallengeEvent).title}
                style={styles.chalEventName}
                outlineColor="#AF2121"
                outlineWidth={2}
              />

              {/* Description */}
              <View style={styles.descriptionBox}>
                <Text style={styles.description}>{event.description}</Text>
              </View>

              {/* Badge perte */}
              <View style={styles.gainRow}>
                <Animated.View style={[styles.badge, styles.badgeLoss, badgeAnimStyle]}>
                  <OutlinedText
                    text={`-${event.value}`}
                    style={styles.badgeText}
                    outlineColor="#AF2121"
                    outlineWidth={2}
                  />
                </Animated.View>
              </View>

              {/* Bouton */}
              {!isSpectator && (
                <Animated.View entering={FadeInDown.delay(500).duration(220)} style={styles.buttonWrap}>
                  <GameButton
                    title={t('eventPopup.continue')}
                    onPress={handleAccept}
                    variant="red"
                    fullWidth
                  />
                </Animated.View>
              )}
            </>
          )}

          {/* Bouton FERMER en mode spectateur (IA joue) */}
          {isSpectator && onSpectatorClose && (
            <Animated.View entering={FadeInDown.delay(300).duration(220)} style={styles.buttonWrap}>
              <GameButton title={t('eventPopup.close')} onPress={onSpectatorClose} variant="blue" fullWidth />
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

  // ── Contenu scroll ──
  scrollContent: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },

  // ── Spectateur banner ──
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
    width: '100%',
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },

  // ── Nom événement ──
  oppEventName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  chalEventName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#F35145',
    textAlign: 'center',
    marginBottom: SPACING[3],
  },

  // ── Description ──
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

  // ── Gain row ──
  gainRow: {
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING[4],
  },

  // ── Badge ──
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    borderColor: '#AF2121',
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  // ── Bouton ──
  buttonWrap: {
    width: '100%',
  },
});
