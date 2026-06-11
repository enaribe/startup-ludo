/**
 * ChallengeProgressMap - Carte de progression style Candy Crush
 *
 * Affiche les niveaux et sous-niveaux sur un chemin sinueux
 * avec un fond gradient coloré et des nœuds interactifs.
 */

import { memo, useMemo, useCallback, useRef } from 'react';
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
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';

const AnimatedPath = Animated.createAnimatedComponent(Path);

import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import type { ChallengeLevel } from '@/types/challenge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_WIDTH = SCREEN_WIDTH;
const NODE_SIZE = 56;
const SUB_NODE_SIZE = 40;
const HORIZONTAL_PADDING = 40;
const PATH_STROKE_WIDTH = 12;

// ===== FOND SPATIAL =====
const STARS_COUNT = 40;
const SHOOTING_STARS_COUNT = 3;

// Générer des étoiles fixes
const generateStars = (count: number, height: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 3000,
      // Couleur: blanc, bleu clair, ou doré
      color: ['#FFFFFF', '#FFFFFF', '#B8D4FF', '#FFD700'][Math.floor(Math.random() * 4)] || '#FFFFFF',
    });
  }
  return stars;
};

// Composant étoile scintillante
const Star = memo(function Star({
  x, y, size, delay, color
}: {
  x: number; y: number; size: number; delay: number; color: string;
}) {
  const opacity = useSharedValue(0.2);
  const scale = useSharedValue(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 + Math.random() * 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 800 + Math.random() * 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [opacity, scale, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: size * 3,
        },
        animatedStyle,
      ]}
    />
  );
});

// Composant étoile filante
const ShootingStar = memo(function ShootingStar({
  startDelay,
  mapHeight
}: {
  startDelay: number;
  mapHeight: number;
}) {
  const translateX = useSharedValue(-50);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      const startY = Math.random() * (mapHeight * 0.6);
      translateX.value = -50;
      translateY.value = startY;

      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 200 })
      );

      translateX.value = withTiming(MAP_WIDTH + 100, {
        duration: 900,
        easing: Easing.linear
      });
      translateY.value = withTiming(startY + 150, {
        duration: 900,
        easing: Easing.linear
      });
    };

    const timeout = setTimeout(() => {
      animate();
      const interval = setInterval(animate, 8000 + Math.random() * 7000);
      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [translateX, translateY, opacity, startDelay, mapHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: '35deg' },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.shootingStar, animatedStyle]}>
      <View style={styles.shootingStarHead} />
      <View style={styles.shootingStarTail} />
    </Animated.View>
  );
});

// Composant fusée
const Rocket = memo(function Rocket({ mapHeight }: { mapHeight: number }) {
  const translateX = useSharedValue(MAP_WIDTH + 50);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const animate = () => {
      const startY = 100 + Math.random() * (mapHeight * 0.5);
      translateX.value = MAP_WIDTH + 50;
      translateY.value = startY;
      rotate.value = -15 + Math.random() * 30;

      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(1, { duration: 2400 }),
        withTiming(0, { duration: 300 })
      );

      translateX.value = withTiming(-80, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease)
      });
      translateY.value = withTiming(startY - 100 - Math.random() * 100, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease)
      });
    };

    // Première apparition après 5s, puis toutes les 20-30s
    const timeout = setTimeout(() => {
      animate();
      const interval = setInterval(animate, 20000 + Math.random() * 10000);
      return () => clearInterval(interval);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [translateX, translateY, opacity, rotate, mapHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.rocket, animatedStyle]}>
      <Text style={styles.rocketEmoji}>🚀</Text>
      {/* Traînée de la fusée */}
      <View style={styles.rocketTrail}>
        <View style={[styles.rocketTrailPart, { opacity: 0.6, width: 20 }]} />
        <View style={[styles.rocketTrailPart, { opacity: 0.4, width: 15 }]} />
        <View style={[styles.rocketTrailPart, { opacity: 0.2, width: 10 }]} />
      </View>
    </Animated.View>
  );
});

// Couleurs des nœuds selon l'état
const NODE_COLORS = {
  completed: '#4CAF50',
  current: '#FFBC40',
  unlocked: '#64B5F6',
  locked: '#9E9E9E',
};

