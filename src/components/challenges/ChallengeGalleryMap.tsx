/**
 * ChallengeGalleryMap - Parcours vertical avec cartes et tube XP
 *
 * Design:
 * - Barre de progression verticale (tube XP) à gauche
 * - Cartes rectangulaires en zigzag
 * - Chaque carte montre nom + XP requis
 */

import { memo, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import type { ChallengeLevel } from '@/types/challenge';
import { DynamicGradientBorder } from '@/components/ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuration
const TUBE_WIDTH = 50;
const CARD_HEIGHT = 100;
const CARD_SPACING = 24;

// Icônes pour chaque niveau
const LEVEL_ICONS: Record<number, keyof typeof Ionicons.glyphMap> = {
  1: 'compass',
  2: 'bulb',
  3: 'rocket',
  4: 'trophy',
};

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

// ===== TUBE DE PROGRESSION VERTICAL =====

interface ProgressTubeProps {
  currentXp: number;
  maxXp: number;
  currentLevel: number;
  totalLevels: number;
}

const ProgressTube = memo(function ProgressTube({
  currentXp,
  maxXp,
  currentLevel,
  totalLevels,
}: ProgressTubeProps) {
  const fillPercent = maxXp > 0 ? Math.min(100, (currentXp / maxXp) * 100) : 0;
  const fillHeight = useSharedValue(0);

  useEffect(() => {
    fillHeight.value = withDelay(
      400,
      withSpring(fillPercent, { damping: 15, stiffness: 60 })
    );
  }, [fillPercent, fillHeight]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    height: `${fillHeight.value}%`,
  }));

  // Animation des bulles
  const bubble1Y = useSharedValue(0);
  const bubble2Y = useSharedValue(0);

  useEffect(() => {
    bubble1Y.value = withRepeat(
      withTiming(-150, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    bubble2Y.value = withDelay(
      1500,
      withRepeat(
        withTiming(-150, { duration: 3500, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [bubble1Y, bubble2Y]);

  const bubble1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble1Y.value }],
    opacity: bubble1Y.value < -100 ? 0 : 0.6,
  }));

  const bubble2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble2Y.value }],
    opacity: bubble2Y.value < -100 ? 0 : 0.4,
  }));

  return (
    <View style={styles.tubeContainer}>
      {/* XP en haut */}
      <View style={styles.tubeXpBadge}>
        <Ionicons name="flash" size={14} color={COLORS.primary} />
        <Text style={styles.tubeXpValue}>{currentXp.toLocaleString()}</Text>
      </View>

      {/* Tube principal */}
      <View style={styles.tube}>
        {/* Fond du tube */}
        <View style={styles.tubeBackground} />

        {/* Remplissage animé (depuis le bas) */}
        <Animated.View style={[styles.tubeFill, animatedFillStyle]}>
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
          />
          {/* Brillance */}
          <View style={styles.tubeShine} />

          {/* Bulles */}
          <Animated.View style={[styles.tubeBubble, styles.tubeBubble1, bubble1Style]} />
          <Animated.View style={[styles.tubeBubble, styles.tubeBubble2, bubble2Style]} />
        </Animated.View>

        {/* Marqueurs de niveaux (niveau 1 en bas, niveau 4 en haut) */}
        {Array.from({ length: totalLevels }).map((_, i) => {
          const levelNum = i + 1; // Niveau 1, 2, 3, 4
          const positionPercent = ((i + 1) / totalLevels) * 100; // Position depuis le bas
          const isCompleted = levelNum < currentLevel;
          const isCurrent = levelNum === currentLevel;

          return (
            <View
              key={i}
              style={[
                styles.tubeMarker,
                { bottom: `${positionPercent - 5}%` },
              ]}
            >
              <View
                style={[
                  styles.tubeMarkerDot,
                  isCompleted && styles.tubeMarkerCompleted,
                  isCurrent && styles.tubeMarkerCurrent,
                ]}
              >
                <Text style={styles.tubeMarkerText}>{levelNum}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Niveau actuel en bas */}
      <View style={styles.tubeCurrentLevel}>
        <Text style={styles.tubeCurrentLevelText}>Niv.{currentLevel}</Text>
      </View>
    </View>
  );
});

// ===== CARTE DE NIVEAU =====

interface LevelCardProps {
  node: GalleryNode;
  onPress: () => void;
  index: number;
  isLeft: boolean;
}

const LevelCard = memo(function LevelCard({ node, onPress, index, isLeft }: LevelCardProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const isLocked = !node.isUnlocked && !node.isCompleted;
  const iconName = (node.iconName || LEVEL_ICONS[node.levelNumber] || 'star') as keyof typeof Ionicons.glyphMap;
  const progressPercent = node.xpRequired > 0
    ? Math.min(100, Math.round((node.xpCurrent / node.xpRequired) * 100))
    : 0;

  useEffect(() => {
    if (node.isCurrent) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.5, { duration: 1500 })
        ),
        -1,
        false
      );
    }
  }, [node.isCurrent, scale, glowOpacity]);

  const animatedScale = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Couleurs selon l'état
  const getCardStyle = () => {
    if (node.isCompleted) {
      return {
        borderColor: COLORS.success,
        bgColor: 'rgba(16, 185, 129, 0.1)',
        iconBg: COLORS.success,
      };
    }
    if (node.isCurrent) {
      return {
        borderColor: COLORS.primary,
        bgColor: 'rgba(255, 188, 64, 0.1)',
        iconBg: COLORS.primary,
      };
    }
    if (node.isUnlocked) {
      return {
        borderColor: COLORS.info,
        bgColor: 'rgba(59, 130, 246, 0.1)',
        iconBg: COLORS.info,
      };
    }
    return {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      bgColor: 'rgba(255, 255, 255, 0.03)',
      iconBg: '#4B5563',
    };
  };

  const cardStyle = getCardStyle();
  const EnteringAnim = isLeft
    ? FadeInLeft.delay(200 + index * 120).duration(400).springify()
    : FadeInRight.delay(200 + index * 120).duration(400).springify();

  return (
    <Animated.View
      entering={EnteringAnim}
      style={[
        styles.cardWrapper,
        isLeft ? styles.cardLeft : styles.cardRight,
      ]}
    >
      <Pressable onPress={onPress}>
        <Animated.View style={[animatedScale, styles.cardContainer]}>
          {/* Carte */}
          <DynamicGradientBorder
            borderRadius={BORDER_RADIUS.xl}
            fill={cardStyle.bgColor}
            boxWidth={SCREEN_WIDTH - TUBE_WIDTH - SPACING[2] * 2 - 40}
          >
            <View style={styles.card}>
            {/* Badge niveau */}
            <View style={[styles.cardBadge, { backgroundColor: cardStyle.iconBg }]}>
              {node.isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={styles.cardBadgeText}>{node.levelNumber}</Text>
              )}
            </View>

            {/* Contenu */}
            <View style={styles.cardContent}>
              {/* Icône */}
              <View style={[styles.cardIcon, { backgroundColor: cardStyle.iconBg }]}>
                {isLocked ? (
                  <Ionicons name="lock-closed" size={22} color="#FFF" />
                ) : (
                  <Ionicons name={iconName} size={22} color="#FFF" />
                )}
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {node.name}
                </Text>
                {node.posture && (
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {node.posture}
                  </Text>
                )}

                {/* XP */}
                <View style={styles.cardXpRow}>
                  <Ionicons name="star" size={12} color={COLORS.primary} />
                  <Text style={styles.cardXpText}>
                    {node.xpRequired.toLocaleString()} XP
                  </Text>
                  {!isLocked && (
                    <Text style={styles.cardXpProgress}>
                      ({progressPercent}%)
                    </Text>
                  )}
                </View>
              </View>

              {/* Flèche */}
              {!isLocked && (
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={node.isCurrent ? COLORS.primary : COLORS.textMuted}
                />
              )}
            </View>

            {/* Barre de progression */}
            {!isLocked && (
              <View style={styles.cardProgress}>
                <View
                  style={[
                    styles.cardProgressFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: node.isCompleted ? COLORS.success : COLORS.primary,
                    }
                  ]}
                />
              </View>
            )}

            {/* Overlay verrouillé */}
            {isLocked && <View style={styles.cardLockedOverlay} />}
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ===== COMPOSANT PRINCIPAL =====

