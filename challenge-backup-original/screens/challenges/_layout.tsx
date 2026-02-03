import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useChallengeStore } from '@/stores';
import { ALL_CHALLENGES } from '@/data/challenges';

export default function ChallengesLayout() {
  const setChallenges = useChallengeStore((state) => state.setChallenges);
  const challenges = useChallengeStore((state) => state.challenges);

  useEffect(() => {
    if (challenges.length === 0) {
      setChallenges(ALL_CHALLENGES);
    }
  }, [challenges.length, setChallenges]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0C243E' },
        animation: 'slide_from_right',
      }}
    />
  );
}
