/**
 * game-result - Écran de fin de partie
 *
 * Affiche: gagnant, XP, valorisation projet, cagnotte (online), classement
 * Boutons: Nouvelle partie, Retour à l'accueil
 * ConvertGuestPopup pour invités
 */

import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withTiming,
  withDelay,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Avatar } from '@/components/ui/Avatar';
import { useGameStore, useAuthStore, useUserStore } from '@/stores';

// Couleurs des joueurs
const PLAYER_COLORS: Record<string, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#FF6B6B',
};

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    gameId: string;
    mode?: string;
    isOnline?: string;
  }>();

  const { game, resetGame } = useGameStore();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  const isGuest = user?.isGuest ?? true;
  const isOnline = params.isOnline === 'true' || params.mode === 'online';

  const [showConvertPopup, setShowConvertPopup] = useState(false);

  // Animation values
  const xpAnimValue = useSharedValue(0);
  const valorisationAnimValue = useSharedValue(0);

  // Données du gagnant
  const winner = game?.players.find((p) => p.id === game.winner);
  const sortedPlayers =
    game?.players.slice().sort((a, b) => b.tokens - a.tokens) ?? [];

  // Calculs XP et valorisation (simulation)
  const xpGained = winner ? Math.floor(winner.tokens * 0.5) : 0;
  const xpDetails = {
    victoire: winner?.id === (profile?.userId ?? user?.id) ? 100 : 0,
    jetons: Math.floor((winner?.tokens ?? 0) * 0.3),
    questions: Math.floor(Math.random() * 50) + 20,
  };

  const valorisationBefore = profile?.startups?.[0]?.tokensInvested ?? 50000;
  const valorisationGain = isOnline ? xpGained * 100 : xpGained * 50;
  const valorisationAfter = valorisationBefore + valorisationGain;

  // Cagnotte (online seulement)
  const cagnotte = isOnline ? (game?.players.length ?? 0) * 100 : 0;

  // Animations au mount
  useEffect(() => {
    xpAnimValue.value = withDelay(
      500,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
    valorisationAnimValue.value = withDelay(
      800,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const xpStyle = useAnimatedStyle(() => ({
    opacity: xpAnimValue.value,
    transform: [{ scale: 0.8 + xpAnimValue.value * 0.2 }],
  }));

  const valorisationStyle = useAnimatedStyle(() => ({
    opacity: valorisationAnimValue.value,
    transform: [{ translateY: (1 - valorisationAnimValue.value) * 20 }],
  }));

  const handlePlayAgain = () => {
    resetGame();
    router.replace('/(game)/mode-selection');
  };

  const handleGoHome = () => {
    if (isGuest) {
      setShowConvertPopup(true);
    } else {
      resetGame();
      router.replace('/(tabs)/home');
    }
  };

  const handleConvert = () => {
    setShowConvertPopup(false);
    resetGame();
    router.replace('/(auth)/register');
  };

  const handleSkipConvert = () => {
    setShowConvertPopup(false);
    resetGame();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0C243E' }}>
      {/* Background */}
      <LinearGradient
        colors={['#194F8A', '#0C243E']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Lumière dorée animée */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(1000)}
        style={{
          position: 'absolute',
          top: -50,
          left: '50%',
          marginLeft: -150,
          width: 300,
          height: 300,
          opacity: 0.4,
        }}
      >
        <Svg width="300" height="300">
          <Defs>
            <RadialGradient id="victoryGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFBC40" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#FFBC40" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="150" fill="url(#victoryGrad)" />
        </Svg>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + SPACING[4],
          paddingBottom: insets.bottom + SPACING[6],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec trophée */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={{ alignItems: 'center', marginBottom: SPACING[6] }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#FFBC40',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: SPACING[4],
              shadowColor: '#FFBC40',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
            }}
          >
            <Ionicons name="trophy" size={50} color="#0C243E" />
          </View>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['3xl'],
              color: COLORS.text,
              textAlign: 'center',
            }}
          >
            Partie terminée !
          </Text>
        </Animated.View>

        {/* Carte du gagnant */}
        {winner && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              padding: SPACING[5],
              marginBottom: SPACING[4],
              borderWidth: 2,
              borderColor: PLAYER_COLORS[winner.color] || '#FFBC40',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
                marginBottom: SPACING[3],
              }}
            >
              🏆 Vainqueur
            </Text>

            <Avatar
              name={winner.name}
              playerColor={winner.color}
              size="lg"
              showBorder
            />

            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.xl,
                color: PLAYER_COLORS[winner.color] || COLORS.text,
                marginTop: SPACING[3],
              }}
            >
              {winner.name}
            </Text>

            {winner.startupName && (
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                  marginTop: SPACING[1],
                }}
              >
                {winner.startupName}
              </Text>
            )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: SPACING[3],
                backgroundColor: 'rgba(255, 188, 64, 0.2)',
                paddingHorizontal: SPACING[4],
                paddingVertical: SPACING[2],
                borderRadius: 20,
              }}
            >
              <Ionicons name="cash" size={20} color="#FFBC40" />
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: FONT_SIZES.lg,
                  color: '#FFBC40',
                  marginLeft: SPACING[2],
                }}
              >
                {winner.tokens} jetons
              </Text>
            </View>
          </Animated.View>
        )}

        {/* XP gagnée */}
        <Animated.View
          style={[
            xpStyle,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: SPACING[4],
              marginBottom: SPACING[4],
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING[3],
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
              }}
            >
              XP gagnée
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                paddingHorizontal: SPACING[3],
                paddingVertical: SPACING[1],
                borderRadius: 12,
              }}
            >
              <Ionicons name="star" size={16} color="#4CAF50" />
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: FONT_SIZES.lg,
                  color: '#4CAF50',
                  marginLeft: SPACING[1],
                }}
              >
                +{xpGained} XP
              </Text>
            </View>
          </View>

          <View style={{ gap: SPACING[2] }}>
            {xpDetails.victoire > 0 && (
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textSecondary,
                  }}
                >
                  Victoire
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.text,
                  }}
                >
                  +{xpDetails.victoire}
                </Text>
              </View>
            )}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                }}
              >
                Jetons collectés
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.text,
                }}
              >
                +{xpDetails.jetons}
              </Text>
            </View>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                }}
              >
                Questions réussies
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.text,
                }}
              >
                +{xpDetails.questions}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Valorisation du projet */}
        <Animated.View
          style={[
            valorisationStyle,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: SPACING[4],
              marginBottom: SPACING[4],
            },
          ]}
        >
          <Text
            style={{
              fontFamily: FONTS.bodySemiBold,
              fontSize: FONT_SIZES.md,
              color: COLORS.text,
              marginBottom: SPACING[3],
            }}
          >
            Valorisation du projet
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING[1],
                }}
              >
                Avant
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: COLORS.text,
                }}
              >
                {valorisationBefore.toLocaleString('fr-FR')} €
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Ionicons name="arrow-forward" size={24} color="#4CAF50" />
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: FONT_SIZES.sm,
                  color: '#4CAF50',
                }}
              >
                +{valorisationGain.toLocaleString('fr-FR')} €
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.xs,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING[1],
                }}
              >
                Après
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.bodyBold,
                  fontSize: FONT_SIZES.md,
                  color: '#4CAF50',
                }}
              >
                {valorisationAfter.toLocaleString('fr-FR')} €
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Cagnotte (online only) */}
        {isOnline && cagnotte > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(500)}
            style={{
              backgroundColor: 'rgba(255, 188, 64, 0.15)',
              borderRadius: 16,
              padding: SPACING[4],
              marginBottom: SPACING[4],
              borderWidth: 1,
              borderColor: 'rgba(255, 188, 64, 0.3)',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="gift" size={24} color="#FFBC40" />
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: COLORS.text,
                  marginLeft: SPACING[3],
                }}
              >
                Cagnotte
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONTS.bodyBold,
                fontSize: FONT_SIZES.lg,
                color: '#FFBC40',
              }}
            >
              {cagnotte} jetons
            </Text>
          </Animated.View>
        )}

        {/* Classement */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(500)}
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
            Classement
          </Text>

          <View style={{ gap: SPACING[2] }}>
            {sortedPlayers.map((player, index) => (
              <View
                key={player.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: SPACING[3],
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderLeftWidth: 4,
                  borderLeftColor: PLAYER_COLORS[player.color] || '#FFBC40',
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.lg,
                    color: index === 0 ? '#FFBC40' : COLORS.text,
                    width: 30,
                  }}
                >
                  {index + 1}
                </Text>

                <Avatar name={player.name} playerColor={player.color} size="sm" />

                <View style={{ flex: 1, marginLeft: SPACING[3] }}>
                  <Text
                    style={{
                      fontFamily: FONTS.bodySemiBold,
                      fontSize: FONT_SIZES.base,
                      color: COLORS.text,
                    }}
                  >
                    {player.name}
                  </Text>
                  {player.startupName && (
                    <Text
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: FONT_SIZES.xs,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {player.startupName}
                    </Text>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={{
                      fontFamily: FONTS.bodyBold,
                      fontSize: FONT_SIZES.base,
                      color: '#FFBC40',
                    }}
                  >
                    {player.tokens}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: FONT_SIZES.xs,
                      color: COLORS.textSecondary,
                    }}
                  >
                    jetons
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Boutons */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(600)}
          style={{ gap: SPACING[3] }}
        >
          <Pressable onPress={handlePlayAgain}>
            <LinearGradient
              colors={['#FFBC40', '#F5A623']}
              style={{
                paddingVertical: SPACING[4],
                borderRadius: 16,
                alignItems: 'center',
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: '#0C243E',
                }}
              >
                Nouvelle partie
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleGoHome}
            style={{
              paddingVertical: SPACING[4],
              borderRadius: 16,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.bodySemiBold,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
              }}
            >
              Retour à l'accueil
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* ConvertGuestPopup */}
      <Modal
        visible={showConvertPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConvertPopup(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: SPACING[4],
          }}
        >
          <View
            style={{
              backgroundColor: '#0C243E',
              borderRadius: 20,
              padding: SPACING[6],
              width: '100%',
              maxWidth: 340,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 188, 64, 0.2)',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255, 188, 64, 0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="person-add" size={32} color="#FFBC40" />
            </View>

            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.xl,
                color: COLORS.text,
                textAlign: 'center',
                marginBottom: SPACING[2],
              }}
            >
              Sauvegarder ta progression ?
            </Text>

            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: SPACING[5],
              }}
            >
              Crée un compte pour conserver tes XP, ton projet et accéder au mode
              en ligne !
            </Text>

            <Pressable
              onPress={handleConvert}
              style={{
                width: '100%',
                backgroundColor: '#FFBC40',
                paddingVertical: SPACING[3],
                borderRadius: 12,
                marginBottom: SPACING[3],
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.bodySemiBold,
                  fontSize: FONT_SIZES.md,
                  color: '#0C243E',
                  textAlign: 'center',
                }}
              >
                Créer un compte
              </Text>
            </Pressable>

            <Pressable onPress={handleSkipConvert}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                }}
              >
                Plus tard
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
