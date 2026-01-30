import { useState, useCallback, memo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { COLORS } from '@/styles/colors';
import { Avatar, RadialBackground, ScreenHeader, DynamicGradientBorder, GameButton } from '@/components/ui';
import { EmptyState } from '@/components/common/EmptyState';
import { useSettingsStore, useAuthStore } from '@/stores';
import { getLeaderboard, type LeaderboardEntry } from '@/services/firebase/firestore';

// Hauteur approximative du header fixe (safe area + titre + padding)
const HEADER_CONTENT_HEIGHT = 82;

const { width: screenWidth } = Dimensions.get('window');

// Filtres disponibles
const FILTERS = [
  { id: 'entrepreneurs', label: 'JOUEURS', icon: 'people' as const },
  { id: 'startups', label: 'ENTREPRISES', icon: 'rocket' as const },
];

// Types pour le profil popup
interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  avatar: string | null;
  subtitle: string;
  isUser?: boolean;
  rank?: string;
  level?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  startupCount?: number;
}

interface LeaderboardStartup {
  id: string;
  name: string;
  xp: number;
  subtitle: string;
  sector: string;
}

type LeaderboardItem = LeaderboardUser | LeaderboardStartup;

function isLeaderboardUser(item: LeaderboardItem): item is LeaderboardUser {
  return 'avatar' in item;
}

function mapLeaderboardEntry(entry: LeaderboardEntry, currentUserId: string | undefined): LeaderboardUser {
  return {
    id: entry.id,
    name: entry.displayName.toUpperCase(),
    xp: entry.xp,
    avatar: entry.avatarUrl,
    subtitle: `${entry.xp.toLocaleString()} xp`,
    isUser: entry.id === currentUserId,
    level: entry.level,
    gamesPlayed: 0,
    gamesWon: entry.gamesWon,
    startupCount: 0,
  };
}

