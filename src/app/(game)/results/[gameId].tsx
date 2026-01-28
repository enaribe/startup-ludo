import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useGameStore } from '@/stores';

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { game, resetGame } = useGameStore();

  const winner = game?.players.find((p) => p.id === game.winner);
  const sortedPlayers = game?.players
    .slice()
    .sort((a, b) => b.tokens - a.tokens) ?? [];

  const handlePlayAgain = () => {
    resetGame();
    router.replace('/(game)/mode-selection');
  };

  const handleGoHome = () => {
    resetGame();
    router.replace('/(tabs)/home');
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
          entering={FadeInDown.delay(100).duration(600)}
          style={{ alignItems: 'center', marginBottom: SPACING[8] }}
        >
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: COLORS.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: SPACING[4],
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
            }}
          >
            <Ionicons name="trophy" size={50} color={COLORS.background} />
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

        {/* Winner */}
        {winner && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(600)}
            style={{ marginBottom: SPACING[6] }}
          >
            <Card variant="elevated" padding={5} style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.sm,
                  color: COLORS.textSecondary,
                  marginBottom: SPACING[2],
                }}
              >
                Vainqueur
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
                  color: COLORS.players[winner.color],
                  marginTop: SPACING[3],
                }}
              >
                {winner.name}
              </Text>

              <Text
                style={{
                  fontFamily: FONTS.body,
                  fontSize: FONT_SIZES.base,
                  color: COLORS.primary,
                  marginTop: SPACING[1],
                }}
              >
                {winner.tokens} jetons
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Leaderboard */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(600)}
          style={{ flex: 1 }}
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
              <Card
                key={player.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderLeftWidth: 4,
                  borderLeftColor: COLORS.players[player.color],
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.title,
                    fontSize: FONT_SIZES.lg,
                    color: index === 0 ? COLORS.primary : COLORS.text,
                    width: 30,
                  }}
                >
                  {index + 1}
                </Text>

                <Avatar
                  name={player.name}
                  playerColor={player.color}
                  size="sm"
                />

                <Text
                  style={{
                    fontFamily: FONTS.bodySemiBold,
                    fontSize: FONT_SIZES.base,
                    color: COLORS.text,
                    flex: 1,
                    marginLeft: SPACING[3],
                  }}
                >
                  {player.name}
                </Text>

                <Text
                  style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: FONT_SIZES.base,
                    color: COLORS.primary,
                  }}
                >
                  {player.tokens}
                </Text>
              </Card>
            ))}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInUp.delay(700).duration(600)}
          style={{ gap: SPACING[3] }}
        >
          <Button
            title="Rejouer"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handlePlayAgain}
          />

          <Button
            title="Retour à l'accueil"
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleGoHome}
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
