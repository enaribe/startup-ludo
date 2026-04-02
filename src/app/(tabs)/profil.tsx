import { memo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore, useUserStore } from '@/stores';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { getRankFromXP, getXPForNextRank } from '@/config/progression';

const { width: screenWidth } = Dimensions.get('window');

interface IconProps {
  size?: number;
}

const StatsDetailedIcon = memo(function StatsDetailedIcon({ size = 28 }: IconProps) {
  const scale = size / 51;
  return (
    <Svg width={51 * scale} height={42 * scale} viewBox="0 0 51 42" fill="none">
      <Rect x="0.5" y="25.207" width="13.111" height="16.2928" rx="5.5" fill="#1F91D0" stroke="#0E2B4B" />
      <Rect x="18.6445" y="12.8555" width="13.111" height="28.6449" rx="5.5" fill="#1F91D0" stroke="#0E2B4B" />
      <Rect x="36.7852" y="0.5" width="13.111" height="40.9969" rx="5.5" fill="#1F91D0" stroke="#0E2B4B" />
    </Svg>
  );
});

const CommunityIcon = memo(function CommunityIcon({ size = 28 }: IconProps) {
  const scale = size / 42;
  return (
    <Svg width={42 * scale} height={42 * scale} viewBox="0 0 42 42" fill="none">
      <Path d="M0 42L2.96634 31.2148C1.1359 28.0578 0.174077 24.479 0.175835 20.8092C0.18111 9.33625 9.56192 0 21.0879 0C26.6812 0.00175 31.9317 2.17 35.8809 6.104C39.8284 10.038 42.0018 15.267 42 20.8285C41.9947 32.3033 32.6139 41.6395 21.0879 41.6395C17.5888 41.6378 14.1407 40.7645 11.0864 39.1055L0 42ZM11.5998 35.3378C14.5468 37.079 17.3602 38.122 21.0809 38.1238C30.6604 38.1238 38.464 30.3643 38.4692 20.825C38.4727 11.2665 30.7061 3.5175 21.0949 3.514C11.5084 3.514 3.71012 11.2735 3.70661 20.811C3.70485 24.7048 4.85129 27.6202 6.77669 30.6705L5.0201 37.0545L11.5998 35.3378ZM31.6222 25.7758C31.4921 25.5588 31.1439 25.4293 30.6199 25.1685C30.0977 24.9078 27.5288 23.6495 27.0487 23.4763C26.5705 23.303 26.2223 23.2155 25.8724 23.737C25.5242 24.2568 24.522 25.4293 24.2178 25.7758C23.9136 26.1223 23.6076 26.166 23.0854 25.9053C22.5632 25.6445 20.8787 25.0968 18.8829 23.324C17.3303 21.945 16.2806 20.2423 15.9764 19.7208C15.6722 19.201 15.9447 18.9193 16.205 18.6603C16.4406 18.4275 16.7272 18.053 16.9892 17.7485C17.2547 17.4475 17.3409 17.2305 17.5167 16.8823C17.6908 16.5358 17.6046 16.2313 17.4727 15.9705C17.3409 15.7115 16.2964 13.1513 15.8621 12.11C15.4366 11.0968 15.0058 11.2333 14.6858 11.2175L13.6835 11.2C13.3353 11.2 12.7692 11.3295 12.2909 11.851C11.8126 12.3725 10.4622 13.629 10.4622 16.1893C10.4622 18.7495 12.3348 21.2222 12.5951 21.5688C12.8571 21.9153 16.2788 27.1688 21.5205 29.421C22.7671 29.9565 23.7413 30.2768 24.4991 30.5165C25.7511 30.912 26.8905 30.856 27.7908 30.723C28.7948 30.5743 30.8819 29.4648 31.318 28.2503C31.7541 27.034 31.7541 25.9928 31.6222 25.7758Z" fill="#1F91D0" />
    </Svg>
  );
});

