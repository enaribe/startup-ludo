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
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { usePlaySoundOnOpen } from '@/hooks/useSound';
import type { FundingEvent } from '@/types';
import { crashLog } from '@/utils/gameLog';

// ─── Header Financement ───────────────────────────────────────────────────────

// Icône ampoule simplifiée — chemins sans virgules ni gradients pour éviter
// le crash Android `react-native-svg PathParser.parse_number` lié aux locales FR
// (qui transforme "0.5" en "0,5" et fait planter le parser natif).
// SVG source : viewBox 22×35 → scale 1.6 pour ~35×56, centré dans la zone du header.
const FUND_ICON_DEFS = null;

const FUND_ICON = (
  <G translateX="22" translateY="14" scale="1.6">
    <Path
      d="M10.7069 1C16.0652 1 20.4139 5.34871 20.4139 10.7069C20.4139 16.4017 15.2369 19.5338 15.2369 24.9438H6.17704C6.17704 19.5338 1 16.4017 1 10.7069C1 5.34871 5.34871 1 10.7069 1Z"
      fill="#4CAF50"
      stroke="#1C6B3B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.82422 29.3203H14.5898"
      stroke="#1C6B3B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.41211 33.6094H12.0006"
      stroke="#1C6B3B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </G>
);

const FUND_LABEL = (
  <SvgText
    x="68"
    y="50"
    fill="white"
    fontSize="17"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    FINANCEMENT
  </SvgText>
);

const FUND_DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.1" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.1" />
  </>
);

function FundingHeader() {
  return (
    <PopupHeader
      color="#4CAF50"
      iconDefs={FUND_ICON_DEFS}
      icon={FUND_ICON}
      label={FUND_LABEL}
      decorRight={FUND_DECOR_RIGHT}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FundingPopupProps {
  visible: boolean;
  funding: FundingEvent | null;
  onAccept: (amount: number) => void;
  onClose: () => void;
  isSpectator?: boolean;
  /** En mode spectateur (IA joue), callback pour fermer manuellement le popup */
  onSpectatorClose?: () => void;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export const FundingPopup = memo(function FundingPopup({
  visible,
  funding,
  onAccept,
  onClose,
  isSpectator = false,
  onSpectatorClose,
}: FundingPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  usePlaySoundOnOpen(visible && !!funding, 'popup-open');

  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    crashLog('FundingPopup mount/update', { visible, hasFunding: !!funding, amount: funding?.amount });
    return () => {
      crashLog('FundingPopup unmount');
      // Couper toute animation en cours pour libérer le worklet Reanimated
      // — sinon une animation qui s'achève après l'unmount peut tenter d'accéder
      // à une SharedValue libérée et crasher l'app sur Android.
      try {
        cancelAnimation(badgeBounce);
      } catch {
        // ignore
      }
    };
  }, [visible, funding, badgeBounce]);

  useEffect(() => {
    if (visible && funding) {
      badgeBounce.value = 0;
      badgeBounce.value = withTiming(1, { duration: 250 });
      if (hapticsEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      // Annule proprement plutôt que de muter brutalement la SharedValue
      cancelAnimation(badgeBounce);
      badgeBounce.value = 0;
    }
  }, [visible, funding, badgeBounce, hapticsEnabled]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
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
      <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
        <FundingHeader />

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

          {/* Nom du financement */}
          <OutlinedText
            text={funding.name}
            style={styles.eventName}
            outlineColor="#2E7D32"
            outlineWidth={2}
          />

          {/* Description */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>{funding.description}</Text>
          </View>

          {/* Badge montant */}
          <View style={styles.gainRow}>
            <Animated.View style={[styles.badge, badgeAnimStyle]}>
              <OutlinedText
                text={`+${funding.amount}`}
                style={styles.badgeText}
                outlineColor="#2E7D32"
                outlineWidth={2}
              />
            </Animated.View>
          </View>

          {/* Bouton */}
          {!isSpectator && (
            <Animated.View entering={FadeInDown.delay(500).duration(220)} style={styles.buttonWrap}>
              <GameButton title="Collecter" onPress={handleAccept} variant="green" fullWidth />
            </Animated.View>
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

  scrollContent: {
    paddingTop: SPACING[4],
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
    width: '100%',
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },

  eventName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#4CAF50',
    textAlign: 'center',
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

  gainRow: {
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING[4],
  },

  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
