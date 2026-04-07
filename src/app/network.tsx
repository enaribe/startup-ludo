/**
 * Réseau & Amis - Écran de gestion des abonnements/abonnés
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { RadialBackground, DynamicGradientBorder, GameButton, Avatar } from '@/components/ui';
import { useAuthStore, useUserStore } from '@/stores';
import { useSocialStore } from '@/stores/useSocialStore';
import { COLORS } from '@/styles/colors';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { SocialUser } from '@/services/firebase/socialService';

type Tab = 'following' | 'followers' | 'search';

// ===== USER CARD =====

interface UserCardProps {
  user: SocialUser;
  isFollowed: boolean;
  isGuest: boolean;
  currentUserId: string | undefined;
  onToggleFollow: (userId: string) => void;
  index: number;
}

function UserCard({ user, isFollowed, isGuest, currentUserId, onToggleFollow, index }: UserCardProps) {
  const isMe = user.id === currentUserId;
  const winRate = user.gamesPlayed > 0
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
    : 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.30)">
        <View style={styles.userCard}>
          <Avatar name={user.displayName} size="md" />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
            <Text style={styles.userRank}>{user.rank} • {user.xp.toLocaleString()} XP</Text>
            <Text style={styles.userStats}>{user.gamesPlayed} parties • {winRate}% victoires</Text>
          </View>
          {!isMe && (
            <GameButton
              title={isFollowed ? 'NE PLUS SUIVRE' : 'SUIVRE'}
              variant={isFollowed ? 'blue' : 'yellow'}
              size="sm"
              disabled={isGuest}
              onPress={() => onToggleFollow(user.id)}
            />
          )}
        </View>
      </DynamicGradientBorder>
    </Animated.View>
  );
}

// ===== EMPTY STATE =====

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { icon: keyof typeof Ionicons.glyphMap; text: string }> = {
    following: { icon: 'person-add-outline', text: "Tu ne suis personne pour l'instant.\nRecherche des joueurs pour les suivre !" },
    followers: { icon: 'people-outline', text: "Personne ne te suit encore.\nJoue et améliore ton rang pour attirer des abonnés !" },
    search: { icon: 'search-outline', text: 'Tape un nom pour rechercher un joueur.' },
  };
  const msg = messages[tab];
  return (
    <View style={styles.emptyState}>
      <Ionicons name={msg.icon} size={48} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>{msg.text}</Text>
    </View>
  );
}

// ===== MAIN SCREEN =====

export default function NetworkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const userId = user?.id ?? profile?.userId;
  const isGuest = user?.isGuest ?? true;

  const {
    following,
    followers,
    searchResults,
    followCounts,
    isLoading,
    isSearching,
    loadFollowing,
    loadFollowers,
    loadFollowCounts,
    toggleFollow,
    isFollowed,
    searchUsers,
    clearSearch,
  } = useSocialStore();

  const [activeTab, setActiveTab] = useState<Tab>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    loadFollowing(userId);
    loadFollowers(userId);
    loadFollowCounts(userId);
  }, [userId]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setActiveTab('search');
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) {
      clearSearch();
      return;
    }
    searchTimer.current = setTimeout(() => {
      searchUsers(text);
    }, 400);
  }, [searchUsers, clearSearch]);

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
    setActiveTab('following');
  };

  const handleToggleFollow = useCallback(async (targetId: string) => {
    if (!userId || isGuest) return;
    await toggleFollow(userId, targetId);
  }, [userId, isGuest, toggleFollow]);

  const listToShow: SocialUser[] =
    activeTab === 'following' ? following :
    activeTab === 'followers' ? followers :
    searchResults;

  const isLoadingList = activeTab === 'search' ? isSearching : isLoading;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>RÉSEAU & AMIS</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 72, paddingBottom: insets.bottom + SPACING[8] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compteurs */}
        <View style={styles.countersRow}>
          <View style={styles.counterItem}>
            <Text style={styles.counterValue}>{followCounts.followingCount}</Text>
            <Text style={styles.counterLabel}>Abonnements</Text>
          </View>
          <View style={styles.counterDivider} />
          <View style={styles.counterItem}>
            <Text style={styles.counterValue}>{followCounts.followersCount}</Text>
            <Text style={styles.counterLabel}>Abonnés</Text>
          </View>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        {activeTab !== 'search' && (
          <View style={styles.tabs}>
            {(['following', 'followers'] as Tab[]).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'following' ? 'ABONNEMENTS' : 'ABONNÉS'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Message guest */}
        {isGuest && (
          <View style={styles.guestBanner}>
            <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
            <Text style={styles.guestText}>
              Crée un compte pour suivre des joueurs et construire ton réseau !
            </Text>
          </View>
        )}

        {/* Liste */}
        {isLoadingList ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : listToShow.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <View style={styles.list}>
            {listToShow.map((user, i) => (
              <UserCard
                key={user.id}
                user={user}
                index={i}
                isFollowed={isFollowed(user.id)}
                isGuest={isGuest}
                currentUserId={userId}
                onToggleFollow={handleToggleFollow}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerPlaceholder: { width: 40 },

  scrollContent: { paddingHorizontal: SPACING[4] },

  countersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[4],
  },
  counterItem: { alignItems: 'center', flex: 1 },
  counterValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
  },
  counterLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  counterDivider: {
    width: 1, height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[3],
    marginBottom: SPACING[3],
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    padding: 0,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING[4],
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  tabTextActive: { color: COLORS.background },

  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255,188,64,0.10)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[3],
    marginBottom: SPACING[4],
  },
  guestText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },

  list: { gap: SPACING[3] },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    gap: SPACING[3],
  },
  userInfo: { flex: 1 },
  userName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  userRank: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  userStats: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  loader: { marginTop: SPACING[10] },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[12],
    gap: SPACING[4],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
