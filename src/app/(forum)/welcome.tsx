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
  ForumDecorBottomLeftIcon,
  ForumDecorBottomRightIcon,
  ForumDecorTopLeftIcon,
  ForumDecorTopRightIcon,
  ForumLeaderboardRankTrophyIcon,
  ForumTrophyIcon,
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
const afyaFestImage = require('../../../assets/images/afya-fest-2026.png');
const africaHealthImage = require('../../../assets/images/africa-health-collaborative.png');
const mastercardImage = require('../../../assets/images/mastercard-foundation.png');

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
    forumCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 25,
      padding: SPACING[5],
      alignItems: 'center',
      gap: SPACING[5],
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    partnerRow: {
      width: '100%',
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
    partnerMastercardLogo: {
      height: 48,
      aspectRatio: 109 / 114,
    },
    partnerAfricaHealthLogo: {
      height: 40,
      aspectRatio: 1205 / 512,
    },
    afyaFestLogo: {
      width: Math.min(screenWidth * 0.6, 240),
      height: Math.min(screenWidth * 0.6, 240) * (512 / 809),
    },
    headlineContainer: {
      width: '100%',
      alignItems: 'center',
      marginTop: 0,
      paddingHorizontal: SPACING[1],
    },
    headlineQuestionSmall: {
      fontFamily: FONTS.title,
      fontSize: screenWidth * 0.052,
      lineHeight: screenWidth * 0.052 * 1.2,
      color: '#3ABDE8',
      textAlign: 'center',
      marginBottom: 2,
      letterSpacing: 0.3,
    },
    headlineQuestionLarge: {
      fontFamily: FONTS.title,
      fontSize: screenWidth * 0.058,
      lineHeight: screenWidth * 0.058 * 1.2,
      color: '#3ABDE8',
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    chevronPill: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FFBC40',
      alignItems: 'center',
      justifyContent: 'center',
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
      <Ionicons name="chevron-down" size={16} color={color} />
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
  styles: s,
}: {
  styles: ForumStyles;
}) {
  return (
    <View style={s.partnerRow}>
      <View style={s.partnerLeft}>
        <Image
          source={africaHealthImage}
          style={s.partnerAfricaHealthLogo}
          resizeMode="contain"
          accessibilityLabel="Africa Health Collaborative"
        />
      </View>
      <View style={s.partnerRight}>
        <Image
          source={mastercardImage}
          style={s.partnerMastercardLogo}
          resizeMode="contain"
          accessibilityLabel="En partenariat avec Mastercard Foundation"
        />
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

  return (
    <Animated.View entering={FadeIn.duration(380)} style={s.leaderboardOuter}>
      <View style={s.leaderboardContent}>
        <View style={s.leaderboardPillWrap}>
          <View style={s.leaderboardPill}>
            <Text style={[s.leaderboardPillText, { fontSize: fs(FONT_SIZES.lg) }]}>TOP ENTREPRENEURS</Text>
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
          style={styles.forumCard}
        >
          <PartnerStrip styles={styles} />

          <Image
            source={afyaFestImage}
            style={styles.afyaFestLogo}
            resizeMode="contain"
            accessibilityLabel="AFYA FEST 2026"
          />

          <View style={styles.headlineContainer}>
            <Text style={styles.headlineQuestionSmall}>QUI EST LE MEILLEUR</Text>
            <Text style={styles.headlineQuestionLarge}>ENTREPRENEUR HEALTHTECH ?</Text>
          </View>

          <View style={styles.chevronPill}>
            <BouncingChevron
              color="#FFFFFF"
              startDelayMs={620}
              springConfig={SPRING_BOUNCE_CHEVRON}
            />
          </View>
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
