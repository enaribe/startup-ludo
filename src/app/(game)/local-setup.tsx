/**
 * local-game-setup - Configuration partie locale
 *
 * Étape 1: Choix mode (Solo/Tour par tour), nombre de joueurs, noms
 * Étape 2 (classique): Choix d'édition (secteur)
 * Modal: Choix de projet par joueur
 */

import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useGameStore, useAuthStore } from '@/stores';
import type { PlayerColor } from '@/types';

// Couleurs des joueurs
const PLAYER_COLORS: { color: PlayerColor; hex: string; name: string }[] = [
  { color: 'yellow', hex: '#FFBC40', name: 'Jaune' },
  { color: 'blue', hex: '#1F91D0', name: 'Bleu' },
  { color: 'green', hex: '#4CAF50', name: 'Vert' },
  { color: 'red', hex: '#FF6B6B', name: 'Rouge' },
];

// Éditions disponibles
const EDITIONS = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Tous les secteurs',
    icon: 'rocket',
    color: '#FFBC40',
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'AgriTech & Fermes',
    icon: 'leaf',
    color: '#4CAF50',
  },
  {
    id: 'education',
    name: 'Éducation',
    description: 'EdTech & Formation',
    icon: 'school',
    color: '#1F91D0',
  },
  {
    id: 'sante',
    name: 'Santé',
    description: 'HealthTech & Médical',
    icon: 'medkit',
    color: '#FF6B6B',
  },
];

