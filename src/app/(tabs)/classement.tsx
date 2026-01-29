import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader, DynamicGradientBorder } from '@/components/ui';
import { EmptyState } from '@/components/common/EmptyState';

// Hauteur approximative du header fixe (safe area + titre + padding)
const HEADER_CONTENT_HEIGHT = 82;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RadialGradientBackground = () => (
  <Svg style={StyleSheet.absoluteFill} width={screenWidth} height={screenHeight}>
    <Defs>
      <RadialGradient id="radialBg" cx="50%" cy="50%" r="80%">
        <Stop offset="0%" stopColor="#0F3A6B" stopOpacity="1" />
        <Stop offset="100%" stopColor="#081A2A" stopOpacity="1" />
      </RadialGradient>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#radialBg)" />
  </Svg>
);

// Filtres disponibles
const FILTERS = [
  { id: 'entrepreneurs', label: 'JOUEURS', icon: 'people' as const },
  { id: 'startups', label: 'ENTREPRISES', icon: 'rocket' as const },
];

// Mock data pour le classement entrepreneurs
const MOCK_ENTREPRENEURS = [
  { id: '1', name: 'FALLOU D.', xp: 45230, avatar: null, subtitle: '45,230 xp' },
  { id: '2', name: 'ROUGUIYATOU D.', xp: 45230, avatar: null, subtitle: '45,230 xp' },
  { id: '3', name: 'FALLOU D.', xp: 45230, avatar: null, subtitle: '45,230 xp' },
  { id: '4', name: 'THIERNO KANE', xp: 45230, avatar: null, subtitle: '12 entreprises' },
  { id: '5', name: 'AMINATA LY', xp: 42230, avatar: null, subtitle: '12 entreprises' },
  { id: '6', name: 'VOUS (ABDOUL AZIZ CISS)', xp: 42230, avatar: null, subtitle: '12 entreprises', isUser: true },
  { id: '7', name: 'AMINATA LY', xp: 42230, avatar: null, subtitle: '12 entreprises' },
  { id: '8', name: 'KHADY F.', xp: 3500, avatar: null, subtitle: '8 entreprises' },
  { id: '9', name: 'CHEIKH M.', xp: 3100, avatar: null, subtitle: '5 entreprises' },
  { id: '10', name: 'MOUSSA N.', xp: 2800, avatar: null, subtitle: '4 entreprises' },
];

// Mock data pour le classement startups
const MOCK_STARTUPS = [
  { id: '1', name: 'AGRITECH PRO', xp: 45000, subtitle: '45,000 jetons', sector: 'Agriculture' },
  { id: '2', name: 'EDULEARN', xp: 38000, subtitle: '38,000 jetons', sector: 'Éducation' },
  { id: '3', name: 'HEALTHPLUS', xp: 32000, subtitle: '32,000 jetons', sector: 'Santé' },
  { id: '4', name: 'FINANCEFLOW', xp: 28000, subtitle: '28,000 jetons', sector: 'Finance' },
  { id: '5', name: 'GREENENERGY', xp: 24000, subtitle: '24,000 jetons', sector: 'Énergie' },
  { id: '6', name: 'TECHSOLUTIONS', xp: 21000, subtitle: '21,000 jetons', sector: 'Technologie' },
  { id: '7', name: 'LOGITRANS', xp: 18000, subtitle: '18,000 jetons', sector: 'Transport' },
];

