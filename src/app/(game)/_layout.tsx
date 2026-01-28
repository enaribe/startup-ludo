import { Stack } from 'expo-router';
import { COLORS } from '@/styles/colors';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="mode-selection" />
      <Stack.Screen name="local-setup" />
      <Stack.Screen name="online-setup" />
      <Stack.Screen name="lobby/[roomId]" />
      <Stack.Screen
        name="play/[gameId]"
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="results/[gameId]"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