export interface MapNode {
  id: string;
  type: 'level' | 'sublevel';
  number: number;
  levelNumber: number;
  subLevelNumber?: number;
  name: string;
  description: string;
  xpRequired: number;
  xpCurrent: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isUnlocked: boolean;
  cardCategories?: string[];
  x: number;
  y: number;
}

interface ChallengeProgressMapProps {
  levels: ChallengeLevel[];
  currentLevel: number;
  currentSubLevel: number;
  xpByLevel: Record<number, number>;
  totalXp: number;
  onNodePress?: (node: MapNode) => void;
}

// Composant pour un nœud de niveau principal
const LevelNode = memo(function LevelNode({
  node,
  onPress,
  index,
}: {
  node: MapNode;
  onPress?: () => void;
  index: number;
}) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (node.isCurrent) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [node.isCurrent, pulseScale, glowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: node.isCurrent ? pulseScale.value : 1 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: node.isCurrent ? glowOpacity.value : 0,
  }));

  const nodeColor = node.isCompleted
    ? NODE_COLORS.completed
    : node.isCurrent
    ? NODE_COLORS.current
    : node.isUnlocked
    ? NODE_COLORS.unlocked
    : NODE_COLORS.locked;

  const size = node.type === 'level' ? NODE_SIZE : SUB_NODE_SIZE;

  return (
    <Animated.View
      entering={ZoomIn.delay(100 + index * 50).duration(400).springify()}
      style={[
        styles.nodeContainer,
        {
          left: node.x - size / 2,
          top: node.y - size / 2,
        },
      ]}
    >
      {/* Glow effect pour le nœud actuel */}
      {node.isCurrent && (
        <Animated.View
          style={[
            styles.nodeGlow,
            {
              width: size + 24,
              height: size + 24,
              borderRadius: (size + 24) / 2,
              backgroundColor: NODE_COLORS.current,
            },
            glowStyle,
          ]}
        />
      )}

      <Pressable onPress={onPress}>
        <Animated.View
          style={[
            styles.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: nodeColor,
              borderWidth: node.isCurrent ? 4 : 3,
              borderColor: node.isCurrent ? '#FFF' : 'rgba(255,255,255,0.5)',
            },
            animatedStyle,
          ]}
        >
          {node.isCompleted ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark" size={node.type === 'level' ? 24 : 18} color="#FFF" />
            </View>
          ) : node.type === 'level' ? (
            <Text style={[styles.nodeNumber, { fontSize: 20 }]}>{node.levelNumber}</Text>
          ) : (
            <Text style={[styles.nodeNumber, { fontSize: 14 }]}>
              {node.levelNumber}.{node.subLevelNumber}
            </Text>
          )}

          {/* Couronne pour les niveaux complétés */}
          {node.isCompleted && node.type === 'level' && (
            <View style={styles.crownBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
            </View>
          )}

          {/* Cadenas pour les nœuds verrouillés */}
          {!node.isUnlocked && !node.isCompleted && (
            <View style={styles.lockOverlay}>
              <Ionicons name="lock-closed" size={node.type === 'level' ? 20 : 14} color="rgba(255,255,255,0.8)" />
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* Label du niveau (seulement pour les niveaux principaux) */}
      {node.type === 'level' && (
        <Animated.View
          entering={FadeIn.delay(200 + index * 50).duration(300)}
          style={styles.nodeLabelContainer}
        >
          <Text style={styles.nodeLabel} numberOfLines={1}>
            {node.name}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  );
});

// Fonction pour générer les positions des nœuds en zigzag
function generateNodePositions(
  levels: ChallengeLevel[],
  currentLevel: number,
  currentSubLevel: number,
  xpByLevel: Record<number, number>
): MapNode[] {
  const nodes: MapNode[] = [];
  let y = 180; // Position Y de départ (après le header)
  const rowHeight = 120; // Hauteur entre les rangées
  const subRowHeight = 80; // Hauteur entre les sous-niveaux

  levels.forEach((level, levelIndex) => {
    // Alternance gauche/droite pour le zigzag
    const isLeftSide = levelIndex % 2 === 0;
    const x = isLeftSide
      ? HORIZONTAL_PADDING + NODE_SIZE
      : MAP_WIDTH - HORIZONTAL_PADDING - NODE_SIZE;

    const levelXp = xpByLevel[level.number] || 0;
    const isLevelCompleted = level.number < currentLevel;
    const isLevelCurrent = level.number === currentLevel;
    const isLevelUnlocked = level.number <= currentLevel;

    // Ajouter le nœud du niveau principal
    nodes.push({
      id: `level-${level.number}`,
      type: 'level',
      number: level.number,
      levelNumber: level.number,
      name: level.name,
      description: level.description,
      xpRequired: level.xpRequired,
      xpCurrent: levelXp,
      isCompleted: isLevelCompleted,
      isCurrent: isLevelCurrent && currentSubLevel === 1,
      isUnlocked: isLevelUnlocked,
      x,
      y,
    });

    // Ajouter les sous-niveaux si le niveau est débloqué
    if (level.subLevels && level.subLevels.length > 1) {
      level.subLevels.forEach((subLevel, subIndex) => {
        if (subIndex === 0) return; // Le premier sous-niveau est le nœud principal

        y += subRowHeight;

        // Position intermédiaire entre gauche et droite
        const subX = isLeftSide
          ? HORIZONTAL_PADDING + NODE_SIZE + (subIndex * (MAP_WIDTH - 2 * HORIZONTAL_PADDING - 2 * NODE_SIZE)) / level.subLevels.length
          : MAP_WIDTH - HORIZONTAL_PADDING - NODE_SIZE - (subIndex * (MAP_WIDTH - 2 * HORIZONTAL_PADDING - 2 * NODE_SIZE)) / level.subLevels.length;

        const isSubCompleted = isLevelCompleted || (isLevelCurrent && levelXp >= subLevel.xpRequired);
        const isSubCurrent = isLevelCurrent && subLevel.number === currentSubLevel;
        const isSubUnlocked = isLevelCompleted || (isLevelCurrent && subLevel.number <= currentSubLevel);

        nodes.push({
          id: `sublevel-${level.number}-${subLevel.number}`,
          type: 'sublevel',
          number: subLevel.number,
          levelNumber: level.number,
          subLevelNumber: subLevel.number,
          name: subLevel.name,
          description: subLevel.description,
          xpRequired: subLevel.xpRequired,
          xpCurrent: levelXp,
          isCompleted: isSubCompleted,
          isCurrent: isSubCurrent,
          isUnlocked: isSubUnlocked,
          cardCategories: subLevel.cardCategories,
          x: subX,
          y,
        });
      });
    }

    y += rowHeight;
  });

  return nodes;
}

// Fonction pour générer le chemin SVG entre les nœuds
function generatePathData(nodes: MapNode[]): string {
  if (nodes.length < 2) return '';

  const firstNode = nodes[0];
  if (!firstNode) return '';

  let pathData = `M ${firstNode.x} ${firstNode.y}`;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    if (!prev || !curr) continue;

    // Utiliser des courbes de Bézier pour un chemin fluide
    const midY = (prev.y + curr.y) / 2;
    const controlX1 = prev.x;
    const controlY1 = midY;
    const controlX2 = curr.x;
    const controlY2 = midY;

    pathData += ` C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${curr.x} ${curr.y}`;
  }

  return pathData;
}

