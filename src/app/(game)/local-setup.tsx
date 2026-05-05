/**
 * local-game-setup - Configuration partie locale
 *
 * Étape 1: Choix mode (Solo/Tour par tour), nombre de joueurs, noms
 * Étape 2: Choix d'édition (secteur)
 * Étape 3: Phase d'idéation (choix du projet de startup)
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useGameStore, useAuthStore, useUserStore } from '@/stores';
import { EditionTileIcon } from '@/components/icons';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { StartupSelectionModal } from '@/components/game/StartupSelectionModal';
import { getDefaultProjectsForEdition, getMatchingUserStartups } from '@/data/defaultProjects';
import { getEditionList } from '@/data';
import type { PlayerColor } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 36;
// padding modePanel=12, gap modeRow=12 → chaque pill = (CONTENT_WIDTH - 24 - 12) / 2
const MODE_PILL_WIDTH = (CONTENT_WIDTH - 24 - 12) / 2;

const YELLOW_GRADIENT = [
  { offset: '0%',   color: '#FFBC40', opacity: 0.6 },
  { offset: '40%',  color: '#FFD97A', opacity: 1 },
  { offset: '100%', color: '#FFBC40', opacity: 0.6 },
];
const EDITION_TILE_GAP = 12;
const EDITION_TILE_WIDTH = (CONTENT_WIDTH - EDITION_TILE_GAP) / 2;
const IDEATION_GRID_GAP = 12;
const IDEATION_CARD_WIDTH = (CONTENT_WIDTH - IDEATION_GRID_GAP) / 2;
const IDEATION_PLAYER_PILL_W = IDEATION_CARD_WIDTH - 24;
const IDEATION_PLAYER_PILL_H = 30;

// Couleurs des joueurs (toutes)
const ALL_PLAYER_COLORS: { color: PlayerColor; hex: string; name: string }[] = [
  { color: 'yellow', hex: '#FFBC40', name: 'Jaune' },
  { color: 'blue', hex: '#1F91D0', name: 'Bleu' },
  { color: 'green', hex: '#4CAF50', name: 'Vert' },
  { color: 'red', hex: '#FF6B6B', name: 'Rouge' },
];

// Couleurs par nombre de joueurs (design: 2=vert vs bleu, 3=vert rouge bleu, 4=tous)
const COLORS_BY_PLAYER_COUNT: Record<number, PlayerColor[]> = {
  2: ['green', 'blue'],
  3: ['green', 'red', 'blue'],
  4: ['yellow', 'blue', 'green', 'red'],
};

interface StartupSelection {
  startupId: string;
  startupName: string;
  isDefaultProject: boolean;
  sector?: string;
}

/** Initiales pour l'avatar (2 caractères max) */
function getPlayerInitials(name: string): string {
  const t = name.trim();
  if (!t) return '?';
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}

/** Assombrit un hex (#RRGGBB) pour l'ombre « sticker » sous le titre */
function darkenHex(hex: string, factor: number): string {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return '#1a4d2a';
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#1a4d2a';
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * factor)));
  const h = (c: number) => c.toString(16).padStart(2, '0');
  return `#${h(f(r))}${h(f(g))}${h(f(b))}`;
}

const ideationStartupTitleStyles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  base: {
    fontFamily: FONTS.title,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.6,
    lineHeight: 22,
  },
});

