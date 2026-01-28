import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuthStore, useUserStore } from '@/stores';

const MENU_ITEMS = [
  { id: 'settings', icon: 'settings-outline', title: 'Paramètres', route: '/settings' },
  { id: 'achievements', icon: 'ribbon-outline', title: 'Succès', route: '/achievements' },
  { id: 'history', icon: 'time-outline', title: 'Historique', route: '/history' },
  { id: 'help', icon: 'help-circle-outline', title: 'Aide', route: '/help' },
] as const;

export default function ProfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, isLoading } = useAuthStore();
  const profile = useUserStore((state) => state.profile);
  const rankInfo = useUserStore((state) => state.rankInfo);
  const levelProgress = useUserStore((state) => state.levelProgress);
  const rankProgress = useUserStore((state) => state.rankProgress);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleMenuPress = (route: string) => {
    router.push(route as never);
  };

  // Use new progression system values
  const currentLevel = levelProgress?.level ?? profile?.level ?? 1;
  const currentXP = levelProgress?.currentXP ?? 0;
  const xpForNextLevel = levelProgress?.xpForNext ?? 100;
  const xpProgress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ alignItems: 'center', marginBottom: SPACING[6] }}
        >
          <Avatar
            name={user?.displayName || 'Invité'}
            source={user?.photoURL}
            size="xl"
            showBorder
          />

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
              marginTop: SPACING[4],
            }}
          >
            {user?.displayName || 'Invité'}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: SPACING[2],
            }}
          >
            <Text style={{ fontSize: 16, marginRight: SPACING[1] }}>
              {rankInfo?.badge || '🎓'}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.base,
                color: rankInfo?.color || COLORS.primary,
                marginLeft: SPACING[1],
              }}
            >
              {rankInfo?.title || profile?.rank || 'Stagiaire'}
            </Text>
          </View>

          {/* Rank Progress */}
          {rankProgress < 100 && (
            <View style={{ width: '60%', marginTop: SPACING[2] }}>
              <ProgressBar progress={rankProgress} size="sm" variant="default" />
            </View>
          )}

          {user?.isGuest && (
            <Button
              title="Créer un compte"
              variant="primary"
              size="sm"
              style={{ marginTop: SPACING[4] }}
              onPress={handleLogin}
            />
          )}
        </Animated.View>

        {/* Level Progress */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Card style={{ marginBottom: SPACING[4] }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING[3],
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Niveau
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES['2xl'],
                    color: COLORS.text,
                  }}
                >
                  {currentLevel}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  XP
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.md,
                    color: COLORS.text,
                  }}
                >
                  {currentXP} / {xpForNextLevel}
                </Text>
              </View>
            </View>

            <ProgressBar progress={xpProgress} size="md" variant="default" />
          </Card>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={{
            flexDirection: 'row',
            gap: SPACING[3],
            marginBottom: SPACING[6],
          }}
        >
          <StatCard
            icon="game-controller"
            value={profile?.gamesPlayed ?? 0}
            label="Parties"
          />
          <StatCard
            icon="trophy"
            value={profile?.gamesWon ?? 0}
            label="Victoires"
          />
          <StatCard
            icon="cash"
            value={profile?.totalTokensEarned ?? 0}
            label="Jetons"
          />
        </Animated.View>

        {/* Menu */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={{ gap: SPACING[2] }}
        >
          {MENU_ITEMS.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(500 + index * 50).duration(500)}
            >
              <Pressable onPress={() => handleMenuPress(item.route)}>
                <Card
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING[4],
                  }}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={COLORS.text}
                  />
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.md,
                      color: COLORS.text,
                      flex: 1,
                      marginLeft: SPACING[4],
                    }}
                  >
                    {item.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </Card>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Logout Button */}
        {!user?.isGuest && (
          <Animated.View
            entering={FadeInDown.delay(700).duration(500)}
            style={{ marginTop: SPACING[6] }}
          >
            <Button
              title="Se déconnecter"
              variant="ghost"
              fullWidth
              loading={isLoading}
              onPress={handleLogout}
              leftIcon={
                <Ionicons name="log-out-outline" size={20} color={COLORS.text} />
              }
            />
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', padding: SPACING[4] }}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
      <Text
        style={{
          fontFamily: FONTS.title,
          fontSize: FONT_SIZES.xl,
          color: COLORS.text,
          marginTop: SPACING[2],
        }}
      >
        {value.toLocaleString()}
      </Text>
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.xs,
          color: COLORS.textSecondary,
        }}
      >
        {label}
      </Text>
    </Card>
  );
}
