import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { ProgramEnrollmentModal } from '@/components/programs';
import { RadialBackground } from '@/components/ui';
import { useAuthStore, useProgramStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import type { ProgramEnrollmentFormData } from '@/types/program';

/**
 * Écran 2 du flow de candidature : « Candidatez ».
 * Réutilise le formulaire ProgramEnrollmentModal (affiché en plein), soumet la
 * candidature, puis redirige vers l'écran 3 « Profil enregistré ».
 */
export default function EnrollScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ programId: string; profileId?: string; profileName?: string }>();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? '';
  const programs = useProgramStore((state) => state.programs);
  const enrollInProgram = useProgramStore((state) => state.enrollInProgram);

  const program = useMemo(
    () => programs.find((item) => item.id === params.programId),
    [programs, params.programId]
  );

  const close = () => router.back();

  const handleSubmit = (formData: ProgramEnrollmentFormData) => {
    if (!params.programId || !userId) return;
    enrollInProgram(params.programId, userId, formData, {
      profileId: params.profileId ?? null,
      profileName: params.profileName ?? null,
    });
    router.replace({
      pathname: '/(programs)/enrolled/[programId]',
      params: { programId: params.programId },
    });
  };

  return (
    <View style={styles.container}>
      <RadialBackground />
      {program && (
        <ProgramEnrollmentModal
          visible
          programName={program.name}
          defaultFullName={user?.displayName}
          defaultEmail={user?.email}
          endForm={program.endForm}
          onSubmit={handleSubmit}
          onClose={close}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