/** Contour coloré épais (2px) — maquette titre projet */
const TITLE_STROKE_OFFSETS: readonly { x: number; y: number }[] = [
  { x: -2, y: -2 },
  { x: 0, y: -2 },
  { x: 2, y: -2 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
  { x: -2, y: 2 },
  { x: -2, y: 0 },
];

const TITLE_SHADOW_OFFSET = { x: 3, y: 4 };

/**
 * Nom de projet style maquette : blanc, contour vert joueur, ombre vert foncé décalée (effet sticker).
 */
const IdeationStartupTitle = memo(function IdeationStartupTitle({
  text,
  themeColor,
}: {
  text: string;
  themeColor: string;
}) {
  const baseStyle = ideationStartupTitleStyles.base;
  const displayText = text.toUpperCase();
  const shadowColor = darkenHex(themeColor, 0.42);
  return (
    <View style={ideationStartupTitleStyles.outer}>
      <Text
        style={[
          baseStyle,
          {
            color: shadowColor,
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            zIndex: 0,
            transform: [
              { translateX: TITLE_SHADOW_OFFSET.x },
              { translateY: TITLE_SHADOW_OFFSET.y },
            ],
          },
        ]}
        numberOfLines={2}
      >
        {displayText}
      </Text>
      {TITLE_STROKE_OFFSETS.map((offset, i) => (
        <Text
          key={i}
          style={[
            baseStyle,
            {
              color: themeColor,
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              zIndex: 1,
              transform: [{ translateX: offset.x }, { translateY: offset.y }],
            },
          ]}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      ))}
      <Text style={[baseStyle, { color: '#FFFFFF', zIndex: 2 }]} numberOfLines={2}>
        {displayText}
      </Text>
    </View>
  );
});

const IDEATION_AVATAR_SIZE = 48;

const ideationAvatarInitialStyles = StyleSheet.create({
  circle: {
    width: IDEATION_AVATAR_SIZE,
    height: IDEATION_AVATAR_SIZE,
    borderRadius: IDEATION_AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glyph: {
    fontFamily: FONTS.title,
    fontSize: 20,
    letterSpacing: 0.5,
    textAlign: 'center',
    includeFontPadding: false,
  },
});

/** Initiales maquette : cercle plein couleur joueur, texte bleu nuit (sans contour) */
const IdeationAvatarInitials = memo(function IdeationAvatarInitials({
  initials,
  circleColor,
}: {
  initials: string;
  circleColor: string;
}) {
  const h = IDEATION_AVATAR_SIZE;
  const glyphBox = {
    width: h,
    height: h,
    lineHeight: h,
  };
  return (
    <View style={[ideationAvatarInitialStyles.circle, { backgroundColor: circleColor }]}>
      <Text style={[ideationAvatarInitialStyles.glyph, glyphBox, { color: COLORS.background }]}>
        {initials}
      </Text>
    </View>
  );
});

interface PlayerSetup {
  name: string;
  color: PlayerColor;
  isAI: boolean;
}

export default function LocalSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const initGame = useGameStore((state) => state.initGame);

  // États
  const [step, setStep] = useState(1);
  const [gameMode, setGameMode] = useState<'solo' | 'local'>('solo');
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: user?.displayName || 'Vous', color: 'green', isAI: false },
    { name: 'IA', color: 'blue', isAI: true },
  ]);
  const [selectedEdition, setSelectedEdition] = useState('classic');

  // Step 3: Ideation
  const [startupSelections, setStartupSelections] = useState<Record<number, StartupSelection>>({});
  const [currentSelectingPlayer, setCurrentSelectingPlayer] = useState(0);
  const [showStartupModal, setShowStartupModal] = useState(false);

  const maxSteps = 3;

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleModeChange = (mode: 'solo' | 'local') => {
    setGameMode(mode);
    const colors = COLORS_BY_PLAYER_COUNT[2]!;
    if (mode === 'solo') {
      setPlayerCount(2);
      setPlayers([
        { name: user?.displayName || 'Vous', color: colors[0]!, isAI: false },
        { name: 'IA', color: colors[1]!, isAI: true },
      ]);
    } else {
      setPlayerCount(2);
      setPlayers([
        { name: user?.displayName || 'Vous', color: colors[0]!, isAI: false },
        { name: 'Joueur 2', color: colors[1]!, isAI: false },
      ]);
    }
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const colors = COLORS_BY_PLAYER_COUNT[count] ?? COLORS_BY_PLAYER_COUNT[4]!;
    const newPlayers: PlayerSetup[] = [];
    for (let i = 0; i < count; i++) {
      const existing = players[i];
      const playerColor = colors[i]!;
      if (gameMode === 'solo') {
        newPlayers.push({
          name: i === 0 ? (user?.displayName || 'Vous') : 'IA',
          color: playerColor,
          isAI: i > 0,
        });
      } else {
        newPlayers.push({
          name: existing?.name || `Joueur ${i + 1}`,
          color: playerColor,
          isAI: false,
        });
      }
    }
    setPlayers(newPlayers);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    if (newPlayers[index]) {
      newPlayers[index].name = name;
    }
    setPlayers(newPlayers);
  };

  const handleColorChange = (playerIndex: number, newColor: PlayerColor) => {
    const newPlayers = [...players];
    if (newPlayers[playerIndex]) {
      newPlayers[playerIndex].color = newColor;
    }
    setPlayers(newPlayers);
  };

  // Projets par defaut et startups du joueur 1 filtrees par edition
  const defaultProjects = useMemo(
    () => getDefaultProjectsForEdition(selectedEdition),
    [selectedEdition]
  );
  const userStartups = useMemo(
    () => getMatchingUserStartups(profile?.startups ?? [], selectedEdition),
    [profile?.startups, selectedEdition]
  );

  // Auto-select pour les IA quand on entre dans le step 3
  // On tire sans remise pour éviter que deux IA prennent la même entreprise.
  const autoSelectAI = useCallback(() => {
    const newSelections: Record<number, StartupSelection> = {};
    const takenIds = new Set<string>();
    players.forEach((player, index) => {
      if (player.isAI) {
        const pool = defaultProjects.filter((p) => !takenIds.has(p.id));
        if (pool.length === 0) return;
        const randomProject = pool[Math.floor(Math.random() * pool.length)]!;
        newSelections[index] = {
          startupId: randomProject.id,
          startupName: randomProject.name,
          isDefaultProject: true,
        };
        takenIds.add(randomProject.id);
      }
    });
    setStartupSelections(newSelections);
    // Trouver le premier joueur humain
    const firstHuman = players.findIndex((p) => !p.isAI);
    setCurrentSelectingPlayer(firstHuman >= 0 ? firstHuman : 0);
    setShowStartupModal(true);
  }, [players, defaultProjects]);

  const handleStartupSelected = (startupId: string, startupName: string, isDefault: boolean, sector: string) => {
    const updatedSelections = {
      ...startupSelections,
      [currentSelectingPlayer]: {
        startupId,
        startupName,
        isDefaultProject: isDefault,
        sector,
      } as StartupSelection,
    };
    setStartupSelections(updatedSelections);
    setShowStartupModal(false);

    // Trouver le prochain joueur humain qui n'a pas encore choisi
    // (on saute les IA ET les humains qui ont déjà une sélection — sinon
    // on rouvre le modal de sélection sur des joueurs déjà servis).
    let next = currentSelectingPlayer + 1;
    while (
      next < players.length &&
      (players[next]?.isAI || updatedSelections[next])
    ) {
      next++;
    }
    if (next < players.length) {
      setCurrentSelectingPlayer(next);
      // Petit delai pour que le modal se ferme avant de rouvrir
      setTimeout(() => setShowStartupModal(true), 350);
    }
    // Sinon tous ont choisi => le bouton "Demarrer" devient actif
  };

  const allPlayersSelected = useMemo(() => {
    return players.every((_, index) => startupSelections[index] != null);
  }, [players, startupSelections]);

  const handleNext = () => {
    if (step < maxSteps) {
      const nextStep = step + 1;
      setStep(nextStep);
      // Si on entre dans le step 3 (ideation), auto-select IA et ouvrir le modal
      if (nextStep === 3) {
        autoSelectAI();
      }
    } else {
      handleStartGame();
    }
  };

  const handleStartGame = () => {
    // userId du joueur connecte (pour l'historique)
    const currentUserId = user?.id ?? profile?.userId;

    const gamePlayers = players.map((p, index) => {
      const selection = startupSelections[index];
      // Le premier joueur humain utilise son vrai userId pour l'historique
      const playerId = index === 0 && currentUserId && !p.isAI
        ? currentUserId
        : `player_${index}`;
      return {
        id: playerId,
        name: p.name || `Joueur ${index + 1}`,
        color: p.color,
        isAI: p.isAI,
        isHost: index === 0,
        isConnected: true,
        startupId: selection?.startupId,
        startupName: selection?.startupName,
        isDefaultProject: selection?.isDefaultProject,
      };
    });

    initGame(gameMode === 'solo' ? 'solo' : 'local', selectedEdition, gamePlayers);
    router.push('/(game)/play/local');
  };

  const buttonText = useMemo(() => {
    if (step < maxSteps) return 'Suivant';
    return 'Démarrer la partie';
  }, [step, maxSteps]);

  const isNextDisabled = step === 3 && !allPlayersSelected;

  const headerTopPadding = insets.top + 10;
  const scrollPaddingTop =
    step === 2
      ? headerTopPadding + 108
      : headerTopPadding + (maxSteps > 1 ? 110 : 80);

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        {step === 2 ? (
          <>
            <View style={styles.editionHeaderTopRow}>
              <Pressable onPress={handleBack} style={styles.editionBackBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={26} color="#FFBC40" />
              </Pressable>
              <View style={styles.editionHeaderTitleWrap} pointerEvents="none">
                <Text style={styles.editionHeaderTitle}>NOUVELLE PARTIE</Text>
              </View>
              <View style={styles.editionHeaderSpacer} />
            </View>
            <View style={styles.editionStepRow}>
              <View style={styles.stepDashGroup}>
                {Array.from({ length: maxSteps }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.stepDash,
                      i < step ? styles.stepDashFilled : styles.stepDashEmpty,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.editionStepLabel}>
                Étape {step}/{maxSteps}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Pressable onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
              </Pressable>
              <Text style={styles.headerTitle}>PARTIE LOCALE</Text>
            </View>

            {maxSteps > 1 && (
              <View style={styles.stepIndicatorRow}>
                {Array.from({ length: maxSteps }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.stepDot,
                      step >= i + 1 ? styles.stepDotActive : styles.stepDotInactive,
                      step === i + 1 && styles.stepDotCurrent,
                    ]}
                  />
                ))}
                <Text style={styles.stepLabel}>
                  Étape {step}/{maxSteps}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: scrollPaddingTop, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: Player Configuration */}
        {step === 1 && (
          <>
            {/* Section: Choisis ton Mode */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Text style={styles.choixModeTitle}>Choisis ton Mode</Text>
              <DynamicGradientBorder
                borderRadius={20}
                fill="rgba(0, 0, 0, 0.35)"
                boxWidth={CONTENT_WIDTH}
                style={styles.modePanel}
              >
                <View style={styles.modeRow}>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="transparent"
                    boxWidth={MODE_PILL_WIDTH}
                    borderWidth={gameMode === 'solo' ? 1.5 : 0}
                    gradientColors={gameMode === 'solo' ? YELLOW_GRADIENT : undefined}
                    style={styles.modePillBorder}
                  >
                    <Pressable
                      style={[styles.modePill, gameMode === 'solo' && styles.modePillSelected]}
                      onPress={() => handleModeChange('solo')}
                    >
                      <View style={[styles.modePillIconBox, gameMode === 'solo' && styles.modePillIconBoxActive]}>
                        <Ionicons
                          name="game-controller"
                          size={20}
                          color={gameMode === 'solo' ? '#FFBC40' : 'rgba(255,255,255,0.5)'}
                        />
                      </View>
                      <Text style={[styles.modePillText, gameMode === 'solo' && styles.modePillTextSelected]}>
                        SOLO VS IA
                      </Text>
                    </Pressable>
                  </DynamicGradientBorder>
                  <DynamicGradientBorder
                    borderRadius={14}
                    fill="transparent"
                    boxWidth={MODE_PILL_WIDTH}
                    borderWidth={gameMode === 'local' ? 1.5 : 0}
                    gradientColors={gameMode === 'local' ? YELLOW_GRADIENT : undefined}
                    style={styles.modePillBorder}
                  >
                    <Pressable
                      style={[styles.modePill, gameMode === 'local' && styles.modePillSelected]}
                      onPress={() => handleModeChange('local')}
                    >
                      <View style={[styles.modePillIconBox, gameMode === 'local' && styles.modePillIconBoxActive]}>
                        <Ionicons
                          name="people"
                          size={20}
                          color={gameMode === 'local' ? '#FFBC40' : 'rgba(255,255,255,0.5)'}
                        />
                      </View>
                      <Text style={[styles.modePillText, gameMode === 'local' && styles.modePillTextSelected]}>
                        TOUR PAR TOUR
                      </Text>
                    </Pressable>
                  </DynamicGradientBorder>
                </View>
              </DynamicGradientBorder>
            </Animated.View>

            {/* Section: CONFIGURATION DES JOUEURS — un seul bloc (même style que Choisis ton Mode) */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.configSectionWrapper}>
              <Text style={styles.sectionTitle}>CONFIGURATION DES JOUEURS</Text>

              <DynamicGradientBorder
                borderRadius={20}
                fill="rgba(0, 0, 0, 0.35)"
                boxWidth={CONTENT_WIDTH}
                style={styles.configAndPlayersBlock}
              >
                {/* Nombre de joueurs : label + [ < ] [ N ] [ > ] */}
                <View style={styles.configPlayersContainer}>
                  <Text style={styles.nombreJoueursLabel}>Nombre de joueurs</Text>
                  <View style={styles.nombreJoueursControl}>
                    <Pressable
                      style={styles.nombreJoueursBtn}
                      onPress={() => {
                        if (playerCount > 2) handlePlayerCountChange(playerCount - 1);
                      }}
                      disabled={playerCount <= 2 || gameMode === 'solo'}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={22}
                        color={playerCount <= 2 || gameMode === 'solo' ? 'rgba(255,255,255,0.25)' : '#FFFFFF'}
                      />
                    </Pressable>
                    <View style={styles.nombreJoueursValue}>
                      <Text style={styles.nombreJoueursNumber}>{playerCount}</Text>
                    </View>
                    <Pressable
                      style={styles.nombreJoueursBtn}
                      onPress={() => {
                        if (playerCount < 4) handlePlayerCountChange(playerCount + 1);
                      }}
                      disabled={playerCount >= 4 || gameMode === 'solo'}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={playerCount >= 4 || gameMode === 'solo' ? 'rgba(255,255,255,0.25)' : '#FFFFFF'}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Player cards */}
                <View style={styles.playersList}>
                  {players.map((player, index) => (
                    <Animated.View
                      key={`player-${index}-${playerCount}`}
                      entering={FadeInDown.delay(280 + index * 80).duration(400)}
                    >
                      <DynamicGradientBorder
                        borderRadius={14}
                        fill="transparent"
                        boxWidth={CONTENT_WIDTH - 24}
                        style={styles.playerCardWrapper}
                      >
                        <View style={styles.playerCard}>
                          <View style={styles.playerAvatar}>
                            <Ionicons
                              name={player.isAI ? 'hardware-chip' : 'person'}
                              size={20}
                              color="rgba(255,255,255,0.7)"
                            />
                          </View>
                          <View style={styles.playerInfo}>
                            {player.isAI ? (
                              <Text style={styles.playerName}>IA - Bot</Text>
                            ) : (
                              <TextInput
                                value={player.name}
                                onChangeText={(text) => handlePlayerNameChange(index, text)}
                                placeholder={index === 0 ? 'Vous' : `Joueur ${index + 1}`}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                style={styles.playerNameInput}
                              />
                            )}
                            <Text style={styles.playerLevel}>
                              {player.isAI ? 'IA' : 'Joueur Humain'}
                            </Text>
                          </View>
                          <View style={styles.colorSquaresRow}>
                            {ALL_PLAYER_COLORS.map((c) => {
                              const isUsedByOther = players.some(
                                (p, i) => i !== index && p.color === c.color
                              );
                              const isSelected = player.color === c.color;
                              return (
                                <Pressable
                                  key={c.color}
                                  onPress={() => {
                                    if (!isUsedByOther) handleColorChange(index, c.color);
                                  }}
                                  hitSlop={4}
                                >
                                  <View
                                    style={[
                                      styles.colorSquare,
                                      { backgroundColor: c.hex },
                                      isSelected && styles.colorSquareSelected,
                                      isUsedByOther && !isSelected && styles.colorSquareUsed,
                                    ]}
                                  />
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      </DynamicGradientBorder>
                    </Animated.View>
                  ))}
                </View>
              </DynamicGradientBorder>
            </Animated.View>
          </>
        )}

        {/* STEP 2: Choix d'édition — grille 2 colonnes (maquette) */}
        {step === 2 && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.editionScreenTitle}>CHOIX DE L'ÉDITION</Text>
            <Text style={styles.editionScreenSubtitle}>
              Sélectionnez l'édition thématique pour votre partie
            </Text>

            <View style={styles.editionGrid}>
              {getEditionList().map((edition, index) => {
                const isSelected = selectedEdition === edition.id;
                return (
                  <Animated.View
                    key={edition.id}
                    entering={FadeInDown.delay(120 + index * 60).duration(400)}
                    style={styles.editionGridItem}
                  >
                    <Pressable
                      onPress={() => setSelectedEdition(edition.id)}
                      style={styles.editionGridItemPress}
                    >
                      <DynamicGradientBorder
                        borderRadius={16}
                        fill={
                          isSelected
                            ? 'rgba(255, 188, 64, 0.12)'
                            : 'rgba(0, 0, 0, 0.35)'
                        }
                        boxWidth={EDITION_TILE_WIDTH}
                        style={styles.editionTileGradient}
                      >
                        <View style={styles.editionTileInner}>
                          {isSelected ? (
                            <View style={styles.editionTileCheckBadge}>
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          ) : null}
                          <View style={styles.editionTileIconWrap}>
                            <EditionTileIcon
                              editionId={edition.id}
                              editionName={edition.name}
                              size={34}
                              color={isSelected ? '#FFBC40' : '#71808E'}
                            />
                          </View>
                          <Text
                            style={[styles.editionTileName, isSelected && styles.editionTileNameSelected]}
                            numberOfLines={2}
                          >
                            {edition.name.replace(/^Édition\s+/i, '')}
                          </Text>
                          <Text
                            style={[styles.editionTileDesc, isSelected && styles.editionTileDescSelected]}
                            numberOfLines={3}
                          >
                            {edition.description || 'Édition personnalisée'}
                          </Text>
                        </View>
                      </DynamicGradientBorder>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* STEP 3: Phase d'Ideation — grille avec badge VS central */}
        {step === 3 && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.sectionTitle}>PHASE D'IDÉATION</Text>
            <Text style={styles.sectionSubtitle}>
              Chaque joueur choisit un projet avec lequel jouer
            </Text>

            <View style={styles.ideationGridWrap}>
              <View
                style={[
                  styles.ideationGrid,
                  players.length === 2 && styles.ideationGridTwo,
                ]}
              >
                {players.map((player, index) => {
                  const selection = startupSelections[index];
                  const isCurrent = currentSelectingPlayer === index && !selection;
                  const themeHex =
                    ALL_PLAYER_COLORS.find((c) => c.color === player.color)?.hex ?? '#FFBC40';

                  // La carte est cliquable si :
                  // - le joueur n'est pas une IA
                  // - le joueur n'a pas encore choisi, OU il existe au moins un autre
                  //   projet libre (non pris par un autre joueur) qu'il pourrait prendre.
                  let canChange = !player.isAI;
                  if (canChange && selection) {
                    const takenByOthers = new Set(
                      Object.entries(startupSelections)
                        .filter(([k]) => Number(k) !== index)
                        .map(([, sel]) => sel.startupId),
                    );
                    const userPool = index === 0 ? userStartups : [];
                    const totalAvailable =
                      defaultProjects.filter((p) => !takenByOthers.has(p.id)).length +
                      userPool.filter((s) => !takenByOthers.has(s.id)).length;
                    // Le joueur a au moins son choix actuel + il faut au moins une alternative
                    canChange = totalAvailable > 1;
                  }

                  const openChooser = () => {
                    if (!canChange) return;
                    setCurrentSelectingPlayer(index);
                    setShowStartupModal(true);
                  };

                  return (
                    <Animated.View
                      key={`ideation-${index}`}
                      entering={FadeInDown.delay(150 + index * 80).duration(400)}
                      style={styles.ideationGridItem}
                    >
                      <Pressable
                        onPress={openChooser}
                        disabled={!canChange}
                        style={({ pressed }) => [
                          styles.ideationCardPressable,
                          canChange && pressed && styles.ideationCardPressablePressed,
                        ]}
                      >
                        <DynamicGradientBorder
                          borderRadius={24}
                          fill="rgba(22, 37, 59, 0.92)"
                          boxWidth={IDEATION_CARD_WIDTH}
                        >
                          <View style={styles.ideationCardInner}>
                            {/* Avatar centré en haut */}
                            <View style={styles.ideationAvatarCenter}>
                              {player.isAI ? (
                                <View style={[styles.ideationAvatarCircle, { backgroundColor: themeHex }]}>
                                  <Ionicons name="sparkles" size={22} color="#FFFFFF" />
                                </View>
                              ) : (
                                <IdeationAvatarInitials
                                  initials={getPlayerInitials(player.name)}
                                  circleColor={themeHex}
                                />
                              )}
                            </View>

                            {/* Badge nom du joueur (ou "IA - Bot") */}
                            <View style={styles.ideationPlayerPillCenter}>
                              <DynamicGradientBorder
                                boxWidth={IDEATION_PLAYER_PILL_W}
                                borderRadius={IDEATION_PLAYER_PILL_H / 2}
                                fill="rgba(0, 0, 0, 0.35)"
                                style={styles.ideationPlayerPillBorder}
                              >
                                <View style={styles.ideationPlayerPillInner}>
                                  <Text
                                    style={[styles.ideationPlayerPillText, { color: themeHex }]}
                                    numberOfLines={1}
                                  >
                                    {player.isAI ? 'IA - Bot' : player.name || `Joueur ${index + 1}`}
                                  </Text>
                                </View>
                              </DynamicGradientBorder>
                            </View>

                            {/* Titre entreprise */}
                            <View style={styles.ideationTitleBlock}>
                              {selection ? (
                                <IdeationStartupTitle text={selection.startupName} themeColor={themeHex} />
                              ) : isCurrent ? (
                                <Text style={styles.ideationPlaceholder}>En attente...</Text>
                              ) : (
                                <Text style={styles.ideationPlaceholder}>—</Text>
                              )}
                            </View>

                            {!player.isAI && isCurrent && !selection ? (
                              <View style={styles.ideationTapHint}>
                                <Text style={styles.ideationTapHintText}>Appuyer pour choisir</Text>
                              </View>
                            ) : null}
                          </View>
                        </DynamicGradientBorder>
                      </Pressable>
                    </Animated.View>
                  );
                })}

                {/* Cellule fantôme pour 3 joueurs (équilibre la grille 2×2) */}
                {players.length === 3 && (
                  <View style={[styles.ideationGridItem, { opacity: 0 }]}>
                    <View style={{ width: IDEATION_CARD_WIDTH, height: 1 }} />
                  </View>
                )}
              </View>

              {/* Badge VS central — positionné absolument au centre de la grille */}
              {players.length >= 2 && (
                <View pointerEvents="none" style={styles.vsBadgeWrap}>
                  <View style={styles.vsBadge}>
                    <Text style={styles.vsBadgeText}>VS</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Startup Selection Modal — on retire les entreprises déjà choisies par les autres
          joueurs (sauf celle du joueur courant si on vient de fermer le modal puis rouvrir). */}
      {(() => {
        const takenIds = new Set(
          Object.entries(startupSelections)
            .filter(([idx]) => Number(idx) !== currentSelectingPlayer)
            .map(([, sel]) => sel.startupId),
        );
        const availableDefaults = defaultProjects.filter((p) => !takenIds.has(p.id));
        const availableUserStartups =
          currentSelectingPlayer === 0
            ? userStartups.filter((s) => !takenIds.has(s.id))
            : [];
        return (
          <StartupSelectionModal
            visible={showStartupModal}
            edition={selectedEdition}
            userStartups={availableUserStartups}
            defaultProjects={availableDefaults}
            playerName={players[currentSelectingPlayer]?.name}
            onSelect={handleStartupSelected}
            onClose={() => setShowStartupModal(false)}
          />
        );
      })()}

      {/* Bouton fixe en bas (sans fond) */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title={buttonText.toUpperCase()}
          onPress={handleNext}
          disabled={isNextDisabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },

  // ── Header ──
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  stepDot: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: '#FFBC40',
  },
  stepDotInactive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDotCurrent: {
    width: 28,
  },
  stepLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 6,
  },

  // ── Header étape « choix d'édition » (maquette) ──
  editionHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  editionBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 25, 50, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editionHeaderTitleWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  editionHeaderSpacer: {
    width: 40,
    height: 40,
  },
  editionHeaderTitle: {
    fontFamily: FONTS.title,
    fontSize: 21,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  editionStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING[3],
    paddingHorizontal: 2,
  },
  stepDashGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDash: {
    height: 4,
    borderRadius: 2,
    width: 28,
  },
  stepDashFilled: {
    backgroundColor: '#FFBC40',
  },
  stepDashEmpty: {
    backgroundColor: 'rgba(10, 37, 69, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  editionStepLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  editionScreenTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: SPACING[2],
    textTransform: 'uppercase',
  },
  editionScreenSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#7F8E9E',
    marginBottom: SPACING[5],
    lineHeight: 20,
  },
  editionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  editionGridItem: {
    width: EDITION_TILE_WIDTH,
    marginBottom: EDITION_TILE_GAP,
  },
  editionGridItemPress: {
    width: '100%',
  },
  editionTileGradient: {
    width: EDITION_TILE_WIDTH,
  },
  editionTileInner: {
    position: 'relative',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[4],
    paddingTop: SPACING[5],
    minHeight: 172,
    alignItems: 'center',
  },
  editionTileCheckBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFBC40',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  editionTileIconWrap: {
    marginBottom: SPACING[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editionTileName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#7F8E9E',
    textAlign: 'center',
    marginBottom: SPACING[2],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  editionTileNameSelected: {
    color: '#FFBC40',
  },
  editionTileDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#7F8E9E',
    textAlign: 'center',
    lineHeight: 16,
  },
  editionTileDescSelected: {
    color: '#FFBC40',
  },

  // ── Content ──
  scrollContent: {
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: -6,
    marginBottom: 14,
  },

  // ── Choisis ton Mode ──
  choixModeTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  modePanel: {
    padding: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modePillBorder: {
    flex: 1,
  },
  modePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  modePillSelected: {},
  modePillIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modePillIconBoxActive: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
  },
  modePillText: {
    fontFamily: FONTS.title,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  modePillTextSelected: {
    color: '#FFBC40',
  },

  // ── CONFIGURATION DES JOUEURS (un seul bloc = même style que Choisis ton Mode) ──
  configSectionWrapper: {
    marginTop: 24,
  },
  configAndPlayersBlock: {
    padding: 12,
  },
  configPlayersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nombreJoueursLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  nombreJoueursControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nombreJoueursBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreJoueursValue: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreJoueursNumber: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: '#FFBC40',
  },

  // ── Liste des joueurs (dans le même bloc que Nombre de joueurs) ──
  playersList: {
    gap: 0,
  },
  playerCardWrapper: {
    marginBottom: 8,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  playerNameInput: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
    padding: 0,
    margin: 0,
  },
  playerLevel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  colorSquaresRow: {
    flexDirection: 'row',
    gap: 5,
  },
  colorSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  colorSquareSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
  },
  colorSquareUsed: {
    opacity: 0.35,
  },

  // ── Ideation (Step 3) — grille 2×2 avec badge VS central ──
  ideationGridWrap: {
    position: 'relative',
    marginTop: SPACING[2],
  },
  ideationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  /** 2 joueurs : layout sur 1 ligne (côte à côte) */
  ideationGridTwo: {
    flexWrap: 'nowrap',
  },
  ideationGridItem: {
    width: IDEATION_CARD_WIDTH,
    marginBottom: IDEATION_GRID_GAP,
  },
  ideationCardPressable: {
    borderRadius: 24,
  },
  ideationCardPressablePressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  ideationCardInner: {
    paddingHorizontal: SPACING[3],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[3],
    minHeight: 168,
    alignItems: 'center',
    position: 'relative',
  },
  ideationAvatarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  ideationAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideationPlayerPillCenter: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  ideationPlayerPillBorder: {
    alignSelf: 'stretch',
  },
  ideationPlayerPillInner: {
    height: IDEATION_PLAYER_PILL_H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  ideationPlayerPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  ideationTitleBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[1],
    alignSelf: 'stretch',
  },
  ideationPlaceholder: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  ideationTapHint: {
    marginTop: SPACING[1],
    alignItems: 'center',
  },

  // Badge VS central
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
  ideationTapHintText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255, 188, 64, 0.85)',
  },

  // ── Bottom Bar (bouton seul, pas de fond) ──
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
});
