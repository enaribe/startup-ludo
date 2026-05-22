import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { useUserStore } from '@/stores';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);

  const totalGames = profile?.gamesPlayed ?? 0;
  const totalWins = profile?.gamesWon ?? 0;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const totalXP = profile?.xp ?? 0;
  const totalLosses = Math.max(0, totalGames - totalWins);

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>STATISTIQUES</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats — Parties / Victoires / XP */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 188, 64, 0.15)' }]}>
                  <Ionicons name="game-controller" size={20} color={COLORS.primary} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{totalGames}</Text>
                <Text style={styles.statLabel}>Parties</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                  <Ionicons name="trophy" size={20} color={COLORS.success} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.success }]}>{winRate}%</Text>
                <Text style={styles.statLabel}>Victoires</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconCircle, { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                  <Ionicons name="star" size={20} color={COLORS.info} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.info }]}>{totalXP}</Text>
                <Text style={styles.statLabel}>XP Total</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Détail Victoires / Défaites */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.detailWrapper}>
          <DynamicGradientBorder
            borderRadius={16}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={contentWidth}
          >
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="trophy" size={18} color={COLORS.success} />
                <Text style={styles.detailLabel}>Victoires</Text>
                <Text style={[styles.detailValue, { color: COLORS.success }]}>{totalWins}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Ionicons name="close-circle" size={18} color={COLORS.error} />
                <Text style={styles.detailLabel}>Défaites</Text>
                <Text style={[styles.detailValue, { color: COLORS.error }]}>{totalLosses}</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: SPACING[4],
    gap: SPACING[2],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING[3],
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  detailWrapper: {
    marginTop: SPACING[4],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING[1],
  },
  detailDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  detailLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
  },
  detailValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
  },
});
