/**
 * PlayerProfilePopup — Fiche publique d'un joueur (XP, niveau, stats…)
 *
 * Même design que la fiche du classement : GamePopup + carte swipeable
 * à 2 pages (Synthèse / Performance) + dots de pagination.
 * Utilisé depuis l'écran Réseau (clic sur un ami) et réutilisable ailleurs.
 */

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GameButton } from '@/components/ui';
import { GamePopup, GamePopupGradientBorder } from '@/components/ui/GamePopup';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { SocialUser } from '@/services/firebase/socialService';

interface PlayerProfilePopupProps {
  user: SocialUser;
  /** Position au classement, si connue (sinon masquée). */
  rank?: number | null;
  isFollowed: boolean;
  isGuest: boolean;
  /** Masque le bouton suivre/ne plus suivre (ex: si c'est soi-même). */
  hideFollow?: boolean;
  onToggleFollow: () => void;
  onClose: () => void;
}

function LinearStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statLine}>
      <Text style={styles.statLineLabel}>{label}</Text>
      <Text style={styles.statLineValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
}

function DetailRow({
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
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={14} color="#7F8E9E" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={highlight ? styles.detailValueHighlight : styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function PlayerProfilePopup({
  user,
  rank,
  isFollowed,
  isGuest,
  hideFollow,
  onToggleFollow,
  onClose,
}: PlayerProfilePopupProps) {
  const [detailPageIndex, setDetailPageIndex] = useState(0);
  const [cardW, setCardW] = useState(0);
  const [cardH, setCardH] = useState(0);

  useEffect(() => {
    setDetailPageIndex(0);
  }, [user.id]);

  const displayName = user.displayName?.toUpperCase() || 'JOUEUR';
  const winRate = user.gamesPlayed
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
    : 0;

  const icon = user.avatarUrl ? (
    <Avatar name={displayName} size="lg" source={user.avatarUrl} />
  ) : (
    <Ionicons name="person" size={64} color={COLORS.primary} />
  );

  const pages: { title: string; content: React.ReactNode }[] = [
    {
      title: 'Synthèse',
      content: (
        <View style={styles.statsList}>
          <LinearStat label="XP" value={user.xp.toLocaleString()} />
          <View style={styles.statSep} />
          <LinearStat label="Niveau" value={`NIV. ${user.level || 1}`} />
          <View style={styles.statSep} />
          <LinearStat label="Entreprises" value={String(user.startupCount ?? 0)} />
          {rank != null && rank > 0 && (
            <>
              <View style={styles.statSep} />
              <LinearStat label="Rang" value={`#${rank}`} />
            </>
          )}
        </View>
      ),
    },
    {
      title: 'Performance',
      content: (
        <View style={styles.infoList}>
          <DetailRow icon="medal-outline" label="Ligue" value={user.rank?.trim() || '—'} />
          <DetailRow icon="game-controller" label="Parties jouées" value={String(user.gamesPlayed || 0)} />
          <DetailRow icon="trophy" label="Victoires" value={String(user.gamesWon || 0)} />
          <DetailRow icon="star" label="Taux de victoire" value={`${winRate}%`} highlight />
        </View>
      ),
    },
  ];

  return (
    <GamePopup
      visible
      onRequestClose={onClose}
      icon={icon}
      title={displayName}
      footer={
        <View style={styles.actionsColumn}>
          {!hideFollow && (
            <GameButton
              title={isFollowed ? 'NE PLUS SUIVRE' : 'SUIVRE'}
              variant={isFollowed ? 'blue' : 'yellow'}
              fullWidth
              disabled={isGuest}
              onPress={onToggleFollow}
            />
          )}
          <GameButton title="FERMER" variant="blue" fullWidth onPress={onClose} />
        </View>
      }
    >
      <View
        style={styles.detailCard}
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
            gradientId={`player_profile_border_${user.id}`}
          />
        )}
        <ScrollView
          key={`player-swipe-${user.id}`}
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
            <View key={page.title} style={[styles.detailPage, cardW > 0 && { width: cardW }]}>
              <Text style={styles.detailPageTitle}>{page.title}</Text>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                {page.content}
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, detailPageIndex === i && styles.dotActive]} />
          ))}
        </View>
      </View>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
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
  actionsColumn: {
    gap: SPACING[3],
  },
});