export default function ClassementScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('entrepreneurs');
  const [refreshing, setRefreshing] = useState(false);

  const isEntrepreneurs = activeFilter === 'entrepreneurs';
  const data = isEntrepreneurs ? MOCK_ENTREPRENEURS : MOCK_STARTUPS;
  
  // Reorder for Podium: 2nd, 1st, 3rd
  const podiumData = [data[1], data[0], data[2]].filter(Boolean);
  const restOfList = data.slice(3);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + HEADER_CONTENT_HEIGHT;

  return (
    <View style={styles.container}>
      <RadialGradientBackground />

      {/* Header fixe (design system: FixedHeader + ScreenHeader) */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ScreenHeader
            title="CLASSEMENT GLOBAL"
            rightElement={
              <Pressable style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            }
          />
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + SPACING[4],
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
        {/* Tabs / Filters */}
        <View style={{ flexDirection: 'row', gap: SPACING[4], marginBottom: SPACING[6] }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilter(filter.id)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 25,
                  backgroundColor: isActive ? 'transparent' : 'rgba(15, 30, 46, 0.6)',
                  borderWidth: 1,
                  borderColor: isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.1)',
                  gap: 8,
                }}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={18} 
                  color={isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.5)'} 
                />
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.sm,
                    color: isActive ? '#FFBC40' : 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                  }}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: FONT_SIZES.xl,
            color: '#FFFFFF',
            marginBottom: SPACING[4],
            textTransform: 'uppercase',
          }}
        >
          TOP 3 {isEntrepreneurs ? 'ENTREPRENEURS' : 'ENTREPRISES'}
        </Text>

        {/* Podium Section */}
        {podiumData.length >= 3 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ marginBottom: SPACING[6] }}>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(10, 25, 41, 0.6)"
              boxWidth={screenWidth - SPACING[4] * 2}
              style={{
                height: 280,
                padding: SPACING[4],
                paddingBottom: 0,
                justifyContent: 'flex-end',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  height: '100%',
                  gap: 12,
                }}
              >
                {/* 2ème Place */}
                <PodiumItem
                  rank={2}
                  item={podiumData[0]}
                  height={100}
                />

                {/* 1ère Place */}
                <PodiumItem
                  rank={1}
                  item={podiumData[1]}
                  height={140}
                  isFirst
                />

                {/* 3ème Place */}
                <PodiumItem
                  rank={3}
                  item={podiumData[2]}
                  height={80}
                />
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}

        {/* List Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.6)"
            boxWidth={screenWidth - SPACING[4] * 2}
            style={{ paddingVertical: SPACING[2] }}
          >
            {restOfList.length === 0 ? (
              <View style={{ padding: SPACING[4] }}>
                <EmptyState
                  icon="trophy-outline"
                  title="Aucun autre classement"
                  description="Jouez pour apparaître ici !"
                />
              </View>
            ) : (
              restOfList.map((item, index) => (
                <RankingItem
                  key={item.id}
                  rank={index + 4}
                  item={item}
                  isLast={index === restOfList.length - 1}
                />
              ))
            )}
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

interface PodiumItemProps {
  rank: number;
  item: typeof MOCK_ENTREPRENEURS[0];
  height: number;
  isFirst?: boolean;
}

function PodiumItem({ rank, item, height, isFirst = false }: PodiumItemProps) {
  return (
    <View style={{ alignItems: 'center', flex: 1, marginBottom: 0 }}>
      {/* Avatar */}
      <View style={{ marginBottom: 8, alignItems: 'center' }}>
        <View 
          style={{ 
            width: isFirst ? 60 : 44, 
            height: isFirst ? 60 : 44, 
            borderRadius: 30, 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            marginBottom: 4,
          }}
        >
          {item.avatar ? (
            <Avatar name={item.name} size={isFirst ? 'md' : 'sm'} source={item.avatar} />
          ) : (
            <Ionicons name="person" size={isFirst ? 24 : 18} color="#FFF" />
          )}
        </View>
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: isFirst ? 11 : 9,
            color: '#FFBC40',
            textAlign: 'center',
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
          }}
        >
          {item.subtitle}
        </Text>
      </View>

      {/* Podium Block */}
      <LinearGradient
        colors={['#4DB8FF', '#1F91D0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          width: '100%',
          height: height,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: isFirst ? 32 : 24,
            color: '#0A1929',
            opacity: 0.5,
          }}
        >
          {rank}
        </Text>
      </LinearGradient>
    </View>
  );
}

interface RankingItemProps {
  rank: number;
  item: typeof MOCK_ENTREPRENEURS[0] & { isUser?: boolean };
  isLast?: boolean;
}

function RankingItem({ rank, item, isLast }: RankingItemProps) {
  const isUser = item.isUser;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: isUser ? 'rgba(255, 188, 64, 0.05)' : 'transparent',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        ...(isUser && {
          borderWidth: 1,
          borderColor: 'rgba(255, 188, 64, 0.3)',
          marginHorizontal: 8,
          borderRadius: 12,
        })
      }}
    >
      {/* Rang */}
      <Text
        style={{
          fontFamily: FONTS.title,
          fontSize: 16,
          color: '#4DB8FF',
          width: 30,
          textAlign: 'center',
        }}
      >
        {rank}
      </Text>

      {/* Avatar */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name="person" size={16} color="#FFF" />
      </View>

      {/* Infos */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.title,
            fontSize: 13,
            color: '#FFFFFF',
            textTransform: 'uppercase',
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {item.subtitle}
        </Text>
      </View>

      {/* Score */}
      <Text
        style={{
          fontFamily: FONTS.bodyBold,
          fontSize: 13,
          color: '#FFBC40',
        }}
      >
        {item.xp.toLocaleString()} xp
      </Text>
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
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
