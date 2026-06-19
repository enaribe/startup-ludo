import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { RocketIcon } from '@/components/icons';
import {
  Avatar,
  DynamicGradientBorder,
  GameButton,
  InfoModal,
  RadialBackground,
  ScreenHeader,
} from '@/components/ui';
import { GamePopup, GamePopupGradientBorder } from '@/components/ui/GamePopup';
import type { InfoSection } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { useAuthStore, useSettingsStore, useUserStore } from '@/stores';
import { useSocialStore } from '@/stores/useSocialStore';
import { useLeaderboardCache } from '@/hooks/useLeaderboardCache';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Startup } from '@/types';
import { formatFCFARaw } from '@/utils/currency';

const HEADER_CONTENT_HEIGHT = 82;
const { width: screenWidth } = Dimensions.get('window');


const FILTERS = [
  { id: 'joueurs', labelKey: 'ranking.players', icon: 'people' as const },
  { id: 'entreprises', labelKey: 'ranking.companies', icon: 'rocket' as const },
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
    return formatFCFARaw(val);
  }
  return `${item.score.toLocaleString()} xp`;
}

function getClassementInfoSections(t: (key: string, params?: Record<string, string | number>) => string): InfoSection[] {
  return [
    {
      icon: 'people',
      title: t('ranking.infoPlayersTitle'),
      body: t('ranking.infoPlayersBody'),
    },
    {
      icon: 'rocket',
      title: t('ranking.infoCompaniesTitle'),
      body: t('ranking.infoCompaniesBody'),
    },
    {
      icon: 'refresh-circle',
      title: t('ranking.infoUpdateTitle'),
      body: t('ranking.infoUpdateBody'),
    },
    {
      icon: 'eye',
      title: t('ranking.infoTop20Title'),
      body: t('ranking.infoTop20Body'),
    },
  ];
}

