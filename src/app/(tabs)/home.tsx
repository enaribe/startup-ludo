import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useEffect } from 'react';
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

import { Avatar, DynamicGradientBorder, GradientBorder, RadialBackground } from '@/components/ui';
import { formatXP, getLevelFromXP, getRankFromXP, getRankProgress } from '@/config/progression';
import { useAuthStore, useUserStore } from '@/stores';
import { FONTS } from '@/styles/typography';

const { width } = Dimensions.get('window');

// Rayons tournants sous le logo
const SpinningRays = memo(function SpinningRays() {
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
});

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
  const portfolioValue = profile?.startups?.reduce((sum, s) => sum + s.tokensInvested, 0) ?? 0;

  const displayName = user?.displayName || profile?.displayName || 'Joueur';

  const handlePlay = () => {
    router.push('/(game)/mode-selection');
  };

  // Calcul de la hauteur du header fixe (safe area + logo + marge + profile + marge + stats + marge bas + paddingBottom)
  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + 120 + 4 + 68 + 15 + 78 + 20 + 12;

  return (
    <View style={styles.container}>
      {/* Background Radial Gradient SVG */}
      <RadialBackground />

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
        </View>

        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.challengeCardWrapper}>
          <DynamicGradientBorder borderRadius={16} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.challengeCardContent}>
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="trophy-outline" size={40} color="rgba(255, 255, 255, 0.2)" />
                <Text style={[styles.challengeNameText, { marginTop: 12, opacity: 0.5 }]}>
                  BIENTOT DISPONIBLE
                </Text>
                <Text style={[styles.challengeDescText, { textAlign: 'center', marginTop: 6 }]}>
                  Les challenges hebdomadaires arrivent bientot !
                </Text>
              </View>
            </View>
          </DynamicGradientBorder>
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
