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
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../global.css';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { COLORS } from '@/styles/colors';
import { useAuthStore } from '@/stores/useAuthStore';
import { refreshEditionsFromFirestore } from '@/data';
import { refreshDefaultProjectsFromFirestore } from '@/data/defaultProjects';
import { refreshChallengesFromFirestore } from '@/data/challenges';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
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
    const unsubscribe = useAuthStore.getState().initializeAuth();
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
    refreshChallengesFromFirestore();
    return () => unsubscribe();
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
                name="(challenges)"
                options={{
                  animation: 'slide_from_right',
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
