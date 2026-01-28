import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useSettingsStore } from '@/stores';
import type { TargetCard, MissionCard } from '@/types';

// Données des cartes cibles
const TARGET_CARDS: TargetCard[] = [
  // Démographiques
  { id: 't1', category: 'demographic', title: 'Étudiants', description: 'Jeunes de 18-25 ans en formation', rarity: 'common' },
  { id: 't2', category: 'demographic', title: 'Familles', description: 'Parents avec enfants', rarity: 'common' },
  { id: 't3', category: 'demographic', title: 'Seniors', description: 'Personnes de plus de 60 ans', rarity: 'common' },
  { id: 't4', category: 'demographic', title: 'Millennials', description: 'Génération connectée (25-40 ans)', rarity: 'common' },
  // Géographiques
  { id: 't5', category: 'geographic', title: 'Ruraux', description: 'Habitants des zones rurales', rarity: 'common' },
  { id: 't6', category: 'geographic', title: 'Urbains', description: 'Citadins des grandes villes', rarity: 'common' },
  { id: 't7', category: 'geographic', title: 'Diaspora', description: 'Africains vivant à l\'étranger', rarity: 'rare' },
  // Activités
  { id: 't8', category: 'activity', title: 'Entrepreneurs', description: 'Créateurs d\'entreprises', rarity: 'rare' },
  { id: 't9', category: 'activity', title: 'Artisans', description: 'Travailleurs manuels qualifiés', rarity: 'common' },
  { id: 't10', category: 'activity', title: 'Commerçants', description: 'Vendeurs et boutiquiers', rarity: 'common' },
  { id: 't11', category: 'activity', title: 'Agriculteurs', description: 'Producteurs agricoles', rarity: 'common' },
  // Socio-économiques
  { id: 't12', category: 'socioeconomic', title: 'Non-bancarisés', description: 'Sans compte bancaire', rarity: 'rare' },
  { id: 't13', category: 'socioeconomic', title: 'PME', description: 'Petites et moyennes entreprises', rarity: 'rare' },
  { id: 't14', category: 'socioeconomic', title: 'Classe moyenne', description: 'Pouvoir d\'achat modéré', rarity: 'common' },
  { id: 't15', category: 'socioeconomic', title: 'Startups', description: 'Jeunes entreprises innovantes', rarity: 'legendary' },
];

// Données des cartes missions
const MISSION_CARDS: MissionCard[] = [
  // Efficacité
  { id: 'm1', category: 'efficiency', title: 'Gagner du temps', description: 'Simplifier une tâche quotidienne', rarity: 'common' },
  { id: 'm2', category: 'efficiency', title: 'Réduire les coûts', description: 'Diminuer les dépenses', rarity: 'common' },
  { id: 'm3', category: 'efficiency', title: 'Automatiser', description: 'Remplacer les tâches répétitives', rarity: 'rare' },
  // Social
  { id: 'm4', category: 'social', title: 'Connecter', description: 'Créer des liens entre personnes', rarity: 'common' },
  { id: 'm5', category: 'social', title: 'Éduquer', description: 'Former et enseigner', rarity: 'common' },
  { id: 'm6', category: 'social', title: 'Soigner', description: 'Améliorer la santé', rarity: 'rare' },
  { id: 'm7', category: 'social', title: 'Nourrir', description: 'Améliorer l\'accès alimentaire', rarity: 'common' },
  // Innovation
  { id: 'm8', category: 'innovation', title: 'Digitaliser', description: 'Moderniser avec la technologie', rarity: 'rare' },
  { id: 'm9', category: 'innovation', title: 'Sécuriser', description: 'Protéger les biens et données', rarity: 'rare' },
  { id: 'm10', category: 'innovation', title: 'Tracker', description: 'Suivre et mesurer', rarity: 'common' },
  // Africain
  { id: 'm11', category: 'african', title: 'Mobile Money', description: 'Faciliter les paiements mobiles', rarity: 'rare' },
  { id: 'm12', category: 'african', title: 'Logistique', description: 'Améliorer la livraison', rarity: 'common' },
  { id: 'm13', category: 'african', title: 'Énergie', description: 'Accès à l\'électricité', rarity: 'legendary' },
  { id: 'm14', category: 'african', title: 'Eau potable', description: 'Accès à l\'eau propre', rarity: 'legendary' },
  { id: 'm15', category: 'african', title: 'Inclusion financière', description: 'Accès aux services bancaires', rarity: 'rare' },
];

