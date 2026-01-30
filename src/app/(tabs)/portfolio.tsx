import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { FONTS } from '@/styles/typography';
import { useUserStore } from '@/stores';
import { PortfolioIcon } from '@/components/icons';
import {
  RadialBackground,
  DynamicGradientBorder,
  FilterChips,
  Tag,
  StatCard,
  ScreenHeader,
  FAB,
} from '@/components/ui';

const FILTERS = [
  { id: 'all', label: 'TOUT' },
  { id: 'edtech', label: 'ED TECH' },
  { id: 'greentech', label: 'GREEN TECH' },
  { id: 'fintech', label: 'FINTECH' },
  { id: 'healthtech', label: 'HEALTH' },
];

const MAX_STARTUPS = 3;

// Header height: safeArea + title(~36) + margin(20) + statsRow(~90) + paddingBottom(16)
const HEADER_CONTENT_HEIGHT = 182;

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const startups = profile?.startups ?? [];
  const totalValorisation = startups.reduce((sum, s) => sum + s.tokensInvested, 0);
  const canAddStartup = startups.length < MAX_STARTUPS;

  const filteredStartups = startups.filter((s) => {
    if (activeFilter === 'all') return true;
    return s.sector.toLowerCase().includes(activeFilter.replace('tech', ''));
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateStartup = () => {
    if (canAddStartup) {
      router.push('/(startup)/ideation');
    }
  };

  const formatValorisation = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`;
    return `${value}€`;
  };

  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + HEADER_CONTENT_HEIGHT;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header with background */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ScreenHeader
            title="MON PORTFOLIO"
            subtitle={`${startups.length} entreprise${startups.length !== 1 ? 's' : ''}`}
            rightElement={
              <Pressable style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
          <StatCard
            value={formatValorisation(totalValorisation || 3200000)}
            label="Valorisation Totale"
          />
          <StatCard
            value="+12%"
            label="Croissance"
            valueColor="#4CAF50"
          />
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFBC40"
            colors={['#FFBC40']}
          />
        }
      >
        {/* Filtres */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <FilterChips
            filters={FILTERS}
            activeId={activeFilter}
            onSelect={setActiveFilter}
          />
        </Animated.View>

        {/* Liste des Startups */}
        {filteredStartups.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.emptyContainer}>
            <PortfolioIcon color="rgba(255,255,255,0.2)" size={64} />
            <Text style={styles.emptyTitle}>Aucune startup</Text>
            <Text style={styles.emptyDesc}>
              {activeFilter === 'all'
                ? 'Crée ta première startup en jouant et en gagnant des jetons !'
                : 'Aucune startup dans cette catégorie'}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ gap: 14 }}>
            {filteredStartups.map((startup, index) => (
              <Animated.View
                key={startup.id}
                entering={FadeInDown.delay(400 + index * 100).duration(500)}
              >
                <Pressable>
                  <DynamicGradientBorder
                    borderRadius={16}
                    fill="rgba(0, 0, 0, 0.3)"
                    style={{ width: '100%' }}
                  >
                    <View style={styles.startupCard}>
                      {/* Header */}
                      <View style={styles.startupHeader}>
                        <View style={styles.startupIcon}>
                          <PortfolioIcon color="#71808E" size={28} />
                        </View>
                        <View style={styles.startupInfo}>
                          <Text style={styles.startupName}>{startup.name}</Text>
                          <Text style={styles.startupDesc} numberOfLines={2}>
                            {startup.description || `Startup innovante dans le secteur ${startup.sector}`}
                          </Text>
                        </View>
                      </View>

                      {/* Tags */}
                      <View style={styles.tagsRow}>
                        <Tag label={startup.sector} />
                        {startup.tags?.map((tag: string, i: number) => (
                          <Tag key={i} label={tag} />
                        ))}
                        <Text style={styles.dateText}>
                          Crée il y'a {Math.floor((Date.now() - startup.createdAt) / (1000 * 60 * 60 * 24 * 7))} semaine{Math.floor((Date.now() - startup.createdAt) / (1000 * 60 * 60 * 24 * 7)) !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      {/* Footer stats */}
                      <View style={styles.startupFooter}>
                        <View style={styles.footerStat}>
                          <Text style={styles.footerStatValue}>
                            {formatValorisation(startup.tokensInvested)}
                          </Text>
                          <Text style={styles.footerStatLabel}>Valorisation</Text>
                        </View>
                        <View style={styles.footerStat}>
                          <Text style={styles.footerStatValueGreen}>+12%</Text>
                          <Text style={styles.footerStatLabel}>Croissance</Text>
                        </View>
                      </View>
                    </View>
                  </DynamicGradientBorder>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bouton Flottant + */}
      {canAddStartup && (
        <FAB onPress={handleCreateStartup} bottom={insets.bottom + 100} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 16,
  },
  emptyDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  // Startup card
  startupCard: {
    padding: 16,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  startupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: '#FFBC40',
    marginBottom: 4,
  },
  startupDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },
  startupFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  footerStatValue: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#FFBC40',
  },
  footerStatValueGreen: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#4CAF50',
  },
  footerStatLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
