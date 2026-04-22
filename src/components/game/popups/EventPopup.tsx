import { memo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInUp,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Path, G, Text as SvgText } from 'react-native-svg';
import { Modal } from '@/components/ui/Modal';
import { GameButton } from '@/components/ui/GameButton';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { PopupHeader } from './PopupHeader';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { OpportunityEvent, ChallengeEvent } from '@/types';
import { crashLog } from '@/utils/gameLog';

type EventData = OpportunityEvent | ChallengeEvent;

// ─── Header Opportunité ──────────────────────────────────────────────────────


// Icône ampoule (SVG fourni, centré verticalement dans le viewBox 83px de haut)
// L'icône fait 22×35 → on la translate pour la centrer à x≈18, y≈(83-35)/2=24
const OPP_ICON = (
  <G translateX={18} translateY={24}>
    <Path
      d="M10.7069 1C16.0652 1 20.4139 5.34871 20.4139 10.7069C20.4139 16.4017 15.2369 19.5338 15.2369 24.9438H6.17704C6.17704 19.5338 1 16.4017 1 10.7069C1 5.34871 5.34871 1 10.7069 1Z"
      fill="#4CAF50"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.82422 29.3203H14.5898"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.41211 33.6094H12.0006"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </G>
);

// ─── Label OPPORTUNITÉ ────────────────────────────────────────────────────────

const OPP_LABEL = (
  <SvgText
    x="52"
    y="50"
    fill="white"
    fontSize="17"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    OPPORTUNITÉ
  </SvgText>
);

// ─── Déco droite — identique au Quiz (losange + dés) ─────────────────────────

const SHARED_DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.1" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.1" />
  </>
);

function OpportunityHeader() {
  return (
    <PopupHeader
      color="#4CAF50"
      icon={OPP_ICON}
      label={OPP_LABEL}
      decorRight={SHARED_DECOR_RIGHT}
    />
  );
}

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

const CHAL_LABEL = (
  <SvgText
    x="68"
    y="50"
    fill="white"
    fontSize="17"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    CHALLENGE
  </SvgText>
);

function ChallengeHeader() {
  return (
    <PopupHeader
      color="#F35145"
      icon={CHAL_ICON}
      label={CHAL_LABEL}
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
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  usePlaySoundOnOpen(visible && !!event, 'popup-open');

  const isOpportunity = eventType === 'opportunity';

  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    crashLog('EventPopup mount/update', { visible, eventType, hasEvent: !!event });
    return () => {
      crashLog('EventPopup unmount', { eventType });
    };
  }, [visible, event, eventType]);

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

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        {isOpportunity ? <OpportunityHeader /> : <ChallengeHeader />}

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
                    title="Profiter"
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
                    title="Continuer"
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
              <GameButton title="FERMER" onPress={onSpectatorClose} variant="blue" fullWidth />
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