export const ChallengeProgressMap = memo(function ChallengeProgressMap({
  levels,
  currentLevel,
  currentSubLevel,
  xpByLevel,
  // totalXp is available in props but displayed in header now
  onNodePress,
}: ChallengeProgressMapProps) {
  const nodes = useMemo(
    () => generateNodePositions(levels, currentLevel, currentSubLevel, xpByLevel),
    [levels, currentLevel, currentSubLevel, xpByLevel]
  );

  const pathData = useMemo(() => generatePathData(nodes), [nodes]);

  const mapHeight = useMemo(() => {
    const maxY = Math.max(...nodes.map((n) => n.y));
    return maxY + 150;
  }, [nodes]);

  const handleNodePress = useCallback(
    (node: MapNode) => {
      if (onNodePress) {
        onNodePress(node);
      }
    },
    [onNodePress]
  );

  // Trouver le nœud actuel pour auto-scroll
  const currentNode = nodes.find((n) => n.isCurrent);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll vers le nœud actuel
  useEffect(() => {
    if (currentNode && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, currentNode.y - 300),
          animated: true,
        });
      }, 500);
    }
  }, [currentNode]);

  // Animation du chemin (pointillés qui bougent)
  const dashOffset = useSharedValue(0);

  useEffect(() => {
    dashOffset.value = withRepeat(
      withTiming(-32, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, [dashOffset]);

  const animatedDashProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  // Générer les étoiles
  const stars = useMemo(() => generateStars(STARS_COUNT, mapHeight), [mapHeight]);

  return (
    <View style={styles.container}>
      {/* Fond spatial noir/bleu foncé comme le header */}
      <LinearGradient
        colors={['#0A1929', '#0A1929', '#0D2137', '#0A1929']}
        style={[styles.gradientBackground, { height: mapHeight }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Étoiles scintillantes */}
      <View style={[styles.starsLayer, { height: mapHeight }]} pointerEvents="none">
        {stars.map((s) => (
          <Star key={`star-${s.id}`} {...s} />
        ))}
      </View>

      {/* Étoiles filantes */}
      <View style={[styles.starsLayer, { height: mapHeight }]} pointerEvents="none">
        {Array.from({ length: SHOOTING_STARS_COUNT }).map((_, i) => (
          <ShootingStar key={`shooting-${i}`} startDelay={i * 3000 + 2000} mapHeight={mapHeight} />
        ))}
      </View>

      {/* Fusée qui passe */}
      <View style={[styles.starsLayer, { height: mapHeight }]} pointerEvents="none">
        <Rocket mapHeight={mapHeight} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { height: mapHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Chemin SVG */}
        <Svg
          width={MAP_WIDTH}
          height={mapHeight}
          style={styles.pathSvg}
        >
          <Defs>
            <SvgLinearGradient id="pathGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFBC40" stopOpacity="0.7" />
              <Stop offset="0.3" stopColor="#FFD580" stopOpacity="0.6" />
              <Stop offset="0.5" stopColor="#1F91D0" stopOpacity="0.5" />
              <Stop offset="0.7" stopColor="#FFD580" stopOpacity="0.6" />
              <Stop offset="1" stopColor="#FFBC40" stopOpacity="0.7" />
            </SvgLinearGradient>
          </Defs>

          {/* Chemin de fond (ombre) */}
          <Path
            d={pathData}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={PATH_STROKE_WIDTH + 4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Chemin principal */}
          <Path
            d={pathData}
            stroke="url(#pathGradient)"
            strokeWidth={PATH_STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Lignes pointillées animées sur le chemin */}
          <AnimatedPath
            d={pathData}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="16,16"
            animatedProps={animatedDashProps}
          />
        </Svg>

        {/* Nœuds des niveaux */}
        {nodes.map((node, index) => (
          <LevelNode
            key={node.id}
            node={node}
            index={index}
            onPress={() => handleNodePress(node)}
          />
        ))}

        {/* Décorations */}
        <View style={[styles.decoration, { top: 120, left: 20 }]}>
          <Text style={styles.decorationEmoji}>🚀</Text>
        </View>
        <View style={[styles.decoration, { top: 280, right: 20 }]}>
          <Text style={styles.decorationEmoji}>💡</Text>
        </View>
        <View style={[styles.decoration, { top: 480, left: 30 }]}>
          <Text style={styles.decorationEmoji}>🎯</Text>
        </View>
        <View style={[styles.decoration, { top: 680, right: 25 }]}>
          <Text style={styles.decorationEmoji}>🏆</Text>
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  starsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    position: 'relative',
  },
  pathSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Nœuds
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  nodeGlow: {
    position: 'absolute',
    top: -12,
    left: -12,
  },
  nodeNumber: {
    fontFamily: FONTS.title,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  completedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  crownBadge: {
    position: 'absolute',
    top: -12,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLabelContainer: {
    position: 'absolute',
    top: NODE_SIZE + 4,
    width: 100,
    alignItems: 'center',
  },
  nodeLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: '#333',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Décorations
  decoration: {
    position: 'absolute',
    opacity: 0.7,
  },
  decorationEmoji: {
    fontSize: 32,
  },

  // Étoile filante
  shootingStar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  shootingStarHead: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  shootingStarTail: {
    width: 60,
    height: 2,
    marginLeft: -2,
    borderRadius: 1,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.6)',
    // Dégradé simulé avec opacité décroissante
    opacity: 0.8,
  },

  // Fusée
  rocket: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rocketEmoji: {
    fontSize: 28,
    transform: [{ scaleX: -1 }], // Flip pour qu'elle aille vers la gauche
  },
  rocketTrail: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  rocketTrailPart: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFBC40',
    marginLeft: 3,
  },
});

export default ChallengeProgressMap;
