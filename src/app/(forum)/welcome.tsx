/**
 * ForumWelcomeScreen — Écran d'accueil mode forum (thème événement / Agribusiness)
 *
 * Parcours direct : pas d'auth.
 * « Touchez pour jouer » → setup
 * QR store si EXPO_PUBLIC_STORE_URL (EAS extra.storeUrl)
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AgribusinessLeafIcon,
  AgribusinessThemeBadge,
  ConsortiumJeunesseSenegalLogo,
  ForumDecorBottomLeftIcon,
  ForumDecorBottomRightIcon,
  ForumDecorTopLeftIcon,
  ForumDecorTopRightIcon,
  ForumLeaderboardRankTrophyIcon,
  ForumPlayLeafIcon,
  ForumTrophyIcon,
  MastercardFoundationLogo,
} from '@/components/icons';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { useForumScale } from '@/hooks/useForumScale';
import { getForumLeaderboard, type ForumLeaderboardEntry } from '@/services/firebase/forumService';
import { SPACING } from '@/styles/spacing';
import { FONT_SIZES, FONTS } from '@/styles/typography';

// Sur téléphone: 480px max. Sur totem 1080px: jusqu'à 820px (76% de la largeur).
const MIN_H_PADDING = 14;
const MAX_H_PADDING = 40;
/** Alternance accueil événement / classement (forum) */
const FORUM_WELCOME_ROTATION_MS = 5000;
const shapeImage = require('../../../assets/images/shape.png');
const logoImage = require('../../../assets/images/logostartupludo.png');
const yeahImage = require('../../../assets/images/yeah.png');
const diceImage = require('../../../assets/images/de.png');

type ForumStyles = ReturnType<typeof createStyles>;

/** Oscillation symétrique (montée / descente) sans pic brusque — ressort amorti, pas de dépassement */
const OSCILLATE_SPRING = {
  damping: 17,
  stiffness: 64,
  mass: 0.92,
  overshootClamping: true,
} as const;

const TROPHY_ROCK_SPRING = {
  damping: 16,
  stiffness: 56,
  mass: 0.92,
  overshootClamping: true,
} as const;

const TROPHY_VB_W = 79;
const TROPHY_VB_H = 77;

type SpringOscConfig = {
  damping: number;
  stiffness: number;
  mass: number;
  overshootClamping: boolean;
};

function springWithStiffness(
  base: { damping: number; stiffness: number; mass: number; overshootClamping: boolean },
  stiffnessDelta: number
): SpringOscConfig {
  return {
    ...base,
    stiffness: base.stiffness + stiffnessDelta,
  };
}

/** Références stables pour éviter de relancer les effets à chaque rendu */
const SPRING_FLOAT_DICE = springWithStiffness(OSCILLATE_SPRING, 7);
const SPRING_FLOAT_LEAVES = springWithStiffness(OSCILLATE_SPRING, -6);
const SPRING_BOUNCE_CHEVRON = springWithStiffness(OSCILLATE_SPRING, -4);
const SPRING_TROPHY_TILT = springWithStiffness(TROPHY_ROCK_SPRING, 4);

