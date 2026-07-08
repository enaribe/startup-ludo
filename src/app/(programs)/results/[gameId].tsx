import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useGameStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

/**
 * Écran de récapitulation dédié aux parties de PROGRAMME.
 * Distinct du flow générique (solo/local/online) : on y arrive après que
 * results/[gameId] a appliqué les récompenses, avec le contexte programme
 * transmis via params (fiable, sans dépendre du store volatil).
 */
export default function ProgramResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    gameId: string;
    programId: string;
    profileId?: string;
    profileName?: string;
    won?: string;
  }>();
  const userId = useAuthStore((s) => s.user?.id) ?? null;
  const programs = useProgramStore((s) => s.programs);
  const enrollments = useProgramStore((s) => s.enrollments);
  const getProgramProgress = useProgramStore((s) => s.getProgramProgress);
  const resetGame = useGameStore((s) => s.resetGame);

  const isWinner = params.won === '1';
  const program = useMemo(
    () => programs.find((p) => p.id === params.programId),
    [programs, params.programId]
  );
  const progress = getProgramProgress(params.programId, userId ?? undefined);

  // Le joueur a-t-il déjà rempli le formulaire de candidature ?
  const formFilled = useMemo(
    () => !!enrollments.find((e) => e.programId === params.programId && e.userId === userId)?.formData,
    [enrollments, params.programId, userId]
  );

  // Le formulaire est proposé à CHAQUE fin de partie (pas besoin de finir tous les
  // niveaux) — tant que le joueur ne l'a pas déjà rempli.
  const canEnroll = !formFilled;

  const goHome = () => { resetGame(); router.replace('/(tabs)/home'); };

  const replay = () => {
    resetGame();
    router.replace({
      pathname: '/(programs)/play/[programId]',
      params: { programId: params.programId },
    });
  };

  const goToEnroll = () => {
    resetGame();
    router.replace({
      pathname: '/(programs)/enroll/[programId]',
      params: {
        programId: params.programId,
        profileId: params.profileId ?? '',
        profileName: params.profileName ?? '',
      },
    });
  };

  // Message de statut selon l'avancement.
  const statusMessage = progress.isCompleted
    ? 'Parcours terminé ! Vous pouvez rejouer autant que vous voulez.'
    : isWinner
      ? `Niveau réussi ! Niveau ${Math.min(progress.currentLevel + 1, progress.totalLevels)}/${progress.totalLevels} débloqué.`
      : `Niveau non validé. Rejouez pour avancer.`;

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.content, { paddingTop: insets.top + SPACING[4], paddingBottom: insets.bottom + SPACING[4] }]}>
        <View style={styles.center}>
          <View style={[styles.badge, isWinner ? styles.badgeWin : styles.badgeLoss]}>
            <Ionicons name={isWinner ? 'trophy' : 'flag'} size={44} color={COLORS.white} />
          </View>

          <OutlinedText
            text={isWinner ? 'BRAVO !' : 'PARTIE TERMINÉE'}
            style={styles.title}
            outlineColor={isWinner ? '#2E7D32' : '#0E699C'}
            outlineWidth={1.4}
          />

          {!!params.profileName && (
            <Text style={styles.persona}>Profil incarné · {params.profileName}</Text>
          )}
          {!!program?.name && <Text style={styles.programName}>{program.name}</Text>}

          {/* Progression du parcours */}
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Ionicons name="layers-outline" size={18} color={COLORS.primary} />
              <Text style={styles.progressText}>
                Niveau {Math.min(progress.currentLevel + (progress.isCompleted ? 0 : 1), progress.totalLevels)} / {progress.totalLevels}
              </Text>
            </View>
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {canEnroll && (
            <GameButton title="REMPLIR LE FORMULAIRE" variant="yellow" fullWidth onPress={goToEnroll} />
          )}
          <GameButton title="REJOUER" variant={canEnroll ? 'blue' : 'yellow'} fullWidth onPress={replay} />
          <GameButton title="RETOUR À L'ACCUEIL" variant="blue" fullWidth onPress={goHome} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: SPACING[5],
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  badgeWin: { backgroundColor: COLORS.success },
  badgeLoss: { backgroundColor: '#1F91D0' },
  title: {
    fontFamily: FONTS.title,
    fontSize: 26,
    color: COLORS.white,
    textAlign: 'center',
  },
  persona: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
  },
  programName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressCard: {
    width: '100%',
    marginTop: SPACING[4],
    padding: SPACING[4],
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: SPACING[2],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
  },
  progressText: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.white,
  },
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: SPACING[3],
  },
});
