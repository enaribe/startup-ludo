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
      {/* Mode Selection */}
      <Stack.Screen name="mode-selection" />
      <Stack.Screen name="challenge-game" />

      {/* Local Game Flow */}
      <Stack.Screen name="local-setup" />

      {/* Online Game Flow */}
      <Stack.Screen name="online-hub" />
      <Stack.Screen name="quick-match" />
      <Stack.Screen name="create-room" />
      <Stack.Screen name="join-room" />

      {/* Game Preparation */}
      <Stack.Screen
        name="game-preparation"
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />

      {/* Game Play */}
      <Stack.Screen
        name="play/[gameId]"
        options={{
          gestureEnabled: false,
          animation: 'fade',
        }}
      />

      {/* Results */}
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
