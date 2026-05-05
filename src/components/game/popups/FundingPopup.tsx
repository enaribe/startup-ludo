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
import { Path, G, Text as SvgText, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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

// SVG fourni : viewBox "0 0 34 33" → scale ≈ 1.45 pour ~49×48
// Centré : translateX=10, translateY=(83-48)/2≈17
const FUND_ICON_DEFS = (
  <SvgLinearGradient id="fund_bg_grad" x1="21.6273" y1="-1.17138e-07" x2="27.1364" y2="38.3404" gradientUnits="userSpaceOnUse">
    <Stop offset="0" stopColor="#4CAF50" />
    <Stop offset="1" stopColor="#39833C" />
  </SvgLinearGradient>
);

const FUND_ICON = (
  <G translateX="10" translateY="17" scale="1.45">
    <Path d="M20.0039 0.667969C20.3499 0.496949 20.7969 0.424745 21.5039 0.603516C22.1734 0.772801 22.3503 1.03791 22.8711 1.42578C23.4153 1.8311 24.1196 2.15766 25.6064 2.22852C26.2572 2.25955 26.4668 2.42705 26.5371 2.5332C26.6154 2.65147 26.6583 2.89397 26.5215 3.37891C26.3898 3.84533 26.1261 4.41596 25.7793 5.08105C25.4275 5.75579 25.0342 6.44826 24.6191 7.22754L24.4395 7.56445L24.7168 7.82617L24.7275 7.83691C24.792 7.89801 24.8945 7.99609 25.376 8.46191C25.7783 8.85446 26.3232 9.39402 26.8955 9.98242C27.4686 10.5716 28.066 11.2071 28.5732 11.791C29.088 12.3836 29.4852 12.8956 29.6807 13.2451L30.5479 14.7959C30.7996 15.3072 31.0812 15.9328 31.3486 16.6533C32.1268 18.75 32.7911 21.6192 32.3701 24.7539C31.9532 27.8581 30.6287 29.4902 28.8965 30.3662C27.1163 31.2665 24.833 31.4077 22.4287 31.3408C21.8112 31.3237 21.1679 31.3378 20.5244 31.3535C19.8769 31.3694 19.2291 31.3871 18.584 31.3818C17.2907 31.3712 16.0548 31.2649 14.9619 30.876C13.8835 30.4921 12.936 29.8305 12.2109 28.6826C11.4787 27.5233 10.9522 25.8349 10.7881 23.3682C10.4641 18.498 12.4787 14.6415 14.5996 11.9844C15.6593 10.6568 16.7403 9.63563 17.5557 8.94727C17.963 8.60339 18.3033 8.34302 18.54 8.16992C18.6584 8.08339 18.8135 7.97656 18.8994 7.91602H18.9033L19.4199 7.58105L18.9854 7.14355L18.9609 7.11914C18.8198 6.97069 18.6104 6.74121C18.3813 6.48609 18.0765 6.13104 17.7734 5.72852C17.4691 5.32423 17.1736 4.88214 16.9561 4.45312C16.7338 4.01486 16.6172 3.6364 16.6172 3.34766C16.6172 3.03016 16.6936 2.88482 16.7617 2.80469C16.8406 2.71194 16.9688 2.6345 17.1953 2.55078C17.3078 2.50921 17.4257 2.47263 17.5654 2.42773C17.6999 2.38454 17.8504 2.33453 18.001 2.27344C18.3045 2.15028 18.6365 1.96978 18.9092 1.65137C19.3133 1.17942 19.6311 0.852281 20.0039 0.667969Z" fill="url(#fund_bg_grad)" stroke="#1C6B3B" />
    <Path d="M7.39551 17.5957C11.3976 17.5957 14.6414 20.8266 14.6416 24.8115C14.6416 28.7966 11.3977 32.0283 7.39551 32.0283C3.39336 32.0283 0.150391 28.7966 0.150391 24.8115C0.150623 20.8267 3.3935 17.5958 7.39551 17.5957Z" fill="#FFBC40" stroke="#AC700C" strokeWidth="0.3" />
    <Path d="M10.9442 20.4453C13.4733 22.311 13.872 26.0212 11.8826 28.4281C10.4602 30.2083 7.93789 30.9713 5.76502 30.2569C5.05298 30.0289 4.38985 29.6586 3.83398 29.1727C4.72074 29.8317 5.77986 30.2361 6.87945 30.3136C9.48339 30.5172 11.9359 28.8608 12.683 26.369C13.3448 24.2732 12.622 21.872 10.9446 20.4453H10.9442Z" fill="#E5A32A" />
    <Path d="M1.7129 24.8763C1.60858 22.1765 3.60082 19.7533 6.25681 19.2978C6.53196 19.2518 6.80982 19.2262 7.08835 19.2188L7.3662 19.2218C4.28448 19.3157 1.80608 21.7943 1.7129 24.8763Z" fill="#FFC966" />
    <Path d="M25.2778 7.37164C25.2778 7.37164 22.8629 8.16352 18.7086 7.48963C14.5542 6.8154 14.2308 13.7279 15.711 16.7761C17.1913 19.8243 17.3444 10.5264 17.7998 9.25577C18.2552 7.98519 19.5668 7.46839 19.2706 6.86799C18.9741 6.26759 17.7497 6.66404 18.9159 8.23971C20.0824 9.81538 19.9293 13.0092 19.7782 15.1715" stroke="#1C6B3B" strokeMiterlimit="10" strokeLinecap="round" />
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