export default function ClassementScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isGuest = useAuthStore((state) => state.user?.isGuest ?? true);
  const currentUserName = useAuthStore((state) => state.user?.displayName);
  const localProfile = useUserStore((state) => state.profile);
  const [activeFilter, setActiveFilter] = useState('joueurs');
  const [selectedProfile, setSelectedProfile] = useState<{ item: RankedItem; rank: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const toggleFollow = useSocialStore((s) => s.toggleFollow);
  const loadFollowing = useSocialStore((s) => s.loadFollowing);

  const selectedFollowTargetId =
    selectedProfile?.item.type === 'user' && !selectedProfile.item.isCurrentUser
      ? selectedProfile.item.id
      : null;
  const isProfileFollowed = useSocialStore((s) =>
    selectedFollowTargetId ? !!s.followingIds[selectedFollowTargetId] : false
  );

  useEffect(() => {
    if (!currentUserId) return;
    void loadFollowing(currentUserId);
  }, [currentUserId, loadFollowing]);

  useEffect(() => {
    if (!currentUserId || !selectedProfile) return;
    const item = selectedProfile.item;
    if (item.type === 'user' && !item.isCurrentUser) {
      void loadFollowing(currentUserId);
    }
  }, [selectedProfile?.item.id, currentUserId, loadFollowing]);

  const isJoueurs = activeFilter === 'joueurs';

  // Fetch lazy : on ne charge que le dataset de l'onglet actif. Au switch d'onglet,
  // le hook hydrate l'autre dataset depuis le cache mémoire/AsyncStorage si dispo.
  const { players: remotePlayers, startups: remoteStartups, isRefreshing, refresh } =
    useLeaderboardCache(isJoueurs ? 'players' : 'startups');

  // Mapper les joueurs du cache (memoizé : dépendances stables)
  const remoteUsers: RankedItem[] = useMemo(
    () =>
      remotePlayers.map((e) => ({
        id: e.id,
        name: (e.displayName ?? t('ranking.defaultPlayer')).toUpperCase(),
        score: e.xp,
        subtitle: `${e.xp.toLocaleString()} xp`,
        type: 'user' as const,
        avatar: e.avatarUrl,
        isCurrentUser: e.id === currentUserId,
        level: e.level,
        gamesPlayed: e.totalGames,
        gamesWon: e.gamesWon,
        startupCount: 0,
      })),
    [remotePlayers, currentUserId, t],
  );

  // === JOUEURS DATA: merge remote users with local profile ===
  const joueurData: RankedItem[] = useMemo(() => {
    const list = [...remoteUsers];

    if (localProfile && currentUserId) {
      const alreadyPresent = list.some((u) => u.id === currentUserId);
      if (!alreadyPresent) {
        list.push({
          id: currentUserId,
          name: (currentUserName ?? localProfile.displayName ?? t('ranking.defaultMe')).toUpperCase(),
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
  }, [remoteUsers, localProfile, currentUserId, currentUserName, t]);

  // === ENTREPRISES DATA: merge remote startups with local startups ===
  const entrepriseData: RankedItem[] = useMemo(() => {
    const startupMap = new Map<string, Startup>();
    for (const s of remoteStartups) startupMap.set(s.id, s);

    const localStartups = localProfile?.startups ?? [];
    for (const s of localStartups) {
      if (!startupMap.has(s.id)) startupMap.set(s.id, s);
    }

    const allStartups = Array.from(startupMap.values());
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
      // Marquer mes propres startups pour highlight + position "Votre position"
      isCurrentUser: s.creatorId === currentUserId || (!!currentUserName && s.creatorName === currentUserName),
    }));
  }, [remoteStartups, localProfile?.startups, currentUserId, currentUserName]);

  const data = isJoueurs ? joueurData : entrepriseData;

  // Handle podium: need 3+ items
  const hasPodium = data.length >= 3;
  const podiumData = hasPodium ? [data[1], data[0], data[2]].filter(Boolean) : [];

  // Stratégie d'affichage :
  // - Top 3 dans le podium
  // - Liste : rangs 4 à 12 toujours visibles
  // - Si l'utilisateur (joueur OU entreprise dont il est créateur) est au-delà du rang 12,
  //   on insère un séparateur puis sa propre ligne (et celles juste autour si dispo)
  const TOP_LIST_END = 12;
  // Position de l'utilisateur (joueur OU sa première startup) dans la liste courante
  const userOwnIndex = useMemo(
    () => data.findIndex((item) => item.isCurrentUser === true),
    [data],
  );

  const { topRows, ownerRow, ownerRank, hasGap } = useMemo(() => {
    // Liste juste après le podium : rangs 4 à 12
    const top = hasPodium ? data.slice(3, TOP_LIST_END) : data;

    // Si je suis hors podium ET hors top 12, je suis "loin" → on m'ajoute en bas
    if (hasPodium && userOwnIndex >= TOP_LIST_END) {
      const owner = data[userOwnIndex];
      return {
        topRows: top,
        ownerRow: owner ?? null,
        ownerRank: userOwnIndex + 1,
        hasGap: true,
      };
    }
    return { topRows: top, ownerRow: null, ownerRank: 0, hasGap: false };
  }, [data, hasPodium, userOwnIndex]);

  const userTotalCount = data.length;

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleProfilePress = useCallback((item: RankedItem, rank: number) => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedProfile({ item, rank });
  }, [hapticsEnabled]);

  const handleCloseProfile = useCallback(() => {
    setSelectedProfile(null);
  }, []);

  const handleToggleFollow = useCallback(
    (id: string) => {
      if (!currentUserId || isGuest) return;
      if (hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      void toggleFollow(currentUserId, id);
    },
    [currentUserId, isGuest, hapticsEnabled, toggleFollow]
  );

  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + HEADER_CONTENT_HEIGHT;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ScreenHeader
            title={t('ranking.headerTitle')}
            rightElement={
              <Pressable style={styles.infoBtn} onPress={() => setShowInfo(true)}>
                <Ionicons name="information-circle-outline" size={24} color="#FFBC40" />
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
            refreshing={isRefreshing}
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
                  {t(filter.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {data.length === 0 ? (
          <View style={{ paddingVertical: SPACING[8] }}>
            <EmptyState
              icon="trophy-outline"
              title={isJoueurs ? t('ranking.emptyPlayers') : t('ranking.emptyCompanies')}
              description={
                isJoueurs
                  ? t('ranking.emptyPlayersDesc')
                  : t('ranking.emptyCompaniesDesc')
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
              {isJoueurs ? t('ranking.top3Players') : t('ranking.top3Companies')}
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

            {/* List Section : rangs 4 à 12 + ligne owner si hors top 12 */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <DynamicGradientBorder
                borderRadius={24}
                fill="rgba(10, 25, 41, 0.6)"
                boxWidth={screenWidth - SPACING[4] * 2}
                style={{ paddingVertical: SPACING[2] }}
              >
                {topRows.length === 0 && !ownerRow ? (
                  <View style={{ padding: SPACING[4] }}>
                    <EmptyState
                      icon="trophy-outline"
                      title={t('ranking.emptyOthers')}
                      description={t('ranking.emptyOthersDesc')}
                    />
                  </View>
                ) : (
                  <>
                    {topRows.map((item, index) => {
                      const actualRank = 3 + index + 1; // 4, 5, ..., 12
                      const isLast = index === topRows.length - 1 && !hasGap;
                      return (
                        <RankingItem
                          key={item.id}
                          rank={actualRank}
                          item={item}
                          isLast={isLast}
                          onPress={() => handleProfilePress(item, actualRank)}
                        />
                      );
                    })}

                    {/* Saut visuel + ma position si je suis hors top 12 */}
                    {hasGap && ownerRow && (
                      <>
                        <View style={styles.gapInline}>
                          <View style={styles.gapDot} />
                          <View style={styles.gapDot} />
                          <View style={styles.gapDot} />
                          <Text style={styles.gapInlineText}>
                            {t('ranking.yourPosition', { rank: ownerRank, total: userTotalCount })}
                          </Text>
                        </View>
                        <RankingItem
                          rank={ownerRank}
                          item={ownerRow}
                          isLast
                          onPress={() => handleProfilePress(ownerRow, ownerRank)}
                        />
                      </>
                    )}
                  </>
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
          isFollowed={isProfileFollowed}
          isGuest={isGuest}
          onToggleFollow={() => handleToggleFollow(selectedProfile.item.id)}
          onClose={handleCloseProfile}
        />
      )}

      {/* Info Modal */}
      <InfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        variant="classement"
        description={t('ranking.infoModalDescription')}
        sections={getClassementInfoSections(t)}
      />
    </View>
  );
}

/* ───────────────── Helpers ───────────────── */

function formatStartupValorisation(val: number): string {
  return formatFCFARaw(val);
}

/* ───────────────── Profile Popup ───────────────── */

interface ProfilePopupProps {
  item: RankedItem;
  rank: number;
  isFollowed: boolean;
  isGuest: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
}

function ProfilePopup({ item, rank, isFollowed, isGuest, onToggleFollow, onClose }: ProfilePopupProps) {
  const { t } = useTranslation();
  const [detailPageIndex, setDetailPageIndex] = useState(0);
  const [cardW, setCardW] = useState(0);
  const [cardH, setCardH] = useState(0);
  const isUser = item.type === 'user';
  const showFollowCta = isUser && !item.isCurrentUser;

  useEffect(() => {
    setDetailPageIndex(0);
  }, [item.id]);

  const icon = isUser
    ? item.avatar
      ? <Avatar name={item.name} size="lg" source={item.avatar} />
      : <Ionicons name="person" size={64} color={COLORS.primary} />
    : <RocketIcon color="#1F91D0" size={72} withShadow={false} />;

  const pages: { title: string; content: React.ReactNode }[] = isUser
    ? [
        {
          title: t('ranking.synthesis'),
          content: (
            <View style={ppStyles.statsList}>
              <ProfileLinearStat label={t('ranking.xp')} value={item.score.toLocaleString()} />
              <View style={ppStyles.statSep} />
              <ProfileLinearStat label={t('ranking.level')} value={t('ranking.levelShort', { level: item.level || 1 })} />
              <View style={ppStyles.statSep} />
              <ProfileLinearStat label={t('ranking.companies')} value={String(item.startupCount ?? 0)} />
              <View style={ppStyles.statSep} />
              <ProfileLinearStat label={t('ranking.rank')} value={`#${rank}`} />
            </View>
          ),
        },
        {
          title: t('ranking.performance'),
          content: (
            <View style={ppStyles.infoList}>
              <ProfilePortfolioDetailRow icon="medal-outline" label={t('ranking.league')} value={item.rank?.trim() || '—'} />
              <ProfilePortfolioDetailRow icon="game-controller" label={t('ranking.gamesPlayed')} value={String(item.gamesPlayed || 0)} />
              <ProfilePortfolioDetailRow icon="trophy" label={t('ranking.wins')} value={String(item.gamesWon || 0)} />
              <ProfilePortfolioDetailRow
                icon="star"
                label={t('ranking.winRate')}
                value={`${item.gamesPlayed ? Math.round(((item.gamesWon || 0) / item.gamesPlayed) * 100) : 0}%`}
                highlight
              />
            </View>
          ),
        },
      ]
    : [
        {
          title: t('ranking.about'),
          content: (
            <View style={ppStyles.infoList}>
              <ProfileLinearStat label={t('ranking.valuation')} value={formatScore(item)} />
              <View style={ppStyles.statSep} />
              <ProfileLinearStat label={t('ranking.sector')} value={item.sector || '—'} multiline />
            </View>
          ),
        },
        {
          title: t('ranking.creator'),
          content: (
            <View style={ppStyles.infoList}>
              <ProfilePortfolioDetailRow icon="person" label={t('ranking.name')} value={item.creatorName?.trim() || '—'} />
            </View>
          ),
        },
      ];

  return (
    <GamePopup
      visible
      onRequestClose={onClose}
      icon={icon}
      spinningShape={!isUser}
      title={item.name}
      footer={
        <View style={ppStyles.actionsColumn}>
          {showFollowCta && (
            <GameButton
              title={isFollowed ? t('ranking.unfollow') : t('ranking.follow')}
              variant={isFollowed ? 'blue' : 'yellow'}
              fullWidth
              disabled={isGuest}
              onPress={onToggleFollow}
            />
          )}
          <GameButton title={t('common.close')} variant="blue" fullWidth onPress={onClose} />
        </View>
      }
    >
      {/* Carte swipeable */}
      <View
        style={ppStyles.detailCard}
        onLayout={(e) => {
          setCardW(e.nativeEvent.layout.width);
          setCardH(e.nativeEvent.layout.height);
        }}
      >
        {cardW > 0 && cardH > 0 && (
          <GamePopupGradientBorder
            width={cardW}
            height={cardH}
            borderRadius={14}
            gradientId={`profile_detail_border_${item.id}`}
          />
        )}
        <ScrollView
          key={`profile-swipe-${item.id}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          style={cardW > 0 ? { width: cardW } : undefined}
          onMomentumScrollEnd={(e) => {
            const pageW = e.nativeEvent.layoutMeasurement.width;
            const x = e.nativeEvent.contentOffset.x;
            if (pageW > 0) setDetailPageIndex(Math.round(x / pageW));
          }}
        >
          {pages.map((page) => (
            <View
              key={page.title}
              style={[ppStyles.detailPage, cardW > 0 && { width: cardW }]}
            >
              <Text style={ppStyles.detailPageTitle}>{page.title}</Text>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={ppStyles.detailScroll}>
                {page.content}
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        <View style={ppStyles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[ppStyles.dot, detailPageIndex === i && ppStyles.dotActive]} />
          ))}
        </View>
      </View>
    </GamePopup>
  );
}

function ProfileLinearStat({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={ppStyles.statLine}>
      <Text style={ppStyles.statLineLabel}>{label}</Text>
      <Text
        style={ppStyles.statLineValue}
        numberOfLines={multiline ? 3 : 1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

function ProfilePortfolioDetailRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={ppStyles.detailRow}>
      <View style={ppStyles.detailLeft}>
        <Ionicons name={icon} size={14} color="#7F8E9E" />
        <Text style={ppStyles.detailLabel}>{label}</Text>
      </View>
      <Text
        style={highlight ? ppStyles.detailValueHighlight : ppStyles.detailValue}
        numberOfLines={2}
      >
        {value}
      </Text>
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
  // Highlight si c'est moi (joueur) OU une de mes startups
  const isHighlighted =
    (item.type === 'user' && item.isCurrentUser) ||
    (item.type === 'startup' && item.isCurrentUser === true);

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
  infoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gapInline: {
    alignItems: 'center',
    paddingTop: SPACING[3],
    paddingBottom: SPACING[2],
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: SPACING[1],
  },
  gapDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gapInlineText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 188, 64, 0.7)',
    letterSpacing: 0.5,
    marginTop: SPACING[1],
  },

});

const ppStyles = StyleSheet.create({
  // Carte swipeable
  detailCard: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: SPACING[4],
    minHeight: 180,
  },
  detailPage: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[2],
    minHeight: 180,
  },
  detailPageTitle: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  detailScroll: {
    maxHeight: 200,
  },

  // Stats liste (Synthèse / À propos)
  statsList: {
    gap: 0,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[3],
    paddingVertical: SPACING[3],
  },
  statLineLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: '#7F8E9E',
    flexShrink: 0,
  },
  statLineValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    textAlign: 'right',
    flex: 1,
  },
  statSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Info liste (Performance / Créateur)
  infoList: {
    gap: 12,
    paddingBottom: SPACING[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING[2],
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  detailLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#7F8E9E',
  },
  detailValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.white,
    flex: 1,
    textAlign: 'right',
  },
  detailValueHighlight: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    flex: 1,
    textAlign: 'right',
  },

  // Dots pagination
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Footer
  actionsColumn: {
    gap: SPACING[3],
  },
});
