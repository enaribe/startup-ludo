import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@/styles/colors';
import { useChallengeStore } from '@/stores';
import { ALL_CHALLENGES } from '@/data/challenges';

export default function ChallengesLayout() {
  const setChallenges = useChallengeStore((s) => s.setChallenges);

  useEffect(() => {
    setChallenges(ALL_CHALLENGES);
  }, [setChallenges]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="challenge-hub" />
      <Stack.Screen name="my-programs" />
      <Stack.Screen name="[challengeId]" />
    </Stack>
  );
}