export const ChallengeGalleryMap = memo(function ChallengeGalleryMap({
  levels,
  currentLevel,
  currentSubLevel: _currentSubLevel,
  xpByLevel,
  totalXp,
  onNodePress,
}: ChallengeGalleryMapProps) {
  // Transformer les niveaux en nodes
  const nodes = useMemo(() => {
    return levels.map((level): GalleryNode => {
      const levelXp = xpByLevel[level.number] || 0;
      const isCompleted = level.number < currentLevel;
      const isCurrent = level.number === currentLevel;
      const isUnlocked = level.number <= currentLevel;

      return {
        id: `level-${level.number}`,
        levelNumber: level.number,
        name: level.name,
        description: level.description,
        xpRequired: level.xpRequired,
        xpCurrent: levelXp,
        isCompleted,
        isCurrent,
        isUnlocked,
        posture: level.posture,
        iconName: level.iconName,
      };
    });
  }, [levels, currentLevel, xpByLevel]);

  // Calculer XP max total
  const maxXp = useMemo(() => {
    return levels.reduce((sum, level) => sum + level.xpRequired, 0);
  }, [levels]);

  const handleNodePress = useCallback(
    (node: GalleryNode) => {
      if (onNodePress) {
        onNodePress(node);
      }
    },
    [onNodePress]
  );

  // Inverser l'ordre des nodes pour avoir le niveau 1 en bas
  const reversedNodes = useMemo(() => [...nodes].reverse(), [nodes]);

  return (
    <View style={styles.container}>
      {/* Liste des cartes en zigzag */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reversedNodes.map((node, index) => (
          <LevelCard
            key={node.id}
            node={node}
            index={index}
            isLeft={index % 2 === 1} // Inversé : maintenant les pairs sont à droite
            onPress={() => handleNodePress(node)}
          />
        ))}
      </ScrollView>

      {/* Tube de progression vertical à droite */}
      <ProgressTube
        currentXp={totalXp}
        maxXp={maxXp}
        currentLevel={currentLevel}
        totalLevels={levels.length}
      />
    </View>
  );
});

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },

  // Tube de progression
  tubeContainer: {
    width: TUBE_WIDTH,
    alignItems: 'center',
    paddingTop: SPACING[6] + 20, // Même espacement que les cartes
    paddingBottom: SPACING[3],
    paddingRight: SPACING[2], // À droite maintenant
  },
  tubeXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING[3],
  },
  tubeXpValue: {
    fontFamily: FONTS.title,
    fontSize: 11,
    color: COLORS.primary,
  },
  tube: {
    flex: 1,
    width: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  tubeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tubeFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tubeShine: {
    position: 'absolute',
    left: 2,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  tubeBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 50,
  },
  tubeBubble1: {
    width: 5,
    height: 5,
    left: 3,
    bottom: 10,
  },
  tubeBubble2: {
    width: 4,
    height: 4,
    left: 8,
    bottom: 20,
  },
  tubeMarker: {
    position: 'absolute',
    right: -6, // À droite maintenant
    zIndex: 10,
  },
  tubeMarkerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  tubeMarkerCompleted: {
    backgroundColor: COLORS.success,
  },
  tubeMarkerCurrent: {
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  tubeMarkerText: {
    fontFamily: FONTS.title,
    fontSize: 9,
    color: COLORS.white,
  },
  tubeCurrentLevel: {
    marginTop: SPACING[3],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[2],
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  tubeCurrentLevelText: {
    fontFamily: FONTS.title,
    fontSize: 10,
    color: COLORS.background,
  },

  // Scroll et cartes
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING[6] + 20, // Espace pour éviter le chevauchement avec le header
    paddingBottom: 180,
    paddingHorizontal: SPACING[2],
  },
  cardWrapper: {
    marginBottom: CARD_SPACING,
  },
  cardLeft: {
    marginRight: 40,
  },
  cardRight: {
    marginLeft: 40,
  },
  cardContainer: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    minHeight: CARD_HEIGHT,
    overflow: 'hidden',
  },
  cardBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardBadgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    paddingLeft: SPACING[4],
    gap: SPACING[3],
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  cardSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  cardXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardXpText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  cardXpProgress: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  cardProgress: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardProgressFill: {
    height: '100%',
  },
  cardLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

export default ChallengeGalleryMap;
