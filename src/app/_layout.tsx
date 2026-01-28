import { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  LuckiestGuy_400Regular,
} from '@expo-google-fonts/luckiest-guy';
import {
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import 'react-native-reanimated';
import '../../global.css';

import { COLORS } from '@/styles/colors';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

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
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
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
