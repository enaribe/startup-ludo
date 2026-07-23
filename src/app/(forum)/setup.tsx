/**
 * ForumSetupScreen — Sélection du nombre de joueurs + saisie noms/startups
 *
 * Fond : plateau Ludo (aperçu) + flou + voile (toutes les étapes).
 * Étape 1 : nombre de joueurs (Solo / 2 / 3 / 4)
 * Étape 2.. : saisie Nom + Nom de startup (séquentiel)
 * → initGame (édition Healthtech, id Firestore) → /(forum)/play
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ForumSetupBoardBackdrop } from '@/components/forum';
import { GameButton, RadialBackground } from '@/components/ui';
import { useForumScale } from '@/hooks/useForumScale';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useGameStore } from '@/stores/useGameStore';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { PlayerColor } from '@/types';

// Couleurs assignées par nombre de joueurs (même logique que local-setup)
const COLORS_BY_COUNT: Record<number, PlayerColor[]> = {
  1: ['yellow'],
  2: ['green', 'blue'],
  3: ['green', 'red', 'blue'],
  4: ['yellow', 'blue', 'green', 'red'],
};

/** Id Firestore de l'édition Healthtech (contenu quiz/duels/etc. chargé comme le jeu classique). */
const FORUM_EDITION_ID = 'healthtech' as const;

const FORM_LABEL_NAVY = '#0C243E';
const FORM_INPUT_BG = '#F3F4F6';

interface PlayerDraft {
  name: string;
  startupName: string;
}

// ===== Composant : sélecteur nombre de joueurs =====
function PlayerCountSelector({
  selected,
  onSelect,
  fs,
  sp,
  contentWidth,
}: {
  selected: number | null;
  onSelect: (n: number) => void;
  fs: (n: number) => number;
  sp: (n: number) => number;
  contentWidth: number;
}) {
  const options = [
    { label: 'SOLO', value: 1 },
    { label: '2 JOUEURS', value: 2 },
    { label: '3 JOUEURS', value: 3 },
    { label: '4 JOUEURS', value: 4 },
  ];

  const cellW = (contentWidth - sp(48) * 2 - sp(12)) / 2;

  return (
    <View style={[countStyles.grid, { gap: sp(12), marginVertical: sp(20) }]}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              countStyles.cell,
              {
                width: cellW,
                paddingVertical: sp(16),
                borderRadius: sp(14),
              },
              isSelected && countStyles.cellSelected,
            ]}
            activeOpacity={0.75}
          >
            <Text
              style={[
                countStyles.cellText,
                { fontSize: fs(FONT_SIZES.md) },
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
    justifyContent: 'center',
  },
  cell: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'rgba(12, 36, 62, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
    borderColor: '#FFBC40',
  },
  cellText: {
    fontFamily: FONTS.title,
    color: '#4A5568',
    letterSpacing: 0.5,
  },
  cellTextSelected: {
    color: '#0C243E',
  },
});

// ===== Composant : saisie d'un joueur =====
function PlayerForm({
  playerIndex,
  totalPlayers,
  draft,
  onChange,
  onContinue,
  isLast,
  fs,
  sp,
}: {
  playerIndex: number;
  totalPlayers: number;
  draft: PlayerDraft;
  onChange: (field: 'name' | 'startupName', value: string) => void;
  onContinue: () => void;
  isLast: boolean;
  fs: (n: number) => number;
  sp: (n: number) => number;
}) {
  const canContinue = draft.name.trim().length > 0 && draft.startupName.trim().length > 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[
        formStyles.card,
        { borderRadius: sp(24), padding: sp(28) },
      ]}
    >
      <Text style={[formStyles.title, { fontSize: fs(FONT_SIZES['2xl']), marginBottom: sp(20) }]}>
        JOUEUR {playerIndex + 1}
      </Text>

      <Text style={[formStyles.label, { fontSize: fs(FONT_SIZES.base), marginBottom: sp(8) }]}>
        Votre nom
      </Text>
      <TextInput
        style={[
          formStyles.input,
          {
            borderRadius: sp(12),
            paddingHorizontal: sp(16),
            paddingVertical: sp(14),
            fontSize: fs(FONT_SIZES.md),
          },
        ]}
        value={draft.name}
        onChangeText={(v) => onChange('name', v)}
        placeholder="Ex: Babacar Birane"
        placeholderTextColor="rgba(12, 36, 62, 0.35)"
        autoCapitalize="words"
        returnKeyType="next"
        maxLength={30}
      />

      <Text
        style={[
          formStyles.label,
          { fontSize: fs(FONT_SIZES.base), marginBottom: sp(8), marginTop: sp(20) },
        ]}
      >
        Nom de votre Entreprise
      </Text>
      <TextInput
        style={[
          formStyles.input,
          {
            borderRadius: sp(12),
            paddingHorizontal: sp(16),
            paddingVertical: sp(14),
            fontSize: fs(FONT_SIZES.md),
          },
        ]}
        value={draft.startupName}
        onChangeText={(v) => onChange('startupName', v)}
        placeholder="Ex: Design For Citizens"
        placeholderTextColor="rgba(12, 36, 62, 0.35)"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={canContinue ? onContinue : undefined}
        maxLength={40}
      />

      <GameButton
        title={isLast ? 'COMMENCER' : 'CONTINUER'}
        variant="yellow"
        size="lg"
        fullWidth
        onPress={onContinue}
        disabled={!canContinue}
        style={{ marginTop: sp(24) }}
      />

      {totalPlayers > 1 && (
        <Text style={[formStyles.progress, { fontSize: fs(FONT_SIZES.sm), marginTop: sp(16) }]}>
          {playerIndex + 1} / {totalPlayers}
        </Text>
      )}
    </Animated.View>
  );
}

