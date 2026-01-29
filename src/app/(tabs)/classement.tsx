import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/common/EmptyState';

// Filtres disponibles
const FILTERS = [
  { id: 'entrepreneurs', label: 'ENTREPRENEURS' },
  { id: 'startups', label: 'STARTUPS' },
];

// Mock data pour le classement entrepreneurs
const MOCK_ENTREPRENEURS = [
  { id: '1', name: 'Amadou D.', xp: 12500, avatar: null, level: 15 },
  { id: '2', name: 'Fatou S.', xp: 8750, avatar: null, level: 12 },
  { id: '3', name: 'Ibrahim K.', xp: 7200, avatar: null, level: 10 },
  { id: '4', name: 'Mariama B.', xp: 5100, avatar: null, level: 8 },
  { id: '5', name: 'Ousmane T.', xp: 4800, avatar: null, level: 7 },
  { id: '6', name: 'Aissatou D.', xp: 4200, avatar: null, level: 6 },
  { id: '7', name: 'Moussa N.', xp: 3900, avatar: null, level: 6 },
  { id: '8', name: 'Khady F.', xp: 3500, avatar: null, level: 5 },
  { id: '9', name: 'Cheikh M.', xp: 3100, avatar: null, level: 5 },
  { id: '10', name: 'Aminata L.', xp: 2800, avatar: null, level: 4 },
];

// Mock data pour le classement startups
const MOCK_STARTUPS = [
  { id: '1', name: 'AgriTech Pro', tokens: 45000, sector: 'Agriculture', level: 5 },
  { id: '2', name: 'EduLearn', tokens: 38000, sector: 'Éducation', level: 4 },
  { id: '3', name: 'HealthPlus', tokens: 32000, sector: 'Santé', level: 4 },
  { id: '4', name: 'FinanceFlow', tokens: 28000, sector: 'Finance', level: 3 },
  { id: '5', name: 'GreenEnergy', tokens: 24000, sector: 'Énergie', level: 3 },
  { id: '6', name: 'TechSolutions', tokens: 21000, sector: 'Technologie', level: 3 },
  { id: '7', name: 'LogiTrans', tokens: 18000, sector: 'Transport', level: 2 },
  { id: '8', name: 'FoodExpress', tokens: 15000, sector: 'Commerce', level: 2 },
  { id: '9', name: 'ArtDesign', tokens: 12000, sector: 'Créatif', level: 2 },
  { id: '10', name: 'SportFit', tokens: 9000, sector: 'Sport', level: 1 },
];

// Couleurs des couronnes
const CROWN_COLORS = {
  1: '#FFD700', // Or
  2: '#4CAF50', // Vert
  3: '#1F91D0', // Bleu
};

export default function ClassementScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('entrepreneurs');
  const [refreshing, setRefreshing] = useState(false);

  const isEntrepreneurs = activeFilter === 'entrepreneurs';
  const data = isEntrepreneurs ? MOCK_ENTREPRENEURS : MOCK_STARTUPS;
  const top3 = data.slice(0, 3);
  const restOfList = data.slice(3, 10);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES['2xl'],
            color: COLORS.text,
          }}
        >
          Classement
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 70,
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
        {/* Filtres */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SPACING[2] }}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={{
                    paddingHorizontal: SPACING[5],
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
                      fontSize: FONT_SIZES.sm,
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

        {/* Podium Top 3 (ordre 2-1-3) */}
        {top3.length >= 3 && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-end',
              marginBottom: SPACING[6],
              paddingHorizontal: SPACING[2],
            }}
          >
            {/* 2ème Place */}
            <PodiumItem
              rank={2}
              item={top3[1]}
              isEntrepreneur={isEntrepreneurs}
              height={90}
            />

            {/* 1ère Place */}
            <PodiumItem
              rank={1}
              item={top3[0]}
              isEntrepreneur={isEntrepreneurs}
              height={120}
              isFirst
            />

            {/* 3ème Place */}
            <PodiumItem
              rank={3}
              item={top3[2]}
              isEntrepreneur={isEntrepreneurs}
              height={70}
            />
          </Animated.View>
        )}

        {/* Liste des rangs 4 à 10 */}
        {restOfList.length === 0 ? (
          <EmptyState
            icon="trophy-outline"
            title="Aucun classement"
            description="Joue des parties pour apparaître dans le classement !"
          />
        ) : (
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ gap: SPACING[2] }}
          >
            {restOfList.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(400 + index * 50).duration(500)}
              >
                <RankingItem
                  rank={index + 4}
                  item={item}
                  isEntrepreneur={isEntrepreneurs}
                />
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