// Couleurs par catégorie de carte
const CATEGORY_COLORS = {
  target: {
    demographic: '#3B82F6', // blue
    geographic: '#10B981', // green
    activity: '#F59E0B', // amber
    socioeconomic: '#8B5CF6', // purple
  },
  mission: {
    efficiency: '#EF4444', // red
    social: '#EC4899', // pink
    innovation: '#6366F1', // indigo
    african: '#F97316', // orange
  },
};

// Couleurs par rareté
const RARITY_COLORS = {
  common: COLORS.textSecondary,
  rare: '#3B82F6',
  legendary: '#F59E0B',
};

// Fonction pour tirer une carte aléatoire (pondérée par rareté)
function drawRandomCard<T extends { rarity: 'common' | 'rare' | 'legendary' }>(cards: T[]): T {
  const weights = { common: 70, rare: 25, legendary: 5 };
  const weightedCards: T[] = [];

  for (const card of cards) {
    const weight = weights[card.rarity];
    for (let i = 0; i < weight; i++) {
      weightedCards.push(card);
    }
  }

  return weightedCards[Math.floor(Math.random() * weightedCards.length)];
}

export default function InspirationCardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [targetCard, setTargetCard] = useState<TargetCard | null>(null);
  const [missionCard, setMissionCard] = useState<MissionCard | null>(null);
  const [isDrawingTarget, setIsDrawingTarget] = useState(false);
  const [isDrawingMission, setIsDrawingMission] = useState(false);

  // Animation values
  const targetRotation = useSharedValue(0);
  const targetScale = useSharedValue(1);
  const missionRotation = useSharedValue(0);
  const missionScale = useSharedValue(1);

  const canContinue = targetCard && missionCard;

  const handleBack = () => {
    router.back();
  };

  const completeTargetDraw = useCallback(() => {
    const card = drawRandomCard(TARGET_CARDS);
    setTargetCard(card);
    setIsDrawingTarget(false);
  }, []);

  const completeMissionDraw = useCallback(() => {
    const card = drawRandomCard(MISSION_CARDS);
    setMissionCard(card);
    setIsDrawingMission(false);
  }, []);

  const handleDrawTarget = () => {
    if (isDrawingTarget) return;
    setIsDrawingTarget(true);

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Flip animation
    targetRotation.value = withSequence(
      withTiming(180, { duration: 200 }),
      withTiming(360, { duration: 200 })
    );
    targetScale.value = withSequence(
      withTiming(0.95, { duration: 150 }),
      withSpring(1, { damping: 10 }, () => {
        runOnJS(completeTargetDraw)();
      })
    );
  };

  const handleDrawMission = () => {
    if (isDrawingMission) return;
    setIsDrawingMission(true);

    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Flip animation
    missionRotation.value = withSequence(
      withTiming(180, { duration: 200 }),
      withTiming(360, { duration: 200 })
    );
    missionScale.value = withSequence(
      withTiming(0.95, { duration: 150 }),
      withSpring(1, { damping: 10 }, () => {
        runOnJS(completeMissionDraw)();
      })
    );
  };

  const handleContinue = () => {
    if (!canContinue) return;

    // Passer les données à l'écran de création via les params de route
    router.push({
      pathname: '/(startup)/creation',
      params: {
        targetCardId: targetCard.id,
        targetCardTitle: targetCard.title,
        targetCardDesc: targetCard.description,
        missionCardId: missionCard.id,
        missionCardTitle: missionCard.title,
        missionCardDesc: missionCard.description,
      },
    });
  };

  const targetAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${targetRotation.value}deg` },
      { scale: targetScale.value },
    ],
  }));

  const missionAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${missionRotation.value}deg` },
      { scale: missionScale.value },
    ],
  }));

  const getCategoryColor = (type: 'target' | 'mission', category: string) => {
    const colors = type === 'target' ? CATEGORY_COLORS.target : CATEGORY_COLORS.mission;
    return colors[category as keyof typeof colors] || COLORS.primary;
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[4],
          paddingHorizontal: SPACING[4],
        }}
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
            <Ionicons name="close" size={24} color={COLORS.text} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginLeft: SPACING[2],
              }}
            >
              Annuler
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
            Cartes d'inspiration
          </Text>
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.base,
              color: COLORS.textSecondary,
            }}
          >
            Tire des cartes pour trouver l'idée de ta startup
          </Text>
        </Animated.View>

        {/* Cards */}
        <View style={{ flex: 1, gap: SPACING[4] }}>
          {/* Target Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Pressable onPress={handleDrawTarget} disabled={isDrawingTarget}>
              <Animated.View style={targetAnimStyle}>
                <Card
                  variant="elevated"
                  padding={5}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: targetCard
                      ? getCategoryColor('target', targetCard.category)
                      : COLORS.events.quiz,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[3] }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: targetCard
                          ? getCategoryColor('target', targetCard.category)
                          : COLORS.events.quiz,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: SPACING[3],
                      }}
                    >
                      <Ionicons name="people" size={20} color={COLORS.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.title,
                          fontSize: FONT_SIZES.lg,
                          color: COLORS.text,
                        }}
                      >
                        Carte Cible
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textSecondary,
                        }}
                      >
                        Qui sera ton client ?
                      </Text>
                    </View>
                    {targetCard && (
                      <View
                        style={{
                          paddingHorizontal: SPACING[2],
                          paddingVertical: SPACING[1],
                          borderRadius: 4,
                          backgroundColor: `${RARITY_COLORS[targetCard.rarity]}20`,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.bodySemiBold,
                            fontSize: FONT_SIZES.xs,
                            color: RARITY_COLORS[targetCard.rarity],
                            textTransform: 'capitalize',
                          }}
                        >
                          {targetCard.rarity === 'legendary' ? 'Légendaire' : targetCard.rarity === 'rare' ? 'Rare' : 'Commune'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {targetCard ? (
                    <View
                      style={{
                        padding: SPACING[4],
                        backgroundColor: COLORS.card,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.title,
                          fontSize: FONT_SIZES.lg,
                          color: COLORS.text,
                          textAlign: 'center',
                          marginBottom: SPACING[1],
                        }}
                      >
                        {targetCard.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textSecondary,
                          textAlign: 'center',
                        }}
                      >
                        {targetCard.description}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.md,
                        color: COLORS.text,
                        textAlign: 'center',
                        padding: SPACING[4],
                        backgroundColor: COLORS.card,
                        borderRadius: 8,
                      }}
                    >
                      {isDrawingTarget ? '✨ Tirage...' : 'Appuie pour tirer une carte'}
                    </Text>
                  )}
                </Card>
              </Animated.View>
            </Pressable>
          </Animated.View>

          {/* Mission Card */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Pressable onPress={handleDrawMission} disabled={isDrawingMission}>
              <Animated.View style={missionAnimStyle}>
                <Card
                  variant="elevated"
                  padding={5}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: missionCard
                      ? getCategoryColor('mission', missionCard.category)
                      : COLORS.events.funding,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING[3] }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: missionCard
                          ? getCategoryColor('mission', missionCard.category)
                          : COLORS.events.funding,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: SPACING[3],
                      }}
                    >
                      <Ionicons name="flag" size={20} color={COLORS.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.title,
                          fontSize: FONT_SIZES.lg,
                          color: COLORS.text,
                        }}
                      >
                        Carte Mission
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textSecondary,
                        }}
                      >
                        Quel problème résoudre ?
                      </Text>
                    </View>
                    {missionCard && (
                      <View
                        style={{
                          paddingHorizontal: SPACING[2],
                          paddingVertical: SPACING[1],
                          borderRadius: 4,
                          backgroundColor: `${RARITY_COLORS[missionCard.rarity]}20`,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: FONTS.bodySemiBold,
                            fontSize: FONT_SIZES.xs,
                            color: RARITY_COLORS[missionCard.rarity],
                            textTransform: 'capitalize',
                          }}
                        >
                          {missionCard.rarity === 'legendary' ? 'Légendaire' : missionCard.rarity === 'rare' ? 'Rare' : 'Commune'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {missionCard ? (
                    <View
                      style={{
                        padding: SPACING[4],
                        backgroundColor: COLORS.card,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.title,
                          fontSize: FONT_SIZES.lg,
                          color: COLORS.text,
                          textAlign: 'center',
                          marginBottom: SPACING[1],
                        }}
                      >
                        {missionCard.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: FONT_SIZES.sm,
                          color: COLORS.textSecondary,
                          textAlign: 'center',
                        }}
                      >
                        {missionCard.description}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.md,
                        color: COLORS.text,
                        textAlign: 'center',
                        padding: SPACING[4],
                        backgroundColor: COLORS.card,
                        borderRadius: 8,
                      }}
                    >
                      {isDrawingMission ? '✨ Tirage...' : 'Appuie pour tirer une carte'}
                    </Text>
                  )}
                </Card>
              </Animated.View>
            </Pressable>
          </Animated.View>

          {/* Tip when both cards are drawn */}
          {canContinue && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Card style={{ backgroundColor: `${COLORS.success}15` }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING[2] }}>
                  <Ionicons name="bulb" size={20} color={COLORS.success} />
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.sm,
                      color: COLORS.success,
                      flex: 1,
                    }}
                  >
                    Combine ces deux cartes pour créer ta startup !
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}
        </View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Button
            title="Continuer"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!canContinue}
            onPress={handleContinue}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
