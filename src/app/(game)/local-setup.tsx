import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useGameStore, useAuthStore } from '@/stores';
import type { Player, PlayerColor } from '@/types';

const PLAYER_COLORS: { color: PlayerColor; name: string }[] = [
  { color: 'yellow', name: 'Jaune' },
  { color: 'blue', name: 'Bleu' },
  { color: 'green', name: 'Vert' },
  { color: 'red', name: 'Rouge' },
];

const EDITIONS = [
  { id: 'classic', name: 'Classique', description: 'Le mode standard' },
  { id: 'agriculture', name: 'Agriculture', description: 'Thème agricole' },
  { id: 'education', name: 'Éducation', description: 'Thème éducatif' },
  { id: 'sante', name: 'Santé', description: 'Thème santé' },
];

export default function LocalSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode: 'solo' | 'local' }>();
  const user = useAuthStore((state) => state.user);
  const initGame = useGameStore((state) => state.initGame);

  const isSoloMode = mode === 'solo';

  const [playerCount, setPlayerCount] = useState(isSoloMode ? 2 : 2);
  const [players, setPlayers] = useState<Partial<Player>[]>([
    { name: user?.displayName || 'Joueur 1', color: 'yellow', isAI: false },
    { name: isSoloMode ? 'IA' : 'Joueur 2', color: 'blue', isAI: isSoloMode },
  ]);
  const [selectedEdition, setSelectedEdition] = useState('classic');

  const handleBack = () => {
    router.back();
  };

  const updatePlayerCount = (count: number) => {
    setPlayerCount(count);

    const newPlayers: Partial<Player>[] = [];
    for (let i = 0; i < count; i++) {
      const existingPlayer = players[i];
      const colorOption = PLAYER_COLORS[i];
      newPlayers.push({
        name: existingPlayer?.name || `Joueur ${i + 1}`,
        color: colorOption?.color ?? 'yellow',
        isAI: isSoloMode && i > 0,
      });
    }
    setPlayers(newPlayers);
  };

  const updatePlayerName = (index: number, name: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      const player = updated[index];
      if (player) {
        player.name = name;
      }
      return updated;
    });
  };

  const handleStartGame = () => {
    // Créer les joueurs sans tokens ni pawns (gérés par initGame)
    const gamePlayers = players.map((p, index) => ({
      id: `player_${index}`,
      name: p.name || `Joueur ${index + 1}`,
      color: p.color || PLAYER_COLORS[index]?.color || 'yellow',
      isAI: p.isAI || false,
      isHost: index === 0,
      isConnected: true,
    }));

    initGame(isSoloMode ? 'solo' : 'local', selectedEdition, gamePlayers);
    router.push('/(game)/play/local');
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: SPACING[4],
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginLeft: SPACING[2],
              }}
            >
              Retour
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
            }}
          >
            {isSoloMode ? 'Partie Solo' : 'Partie Locale'}
          </Text>
        </Animated.View>

        {/* Player Count (only for local mode) */}
        {!isSoloMode && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ marginBottom: SPACING[6] }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginBottom: SPACING[3],
              }}
            >
              Nombre de joueurs
            </Text>

            <View style={{ flexDirection: 'row', gap: SPACING[3] }}>
              {[2, 3, 4].map((count) => (
                <Pressable
                  key={count}
                  onPress={() => updatePlayerCount(count)}
                  style={{ flex: 1 }}
                >
                  <Card
                    variant={playerCount === count ? 'elevated' : 'default'}
                    style={{
                      alignItems: 'center',
                      borderWidth: playerCount === count ? 2 : 0,
                      borderColor: COLORS.primary,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.title,
                        fontSize: FONT_SIZES.xl,
                        color: playerCount === count ? COLORS.primary : COLORS.text,
                      }}
                    >
                      {count}
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.xs,
                        color: COLORS.textSecondary,
                      }}
                    >
                      joueurs
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Players */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.md,
              color: COLORS.text,
              marginBottom: SPACING[3],
            }}
          >
            Joueurs
          </Text>

          <View style={{ gap: SPACING[3] }}>
            {players.map((player, index) => {
              const colorOption = PLAYER_COLORS[index];
              return (
                <Card key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: COLORS.players[player.color || colorOption?.color || 'yellow'],
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: SPACING[3],
                    }}
                  >
                    {player.isAI ? (
                      <Ionicons name="hardware-chip" size={20} color={COLORS.background} />
                    ) : (
                      <Text
                        style={{
                          fontFamily: FONTS.title,
                          fontSize: FONT_SIZES.md,
                          color: COLORS.background,
                        }}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    {player.isAI ? (
                      <Text
                        style={{
                          fontFamily: FONTS.bodySemiBold,
                          fontSize: FONT_SIZES.md,
                          color: COLORS.text,
                        }}
                      >
                        Intelligence Artificielle
                      </Text>
                    ) : (
                      <Input
                        value={player.name}
                        onChangeText={(text) => updatePlayerName(index, text)}
                        placeholder={`Joueur ${index + 1}`}
                        containerStyle={{ marginBottom: 0 }}
                      />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        </Animated.View>

        {/* Edition Selection */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.md,
              color: COLORS.text,
              marginBottom: SPACING[3],
            }}
          >
            Édition
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SPACING[3] }}
          >
            {EDITIONS.map((edition) => (
              <Pressable
                key={edition.id}
                onPress={() => setSelectedEdition(edition.id)}
              >
                <Card
                  variant={selectedEdition === edition.id ? 'elevated' : 'default'}
                  style={{
                    width: 140,
                    borderWidth: selectedEdition === edition.id ? 2 : 0,
                    borderColor: COLORS.primary,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: FONT_SIZES.base,
                      color: selectedEdition === edition.id ? COLORS.primary : COLORS.text,
                    }}
                  >
                    {edition.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.xs,
                      color: COLORS.textSecondary,
                      marginTop: SPACING[1],
                    }}
                  >
                    {edition.description}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Start Button */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Button
            title="Commencer la partie"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleStartGame}
          />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}
