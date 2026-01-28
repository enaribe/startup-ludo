import { Stack } from 'expo-router';
import { COLORS } from '@/styles/colors';

export default function StartupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="inspiration-cards" />
      <Stack.Screen name="creation" />
      <Stack.Screen name="confirmation" />
    </Stack>
  );
}
