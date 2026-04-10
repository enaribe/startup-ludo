import { Stack } from 'expo-router';

export default function ForumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="setup" />
      <Stack.Screen name="play" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
