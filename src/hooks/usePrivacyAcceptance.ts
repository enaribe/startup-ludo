import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_ACCEPTED_KEY = '@privacy_accepted';

export function usePrivacyAcceptance() {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcceptance();
  }, []);

  const loadAcceptance = async () => {
    try {
      const value = await AsyncStorage.getItem(PRIVACY_ACCEPTED_KEY);
      setAccepted(value === 'true');
    } catch (error) {
      console.error('[PrivacyAcceptance] Failed to load:', error);
      setAccepted(false);
    } finally {
      setLoading(false);
    }
  };

  const acceptPrivacy = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, 'true');
      setAccepted(true);
    } catch (error) {
      console.error('[PrivacyAcceptance] Failed to save:', error);
    }
  };

  return {
    accepted,
    loading,
    acceptPrivacy,
  };
}
