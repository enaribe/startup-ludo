/**
 * MissedFinalEntryPopup — Avertissement préventif affiché quand le pion entre
 * dans la zone d'approche du couloir final (≤ FINAL_ENTRY_WARNING_DISTANCE cases)
 * sans avoir encore les jetons requis (TOKENS_TO_FINISH = 8). Donne au joueur
 * une chance d'accumuler les jetons manquants avant de devoir refaire un tour.
 *
 * Design : smiley en haut → titre d'avertissement → track de jetons horizontale
 * (rectangles colorés + pion SVG à la position actuelle + cercles vides + drapeau)
 * → liste des joueurs → bouton COMPRIS
 */

import { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { GamePopup, GamePopupGradientBorder, GAME_POPUP_WIDTH } from '@/components/ui/GamePopup';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { TOKENS_TO_FINISH } from '@/config/boardConfig';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Player } from '@/types';

// ─── Constantes layout ───────────────────────────────────────────────────────

const PAWN_ZONE_HEIGHT = 30; // espace réservé au-dessus des rectangles pour le pion
const TOKEN_HEIGHT = 10;     // hauteur des rectangles jetons
const ICON_BOTTOM_GAP = 4;   // espace entre l'icône (pion/drapeau) et le rectangle

// ─── Icône smiley triste ─────────────────────────────────────────────────────

function SadFaceIcon() {
  return (
    <Svg width={62} height={62} viewBox="0 0 62 62" fill="none">
      <Path
        d="M29.8799 2.74121C34.9029 2.74128 39.6304 4.0013 43.7646 6.22266H38.8438C36.0923 6.22266 33.8613 8.45364 33.8613 11.2051C33.8614 12.326 34.2325 13.361 34.8574 14.1934C33.8124 15.587 33.5607 17.4459 34.2402 19.0869C35.0113 20.9485 36.8287 22.1631 38.8438 22.1631H44.8193C47.5707 22.163 49.8008 19.9321 49.8008 17.1807C49.8008 16.7951 49.7569 16.4195 49.6738 16.0586C50.0366 16.1424 50.4122 16.1865 50.7949 16.1865H54.5654C57.5342 20.7764 59.2587 26.2459 59.2588 32.1201C59.2588 48.3458 46.1055 61.4998 29.8799 61.5C13.654 61.5 0.5 48.346 0.5 32.1201C0.500196 15.8944 13.6542 2.74121 29.8799 2.74121ZM29.8799 40.584C27.1284 40.584 24.8975 42.815 24.8975 45.5664C24.8975 48.3178 27.1285 50.5479 29.8799 50.5479C32.6311 50.5476 34.8613 48.3176 34.8613 45.5664C34.8613 42.8151 32.6311 40.5842 29.8799 40.584ZM25.8418 24.2061C24.7715 23.1359 23.0362 23.1361 21.9658 24.2061C20.5609 25.6109 18.2828 25.6109 16.8779 24.2061C15.8076 23.1359 14.0723 23.1361 13.002 24.2061C11.9315 25.2765 11.9315 27.0126 13.002 28.083C16.5477 31.6284 22.2962 31.6285 25.8418 28.083C26.9122 27.0126 26.9122 25.2765 25.8418 24.2061ZM46.7578 24.2061C45.6874 23.1357 43.9513 23.1357 42.8809 24.2061C41.5199 25.567 39.3399 25.6099 37.9277 24.334L37.7939 24.2061L37.585 24.0186C36.5084 23.1406 34.9205 23.2026 33.917 24.2061C32.8466 25.2765 32.8466 27.0126 33.917 28.083C37.4627 31.6287 43.2121 31.6287 46.7578 28.083C47.8281 27.0126 47.8282 25.2764 46.7578 24.2061ZM38.8438 9.46387H44.8193C45.5234 9.46391 46.1583 9.88855 46.4277 10.5391C46.697 11.1895 46.5476 11.9377 46.0498 12.4355L43.9004 14.5859L43.0459 15.4395H44.8193C45.7808 15.4395 46.5605 16.2192 46.5605 17.1807C46.5605 18.1421 45.7808 18.9218 44.8193 18.9219H38.8438C38.1396 18.9219 37.5048 18.4972 37.2354 17.8467C36.9659 17.1961 37.1144 16.4471 37.6123 15.9492L39.7627 13.7998L40.6162 12.9453H38.8438C37.8823 12.9453 37.1027 12.1665 37.1025 11.2051C37.1025 10.2436 37.8822 9.46387 38.8438 9.46387ZM50.7949 0.5H59.7588C60.4629 0.5 61.0977 0.924644 61.3672 1.5752C61.6364 2.22555 61.4878 2.97385 60.9902 3.47168L54.998 9.46387H59.7588C60.7203 9.46387 61.5 10.2436 61.5 11.2051C61.4999 12.1665 60.7202 12.9453 59.7588 12.9453H50.7949C50.0908 12.9452 49.456 12.5216 49.1865 11.8711C48.9171 11.2205 49.0665 10.4715 49.5645 9.97363L54.7021 4.83594L55.5557 3.98145H50.7949C49.8336 3.98134 49.0538 3.20254 49.0537 2.24121C49.0537 1.27977 49.8335 0.500109 50.7949 0.5Z"
        fill="#1F91D0"
        stroke="white"
      />
    </Svg>
  );
}

