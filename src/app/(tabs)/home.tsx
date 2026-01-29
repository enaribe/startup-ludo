import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Avatar, GameButton } from '@/components/ui';
import { formatXP, getLevelFromXP, getRankFromXP, getRankProgress } from '@/config/progression';
import { useAuthStore, useUserStore } from '@/stores';
import { FONTS } from '@/styles/typography';

const { width, height } = Dimensions.get('window');

// Composant pour le gradient radial SVG
const RadialGradientBackground = () => (
  <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
    <Defs>
      <RadialGradient id="radialGradient" cx="50%" cy="50%" r="80%">
        <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
        <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
      </RadialGradient>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#radialGradient)" />
  </Svg>
);

// Rayons tournants sous le logo
const SpinningRays = () => {
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
      <Image
        source={require('../../../assets/images/shape.png')}
        style={styles.raysImage}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

// Bordure gradient style eau
interface GradientBorderProps {
  children: React.ReactNode;
  style?: object;
  boxHeight: number;
  boxWidth?: number;
  borderRadius?: number;
  fill?: string;
}

const GradientBorder = ({
  children,
  style,
  boxHeight,
  boxWidth = width - 36,
  borderRadius = 20,
  fill = 'transparent'
}: GradientBorderProps) => {
  const borderWidth = 1;
  const gradientId = `waterGradient_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[{ position: 'relative', height: boxHeight, borderRadius, overflow: 'hidden' }, style]}>
      <Svg
        width={boxWidth}
        height={boxHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9A9A9A" stopOpacity="0.3" />
            <Stop offset="25%" stopColor="#707070" stopOpacity="0.2" />
            <Stop offset="50%" stopColor="#B0B0B0" stopOpacity="0.35" />
            <Stop offset="75%" stopColor="#606060" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={boxWidth - borderWidth}
          height={boxHeight - borderWidth}
          rx={borderRadius}
          ry={borderRadius}
          fill={fill}
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth}
        />
      </Svg>
      {children}
    </View>
  );
};

// Bordure gradient dynamique (hauteur auto)
interface DynamicGradientBorderProps {
  children: React.ReactNode;
  style?: object;
  boxWidth?: number;
  borderRadius?: number;
  fill?: string;
}

const DynamicGradientBorder = ({
  children,
  style,
  boxWidth = width - 36,
  borderRadius = 20,
  fill = 'transparent'
}: DynamicGradientBorderProps) => {
  const [boxHeight, setBoxHeight] = useState(0);
  const borderWidth = 1;
  const gradientId = `waterGradient_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View
      style={[{ position: 'relative', borderRadius, overflow: 'hidden' }, style]}
      onLayout={(e) => setBoxHeight(e.nativeEvent.layout.height)}
    >
      {boxHeight > 0 && (
        <Svg
          width={boxWidth}
          height={boxHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#9A9A9A" stopOpacity="0.3" />
              <Stop offset="25%" stopColor="#707070" stopOpacity="0.2" />
              <Stop offset="50%" stopColor="#B0B0B0" stopOpacity="0.35" />
              <Stop offset="75%" stopColor="#606060" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
            </LinearGradient>
          </Defs>
          <Rect
            x={borderWidth / 2}
            y={borderWidth / 2}
            width={boxWidth - borderWidth}
            height={boxHeight - borderWidth}
            rx={borderRadius}
            ry={borderRadius}
            fill={fill}
            stroke={`url(#${gradientId})`}
            strokeWidth={borderWidth}
          />
        </Svg>
      )}
      {children}
    </View>
  );
};

// Composant pour l'icône LUDO personnalisée du Tab Bar
const LudoIcon = ({ active }: { active?: boolean }) => (
  <View style={styles.ludoIconContainer}>
    <View style={styles.ludoRow}>
      <View style={[styles.ludoSquare, { backgroundColor: '#FFBC40' }]}>
        <Text style={styles.ludoText}>L</Text>
      </View>
      <View style={[styles.ludoSquare, { backgroundColor: '#1F91D0' }]}>
        <Text style={styles.ludoText}>U</Text>
      </View>
    </View>
    <View style={styles.ludoRow}>
      <View style={[styles.ludoSquare, { backgroundColor: '#F35145' }]}>
        <Text style={styles.ludoText}>D</Text>
      </View>
      <View style={[styles.ludoSquare, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.ludoText}>O</Text>
      </View>
    </View>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  // Calculs de progression
  const totalXP = profile?.xp ?? 0;
  const rankInfo = getRankFromXP(totalXP);
  const levelInfo = getLevelFromXP(totalXP);
  const rankProgress = getRankProgress(totalXP);

  // Stats du portfolio
  const startupsCount = profile?.startups?.length ?? 0;
  const portfolioValue = profile?.startups?.reduce((sum, s) => sum + s.tokensInvested, 0) ?? 3.2;

  const displayName = user?.displayName || profile?.displayName || 'Abdoulaye Birane';

  const handlePlay = () => {
    router.push('/(game)/mode-selection');
  };

  // Calcul de la hauteur du header fixe (safe area + logo + marge + profile + marge + stats + marge bas + paddingBottom)
  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + 120 + 4 + 68 + 15 + 78 + 20 + 12;

  return (
    <View style={styles.container}>
      {/* Background Radial Gradient SVG */}
      <RadialGradientBackground />

      {/* Header Fixe */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        {/* Logo avec rayons tournants */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.logoContainer}>
          <SpinningRays />
          <Image
            source={require('../../../assets/images/logostartupludo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Pressable onPress={() => router.push('/(tabs)/profil')}>
            <GradientBorder boxHeight={68} borderRadius={15} style={styles.profileCard} fill="rgba(0, 0, 0, 0.15)">
              <View style={styles.profileCardContent}>
                <View style={styles.avatarContainer}>
                  <Avatar
                    name={displayName}
                    source={user?.photoURL}
                    size="md"
                    showBorder
                    borderColor="#FFFFFF"
                  />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{displayName}</Text>
                  <Text style={styles.profileLevel}>Niveau {levelInfo.level} - {rankInfo.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFBC40" />
              </View>
            </GradientBorder>
          </Pressable>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <GradientBorder boxHeight={78} boxWidth={(width - 36 - 20) / 3} borderRadius={15} fill="rgba(0, 0, 0, 0.15)">
              <View style={styles.statBoxContent}>
                <Text style={styles.statValueLuckiest}>{startupsCount}</Text>
                <Text style={styles.statLabel}>Entreprises</Text>
              </View>
            </GradientBorder>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <GradientBorder boxHeight={78} boxWidth={(width - 36 - 20) / 3} borderRadius={15} fill="rgba(0, 0, 0, 0.15)">
              <View style={styles.statBoxContent}>
                <Text style={styles.statValueLuckiest}>{portfolioValue}M€</Text>
                <Text style={styles.statLabel}>Valorisation</Text>
              </View>
            </GradientBorder>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <GradientBorder boxHeight={78} boxWidth={(width - 36 - 20) / 3} borderRadius={15} fill="rgba(0, 0, 0, 0.15)">
              <View style={styles.statBoxContent}>
                <Text style={styles.xpValue}>{formatXP(totalXP)} / 15,000 XP</Text>
                <View style={styles.xpBarContainer}>
                  <View style={[styles.xpBarFill, { width: `${rankProgress}%` }]} />
                </View>
                <Text style={styles.statLabel}>Progression</Text>
              </View>
            </GradientBorder>
          </Animated.View>
        </View>
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Play Button */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Pressable onPress={handlePlay}>
            <GradientBorder style={styles.playButton} boxHeight={105} borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
              <View style={styles.playButtonContent}>
                <View style={styles.playIconTriangle}>
                  <Ionicons name="play" size={48} color="#FFBC40" />
                </View>
                <View style={styles.playButtonTextWrapper}>
                  <Text style={styles.playButtonTitle}>NOUVELLE PARTIE</Text>
                  <Text style={styles.playButtonSubtitle}>Rejoins ou crée une partie avec tes amis</Text>
                </View>
              </View>
            </GradientBorder>
          </Pressable>
        </Animated.View>

        {/* Challenge Section */}
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeHeaderTitle}>CHALLENGE A LA UNE</Text>
          <View style={styles.challengeNav}>
            <Pressable style={styles.challengeNavBtn}>
              <Ionicons name="chevron-back" size={16} color="rgba(255, 255, 255, 0.4)" />
            </Pressable>
            <Pressable style={[styles.challengeNavBtn, styles.challengeNavBtnActive]}>
              <Ionicons name="chevron-forward" size={16} color="#FFBC40" />
            </Pressable>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.challengeCardWrapper}>
          <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.challengeCardContent}>
              {/* Top row : Image + Badge & Title */}
              <View style={styles.challengeTopRow}>
                <View style={styles.challengeImageContainer}>
                  <MaterialCommunityIcons name="leaf" size={28} color="#FFBC40" />
                  <Text style={styles.challengeImageLabel}>AGRIBUSINESS</Text>
                </View>
                <View style={styles.challengeMeta}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>Agri</Text>
                  </View>
                  <Text style={styles.challengeNameText}>AGRITECH REVOLUTION</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.challengeDescText}>
                Transforme l'agriculture avec des solutions innovantes et durables
              </Text>

              {/* Stats row avec bordure gradient (largeur = contenu carte) */}
              <GradientBorder
                boxHeight={42}
                boxWidth={width - 36 - 28}
                borderRadius={21}
                fill="transparent"
                style={styles.challengeStatsWrapper}
              >
                <View style={styles.challengeStatsRow}>
                  <View style={styles.challengeStat}>
                    <View style={styles.statWithIcon}>
                      <Ionicons name="star" size={14} color="#FFBC40" style={{ marginRight: 4 }} />
                      <Text style={styles.challengeStatText}>2,500 XP</Text>
                    </View>
                  </View>
                  <View style={styles.challengeStatDivider} />
                  <View style={styles.challengeStat}>
                    <View style={styles.statWithIcon}>
                      <Ionicons name="people" size={14} color="#FFBC40" style={{ marginRight: 4 }} />
                      <Text style={styles.challengeStatText}>1.2K participants</Text>
                    </View>
                  </View>
                </View>
              </GradientBorder>

              <GameButton title="commencer" />
            </View>
          </DynamicGradientBorder>
          {/* Indicateurs d'index sous la carte */}
          <View style={styles.pagination}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'visible',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    height: 120,
    overflow: 'visible',
  },
  raysWrapper: {
    position: 'absolute',
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  raysImage: {
    width: 260,
    height: 260,
    opacity: 0.6,
  },
  logo: {
    width: 140,
    height: 100,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 150,
  },
  profileCard: {
    marginBottom: 15,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    height: 68,
  },
  avatarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 1,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },
  profileName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileLevel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  statBoxContent: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 36 - 20) / 3,
    height: 78,
  },
  statValueLuckiest: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: '#FFBC40',
  },
  xpValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    color: '#FFBC40',
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
  },
  xpBarContainer: {
    width: '85%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginVertical: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#FFBC40',
    borderRadius: 2,
  },
  // Play Button
  playButton: {
    marginBottom: 30,
  },
  playButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  playIconTriangle: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonTextWrapper: {
    marginLeft: 15,
    flex: 1,
  },
  playButtonTitle: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: '#FFBC40',
    letterSpacing: 1,
  },
  playButtonSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  // Challenge
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeHeaderTitle: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  challengeNav: {
    flexDirection: 'row',
    gap: 8,
  },
  challengeNavBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeNavBtnActive: {
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
  },
  challengeCardWrapper: {
    marginBottom: 8,
  },
  challengeCardContent: {
    padding: 14,
  },
  challengeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  challengeImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeImageLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 8,
    color: '#FFBC40',
    marginTop: 2,
  },
  challengeMeta: {
    flex: 1,
    marginLeft: 12,
    paddingTop: 0,
  },
  categoryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  challengeNameText: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
  },
  challengeDescText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
    marginBottom: 10,
  },
  challengeStatsWrapper: {
    marginBottom: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  challengeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
    paddingHorizontal: 12,
    width: '100%',
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  challengeStatText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: '#FFBC40',
  },
  challengeStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 12,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dotActive: {
    backgroundColor: '#FFBC40',
    width: 24,
  },
  // Tab Bar
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A1A2F',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: FONTS.title,
    fontSize: 9,
    color: '#71808E',
    marginTop: 5,
  },
  tabTextActive: {
    color: '#FFBC40',
  },
  ludoIconContainer: {
    gap: 2,
  },
  ludoRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ludoSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ludoText: {
    color: '#FFFFFF',
    fontFamily: FONTS.title,
    fontSize: 7,
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F35145',
  }
});
