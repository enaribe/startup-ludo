import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { GameButton } from '@/components/ui/GameButton';
import { GamePopup } from '@/components/ui/GamePopup';
import { usePresenceMap } from '@/hooks/usePresence';
import { sendGameInvitation } from '@/services/firebase/gameInvitationService';
import {
  getPresenceLabel,
  getPresenceState,
  type PlayerPresenceState,
} from '@/services/firebase/presenceService';
import type { SocialUser } from '@/services/firebase/socialService';
import { useAuthStore, useSocialStore } from '@/stores';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

const STATUS_COLORS: Record<PlayerPresenceState, string> = {
  online: '#4CAF50',
  in_game: '#2196F3',
  offline: 'rgba(255,255,255,0.28)',
};

interface InviteContactModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  roomCode: string;
}

export function InviteContactModal({ visible, onClose, roomId, roomCode }: InviteContactModalProps) {
  const user = useAuthStore((state) => state.user);
  const following = useSocialStore((state) => state.following);
  const isLoading = useSocialStore((state) => state.isLoading);
  const loadFollowing = useSocialStore((state) => state.loadFollowing);
  const searchResults = useSocialStore((state) => state.searchResults);
  const isSearching = useSocialStore((state) => state.isSearching);
  const runSearch = useSocialStore((state) => state.searchUsers);
  const clearSearch = useSocialStore((state) => state.clearSearch);

  const [query, setQuery] = useState('');
  const [invitedIds, setInvitedIds] = useState<Record<string, boolean>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user?.id) {
      loadFollowing(user.id);
      setQuery('');
      setInvitedIds({});
      clearSearch();
    }
  }, [visible, user?.id, loadFollowing, clearSearch]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      const timer = setTimeout(() => runSearch(trimmed), 350);
      return () => clearTimeout(timer);
    }
    clearSearch();
    return undefined;
  }, [query, runSearch, clearSearch]);

  const list = useMemo<SocialUser[]>(
    () => (query.trim().length >= 2 ? searchResults : following),
    [query, searchResults, following]
  );
  const presenceMap = usePresenceMap(list.map((contact) => contact.id));

  const handleInvite = useCallback(
    async (contact: SocialUser) => {
      if (!user?.id || invitedIds[contact.id] || sendingId) return;
      if (getPresenceState(presenceMap[contact.id]) !== 'online') return;
      console.log('[INVITE] handleInvite — tap sur contact:', {
        contactId: contact.id,
        contactName: contact.displayName,
        roomId,
        roomCode,
      });
      if (!roomId || !roomCode) {
        console.log('[INVITE] ⚠️ roomId ou roomCode VIDE — envoi impossible', { roomId, roomCode });
      }
      setSendingId(contact.id);
      try {
        await sendGameInvitation({
          fromUserId: user.id,
          fromUserName: user.displayName ?? 'Un joueur',
          toUserId: contact.id,
          roomId,
          roomCode,
        });
        console.log('[INVITE] handleInvite — envoi terminé OK pour', contact.id);
        setInvitedIds((prev) => ({ ...prev, [contact.id]: true }));
      } catch (err) {
        console.log('[INVITE] handleInvite — échec envoi:', err);
      } finally {
        setSendingId(null);
      }
    },
    [user?.id, user?.displayName, invitedIds, sendingId, presenceMap, roomId, roomCode]
  );

  const renderItem = useCallback(
    ({ item }: { item: SocialUser }) => {
      const invited = !!invitedIds[item.id];
      const sending = sendingId === item.id;
      const presenceState = getPresenceState(presenceMap[item.id]);
      const isAvailable = presenceState === 'online';
      const statusColor = STATUS_COLORS[presenceState];
      const disabled = invited || sending || !isAvailable;
      return (
        <View style={styles.contactRow}>
          <Avatar source={item.avatarUrl} name={item.displayName} size="sm" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.displayName}
            </Text>
            <View style={styles.contactMetaRow}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.contactRank, { color: statusColor }]} numberOfLines={1}>
                {getPresenceLabel(presenceState)}
              </Text>
              <Text style={[styles.contactRank, styles.contactRankRest]} numberOfLines={1}>
                · {item.rank} · Niv. {item.level}
              </Text>
            </View>
          </View>
          <Pressable
            style={[
              styles.inviteBtn,
              invited && styles.inviteBtnDone,
              !isAvailable && styles.inviteBtnDisabled,
            ]}
            onPress={() => handleInvite(item)}
            disabled={disabled}
            hitSlop={6}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#0A1929" />
            ) : invited ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : (
              <Text style={[styles.inviteBtnText, !isAvailable && styles.inviteBtnTextDisabled]}>
                {isAvailable ? 'INVITER' : presenceState === 'in_game' ? 'EN PARTIE' : 'HORS LIGNE'}
              </Text>
            )}
          </Pressable>
        </View>
      );
    },
    [invitedIds, sendingId, presenceMap, handleInvite]
  );

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onClose}
      header="Multijoueur en ligne"
      icon={<Ionicons name="people" size={56} color="#FFBC40" />}
      title="INVITER UN CONTACT"
      footer={
        <GameButton variant="blue" fullWidth title="Fermer" onPress={onClose} />
      }
    >
      <View style={styles.body}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur"
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>

        {isLoading || isSearching ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#FFBC40" />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="people-outline" size={36} color="rgba(255,255,255,0.25)" />
            <Text style={styles.emptyText}>
              {query.trim().length >= 2
                ? 'Aucun joueur trouvé'
                : "Tu ne suis encore aucun joueur.\nRecherche un joueur pour l'inviter."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  body: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING[3],
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    padding: 0,
  },
  list: {
    maxHeight: 280,
  },
  centerState: {
    paddingVertical: SPACING[5],
    alignItems: 'center',
    gap: SPACING[2],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
  },
  contactRank: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.45)',
  },
  contactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    minWidth: 0,
  },
  contactRankRest: {
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  inviteBtn: {
    minWidth: 76,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFBC40',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inviteBtnDone: {
    backgroundColor: '#2E7D5B',
  },
  inviteBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inviteBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: '#0A1929',
    letterSpacing: 0.5,
  },
  inviteBtnTextDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
