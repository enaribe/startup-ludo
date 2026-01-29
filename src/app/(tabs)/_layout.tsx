import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { FONTS } from '@/styles/typography';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AccueilIcon, PortfolioIcon, ClassementIcon, ProfilIcon } from '@/components/icons';

// Composant wrapper pour animer les icônes du TabBar
const AnimatedTabIcon = ({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 4,
          tension: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: -3,
          friction: 4,
          tension: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 4,
          tension: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused, scaleAnim, translateYAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

// Haptic sur chaque tab press
const hapticTabListeners = () => ({
  tabPress: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Auth guard - redirect to welcome if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Don't render tabs if not authenticated
  if (!isAuthenticated) {
    return <LoadingScreen message="Redirection..." />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A1A2F',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          paddingTop: 18,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : 10,
          height: Platform.OS === 'ios' ? 76 + insets.bottom : 76,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: '#FFBC40',
        tabBarInactiveTintColor: '#71808E',
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.title,
          fontSize: 9,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={hapticTabListeners}
        options={{
          title: 'ACCUEIL',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <AccueilIcon color={color} size={26} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        listeners={hapticTabListeners}
        options={{
          title: 'PORTFOLIO',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <PortfolioIcon color={color} size={26} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="classement"
        listeners={hapticTabListeners}
        options={{
          title: 'CLASSEMENT',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <View>
                <ClassementIcon color={color} size={26} />
                <View style={styles.notifDot} />
              </View>
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        listeners={hapticTabListeners}
        options={{
          title: 'PROFIL',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <ProfilIcon color={color} size={26} />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F35145',
  }
});
