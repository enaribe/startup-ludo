import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingScreen } from '@/components/common/LoadingScreen';

type TabIconName = 'home' | 'briefcase' | 'trophy' | 'person';

const TAB_ICONS: Record<string, { focused: TabIconName; unfocused: `${TabIconName}-outline` }> = {
  home: { focused: 'home', unfocused: 'home-outline' },
  portfolio: { focused: 'briefcase', unfocused: 'briefcase-outline' },
  classement: { focused: 'trophy', unfocused: 'trophy-outline' },
  profil: { focused: 'person', unfocused: 'person-outline' },
};

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
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 65,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontFamily: FONTS.bodySemiBold,
          fontSize: FONT_SIZES.xs,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="home" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="portfolio" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="classement"
        options={{
          title: 'Classement',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="classement" focused={focused} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon name="profil" focused={focused} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

function TabIcon({ name, focused, color, size }: TabIconProps) {
  const icons = TAB_ICONS[name];
  if (!icons) return null;

  const iconName = focused ? icons.focused : icons.unfocused;

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons name={iconName} size={size} color={color} />
      {focused && (
        <View
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            marginLeft: -2,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.primary,
          }}
        />
      )}
    </View>
  );
}
