import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useAuthStore, useUserStore } from '@/stores';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { ACHIEVEMENTS as ALL_ACHIEVEMENTS } from '@/config/achievements';
import { getRankFromXP, getXPForNextRank } from '@/config/progression';

const { width: screenWidth } = Dimensions.get('window');

// Menu items based on image
const MENU_ITEMS = [
  { id: 'stats', icon: 'stats-chart' as const, title: 'STATISTIQUES DÉTAILLÉES' },
  { id: 'community', icon: 'chatbubbles-outline' as const, title: 'REJOINDRE LA COMMUNAUTÉ' },
  { id: 'network', icon: 'people' as const, title: 'RÉSEAU & AMIS' },
  { id: 'settings', icon: 'settings' as const, title: 'PARAMÈTRE' },
  { id: 'help', icon: 'information-circle' as const, title: 'AIDE & SUPPORT' },
];

export default function ProfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const profile = useUserStore((state) => state.profile);
  const levelProgress = useUserStore((state) => state.levelProgress);
  const unlockedAchievementIds = useMemo(
    () => profile?.achievements ?? [],
    [profile?.achievements]
  );

  // Progression XP
  const totalXP = profile?.xp ?? 0;
  const currentXP = levelProgress?.currentXP ?? 0;
  const xpForNextLevel = levelProgress?.xpForNext ?? 100;
  const xpProgress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  // Rang et prochain rang
  const rankInfo = getRankFromXP(totalXP);
  const nextRankInfo = getXPForNextRank(totalXP);

  // Nom affiché
  const displayName = user?.displayName || profile?.displayName || 'Joueur';
  const displayRank = rankInfo.title;

  // Achievements dynamiques : 6 premiers (unlocked first, then locked)
  const achievementsDisplay = ALL_ACHIEVEMENTS.slice(0, 6).map((a) => ({
    id: a.id,
    icon: a.icon as keyof typeof Ionicons.glyphMap,
    title: a.title.toUpperCase(),
    unlocked: unlockedAchievementIds.includes(a.id),
  }));

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'settings':
        router.push('/settings' as never);
        break;
      case 'stats':
        router.push('/history' as never);
        break;
      case 'help':
        router.push('/help' as never);
        break;
    }
  };

  const contentWidth = screenWidth - SPACING[4] * 2;

  return (
    <View style={styles.container}>
      <RadialBackground />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: SPACING[24],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SECTION WITH BACKGROUND */}
        <View style={[styles.headerBackground, { paddingTop: insets.top + SPACING[2] }]}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.headerContent}>
            <Text style={styles.headerTitle}>PROFIL</Text>
            
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={40} color="#CBD5E1" />
              </View>
            </View>

            <Text style={styles.userName}>{displayName}</Text>

            <View style={styles.followButtonsRow}>
              <Pressable style={styles.followButton}>
                <Ionicons name="person-add-outline" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.followButtonText}>Suiveurs</Text>
              </Pressable>
              
              <Pressable style={[styles.followButton, styles.followButtonActive]}>
                <Ionicons name="person" size={16} color="#FFBC40" style={{ marginRight: 6 }} />
                <Text style={[styles.followButtonText, { color: '#FFBC40' }]}>0 SUIVIS</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

        <View style={{ paddingHorizontal: SPACING[4] }}>
          {/* PROGRESSION SECTION */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PROGRESSION</Text>
          
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.cardContent}>
              <Text style={styles.progressionSubtitle}>
                {displayRank}{nextRankInfo.nextRank ? ` - Prochain: ${nextRankInfo.nextRank.title} (${nextRankInfo.xpNeeded.toLocaleString()} XP restants)` : ' - Rang max atteint !'}
              </Text>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${xpProgress}%` }]} />
              </View>
              
              <View style={styles.xpRow}>
                <Text style={styles.xpText}>{currentXP.toLocaleString()} XP</Text>
                <Text style={styles.xpText}>{(xpForNextLevel - currentXP).toLocaleString()} XP restants</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* ACHIEVEMENTS SECTION */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ACHIEVEMENTS DÉBLOQUÉS</Text>
          
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={[styles.cardContent, styles.achievementsGrid]}>
              {achievementsDisplay.map((item) => (
                <View key={item.id} style={styles.achievementItem}>
                  <View style={[
                    styles.achievementIconBox, 
                    item.unlocked ? styles.achievementUnlocked : styles.achievementLocked
                  ]}>
                    <Ionicons 
                      name={item.icon}
                      size={24} 
                      color={item.unlocked ? '#FFBC40' : '#64748B'} 
                    />
                    <Text style={[
                      styles.achievementText,
                      item.unlocked ? { color: '#FFBC40' } : { color: '#64748B' }
                    ]}>
                      {item.title}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* MENU LIST */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <Animated.View 
              key={item.id} 
              entering={FadeInDown.delay(300 + (index * 50)).duration(500)}
            >
              <Pressable onPress={() => handleMenuPress(item.id)}>
                <DynamicGradientBorder
                  borderRadius={16}
                  fill="rgba(10, 25, 41, 0.6)" // Darker fill
                  boxWidth={contentWidth}
                  style={{ marginBottom: 10 }}
                >
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemLeft}>
                      <Ionicons name={item.icon} size={20} color="white" />
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFBC40" />
                  </View>
                </DynamicGradientBorder>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  headerBackground: {
    backgroundColor: '#0A1929', // Darker blue for header
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 0,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userName: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  followButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  followButtonActive: {
    borderColor: 'rgba(255, 188, 64, 0.3)',
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
  },
  followButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: 'white',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 16,
  },
  progressionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#FFBC40',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFBC40',
    borderRadius: 4,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#94A3B8',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '30%', // Approx 3 columns
    aspectRatio: 1,
  },
  achievementIconBox: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    padding: 4,
  },
  achievementUnlocked: {
    borderColor: '#FFBC40',
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
  },
  achievementLocked: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  achievementText: {
    fontFamily: FONTS.title,
    fontSize: 9,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  menuContainer: {
    gap: 0,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    height: 60,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: 'white',
    textTransform: 'uppercase',
  },
});