// Thèmes
const THEMES = {
  classic: {
    background: ['#194F8A', '#0C243E'] as [string, string],
    accent: '#FFBC40',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
  },
  agriculture: {
    background: ['#F6E8CC', '#FBF8F0'] as [string, string],
    accent: '#AC700C',
    cardBg: '#FFFFFF',
    cardBorder: '#E8E5DF',
    text: '#8B6A3C',
    textSecondary: '#A89070',
  },
};

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
  const initGame = useGameStore((state) => state.initGame);

  const isAgriMode = challenge === 'agriculture';
  const theme = isAgriMode ? THEMES.agriculture : THEMES.classic;

  // États
  const [step, setStep] = useState(1);
  const [gameMode, setGameMode] = useState<'solo' | 'local'>('solo');
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: user?.displayName || 'Joueur 1', color: 'yellow', isAI: false },
    { name: 'IA', color: 'blue', isAI: true },
  ]);
  const [selectedEdition, setSelectedEdition] = useState(isAgriMode ? 'agriculture' : 'classic');

  // Nombre max d'étapes
  const maxSteps = isAgriMode ? 1 : 2;

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleModeChange = (mode: 'solo' | 'local') => {
    setGameMode(mode);
    if (mode === 'solo') {
      setPlayerCount(2);
      setPlayers([
        { name: user?.displayName || 'Joueur 1', color: 'yellow', isAI: false },
        { name: 'IA', color: 'blue', isAI: true },
      ]);
    } else {
      setPlayerCount(2);
      setPlayers([
        { name: user?.displayName || 'Joueur 1', color: 'yellow', isAI: false },
        { name: 'Joueur 2', color: 'blue', isAI: false },
      ]);
    }
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newPlayers: PlayerSetup[] = [];
    for (let i = 0; i < count; i++) {
      const existing = players[i];
      const colorData = PLAYER_COLORS[i]!;
      if (gameMode === 'solo') {
        newPlayers.push({
          name: i === 0 ? (user?.displayName || 'Joueur 1') : 'IA',
          color: colorData.color,
          isAI: i > 0,
        });
      } else {
        newPlayers.push({
          name: existing?.name || `Joueur ${i + 1}`,
          color: colorData.color,
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

  const handleNext = () => {
    if (step < maxSteps) {
      setStep(step + 1);
    } else {
      handleStartGame();
    }
  };

  const handleStartGame = () => {
    const gamePlayers = players.map((p, index) => ({
      id: `player_${index}`,
      name: p.name || `Joueur ${index + 1}`,
      color: p.color,
      isAI: p.isAI,
      isHost: index === 0,
      isConnected: true,
    }));

    initGame(gameMode === 'solo' ? 'solo' : 'local', selectedEdition, gamePlayers);
    router.push('/(game)/play/local');
  };

  // Couleur disponible pour un joueur
  const getAvailableColors = (currentIndex: number) => {
    const usedColors = players.filter((_, i) => i !== currentIndex).map((p) => p.color);
    return PLAYER_COLORS.filter((c) => !usedColors.includes(c.color));
  };

  const buttonText = useMemo(() => {
    if (step < maxSteps) return 'Suivant';
    return 'Démarrer la partie';
  }, [step, maxSteps]);

  return (
    <View style={{ flex: 1, backgroundColor: isAgriMode ? '#F6E8CC' : '#0C243E' }}>
      {/* Background */}
      <LinearGradient
        colors={theme.background}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Lumière animée (mode classique) */}
      {!isAgriMode && (
        <Animated.View
          entering={FadeIn.delay(200).duration(1000)}
          style={{
            position: 'absolute',
            top: -100,
            left: '50%',
            marginLeft: -150,
            width: 300,
            height: 300,
            opacity: 0.3,
          }}
        >
          <Svg width="300" height="300">
            <Defs>
              <RadialGradient id="lightGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFBC40" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFBC40" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="150" cy="150" r="150" fill="url(#lightGrad)" />
          </Svg>
        </Animated.View>
      )}

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top + SPACING[2],
          paddingBottom: SPACING[3],
          paddingHorizontal: SPACING[4],
          backgroundColor: isAgriMode ? 'rgba(246, 232, 204, 0.9)' : 'rgba(12, 36, 62, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: isAgriMode ? '#E8E5DF' : 'rgba(255, 188, 64, 0.1)',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>

        <Text
          style={{
            flex: 1,
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.xl,
            color: theme.text,
            textAlign: 'center',
          }}
        >
          {isAgriMode ? 'Challenge Agriculture' : 'Partie locale'}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* Contenu scrollable */}
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Étape 1: Configuration joueurs */}
        {step === 1 && (
          <>
            {/* Choix du mode */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: theme.text,
                  marginBottom: SPACING[3],
                }}
              >
                Mode de jeu
              </Text>

              <View style={{ flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[5] }}>
                {/* Solo */}
                <Pressable style={{ flex: 1 }} onPress={() => handleModeChange('solo')}>
                  <View
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 16,
                      padding: SPACING[4],
                      borderWidth: 2,
                      borderColor: gameMode === 'solo' ? theme.accent : theme.cardBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="game-controller"
                      size={28}
                      color={gameMode === 'solo' ? theme.accent : theme.textSecondary}
                    />
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: FONT_SIZES.sm,
                        color: gameMode === 'solo' ? theme.accent : theme.text,
                        marginTop: SPACING[2],
                      }}
                    >
                      Solo
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.xs,
                        color: theme.textSecondary,
                        textAlign: 'center',
                      }}
                    >
                      vs IA
                    </Text>
                  </View>
                </Pressable>

                {/* Tour par tour */}
                <Pressable style={{ flex: 1 }} onPress={() => handleModeChange('local')}>
                  <View
                    style={{
                      backgroundColor: theme.cardBg,
                      borderRadius: 16,
                      padding: SPACING[4],
                      borderWidth: 2,
                      borderColor: gameMode === 'local' ? theme.accent : theme.cardBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name="people"
                      size={28}
                      color={gameMode === 'local' ? theme.accent : theme.textSecondary}
                    />
                    <Text
                      style={{
                        fontFamily: FONTS.bodySemiBold,
                        fontSize: FONT_SIZES.sm,
                        color: gameMode === 'local' ? theme.accent : theme.text,
                        marginTop: SPACING[2],
                      }}
                    >
                      Tour par tour
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.xs,
                        color: theme.textSecondary,
                        textAlign: 'center',
                      }}
                    >
                      Multijoueur local
                    </Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>

            {/* Nombre de joueurs */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: theme.text,
                  marginBottom: SPACING[3],
                }}
              >
                Nombre de joueurs
              </Text>

              <View style={{ flexDirection: 'row', gap: SPACING[2], marginBottom: SPACING[5] }}>
                {[2, 3, 4].map((count) => (
                  <Pressable
                    key={count}
                    style={{ flex: 1 }}
                    onPress={() => handlePlayerCountChange(count)}
                  >
                    <View
                      style={{
                        backgroundColor: theme.cardBg,
                        borderRadius: 12,
                        paddingVertical: SPACING[3],
                        borderWidth: 2,
                        borderColor: playerCount === count ? theme.accent : theme.cardBorder,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.title,
                          fontSize: FONT_SIZES.xl,
                          color: playerCount === count ? theme.accent : theme.text,
                        }}
                      >
                        {count}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Liste des joueurs */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: theme.text,
                  marginBottom: SPACING[3],
                }}
              >
                Joueurs
              </Text>

              <View style={{ gap: SPACING[3] }}>
                {players.map((player, index) => {
                  const colorData = PLAYER_COLORS.find((c) => c.color === player.color)!;
                  return (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.delay(350 + index * 50).duration(400)}
                    >
                      <View
                        style={{
                          backgroundColor: theme.cardBg,
                          borderRadius: 16,
                          padding: SPACING[4],
                          borderWidth: 1,
                          borderColor: theme.cardBorder,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        {/* Avatar/Couleur */}
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: colorData.hex,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: SPACING[3],
                          }}
                        >
                          {player.isAI ? (
                            <Ionicons name="hardware-chip" size={24} color="#FFFFFF" />
                          ) : (
                            <Text
                              style={{
                                fontFamily: FONTS.title,
                                fontSize: FONT_SIZES.lg,
                                color: '#FFFFFF',
                              }}
                            >
                              {index + 1}
                            </Text>
                          )}
                        </View>

                        {/* Nom */}
                        <View style={{ flex: 1 }}>
                          {player.isAI ? (
                            <Text
                              style={{
                                fontFamily: FONTS.bodySemiBold,
                                fontSize: FONT_SIZES.md,
                                color: theme.text,
                              }}
                            >
                              Intelligence Artificielle
                            </Text>
                          ) : (
                            <TextInput
                              value={player.name}
                              onChangeText={(text) => handlePlayerNameChange(index, text)}
                              placeholder={`Joueur ${index + 1}`}
                              placeholderTextColor={theme.textSecondary}
                              style={{
                                fontFamily: FONTS.bodySemiBold,
                                fontSize: FONT_SIZES.md,
                                color: theme.text,
                                padding: 0,
                              }}
                            />
                          )}
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: FONT_SIZES.xs,
                              color: theme.textSecondary,
                            }}
                          >
                            {colorData.name}
                          </Text>
                        </View>

                        {/* Pastilles de couleurs */}
                        <View style={{ flexDirection: 'row', gap: SPACING[1] }}>
                          {getAvailableColors(index)
                            .slice(0, 3)
                            .map((c) => (
                              <Pressable
                                key={c.color}
                                onPress={() => {
                                  const newPlayers = [...players];
                                  if (newPlayers[index]) {
                                    newPlayers[index].color = c.color;
                                  }
                                  setPlayers(newPlayers);
                                }}
                              >
                                <View
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 12,
                                    backgroundColor: c.hex,
                                    borderWidth: 2,
                                    borderColor:
                                      player.color === c.color ? '#FFFFFF' : 'transparent',
                                  }}
                                />
                              </Pressable>
                            ))}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          </>
        )}

        {/* Étape 2: Choix d'édition (mode classique uniquement) */}
        {step === 2 && !isAgriMode && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: theme.text,
                marginBottom: SPACING[3],
              }}
            >
              Choix de l'édition
            </Text>

            <View style={{ gap: SPACING[3] }}>
              {EDITIONS.map((edition, index) => {
                const isSelected = selectedEdition === edition.id;
                return (
                  <Animated.View
                    key={edition.id}
                    entering={FadeInDown.delay(150 + index * 50).duration(400)}
                  >
                    <Pressable onPress={() => setSelectedEdition(edition.id)}>
                      <View
                        style={{
                          backgroundColor: theme.cardBg,
                          borderRadius: 16,
                          padding: SPACING[4],
                          borderWidth: 2,
                          borderColor: isSelected ? edition.color : theme.cardBorder,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        {/* Icône */}
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            backgroundColor: `${edition.color}20`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: SPACING[3],
                          }}
                        >
                          <Ionicons
                            name={edition.icon as keyof typeof Ionicons.glyphMap}
                            size={24}
                            color={edition.color}
                          />
                        </View>

                        {/* Texte */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: FONTS.bodySemiBold,
                              fontSize: FONT_SIZES.md,
                              color: isSelected ? edition.color : theme.text,
                            }}
                          >
                            {edition.name}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: FONT_SIZES.sm,
                              color: theme.textSecondary,
                            }}
                          >
                            {edition.description}
                          </Text>
                        </View>

                        {/* Badge sélectionné */}
                        {isSelected && (
                          <View
                            style={{
                              backgroundColor: edition.color,
                              paddingHorizontal: SPACING[2],
                              paddingVertical: 4,
                              borderRadius: 8,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: FONTS.bodySemiBold,
                                fontSize: 10,
                                color: '#FFFFFF',
                              }}
                            >
                              SÉLECTIONNÉ
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingTop: SPACING[3],
          backgroundColor: isAgriMode ? 'rgba(246, 232, 204, 0.95)' : 'rgba(12, 36, 62, 0.95)',
          borderTopWidth: 1,
          borderTopColor: isAgriMode ? '#E8E5DF' : 'rgba(255, 188, 64, 0.1)',
        }}
      >
        <Pressable onPress={handleNext}>
          <LinearGradient
            colors={['#FFBC40', '#F5A623']}
            style={{
              paddingVertical: SPACING[4],
              borderRadius: 16,
              alignItems: 'center',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: '#0C243E',
              }}
            >
              {buttonText}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Indicateur d'étape */}
        {maxSteps > 1 && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: SPACING[3],
              gap: SPACING[2],
            }}
          >
            {Array.from({ length: maxSteps }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: step === i + 1 ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: step === i + 1 ? theme.accent : theme.cardBorder,
                }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
