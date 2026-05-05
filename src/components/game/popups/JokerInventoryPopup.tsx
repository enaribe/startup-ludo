import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { G, Path, Text as SvgText } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { JOKER_CATALOG } from '@/data/jokers';
import type { Joker } from '@/types';

import { PopupHeader } from './PopupHeader';

// ─── Icône sac à jokers (header) ─────────────────────────────────────────────
const BAG_ICON = (
  <G translateX={19} translateY={24}>
    <Path
      d="M10 2L10 8M26 2L26 8M6 8H30C32 8 33 9 33 11L33 30C33 32 32 34 30 34H6C4 34 3 32 3 30L3 11C3 9 4 8 6 8Z"
      fill="#FFFFFF"
      stroke="#0E5A8A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M13 18 L16 21 L23 14" stroke="#1F91D0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </G>
);

const LABEL = (
  <SvgText
    x="65"
    y="50"
    fill="white"
    fontSize="20"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    TES JOKERS
  </SvgText>
);

// ─── Card d'un joker (avec compteur si plusieurs du même type) ───────────────
function JokerCard({ joker, count, onUse }: { joker: Joker; count: number; onUse: () => void }) {
  const meta = JOKER_CATALOG[joker.type];
  return (
    <View style={styles.jokerCard}>
      <View style={[styles.jokerIconWrap, { backgroundColor: meta.color }]}>
        <Ionicons name={meta.iconName as never} size={22} color="#FFFFFF" />
        {count > 1 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>x{count}</Text>
          </View>
        )}
      </View>
      <View style={styles.jokerTextWrap}>
        <Text style={styles.jokerTitle} numberOfLines={1}>{meta.title}</Text>
        <Text style={styles.jokerDescription} numberOfLines={2}>{meta.description}</Text>
      </View>
      <Pressable style={styles.useButton} onPress={onUse}>
        <Text style={styles.useButtonText}>UTILISER</Text>
      </Pressable>
    </View>
  );
}

// ─── Popup ───────────────────────────────────────────────────────────────────
interface JokerInventoryPopupProps {
  visible: boolean;
  jokers: Joker[];
  onUse: (joker: Joker) => void;
  onClose: () => void;
}

export const JokerInventoryPopup = memo(function JokerInventoryPopup({
  visible,
  jokers,
  onUse,
  onClose,
}: JokerInventoryPopupProps) {
  // Regrouper les jokers par type — on affiche une seule carte par type
  // avec un badge "xN", et on consomme le premier exemplaire au clic UTILISER.
  const groupedJokers = jokers.reduce<{ joker: Joker; count: number }[]>((acc, joker) => {
    const existing = acc.find((g) => g.joker.type === joker.type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ joker, count: 1 });
    }
    return acc;
  }, []);

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <PopupHeader color="#1F91D0" icon={BAG_ICON} label={LABEL} />

        <View style={styles.body}>
          {jokers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="sparkles-outline" size={40} color="#71808E" />
              <Text style={styles.emptyTitle}>AUCUN JOKER</Text>
              <Text style={styles.emptyText}>
                Atterris sur une case joker{'\n'}pour en obtenir un !
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {groupedJokers.map(({ joker, count }) => (
                <JokerCard
                  key={joker.type}
                  joker={joker}
                  count={count}
                  onUse={() => onUse(joker)}
                />
              ))}
            </ScrollView>
          )}

          <View style={styles.buttonWrap}>
            <GameButton title="FERMER" variant="blue" fullWidth onPress={onClose} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  body: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[5],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING[6],
    gap: SPACING[2],
    marginBottom: SPACING[3],
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#1B314A',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#71808E',
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: {
    width: '100%',
    maxHeight: 360,
  },
  scrollContent: {
    gap: SPACING[3],
    paddingBottom: SPACING[4],
  },
  jokerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8FC',
    borderRadius: 12,
    paddingVertical: 13,
    paddingLeft: 13,
    paddingRight: 13,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  jokerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0C243E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontFamily: FONTS.title,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight: 12,
  },
  jokerTextWrap: {
    flex: 1,
    gap: 3,
  },
  jokerTitle: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: '#1B314A',
    letterSpacing: 0.5,
  },
  jokerDescription: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#71808E',
    lineHeight: 14,
  },
  useButton: {
    backgroundColor: '#FFBC40',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  useButtonText: {
    fontFamily: FONTS.title,
    fontSize: 11,
    color: '#0C243E',
    letterSpacing: 0.5,
  },
  buttonWrap: {
    width: '100%',
  },
});
