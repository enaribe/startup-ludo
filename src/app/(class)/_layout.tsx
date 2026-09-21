import { Redirect, Stack } from 'expo-router';

import { CLASS_MODE_ENABLED } from '@/config/features';
import { COLORS } from '@/styles/colors';

/** Mode Classe — parcours élève : rattachement, mes classes, séances. */
export default function ClassLayout() {
  // Fonctionnalité désactivée : bloque aussi les accès directs
  // (deep link, QR scanné, écran restauré).
  if (!CLASS_MODE_ENABLED) {
    return <Redirect href="/(tabs)/home" />;
  }

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
