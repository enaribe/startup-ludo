/**
 * ForumSetupScreen — Sélection du nombre de joueurs + saisie noms/startups
 *
 * Étape 1 : choix du nombre de joueurs (Solo / 2 / 3 / 4)
 * Étape 2..N : saisie Nom + Nom de startup pour chaque joueur (séquentiel)
 * → initGame() → push vers /(forum)/play
 */

import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialBackground } from '@/components/ui/RadialBackground';
import { GameButton } from '@/components/ui/GameButton';
import { useGameStore } from '@/stores/useGameStore';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { PlayerColor } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const logoImage = require('@/../assets/images/logostartupludo.png');

// Couleurs assignées par nombre de joueurs (même logique que local-setup)
const COLORS_BY_COUNT: Record<number, PlayerColor[]> = {
  1: ['yellow'],
  2: ['green', 'blue'],
  3: ['green', 'red', 'blue'],
  4: ['yellow', 'blue', 'green', 'red'],
};

const COLOR_HEX: Record<PlayerColor, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#FF6B6B',
};

interface PlayerDraft {
  name: string;
  startupName: string;
}

// ===== Composant : sélecteur nombre de joueurs =====
function PlayerCountSelector({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  const options = [
    { label: 'SOLO', value: 1 },
    { label: '2 JOUEURS', value: 2 },
    { label: '3 JOUEURS', value: 3 },
    { label: '4 JOUEURS', value: 4 },
  ];

  return (
    <View style={countStyles.grid}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              countStyles.cell,
              isSelected && countStyles.cellSelected,
            ]}
            activeOpacity={0.75}
          >
            <Text
              style={[
                countStyles.cellText,
                isSelected && countStyles.cellTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const countStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginVertical: SPACING[5],
  },
  cell: {
    width: (SCREEN_WIDTH - SPACING[6] * 2 - 60) / 2,
    paddingVertical: SPACING[4],
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: 'rgba(255, 188, 64, 0.18)',
    borderColor: '#FFBC40',
  },
  cellText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  cellTextSelected: {
    color: '#FFBC40',
  },
});

// ===== Composant : saisie d'un joueur =====
function PlayerForm({
  playerIndex,
  totalPlayers,
  colorHex,
  draft,
  onChange,
  onContinue,
  isLast,
}: {
  playerIndex: number;
  totalPlayers: number;
  colorHex: string;
  draft: PlayerDraft;
  onChange: (field: 'name' | 'startupName', value: string) => void;
  onContinue: () => void;
  isLast: boolean;
}) {
  const canContinue = draft.name.trim().length > 0 && draft.startupName.trim().length > 0;

  return (
    <Animated.View entering={SlideInUp.duration(300).springify().damping(28)} style={formStyles.card}>
      {/* Avatar initiales */}
      <View style={[formStyles.avatarCircle, { backgroundColor: colorHex }]}>
        <Text style={formStyles.avatarText}>
          {draft.name.trim() ? draft.name.trim()[0]!.toUpperCase() : (playerIndex + 1).toString()}
        </Text>
      </View>

      <Text style={[formStyles.title, { color: colorHex }]}>JOUEUR {playerIndex + 1}</Text>

      <Text style={formStyles.label}>Votre nom</Text>
      <TextInput
        style={formStyles.input}
        value={draft.name}
        onChangeText={(v) => onChange('name', v)}
        placeholder="Ex: Babacar Birane"
        placeholderTextColor="rgba(0,0,0,0.35)"
        autoCapitalize="words"
        returnKeyType="next"
        maxLength={30}
      />

      <Text style={formStyles.label}>Nom de votre Startup</Text>
      <TextInput
        style={formStyles.input}
        value={draft.startupName}
        onChangeText={(v) => onChange('startupName', v)}
        placeholder="Ex: Design For Citizens"
        placeholderTextColor="rgba(0,0,0,0.35)"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={canContinue ? onContinue : undefined}
        maxLength={40}
      />

      <GameButton
        title={isLast ? 'COMMENCER' : 'CONTINUER'}
        variant="yellow"
        fullWidth
        onPress={onContinue}
        disabled={!canContinue}
        style={formStyles.btn}
      />

      {totalPlayers > 1 && (
        <Text style={formStyles.progress}>
          {playerIndex + 1} / {totalPlayers}
        </Text>
      )}
    </Animated.View>
  );
}

const formStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SPACING[6],
    marginHorizontal: SPACING[5],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  avatarText: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    marginBottom: SPACING[5],
    letterSpacing: 0.5,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#4A5568',
    alignSelf: 'flex-start',
    marginBottom: SPACING[1],
    marginTop: SPACING[3],
  },
  input: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#0C243E',
  },
  btn: {
    marginTop: SPACING[5],
  },
  progress: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(0,0,0,0.35)',
    marginTop: SPACING[3],
  },
});

// ===== SCREEN PRINCIPAL =====

type Step = 'count' | 'players';

export default function ForumSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const initGame = useGameStore((s) => s.initGame);

  const [step, setStep] = useState<Step>('count');
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [drafts, setDrafts] = useState<PlayerDraft[]>([]);

  // ===== Étape 1 : valider le nombre de joueurs =====
  const handleCountConfirm = useCallback(() => {
    if (!playerCount) return;
    setDrafts(Array.from({ length: playerCount }, () => ({ name: '', startupName: '' })));
    setCurrentPlayerIndex(0);
    setStep('players');
  }, [playerCount]);

  // ===== Mise à jour d'un champ draft =====
  const handleDraftChange = useCallback((field: 'name' | 'startupName', value: string) => {
    setDrafts((prev) => {
      const next = [...prev];
      next[currentPlayerIndex] = { ...next[currentPlayerIndex]!, [field]: value };
      return next;
    });
  }, [currentPlayerIndex]);

  // ===== Confirmer un joueur et passer au suivant (ou lancer le jeu) =====
  const handlePlayerConfirm = useCallback(() => {
    if (!playerCount) return;
    const isLast = currentPlayerIndex === playerCount - 1;

    if (!isLast) {
      setCurrentPlayerIndex((i) => i + 1);
      return;
    }

    // Tous les joueurs saisis → lancer le jeu
    const colors = COLORS_BY_COUNT[playerCount]!;
    const players = drafts.map((d, i) => ({
      id: `forum-player-${i}`,
      name: d.name.trim() || `Joueur ${i + 1}`,
      color: colors[i]!,
      isAI: false,
      startupName: d.startupName.trim() || `Startup ${i + 1}`,
      startupId: `forum-startup-${i}`,
      isDefaultProject: true,
    }));

    initGame('local', 'classic', players);
    router.replace('/(forum)/play');
  }, [playerCount, currentPlayerIndex, drafts, initGame, router]);

  const colors = playerCount ? COLORS_BY_COUNT[playerCount]! : [];
  const currentColor = colors[currentPlayerIndex] ?? 'yellow';
  const currentColorHex = COLOR_HEX[currentColor];
  const currentDraft = drafts[currentPlayerIndex] ?? { name: '', startupName: '' };
  const isLast = playerCount !== null && currentPlayerIndex === playerCount - 1;

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />

      {/* Header logo */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + SPACING[3] }]}
      >
        <Image source={logoImage} style={styles.headerLogo} resizeMode="contain" />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING[8] }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ===== ÉTAPE 1 : Sélection nombre de joueurs ===== */}
          {step === 'count' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.cardCount}>
              <Text style={styles.cardTitle}>SÉLECTIONNER LE NOMBRE{'\n'}DE JOUEUR</Text>
              <PlayerCountSelector
                selected={playerCount}
                onSelect={setPlayerCount}
              />
              <GameButton
                title="COMMENCER"
                variant="yellow"
                fullWidth
                disabled={playerCount === null}
                onPress={handleCountConfirm}
              />
            </Animated.View>
          )}

          {/* ===== ÉTAPE 2..N : Saisie joueur ===== */}
          {step === 'players' && (
            <PlayerForm
              key={currentPlayerIndex}
              playerIndex={currentPlayerIndex}
              totalPlayers={playerCount!}
              colorHex={currentColorHex}
              draft={currentDraft}
              onChange={handleDraftChange}
              onContinue={handlePlayerConfirm}
              isLast={isLast}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingBottom: SPACING[2],
  },
  headerLogo: {
    width: SCREEN_WIDTH * 0.45,
    height: 60,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
  },
  cardCount: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SPACING[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#0C243E',
    textAlign: 'center',
    lineHeight: FONT_SIZES.lg * 1.35,
    letterSpacing: 0.3,
  },
});
