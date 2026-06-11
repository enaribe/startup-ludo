import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInLeft,  // utilisé dans LevelCard
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { COLORS } from '@/styles/colors';
import { DynamicGradientBorder } from '@/components/ui';
import { FONTS } from '@/styles/typography';
import type { ChallengeLevel } from '@/types/challenge';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, FeBlend, FeColorMatrix, FeComposite, FeFlood, FeGaussianBlur, FeOffset, Filter, G, Path } from 'react-native-svg';

// ─── Layout constants ──────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_H        = 90;   // hauteur d'une carte de niveau
const CARD_GAP      = 24;   // espace entre items
const CARD_INDENT   = 30;   // décalage zigzag des cartes de niveau
const TUBE_W        = 12;   // largeur de la barre
const TUBE_COL_W    = 44;   // largeur de la colonne barre à gauche
const PAD_TOP       = 20;
const PAD_RIGHT     = 14;
// Largeur d'une carte de niveau = écran - colonne barre - marge droite - décalage zigzag
const CARD_WIDTH    = SCREEN_WIDTH - TUBE_COL_W - PAD_RIGHT - CARD_INDENT;
// Sous-niveaux : largeur fixe réduite + escalier
const SUB_CARD_W    = 150;  // largeur fixe des sous-niveaux
// Largeur utile de la colonne cartes (sans la barre ni padding droit)
const COL_WIDTH     = SCREEN_WIDTH - TUBE_COL_W - PAD_RIGHT;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GalleryNode {
  id: string;
  levelNumber: number;
  name: string;
  description: string;
  xpRequired: number;
  xpCurrent: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isUnlocked: boolean;
  posture?: string;
  iconName?: string;
}

interface ChallengeGalleryMapProps {
  levels: ChallengeLevel[];
  currentLevel: number;
  currentSubLevel: number;
  xpByLevel: Record<number, number>;
  totalXp: number;
  onNodePress?: (node: GalleryNode) => void;
}

// ─── Barre de progression ───────────────────────────────────────────────────────

interface ProgressTubeProps {
  currentLevel: number;
  totalLevels: number;
  // Y absolu (depuis le top du scroll content) du centre de la carte du niveau actuel
  // calculé par le parent une fois la liste construite
  currentLevelY: number;
  // Hauteur totale du contenu (pour la flamme)
  contentHeight: number;
}