function createStyles(screenWidth: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0C243E',
    },
    cornerDecorLayer: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    cornerDecorAnchor: {
      position: 'absolute',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      width: '100%',
    },
    headerWrap: {
      alignItems: 'center',
    },
    logoStack: {
      width: screenWidth * 0.88,
      height: Math.min(screenWidth * 0.32, 260),
      justifyContent: 'center',
      alignItems: 'center',
    },
    raysWrapper: {
      position: 'absolute',
      width: screenWidth * 0.92,
      height: screenWidth * 0.92,
      justifyContent: 'center',
      alignItems: 'center',
    },
    raysImage: {
      width: '100%',
      height: '100%',
      opacity: 0.38,
    },
    logoImage: {
      width: Math.min(screenWidth * 0.62, 520),
      height: Math.min(screenWidth * 0.2, 160),
      marginTop: SPACING[2],
    },
    /** Bloc carte + CTA + QR — marge négative pour remonter l’ensemble sous le logo */
    cardAndCtaColumn: {
      width: '100%',
      alignItems: 'stretch',
      marginTop: -SPACING[6],
    },
    /** Plus d’air entre la carte et le bouton */
    ctaBelowCard: {
      width: '100%',
      marginTop: SPACING[5],
    },
    bottomCtaStack: {
      alignItems: 'stretch',
    },
    bottomQrSection: {
      marginTop: SPACING[3],
    },
    bottomQrInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING[3],
      paddingVertical: SPACING[3],
      paddingHorizontal: SPACING[4],
    },
    bottomQrTitle: {
      flex: 1,
      fontFamily: FONTS.title,
      fontSize: FONT_SIZES.md,
      color: '#FFBC40',
      textAlign: 'left',
      letterSpacing: 0.5,
    },
    bottomQrWrapper: {
      flexShrink: 0,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 4,
    },
    cardOuter: {
      marginBottom: 0,
    },
    cardInner: {
      padding: SPACING[4],
    },
    partnerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: SPACING[3],
    },
    partnerLeft: {
      flex: 1,
      justifyContent: 'flex-start',
      minWidth: 0,
    },
    partnerRight: {
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
    },
    yeahLogoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING[3],
      marginBottom: SPACING[3],
    },
    yeahLogo: {
      width: '100%',
      maxWidth: 280,
      height: Math.min(42, screenWidth * 0.11),
      maxHeight: 48,
    },
    themeBadgeWrap: {
      alignItems: 'center',
      marginTop: SPACING[2],
    },
    heroVisual: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING[3],
      marginBottom: SPACING[3],
    },
    heroVisualLeft: {
      flex: 1,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingRight: SPACING[4],
    },
    heroTrophyCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING[4],
      marginLeft: -SPACING[2],
    },
    heroVisualRight: {
      flex: 1,
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingLeft: SPACING[4],
    },
    heroDiceContainer: {
      width: screenWidth * 0.23,
      height: screenWidth * 0.25,
      position: 'relative',
    },
    heroDiceLarge: {
      width: screenWidth * 0.13,
      height: screenWidth * 0.13,
      position: 'absolute',
      top: 0,
      left: 0,
      transform: [{ rotate: '-10deg' }],
    },
    heroDiceSmall: {
      width: screenWidth * 0.075,
      height: screenWidth * 0.075,
      position: 'absolute',
      bottom: 10,
      right: 10,
      transform: [{ rotate: '15deg' }],
    },
    heroCoinsContainer: {
      width: screenWidth * 0.16,
      height: screenWidth * 0.2,
      position: 'relative',
    },
    heroCoinLarge: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
    heroCoinSmall: {
      position: 'absolute',
      bottom: 0,
      left: 0,
    },
    headlineContainer: {
      alignItems: 'center',
      marginTop: 0,
      paddingHorizontal: SPACING[1],
    },
    headlineQuestionSmall: {
      fontFamily: FONTS.title,
      fontSize: screenWidth * 0.052,
      lineHeight: screenWidth * 0.052 * 1.12,
      color: '#FFFFFF',
      textAlign: 'center',
      textShadowColor: '#4CAF50',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    headlineQuestionLarge: {
      fontFamily: FONTS.title,
      fontSize: screenWidth * 0.058,
      lineHeight: screenWidth * 0.058 * 1.1,
      color: '#FFFFFF',
      textAlign: 'center',
      textShadowColor: '#4CAF50',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      letterSpacing: 0.2,
    },
    chevronWrap: {
      alignItems: 'center',
      marginTop: SPACING[2],
    },
    footer: {
      fontFamily: FONTS.body,
      fontSize: FONT_SIZES.sm,
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
      marginTop: SPACING[2],
    },
    headerTrophyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING[2],
    },
    leaderboardOuter: {
      marginBottom: 0,
    },
    leaderboardContent: {
      width: '100%',
    },
    leaderboardPillWrap: {
      alignSelf: 'center',
      position: 'relative',
      marginBottom: SPACING[4],
    },
    leaderboardPill: {
      backgroundColor: '#FFFFFF',
      paddingVertical: SPACING[2],
      paddingHorizontal: SPACING[5],
      borderRadius: 999,
    },
    leaderboardPillLeaf: {
      position: 'absolute',
      top: -6,
      right: -4,
    },
    leaderboardPillText: {
      fontFamily: FONTS.title,
      color: '#2E7D32',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    leaderboardRowCard: {
      marginBottom: SPACING[3],
    },
    /** Contenu du cercle profil (bordure = DynamicGradientBorder, pas de fond) */
    leaderboardAvatarInner: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leaderboardRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING[3],
      paddingHorizontal: SPACING[3],
      gap: SPACING[2],
    },
    leaderboardMeta: {
      flex: 1,
      minWidth: 0,
    },
    leaderboardStartup: {
      fontFamily: FONTS.title,
      fontSize: FONT_SIZES.sm,
      color: '#FFBC40',
    },
    leaderboardPerson: {
      fontFamily: FONTS.body,
      fontSize: FONT_SIZES.xs,
      color: 'rgba(255,255,255,0.88)',
      marginTop: 2,
    },
    leaderboardXp: {
      fontFamily: FONTS.bodyBold,
      fontSize: FONT_SIZES.sm,
      color: '#FFFFFF',
    },
    leaderboardRankTrophyCell: {
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
}