interface PodiumItemProps {
  rank: number;
  item: (typeof MOCK_ENTREPRENEURS)[0] | (typeof MOCK_STARTUPS)[0] | undefined;
  isEntrepreneur: boolean;
  height: number;
  isFirst?: boolean;
}

function PodiumItem({ rank, item, isEntrepreneur, height, isFirst = false }: PodiumItemProps) {
  if (!item) return null;

  const crownColor = CROWN_COLORS[rank as keyof typeof CROWN_COLORS];
  const name = item.name;
  const score = isEntrepreneur
    ? (item as (typeof MOCK_ENTREPRENEURS)[0]).xp
    : (item as (typeof MOCK_STARTUPS)[0]).tokens;
  const scoreLabel = isEntrepreneur ? 'XP' : 'jetons';

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      {/* Couronne */}
      <View
        style={{
          width: isFirst ? 36 : 28,
          height: isFirst ? 36 : 28,
          borderRadius: isFirst ? 18 : 14,
          backgroundColor: crownColor,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: SPACING[2],
          shadowColor: crownColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
        }}
      >
        <Ionicons
          name="trophy"
          size={isFirst ? 20 : 16}
          color="#FFFFFF"
        />
      </View>

      {/* Avatar ou Icône Startup */}
      {isEntrepreneur ? (
        <Avatar
          name={name}
          source={(item as (typeof MOCK_ENTREPRENEURS)[0]).avatar}
          size={isFirst ? 'lg' : 'md'}
          showBorder
        />
      ) : (
        <View
          style={{
            width: isFirst ? 64 : 48,
            height: isFirst ? 64 : 48,
            borderRadius: isFirst ? 16 : 12,
            backgroundColor: 'rgba(255, 188, 64, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#FFBC40',
          }}
        >
          <Ionicons name="business" size={isFirst ? 28 : 22} color="#FFBC40" />
        </View>
      )}

      {/* Nom */}
      <Text
        style={{
          fontFamily: FONTS.bodySemiBold,
          fontSize: isFirst ? FONT_SIZES.md : FONT_SIZES.sm,
          color: COLORS.text,
          marginTop: SPACING[2],
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Score */}
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.xs,
          color: '#FFBC40',
          marginBottom: SPACING[2],
        }}
      >
        {score.toLocaleString()} {scoreLabel}
      </Text>

      {/* Podium */}
      <View
        style={{
          width: '90%',
          height,
          backgroundColor: crownColor,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.9,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: isFirst ? FONT_SIZES['3xl'] : FONT_SIZES['2xl'],
            color: '#FFFFFF',
          }}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
}

interface RankingItemProps {
  rank: number;
  item: (typeof MOCK_ENTREPRENEURS)[0] | (typeof MOCK_STARTUPS)[0];
  isEntrepreneur: boolean;
}

function RankingItem({ rank, item, isEntrepreneur }: RankingItemProps) {
  const name = item.name;
  const score = isEntrepreneur
    ? (item as (typeof MOCK_ENTREPRENEURS)[0]).xp
    : (item as (typeof MOCK_STARTUPS)[0]).tokens;
  const level = item.level;
  const scoreLabel = isEntrepreneur ? 'XP' : 'jetons';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: SPACING[3],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Rang */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: 'rgba(255, 188, 64, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: SPACING[3],
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bodySemiBold,
            fontSize: FONT_SIZES.md,
            color: '#FFBC40',
          }}
        >
          {rank}
        </Text>
      </View>

      {/* Avatar ou Icône */}
      {isEntrepreneur ? (
        <Avatar
          name={name}
          source={(item as (typeof MOCK_ENTREPRENEURS)[0]).avatar}
          size="sm"
        />
      ) : (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 188, 64, 0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="business" size={18} color="#FFBC40" />
        </View>
      )}

      {/* Infos */}
      <View style={{ flex: 1, marginLeft: SPACING[3] }}>
        <Text
          style={{
            fontFamily: FONTS.bodySemiBold,
            fontSize: FONT_SIZES.md,
            color: COLORS.text,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: FONT_SIZES.xs,
            color: COLORS.textSecondary,
          }}
        >
          Niveau {level}
        </Text>
      </View>

      {/* Score */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontFamily: FONTS.bodySemiBold,
            fontSize: FONT_SIZES.md,
            color: '#FFBC40',
          }}
        >
          {score.toLocaleString()}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: FONT_SIZES.xs,
            color: COLORS.textSecondary,
          }}
        >
          {scoreLabel}
        </Text>
      </View>
    </View>
  );
}