const formStyles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontFamily: FONTS.title,
    color: '#0C243E',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    color: FORM_LABEL_NAVY,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: FORM_INPUT_BG,
    fontFamily: FONTS.bodySemiBold,
    color: FORM_LABEL_NAVY,
  },
  progress: {
    fontFamily: FONTS.body,
    color: 'rgba(12, 36, 62, 0.45)',
    textAlign: 'center',
    alignSelf: 'center',
  },
});

// ===== SCREEN PRINCIPAL =====

type Step = 'count' | 'players';

export default function ForumSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sizes } = useResponsiveLayout();
  const { fs, sp, contentWidth, hPad } = useForumScale();
  const initGame = useGameStore((s) => s.initGame);

  const [step, setStep] = useState<Step>('count');
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [drafts, setDrafts] = useState<PlayerDraft[]>([]);

  const handleCountConfirm = useCallback(() => {
    if (!playerCount) return;
    setDrafts(Array.from({ length: playerCount }, () => ({ name: '', startupName: '' })));
    setCurrentPlayerIndex(0);
    setStep('players');
  }, [playerCount]);

  /** Retour : joueur précédent → nombre de joueurs → accueil forum */
  const handleBack = useCallback(() => {
    if (step === 'players') {
      Keyboard.dismiss();
      if (currentPlayerIndex > 0) {
        setCurrentPlayerIndex((i) => i - 1);
      } else {
        setStep('count');
      }
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(forum)/welcome');
    }
  }, [step, currentPlayerIndex, router]);

  const handleDraftChange = useCallback((field: 'name' | 'startupName', value: string) => {
    setDrafts((prev) => {
      const next = [...prev];
      next[currentPlayerIndex] = { ...next[currentPlayerIndex]!, [field]: value };
      return next;
    });
  }, [currentPlayerIndex]);

  const handlePlayerConfirm = useCallback(() => {
    if (!playerCount) return;
    const isLast = currentPlayerIndex === playerCount - 1;

    if (!isLast) {
      setCurrentPlayerIndex((i) => i + 1);
      return;
    }

    if (playerCount === 1) {
      const d = drafts[0]!;
      initGame('solo', FORUM_EDITION_ID, [
        {
          id: 'forum-player-0',
          name: d.name.trim() || 'Joueur 1',
          color: 'green',
          isAI: false,
          startupName: d.startupName.trim() || 'Startup',
          startupId: 'forum-startup-0',
          isDefaultProject: true,
        },
        {
          id: 'forum-ai-1',
          name: 'IA',
          color: 'blue',
          isAI: true,
          startupName: 'Startup IA',
          startupId: 'forum-startup-ai',
          isDefaultProject: true,
        },
      ]);
      router.replace('/(forum)/play');
      return;
    }

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

    initGame('local', FORUM_EDITION_ID, players);
    router.replace('/(forum)/play');
  }, [playerCount, currentPlayerIndex, drafts, initGame, router]);

  const currentDraft = drafts[currentPlayerIndex] ?? { name: '', startupName: '' };
  const isLast = playerCount !== null && currentPlayerIndex === playerCount - 1;

  const cardCountStyle = useMemo(() => ({
    backgroundColor: '#FFFFFF' as const,
    borderRadius: sp(24),
    padding: sp(28),
    shadowColor: '#000' as const,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  }), [sp]);

  return (
    <View style={styles.container}>
      <RadialBackground centerColor="#0F3A6B" edgeColor="#081A2A" />
      <ForumSetupBoardBackdrop />

      <Pressable
        onPress={handleBack}
        style={[styles.backButtonWrap, { top: insets.top + SPACING[2], left: SPACING[4] }]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <View style={styles.backButtonInner}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </View>
      </Pressable>

      <KeyboardAvoidingView
        style={[styles.flex, styles.foregroundAboveBackdrop]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + sizes.header + SPACING[2],
              paddingBottom: insets.bottom + sp(40),
              paddingHorizontal: hPad,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'count' && (
            <Animated.View entering={FadeInDown.duration(400)} style={cardCountStyle}>
              <Text
                style={[
                  styles.cardTitle,
                  { fontSize: fs(FONT_SIZES.xl), lineHeight: fs(FONT_SIZES.xl) * 1.35 },
                ]}
              >
                SÉLECTIONNER LE NOMBRE{'\n'}DE JOUEUR
              </Text>
              <PlayerCountSelector
                selected={playerCount}
                onSelect={setPlayerCount}
                fs={fs}
                sp={sp}
                contentWidth={contentWidth}
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

          {step === 'players' && (
            <PlayerForm
              key={currentPlayerIndex}
              playerIndex={currentPlayerIndex}
              totalPlayers={playerCount!}
              draft={currentDraft}
              onChange={handleDraftChange}
              onContinue={handlePlayerConfirm}
              isLast={isLast}
              fs={fs}
              sp={sp}
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
  /** Au-dessus du fond flouté ; même zone que la flèche décorative du backdrop */
  backButtonWrap: {
    position: 'absolute',
    zIndex: 3,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
  foregroundAboveBackdrop: {
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONTS.title,
    color: '#0C243E',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