/** Flottement vertical léger (dés / feuilles) — ressort pour montée et descente fluides */
const GentleFloat = memo(function GentleFloat({
  children,
  amplitude = 6,
  /** Délai avant le début des oscillations (phase indépendante) */
  startDelayMs = 0,
  /** Ressort légèrement différent pour éviter que les cycles se verrouillent entre eux */
  springConfig = OSCILLATE_SPRING,
}: {
  children: ReactNode;
  amplitude?: number;
  startDelayMs?: number;
  springConfig?: SpringOscConfig;
}) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    y.value = withDelay(
      startDelayMs,
      withRepeat(
        withSequence(
          withSpring(-amplitude, springConfig),
          withSpring(0, springConfig)
        ),
        -1,
        false
      )
    );
  }, [reduceMotion, y, amplitude, startDelayMs, springConfig]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
});

/** Chevron invite à défiler / jouer */
const BouncingChevron = memo(function BouncingChevron({
  color,
  startDelayMs = 0,
  springConfig = OSCILLATE_SPRING,
}: {
  color: string;
  startDelayMs?: number;
  springConfig?: SpringOscConfig;
}) {
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    translateY.value = withDelay(
      startDelayMs,
      withRepeat(
        withSequence(
          withSpring(6, springConfig),
          withSpring(0, springConfig)
        ),
        -1,
        false
      )
    );
  }, [reduceMotion, translateY, startDelayMs, springConfig]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="chevron-down" size={22} color={color} />
    </Animated.View>
  );
});

