import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { Avatar, DynamicGradientBorder, GameButton, RadialBackground, ScreenHeader } from '@/components/ui';
import { getLeaderboard, getAllStartups } from '@/services/firebase/firestore';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Startup } from '@/types';

const HEADER_CONTENT_HEIGHT = 82;
const { width: screenWidth } = Dimensions.get('window');

const FILTERS = [
  { id: 'joueurs', label: 'JOUEURS', icon: 'people' as const },
  { id: 'entreprises', label: 'ENTREPRISES', icon: 'rocket' as const },
];

// Unified ranked item for both tabs
interface RankedItem {
  id: string;
  name: string;
  score: number;
  subtitle: string;
  type: 'user' | 'startup';
  avatar?: string | null;
  // User-specific
  isCurrentUser?: boolean;
  level?: number;
  gamesPlayed?: number;
  gamesWon?: number;
  startupCount?: number;
  rank?: string;
  // Startup-specific
  sector?: string;
  creatorName?: string;
  valorisation?: number;
}

function formatScore(item: RankedItem): string {
  if (item.type === 'startup') {
    const val = item.valorisation ?? item.score;
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1).replace('.0', '')}M€`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}K€`;
    }
    return `${val}€`;
  }
  return `${item.score.toLocaleString()} xp`;
}

