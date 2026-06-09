/**
 * RankProgressionPopup — Explique les rangs et l'XP requis pour chacun.
 *
 * Ouvert au clic sur la barre de progression du profil. Carrousel horizontal
 * (swipeable) : une carte par rang avec son XP minimum, sa description et son
 * état (atteint / actuel / verrouillé). Ouvre directement sur le rang actuel.
 * Design : GamePopup. Aucun emoji ni icône — typographie et couleurs seules.
 */
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GameButton } from '@/components/ui';
import { GamePopup } from '@/components/ui/GamePopup';
import {
  RANKS,
  getRankFromXP,
  getXPForNextRank,
} from '@/config/progression';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

interface RankProgressionPopupProps {
  visible: boolean;
  totalXP: number;
  onClose: () => void;
}

export function RankProgressionPopup({ visible, totalXP, onClose }: RankProgressionPopupProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [pageW, setPageW] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  const currentRank = getRankFromXP(totalXP);
  const { nextRank, xpNeeded } = getXPForNextRank(totalXP);
  const currentIndex = Math.max(0, RANKS.findIndex((r) => r.id === currentRank.id));

  // À l'ouverture / mesure : se positionner sur le rang actuel.
  useEffect(() => {
    if (!visible) return;
    setPageIndex(currentIndex);
    if (pageW > 0) {
      const id = setTimeout(() => {
        scrollRef.current?.scrollTo({ x: currentIndex * pageW, animated: false });
      }, 30);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [visible, pageW, currentIndex]);

  if (!visible) return null;

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onClose}
      header="PROGRESSION"
      title="LES RANGS"
      footer={<GameButton title="FERMER" variant="blue" fullWidth onPress={onClose} />}
    >
      <View
        style={styles.carousel}
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w > 0) setPageW((prev) => (prev === w ? prev : w));
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          style={pageW > 0 ? { width: pageW } : undefined}
          onMomentumScrollEnd={(e) => {
            const w = e.nativeEvent.layoutMeasurement.width;
            const x = e.nativeEvent.contentOffset.x;
            if (w > 0) setPageIndex(Math.round(x / w));
          }}
        >
          {RANKS.map((rank, index) => {
            const isCurrent = rank.id === currentRank.id;
            const isReached = totalXP >= rank.minXP;
            const isNext = nextRank?.id === rank.id;

            const statusLabel = isCurrent
              ? 'Rang actuel'
              : isReached
                ? 'Débloqué'
                : isNext
                  ? `Plus que ${xpNeeded.toLocaleString()} XP`
                  : 'À débloquer';
            const statusColor = isCurrent
              ? COLORS.primary
              : isReached
                ? COLORS.success
                : 'rgba(255,255,255,0.5)';

            return (
              <View key={rank.id} style={[styles.page, pageW > 0 && { width: pageW }]}>
                <Text style={styles.counter}>RANG {index + 1} / {RANKS.length}</Text>

                {/* Pastille colorée + nom du rang */}
                <View style={[styles.rankChip, { borderColor: rank.color }]}>
                  <View style={[styles.colorDot, { backgroundColor: rank.color }]} />
                  <Text style={[styles.rankTitle, { color: rank.color }]}>{rank.title}</Text>
                </View>

                {/* XP requis */}
                <Text style={styles.xpValue}>
                  {rank.minXP === 0 ? 'Rang de départ' : `${rank.minXP.toLocaleString()} XP`}
                </Text>
                {rank.minXP > 0 && <Text style={styles.xpLabel}>requis pour atteindre ce rang</Text>}

                <View style={styles.divider} />

                <Text style={styles.rankDesc}>{rank.description}</Text>

                <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Dots de pagination */}
      <View style={styles.dots}>
        {RANKS.map((r, i) => (
          <View
            key={r.id}
            style={[
              styles.dot,
              i === pageIndex && styles.dotActive,
              i === pageIndex && { backgroundColor: r.color },
            ]}
          />
        ))}
      </View>
    </GamePopup>
  );
}

const styles = StyleSheet.create({
  carousel: {
    width: '100%',
    minHeight: 230,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING[3],
    paddingTop: SPACING[1],
  },
  counter: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: SPACING[3],
  },
  rankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[4],
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rankTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  xpValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
    textAlign: 'center',
  },
  xpLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: '40%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: SPACING[4],
  },
  rankDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.5,
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
  status: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING[3],
    marginBottom: SPACING[2],
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