const NetworkIcon = memo(function NetworkIcon({ size = 28 }: IconProps) {
  const scale = size / 56;
  return (
    <Svg width={56 * scale} height={43 * scale} viewBox="0 0 56 43" fill="none">
      <Path d="M47.4916 13.1199C48.3541 7.59946 44.5781 2.425 39.0579 1.56249C33.5376 0.699984 28.3636 4.47606 27.5011 9.99652C26.6386 15.517 30.4143 20.6914 35.9346 21.5539C41.4548 22.4164 46.6291 18.6404 47.4916 13.1199Z" fill="#1F91D0" stroke="#0D2946" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M37.5058 21.7656C30.0158 21.7656 23.4829 25.8392 19.9883 31.8827C23.4829 37.9261 30.0158 41.9994 37.5058 41.9994C44.9958 41.9994 51.5287 37.9261 55.0233 31.8827C51.5287 25.8392 44.9958 21.7656 37.5058 21.7656Z" fill="#1F91D0" stroke="#0D2946" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5072 21.7648C15.0169 21.7648 17.862 18.9195 17.862 15.4097C17.862 11.8999 15.0169 9.05469 11.5072 9.05469C7.99753 9.05469 5.15234 11.8999 5.15234 15.4097C5.15234 18.9195 7.99753 21.7648 11.5072 21.7648Z" fill="#1F91D0" stroke="#0D2946" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5069 21.7656C6.79921 21.7656 2.69247 24.3254 0.5 28.1207C2.7036 31.9159 6.81034 34.4757 11.5069 34.4757C16.2035 34.4757 20.3213 31.9159 22.5138 28.1207C20.3102 24.3254 16.2035 21.7656 11.5069 21.7656Z" fill="#1F91D0" stroke="#0D2946" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const SettingsIcon = memo(function SettingsIcon({ size = 28 }: IconProps) {
  const scale = size / 43;
  return (
    <Svg width={43 * scale} height={43 * scale} viewBox="0 0 43 43" fill="none">
      <Path d="M40.5 25.7C41.6046 25.7 42.5 24.8046 42.5 23.7V19.3C42.5 18.1954 41.6046 17.3 40.5 17.3H39.2969C38.3839 17.3 37.5989 16.6769 37.2908 15.8175C37.1119 15.3185 36.91 14.8306 36.6861 14.3555C36.296 13.5279 36.4094 12.5294 37.0564 11.8825L37.9022 11.0366C38.6833 10.2556 38.6833 8.98923 37.9022 8.20818L34.7918 5.0978C34.0108 4.31675 32.7444 4.31675 31.9634 5.0978L31.1144 5.94678C30.4689 6.59229 29.4733 6.70682 28.6477 6.31722C28.1709 6.09222 27.6823 5.88942 27.1823 5.7098C26.3232 5.40111 25.7 4.61609 25.7 3.70313V2.5C25.7 1.39543 24.8046 0.5 23.7 0.5H19.3C18.1954 0.5 17.3 1.39543 17.3 2.5V3.70313C17.3 4.61609 16.6769 5.40113 15.8175 5.70921C15.3185 5.8881 14.8306 6.09 14.3555 6.31393C13.5279 6.70403 12.5294 6.59061 11.8825 5.94364L11.0366 5.0978C10.2556 4.31675 8.98923 4.31675 8.20818 5.0978L5.0978 8.20818C4.31675 8.98923 4.31675 10.2556 5.0978 11.0366L5.94678 11.8856C6.59229 12.5311 6.70682 13.5267 6.31722 14.3523C6.09222 14.8291 5.88942 15.3178 5.7098 15.8177C5.40111 16.6769 4.61609 17.3 3.70313 17.3H2.5C1.39543 17.3 0.5 18.1954 0.5 19.3V23.7C0.5 24.8046 1.39543 25.7 2.5 25.7H3.70313C4.61609 25.7 5.40113 26.3231 5.70921 27.1825C5.8881 27.6815 6.09 28.1694 6.31393 28.6445C6.70403 29.4721 6.59061 30.4706 5.94364 31.1176L5.0978 31.9634C4.31675 32.7445 4.31675 34.0108 5.0978 34.7918L8.20818 37.9022C8.98923 38.6833 10.2556 38.6833 11.0366 37.9022L11.8856 37.0532C12.5311 36.4077 13.5267 36.2932 14.3523 36.6828C14.8291 36.9078 15.3178 37.1106 15.8177 37.2902C16.6769 37.5989 17.3 38.3839 17.3 39.2969V40.5C17.3 41.6046 18.1954 42.5 19.3 42.5H23.7C24.8046 42.5 25.7 41.6046 25.7 40.5V39.2969C25.7 38.3839 26.3231 37.5989 27.1825 37.2908C27.6815 37.1119 28.1694 36.91 28.6445 36.6861C29.4721 36.296 30.4706 36.4094 31.1175 37.0564L31.9634 37.9022C32.7444 38.6833 34.0108 38.6833 34.7918 37.9022L37.9022 34.7918C38.6833 34.0108 38.6833 32.7445 37.9022 31.9634L37.0532 31.1144C36.4077 30.4689 36.2932 29.4733 36.6828 28.6477C36.9078 28.171 37.1106 27.6823 37.2902 27.1823C37.5989 26.3232 38.3839 25.7 39.2969 25.7H40.5Z" fill="#1F91D0" stroke="#0D2845" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21.4992 27.8031C24.9786 27.8031 27.7992 24.9825 27.7992 21.5031C27.7992 18.0237 24.9786 15.2031 21.4992 15.2031C18.0198 15.2031 15.1992 18.0237 15.1992 21.5031C15.1992 24.9825 18.0198 27.8031 21.4992 27.8031Z" fill="#0E2C4C" stroke="#0D2845" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const HelpIcon = memo(function HelpIcon({ size = 28 }: IconProps) {
  const scale = size / 42;
  return (
    <Svg width={42 * scale} height={42 * scale} viewBox="0 0 42 42" fill="none">
      <Circle cx="21" cy="21" r="20.5" fill="#1F91D0" stroke="#0D2642" />
      <Path d="M21.0016 12.25C20.037 12.25 19.252 13.0351 19.252 13.9997C19.252 14.9643 20.037 15.7493 21.0016 15.7493C21.9662 15.7493 22.7513 14.9643 22.7513 13.9997C22.7513 13.0351 21.9662 12.25 21.0016 12.25Z" fill="#0F3054" />
      <Path d="M21 31.1993V19.2422" stroke="#0F3054" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

const AchievementIcon = memo(function AchievementIcon({ size = 28 }: IconProps) {
  return <Ionicons name="ribbon" size={size} color="#1F91D0" />;
});

/** Ordre grille comme maquette : stats | communauté | réseau | paramètres | aide | achievements */
const MENU_ITEMS = [
  { id: 'stats', title: 'STATISTIQUES DÉTAILLÉES', Icon: StatsDetailedIcon },
  { id: 'community', title: 'REJOINDRE LA COMMUNAUTÉ', Icon: CommunityIcon },
  { id: 'network', title: 'RÉSEAU & AMIS', Icon: NetworkIcon },
  { id: 'settings', title: 'PARAMÈTRE', Icon: SettingsIcon },
  { id: 'help', title: 'AIDE & SUPPORT', Icon: HelpIcon },
  { id: 'achievements', title: 'ACHIEVEMENTS', Icon: AchievementIcon },
] as const;

export default function ProfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const profile = useUserStore((state) => state.profile);
  const levelProgress = useUserStore((state) => state.levelProgress);

  const totalXP = profile?.xp ?? 0;
  const currentXP = levelProgress?.currentXP ?? 0;
  const xpForNextLevel = levelProgress?.xpForNext ?? 100;
  const xpProgress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  const rankInfo = getRankFromXP(totalXP);
  const nextRankInfo = getXPForNextRank(totalXP);

  const displayName = user?.displayName || profile?.displayName || 'Joueur';
  const displayRank = rankInfo.title;

  const handleMenuPress = (itemId: string) => {
    switch (itemId) {
      case 'settings':
        router.push('/settings' as never);
        break;
      case 'stats':
        router.push('/history' as never);
        break;
      case 'achievements':
        router.push('/achievements' as never);
        break;
      case 'community':
        Linking.openURL('https://chat.whatsapp.com/HMOY7uJBbNd4O64gysmitZ');
        break;
      case 'help':
        router.push('/help' as never);
        break;
      case 'network':
        break;
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
  };

  const contentWidth = screenWidth - SPACING[4] * 2;
  const gridGap = SPACING[3];
  const gridCellWidth = (contentWidth - gridGap) / 2;

  return (
    <View style={styles.container}>
      <RadialBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + SPACING[2] }]}>
          <View style={styles.topBarRow}>
            {router.canGoBack() ? (
              <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </Pressable>
            ) : (
              <View style={styles.backBtnPlaceholder} />
            )}
            <Text style={styles.topBarTitle}>PROFIL</Text>
            <View style={styles.backBtnPlaceholder} />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(450)} style={styles.profileBlock}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={40} color="#CBD5E1" />
            </View>
          </View>

          <Text style={styles.userName}>{displayName}</Text>

          <Pressable style={styles.followersPill}>
            <Ionicons name="person" size={18} color={COLORS.primary} style={styles.followersPillIcon} />
            <Text style={styles.followersPillText}>0 SUIVEURS</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.contentWrap}>
          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.sectionContainer}>
            <DynamicGradientBorder
              borderRadius={20}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
            >
              <View style={styles.cardContent}>
                <Text style={styles.progressionTitleInCard}>PROGRESSION</Text>
                <Text style={styles.progressionSubtitle}>
                  <Text style={styles.rankHighlight}>{displayRank}</Text>
                  {nextRankInfo.nextRank
                    ? ` - Prochain: ${nextRankInfo.nextRank.title} (${nextRankInfo.xpNeeded.toLocaleString()} XP)`
                    : ' - Rang max atteint !'}
                </Text>

                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${Math.max(0, Math.min(100, xpProgress))}%` }]} />
                </View>

                <View style={styles.xpRow}>
                  <Text style={styles.xpText}>{currentXP.toLocaleString()} XP</Text>
                  <Text style={styles.xpText}>{Math.max(0, xpForNextLevel - currentXP).toLocaleString()} XP restants</Text>
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>

          <View style={[styles.menuGrid, { gap: gridGap }]}>
            {MENU_ITEMS.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(180 + index * 40).duration(420)}
                style={{ width: gridCellWidth }}
              >
                <Pressable onPress={() => handleMenuPress(item.id)}>
                  <DynamicGradientBorder
                    borderRadius={16}
                    fill="rgba(0, 0, 0, 0.35)"
                    boxWidth={gridCellWidth}
                    style={styles.menuGridCard}
                  >
                    <View style={styles.menuGridInner}>
                      <View style={styles.menuGridIconWrap}>
                        <item.Icon size={36} />
                      </View>
                      <Text style={styles.menuGridText}>{item.title}</Text>
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
  scrollContent: {
    paddingBottom: 120,
  },
  topBar: {
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: SPACING[3],
    marginBottom: SPACING[4],
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  topBarTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  profileBlock: {
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  avatarContainer: {
    marginBottom: SPACING[3],
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
    fontSize: FONT_SIZES['2xl'],
    color: 'white',
    marginBottom: SPACING[3],
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  followersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[5],
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.35)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  followersPillIcon: {
    marginRight: SPACING[2],
  },
  followersPillText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  contentWrap: {
    paddingHorizontal: SPACING[4],
  },
  sectionContainer: {
    marginBottom: SPACING[4],
  },
  cardContent: {
    padding: SPACING[4],
  },
  progressionTitleInCard: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    marginBottom: SPACING[2],
    textTransform: 'uppercase',
  },
  progressionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING[3],
    lineHeight: 18,
  },
  rankHighlight: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.primary,
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
    fontSize: 11,
    color: '#94A3B8',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING[4],
  },
  menuGridCard: {
    marginBottom: 0,
  },
  menuGridInner: {
    minHeight: 132,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[3],
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  menuGridIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuGridText: {
    fontFamily: FONTS.title,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.white,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
