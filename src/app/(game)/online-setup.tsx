/**
 * OnlineSetupScreen - Écran de configuration multijoueur online
 *
 * Permet de créer une nouvelle salle ou de rejoindre une salle existante
 * via un code à 6 caractères.
 */

import { useState, useCallback } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslation } from '@/i18n';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { JoinRoomError, getJoinRoomErrorDisplay } from '@/services/multiplayer/JoinRoomError';

export default function OnlineSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { user } = useAuthStore();
  const {
    createRoom,
    joinRoom,
    isLoading,
    error,
    clearError,
  } = useMultiplayer(user?.id ?? null);

  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(user?.displayName ?? 'Joueur');

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleCreateRoom = useCallback(async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('game.mustBeLoggedInCreate'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await createRoom({
      edition: 'classic',
      maxPlayers: 4,
      hostName: user.displayName ?? 'Hôte',
    });

    if (result) {
      router.push({
        pathname: '/(game)/lobby/[roomId]',
        params: { roomId: result.roomId, code: result.code, isHost: 'true' },
      });
    }
  }, [user, createRoom, router]);

  const handleJoinRoom = useCallback(async () => {
    if (!roomCode.trim()) {
      Alert.alert(t('game.codeRequired'), t('game.enterRoomCode'));
      return;
    }

    if (!user) {
      Alert.alert(t('common.error'), t('game.mustBeLoggedInJoin'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await joinRoom(roomCode.toUpperCase(), playerName);

      if (result) {
        router.push({
          pathname: '/(game)/lobby/[roomId]',
          params: { roomId: result.roomId, code: roomCode.toUpperCase(), isHost: 'false' },
        });
      } else {
        const { title, message } = getJoinRoomErrorDisplay('ROOM_NOT_FOUND');
        Alert.alert(title, message);
      }
    } catch (err) {
      const code = err instanceof JoinRoomError ? err.code : 'UNKNOWN';
      const { title, message } = getJoinRoomErrorDisplay(code);
      Alert.alert(title, message);
    }
  }, [roomCode, playerName, user, joinRoom, router]);

  // Afficher l'erreur si présente
  if (error) {
    Alert.alert(t('common.error'), error, [
      { text: 'OK', onPress: clearError },
    ]);
  }

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
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.md,
                color: COLORS.text,
                marginLeft: SPACING[2],
              }}
            >
              {t('common.back')}
            </Text>
          </Pressable>

          <Text
            style={{
              fontFamily: FONTS.title,
              fontSize: FONT_SIZES['2xl'],
              color: COLORS.text,
            }}
          >
            {t('home.onlineMode')}
          </Text>
        </Animated.View>

        {/* Create Room */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={{ marginBottom: SPACING[6] }}
        >
          <Card variant="elevated" padding={5}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: COLORS.events.funding,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="add-circle" size={32} color={COLORS.white} />
            </View>

            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.lg,
                color: COLORS.text,
                textAlign: 'center',
                marginBottom: SPACING[2],
              }}
            >
              {t('game.createGame')}
            </Text>

            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: SPACING[4],
              }}
            >
              {t('game.createRoomLongDesc')}
            </Text>

            <Button
              title={t('game.createRoomBtn')}
              variant="primary"
              fullWidth
              loading={isLoading}
              onPress={handleCreateRoom}
            />
          </Card>
        </Animated.View>

        {/* Divider */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: SPACING[6],
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: COLORS.border,
            }}
          />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: FONT_SIZES.sm,
              color: COLORS.textSecondary,
              marginHorizontal: SPACING[4],
            }}
          >
            {t('common.or')}
          </Text>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: COLORS.border,
            }}
          />
        </Animated.View>

        {/* Join Room */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Card variant="elevated" padding={5}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: COLORS.events.opportunity,
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                marginBottom: SPACING[4],
              }}
            >
              <Ionicons name="enter" size={32} color={COLORS.white} />
            </View>

            <Text
              style={{
                fontFamily: FONTS.title,
                fontSize: FONT_SIZES.lg,
                color: COLORS.text,
                textAlign: 'center',
                marginBottom: SPACING[2],
              }}
            >
              {t('game.joinGame')}
            </Text>

            <Text
              style={{
                fontFamily: FONTS.body,
                fontSize: FONT_SIZES.sm,
                color: COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: SPACING[4],
              }}
            >
              {t('game.joinRoomLongDesc')}
            </Text>

            <Input
              placeholder={t('game.yourNickname')}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={20}
              containerStyle={{ marginBottom: SPACING[3] }}
            />

            <Input
              placeholder={t('game.roomCodePlaceholder')}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              containerStyle={{ marginBottom: SPACING[4] }}
            />

            <Button
              title={t('game.joinBtn')}
              variant="outline"
              fullWidth
              loading={isLoading}
              disabled={!roomCode.trim() || !playerName.trim()}
              onPress={handleJoinRoom}
            />
          </Card>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