/** Trophée : basculement gauche–droite (rotation autour du centre) */
const TrophyTilt = memo(function TrophyTilt({
  width,
  children,
  startDelayMs = 0,
  springConfig = TROPHY_ROCK_SPRING,
}: {
  width: number;
  children: ReactNode;
  startDelayMs?: number;
  springConfig?: SpringOscConfig;
}) {
  const reduceMotion = useReducedMotion();
  const rotate = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    rotate.value = withDelay(
      startDelayMs,
      withRepeat(
        withSequence(
          withSpring(7, springConfig),
          withSpring(-7, springConfig)
        ),
        -1,
        false
      )
    );
  }, [reduceMotion, rotate, startDelayMs, springConfig]);
  const h = (width * TROPHY_VB_H) / TROPHY_VB_W;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));
  return (
    <Animated.View style={[{ width, height: h, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      {children}
    </Animated.View>
  );
});

type CornerDecorId = 'tl' | 'tr' | 'bl' | 'br';

const CORNER_AMBIENT: Record<
  CornerDecorId,
  { yAmp: number; rotDeg: number; scaleAmp: number; startDelayMs: number; stiffnessSkew: number }
> = {
  /** Haut gauche : léger balancement vers le bas + rotation douce */
  tl: { yAmp: 3.5, rotDeg: 1.4, scaleAmp: 1.05, startDelayMs: 0, stiffnessSkew: 0 },
  /** Haut droite : miroir */
  tr: { yAmp: 3.5, rotDeg: -1.4, scaleAmp: 1.05, startDelayMs: 240, stiffnessSkew: 4 },
  /** Bas gauche : flotte vers le haut (vers le centre) */
  bl: { yAmp: -4, rotDeg: -1.2, scaleAmp: 1.06, startDelayMs: 520, stiffnessSkew: -3 },
  /** Bas droite */
  br: { yAmp: -4, rotDeg: 1.2, scaleAmp: 1.06, startDelayMs: 780, stiffnessSkew: 6 },
};

/**
 * Animation continue sur les décorations de coins (haut / bas).
 * Désactivée si « Réduire les mouvements ».
 */
const ForumCornerIconAmbient = memo(function ForumCornerIconAmbient({
  cornerId,
  children,
}: {
  cornerId: CornerDecorId;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    const cfg = CORNER_AMBIENT[cornerId];
    const motionSpring = springWithStiffness(OSCILLATE_SPRING, cfg.stiffnessSkew);
    const scaleSpring: SpringOscConfig = {
      ...motionSpring,
      stiffness: Math.max(44, motionSpring.stiffness - 10),
      damping: 18,
    };

    const loopY = withRepeat(
      withSequence(
        withSpring(cfg.yAmp, motionSpring),
        withSpring(0, motionSpring)
      ),
      -1,
      false
    );
    const loopRot = withRepeat(
      withSequence(
        withSpring(cfg.rotDeg, motionSpring),
        withSpring(0, motionSpring)
      ),
      -1,
      false
    );
    const loopScale = withRepeat(
      withSequence(
        withSpring(cfg.scaleAmp, scaleSpring),
        withSpring(1, scaleSpring)
      ),
      -1,
      false
    );

    translateY.value = withDelay(cfg.startDelayMs, loopY);
    rotate.value = withDelay(cfg.startDelayMs + 40, loopRot);
    scale.value = withDelay(cfg.startDelayMs + 80, loopScale);
  }, [reduceMotion, cornerId, translateY, rotate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
});

const SpinningRays = memo(function SpinningRays({ styles }: { styles: ForumStyles }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.raysWrapper, animatedStyle]}>
      <Image source={shapeImage} style={styles.raysImage} resizeMode="contain" />
    </Animated.View>
  );
});

/** Décorations coins écran (sous le contenu, pointerEvents none) */
const ForumScreenCornerDecor = memo(function ForumScreenCornerDecor({
  styles: decorStyles,
  insetsTop,
  screenWidth,
  bottomIconsFromBottom,
}: {
  styles: ForumStyles;
  insetsTop: number;
  screenWidth: number;
  /** Distance depuis le bas de l’écran jusqu’au bas des icônes (au-dessus de la barre CTA+QR) */
  bottomIconsFromBottom: number;
}) {
  const scale = Math.min(1, screenWidth / 400);
  const tlW = Math.round(51 * scale);
  const tlH = Math.round(68 * scale);
  const trW = Math.round(59 * scale);
  const trH = Math.round(68 * scale);
  const blW = Math.round(58 * scale);
  const blH = Math.round(68 * scale);
  const brW = Math.round(64 * scale);
  const brH = Math.round((64 * (93 / 109)) * scale);

  return (
    <View style={decorStyles.cornerDecorLayer} pointerEvents="none">
      <Animated.View
        entering={FadeInLeft.delay(100).duration(520).springify().damping(18)}
        style={[decorStyles.cornerDecorAnchor, { top: insetsTop + SPACING[1], left: 0 }]}
      >
        <ForumCornerIconAmbient cornerId="tl">
          <ForumDecorTopLeftIcon width={tlW} height={tlH} />
        </ForumCornerIconAmbient>
      </Animated.View>
      <Animated.View
        entering={FadeInRight.delay(140).duration(520).springify().damping(18)}
        style={[decorStyles.cornerDecorAnchor, { top: insetsTop + SPACING[1], right: 0 }]}
      >
        <ForumCornerIconAmbient cornerId="tr">
          <ForumDecorTopRightIcon width={trW} height={trH} />
        </ForumCornerIconAmbient>
      </Animated.View>
      <Animated.View
        entering={FadeInLeft.delay(220).duration(520).springify().damping(18)}
        style={[decorStyles.cornerDecorAnchor, { bottom: bottomIconsFromBottom, left: 0 }]}
      >
        <ForumCornerIconAmbient cornerId="bl">
          <ForumDecorBottomLeftIcon width={blW} height={blH} />
        </ForumCornerIconAmbient>
      </Animated.View>
      <Animated.View
        entering={FadeInRight.delay(260).duration(520).springify().damping(18)}
        style={[decorStyles.cornerDecorAnchor, { bottom: bottomIconsFromBottom, right: 0 }]}
      >
        <ForumCornerIconAmbient cornerId="br">
          <ForumDecorBottomRightIcon width={brW} height={brH} />
        </ForumCornerIconAmbient>
      </Animated.View>
    </View>
  );
});