export default function ClassementScreen() {
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [activeFilter, setActiveFilter] = useState('entrepreneurs');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<{ item: LeaderboardItem; rank: number } | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const isEntrepreneurs = activeFilter === 'entrepreneurs';

  const fetchLeaderboard = useCallback(async () => {
    try {
      const entries = await getLeaderboard('allTime', 50);
      const mapped = entries.map((e) => mapLeaderboardEntry(e, currentUserId));
      setLeaderboardData(mapped);
    } catch (error) {
      console.warn('[Classement] Failed to fetch leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const data: LeaderboardItem[] = isEntrepreneurs ? leaderboardData : [];

  // Reorder for Podium: 2nd, 1st, 3rd
  const podiumData = data.length >= 3 ? [data[1], data[0], data[2]].filter(Boolean) : [];
  const restOfList = data.slice(3);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleProfilePress = useCallback((item: LeaderboardItem, rank: number) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedProfile({ item, rank });
  }, [hapticsEnabled]);

  const handleCloseProfile = useCallback(() => {
    setSelectedProfile(null);
  }, []);

  const handleToggleFollow = useCallback((id: string) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [hapticsEnabled]);

  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + HEADER_CONTENT_HEIGHT;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe (design system: FixedHeader + ScreenHeader) */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ScreenHeader
            title="CLASSEMENT GLOBAL"
            rightElement={
              <Pressable style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            }
          />
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + SPACING[4],
          paddingBottom: SPACING[24],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFBC40"
            colors={['#FFBC40']}
          />
        }
      >
        {/* Tabs / Filters */}
        <View style={{ flexDirection: 'row', gap: SPACING[4], marginBottom: SPACING[6] }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 25,
                  backgroundColor: isActive ? 'transparent' : 'rgba(15, 30, 46, 0.6)',
                  borderWidth: 1,
                  borderColor: isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.1)',
                  gap: 8,
                }}
              >
                <Ionicons
                  name={filter.icon}
                  size={18}
                  color={isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.5)'}
                />
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.sm,
                    color: isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: SPACING[8] }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : data.length === 0 ? (
          <View style={{ paddingVertical: SPACING[8] }}>
            <EmptyState
              icon="trophy-outline"
              title={isEntrepreneurs ? 'Aucun joueur' : 'Bientot disponible'}
              description={isEntrepreneurs ? 'Le classement sera disponible quand des joueurs auront joue !' : 'Le classement des entreprises arrive bientot.'}
            />
          </View>
        ) : (
        <>
        {/* Title */}
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.xl,
            color: '#FFFFFF',
            marginBottom: SPACING[4],
            textTransform: 'uppercase',
          }}
        >
          TOP 3 {isEntrepreneurs ? 'ENTREPRENEURS' : 'ENTREPRISES'}
        </Text>

        {/* Podium Section - Or, Argent, Bronze */}
        {podiumData.length >= 3 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginBottom: SPACING[6] }}>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(10, 25, 41, 0.6)"
              boxWidth={screenWidth - SPACING[4] * 2}
              style={{
                height: 220,
                padding: SPACING[4],
                paddingBottom: 0,
                justifyContent: 'flex-end',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  height: '100%',
                  gap: 12,
                }}
              >
                {/* 2ème Place - Argent */}
                <PodiumItem
                  rank={2}
                  item={podiumData[0]!}
                  height={72}
                  medal="silver"
                  onPress={() => podiumData[0] && handleProfilePress(podiumData[0], 2)}
                />

                {/* 1ère Place - Or */}
                <PodiumItem
                  rank={1}
                  item={podiumData[1]!}
                  height={100}
                  isFirst
                  medal="gold"
                  onPress={() => podiumData[1] && handleProfilePress(podiumData[1], 1)}
                />

                {/* 3ème Place - Bronze */}
                <PodiumItem
                  rank={3}
                  item={podiumData[2]!}
                  height={58}
                  medal="bronze"
                  onPress={() => podiumData[2] && handleProfilePress(podiumData[2], 3)}
                />
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        {/* List Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={screenWidth - SPACING[4] * 2}
            style={{ paddingVertical: SPACING[2] }}
          >
            {restOfList.length === 0 ? (
              <View style={{ padding: SPACING[4] }}>
                <EmptyState
                  icon="trophy-outline"
                  title="Aucun autre classement"
                  description="Jouez pour apparaître ici !"
                />
              </View>
            ) : (
              restOfList.map((item, index) => (
                <RankingItem
                  key={item.id}
                  rank={index + 4}
                  item={item}
                  isLast={index === restOfList.length - 1}
                  onPress={() => handleProfilePress(item, index + 4)}
                />
              ))
            )}
          </DynamicGradientBorder>
        </Animated.View>
        </>
        )}
      </ScrollView>

      {/* Profile Popup */}
      {selectedProfile && (
        <ProfilePopup
          item={selectedProfile.item}
          rank={selectedProfile.rank}
          isFollowed={followedIds.has(selectedProfile.item.id)}
          onToggleFollow={() => handleToggleFollow(selectedProfile.item.id)}
          onClose={handleCloseProfile}
        />
      )}
    </View>
  );
}

/* ───────────────────────── Profile Popup ───────────────────────── */

interface ProfilePopupProps {
  item: LeaderboardItem;
  rank: number;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
}

