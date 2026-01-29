import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { EmptyState } from '@/components/common/EmptyState';
import { useUserStore } from '@/stores';

const FILTERS = [
  { id: 'all', label: 'TOUT' },
  { id: 'edtech', label: 'ED TECH' },
  { id: 'greentech', label: 'GREEN TECH' },
  { id: 'fintech', label: 'FINTECH' },
  { id: 'healthtech', label: 'HEALTH' },
];

const MAX_STARTUPS = 3;

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const startups = profile?.startups ?? [];
  const totalValorisation = startups.reduce((sum, s) => sum + s.tokensInvested, 0);
  const canAddStartup = startups.length < MAX_STARTUPS;

  // Filtrer les startups
  const filteredStartups = startups.filter((s) => {
    if (activeFilter === 'all') return true;
    return s.sector.toLowerCase().includes(activeFilter.replace('tech', ''));
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simuler un refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateStartup = () => {
    if (canAddStartup) {
      router.push('/(startup)/inspiration-cards');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header Fixe */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: insets.top + SPACING[2],
          paddingBottom: SPACING[3],
          paddingHorizontal: SPACING[4],
          backgroundColor: 'rgba(12, 36, 62, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 188, 64, 0.1)',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES['2xl'],
                color: COLORS.text,
              }}
            >
              Portfolio
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
              }}
            >
              {startups.length}/{MAX_STARTUPS} entreprise{startups.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: SPACING[24],
          paddingHorizontal: SPACING[4],
        }}
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
        {/* Cartes Récap */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ flexDirection: 'row', gap: SPACING[3], marginBottom: SPACING[4] }}
        >
          {/* Valorisation Totale */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: SPACING[4],
              borderWidth: 1,
              borderColor: 'rgba(255, 188, 64, 0.1)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[2] }}>
              <Ionicons name="diamond" size={18} color="#FFBC40" />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                  marginLeft: 6,
                }}
              >
                Valorisation
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES['2xl'],
                color: COLORS.text,
              }}
            >
              {totalValorisation}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              jetons totaux
            </Text>
          </View>

          {/* Croissance */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: SPACING[4],
              borderWidth: 1,
              borderColor: 'rgba(76, 175, 80, 0.2)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[2] }}>
              <Ionicons name="trending-up" size={18} color="#4CAF50" />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                  marginLeft: 6,
                }}
              >
                Croissance
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES['2xl'],
                color: '#4CAF50',
              }}
            >
              +{startups.length > 0 ? Math.floor(Math.random() * 30) + 5 : 0}%
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.xs,
                color: COLORS.textSecondary,
              }}
            >
              ce mois
            </Text>
          </View>
        </Animated.View>

        {/* Filtres Horizontaux */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING[4], gap: SPACING[2] }}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={{
                    paddingHorizontal: SPACING[4],
                    paddingVertical: SPACING[2],
                    borderRadius: 20,
                    backgroundColor: isActive ? 'rgba(255, 188, 64, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: FONT_SIZES.xs,
                      color: isActive ? '#FFBC40' : COLORS.textSecondary,
                    }}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Liste des Startups */}
        {filteredStartups.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ flex: 1, justifyContent: 'center', paddingVertical: SPACING[8] }}
          >
            <EmptyState
              icon="rocket-outline"
              title="Aucune startup"
              description={
                activeFilter === 'all'
                  ? 'Crée ta première startup en jouant et en gagnant des jetons !'
                  : 'Aucune startup dans cette catégorie'
              }
              actionLabel={canAddStartup ? 'Créer une startup' : undefined}
              onAction={canAddStartup ? handleCreateStartup : undefined}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ gap: SPACING[3] }}
          >
            {filteredStartups.map((startup, index) => (
              <Animated.View
                key={startup.id}
                entering={FadeInDown.delay(400 + index * 100).duration(500)}
              >
                <Pressable>
                  <LinearGradient
                    colors={['#1F91D0', '#0C2643']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      padding: SPACING[4],
                      borderWidth: 1,
                      borderColor: 'rgba(31, 145, 208, 0.3)',
                    }}
                  >
                    {/* Header de la carte */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING[3] }}>
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255, 188, 64, 0.2)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: SPACING[3],
                        }}
                      >
                        <Ionicons name="business" size={24} color="#FFBC40" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: FONTS.title,
                            fontSize: FONT_SIZES.lg,
                            color: COLORS.text,
                            marginBottom: 2,
                          }}
                        >
                          {startup.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: FONT_SIZES.sm,
                            color: 'rgba(255, 255, 255, 0.7)',
                          }}
                          numberOfLines={2}
                        >
                          {startup.description || 'Startup innovante dans le secteur ' + startup.sector}
                        </Text>
                      </View>
                    </View>

                    {/* Tags */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2], marginBottom: SPACING[3] }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(255, 188, 64, 0.2)',
                          paddingHorizontal: SPACING[2],
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.bodySemiBold,
                            fontSize: 10,
                            color: '#FFBC40',
                          }}
                        >
                          {startup.sector.toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: 'rgba(76, 175, 80, 0.2)',
                          paddingHorizontal: SPACING[2],
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.bodySemiBold,
                            fontSize: 10,
                            color: '#4CAF50',
                          }}
                        >
                          NIVEAU {startup.level}
                        </Text>
                      </View>
                    </View>

                    {/* Footer: Date + Valorisation + Croissance */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: SPACING[3],
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                        <Text
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: FONT_SIZES.xs,
                            color: COLORS.textSecondary,
                            marginLeft: 4,
                          }}
                        >
                          {formatDate(startup.createdAt)}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[3] }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="diamond" size={14} color="#FFBC40" />
                          <Text
                            style={{
                              fontFamily: FONTS.bodySemiBold,
                              fontSize: FONT_SIZES.sm,
                              color: '#FFBC40',
                              marginLeft: 4,
                            }}
                          >
                            {startup.tokensInvested}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="trending-up" size={14} color="#4CAF50" />
                          <Text
                            style={{
                              fontFamily: FONTS.bodySemiBold,
                              fontSize: FONT_SIZES.sm,
                              color: '#4CAF50',
                              marginLeft: 4,
                            }}
                          >
                            +{Math.floor(Math.random() * 20) + 5}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bouton Flottant + */}
      {canAddStartup && (
        <Pressable
          onPress={handleCreateStartup}
          style={{
            position: 'absolute',
            bottom: insets.bottom + SPACING[4],
            right: SPACING[4],
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: 'hidden',
            shadowColor: '#FFBC40',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={['#FFBC40', '#F5A623']}
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="add" size={32} color="#0C243E" />
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}
