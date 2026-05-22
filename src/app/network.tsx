/**
 * Réseau & Amis - Écran de gestion des abonnements/abonnés
 *
 * Design aligné sur les autres écrans de l'app (profil, statistiques) :
 * header #0A1929 arrondi, cartes DynamicGradientBorder fond rgba(0,0,0,0.35).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Dimensions,
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
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { SocialUser } from '@/services/firebase/socialService';

type Tab = 'following' | 'followers' | 'search';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

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
      <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
        <View style={styles.userCard}>
          <Avatar source={user.avatarUrl} name={user.displayName} size="lg" showBorder />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
            <Text style={styles.userRank}>{user.rank} • {user.xp.toLocaleString()} XP</Text>
            <Text style={styles.userStats}>{user.gamesPlayed} parties • {winRate}% victoires</Text>
          </View>
          {!isMe && (
            <GameButton
              title={isFollowed ? 'SUIVI' : 'SUIVRE'}
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
    search: { icon: 'search-outline', text: 'Tape un pseudo pour rechercher un joueur.' },
  };
  const msg = messages[tab];
  return (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.emptyWrapper}>
      <DynamicGradientBorder borderRadius={20} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name={msg.icon} size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>{msg.text}</Text>
        </View>
      </DynamicGradientBorder>
    </Animated.View>
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

      {/* Header fixe */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>RÉSEAU & AMIS</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + SPACING[8] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Compteurs — style statsGrid */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
            <View style={styles.countersRow}>
              <View style={styles.counterItem}>
                <View style={[styles.counterIconCircle, { backgroundColor: 'rgba(255,188,64,0.15)' }]}>
                  <Ionicons name="person-add" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.counterValue, { color: COLORS.primary }]}>
                  {followCounts.followingCount}
                </Text>
                <Text style={styles.counterLabel}>Abonnements</Text>
              </View>

              <View style={styles.counterDivider} />

              <View style={styles.counterItem}>
                <View style={[styles.counterIconCircle, { backgroundColor: 'rgba(33,150,243,0.15)' }]}>
                  <Ionicons name="people" size={20} color={COLORS.info} />
                </View>
                <Text style={[styles.counterValue, { color: COLORS.info }]}>
                  {followCounts.followersCount}
                </Text>
                <Text style={styles.counterLabel}>Abonnés</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Barre de recherche */}
        <Animated.View
          entering={FadeInDown.delay(140).duration(450)}
          style={styles.searchWrapper}
        >
          <DynamicGradientBorder borderRadius={14} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
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
          </DynamicGradientBorder>
        </Animated.View>

        {/* Switch Abonnements / Abonnés — même design que l'écran liste programmes */}
        {activeTab !== 'search' && (
          <Animated.View entering={FadeInDown.delay(200).duration(450)} style={styles.switchWrap}>
            <DynamicGradientBorder borderRadius={24} fill="rgba(0, 0, 0, 0.35)" boxWidth={contentWidth}>
              <View style={styles.switchInner}>
                <Pressable
                  style={[styles.switchButton, activeTab === 'following' && styles.switchButtonActive]}
                  onPress={() => setActiveTab('following')}
                >
                  <Text style={[styles.switchText, activeTab === 'following' && styles.switchTextActive]}>
                    Abonnements
                  </Text>
                  {following.length > 0 && (
                    <View style={[styles.switchBadge, activeTab === 'following' && styles.switchBadgeActive]}>
                      <Text style={styles.switchBadgeText}>{following.length}</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.switchButton, activeTab === 'followers' && styles.switchButtonActive]}
                  onPress={() => setActiveTab('followers')}
                >
                  <Text style={[styles.switchText, activeTab === 'followers' && styles.switchTextActive]}>
                    Abonnés
                  </Text>
                  {followers.length > 0 && (
                    <View style={[styles.switchBadge, activeTab === 'followers' && styles.switchBadgeActive]}>
                      <Text style={styles.switchBadgeText}>{followers.length}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        {/* Message guest */}
        {isGuest && (
          <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.guestWrapper}>
            <DynamicGradientBorder borderRadius={14} fill="rgba(255,188,64,0.10)" boxWidth={contentWidth}>
              <View style={styles.guestBanner}>
                <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
                <Text style={styles.guestText}>
                  Crée un compte pour suivre des joueurs et construire ton réseau !
                </Text>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
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
  container: { flex: 1, backgroundColor: '#0C243E' },

  // Header — aligné sur profil.tsx / history.tsx
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnPlaceholder: { width: 40, height: 40 },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  scrollContent: { paddingHorizontal: SPACING[4] },

  // Compteurs
  countersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    width: '100%',
  },
  counterItem: { alignItems: 'center', flex: 1 },
  counterIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING[2],
  },
  counterValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
  },
  counterLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  counterDivider: {
    width: 1, height: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Recherche
  searchWrapper: { marginTop: SPACING[4] },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[3],
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    padding: 0,
  },

  // Switch Abonnements / Abonnés — repris de l'écran liste programmes
  switchWrap: {
    marginTop: SPACING[4],
  },
  switchInner: {
    flexDirection: 'row',
    padding: 4,
    height: 48,
    width: '100%',
  },
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    borderRadius: 20,
    paddingHorizontal: SPACING[3],
  },
  switchButtonActive: {
    backgroundColor: '#1F91D0',
  },
  switchText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  switchTextActive: {
    fontFamily: FONTS.bodySemiBold,
    color: '#FFFFFF',
  },
  switchBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  switchBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  switchBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },

  // Bandeau invité
  guestWrapper: { marginTop: SPACING[4] },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[3],
    width: '100%',
  },
  guestText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },

  // Liste
  list: { gap: SPACING[3], marginTop: SPACING[4] },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    gap: SPACING[3],
    width: '100%',
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

  // État vide
  emptyWrapper: { marginTop: SPACING[4] },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[8],
    paddingHorizontal: SPACING[4],
    gap: SPACING[3],
  },
  emptyIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,188,64,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