const PartnerStrip = memo(function PartnerStrip({
  screenWidth,
  styles: s,
}: {
  screenWidth: number;
  styles: ForumStyles;
}) {
  return (
    <View style={s.partnerRow}>
      <View style={s.partnerLeft}>
        <ConsortiumJeunesseSenegalLogo width={Math.min(screenWidth * 0.22, 92)} />
      </View>
      <View style={s.partnerRight}>
        <MastercardFoundationLogo height={32} />
      </View>
    </View>
  );
});

const ForumLeaderboardSection = memo(function ForumLeaderboardSection({
  cardWidth,
  styles: s,
  entries,
  fs,
  sp,
}: {
  cardWidth: number;
  styles: ForumStyles;
  entries: ForumLeaderboardEntry[];
  fs: (n: number) => number;
  sp: (n: number) => number;
}) {
  const avatarSize = sp(36);
  const trophySize = sp(46);
  const pillLeafW = sp(18);
  const pillLeafH = sp(10);

  return (
    <Animated.View entering={FadeIn.duration(380)} style={s.leaderboardOuter}>
      <View style={s.leaderboardContent}>
        <View style={s.leaderboardPillWrap}>
          <View style={s.leaderboardPill}>
            <Text style={[s.leaderboardPillText, { fontSize: fs(FONT_SIZES.lg) }]}>TOP ENTREPRENEURS</Text>
          </View>
          <View style={s.leaderboardPillLeaf} pointerEvents="none">
            <ForumPlayLeafIcon width={pillLeafW} height={pillLeafH} />
          </View>
        </View>
        {entries.length === 0 ? (
          <View style={s.leaderboardRowCard}>
            <Text style={[s.leaderboardPerson, { textAlign: 'center', paddingVertical: sp(20), fontSize: fs(FONT_SIZES.base) }]}>
              Aucune partie jouée pour l'instant
            </Text>
          </View>
        ) : (
          entries.map((entry, i) => {
            const rank = (i + 1) as 1 | 2 | 3;
            return (
              <View key={entry.name} style={[s.leaderboardRowCard, { marginBottom: sp(12) }]}>
                <DynamicGradientBorder
                  borderRadius={sp(14)}
                  fill="rgba(10, 25, 41, 0.48)"
                  boxWidth={cardWidth}
                >
                  <View style={[s.leaderboardRowInner, { paddingVertical: sp(12), paddingHorizontal: sp(12), gap: sp(10) }]}>
                    <View accessibilityRole="image" accessibilityLabel={entry.name}>
                      <DynamicGradientBorder borderRadius={avatarSize / 2} fill="transparent" boxWidth={avatarSize}>
                        <View style={[s.leaderboardAvatarInner, { width: avatarSize, height: avatarSize }]}>
                          <Ionicons name="person" size={sp(20)} color="#FFFFFF" />
                        </View>
                      </DynamicGradientBorder>
                    </View>
                    <View style={s.leaderboardMeta}>
                      <Text style={[s.leaderboardStartup, { fontSize: fs(FONT_SIZES.base) }]} numberOfLines={1}>
                        {entry.startupName.toUpperCase()}
                      </Text>
                      <Text style={[s.leaderboardPerson, { fontSize: fs(FONT_SIZES.sm) }]} numberOfLines={1}>
                        {entry.name}
                      </Text>
                    </View>
                    <Text style={[s.leaderboardXp, { fontSize: fs(FONT_SIZES.base) }]}>{entry.bestScore} pts</Text>
                    <View style={s.leaderboardRankTrophyCell}>
                      <ForumLeaderboardRankTrophyIcon rank={rank} size={trophySize} />
                    </View>
                  </View>
                </DynamicGradientBorder>
              </View>
            );
          })
        )}
      </View>
    </Animated.View>
  );
});