function ProfilePopup({ item, rank, isFollowed, onToggleFollow, onClose }: ProfilePopupProps) {
  const isUser = isLeaderboardUser(item);
  const user = isUser ? item : null;
  const startup = !isUser ? item : null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.popupOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Popup Content */}
        <Animated.View
          entering={SlideInUp.duration(100).springify().damping(32)}
          style={styles.popupContainer}
        >
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.95)"
            boxWidth={screenWidth - 36}
          >
            <View style={styles.popupInner}>
              {/* Close button */}
              <Pressable onPress={onClose} style={styles.popupClose}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>

              {/* Avatar + Name */}
              <View style={styles.popupHeader}>
                <View style={styles.popupAvatar}>
                  {user?.avatar ? (
                    <Avatar name={item.name} size="lg" source={user.avatar} />
                  ) : (
                    <Ionicons
                      name={isUser ? 'person' : 'rocket'}
                      size={28}
                      color="#FFF"
                    />
                  )}
                </View>

                <Text style={styles.popupName}>{item.name}</Text>

                {/* Rank badge */}
                <View style={styles.popupRankBadge}>
                  <Text style={styles.popupRankText}>
                    #{rank} {isUser ? (user?.rank || '') : (startup?.sector || '')}
                  </Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.popupDivider} />

              {/* Stats */}
              {isUser && user ? (
                <View style={styles.popupStatsRow}>
                  <View style={styles.popupStatItem}>
                    <Text style={styles.popupStatValue}>{user.level || 1}</Text>
                    <Text style={styles.popupStatLabel}>Niveau</Text>
                  </View>
                  <View style={styles.popupStatSep} />
                  <View style={styles.popupStatItem}>
                    <Text style={styles.popupStatValue}>{user.xp.toLocaleString()}</Text>
                    <Text style={styles.popupStatLabel}>XP</Text>
                  </View>
                  <View style={styles.popupStatSep} />
                  <View style={styles.popupStatItem}>
                    <Text style={styles.popupStatValue}>{user.startupCount || 0}</Text>
                    <Text style={styles.popupStatLabel}>Startups</Text>
                  </View>
                </View>
              ) : startup ? (
                <View style={styles.popupStatsRow}>
                  <View style={styles.popupStatItem}>
                    <Text style={styles.popupStatValue}>{startup.xp.toLocaleString()}</Text>
                    <Text style={styles.popupStatLabel}>Jetons</Text>
                  </View>
                  <View style={styles.popupStatSep} />
                  <View style={styles.popupStatItem}>
                    <Text style={styles.popupStatValue}>{startup.sector}</Text>
                    <Text style={styles.popupStatLabel}>Secteur</Text>
                  </View>
                </View>
              ) : null}

              {/* Extra stats for users */}
              {isUser && user ? (
                <>
                  <View style={styles.popupDivider} />
                  <View style={styles.popupDetailRows}>
                    <View style={styles.popupDetailRow}>
                      <View style={styles.popupDetailLabel}>
                        <Ionicons name="game-controller" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.popupDetailLabelText}>Parties jouées</Text>
                      </View>
                      <Text style={styles.popupDetailValue}>{user.gamesPlayed || 0}</Text>
                    </View>
                    <View style={styles.popupDetailSep} />
                    <View style={styles.popupDetailRow}>
                      <View style={styles.popupDetailLabel}>
                        <Ionicons name="trophy" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.popupDetailLabelText}>Victoires</Text>
                      </View>
                      <Text style={styles.popupDetailValue}>{user.gamesWon || 0}</Text>
                    </View>
                    <View style={styles.popupDetailSep} />
                    <View style={styles.popupDetailRow}>
                      <View style={styles.popupDetailLabel}>
                        <Ionicons name="star" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.popupDetailLabelText}>Taux de victoire</Text>
                      </View>
                      <Text style={styles.popupDetailValueHighlight}>
                        {user.gamesPlayed ? Math.round(((user.gamesWon || 0) / user.gamesPlayed) * 100) : 0}%
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {/* Follow button */}
              <View style={styles.popupActions}>
                {isUser && !user?.isUser ? (
                  <GameButton
                    title={isFollowed ? 'SUIVI' : 'SUIVRE'}
                    variant={isFollowed ? 'blue' : 'yellow'}
                    fullWidth
                    onPress={onToggleFollow}
                  />
                ) : (
                  <GameButton
                    title="FERMER"
                    variant="blue"
                    fullWidth
                    onPress={onClose}
                  />
                )}
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ───────────────────────── Podium ───────────────────────── */

const MEDAL_GRADIENTS = {
  gold: ['#FFE55C', '#F0B432', '#D4A017'] as [string, string, ...string[]],
  silver: ['#E8E8E8', '#C0C0C0', '#9E9E9E'] as [string, string, ...string[]],
  bronze: ['#E8A857', '#CD7F32', '#A0522D'] as [string, string, ...string[]],
};

interface PodiumItemProps {
  rank: number;
  item: LeaderboardItem;
  height: number;
  isFirst?: boolean;
  medal: 'gold' | 'silver' | 'bronze';
  onPress?: () => void;
}

