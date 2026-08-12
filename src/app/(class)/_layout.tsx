import { Stack } from 'expo-router';
import { COLORS } from '@/styles/colors';

/** Mode Classe — parcours élève : rattachement, mes classes, séances. */
export default function ClassLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