const ProgressTube = memo(function ProgressTube({
  currentLevelY,
  contentHeight,
}: ProgressTubeProps) {
  // Dans le référentiel du tube (qui inclut PAD_TOP + contentHeight + paddingBottom) :
  // - La fusée est à PAD_TOP + currentLevelY - 28
  // - La flamme doit avoir son top = PAD_TOP + currentLevelY (centre fusée) et bottom = 0
  const tubeFlameTop = PAD_TOP + currentLevelY;
  const tubeContentBottom = PAD_TOP + contentHeight + 120; // 120 = paddingBottom du scroll
  const flameTopAnim = useSharedValue(tubeContentBottom);
  useEffect(() => {
    flameTopAnim.value = withDelay(300, withSpring(tubeFlameTop, { damping: 12, stiffness: 50 }));
  }, [tubeFlameTop, tubeContentBottom, flameTopAnim]);
  const flameStyle = useAnimatedStyle(() => ({ top: flameTopAnim.value }));

  const rocketY = useSharedValue(0);
  useEffect(() => {
    rocketY.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0,  { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [rocketY]);
  const rocketStyle = useAnimatedStyle(() => ({ transform: [{ translateY: rocketY.value }] }));

  // Fusée centrée sur currentLevelY (dans le référentiel du tube = PAD_TOP + y)
  const rocketAbsTop = PAD_TOP + currentLevelY - 28;

  return (
    <View style={styles.tubeColumn} pointerEvents="none">
      {/* Barre s'étirant sur toute la hauteur des cartes */}
      <View style={styles.tube}>
        {/* Gradient positionné en absolu : top animé → bas fixe */}
        <Animated.View style={[styles.tubeFlame, flameStyle]}>
          <LinearGradient
            colors={['#ffbc40', '#9d6600']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1, borderRadius: TUBE_W / 2 }}
          />
        </Animated.View>
      </View>

      {/* Fusée sur le niveau actuel */}
      <Animated.View style={[styles.rocket, { top: rocketAbsTop }, rocketStyle]}>
        <Svg width="57" height="57" viewBox="0 0 57 57" fill="none">
          <G filter="url(#filter0_d_6128_3923)">
            <Path fillRule="evenodd" clipRule="evenodd" d="M32.8186 4.3204C30.4045 1.95931 26.6513 1.94365 24.2207 4.28452C21.0143 7.37266 17.4767 12.7729 15.77 20.9508C15.1011 21.1644 14.4675 21.5283 13.8955 21.9728C12.9477 22.7095 12.0615 23.7474 11.3026 25.011C9.7925 27.5251 8.70977 31.0565 8.67903 35.318C8.58532 36.1748 8.81606 37.0771 9.32899 37.7773C9.89852 38.5547 10.88 39.1393 12.1012 38.9575C13.223 38.7906 14.2157 38.0215 15.0728 36.9217L15.1243 36.8549C15.3667 38.101 15.7621 39.1931 16.4738 39.9213C16.8715 40.3282 17.3641 40.6162 17.9342 40.7313C18.4888 40.8433 19.0148 40.7714 19.4668 40.6293C20.3251 40.3595 21.1236 39.7695 21.797 39.1815C22.7074 38.3867 23.7215 37.2806 24.6608 36.2561C25.0958 35.7818 25.5148 35.3248 25.9 34.9242C26.5534 34.2449 27.133 33.6962 27.6374 33.3246C28.1666 32.9347 28.4056 32.8982 28.4199 32.896C28.4339 32.8983 28.6713 32.9365 29.1981 33.3311C29.6999 33.7069 30.2756 34.2605 30.9243 34.9452C31.3067 35.3489 31.7225 35.8094 32.1541 36.2874C33.0862 37.3197 34.0925 38.4342 34.9972 39.2366C35.6665 39.8301 36.4608 40.4268 37.3173 40.7038C37.7683 40.8496 38.2937 40.9259 38.8491 40.8186C39.42 40.7082 39.9146 40.4243 40.3151 40.0207C41.0403 39.29 41.4444 38.1841 41.6949 36.9218C41.723 36.9594 41.751 36.9965 41.7791 37.0331C42.6284 38.14 43.6157 38.9174 44.7362 39.0937C45.9561 39.2857 46.9417 38.7093 47.5167 37.9366C48.0345 37.2408 48.2716 36.3404 48.1839 35.4828C48.1831 31.2212 47.1251 27.6809 45.6327 25.1542C44.8827 23.8844 44.0038 22.8391 43.0612 22.0945C42.4796 21.6351 41.833 21.2596 41.149 21.0424C39.4994 12.8624 36.0055 7.43742 32.8186 4.3204ZM13.9106 26.5786C14.303 25.9252 14.7136 25.3894 15.1149 24.9676C14.8872 26.8661 14.7549 28.8892 14.7374 31.041C13.9757 33.0309 13.2647 34.2914 12.6729 35.0508C12.2149 35.6384 11.8946 35.8443 11.7456 35.9142C11.7116 35.836 11.6912 35.7299 11.7045 35.6386C11.7149 35.5676 11.7202 35.4959 11.7205 35.4242C11.7342 31.6155 12.6978 28.5977 13.9106 26.5786ZM44.192 35.1823C43.6055 34.418 42.9034 33.1516 42.1557 31.1554C42.1533 29.0035 42.0352 26.9794 41.8209 25.079C42.2192 25.5042 42.626 26.0434 43.0138 26.7C44.2124 28.7292 45.1548 31.755 45.1418 35.5636C45.1415 35.6354 45.1464 35.7071 45.1562 35.7781C45.1689 35.8695 45.1477 35.9755 45.1132 36.0535C44.9647 35.9822 44.6458 35.7738 44.192 35.1823ZM28.4669 19.2062C30.707 19.2156 32.5293 17.4072 32.5371 15.1672C32.545 12.9272 30.7354 11.1037 28.4954 11.0943C26.2554 11.085 24.4331 12.8933 24.4252 15.1334C24.4174 17.3734 26.2269 19.1969 28.4669 19.2062Z" fill="#1F91D0"/>
            <Path d="M25.0159 37.3204C26.8865 35.4642 29.9086 35.4768 31.766 37.3486C33.2827 38.8769 33.5894 41.2306 32.515 43.0949L31.1603 45.4456C29.9157 47.6052 26.7943 47.5921 25.5648 45.4222L24.2267 43.0603C23.1653 41.1871 23.4886 38.836 25.0159 37.3204Z" fill="#1F91D0"/>
            <Path fillRule="evenodd" clipRule="evenodd" d="M32.8186 4.3204C30.4045 1.95931 26.6513 1.94365 24.2207 4.28452C21.0143 7.37266 17.4767 12.7729 15.77 20.9508C15.1011 21.1644 14.4675 21.5283 13.8955 21.9728C12.9477 22.7095 12.0615 23.7474 11.3026 25.011C9.7925 27.5251 8.70977 31.0565 8.67903 35.318C8.58532 36.1748 8.81606 37.0771 9.32899 37.7773C9.89852 38.5547 10.88 39.1393 12.1012 38.9575C13.223 38.7906 14.2157 38.0215 15.0728 36.9217L15.1243 36.8549C15.3667 38.101 15.7621 39.1931 16.4738 39.9213C16.8715 40.3282 17.3641 40.6162 17.9342 40.7313C18.4888 40.8433 19.0148 40.7714 19.4668 40.6293C20.3251 40.3595 21.1236 39.7695 21.797 39.1815C22.7074 38.3867 23.7215 37.2806 24.6608 36.2561C25.0958 35.7818 25.5148 35.3248 25.9 34.9242C26.5534 34.2449 27.133 33.6962 27.6374 33.3246C28.1666 32.9347 28.4056 32.8982 28.4199 32.896C28.4339 32.8983 28.6713 32.9365 29.1981 33.3311C29.6999 33.7069 30.2756 34.2605 30.9243 34.9452C31.3067 35.3489 31.7225 35.8094 32.1541 36.2874C33.0862 37.3197 34.0925 38.4342 34.9972 39.2366C35.6665 39.8301 36.4608 40.4268 37.3173 40.7038C37.7683 40.8496 38.2937 40.9259 38.8491 40.8186C39.42 40.7082 39.9146 40.4243 40.3151 40.0207C41.0403 39.29 41.4444 38.1841 41.6949 36.9218C41.723 36.9594 41.751 36.9965 41.7791 37.0331C42.6284 38.14 43.6157 38.9174 44.7362 39.0937C45.9561 39.2857 46.9417 38.7093 47.5167 37.9366C48.0345 37.2408 48.2716 36.3404 48.1839 35.4828C48.1831 31.2212 47.1251 27.6809 45.6327 25.1542C44.8827 23.8844 44.0038 22.8391 43.0612 22.0945C42.4796 21.6351 41.833 21.2596 41.149 21.0424C39.4994 12.8624 36.0055 7.43742 32.8186 4.3204ZM13.9106 26.5786C14.303 25.9252 14.7136 25.3894 15.1149 24.9676C14.8872 26.8661 14.7549 28.8892 14.7374 31.041C13.9757 33.0309 13.2647 34.2914 12.6729 35.0508C12.2149 35.6384 11.8946 35.8443 11.7456 35.9142C11.7116 35.836 11.6912 35.7299 11.7045 35.6386C11.7149 35.5676 11.7202 35.4959 11.7205 35.4242C11.7342 31.6155 12.6978 28.5977 13.9106 26.5786ZM44.192 35.1823C43.6055 34.418 42.9034 33.1516 42.1557 31.1554C42.1533 29.0035 42.0352 26.9794 41.8209 25.079C42.2192 25.5042 42.626 26.0434 43.0138 26.7C44.2124 28.7292 45.1548 31.755 45.1418 35.5636C45.1415 35.6354 45.1464 35.7071 45.1562 35.7781C45.1689 35.8695 45.1477 35.9755 45.1132 36.0535C44.9647 35.9822 44.6458 35.7738 44.192 35.1823ZM28.4669 19.2062C30.707 19.2156 32.5293 17.4072 32.5371 15.1672C32.545 12.9272 30.7354 11.1037 28.4954 11.0943C26.2554 11.085 24.4331 12.8933 24.4252 15.1334C24.4174 17.3734 26.2269 19.1969 28.4669 19.2062Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M25.0159 37.3204C26.8865 35.4642 29.9086 35.4768 31.766 37.3486C33.2827 38.8769 33.5894 41.2306 32.515 43.0949L31.1603 45.4456C29.9157 47.6052 26.7943 47.5921 25.5648 45.4222L24.2267 43.0603C23.1653 41.1871 23.4886 38.836 25.0159 37.3204Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
          </G>
          <Defs>
            <Filter id="filter0_d_6128_3923" x="4.1582" y="2.03906" width="48.543" height="53.5156" filterUnits="userSpaceOnUse">
              <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
              <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <FeOffset dy="4"/>
              <FeGaussianBlur stdDeviation="2"/>
              <FeComposite in2="hardAlpha" operator="out"/>
              <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
              <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6128_3923"/>
              <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6128_3923" result="shape"/>
            </Filter>
          </Defs>
        </Svg>
      </Animated.View>
    </View>
  );
});

// ─── Carte de niveau ────────────────────────────────────────────────────────────

interface LevelCardProps {
  node: GalleryNode;
  onPress: () => void;
  index: number;
  isLeft: boolean;
}

const LevelCard = memo(function LevelCard({ node, onPress, index, isLeft }: LevelCardProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (node.isCurrent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1,    { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [node.isCurrent, scale]);

  const animatedScale = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const cardStyle = node.isCurrent
    ? {
        bgColor: 'rgba(255, 188, 64, 0.10)',
        iconBg: COLORS.primary,
        iconColor: COLORS.background,
        iconName: 'compass-outline' as const,
        titleColor: '#FFFFFF',
        subtitleColor: '#71808E',
        xpColor: '#FFBC40',
        starColor: '#FFBC40',
        statusColor: COLORS.primary,
      }
    : {
        bgColor: 'rgba(0, 0, 0, 0.10)',
        iconBg: 'transparent',
        iconColor: '#71808E',
        iconName: 'lock-closed' as const,
        titleColor: 'rgba(255,255,255,0.4)',
        subtitleColor: 'rgba(113,128,142,0.5)',
        xpColor: 'rgba(255,188,64,0.4)',
        starColor: '#6E6445',
        statusColor: '#71808E',
      };

  const EnteringAnim = isLeft
    ? FadeInLeft.delay(200 + index * 120).duration(400).springify()
    : FadeInRight.delay(200 + index * 120).duration(400).springify();

  return (
    <Animated.View
      entering={EnteringAnim}
      style={[
        styles.cardWrapper,
        isLeft ? styles.cardIndentLeft : styles.cardIndentRight,
      ]}
    >
      <Pressable onPress={onPress}>
        <Animated.View style={animatedScale}>
          <DynamicGradientBorder
            borderRadius={16}
            fill={cardStyle.bgColor}
            boxWidth={CARD_WIDTH}
            style={styles.cardBorder}
          >
            <View style={[styles.card, node.isCurrent ? styles.cardCurrent : styles.cardDefault]}>
              <View style={styles.cardContent}>
              {/* Icône */}
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: cardStyle.iconBg },
                  node.isCurrent ? styles.cardIconCurrent : styles.cardIconDefault,
                ]}
              >
                <Ionicons
                  name={cardStyle.iconName}
                  size={node.isCurrent ? 22 : 28}
                  color={cardStyle.iconColor}
                />
              </View>

              {/* Texte */}
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: cardStyle.titleColor }]} numberOfLines={1}>
                  {node.name}
                </Text>
                {node.posture && (
                  <Text style={[styles.cardSubtitle, { color: cardStyle.subtitleColor }]} numberOfLines={1}>
                    {node.posture}
                  </Text>
                )}
                <View style={styles.cardXpRow}>
                  <Ionicons name="star" size={12} color={cardStyle.starColor} />
                  <Text style={[styles.cardXpText, { color: cardStyle.xpColor }]}>
                    {node.xpRequired.toLocaleString()} XP
                  </Text>
                </View>
              </View>

              {/* Statut */}
                <Text style={[styles.cardStatus, { color: cardStyle.statusColor }]}>
                  {node.isCurrent ? 'En cours' : 'A venir'}
                </Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ─── Carte de sous-niveau ───────────────────────────────────────────────────────

