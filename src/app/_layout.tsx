import {
    LuckiestGuy_400Regular,
    useFonts,
} from '@expo-google-fonts/luckiest-guy';
import {
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, View, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../global.css';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { GameInvitationPopup } from '@/components/game/GameInvitationPopup';
import { COLORS } from '@/styles/colors';
import { useAuthStore } from '@/stores/useAuthStore';
import { useInvitationStore } from '@/stores/useInvitationStore';
import { refreshEditionsFromFirestore } from '@/data';
import { refreshDefaultProjectsFromFirestore } from '@/data/defaultProjects';
import { clearCache } from '@/services/firebase/cacheHelper';
import {
  setPresenceAppActive,
  startPresenceSession,
  stopPresenceSession,
} from '@/services/firebase/presenceService';
import { refreshIdeationFromFirestore } from '@/constants/ideation';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { resetGuestBannerDismissOnAppStart } from '@/hooks/useGuestBannerDismiss';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

/**
 * Démarre/arrête le listener d'invitations de partie selon l'état d'authentification.
 * Les invités (compte anonyme) n'écoutent pas — ils ne peuvent pas recevoir d'invitations.
 */
function InvitationListenerGate() {
  const user = useAuthStore((state) => state.user);
  const startListening = useInvitationStore((state) => state.startListening);
  const stopListening = useInvitationStore((state) => state.stopListening);

  useEffect(() => {
    console.log('[INVITE] Gate — état user:', {
      hasUser: !!user,
      userId: user?.id,
      isGuest: user?.isGuest,
    });
    if (user && !user.isGuest) {
      console.log('[INVITE] Gate — démarrage du listener (compte réel)');
      startListening(user.id);
      return () => stopListening();
    }
    console.log('[INVITE] Gate — listener NON démarré (pas de user ou invité)');
    stopListening();
    return undefined;
  }, [user, startListening, stopListening]);

  return null;
}

/**
 * Publie le statut public du joueur connecté.
 * Les invités ne sont pas exposés dans la liste des joueurs disponibles.
 */
function PresenceGate() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const isGuest = user?.isGuest ?? true;

  useEffect(() => {
    if (userId && !isGuest) {
      startPresenceSession(userId).catch((error) => {
        console.log('[Presence] démarrage impossible:', error);
      });
      return () => {
        stopPresenceSession(userId).catch(() => {});
      };
    }

    stopPresenceSession().catch(() => {});
    return undefined;
  }, [userId, isGuest]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      setPresenceAppActive(nextState === 'active').catch(() => {});
    });
    return () => subscription.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  useBackgroundMusic();

  const [fontsLoaded, fontError] = useFonts({
    LuckiestGuy_400Regular,
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    SpaceMono_400Regular,
  });

  const authInitialized = useRef(false);
  const editionsLoaded = useRef(false);

  // Initialize auth listener and load editions from Firestore on app start
  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;
    console.log('[App] Starting auth initialization...');
    const unsubscribe = useAuthStore.getState().initializeAuth();

    // Safety timeout: if auth doesn't initialize within 5 seconds, force it
    const timeout = setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state.isInitialized) {
        console.warn('[App] Auth timeout - forcing initialization');
        useAuthStore.setState({ isInitialized: true, isLoading: false });
      }
    }, 5000);

    // Réinitialiser le dismiss de la bannière "invité" à chaque lancement complet
    resetGuestBannerDismissOnAppStart();

    // DEBUG: Clear caches to force fresh fetch (remove after debugging)
    if (__DEV__) {
      clearCache('editions').then(() => console.log('[App] Editions cache cleared'));
    }

    // Load editions from Firestore (priority) or fallback to local JSONs
    refreshEditionsFromFirestore()
      .then(() => {
        editionsLoaded.current = true;
        console.log('[App] Editions loaded successfully');
      })
      .catch((error) => {
        console.warn('[App] Failed to load editions, using local fallback:', error);
        editionsLoaded.current = true;
      });
    refreshDefaultProjectsFromFirestore();
    refreshIdeationFromFirestore();
    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{ flex: 1, backgroundColor: COLORS.background }}
            onLayout={onLayoutRootView}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen
                name="(auth)"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  animation: 'fade',
                }}
              />
              <Stack.Screen
                name="(game)"
                options={{
                  animation: 'slide_from_bottom',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="(startup)"
                options={{
                  animation: 'slide_from_right',
                }}
              />
              <Stack.Screen
                name="(programs)"
                options={{
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
            <PresenceGate />
            <InvitationListenerGate />
            <GameInvitationPopup />
            <StatusBar style="light" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
