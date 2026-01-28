import { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useUserStore, useSettingsStore } from '@/stores';
import type { Startup, TargetCard, MissionCard } from '@/types';

const SECTORS = [
  { id: 'tech', name: 'Technologie', icon: 'hardware-chip' },
  { id: 'agri', name: 'Agriculture', icon: 'leaf' },
  { id: 'health', name: 'Santé', icon: 'medkit' },
  { id: 'education', name: 'Éducation', icon: 'school' },
  { id: 'finance', name: 'Finance', icon: 'cash' },
  { id: 'commerce', name: 'Commerce', icon: 'cart' },
];

// Générer un ID unique
function generateId(): string {
  return `startup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function StartupCreationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    targetCardId?: string;
    targetCardTitle?: string;
    targetCardDesc?: string;
    missionCardId?: string;
    missionCardTitle?: string;
    missionCardDesc?: string;
  }>();

  const addStartup = useUserStore((state) => state.addStartup);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Reconstruire les cartes depuis les params
  const targetCard: TargetCard | undefined = params.targetCardId
    ? {
        id: params.targetCardId,
        category: 'demographic', // Default, actual category not passed
        title: params.targetCardTitle || '',
        description: params.targetCardDesc || '',
        rarity: 'common',
      }
    : undefined;

  const missionCard: MissionCard | undefined = params.missionCardId
    ? {
        id: params.missionCardId,
        category: 'efficiency', // Default, actual category not passed
        title: params.missionCardTitle || '',
        description: params.missionCardDesc || '',
        rarity: 'common',
      }
    : undefined;

  const hasCards = targetCard && missionCard;
  const isFormValid = name.trim() && description.trim() && selectedSector;

  const handleBack = () => {
    router.back();
  };

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSector(sectorId);
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
  };

  const handleCreate = async () => {
    if (!isFormValid || isCreating) return;

    setIsCreating(true);

    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Créer la startup
    const newStartup: Startup = {
      id: generateId(),
      name: name.trim(),
      sector: selectedSector,
      description: description.trim(),
      targetCard: targetCard,
      missionCard: missionCard,
      createdAt: Date.now(),
      tokensInvested: 0,
      level: 1,
    };

    // Ajouter au store
    addStartup(newStartup);

    // Naviguer vers la confirmation avec les détails
    router.push({
      pathname: '/(startup)/confirmation',
      params: {
        startupName: newStartup.name,
        startupSector: newStartup.sector,
      },
    });
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + SPACING[4],
            paddingBottom: insets.bottom + SPACING[4],
            paddingHorizontal: SPACING[4],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(500)}
            style={{ marginBottom: SPACING[6] }}
          >
            <Pressable
              onPress={handleBack}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.md,
                  color: COLORS.text,
                  marginLeft: SPACING[2],
                }}
              >
                Retour
              </Text>
            </Pressable>

            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES['2xl'],
                color: COLORS.text,
                marginBottom: SPACING[2],
              }}
            >
              Crée ta startup
            </Text>
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.base,
                color: COLORS.textSecondary,
              }}
            >
              Donne vie à ton idée d'entreprise
            </Text>
          </Animated.View>

          {/* Inspiration Cards Summary */}
          {hasCards && (
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              style={{ marginBottom: SPACING[4] }}
            >
              <Card style={{ backgroundColor: `${COLORS.primary}10` }}>
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.primary,
                    marginBottom: SPACING[2],
                  }}
                >
                  Tes cartes d'inspiration
                </Text>
                <View style={{ gap: SPACING[2] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
                    <Ionicons name="people" size={16} color={COLORS.events.quiz} />
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.sm,
                        color: COLORS.text,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bodySemiBold }}>Cible:</Text> {targetCard.title}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
                    <Ionicons name="flag" size={16} color={COLORS.events.funding} />
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.sm,
                        color: COLORS.text,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.bodySemiBold }}>Mission:</Text> {missionCard.title}
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          )}

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(500)}
            style={{ gap: SPACING[4], marginBottom: SPACING[6] }}
          >
            <Input
              label="Nom de ta startup"
              placeholder="Ex: EcoFarm, HealthTech..."
              value={name}
              onChangeText={setName}
              maxLength={30}
            />

            <Input
              label="Description"
              placeholder={
                hasCards
                  ? `Comment ${targetCard.title.toLowerCase()} peuvent-ils ${missionCard.title.toLowerCase()} ?`
                  : 'Décris ce que fait ta startup en une phrase...'
              }
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={150}
            />
          </Animated.View>

          {/* Sector Selection */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={{ marginBottom: SPACING[6] }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginBottom: SPACING[3],
              }}
            >
              Secteur d'activité
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: SPACING[3],
              }}
            >
              {SECTORS.map((sector) => (
                <Pressable
                  key={sector.id}
                  onPress={() => handleSectorSelect(sector.id)}
                  style={{ width: '30%' }}
                >
                  <Card
                    style={{
                      alignItems: 'center',
                      borderWidth: selectedSector === sector.id ? 2 : 0,
                      borderColor: COLORS.primary,
                      backgroundColor:
                        selectedSector === sector.id ? `${COLORS.primary}10` : COLORS.card,
                    }}
                  >
                    <Ionicons
                      name={sector.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={selectedSector === sector.id ? COLORS.primary : COLORS.text}
                    />
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.xs,
                        color: selectedSector === sector.id ? COLORS.primary : COLORS.text,
                        marginTop: SPACING[2],
                        textAlign: 'center',
                      }}
                    >
                      {sector.name}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Create Button */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Button
              title={isCreating ? 'Création...' : 'Créer ma startup'}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isFormValid || isCreating}
              onPress={handleCreate}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