// ─── Icône pion (petit pion simplifié) ──────────────────────────────────────

function PawnIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={20} viewBox="0 0 14 20" fill="none">
      {/* Tête */}
      <Circle cx="7" cy="4" r="3.5" fill={color} />
      {/* Corps */}
      <Path d="M3 19 C3 13 11 13 11 19 Z" fill={color} />
      {/* Base */}
      <Rect x={2} y={17} width={10} height={2} rx={1} fill={color} />
    </Svg>
  );
}

// ─── Icône drapeau ───────────────────────────────────────────────────────────

function FlagIcon() {
  return (
    <Svg width={20} height={22} viewBox="0 0 20 22" fill="none">
      {/* Mât vertical */}
      <Rect x="2" y="0" width="2.5" height="22" rx="1.25" fill="#CCCCCC" />
      {/* Fanion triangulaire */}
      <Polygon points="4.5,1 18,6 4.5,11" fill="#F35145" />
    </Svg>
  );
}

// ─── Slot individuel d'un jeton ──────────────────────────────────────────────

const PILL_RADIUS = TOKEN_HEIGHT / 2;

function TokenSlot({
  width,
  isFilled,
  playerColor,
  isLastSlot,
  isPawnPosition,
}: {
  width: number;
  isFilled: boolean;
  playerColor: string;
  isLastSlot: boolean;
  isPawnPosition: boolean;
  index: number;
}) {
  const [h, setH] = useState(0);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.pawnZone, { width }]}>
        {isLastSlot
          ? <FlagIcon />
          : isPawnPosition && <PawnIcon color="#FFBC40" />
        }
      </View>
      <View
        style={{ width, height: TOKEN_HEIGHT }}
        onLayout={(e) => setH(e.nativeEvent.layout.height)}
      >
        {!isFilled && h > 0 && (
          <GamePopupGradientBorder
            width={width}
            height={h}
            borderRadius={PILL_RADIUS}
            gradientId={`tokenSlot_${width}_${isPawnPosition}`}
          />
        )}
        <View
          style={{
            width,
            height: TOKEN_HEIGHT,
            backgroundColor: isFilled ? playerColor : 'rgba(0,0,0,0.20)',
            borderRadius: PILL_RADIUS,
          }}
        />
      </View>
    </View>
  );
}

// ─── Track de progression des jetons ────────────────────────────────────────

function TokenTrack({
  current,
  total,
  playerColor,
}: {
  current: number;
  total: number;
  playerColor: string;
}) {
  const w = GAME_POPUP_WIDTH - SPACING[5] * 2;

  const innerPadH = SPACING[3];
  const gap = 4;
  const availableWidth = w - innerPadH * 2;
  const tokenWidth = Math.floor((availableWidth - gap * (total - 1)) / total);

  return (
    <View style={{ width: w }}>
      <View style={[styles.trackInner, { paddingHorizontal: innerPadH }]}>
        {/* Rangée principale : colonnes jetons + colonne drapeau */}
        <View style={[styles.trackRow, { gap }]}>

          {/* Colonne jetons : zone pion (haut) + rectangle (bas) */}
          <View style={[styles.tokensContainer, { gap }]}>
            {Array.from({ length: total }).map((_, i) => {
              const isFilled = i < current;
              const isLastSlot = i === total - 1;
              const isPawnPosition = current === 0 ? i === 0 : i === current - 1;

              return (
                <TokenSlot
                  key={i}
                  width={tokenWidth}
                  isFilled={isFilled}
                  playerColor={playerColor}
                  isLastSlot={isLastSlot}
                  isPawnPosition={isPawnPosition}
                  index={i}
                />
              );
            })}
          </View>


        </View>

      </View>
    </View>
  );
}

