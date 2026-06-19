/**
 * quick-match - Matchmaking rapide
 *
 * Flow :
 * 1. L'utilisateur choisit maxPlayers (2/3/4, défaut 2) et sa startup
 * 2. Dépôt d'un ticket dans la file d'attente matchmaking (Realtime DB)
 * 3. Le hook useQuickMatch détecte N joueurs compatibles, lock les tickets, crée la room
 * 4. Redirection directe vers game-preparation quand le match est prêt
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { StartupSelectionModal } from '@/components/game/StartupSelectionModal';
import { getDefaultProjectsForEdition, getMatchingUserStartups, getSectorEdition } from '@/data/defaultProjects';
import { useQuickMatch } from '@/hooks/useQuickMatch';
import { useTranslation } from '@/i18n';
import { JoinRoomError, getJoinRoomErrorDisplay } from '@/services/multiplayer/JoinRoomError';
import { useAuthStore, useUserStore } from '@/stores';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import {
  STAKE_OPTIONS_PTW,
  stakePtwToFcfa,
  getStakableBalanceFcfa,
  canAffordStake,
} from '@/services/game/stakeService';
import { formatPtwRaw } from '@/utils/currency';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

type Phase = 'setup' | 'searching' | 'match-found' | 'joining';

const PLAYER_COUNT_OPTIONS: Array<2 | 3 | 4> = [2, 3, 4];

export default function QuickMatchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { challenge } = useLocalSearchParams<{ challenge?: string }>();
  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);

  const {
    state: matchState,
    foundTickets,
    elapsedSeconds,
    roomId,
    error,
    start,
    cancel,
  } = useQuickMatch();

  // Note : pour rejoindre la room en tant que non-lead, on utilise le singleton directement
  // (voir effet `joinAsGuest` plus bas)

  const [phase, setPhase] = useState<Phase>('setup');
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(2);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const [selectedStartupName, setSelectedStartupName] = useState<string | null>(null);
  const [selectedIsDefault, setSelectedIsDefault] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [showStartupModal, setShowStartupModal] = useState(false);
  const [matchFoundCountdown, setMatchFoundCountdown] = useState(3);
  const [stakePtw, setStakePtw] = useState<number>(0);

  const isGuest = user?.isGuest ?? true;
  const stakableBalanceFcfa = useMemo(
    () => getStakableBalanceFcfa(profile?.startups),
    [profile?.startups]
  );
  const stakeFcfa = stakePtwToFcfa(stakePtw);

  const edition = challenge || 'classic';
  const defaultProjects = useMemo(
    () => getDefaultProjectsForEdition(edition),
    [edition]
  );
  const userStartups = useMemo(
    () => getMatchingUserStartups(profile?.startups ?? [], edition),
    [profile?.startups, edition]
  );

  // Auto-sélection si une seule startup compatible disponible
  useEffect(() => {
    if (selectedStartupId) return;
    const s = userStartups[0];
    if (userStartups.length === 1 && defaultProjects.length === 0 && s) {
      setSelectedStartupId(s.id);
      setSelectedStartupName(s.name);
      setSelectedIsDefault(false);
      setSelectedSector(s.sector);
    }
  }, [userStartups, defaultProjects, selectedStartupId]);

  // Animation pulse
  const pulseValue = useSharedValue(1);
  useEffect(() => {
    if (phase === 'searching') {
      pulseValue.value = withRepeat(withTiming(1.15, { duration: 1000 }), -1, true);
    } else {
      pulseValue.value = 1;
    }
  }, [phase, pulseValue]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Sync du matchState vers la phase UI
  useEffect(() => {
    if (matchState === 'matched' && roomId) {
      setPhase('match-found');
      setMatchFoundCountdown(3);
    } else if (matchState === 'joining' && roomId) {
      // On a été matché par un autre lead, on doit rejoindre sa room
      setPhase('joining');
    }
  }, [matchState, roomId]);

  // Countdown "match trouvé" → redirection
  useEffect(() => {
    if (phase !== 'match-found' || !roomId) return undefined;

    if (matchFoundCountdown <= 0) {
      // Le host a déjà la room configurée (setup par tryCreateRoomFromTickets)
      // On va vers game-preparation en lui passant les infos
      router.replace({
        pathname: '/(game)/create-room',
        params: {
          roomId,
          isHost: 'true',
          quickMatch: 'true',
          ...(challenge ? { challenge } : {}),
        },
      });
      return undefined;
    }

    const t = setTimeout(() => {
      setMatchFoundCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, matchFoundCountdown, roomId, router, challenge]);

  // Redirection pour les non-lead quand leur ticket est marqué matched
  useEffect(() => {
    if (phase !== 'joining' || !roomId || !user) return;

    const joinAsGuest = async () => {
      const { multiplayerSync } = await import('@/services/multiplayer');
      try {
        await multiplayerSync.joinRoomById(roomId, {
          playerId: user.id,
          playerName: user.displayName ?? 'Joueur',
        });
        // Propager sa startup côté room
        if (selectedStartupId && selectedStartupName && selectedSector) {
          await multiplayerSync.setStartupSelection(
            selectedStartupId,
            selectedStartupName,
            selectedIsDefault,
            selectedSector
          );
        }
        // Nettoyer le ticket
        await cancel();

        router.replace({
          pathname: '/(game)/create-room',
          params: {
            roomId,
            isHost: 'false',
            quickMatch: 'true',
            ...(challenge ? { challenge } : {}),
          },
        });
      } catch (e) {
        console.error('[QuickMatch] Failed to join room by id', e);
        const code = e instanceof JoinRoomError ? e.code : 'UNKNOWN';
        const { title, message } = getJoinRoomErrorDisplay(code);
        Alert.alert(title, message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    };

    joinAsGuest();
  }, [phase, roomId, user, selectedStartupId, selectedStartupName, selectedIsDefault, selectedSector, cancel, router, challenge]);

  const handleStartupSelected = useCallback(
    (startupId: string, startupName: string, isDefault: boolean, sector: string) => {
      setSelectedStartupId(startupId);
      setSelectedStartupName(startupName);
      setSelectedIsDefault(isDefault);
      setSelectedSector(sector);
      setShowStartupModal(false);
    },
    []
  );

  const handleStartSearch = useCallback(async () => {
    if (!user) return;
    if (!selectedStartupId || !selectedStartupName || !selectedSector) {
      setShowStartupModal(true);
      return;
    }

    if (stakeFcfa > 0) {
      if (isGuest) {
        Alert.alert(t('game.stakeImpossible'), t('game.guestCannotStake'));
        return;
      }
      if (!canAffordStake(profile?.startups, stakeFcfa)) {
        Alert.alert(
          t('game.insufficientBalance'),
          t('game.insufficientBalanceDesc', { balance: formatPtwRaw(stakableBalanceFcfa) })
        );
        return;
      }
    }

    const derivedEdition = getSectorEdition(selectedSector);

    setPhase('searching');
    await start({
      userId: user.id,
      displayName: user.displayName ?? 'Joueur',
      avatarUrl: user.photoURL ?? null,
      maxPlayers,
      startupId: selectedStartupId,
      startupName: selectedStartupName,
      isDefaultProject: selectedIsDefault,
      sector: selectedSector,
      edition: derivedEdition,
      stake: stakeFcfa,
    });
  }, [user, selectedStartupId, selectedStartupName, selectedIsDefault, selectedSector, maxPlayers, stakeFcfa, isGuest, profile?.startups, stakableBalanceFcfa, start]);

  const handleCancel = useCallback(async () => {
    await cancel();
    setPhase('setup');
    setMatchFoundCountdown(3);
  }, [cancel]);

  const handleBack = useCallback(async () => {
    if (phase === 'searching' || phase === 'match-found') {
      await handleCancel();
    }
    router.back();
  }, [phase, handleCancel, router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const searchMessage = useMemo(() => {
    if (elapsedSeconds < 10) return t('game.searchingOpponents');
    if (elapsedSeconds < 30) return t('game.searchInProgress');
    if (elapsedSeconds < 60) return t('game.fewPlayersApproaching');
    return t('game.notManyPlayers');
  }, [elapsedSeconds, t]);

  const playersInQueue = foundTickets.length;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('game.quickMatchTitle')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + (phase === 'setup' ? 120 : 40),
            paddingHorizontal: SPACING[4],
          }}
        >
          {/* SETUP phase : sélecteur maxPlayers + startup */}
          {phase === 'setup' && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <DynamicGradientBorder
                borderRadius={20}
                fill="rgba(0, 0, 0, 0.35)"
                boxWidth={contentWidth}
              >
                <View style={styles.setupSection}>
                  <Ionicons name="flash" size={48} color="#FFBC40" />
                  <Text style={styles.setupTitle}>{t('game.readyToPlay')}</Text>
                  <Text style={styles.setupSubtitle}>
                    {t('game.choosePlayersAndStartup')}
                  </Text>
                </View>
              </DynamicGradientBorder>

              {/* maxPlayers */}
              <Text style={styles.sectionLabel}>{t('game.numberOfPlayers')}</Text>
              <View style={styles.playerCountRow}>
                {PLAYER_COUNT_OPTIONS.map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setMaxPlayers(n)}
                    style={{ flex: 1 }}
                  >
                    <DynamicGradientBorder
                      borderRadius={16}
                      fill={maxPlayers === n ? 'rgba(255, 188, 64, 0.2)' : 'rgba(0, 0, 0, 0.35)'}
                      boxWidth={(contentWidth - SPACING[3] * 2) / 3}
                    >
                      <View style={styles.playerCountCard}>
                        <Text
                          style={[
                            styles.playerCountNumber,
                            maxPlayers === n && { color: '#FFBC40' },
                          ]}
                        >
                          {n}
                        </Text>
                        <Text style={styles.playerCountLabel}>{t('game.playersLower')}</Text>
                      </View>
                    </DynamicGradientBorder>
                  </Pressable>
                ))}
              </View>

              {/* Startup selection */}
              <Text style={styles.sectionLabel}>{t('game.yourStartup')}</Text>
              <Pressable onPress={() => setShowStartupModal(true)}>
                <DynamicGradientBorder
                  borderRadius={16}
                  fill="rgba(0, 0, 0, 0.35)"
                  boxWidth={contentWidth}
                >
                  <View style={styles.startupCard}>
                    <View style={styles.startupIconWrap}>
                      <Ionicons
                        name={selectedStartupName ? 'rocket' : 'rocket-outline'}
                        size={24}
                        color={selectedStartupName ? '#FFBC40' : 'rgba(255,255,255,0.6)'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.startupName}>
                        {selectedStartupName || t('game.chooseStartup')}
                      </Text>
                      {selectedSector && (
                        <Text style={styles.startupSector}>{selectedSector}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                  </View>
                </DynamicGradientBorder>
              </Pressable>

              {/* Mise */}
              <Text style={styles.sectionLabel}>{t('game.stakePerPlayer')}</Text>
              <View style={styles.stakeRow}>
                {STAKE_OPTIONS_PTW.map((opt) => {
                  const optFcfa = stakePtwToFcfa(opt);
                  const affordable = opt === 0 || canAffordStake(profile?.startups, optFcfa);
                  const disabled = opt > 0 && (isGuest || !affordable);
                  const selected = stakePtw === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => !disabled && setStakePtw(opt)}
                      disabled={disabled}
                      style={[
                        styles.stakeChip,
                        selected && styles.stakeChipActive,
                        disabled && styles.stakeChipDisabled,
                      ]}
                    >
                      <Text style={[styles.stakeChipText, selected && styles.stakeChipTextActive]}>
                        {opt === 0 ? t('game.stakeNone') : `${opt}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.stakeHint}>
                {isGuest
                  ? t('game.guestsPlayNoStake')
                  : stakePtw > 0
                    ? t('game.balanceAndPot', { balance: formatPtwRaw(stakableBalanceFcfa), pot: formatPtwRaw(stakeFcfa * maxPlayers) })
                    : t('game.winnerTakesPot')}
              </Text>
            </Animated.View>
          )}

          {/* SEARCHING phase */}
          {phase === 'searching' && (
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <DynamicGradientBorder
                borderRadius={20}
                fill="rgba(0, 0, 0, 0.35)"
                boxWidth={contentWidth}
              >
                <View style={styles.searchSection}>
                  <Animated.View style={[pulseStyle, styles.searchIconContainer]}>
                    <ActivityIndicator size="large" color="#FFBC40" />
                  </Animated.View>
                  <Text style={styles.searchTitle}>{searchMessage}</Text>
                  <Text style={styles.searchSubtitle}>
                    {t('game.searchTime', { time: formatTime(elapsedSeconds) })}
                  </Text>
                  <Text style={[styles.searchSubtitle, { marginTop: 4 }]}>
                    {t('game.playersFound', { found: playersInQueue, max: maxPlayers })}
                  </Text>

                  <Pressable onPress={handleCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </Pressable>
                </View>
              </DynamicGradientBorder>

              {/* Liste des joueurs trouvés */}
              {foundTickets.length > 0 && (
                <View style={{ marginTop: SPACING[4], gap: SPACING[2] }}>
                  {foundTickets.slice(0, maxPlayers).map((ticket) => (
                    <Animated.View
                      key={ticket.id}
                      entering={FadeInDown.duration(300)}
                    >
                      <DynamicGradientBorder
                        borderRadius={16}
                        fill="rgba(0, 0, 0, 0.35)"
                        boxWidth={contentWidth}
                      >
                        <View style={styles.ticketRow}>
                          <Avatar
                            name={ticket.displayName}
                            playerColor="yellow"
                            size="sm"
                          />
                          <View style={{ flex: 1, marginLeft: SPACING[3] }}>
                            <Text style={styles.ticketName}>
                              {ticket.userId === user?.id ? t('game.you') : ticket.displayName}
                            </Text>
                            <Text style={styles.ticketStartup}>{ticket.startupName}</Text>
                          </View>
                        </View>
                      </DynamicGradientBorder>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* MATCH FOUND */}
          {(phase === 'match-found' || phase === 'joining') && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <DynamicGradientBorder
                borderRadius={20}
                fill="rgba(76, 175, 80, 0.15)"
                boxWidth={contentWidth}
              >
                <View style={styles.searchSection}>
                  <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                  <Text style={styles.searchTitle}>{t('game.matchFound')}</Text>
                  <Text style={styles.searchSubtitle}>
                    {phase === 'match-found'
                      ? t('game.launchingIn', { seconds: matchFoundCountdown })
                      : t('game.connectingToRoom')}
                  </Text>
                </View>
              </DynamicGradientBorder>
            </Animated.View>
          )}

          {/* ERROR */}
          {error && phase !== 'setup' && (
            <Animated.View entering={FadeInDown} style={{ marginTop: SPACING[4] }}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}
        </View>
      </View>

      {/* Bouton de lancement (phase setup uniquement) */}
      {phase === 'setup' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
          <GameButton
            variant="yellow"
            fullWidth
            title={t('game.startSearch')}
            onPress={handleStartSearch}
            disabled={!selectedStartupId}
          />
        </View>
      )}

      {/* Modal de sélection startup */}
      <StartupSelectionModal
        visible={showStartupModal}
        edition={edition}
        userStartups={userStartups}
        defaultProjects={defaultProjects}
        playerName={user?.displayName ?? undefined}
        onSelect={handleStartupSelected}
        onClose={() => setShowStartupModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  setupSection: {
    alignItems: 'center',
    padding: SPACING[5],
  },
  setupTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'white',
    marginTop: SPACING[3],
    marginBottom: SPACING[2],
  },
  setupSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: FONTS.title,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING[5],
    marginBottom: SPACING[3],
    letterSpacing: 0.5,
  },
  playerCountRow: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  stakeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  stakeChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  stakeChipActive: {
    borderColor: '#FFBC40',
    backgroundColor: 'rgba(255,188,64,0.15)',
  },
  stakeChipDisabled: {
    opacity: 0.35,
  },
  stakeChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  stakeChipTextActive: {
    color: '#FFBC40',
  },
  stakeHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.5)',
    marginTop: SPACING[2],
  },
  playerCountCard: {
    alignItems: 'center',
    paddingVertical: SPACING[4],
  },
  playerCountNumber: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: 'white',
  },
  playerCountLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  startupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    gap: SPACING[3],
  },
  startupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startupName: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: 'white',
  },
  startupSector: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  searchSection: {
    alignItems: 'center',
    padding: SPACING[5],
  },
  searchIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  searchTitle: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  searchSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: SPACING[4],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[5],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  cancelButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FF6B6B',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
  },
  ticketName: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: 'white',
  },
  ticketStartup: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
  },
});
