/**
 * Aperçu de l’écran de jeu forum (header, PlayerCards, plateau, barre emoji + dé)
 * en arrière-plan du setup — non interactif, puis flou + voile.
 */

import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmojiReactionBar,
  type GameEmoji,
} from '@/components/game';
import { DiceChoiceButton } from '@/components/game/DiceChoiceButton';
import { GameBoard } from '@/components/game/GameBoard';
import { PlayerCard } from '@/components/game/PlayerCard';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { RadialBackground } from '@/components/ui';
import { GameEngine } from '@/services/game/GameEngine';
import { SPACING } from '@/styles/spacing';
import type { Player, PlayerColor } from '@/types';

const logoImage = require('@/../assets/images/logostartupludo.png');

const COLORS: PlayerColor[] = ['yellow', 'blue', 'red', 'green'];

function makePreviewPlayer(id: string, name: string, color: PlayerColor): Player {
  return {
    id,
    name,
    color,
    isAI: false,
    tokens: 0,
    pawns: GameEngine.createInitialPawns(),
    startupName: 'Startup',
    isDefaultProject: true,
  };
}

const PREVIEW_PLAYERS: Player[] = COLORS.map((c, i) =>
  makePreviewPlayer(`forum-setup-preview-${i}`, `Joueur ${i + 1}`, c)
);

const CURRENT_PREVIEW_ID = PREVIEW_PLAYERS[0]!.id;

export const ForumSetupBoardBackdrop = memo(function ForumSetupBoardBackdrop() {
  const insets = useSafeAreaInsets();
  const { sizes, spacing } = useResponsiveLayout();

  const handleEmojiPress = useCallback((_emoji: GameEmoji) => {
    /* décoratif */
  }, []);

  const renderPlayerCard = useCallback((color: string) => {
    const pl = PREVIEW_PLAYERS.find((p) => p.color === color);
    if (!pl) return null;
    const isTurn = pl.id === CURRENT_PREVIEW_ID;
    return (
      <PlayerCard
        player={pl}
        isCurrentTurn={isTurn}
        diceValue={null}
        isDiceRolling={false}
        isDiceDisabled
      />
    );
  }, []);

  return (
    <View style={styles.root} pointerEvents="none">
      <RadialBackground />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + sizes.header,
            paddingBottom: insets.bottom + sizes.footer,
          },
        ]}
      >
        <View style={[styles.fixedHeader, { paddingTop: insets.top + SPACING[2] }]}>
          <View style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.logoContainer}>
            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={[styles.boardWrapper, { marginHorizontal: spacing.screen }]}>
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>{renderPlayerCard('yellow')}</View>
            <View style={styles.playerSlot}>{renderPlayerCard('blue')}</View>
          </View>
          <View style={styles.boardContainer}>
            <GameBoard
              players={PREVIEW_PLAYERS}
              currentPlayerId={CURRENT_PREVIEW_ID}
              selectedPawnIndex={null}
              highlightedPositions={[]}
            />
          </View>
          <View style={styles.playersRow}>
            <View style={styles.playerSlot}>{renderPlayerCard('green')}</View>
            <View style={styles.playerSlot}>{renderPlayerCard('red')}</View>
          </View>
        </View>
      </View>

      <View style={[styles.emojiBarFooter, { paddingBottom: insets.bottom + SPACING[2] }]}>
        <View style={styles.emojiBarRow}>
          <EmojiReactionBar onEmojiPress={handleEmojiPress} />
          <DiceChoiceButton
            available
            chosenValue={null}
            canUse={false}
            onChoose={() => {}}
          />
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webBlurFallback]} />
      ) : (
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.dimOverlay} />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: '#0C243E',
  },
  content: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[2],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoContainer: { flex: 1, alignItems: 'center' },
  logoImage: { width: 100, height: 36 },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[1],
  },
  playersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[1],
    gap: SPACING[1],
  },
  playerSlot: { width: '48%' },
  boardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: SPACING[1],
  },
  emojiBarFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 36, 62, 0.9)',
    paddingTop: SPACING[2],
    paddingHorizontal: SPACING[3],
  },
  emojiBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 26, 46, 0.4)',
  },
  webBlurFallback: {
    backgroundColor: 'rgba(8, 26, 46, 0.78)',
  },
});