export default function ClassementScreen() {
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const currentUserName = useAuthStore((state) => state.user?.displayName);
  const localProfile = useUserStore((state) => state.profile);
  const [activeFilter, setActiveFilter] = useState('joueurs');
  const [refreshing, setRefreshing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<RankedItem[]>([]);
  const [remoteStartups, setRemoteStartups] = useState<Startup[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<{ item: RankedItem; rank: number } | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const isJoueurs = activeFilter === 'joueurs';

  const fetchRemoteData = useCallback(async () => {
    try {
      const [entries, startups] = await Promise.all([
        getLeaderboard('allTime', 50),
        getAllStartups(100),
      ]);

      const mappedUsers: RankedItem[] = entries.map((e) => ({
        id: e.id,
        name: e.displayName.toUpperCase(),
        score: e.xp,
        subtitle: `${e.xp.toLocaleString()} xp`,
        type: 'user' as const,
        avatar: e.avatarUrl,
        isCurrentUser: e.id === currentUserId,
        level: e.level,
        gamesPlayed: 0,
        gamesWon: e.gamesWon,
        startupCount: 0,
      }));

      setRemoteUsers(mappedUsers);
      setRemoteStartups(startups);
    } catch (error) {
      console.warn('[Classement] Failed to fetch remote data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchRemoteData();
  }, [fetchRemoteData]);

  // === JOUEURS DATA: merge remote users with local profile ===
  const joueurData: RankedItem[] = (() => {
    const list = [...remoteUsers];

    // Always inject local user if authenticated (even with 0 XP)
    if (localProfile && currentUserId) {
      const alreadyPresent = list.some((u) => u.id === currentUserId);
      if (!alreadyPresent) {
        list.push({
          id: currentUserId,
          name: (currentUserName ?? localProfile.displayName ?? 'Moi').toUpperCase(),
          score: localProfile.xp,
          subtitle: `${localProfile.xp.toLocaleString()} xp`,
          type: 'user',
          avatar: localProfile.avatarUrl,
          isCurrentUser: true,
          level: localProfile.level,
          gamesPlayed: localProfile.gamesPlayed,
          gamesWon: localProfile.gamesWon,
          startupCount: localProfile.startups?.length ?? 0,
        });
      } else {
        // Update existing entry with local data if more recent
        const idx = list.findIndex((u) => u.id === currentUserId);
        const existing = list[idx];
        if (idx >= 0 && existing) {
          const bestScore = Math.max(existing.score, localProfile.xp);
          list[idx] = {
            ...existing,
            isCurrentUser: true,
            score: bestScore,
            subtitle: `${bestScore.toLocaleString()} xp`,
            gamesPlayed: localProfile.gamesPlayed,
            gamesWon: localProfile.gamesWon,
            startupCount: localProfile.startups?.length ?? 0,
          };
        }
      }
    }

    list.sort((a, b) => b.score - a.score);
    return list;
  })();

  // === ENTREPRISES DATA: merge remote startups with local startups ===
  const entrepriseData: RankedItem[] = (() => {
    // Start with remote startups
    const startupMap = new Map<string, Startup>();
    for (const s of remoteStartups) {
      startupMap.set(s.id, s);
    }

    // Merge local startups (may have newer data)
    const localStartups = localProfile?.startups ?? [];
    for (const s of localStartups) {
      if (!startupMap.has(s.id)) {
        startupMap.set(s.id, s);
      }
    }

    const allStartups = Array.from(startupMap.values());
    // Sort by valorisation descending
    allStartups.sort((a, b) => (b.valorisation ?? 0) - (a.valorisation ?? 0));

    return allStartups.map((s) => ({
      id: s.id,
      name: s.name.toUpperCase(),
      score: s.valorisation ?? 0,
      subtitle: formatStartupValorisation(s.valorisation ?? 0),
      type: 'startup' as const,
      sector: s.sector,
      creatorName: s.creatorName,
      valorisation: s.valorisation,
    }));
  })();

  const data = isJoueurs ? joueurData : entrepriseData;

  // Handle podium: need 3+ items
  const hasPodium = data.length >= 3;
  const podiumData = hasPodium ? [data[1], data[0], data[2]].filter(Boolean) : [];
  const restOfList = hasPodium ? data.slice(3) : [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRemoteData();
  }, [fetchRemoteData]);

  const handleProfilePress = useCallback((item: RankedItem, rank: number) => {
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

      {/* Header fixe */}
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

        {data.length === 0 ? (
          <View style={{ paddingVertical: SPACING[8] }}>
            <EmptyState
              icon="trophy-outline"
              title={isJoueurs ? 'Aucun joueur' : 'Aucune entreprise'}
              description={
                isJoueurs
                  ? 'Le classement sera disponible quand des joueurs auront joue !'
                  : 'Creez votre premiere startup pour apparaitre ici !'
              }
            />
          </View>
        ) : !hasPodium ? (
          /* Less than 3 items — simple list, no podium */
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(10, 25, 41, 0.6)"
              boxWidth={screenWidth - SPACING[4] * 2}
              style={{ paddingVertical: SPACING[2] }}
            >
              {data.map((item, index) => (
                <RankingItem
                  key={item.id}
                  rank={index + 1}
                  item={item}
                  isLast={index === data.length - 1}
                  onPress={() => handleProfilePress(item, index + 1)}
                />
              ))}
            </DynamicGradientBorder>
          </Animated.View>
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
              TOP 3 {isJoueurs ? 'JOUEURS' : 'ENTREPRISES'}
            </Text>

            {/* Podium Section */}
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
                  {/* 2nd Place */}
                  <PodiumItem
                    rank={2}
                    item={podiumData[0]!}
                    height={72}
                    medal="silver"
                    onPress={() => podiumData[0] && handleProfilePress(podiumData[0], 2)}
                  />
                  {/* 1st Place */}
                  <PodiumItem
                    rank={1}
                    item={podiumData[1]!}
                    height={100}
                    isFirst
                    medal="gold"
                    onPress={() => podiumData[1] && handleProfilePress(podiumData[1], 1)}
                  />
                  {/* 3rd Place */}
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
                      description="Jouez pour apparaitre ici !"
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

/* ───────────────── Helpers ───────────────── */

function formatStartupValorisation(val: number): string {
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1).replace('.0', '')}M€`;
  }
  if (val >= 1000) {
    return `${Math.round(val / 1000)}K€`;
  }
  return `${val}€`;
}

/* ───────────────── Profile Popup ───────────────── */

interface ProfilePopupProps {
  item: RankedItem;
  rank: number;
  isFollowed: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
}

function ProfilePopup({ item, rank, isFollowed, onToggleFollow, onClose }: ProfilePopupProps) {
  const isUser = item.type === 'user';

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.popupOverlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

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
                  {isUser && item.avatar ? (
                    <Avatar name={item.name} size="lg" source={item.avatar} />
                  ) : (
                    <Ionicons
                      name={isUser ? 'person' : 'rocket'}
                      size={28}
                      color="#FFF"
                    />
                  )}
                </View>

                <Text style={styles.popupName}>{item.name}</Text>

                <View style={styles.popupRankBadge}>
                  <Text style={styles.popupRankText}>
                    #{rank} {isUser ? (item.rank || '') : (item.sector || '')}
                  </Text>
                </View>
              </View>

              <View style={styles.popupDivider} />

              {/* Stats */}
              {isUser ? (
                <View style={styles.popupStatsRow}>
                  <PopupStat value={String(item.level || 1)} label="Niveau" />
                  <View style={styles.popupStatSep} />
                  <PopupStat value={item.score.toLocaleString()} label="XP" />
                  <View style={styles.popupStatSep} />
                  <PopupStat value={String(item.startupCount || 0)} label="Startups" />
                </View>
              ) : (
                <View style={styles.popupStatsRow}>
                  <PopupStat value={formatScore(item)} label="Valorisation" />
                  <View style={styles.popupStatSep} />
                  <PopupStat value={item.sector || '-'} label="Secteur" />
                  {item.creatorName ? (
                    <>
                      <View style={styles.popupStatSep} />
                      <PopupStat value={item.creatorName} label="Createur" />
                    </>
                  ) : null}
                </View>
              )}

              {/* Extra stats for users */}
              {isUser ? (
                <>
                  <View style={styles.popupDivider} />
                  <View style={styles.popupDetailRows}>
                    <PopupDetailRow icon="game-controller" label="Parties jouees" value={String(item.gamesPlayed || 0)} />
                    <View style={styles.popupDetailSep} />
                    <PopupDetailRow icon="trophy" label="Victoires" value={String(item.gamesWon || 0)} />
                    <View style={styles.popupDetailSep} />
                    <PopupDetailRow
                      icon="star"
                      label="Taux de victoire"
                      value={`${item.gamesPlayed ? Math.round(((item.gamesWon || 0) / item.gamesPlayed) * 100) : 0}%`}
                      highlight
                    />
                  </View>
                </>
              ) : null}

              {/* Follow button */}
              <View style={styles.popupActions}>
                {isUser && !item.isCurrentUser ? (
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

function PopupStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.popupStatItem}>
      <Text style={styles.popupStatValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.popupStatLabel}>{label}</Text>
    </View>
  );
}

function PopupDetailRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.popupDetailRow}>
      <View style={styles.popupDetailLabel}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={COLORS.textSecondary} />
        <Text style={styles.popupDetailLabelText}>{label}</Text>
      </View>
      <Text style={highlight ? styles.popupDetailValueHighlight : styles.popupDetailValue}>{value}</Text>
    </View>
  );
}

/* ───────────────── Podium ───────────────── */

const MEDAL_GRADIENTS = {
  gold: ['#FFE55C', '#F0B432', '#D4A017'] as [string, string, ...string[]],
  silver: ['#E8E8E8', '#C0C0C0', '#9E9E9E'] as [string, string, ...string[]],
  bronze: ['#E8A857', '#CD7F32', '#A0522D'] as [string, string, ...string[]],
};

interface PodiumItemProps {
  rank: number;
  item: RankedItem;
  height: number;
  isFirst?: boolean;
  medal: 'gold' | 'silver' | 'bronze';
  onPress?: () => void;
}

const PodiumItem = memo(function PodiumItem({ rank, item, height, isFirst = false, medal, onPress }: PodiumItemProps) {
  const colors = MEDAL_GRADIENTS[medal];
  const scaleY = useSharedValue(1);

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
          {item.type === 'user' && item.avatar ? (
            <Avatar name={item.name} size={isFirst ? 'md' : 'sm'} source={item.avatar} />
          ) : (
            <Ionicons name={item.type === 'user' ? 'person' : 'rocket'} size={isFirst ? 22 : 16} color="#FFF" />
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

      {/* Podium Block */}
      <Animated.View
        style={[
          { width: '100%', height },
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

/* ───────────────── Ranking Item ───────────────── */

interface RankingItemProps {
  rank: number;
  item: RankedItem;
  isLast?: boolean;
  onPress?: () => void;
}

const RankingItem = memo(function RankingItem({ rank, item, isLast, onPress }: RankingItemProps) {
  const isHighlighted = item.type === 'user' && item.isCurrentUser;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: isHighlighted ? 'rgba(255, 188, 64, 0.05)' : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        ...(isHighlighted && {
          borderWidth: 1,
          borderColor: 'rgba(255, 188, 64, 0.3)',
          marginHorizontal: 8,
          borderRadius: 12,
        }),
      }}
    >
      {/* Rank */}
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
        <Ionicons name={item.type === 'user' ? 'person' : 'rocket'} size={16} color="#FFF" />
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
          {item.type === 'startup' && item.sector ? item.sector : item.subtitle}
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
        {formatScore(item)}
      </Text>
    </Pressable>
  );
});

/* ───────────────── Styles ───────────────── */

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

  /* Profile Popup */
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