type ForumContentPhase = 'welcome' | 'leaderboard';

export default function ForumWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [contentPhase, setContentPhase] = useState<ForumContentPhase>('welcome');
  const [leaderboardEntries, setLeaderboardEntries] = useState<ForumLeaderboardEntry[]>([]);

  // Charger le classement au montage, et rafraîchir à chaque fois qu'on affiche la section
  useEffect(() => {
    getForumLeaderboard(3).then(setLeaderboardEntries).catch(() => {});
  }, []);

  useEffect(() => {
    if (contentPhase === 'leaderboard') {
      getForumLeaderboard(3).then(setLeaderboardEntries).catch(() => {});
    }
  }, [contentPhase]);

  const storeUrlRaw = Constants.expoConfig?.extra?.storeUrl as string | undefined;
  const storeUrlForQr = typeof storeUrlRaw === 'string' ? storeUrlRaw.trim() : '';
  const hasStoreQr = storeUrlForQr.length > 0;

  const styles = useMemo(() => createStyles(screenWidth), [screenWidth]);
  const { fs: forumFs, sp: forumSp } = useForumScale();

  const { horizontalPad, cardWidth } = useMemo(() => {
    // Sur petit téléphone: ~4% de padding. Sur totem 1080px: ~4.5% → card ~920px.
    const basePad = Math.min(MAX_H_PADDING, Math.max(MIN_H_PADDING, screenWidth * 0.045));
    // Pas de plafond fixe : la carte utilise ~91% de la largeur disponible
    const cardW = screenWidth - basePad * 2;
    const hPad = basePad;
    return { horizontalPad: hPad, cardWidth: cardW };
  }, [screenWidth]);

  const handlePlay = useCallback(() => {
    router.push('/(forum)/setup');
  }, [router]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setContentPhase((p) => (p === 'welcome' ? 'leaderboard' : 'welcome'));
    }, FORUM_WELCOME_ROTATION_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const qrSize = Math.min(56, screenWidth * 0.14);
  const trophyW = Math.min(screenWidth * 0.28, 110);
  const leafLarge = Math.min(46, screenWidth * 0.11);
  const leafSmall = Math.min(26, screenWidth * 0.065);
  const badgeW = Math.min(cardWidth - SPACING[5] * 2, 136);
  const headerTrophyW = Math.min(screenWidth * 0.38, 130);
  const showLeaderboard = contentPhase === 'leaderboard';

  /** Icônes coins bas : collées au bas de l’écran (safe area) */
  const bottomIconsFromBottom = insets.bottom;

  /** Marge bas du scroll (safe area + confort) — CTA est dans le flux */
  const scrollBottomPadding = insets.bottom + SPACING[4];

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      <ForumScreenCornerDecor
        styles={styles}
        insetsTop={insets.top}
        screenWidth={screenWidth}
        bottomIconsFromBottom={bottomIconsFromBottom}
      />

      {/* En-tête : logo Startup Ludo ou trophée (mode classement) */}
      <View style={[styles.headerWrap, { paddingTop: insets.top + SPACING[1], paddingHorizontal: horizontalPad }]}>
        <View style={styles.logoStack}>
          {!showLeaderboard ? <SpinningRays styles={styles} /> : null}
          <Animated.View
            key={contentPhase}
            entering={FadeIn.duration(420)}
            style={showLeaderboard ? styles.headerTrophyWrap : { alignItems: 'center', justifyContent: 'center' }}
          >
            {showLeaderboard ? (
              <TrophyTilt width={headerTrophyW} startDelayMs={180} springConfig={SPRING_TROPHY_TILT}>
                <ForumTrophyIcon width={headerTrophyW} />
              </TrophyTilt>
            ) : (
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            )}
          </Animated.View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            flexGrow: 1,
            justifyContent: 'center',
            paddingBottom: scrollBottomPadding,
            paddingHorizontal: horizontalPad,
            paddingTop: SPACING[2],
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Carte événement ou classement + CTA + QR */}
        <View style={styles.cardAndCtaColumn}>
        {contentPhase === 'welcome' ? (
        <Animated.View
          entering={FadeInDown.delay(200).duration(520).springify().damping(17)}
          style={styles.cardOuter}
        >
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)" boxWidth={cardWidth}>
            <View style={styles.cardInner}>
              <Animated.View entering={FadeInDown.delay(260).duration(420).springify().damping(18)}>
                <PartnerStrip screenWidth={screenWidth} styles={styles} />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(320).duration(420)} style={styles.yeahLogoWrap}>
                <Image
                  source={yeahImage}
                  style={styles.yeahLogo}
                  resizeMode="contain"
                  accessibilityLabel="YEAH — Yaakaar jeunesse et entrepreneuriat"
                />
              </Animated.View>

              <Animated.View entering={ZoomIn.delay(380).duration(450).springify().damping(16)} style={styles.themeBadgeWrap}>
                <AgribusinessThemeBadge width={badgeW} />
              </Animated.View>

              <View style={styles.heroVisual}>
                <Animated.View
                  entering={FadeInRight.delay(420).duration(450).springify().damping(17)}
                  style={styles.heroVisualLeft}
                >
                  <GentleFloat amplitude={5} springConfig={SPRING_FLOAT_DICE}>
                    <View style={styles.heroDiceContainer}>
                      <Image source={diceImage} style={styles.heroDiceLarge} resizeMode="contain" />
                      <Image source={diceImage} style={styles.heroDiceSmall} resizeMode="contain" />
                    </View>
                  </GentleFloat>
                </Animated.View>

                <Animated.View
                  entering={ZoomIn.delay(440).duration(480).springify().damping(15)}
                  style={styles.heroTrophyCenter}
                >
                  <TrophyTilt
                    width={trophyW}
                    startDelayMs={220}
                    springConfig={SPRING_TROPHY_TILT}
                  >
                    <ForumTrophyIcon width={trophyW} />
                  </TrophyTilt>
                </Animated.View>

                <Animated.View
                  entering={FadeInLeft.delay(420).duration(450).springify().damping(17)}
                  style={styles.heroVisualRight}
                >
                  <GentleFloat
                    amplitude={5}
                    startDelayMs={440}
                    springConfig={SPRING_FLOAT_LEAVES}
                  >
                    <View style={styles.heroCoinsContainer}>
                      <View style={styles.heroCoinLarge}>
                        <AgribusinessLeafIcon size={leafLarge} />
                      </View>
                      <View style={styles.heroCoinSmall}>
                        <AgribusinessLeafIcon size={leafSmall} />
                      </View>
                    </View>
                  </GentleFloat>
                </Animated.View>
              </View>

              <Animated.View entering={FadeInDown.delay(500).duration(420)} style={styles.headlineContainer}>
                <Text style={styles.headlineQuestionSmall}>QUI EST LE MEILLEUR</Text>
                <Text style={styles.headlineQuestionLarge}>ENTREPRENEUR AGRICOLE ?</Text>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(560).duration(400)} style={styles.chevronWrap}>
                <BouncingChevron
                  color="#FFBC40"
                  startDelayMs={620}
                  springConfig={SPRING_BOUNCE_CHEVRON}
                />
              </Animated.View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
        ) : (
          <ForumLeaderboardSection cardWidth={cardWidth} styles={styles} entries={leaderboardEntries} fs={forumFs} sp={forumSp} />
        )}

        <Animated.View
          entering={FadeIn.duration(480).delay(160)}
          style={styles.ctaBelowCard}
        >
          <View style={styles.bottomCtaStack}>
            <GameButton
              variant="yellow"
              size="lg"
              fullWidth
              title="Touchez pour jouer"
              leftIcon={<ForumPlayLeafIcon width={30} height={16} />}
              onPress={handlePlay}
            />

            {hasStoreQr ? (
              <View style={styles.bottomQrSection}>
                <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)" boxWidth={cardWidth}>
                  <View style={styles.bottomQrInner}>
                    <Text style={styles.bottomQrTitle}>POURSUIVRE ICI</Text>
                    <View style={styles.bottomQrWrapper}>
                      <QRCode
                        value={storeUrlForQr}
                        size={qrSize}
                        backgroundColor="#FFFFFF"
                        color="#0C243E"
                      />
                    </View>
                  </View>
                </DynamicGradientBorder>
              </View>
            ) : null}

            <Text style={styles.footer}>By Concree</Text>
          </View>
        </Animated.View>
        </View>
      </ScrollView>

    </View>
  );
}
