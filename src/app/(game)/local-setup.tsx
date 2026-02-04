/**
 * local-game-setup - Configuration partie locale
 *
 * Étape 1: Choix mode (Solo/Tour par tour), nombre de joueurs, noms
 * Étape 2 (classique): Choix d'édition (secteur)
 */

import { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { FONTS } from '@/styles/typography';
import { useGameStore, useAuthStore, useUserStore } from '@/stores';
import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { StartupSelectionModal } from '@/components/game/StartupSelectionModal';
import { getDefaultProjectsForEdition, getMatchingUserStartups } from '@/data/defaultProjects';
import type { PlayerColor } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 36;

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

// Éditions disponibles
const EDITIONS = [
  { id: 'classic', name: 'Classic', description: 'Tous les secteurs', icon: 'rocket' as const, color: '#FFBC40' },
  { id: 'agriculture', name: 'Agriculture', description: 'AgriTech & Fermes', icon: 'leaf' as const, color: '#4CAF50' },
  { id: 'education', name: 'Éducation', description: 'EdTech & Formation', icon: 'school' as const, color: '#1F91D0' },
  { id: 'sante', name: 'Santé', description: 'HealthTech & Médical', icon: 'medkit' as const, color: '#FF6B6B' },
];

interface StartupSelection {
  startupId: string;
  startupName: string;
  isDefaultProject: boolean;
}

interface PlayerSetup {
  name: string;
  color: PlayerColor;
  isAI: boolean;
}

export default function LocalSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const initGame = useGameStore((state) => state.initGame);

  const isAgriMode = challenge === 'agriculture';

  // États
  const [step, setStep] = useState(1);
  const [gameMode, setGameMode] = useState<'solo' | 'local'>('solo');
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: user?.displayName || 'Vous', color: 'green', isAI: false },
    { name: 'IA', color: 'blue', isAI: true },
  ]);
  const [selectedEdition, setSelectedEdition] = useState(isAgriMode ? 'agriculture' : 'classic');

  // Step 3: Ideation
  const [startupSelections, setStartupSelections] = useState<Record<number, StartupSelection>>({});
  const [currentSelectingPlayer, setCurrentSelectingPlayer] = useState(0);
  const [showStartupModal, setShowStartupModal] = useState(false);

  const maxSteps = isAgriMode ? 1 : 3;

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
  const autoSelectAI = useCallback(() => {
    const newSelections: Record<number, StartupSelection> = {};
    players.forEach((player, index) => {
      if (player.isAI) {
        const randomProject = defaultProjects[Math.floor(Math.random() * defaultProjects.length)];
        if (randomProject) {
          newSelections[index] = {
            startupId: randomProject.id,
            startupName: randomProject.name,
            isDefaultProject: true,
          };
        }
      }
    });
    setStartupSelections(newSelections);
    // Trouver le premier joueur humain
    const firstHuman = players.findIndex((p) => !p.isAI);
    setCurrentSelectingPlayer(firstHuman >= 0 ? firstHuman : 0);
    setShowStartupModal(true);
  }, [players, defaultProjects]);

  const handleStartupSelected = (startupId: string, startupName: string, isDefault: boolean) => {
    setStartupSelections((prev) => ({
      ...prev,
      [currentSelectingPlayer]: { startupId, startupName, isDefaultProject: isDefault },
    }));
    setShowStartupModal(false);

    // Trouver le prochain joueur humain qui n'a pas encore choisi
    let next = currentSelectingPlayer + 1;
    while (next < players.length && players[next]?.isAI) {
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
        // Reset selections si on revient sur ce step
        autoSelectAI();
      }
    } else {
      handleStartGame();
    }
  };

  const handleStartGame = () => {
    const gamePlayers = players.map((p, index) => {
      const selection = startupSelections[index];
      return {
        id: `player_${index}`,
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

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isAgriMode ? 'CHALLENGE AGRI' : 'PARTIE LOCALE'}
          </Text>
        </View>

        {/* Step indicator inside header */}
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
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTopPadding + (maxSteps > 1 ? 110 : 80), paddingBottom: insets.bottom + 120 },
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
                        fill="rgba(0, 0, 0, 0.35)"
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

        {/* STEP 2: Edition Selection (classic mode only) */}
        {step === 2 && !isAgriMode && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.sectionTitle}>CHOIX DE L'ÉDITION</Text>
            <Text style={styles.sectionSubtitle}>
              Chaque édition propose des quiz et événements thématiques
            </Text>

            <View style={styles.editionsList}>
              {EDITIONS.map((edition, index) => {
                const isSelected = selectedEdition === edition.id;
                return (
                  <Animated.View
                    key={edition.id}
                    entering={FadeInDown.delay(150 + index * 80).duration(400)}
                  >
                    <Pressable onPress={() => setSelectedEdition(edition.id)}>
                      <DynamicGradientBorder
                        borderRadius={16}
                        fill={isSelected ? 'rgba(255, 188, 64, 0.1)' : 'rgba(0, 0, 0, 0.35)'}
                        boxWidth={CONTENT_WIDTH}
                      >
                        <View style={styles.editionCard}>
                          {/* Icon */}
                          <View style={[styles.editionIcon, { backgroundColor: `${edition.color}20` }]}>
                            <Ionicons
                              name={edition.icon as keyof typeof Ionicons.glyphMap}
                              size={24}
                              color={edition.color}
                            />
                          </View>

                          {/* Text */}
                          <View style={styles.editionInfo}>
                            <Text style={[styles.editionName, isSelected && { color: edition.color }]}>
                              {edition.name}
                            </Text>
                            <Text style={styles.editionDesc}>{edition.description}</Text>
                          </View>

                          {/* Selected Indicator */}
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && { borderColor: edition.color },
                            ]}
                          >
                            {isSelected && (
                              <View style={[styles.radioInner, { backgroundColor: edition.color }]} />
                            )}
                          </View>
                        </View>
                      </DynamicGradientBorder>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* STEP 3: Phase d'Ideation */}
        {step === 3 && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.sectionTitle}>PHASE D'IDÉATION</Text>
            <Text style={styles.sectionSubtitle}>
              Chaque joueur choisit un projet avec lequel jouer
            </Text>

            <View style={styles.ideationList}>
              {players.map((player, index) => {
                const selection = startupSelections[index];
                const isCurrent = currentSelectingPlayer === index && !selection;
                const playerColor = ALL_PLAYER_COLORS.find((c) => c.color === player.color)?.hex ?? '#FFFFFF';

                return (
                  <Animated.View
                    key={`ideation-${index}`}
                    entering={FadeInDown.delay(150 + index * 80).duration(400)}
                  >
                    <DynamicGradientBorder
                      borderRadius={16}
                      fill={selection ? 'rgba(255, 188, 64, 0.08)' : 'rgba(0, 0, 0, 0.35)'}
                      boxWidth={CONTENT_WIDTH}
                    >
                      <View style={styles.ideationCard}>
                        <View style={[styles.ideationAvatar, { borderColor: playerColor }]}>
                          <Ionicons
                            name={player.isAI ? 'hardware-chip' : 'person'}
                            size={18}
                            color={playerColor}
                          />
                        </View>
                        <View style={styles.ideationInfo}>
                          <Text style={styles.ideationPlayerName}>{player.name}</Text>
                          {selection ? (
                            <Text style={styles.ideationProjectName}>{selection.startupName}</Text>
                          ) : isCurrent ? (
                            <Text style={styles.ideationWaiting}>En attente de choix...</Text>
                          ) : (
                            <Text style={styles.ideationWaiting}>—</Text>
                          )}
                        </View>
                        {selection ? (
                          <View style={styles.ideationCheck}>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                          </View>
                        ) : !player.isAI ? (
                          <Pressable
                            style={styles.ideationChooseBtn}
                            onPress={() => {
                              setCurrentSelectingPlayer(index);
                              setShowStartupModal(true);
                            }}
                          >
                            <Ionicons name="rocket-outline" size={16} color="#FFBC40" />
                            <Text style={styles.ideationChooseText}>Choisir</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </DynamicGradientBorder>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Startup Selection Modal */}
      <StartupSelectionModal
        visible={showStartupModal}
        edition={selectedEdition}
        userStartups={currentSelectingPlayer === 0 ? userStartups : []}
        defaultProjects={defaultProjects}
        playerName={players[currentSelectingPlayer]?.name}
        onSelect={handleStartupSelected}
        onClose={() => setShowStartupModal(false)}
      />

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
  modePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  modePillSelected: {
    borderColor: '#FFBC40',
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
  },
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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

  // ── Editions ──
  editionsList: {
    gap: 10,
  },
  editionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  editionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  editionInfo: {
    flex: 1,
  },
  editionName: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  editionDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ── Ideation (Step 3) ──
  ideationList: {
    gap: 10,
  },
  ideationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  ideationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ideationInfo: {
    flex: 1,
  },
  ideationPlayerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  ideationProjectName: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#FFBC40',
    marginTop: 2,
  },
  ideationWaiting: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  ideationCheck: {
    marginLeft: 8,
  },
  ideationChooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  ideationChooseText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: '#FFBC40',
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
