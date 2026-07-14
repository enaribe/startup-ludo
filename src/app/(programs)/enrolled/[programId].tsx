import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameButton, OutlinedText, RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { startProgramPlay } from '@/utils/programPlayNav';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS } from '@/styles/typography';

/**
 * Écran 3 du flow de candidature : confirmation « Profil enregistré ».
 * Affiché après la soumission du formulaire de candidature en fin de parcours.
 */
export default function EnrolledScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ programId: string }>();
  const programs = useProgramStore((state) => state.programs);
  const userId = useAuthStore((state) => state.user?.id) ?? '';

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );

  const goHome = () => router.replace('/(tabs)/home');
  const replay = () => {
    if (!program) { goHome(); return; }
    startProgramPlay(router, program, userId, undefined, true);
  };

  return (
    <View style={styles.container}>
      <RadialBackground />

      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING[4] }]}>
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={COLORS.white} />
          </View>
          <OutlinedText text="PROFIL ENREGISTRÉ" style={styles.title} outlineColor="#2E7D32" outlineWidth={1.4} />
          <Text style={styles.body}>
            Votre intérêt pour le programme{program?.name ? ` ${program.name}` : ''} est bien enregistré.
            L’équipe revient vers vous très vite.
          </Text>
        </View>

        <View style={styles.actions}>
          <GameButton title="RETOUR À L'ACCUEIL" variant="yellow" fullWidth onPress={goHome} />
          <GameButton title="REJOUER" variant="blue" fullWidth onPress={replay} />
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
    gap: SPACING[4],
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: '#4CAF50',
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING[2],
  },
  actions: {
    gap: SPACING[3],
  },
});