// ─── Ligne joueur ────────────────────────────────────────────────────────────

function PlayerRow({ player, isHighlighted }: { player: Player; isHighlighted: boolean }) {
  const [h, setH] = useState(0);
  const w = GAME_POPUP_WIDTH - SPACING[5] * 2;
  const playerColor = COLORS.players[player.color];

  return (
    <View style={{ width: w }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      {h > 0 && (
        <GamePopupGradientBorder width={w} height={h} borderRadius={12} gradientId={`playerRow_${player.id}`} />
      )}
      <View style={[styles.playerRowInner, isHighlighted && styles.playerRowHighlighted]}>
        <View style={[styles.playerDot, { backgroundColor: playerColor }]} />
        <Text style={styles.playerName}>{player.name}</Text>
        <Text style={[styles.playerTokens, { color: isHighlighted ? COLORS.error : COLORS.textSecondary }]}>
          {player.tokens} / {TOKENS_TO_FINISH} jetons
        </Text>
      </View>
    </View>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

interface MissedFinalEntryPopupProps {
  visible: boolean;
  onContinue: () => void;
  tokensNeeded: number;
  currentPlayer: Player | null;
  allPlayers: Player[];
}

export const MissedFinalEntryPopup = memo(function MissedFinalEntryPopup({
  visible,
  onContinue,
  tokensNeeded,
  currentPlayer,
  allPlayers,
}: MissedFinalEntryPopupProps) {
  const currentTokens = currentPlayer?.tokens ?? 0;
  const playerColor = currentPlayer ? COLORS.players[currentPlayer.color] : COLORS.primary;

  const titleText =
    tokensNeeded === 1
      ? 'ENCORE 1 JETON\nÀ COLLECTER'
      : `ENCORE ${tokensNeeded} JETONS\nÀ COLLECTER`;

  const warningText =
    tokensNeeded === 1
      ? "Sans 1 jeton supplémentaire avant l'entrée du couloir final, votre pion devra refaire un tour complet."
      : `Sans ${tokensNeeded} jetons supplémentaires avant l'entrée du couloir final, votre pion devra refaire un tour complet.`;

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onContinue}
      header="Attention"
      icon={<SadFaceIcon />}
    >
      {/* Titre avec stroke bleu */}
      <View style={styles.titleWrapper}>
        <OutlinedText
          text={titleText}
          style={styles.title}
          outlineColor="#1F91D0"
          outlineWidth={1.5}
        />
      </View>

      {/* Message d'avertissement */}
      <View style={styles.warningWrapper}>
        <Text style={styles.warningText}>{warningText}</Text>
      </View>

      {/* Track de jetons */}
      <View style={styles.trackWrapper}>
        <TokenTrack
          current={currentTokens}
          total={TOKENS_TO_FINISH}
          playerColor={playerColor}
        />
      </View>

      {/* Liste des joueurs */}
      <View style={styles.playersList}>
        {allPlayers.map((player) => (
          <PlayerRow
            key={player.id}
            player={player}
            isHighlighted={player.id === currentPlayer?.id}
          />
        ))}
      </View>

      {/* Bouton */}
      <View style={styles.buttonContainer}>
        <GameButton variant="yellow" fullWidth title="COMPRIS" onPress={onContinue} />
      </View>
    </GamePopup>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Titre
  titleWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Message d'avertissement
  warningWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[2],
  },
  warningText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Track
  trackWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  trackInner: {
    borderRadius: 12,
    paddingVertical: SPACING[3],
    gap: SPACING[2],
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tokensContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-end',
  },
  pawnZone: {
    height: PAWN_ZONE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: ICON_BOTTOM_GAP,
  },
  trackLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING[1],
  },

  // Joueurs
  playersList: {
    width: '100%',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  playerRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
    gap: SPACING[2],
  },
  playerRowHighlighted: {},
  playerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  playerName: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  playerTokens: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
  },

  // Bouton
  buttonContainer: {
    width: '100%',
  },
});