const PodiumItem = memo(function PodiumItem({ rank, item, height, isFirst = false, medal, onPress }: PodiumItemProps) {
  const colors = MEDAL_GRADIENTS[medal];
  const scaleY = useSharedValue(1);
  const hasAvatar = isLeaderboardUser(item) && item.avatar;

  useEffect(() => {
    const delay = (rank - 1) * 150;
    scaleY.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, [rank, scaleY]);

  const animatedBlockStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', flex: 1, marginBottom: 0 }}>
      {/* Avatar */}
      <View style={{ marginBottom: 6, alignItems: 'center' }}>
        <View
          style={{
            width: isFirst ? 52 : 40,
            height: isFirst ? 52 : 40,
            borderRadius: isFirst ? 26 : 20,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 4,
          }}
        >
          {hasAvatar ? (
            <Avatar name={item.name} size={isFirst ? 'md' : 'sm'} source={(item as LeaderboardUser).avatar} />
          ) : (
            <Ionicons name="person" size={isFirst ? 22 : 16} color="#FFF" />
          )}
        </View>
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: isFirst ? 10 : 9,
            color: '#FFBC40',
            textAlign: 'center',
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 8,
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
          }}
        >
          {item.subtitle}
        </Text>
      </View>

      {/* Podium Block - Or / Argent / Bronze (animation étire / rétrécit) */}
      <Animated.View
        style={[
          {
            width: '100%',
            height: height,
          },
          animatedBlockStyle,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: isFirst ? 26 : 20,
              color: medal === 'gold' ? '#5C4813' : medal === 'silver' ? '#3D3D3D' : '#4A2C0A',
              opacity: 0.85,
            }}
          >
            {rank}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

/* ───────────────────────── Ranking Item ───────────────────────── */

interface RankingItemProps {
  rank: number;
  item: LeaderboardItem;
  isLast?: boolean;
  onPress?: () => void;
}

const RankingItem = memo(function RankingItem({ rank, item, isLast, onPress }: RankingItemProps) {
  const isUser = isLeaderboardUser(item) && item.isUser;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: isUser ? 'rgba(255, 188, 64, 0.05)' : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        ...(isUser && {
          borderWidth: 1,
          borderColor: 'rgba(255, 188, 64, 0.3)',
          marginHorizontal: 8,
          borderRadius: 12,
        })
      }}
    >
      {/* Rang */}
      <Text
        style={{
          fontFamily: FONTS.title,
          fontSize: 16,
          color: '#4DB8FF',
          width: 30,
          textAlign: 'center',
        }}
      >
        {rank}
      </Text>

      {/* Avatar */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={isLeaderboardUser(item) ? 'person' : 'rocket'} size={16} color="#FFF" />
      </View>

      {/* Infos */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: 13,
            color: '#FFFFFF',
            textTransform: 'uppercase',
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {item.subtitle}
        </Text>
      </View>

      {/* Score */}
      <Text
        style={{
          fontFamily: FONTS.bodyBold,
          fontSize: 13,
          color: '#FFBC40',
        }}
      >
        {item.xp.toLocaleString()} xp
      </Text>
    </Pressable>
  );
});

/* ───────────────────────── Styles ───────────────────────── */

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
    paddingBottom: 16,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Profile Popup ── */
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  popupContainer: {
    width: '100%',
  },
  popupInner: {
    padding: SPACING[5],
  },
  popupClose: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  popupAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING[3],
  },
  popupName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: SPACING[2],
  },
  popupRankBadge: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderRadius: 12,
  },
  popupRankText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  popupDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[4],
  },
  popupStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  popupStatValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    marginBottom: 2,
  },
  popupStatLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  popupStatSep: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  popupDetailRows: {
    gap: 0,
  },
  popupDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[2],
  },
  popupDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  popupDetailLabelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  popupDetailValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  popupDetailValueHighlight: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
  },
  popupDetailSep: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  popupActions: {
    marginTop: SPACING[5],
  },
});
