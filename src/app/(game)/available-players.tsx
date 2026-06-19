/**
 * Joueurs disponibles - liste des contacts avec statut temps réel.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { GamePopup } from '@/components/ui/GamePopup';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useTranslation } from '@/i18n';
import { usePresenceMap } from '@/hooks/usePresence';
import { sendGameInvitation } from '@/services/firebase/gameInvitationService';
import {
  getPresenceLabel,
  getPresenceState,
  type PlayerPresenceState,
} from '@/services/firebase/presenceService';
import type { SocialUser } from '@/services/firebase/socialService';
import { useAuthStore, useSocialStore, useUserStore } from '@/stores';
import {
  STAKE_OPTIONS_PTW,
  stakePtwToFcfa,
  getStakableBalanceFcfa,
  canAffordStake,
} from '@/services/game/stakeService';
import { formatPtwRaw } from '@/utils/currency';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

const STATUS_META: Record<PlayerPresenceState, { color: string; rank: number }> = {
  online: { color: COLORS.success, rank: 0 },
  in_game: { color: COLORS.info, rank: 1 },
  offline: { color: 'rgba(255,255,255,0.28)', rank: 2 },
};

function mergeUsers(users: SocialUser[], currentUserId: string | undefined): SocialUser[] {
  const map = new Map<string, SocialUser>();
  users.forEach((u) => {
    if (u.id !== currentUserId) map.set(u.id, u);
  });
  return Array.from(map.values());
}

export default function AvailablePlayersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();

  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const following = useSocialStore((state) => state.following);
  const followers = useSocialStore((state) => state.followers);
  const isLoadingSocial = useSocialStore((state) => state.isLoading);
  const loadFollowing = useSocialStore((state) => state.loadFollowing);
  const loadFollowers = useSocialStore((state) => state.loadFollowers);

  const { createRoom } = useMultiplayer(user?.id ?? null);

  const [refreshing, setRefreshing] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  // Contact en attente de choix de mise (modale ouverte) + mise sélectionnée (Ptw).
  const [pendingInvite, setPendingInvite] = useState<SocialUser | null>(null);
  const [stakePtw, setStakePtw] = useState<number>(0);

  const isGuest = user?.isGuest ?? true;
  const stakableBalanceFcfa = useMemo(
    () => getStakableBalanceFcfa(profile?.startups),
    [profile?.startups]
  );

  const contacts = useMemo(
    () => mergeUsers([...following, ...followers], user?.id),
    [following, followers, user?.id]
  );
  const presenceMap = usePresenceMap(contacts.map((u) => u.id));

  const hasProject = (profile?.startups?.length ?? 0) > 0;

  const loadContacts = useCallback(async () => {
    if (!user?.id) return;
    await Promise.all([
      loadFollowing(user.id),
      loadFollowers(user.id),
    ]);
  }, [user?.id, loadFollowing, loadFollowers]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const stateA = getPresenceState(presenceMap[a.id]);
      const stateB = getPresenceState(presenceMap[b.id]);
      const statusDiff = STATUS_META[stateA].rank - STATUS_META[stateB].rank;
      if (statusDiff !== 0) return statusDiff;
      return b.xp - a.xp;
    });
  }, [contacts, presenceMap]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  // Étape 1 : clic « INVITER » → vérifs puis ouverture de la modale de choix de mise.
  const handleInvite = useCallback(
    (contact: SocialUser) => {
      if (!user?.id || invitingId) return;

      const state = getPresenceState(presenceMap[contact.id]);
      if (state !== 'online') return;

      if (!hasProject) {
        Alert.alert(t('game.noProjectTitleCap'), t('game.noProjectShort'));
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStakePtw(0);
      setPendingInvite(contact);
    },
    [hasProject, invitingId, presenceMap, user?.id]
  );

  // Étape 2 : la mise est choisie → création de la room + envoi de l'invitation.
  const confirmInvite = useCallback(async () => {
    const contact = pendingInvite;
    if (!user?.id || !contact || invitingId) return;

    const stakeFcfa = stakePtwToFcfa(stakePtw);
    if (stakeFcfa > 0 && !canAffordStake(profile?.startups, stakeFcfa)) {
      Alert.alert(
        t('game.insufficientBalance'),
        t('game.insufficientBalanceDesc', { balance: formatPtwRaw(stakableBalanceFcfa) })
      );
      return;
    }

    setInvitingId(contact.id);
    setPendingInvite(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await createRoom({
        edition: challenge ?? 'classic',
        maxPlayers: 2,
        hostName: user.displayName ?? 'Joueur',
        roomName: t('game.roomOf', { name: user.displayName ?? t('game.playerFallback') }),
        betAmount: stakeFcfa,
      });

      if (!result) {
        Alert.alert(t('game.invitationImpossible'), t('game.roomCreationFailed'));
        return;
      }

      try {
        await sendGameInvitation({
          fromUserId: user.id,
          fromUserName: user.displayName ?? 'Un joueur',
          toUserId: contact.id,
          roomId: result.roomId,
          roomCode: result.code,
        });
      } catch {
        Alert.alert(
          t('game.roomCreated'),
          t('game.invitationNotSent')
        );
      }

      router.replace({
        pathname: '/(game)/create-room',
        params: {
          roomId: result.roomId,
          code: result.code,
          isHost: 'true',
          ...(challenge ? { challenge } : {}),
        },
      });
    } finally {
      setInvitingId(null);
    }
  }, [challenge, createRoom, invitingId, pendingInvite, profile?.startups, router, stakableBalanceFcfa, stakePtw, user?.displayName, user?.id]);

  const renderPlayer = (contact: SocialUser, index: number) => {
    const state = getPresenceState(presenceMap[contact.id]);
    const status = STATUS_META[state];
    const isOnline = state === 'online';
    const isSending = invitingId === contact.id;
    const winRate = contact.gamesPlayed > 0
      ? Math.round((contact.gamesWon / contact.gamesPlayed) * 100)
      : 0;

    return (
      <Animated.View key={contact.id} entering={FadeInDown.delay(120 + index * 50).duration(350)}>
        <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
          <View style={styles.playerCard}>
            <Avatar source={contact.avatarUrl} name={contact.displayName} size="lg" showBorder />

            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>{contact.displayName}</Text>
              <View style={styles.statusLine}>
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {getPresenceLabel(state)}
                </Text>
              </View>
              <Text style={styles.playerMeta} numberOfLines={1}>
                {contact.rank} · {contact.xp.toLocaleString()} XP · {winRate}% victoires
              </Text>
            </View>

            <Pressable
              onPress={() => handleInvite(contact)}
              disabled={!isOnline || !!invitingId}
              style={[
                styles.inviteButton,
                !isOnline && styles.inviteButtonDisabled,
                isSending && styles.inviteButtonLoading,
              ]}
              hitSlop={6}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#0A1929" />
              ) : (
                <Text style={[styles.inviteButtonText, !isOnline && styles.inviteButtonTextDisabled]}>
                  {isOnline ? t('game.inviteCta') : state === 'in_game' ? t('game.inGame') : t('game.offline')}
                </Text>
              )}
            </Pressable>
          </View>
        </DynamicGradientBorder>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('game.availablePlayersTitle')}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 88, paddingBottom: insets.bottom + SPACING[8] },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <DynamicGradientBorder borderRadius={18} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="radio-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.summaryTextBlock}>
                <Text style={styles.summaryTitle}>{t('game.realtimeStatuses')}</Text>
                <Text style={styles.summaryText}>
                  {t('game.inviteConnectedPlayer')}
                </Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        <View style={styles.list}>
          {isLoadingSocial && sortedContacts.length === 0 ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : sortedContacts.length === 0 ? (
            <DynamicGradientBorder borderRadius={20} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={36} color="rgba(255,255,255,0.25)" />
                <Text style={styles.emptyTitle}>{t('game.noPlayersInNetwork')}</Text>
                <Text style={styles.emptyText}>
                  {t('game.followPlayersHint')}
                </Text>
              </View>
            </DynamicGradientBorder>
          ) : (
            sortedContacts.map(renderPlayer)
          )}
        </View>
      </ScrollView>

      {/* Choix de la mise avant d'inviter */}
      {pendingInvite && (
        <GamePopup
          visible
          onRequestClose={() => setPendingInvite(null)}
          header={t('game.onlineGameTitle')}
          title={t('game.invitePlayer', { name: pendingInvite.displayName })}
          footer={
            <View style={{ gap: SPACING[3] }}>
              <GameButton
                title={stakePtw > 0 ? t('game.inviteWithStake', { stake: stakePtw }) : t('game.inviteNoStake')}
                variant="yellow"
                fullWidth
                onPress={confirmInvite}
              />
              <GameButton title={t('game.cancelCta')} variant="blue" fullWidth onPress={() => setPendingInvite(null)} />
            </View>
          }
        >
          <Text style={styles.stakeModalLabel}>{t('game.stakePerPlayer')}</Text>
          <View style={styles.stakeRow}>
            {STAKE_OPTIONS_PTW.map((opt) => {
              const optFcfa = stakePtwToFcfa(opt);
              const affordable = opt === 0 || canAffordStake(profile?.startups, optFcfa);
              const disabled = opt > 0 && (isGuest || !affordable);
              const selected = stakePtw === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => !disabled && setStakePtw(opt)}
                  disabled={disabled}
                  style={[
                    styles.stakeChip,
                    selected && styles.stakeChipActive,
                    disabled && styles.stakeChipDisabled,
                  ]}
                >
                  <Text style={[styles.stakeChipText, selected && styles.stakeChipTextActive]}>
                    {opt === 0 ? t('game.stakeNone') : `${opt} Ptw`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.stakeModalHint}>
            {isGuest
              ? t('game.guestsPlayNoStake')
              : stakePtw > 0
                ? t('game.balanceAndPot', { balance: formatPtwRaw(stakableBalanceFcfa), pot: formatPtwRaw(stakePtwToFcfa(stakePtw) * 2) })
                : t('game.winnerTakesPot')}
          </Text>
        </GamePopup>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: SPACING[4],
  },
  summaryCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    padding: SPACING[4],
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,188,64,0.12)',
  },
  summaryTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  summaryText: {
    marginTop: 2,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  list: {
    gap: SPACING[3],
    marginTop: SPACING[4],
  },
  playerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    padding: SPACING[3],
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
  },
  playerMeta: {
    marginTop: 4,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  inviteButton: {
    minWidth: 84,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  inviteButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inviteButtonLoading: {
    opacity: 0.85,
  },
  inviteButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: '#0A1929',
  },
  inviteButtonTextDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },
  centerState: {
    paddingVertical: SPACING[8],
    alignItems: 'center',
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING[5],
  },
  emptyTitle: {
    marginTop: SPACING[3],
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: SPACING[2],
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modale de mise
  stakeModalLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING[3],
    textAlign: 'center',
  },
  stakeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING[2],
  },
  stakeChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stakeChipActive: {
    borderColor: '#FFBC40',
    backgroundColor: 'rgba(255,188,64,0.15)',
  },
  stakeChipDisabled: {
    opacity: 0.35,
  },
  stakeChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  stakeChipTextActive: {
    color: '#FFBC40',
  },
  stakeModalHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: SPACING[3],
  },
});
