/**
 * ProgressionPopup — Affiché après une partie pour montrer la progression du joueur
 * Valorisation totale des startups + barre XP
 */

import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { getLevelFromXP } from '@/config/progression';
import { useUserStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { formatFCFARaw } from '@/utils/currency';
import { GameButton } from './GameButton';
import { ProgressBar } from './ProgressBar';

const { width: screenWidth } = Dimensions.get('window');
const POPUP_WIDTH = Math.min(screenWidth - SPACING[8], 340);
const BORDER_W = 1.5;

function SpinningShape() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', width: 240, height: 240, justifyContent: 'center', alignItems: 'center' }, animatedStyle]}>
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../../assets/images/shape.png')}
        style={{ width: 240, height: 240, opacity: 1 }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function CoinIcon() {
  return (
    <Svg width={50} height={57} viewBox="0 0 50 57" fill="none">
      <Path d="M14.9523 7.22464L15.314 7.44663C16.1298 7.94735 18.4326 8.77436 21.6025 9.01669C24.6769 9.25172 28.3558 8.91734 31.9715 7.3575C32.529 7.03526 33.1866 6.68156 33.9149 6.32216L35.8122 0.5L30.0489 3.44737L24.2866 0.5L18.5242 3.44737L12.761 0.5L14.9523 7.22464Z" fill="#1F91D0"/>
      <Path d="M22.2117 27.828C21.1265 28.1158 20.3251 29.1245 20.3251 30.3246C20.3251 31.5247 21.1265 32.5333 22.2117 32.8211V27.828Z" fill="#1F91D0"/>
      <Path d="M25.8135 41.7441C27.1662 41.6979 28.2489 40.5616 28.2489 39.1667C28.2489 37.7717 27.1662 36.6354 25.8135 36.5892V41.7441Z" fill="#1F91D0"/>
      <Path fillRule="evenodd" clipRule="evenodd" d="M35.3722 10.5153C34.8628 10.7758 34.4008 11.0291 34.0034 11.2614C33.9319 11.3032 33.8581 11.3408 33.7825 11.3739C29.3647 13.3105 24.9225 13.7039 21.2804 13.4254C17.703 13.152 14.6754 12.2105 13.0902 11.2376L12.5485 10.9051C-3.62059 20.9902 -6.94595 55.111 24.2866 56.5C55.9348 55.0925 52.0991 20.0762 35.3722 10.5153ZM24.0126 22.2368C25.0072 22.2368 25.8135 23.0616 25.8135 24.0789V24.0985C29.2056 24.4582 31.8507 27.3912 31.8507 30.9561C31.8507 31.9735 31.0444 32.7982 30.0498 32.7982C29.0552 32.7982 28.2489 31.9735 28.2489 30.9561C28.2489 29.4303 27.2083 28.1531 25.8135 27.8265V32.9041C29.1556 32.951 31.8507 35.7369 31.8507 39.1667C31.8507 42.5965 29.1555 45.3823 25.8134 45.4292C25.8045 46.4388 25.0017 47.2544 24.0126 47.2544C23.018 47.2544 22.2117 46.4296 22.2117 45.4123V45.3111C19.0873 44.7108 16.7233 41.9053 16.7233 38.5351C16.7233 37.5177 17.5296 36.693 18.5242 36.693C19.5188 36.693 20.3251 37.5177 20.3251 38.5351C20.3251 39.853 21.1014 40.9854 22.2117 41.48V36.5545C19.1283 36.2297 16.7233 33.5644 16.7233 30.3246C16.7233 27.0847 19.1283 24.4194 22.2117 24.0946V24.0789C22.2117 23.0616 23.018 22.2368 24.0126 22.2368Z" fill="#1F91D0"/>
      <Path d="M38.0478 9.29228C39.7222 8.6152 41.4733 8.07549 43.0145 7.87627C44.6228 7.66838 45.6208 7.88 46.14 8.23403C47.133 8.91123 48.4748 8.63674 49.1368 7.62094C49.7989 6.60514 49.5305 5.23269 48.5375 4.5555C46.7209 3.31674 44.4409 3.23568 42.4727 3.4901C40.4375 3.75317 38.3137 4.43075 36.4588 5.18085C35.3489 5.62968 34.8048 6.91391 35.2436 8.04925C35.6824 9.18459 36.9379 9.74112 38.0478 9.29228Z" fill="#1F91D0"/>
      {/* Strokes blancs */}
      <Path d="M14.9523 7.22464L15.314 7.44663C16.1298 7.94735 18.4326 8.77436 21.6025 9.01669C24.6769 9.25172 28.3558 8.91734 31.9715 7.3575C32.529 7.03526 33.1866 6.68156 33.9149 6.32216L35.8122 0.5L30.0489 3.44737L24.2866 0.5L18.5242 3.44737L12.761 0.5L14.9523 7.22464Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M22.2117 27.828C21.1265 28.1158 20.3251 29.1245 20.3251 30.3246C20.3251 31.5247 21.1265 32.5333 22.2117 32.8211V27.828Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M25.8135 41.7441C27.1662 41.6979 28.2489 40.5616 28.2489 39.1667C28.2489 37.7717 27.1662 36.6354 25.8135 36.5892V41.7441Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <Path fillRule="evenodd" clipRule="evenodd" d="M35.3722 10.5153C34.8628 10.7758 34.4008 11.0291 34.0034 11.2614C33.9319 11.3032 33.8581 11.3408 33.7825 11.3739C29.3647 13.3105 24.9225 13.7039 21.2804 13.4254C17.703 13.152 14.6754 12.2105 13.0902 11.2376L12.5485 10.9051C-3.62059 20.9902 -6.94595 55.111 24.2866 56.5C55.9348 55.0925 52.0991 20.0762 35.3722 10.5153ZM24.0126 22.2368C25.0072 22.2368 25.8135 23.0616 25.8135 24.0789V24.0985C29.2056 24.4582 31.8507 27.3912 31.8507 30.9561C31.8507 31.9735 31.0444 32.7982 30.0498 32.7982C29.0552 32.7982 28.2489 31.9735 28.2489 30.9561C28.2489 29.4303 27.2083 28.1531 25.8135 27.8265V32.9041C29.1556 32.951 31.8507 35.7369 31.8507 39.1667C31.8507 42.5965 29.1555 45.3823 25.8134 45.4292C25.8045 46.4388 25.0017 47.2544 24.0126 47.2544C23.018 47.2544 22.2117 46.4296 22.2117 45.4123V45.3111C19.0873 44.7108 16.7233 41.9053 16.7233 38.5351C16.7233 37.5177 17.5296 36.693 18.5242 36.693C19.5188 36.693 20.3251 37.5177 20.3251 38.5351C20.3251 39.853 21.1014 40.9854 22.2117 41.48V36.5545C19.1283 36.2297 16.7233 33.5644 16.7233 30.3246C16.7233 27.0847 19.1283 24.4194 22.2117 24.0946V24.0789C22.2117 23.0616 23.018 22.2368 24.0126 22.2368Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M38.0478 9.29228C39.7222 8.6152 41.4733 8.07549 43.0145 7.87627C44.6228 7.66838 45.6208 7.88 46.14 8.23403C47.133 8.91123 48.4748 8.63674 49.1368 7.62094C49.7989 6.60514 49.5305 5.23269 48.5375 4.5555C46.7209 3.31674 44.4409 3.23568 42.4727 3.4901C40.4375 3.75317 38.3137 4.43075 36.4588 5.18085C35.3489 5.62968 34.8048 6.91391 35.2436 8.04925C35.6824 9.18459 36.9379 9.74112 38.0478 9.29228Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

// Bordure gradient extérieure (wrapper sans overflow:hidden)
function GradientBorderWrapper({ children, height }: { children: React.ReactNode; height: number }) {
  if (height === 0) return <>{children}</>;
  return (
    <View style={{ width: POPUP_WIDTH, borderRadius: 24 }}>
      <Svg
        width={POPUP_WIDTH}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="outerBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9A9A9A" stopOpacity="0.3" />
            <Stop offset="25%" stopColor="#707070" stopOpacity="0.2" />
            <Stop offset="50%" stopColor="#B0B0B0" stopOpacity="0.35" />
            <Stop offset="75%" stopColor="#606060" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Rect
          x={BORDER_W / 2}
          y={BORDER_W / 2}
          width={POPUP_WIDTH - BORDER_W}
          height={height - BORDER_W}
          rx={24}
          ry={24}
          fill="transparent"
          stroke="url(#outerBorder)"
          strokeWidth={BORDER_W}
        />
      </Svg>
      {children}
    </View>
  );
}

function XpBlock({ currentXP, xpForNext, xpProgress, xpGained }: { currentXP: number; xpForNext: number; xpProgress: number; xpGained?: number }) {
  const [h, setH] = useState(0);
  const w = POPUP_WIDTH - SPACING[5] * 2;
  return (
    <View style={{ width: w }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      {h > 0 && (
        <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id="xpBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#9A9A9A" stopOpacity="0.3" />
              <Stop offset="25%" stopColor="#707070" stopOpacity="0.2" />
              <Stop offset="50%" stopColor="#B0B0B0" stopOpacity="0.35" />
              <Stop offset="75%" stopColor="#606060" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
            </LinearGradient>
          </Defs>
          <Rect
            x={BORDER_W / 2}
            y={BORDER_W / 2}
            width={w - BORDER_W}
            height={h - BORDER_W}
            rx={14}
            ry={14}
            fill="transparent"
            stroke="url(#xpBorder)"
            strokeWidth={BORDER_W}
          />
        </Svg>
      )}
      <View style={styles.xpBlock}>
        <View style={styles.xpLabelRow}>
          <Text style={styles.xpLabel}>
            {currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </Text>
          {xpGained != null && xpGained > 0 && (
            <Text style={styles.xpGainBadge}>+{xpGained.toLocaleString()} XP</Text>
          )}
        </View>
        <ProgressBar progress={xpProgress} size="md" color="#FFBC40" animated />
      </View>
    </View>
  );
}

interface ProgressionPopupProps {
  visible: boolean;
  onContinue: () => void;
  xpGained?: number;
  valorisationGain?: number;
}

export function ProgressionPopup({ visible, onContinue, xpGained, valorisationGain }: ProgressionPopupProps) {
  const profile = useUserStore((s) => s.profile);

  const totalValorisation = profile?.startups?.reduce(
    (sum, s) => sum + (s.valorisation ?? 0),
    0,
  ) ?? 0;

  // Affiche le gain de la partie si disponible, sinon le total du profil
  const displayValorisation = valorisationGain != null ? valorisationGain : totalValorisation;

  const totalXP = profile?.xp ?? 0;
  const { currentXP, xpForNext } = getLevelFromXP(totalXP);
  const xpProgress = xpForNext > 0 ? (currentXP / xpForNext) * 100 : 0;

  const popupScale = useSharedValue(0.85);
  const popupOpacity = useSharedValue(0);
  const [popupHeight, setPopupHeight] = useState(0);

  useEffect(() => {
    if (visible) {
      popupOpacity.value = withTiming(1, { duration: 280 });
      popupScale.value = withSpring(1, { damping: 14, stiffness: 130 });
    } else {
      popupOpacity.value = 0;
      popupScale.value = 0.85;
    }
  }, [visible, popupOpacity, popupScale]);

  const popupStyle = useAnimatedStyle(() => ({
    opacity: popupOpacity.value,
    transform: [{ scale: popupScale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <Animated.View style={popupStyle}>
          <GradientBorderWrapper height={popupHeight}>
            <View
              style={styles.popup}
              onLayout={(e) => setPopupHeight(e.nativeEvent.layout.height)}
            >
              {/* Background radial gradient */}
              <Svg style={StyleSheet.absoluteFill} width={POPUP_WIDTH} height={popupHeight || 1}>
                <Defs>
                  <RadialGradient id="progRadial" cx="50%" cy="35%" r="75%">
                    <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#progRadial)" rx="24" />
              </Svg>

              {/* Header */}
              <Animated.View entering={FadeIn.delay(80).duration(300)}>
                <Text style={styles.headerText}>Progression</Text>
              </Animated.View>

              {/* Titre */}
              <Animated.View entering={FadeInDown.delay(160).duration(320)}>
                <Text style={styles.titleText}>
                  {valorisationGain != null
                    ? 'VOTRE ENTREPRISE A GAGNÉ'
                    : 'VOS ENTREPRISES VALENT\nDÉSORMAIS'}
                </Text>
              </Animated.View>

              {/* Icône + shape tournante */}
              <Animated.View entering={FadeInDown.delay(240).duration(320)} style={styles.iconContainer}>
                <SpinningShape />
                <CoinIcon />
              </Animated.View>

              {/* Valeur */}
              <Animated.View entering={FadeInDown.delay(300).duration(320)}>
                <Text style={styles.valorisationValue}>
                  {valorisationGain != null && valorisationGain > 0 ? '+' : ''}
                  {formatFCFARaw(displayValorisation)}
                </Text>
              </Animated.View>

              {/* Bloc XP */}
              <Animated.View entering={FadeInDown.delay(380).duration(320)} style={styles.xpBlockOuter}>
                <XpBlock
                  currentXP={currentXP}
                  xpForNext={xpForNext}
                  xpProgress={xpProgress}
                  xpGained={xpGained}
                />
              </Animated.View>

              {/* Bouton */}
              <Animated.View entering={FadeInDown.delay(440).duration(320)} style={styles.buttonContainer}>
                <GameButton variant="yellow" fullWidth title="CONTINUER" onPress={onContinue} />
              </Animated.View>
            </View>
          </GradientBorderWrapper>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
  },
  popup: {
    width: POPUP_WIDTH,
    backgroundColor: '#081A2A',
    borderRadius: 24,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    paddingBottom: SPACING[5],
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  titleText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING[4],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  valorisationValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[5],
  },
  xpBlockOuter: {
    width: '100%',
    marginBottom: SPACING[4],
  },
  xpBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
    borderRadius: 14,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFBC40',
  },
  xpGainBadge: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  buttonContainer: {
    width: '100%',
  },
});
