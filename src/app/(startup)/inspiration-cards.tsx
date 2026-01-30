import { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { RadialBackground, DynamicGradientBorder, GameButton } from '@/components/ui';
import { FONTS } from '@/styles/typography';
import { useSettingsStore } from '@/stores';
import { TARGET_CARDS, MISSION_CARDS, SECTOR_CARDS } from '@/constants';
import type { TargetCard, MissionCard, SectorCard } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ===== COULEURS PAR CARTE =====
const CARD_THEMES = {
  target: {
    titleColor: '#4CAF50',
    contentBg: '#E8F5E9',
    contentTextColor: '#1B5E20',
  },
  mission: {
    titleColor: '#FFBC40',
    contentBg: '#FFF3E0',
    contentTextColor: '#4E342E',
  },
  sector: {
    titleColor: '#1F91D0',
    contentBg: '#E3F2FD',
    contentTextColor: '#0D47A1',
  },
} as const;

const RARITY_COLORS = {
  common: '#9E9E9E',
  rare: '#FFBC40',
  legendary: '#FF6B6B',
} as const;

const RARITY_LABELS = {
  common: 'Commun',
  rare: 'Rare',
  legendary: 'Légendaire',
} as const;

// Tirage pondéré par rareté
function drawRandomCard<T extends { rarity: 'common' | 'rare' | 'legendary' }>(cards: T[]): T {
  const weights = { common: 70, rare: 25, legendary: 5 };
  const weightedCards: T[] = [];
  for (const card of cards) {
    const weight = weights[card.rarity];
    for (let i = 0; i < weight; i++) {
      weightedCards.push(card);
    }
  }
  const randomIndex = Math.floor(Math.random() * weightedCards.length);
  return weightedCards[randomIndex] ?? cards[0]!;
}

// ===== PICKER ITEM =====
type PickerItem = { id: string; title: string; rarity: 'common' | 'rare' | 'legendary'; xpMultiplier?: number };

const PickerListItem = memo(function PickerListItem({
  item,
  themeColor,
  onSelect,
}: {
  item: PickerItem;
  themeColor: string;
  onSelect: (item: PickerItem) => void;
}) {
  return (
    <Pressable onPress={() => onSelect(item)} style={styles.pickerItem}>
      <View style={styles.pickerItemLeft}>
        <Text style={styles.pickerItemTitle}>{item.title}</Text>
        <View style={styles.pickerItemMeta}>
          <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[item.rarity]}20` }]}>
            <Text style={[styles.rarityBadgeText, { color: RARITY_COLORS[item.rarity] }]}>
              {RARITY_LABELS[item.rarity]}
            </Text>
          </View>
          {item.xpMultiplier != null && (
            <Text style={[styles.xpText, { color: themeColor }]}>x{item.xpMultiplier} XP</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
    </Pressable>
  );
});

// ===== COMPOSANT =====

export default function InspirationCardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [targetCard, setTargetCard] = useState<TargetCard | null>(null);
  const [missionCard, setMissionCard] = useState<MissionCard | null>(null);
  const [sectorCard, setSectorCard] = useState<SectorCard | null>(null);

  // Picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<'target' | 'mission' | 'sector'>('target');

  // Animation values
  const targetScale = useSharedValue(1);
  const missionScale = useSharedValue(1);
  const sectorScale = useSharedValue(1);

  const canContinue = targetCard && missionCard && sectorCard;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // === Tirage aléatoire (sur l'icône sync) ===
  // On tire la carte côté JS AVANT l'animation pour éviter le crash UI thread
  const handleDrawTarget = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const drawn = drawRandomCard(TARGET_CARDS);
    targetScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    setTargetCard(drawn);
  }, [hapticsEnabled, targetScale]);

  const handleDrawMission = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const drawn = drawRandomCard(MISSION_CARDS);
    missionScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    setMissionCard(drawn);
  }, [hapticsEnabled, missionScale]);

  const handleDrawSector = useCallback(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const drawn = drawRandomCard(SECTOR_CARDS);
    sectorScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    setSectorCard(drawn);
  }, [hapticsEnabled, sectorScale]);

  // === Ouvrir le picker (sur la zone blanche) ===
  const handleOpenPicker = useCallback((type: 'target' | 'mission' | 'sector') => {
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
    setPickerType(type);
    setPickerVisible(true);
  }, [hapticsEnabled]);

  // === Sélection depuis le picker ===
  const handlePickerSelect = useCallback((item: PickerItem) => {
    if (pickerType === 'target') {
      const found = TARGET_CARDS.find((c) => c.id === item.id);
      if (found) setTargetCard(found);
    } else if (pickerType === 'mission') {
      const found = MISSION_CARDS.find((c) => c.id === item.id);
      if (found) setMissionCard(found);
    } else {
      const found = SECTOR_CARDS.find((c) => c.id === item.id);
      if (found) setSectorCard(found);
    }
    setPickerVisible(false);
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [pickerType, hapticsEnabled]);

  const handleContinue = useCallback(() => {
    if (!canContinue) return;
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/(startup)/creation-method',
      params: {
        targetCardId: targetCard.id,
        targetCardTitle: targetCard.title,
        targetCardDesc: targetCard.description,
        missionCardId: missionCard.id,
        missionCardTitle: missionCard.title,
        missionCardDesc: missionCard.description,
        sectorTitle: sectorCard.title,
        sectorId: sectorCard.id,
      },
    });
  }, [canContinue, targetCard, missionCard, sectorCard, router, hapticsEnabled]);

  const targetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: targetScale.value }],
  }));
  const missionAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: missionScale.value }],
  }));
  const sectorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sectorScale.value }],
  }));

  // Picker data
  const pickerData: PickerItem[] =
    pickerType === 'target'
      ? TARGET_CARDS.map((c) => ({ id: c.id, title: c.title, rarity: c.rarity, xpMultiplier: c.xpMultiplier }))
      : pickerType === 'mission'
        ? MISSION_CARDS.map((c) => ({ id: c.id, title: c.title, rarity: c.rarity, xpMultiplier: c.xpMultiplier }))
        : SECTOR_CARDS.map((c) => ({ id: c.id, title: c.title, rarity: c.rarity, xpMultiplier: c.xpMultiplier }));

  const pickerTitle =
    pickerType === 'target' ? 'Choisir une Cible' :
    pickerType === 'mission' ? 'Choisir une Mission' : 'Choisir un Secteur';

  const pickerColor =
    pickerType === 'target' ? CARD_THEMES.target.titleColor :
    pickerType === 'mission' ? CARD_THEMES.mission.titleColor : CARD_THEMES.sector.titleColor;

  const headerTopPadding = insets.top + 10;
  const pickerMaxHeight = SCREEN_HEIGHT * 0.65;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>CARTES D'INSPIRATION</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTopPadding + 60, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Carte CIBLE (MARCHÉ) */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={targetAnimStyle}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: CARD_THEMES.target.titleColor }]}>
                  CIBLE <Text style={styles.cardTitleSub}>(MARCHÉ)</Text>
                </Text>
                <Pressable onPress={handleDrawTarget} style={styles.shuffleButton}>
                  <Ionicons name="sync" size={20} color={CARD_THEMES.target.titleColor} />
                </Pressable>
              </View>

              <Pressable onPress={() => handleOpenPicker('target')}>
                <View style={[styles.cardContent, { backgroundColor: CARD_THEMES.target.contentBg }]}>
                  {targetCard ? (
                    <View style={styles.cardValueContainer}>
                      <Text style={[styles.cardValue, { color: CARD_THEMES.target.contentTextColor }]}>
                        {targetCard.title.toUpperCase()}
                      </Text>
                      <View style={[styles.rarityChip, { backgroundColor: `${RARITY_COLORS[targetCard.rarity]}20` }]}>
                        <Text style={[styles.rarityChipText, { color: RARITY_COLORS[targetCard.rarity] }]}>
                          {RARITY_LABELS[targetCard.rarity]} · x{targetCard.xpMultiplier} XP
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.cardPlaceholder, { color: CARD_THEMES.target.contentTextColor }]}>
                      Appuyez pour choisir
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Carte MISSION (OBJECTIF) */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={missionAnimStyle}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: CARD_THEMES.mission.titleColor }]}>
                  MISSION <Text style={styles.cardTitleSub}>(OBJECTIF)</Text>
                </Text>
                <Pressable onPress={handleDrawMission} style={styles.shuffleButton}>
                  <Ionicons name="sync" size={20} color={CARD_THEMES.mission.titleColor} />
                </Pressable>
              </View>

              <Pressable onPress={() => handleOpenPicker('mission')}>
                <View style={[styles.cardContent, { backgroundColor: CARD_THEMES.mission.contentBg }]}>
                  {missionCard ? (
                    <View style={styles.cardValueContainer}>
                      <Text style={[styles.cardValue, { color: CARD_THEMES.mission.contentTextColor }]}>
                        {missionCard.title.toUpperCase()}
                      </Text>
                      <View style={[styles.rarityChip, { backgroundColor: `${RARITY_COLORS[missionCard.rarity]}20` }]}>
                        <Text style={[styles.rarityChipText, { color: RARITY_COLORS[missionCard.rarity] }]}>
                          {RARITY_LABELS[missionCard.rarity]} · x{missionCard.xpMultiplier} XP
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.cardPlaceholder, { color: CARD_THEMES.mission.contentTextColor }]}>
                      Appuyez pour choisir
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Carte SECTEUR (DOMAINE) */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={sectorAnimStyle}>
          <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.35)">
            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: CARD_THEMES.sector.titleColor }]}>
                  SECTEUR <Text style={styles.cardTitleSub}>(DOMAINE)</Text>
                </Text>
                <Pressable onPress={handleDrawSector} style={styles.shuffleButton}>
                  <Ionicons name="sync" size={20} color={CARD_THEMES.sector.titleColor} />
                </Pressable>
              </View>

              <Pressable onPress={() => handleOpenPicker('sector')}>
                <View style={[styles.cardContent, { backgroundColor: CARD_THEMES.sector.contentBg }]}>
                  {sectorCard ? (
                    <View style={styles.cardValueContainer}>
                      <Text style={[styles.cardValue, { color: CARD_THEMES.sector.contentTextColor }]}>
                        {sectorCard.title.toUpperCase()}
                      </Text>
                      <View style={[styles.rarityChip, { backgroundColor: `${RARITY_COLORS[sectorCard.rarity]}20` }]}>
                        <Text style={[styles.rarityChipText, { color: RARITY_COLORS[sectorCard.rarity] }]}>
                          {RARITY_LABELS[sectorCard.rarity]} · x{sectorCard.xpMultiplier} XP
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.cardPlaceholder, { color: CARD_THEMES.sector.contentTextColor }]}>
                      Appuyez pour choisir
                    </Text>
                  )}
                </View>
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>

      {/* Bouton Continuer fixe en bas */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(500)}
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}
      >
        <GameButton
          variant="yellow"
          fullWidth
          title="CONTINUER"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </Animated.View>

      {/* Modal Picker */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerDismiss} onPress={() => setPickerVisible(false)} />
          <View style={[styles.pickerContainer, { maxHeight: pickerMaxHeight, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Handle */}
            <View style={styles.pickerHandle} />

            {/* Header */}
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: pickerColor }]}>{pickerTitle}</Text>
              <Pressable onPress={() => setPickerVisible(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>

            {/* Nombre d'items */}
            <Text style={styles.pickerCount}>
              {pickerData.length} option{pickerData.length > 1 ? 's' : ''} disponible{pickerData.length > 1 ? 's' : ''}
            </Text>

            {/* Liste */}
            <FlatList
              data={pickerData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PickerListItem
                  item={item}
                  themeColor={pickerColor}
                  onSelect={handlePickerSelect}
                />
              )}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.pickerListContent}
              ItemSeparatorComponent={PickerSeparator}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const PickerSeparator = memo(function PickerSeparator() {
  return <View style={styles.pickerSeparator} />;
});

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 16,
  },
  cardInner: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    textTransform: 'uppercase',
  },
  cardTitleSub: {
    fontFamily: FONTS.title,
    fontSize: 14,
    opacity: 0.6,
  },
  shuffleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  cardValueContainer: {
    alignItems: 'center',
    gap: 8,
  },
  cardValue: {
    fontFamily: FONTS.title,
    fontSize: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cardPlaceholder: {
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.5,
  },
  rarityChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  // Picker modal
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerDismiss: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#0A1929',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pickerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    textTransform: 'uppercase',
  },
  pickerCount: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  pickerListContent: {
    paddingBottom: 10,
  },
  pickerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  pickerItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  pickerItemTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pickerItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rarityBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 10,
  },
  xpText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
  },
});
