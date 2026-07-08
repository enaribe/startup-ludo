import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicGradientBorder, GameButton, GuestGate, RadialBackground } from '@/components/ui';
import { useAuthStore, useGameStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';
import { useTranslation } from '@/i18n';
import type { PlayerColor } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - 36;
const MODE_PILL_WIDTH = (CONTENT_WIDTH - 24 - 12) / 2;

const YELLOW_GRADIENT = [
  { offset: '0%', color: '#FFBC40', opacity: 0.6 },
  { offset: '40%', color: '#FFD97A', opacity: 1 },
  { offset: '100%', color: '#FFBC40', opacity: 0.6 },
];

// Couleurs des joueurs (toutes)
const ALL_PLAYER_COLORS: { color: PlayerColor; hex: string }[] = [
  { color: 'yellow', hex: '#FFBC40' },
  { color: 'blue', hex: '#1F91D0' },
  { color: 'green', hex: '#4CAF50' },
  { color: 'red', hex: '#FF6B6B' },
];

const COLORS_BY_PLAYER_COUNT: Record<number, PlayerColor[]> = {
  2: ['green', 'blue'],
  3: ['green', 'red', 'blue'],
  4: ['yellow', 'blue', 'green', 'red'],
};

interface PlayerSetup {
  name: string;
  color: PlayerColor;
  isAI: boolean;
}

export default function ProgramModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    programId: string;
    playerName?: string;
    profileId?: string;
    profileName?: string;
  }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const isGuest = user?.isGuest ?? true;
  const programs = useProgramStore((state) => state.programs);
  const enrollments = useProgramStore((state) => state.enrollments);
  const createProgramSession = useProgramStore((state) => state.createProgramSession);
  const getProgramProgress = useProgramStore((state) => state.getProgramProgress);
  const initGame = useGameStore((state) => state.initGame);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );
  const enrollment = enrollments.find((item) => item.programId === params.programId && item.userId === userId);
  const progress = getProgramProgress(params.programId, userId);

  // Nom porté par le joueur principal = persona choisi, sinon pseudo saisi, sinon displayName.
  const mainPlayerName =
    params.profileName?.trim() ||
    params.playerName?.trim() ||
    user?.displayName ||
    t('program.you');

  const [gameMode, setGameMode] = useState<'solo' | 'local'>('solo');
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: mainPlayerName, color: 'green', isAI: false },
    { name: 'ADIA', color: 'blue', isAI: true },
  ]);

  if (isGuest) {
    return (
      <GuestGate
        featureName={t('program.featureName')}
        description={t('program.guestGenericDesc')}
      />
    );
  }

  if (!program) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('program.notFound')}</Text>
          <GameButton title={t('common.back')} variant="blue" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const levelIndex = Math.min(progress.currentLevel, Math.max(0, (program.contentPacks?.length ?? 1) - 1));
  const currentPack = program.contentPacks?.[levelIndex];

  const handleModeChange = (mode: 'solo' | 'local') => {
    setGameMode(mode);
    const colors = COLORS_BY_PLAYER_COUNT[2]!;
    setPlayerCount(2);
    if (mode === 'solo') {
      setPlayers([
        { name: mainPlayerName, color: colors[0]!, isAI: false },
        { name: 'ADIA', color: colors[1]!, isAI: true },
      ]);
    } else {
      setPlayers([
        { name: mainPlayerName, color: colors[0]!, isAI: false },
        { name: t('game.player', { number: 2 }), color: colors[1]!, isAI: false },
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
      if (i === 0) {
        newPlayers.push({ name: mainPlayerName, color: playerColor, isAI: false });
      } else if (gameMode === 'solo') {
        newPlayers.push({ name: 'ADIA', color: playerColor, isAI: true });
      } else {
        newPlayers.push({
          name: existing?.name || t('game.player', { number: i + 1 }),
          color: playerColor,
          isAI: false,
        });
      }
    }
    setPlayers(newPlayers);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const next = [...players];
    if (next[index]) next[index]!.name = name;
    setPlayers(next);
  };

  const handleColorChange = (playerIndex: number, newColor: PlayerColor) => {
    const next = [...players];
    if (next[playerIndex]) next[playerIndex]!.color = newColor;
    setPlayers(next);
  };

  const startGame = () => {
    const gameId = `program_${program.id}_${Date.now()}`;

    // Progression programme UNIQUEMENT en solo. En tour par tour → partie « pour le
    // fun » : on ne crée pas de session (pas d'avancement du parcours).
    const session = gameMode === 'solo'
      ? createProgramSession(program.id, userId, false, gameId, levelIndex)
      : null;
    if (gameMode === 'solo' && !session) return;

    const gamePlayers = players.map((p, index) => ({
      id: index === 0 ? userId : (p.isAI ? `ai_${program.id}_${index}` : `player_${index}`),
      name: p.name || (p.isAI ? 'ADIA' : t('game.player', { number: index + 1 })),
      color: p.color,
      isAI: p.isAI,
      isHost: index === 0,
      isConnected: true,
    }));

    initGame(
      gameMode === 'solo' ? 'solo' : 'local',
      'classic',
      gamePlayers,
      {
        origin: 'program',
        partnerId: program.partnerId,
        programId: program.id,
        enrollmentId: enrollment?.id ?? null,
        // Pas de session en tour par tour → pas de progression enregistrée.
        sessionId: session?.id ?? null,
        isTrial: false,
        contentPackId: currentPack?.id,
        levelIndex,
        profileId: params.profileId || null,
        profileName: params.profileName || null,
      }
    );

    router.replace({
      pathname: '/(game)/play/[gameId]',
      params: {
        gameId,
        mode: gameMode === 'solo' ? 'solo' : 'local',
        programId: program.id,
        ...(session ? { programSessionId: session.id } : {}),
      },
    });
  };

  const headerTopPadding = insets.top + 10;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe — même style que le parcours normal */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('program.gameMode')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTopPadding + 80, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section : Choisis ton Mode */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.choixModeTitle}>{t('game.chooseYourMode')}</Text>
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
                <Pressable style={styles.modePill} onPress={() => handleModeChange('solo')}>
                  <View style={[styles.modePillIconBox, gameMode === 'solo' && styles.modePillIconBoxActive]}>
                    <Ionicons name="game-controller" size={20} color={gameMode === 'solo' ? '#FFBC40' : 'rgba(255,255,255,0.5)'} />
                  </View>
                  <Text style={[styles.modePillText, gameMode === 'solo' && styles.modePillTextSelected]}>
                    {t('game.soloVsAi')}
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
                <Pressable style={styles.modePill} onPress={() => handleModeChange('local')}>
                  <View style={[styles.modePillIconBox, gameMode === 'local' && styles.modePillIconBoxActive]}>
                    <Ionicons name="people" size={20} color={gameMode === 'local' ? '#FFBC40' : 'rgba(255,255,255,0.5)'} />
                  </View>
                  <Text style={[styles.modePillText, gameMode === 'local' && styles.modePillTextSelected]}>
                    {t('game.turnByTurn')}
                  </Text>
                </Pressable>
              </DynamicGradientBorder>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Section : Configuration des joueurs */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.configSectionWrapper}>
          <Text style={styles.sectionTitle}>{t('game.playersConfig')}</Text>

          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={CONTENT_WIDTH}
            style={styles.configAndPlayersBlock}
          >
            {/* Nombre de joueurs */}
            <View style={styles.configPlayersContainer}>
              <Text style={styles.nombreJoueursLabel}>{t('game.numberOfPlayers')}</Text>
              <View style={styles.nombreJoueursControl}>
                <Pressable
                  style={styles.nombreJoueursBtn}
                  onPress={() => { if (playerCount > 2) handlePlayerCountChange(playerCount - 1); }}
                  disabled={playerCount <= 2 || gameMode === 'solo'}
                >
                  <Ionicons name="chevron-back" size={22} color={playerCount <= 2 || gameMode === 'solo' ? 'rgba(255,255,255,0.25)' : '#FFFFFF'} />
                </Pressable>
                <View style={styles.nombreJoueursValue}>
                  <Text style={styles.nombreJoueursNumber}>{playerCount}</Text>
                </View>
                <Pressable
                  style={styles.nombreJoueursBtn}
                  onPress={() => { if (playerCount < 4) handlePlayerCountChange(playerCount + 1); }}
                  disabled={playerCount >= 4 || gameMode === 'solo'}
                >
                  <Ionicons name="chevron-forward" size={22} color={playerCount >= 4 || gameMode === 'solo' ? 'rgba(255,255,255,0.25)' : '#FFFFFF'} />
                </Pressable>
              </View>
            </View>

            {/* Cartes joueurs */}
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
                        <Ionicons name={player.isAI ? 'hardware-chip' : 'person'} size={20} color="rgba(255,255,255,0.7)" />
                      </View>
                      <View style={styles.playerInfo}>
                        {player.isAI ? (
                          <Text style={styles.playerName}>{player.name}</Text>
                        ) : index === 0 ? (
                          // Joueur principal : nom = persona choisi (non éditable ici).
                          <Text style={styles.playerName}>{player.name}</Text>
                        ) : (
                          <TextInput
                            value={player.name}
                            onChangeText={(text) => handlePlayerNameChange(index, text)}
                            placeholder={t('game.player', { number: index + 1 })}
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            style={styles.playerNameInput}
                          />
                        )}
                        <Text style={styles.playerLevel}>
                          {player.isAI ? t('game.ai') : t('game.humanPlayer')}
                        </Text>
                      </View>
                      <View style={styles.colorSquaresRow}>
                        {ALL_PLAYER_COLORS.map((c) => {
                          const isUsedByOther = players.some((p, i) => i !== index && p.color === c.color);
                          const isSelected = player.color === c.color;
                          return (
                            <Pressable
                              key={c.color}
                              onPress={() => { if (!isUsedByOther) handleColorChange(index, c.color); }}
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
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title={t('game.startGame').toUpperCase()}
          onPress={startGame}
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
  scrollContent: {
    paddingHorizontal: 18,
  },
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
  configSectionWrapper: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 14,
    textTransform: 'uppercase',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[4],
  },
  errorText: {
    fontFamily: FONTS.title,
    color: COLORS.white,
    fontSize: 20,
  },
});