interface SubLevelCardProps {
  subLevel: { number: number; name: string };
  totalSubLevels: number;
  isLeft: boolean;
  isCurrent: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
  index: number;
  onPress: () => void;
}

const SubLevelCard = memo(function SubLevelCard({
  subLevel, totalSubLevels, isLeft, isCurrent, isCompleted, isUnlocked, index, onPress,
}: SubLevelCardProps) {
  const EnteringAnim = isLeft
    ? FadeInLeft.delay(100 + index * 80).duration(300).springify()
    : FadeInRight.delay(100 + index * 80).duration(300).springify();

  const badgeBg   = isCurrent   ? '#FFBC40'
                  : isCompleted ? '#3B82F6'
                  : '#7F8E9E';
  const badgeText = isCurrent   ? '#172735'
                  : isCompleted ? '#FFFFFF'
                  : '#172735';
  const nameColor = isCurrent   ? '#FFBC40'
                  : isUnlocked  ? 'rgba(255,255,255,0.85)'
                  : '#7F8E9E';
  const bgColor   = isCurrent ? 'rgba(255,188,64,0.08)' : 'rgba(0,0,0,0.10)';

  // Escalier dynamique : sous-niveau 1 aligné avec la carte parent, sous-niveau N avec la carte suivante
  // maxLeft = distance entre position gauche et position droite dans la colonne
  const maxLeft = COL_WIDTH - SUB_CARD_W;
  const dynamicStep = totalSubLevels > 1 ? maxLeft / (totalSubLevels - 1) : 0;
  const marginLeft = isLeft
    ? (subLevel.number - 1) * dynamicStep
    : maxLeft - (subLevel.number - 1) * dynamicStep;
  const marginStyle = { marginLeft };

  return (
    <Animated.View
      entering={EnteringAnim}
      style={[styles.subCardWrapper, marginStyle]}
    >
      <Pressable onPress={onPress}>
        <DynamicGradientBorder
          borderRadius={15}
          fill={bgColor}
          boxWidth={SUB_CARD_W}
        >
          <View style={[styles.subCard, { width: SUB_CARD_W }]}>
            {/* Badge numéro — en haut à gauche */}
            <View style={[styles.subCardBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.subCardBadgeText, { color: badgeText }]}>
                {subLevel.number}
              </Text>
            </View>
            {/* Nom — en bas */}
            <Text style={[styles.subCardName, { color: nameColor }]} numberOfLines={1}>
              {subLevel.name}
            </Text>
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

// ─── Composant principal ────────────────────────────────────────────────────────

// Item de la liste : soit une carte de niveau, soit une carte de sous-niveau
type ListItem =
  | { kind: 'level';    node: GalleryNode }
  | { kind: 'sublevel'; levelNumber: number; subLevel: { number: number; name: string }; totalSubLevels: number; isLeft: boolean; isCurrent: boolean; isCompleted: boolean; isUnlocked: boolean };

export const ChallengeGalleryMap = memo(function ChallengeGalleryMap({
  levels,
  currentLevel,
  currentSubLevel,
  xpByLevel,
  totalXp: _totalXp,
  onNodePress,
}: ChallengeGalleryMapProps) {
  const nodes = useMemo(() => {
    return levels.map((level): GalleryNode => ({
      id: `level-${level.number}`,
      levelNumber: level.number,
      name: level.name,
      description: level.description,
      xpRequired: level.xpRequired,
      xpCurrent: xpByLevel[level.number] || 0,
      isCompleted: level.number < currentLevel,
      isCurrent: level.number === currentLevel,
      isUnlocked: level.number <= currentLevel,
      posture: level.posture,
      iconName: level.iconName,
    }));
  }, [levels, currentLevel, xpByLevel]);

  // Construction de la liste complète :
  // Pour chaque niveau (du plus haut au plus bas) :
  //   → sous-niveaux inversés (du plus haut au plus bas) puis carte du niveau
  // isLeft de la carte de niveau détermine aussi le côté de l'escalier des sous-niveaux
  const items = useMemo((): ListItem[] => {
    const result: ListItem[] = [];
    const totalLevelCards = levels.length;
    // Niveaux du plus haut (n) au plus bas (1)
    const reversedLevels = [...levels].sort((a, b) => b.number - a.number);
    reversedLevels.forEach((level, levelIdx) => {
      const node = nodes.find(n => n.levelNumber === level.number)!;
      // Niveau 1 (dernier = levelIdx max) → posFromBottom=0 → isLeft=true
      const posFromBottom = totalLevelCards - 1 - levelIdx;
      const levelIsLeft = posFromBottom % 2 === 0;

      // Sous-niveaux du plus haut au plus bas
      const reversedSubs = [...level.subLevels].sort((a, b) => b.number - a.number);
      for (const sub of reversedSubs) {
        const isSubCurrent = level.number === currentLevel && sub.number === currentSubLevel;
        const isSubCompleted = level.number < currentLevel ||
          (level.number === currentLevel && sub.number < currentSubLevel);
        const isSubUnlocked = level.number < currentLevel ||
          (level.number === currentLevel && sub.number <= currentSubLevel);
        result.push({
          kind: 'sublevel',
          levelNumber: level.number,
          subLevel: { number: sub.number, name: sub.name },
          totalSubLevels: level.subLevels.length,
          isLeft: levelIsLeft,
          isCurrent: isSubCurrent,
          isCompleted: isSubCompleted,
          isUnlocked: isSubUnlocked,
        });
      }
      // Carte du niveau en bas du groupe
      result.push({ kind: 'level', node });
    });
    return result;
  }, [levels, nodes, currentLevel, currentSubLevel]);

  const handleNodePress = useCallback(
    (node: GalleryNode) => onNodePress?.(node),
    [onNodePress]
  );

  // Calcul du Y du centre de la carte du niveau actuel dans la liste
  // et de la hauteur totale du contenu (sans paddingTop/paddingBottom)
  const { currentLevelY, contentHeight } = useMemo(() => {
    // Hauteur d'un item : CARD_H pour les niveaux, 64 pour les sous-niveaux
    const SUB_H = 64;
    let y = 0;
    let foundY = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const h = item.kind === 'level' ? CARD_H : SUB_H;
      if (item.kind === 'level' && item.node.isCurrent) {
        foundY = y + h / 2;
      }
      y += h + (i < items.length - 1 ? CARD_GAP : 0);
    }
    return { currentLevelY: foundY, contentHeight: y };
  }, [items]);

  // Auto-scroll vers le bas au montage
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Row : barre à gauche + cartes à droite */}
        <View style={styles.row}>
          {/* Colonne barre */}
          <ProgressTube
            currentLevel={currentLevel}
            totalLevels={levels.length}
            currentLevelY={currentLevelY}
            contentHeight={contentHeight}
          />

          {/* Colonne cartes */}
          <View style={styles.cardsCol}>
            {items.map((item, index) => {
              if (item.kind === 'level') {
                // isLeft calculé identiquement à la construction des items
                const totalLevelCards = levels.length;
                const levelIdx = levels.length - item.node.levelNumber; // niveau 1 → levelIdx = N-1
                const posFromBottom = totalLevelCards - 1 - levelIdx;
                const isLeft = posFromBottom % 2 === 0;
                return (
                  <LevelCard
                    key={item.node.id}
                    node={item.node}
                    index={index}
                    isLeft={isLeft}
                    onPress={() => handleNodePress(item.node)}
                  />
                );
              }
              return (
                <SubLevelCard
                  key={`sub-${item.levelNumber}-${item.subLevel.number}`}
                  subLevel={item.subLevel}
                  totalSubLevels={item.totalSubLevels}
                  isLeft={item.isLeft}
                  isCurrent={item.isCurrent}
                  isCompleted={item.isCompleted}
                  isUnlocked={item.isUnlocked}
                  index={index}
                  onPress={() => {}}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Barre ──
  tubeColumn: {
    width: TUBE_COL_W,
    alignItems: 'center',
    position: 'relative', // pour la fusée en absolu
  },
  tube: {
    width: TUBE_W,
    borderRadius: TUBE_W / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    flex: 1, // s'étire sur toute la hauteur du row
  },
  tubeFlame: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // top est animé dynamiquement
  },
  rocket: {
    position: 'absolute',
    left: TUBE_COL_W / 2 - 28,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: PAD_TOP,
    paddingBottom: 120,
    paddingRight: PAD_RIGHT,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardsCol: {
    flex: 1,
  },

  // ── Cartes ──
  cardWrapper: {
    marginBottom: CARD_GAP,
  },
  // Croche gauche : carte décalée à gauche (marge droite = CARD_INDENT)
  cardIndentLeft: {
    marginRight: CARD_INDENT,
    marginLeft: 0,
  },
  // Croche droite : carte décalée à droite (marge gauche = CARD_INDENT)
  cardIndentRight: {
    marginLeft: CARD_INDENT,
    marginRight: 0,
  },
  card: {
    minHeight: CARD_H,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBorder: {
    width: CARD_WIDTH,
  },
  cardCurrent: {
    borderWidth: 1,
    borderColor: '#FFBC40',
  },
  cardDefault: {
    borderWidth: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingLeft: 16,
    paddingRight: 18,
    gap: 12,
  },
  cardIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconCurrent: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  cardIconDefault: {
    width: 32,
    height: 36,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    lineHeight: 18,
  },
  cardSubtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  cardXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  cardXpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },
  cardStatus: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },

  // ── Sous-niveaux ──
  subCardWrapper: {
    marginBottom: CARD_GAP,
    // marginLeft ou marginRight calculé dynamiquement selon isLeft
  },
  subCard: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 10,
    // width et borderRadius gérés par DynamicGradientBorder
  },
  subCardBadge: {
    width: 25,
    height: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCardBadgeText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    lineHeight: 18,
  },
  subCardName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    lineHeight: 12,
  },
});

export default ChallengeGalleryMap;
