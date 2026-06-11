import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useChallengeStore } from '@/stores';
import { ALL_CHALLENGES, refreshChallengesFromFirestore } from '@/data/challenges';

export default function ChallengesLayout() {
  const setChallenges = useChallengeStore((state) => state.setChallenges);

  useEffect(() => {
    (async () => {
      await refreshChallengesFromFirestore();
      setChallenges(ALL_CHALLENGES);
    })();
  }, [setChallenges]);

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
