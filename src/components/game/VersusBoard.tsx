/**
 * VersusBoard — Présentation « VS » des joueurs avant le démarrage d'une partie.
 *
 * Même design que la phase d'idéation locale (local-setup STEP 3) : grille 2×2
 * (2 joueurs en diagonale), badge VS doré au centre, avatar + nom + nom de projet.
 * Composant en lecture seule (pas de sélection), réutilisable en local et en ligne.
 */
import { memo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DynamicGradientBorder } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import type { PlayerColor } from '@/types';

const { width: screenWidth } = Dimensions.get('window');
const CONTENT_WIDTH = screenWidth - SPACING[4] * 2;
const GRID_GAP = 12;
const CARD_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;
const PILL_W = CARD_WIDTH - 24;
const PILL_H = 30;
const AVATAR_SIZE = 48;

const PLAYER_HEX: Record<PlayerColor, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#FF6B6B',
};

const TITLE_STROKE_OFFSETS: readonly { x: number; y: number }[] = [
  { x: -2, y: -2 }, { x: 0, y: -2 }, { x: 2, y: -2 }, { x: 2, y: 0 },
  { x: 2, y: 2 }, { x: 0, y: 2 }, { x: -2, y: 2 }, { x: -2, y: 0 },
];
const TITLE_SHADOW_OFFSET = { x: 3, y: 4 };

function getInitials(name: string): string {
  const t = (name ?? '').trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function darkenHex(hex: string, factor: number): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return '#1a4d2a';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#1a4d2a';
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * factor)));
  const h = (c: number) => c.toString(16).padStart(2, '0');
  return `#${h(f(r))}${h(f(g))}${h(f(b))}`;
}

/** Nom de projet style sticker : blanc, contour couleur joueur, ombre décalée. */
const StartupTitle = memo(function StartupTitle({ text, themeColor }: { text: string; themeColor: string }) {
  const displayText = (text || '').toUpperCase();
  const shadowColor = darkenHex(themeColor, 0.42);
  return (
    <View style={styles.titleOuter}>
      <Text
        style={[styles.titleBase, {
          color: shadowColor, position: 'absolute', left: 0, top: 0, width: '100%', zIndex: 0,
          transform: [{ translateX: TITLE_SHADOW_OFFSET.x }, { translateY: TITLE_SHADOW_OFFSET.y }],
        }]}
        numberOfLines={2}
      >
        {displayText}
      </Text>
      {TITLE_STROKE_OFFSETS.map((offset, i) => (
        <Text
          key={i}
          style={[styles.titleBase, {
            color: themeColor, position: 'absolute', left: 0, top: 0, width: '100%', zIndex: 1,
            transform: [{ translateX: offset.x }, { translateY: offset.y }],
          }]}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      ))}
      <Text style={[styles.titleBase, { color: '#FFFFFF', zIndex: 2 }]} numberOfLines={2}>
        {displayText}
      </Text>
    </View>
  );
});

export interface VersusPlayer {
  name: string;
  color: PlayerColor;
  isAI?: boolean;
  startupName?: string | null;
  avatarUrl?: string | null;
}

interface VersusBoardProps {
  players: VersusPlayer[];
}

export const VersusBoard = memo(function VersusBoard({ players }: VersusBoardProps) {
  const isTwoDiagonal = players.length === 2;

  return (
    <View style={styles.gridWrap}>
      <View style={[styles.grid, isTwoDiagonal && styles.gridTwo]}>
        {players.map((player, index) => {
          const diagonalSlot = isTwoDiagonal
            ? index === 0 ? styles.diagonalTopLeft : styles.diagonalBottomRight
            : null;
          const themeHex = PLAYER_HEX[player.color] ?? '#FFBC40';

          return (
            <Animated.View
              key={`vs-${index}`}
              entering={FadeInDown.delay(150 + index * 80).duration(400)}
              style={[styles.gridItem, diagonalSlot]}
            >
              <DynamicGradientBorder borderRadius={24} fill="rgba(22, 37, 59, 0.92)" boxWidth={CARD_WIDTH}>
                <View style={styles.cardInner}>
                  {/* Avatar */}
                  <View style={styles.avatarCenter}>
                    {player.isAI ? (
                      <View style={[styles.avatarCircle, { backgroundColor: themeHex }]}>
                        <Ionicons name="sparkles" size={22} color="#FFFFFF" />
                      </View>
                    ) : player.avatarUrl ? (
                      <Avatar name={player.name} source={player.avatarUrl} size="md" />
                    ) : (
                      <View style={[styles.avatarCircle, { backgroundColor: themeHex }]}>
                        <Text style={[styles.avatarGlyph, { color: COLORS.background }]}>
                          {getInitials(player.name)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Nom du joueur */}
                  <View style={styles.pillCenter}>
                    <DynamicGradientBorder
                      boxWidth={PILL_W}
                      borderRadius={PILL_H / 2}
                      fill="rgba(0, 0, 0, 0.35)"
                      style={styles.pillBorder}
                    >
                      <View style={styles.pillInner}>
                        <Text style={[styles.pillText, { color: themeHex }]} numberOfLines={1}>
                          {player.isAI ? 'IA - Bot' : player.name || `Joueur ${index + 1}`}
                        </Text>
                      </View>
                    </DynamicGradientBorder>
                  </View>

                  {/* Nom du projet */}
                  <View style={styles.titleBlock}>
                    {player.startupName ? (
                      <StartupTitle text={player.startupName} themeColor={themeHex} />
                    ) : (
                      <Text style={styles.placeholder}>—</Text>
                    )}
                  </View>
                </View>
              </DynamicGradientBorder>
            </Animated.View>
          );
        })}

        {players.length === 3 && (
          <View style={[styles.gridItem, { opacity: 0 }]}>
            <View style={{ width: CARD_WIDTH, height: 1 }} />
          </View>
        )}
      </View>

      {players.length >= 2 && (
        <View pointerEvents="none" style={styles.vsBadgeWrap}>
          <View style={styles.vsBadge}>
            <Text style={styles.vsBadgeText}>VS</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  gridWrap: {
    position: 'relative',
    width: CONTENT_WIDTH,
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridTwo: {
    justifyContent: 'flex-start',
  },
  diagonalTopLeft: {
    marginRight: '100%',
  },
  diagonalBottomRight: {
    marginLeft: 'auto',
  },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: GRID_GAP,
  },
  cardInner: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[3],
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  avatarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlyph: {
    fontFamily: FONTS.title,
    fontSize: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
  pillCenter: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  pillBorder: {
    alignSelf: 'stretch',
  },
  pillInner: {
    height: PILL_H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  pillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  titleBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  titleOuter: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  titleBase: {
    fontFamily: FONTS.title,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.6,
    lineHeight: 22,
  },
  placeholder: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  vsBadgeWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFBC40',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  vsBadgeText: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: '#0C243E',
    letterSpacing: 0.5,
  },
});
