/**
 * create-room - Creer un salon
 *
 * Phase 1: Formulaire de configuration (nom, joueurs)
 * Phase 2: Salle d'attente (lobby) avec code, liste joueurs, bouton demarrer
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StartupSelectionModal } from '@/components/game/StartupSelectionModal';
import { VersusBoard, type VersusPlayer } from '@/components/game/VersusBoard';
import { DynamicGradientBorder, GameButton, Modal, RadialBackground } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { EditionTileIcon } from '@/components/icons';
import { getDefaultProjectsForEdition, getMatchingUserStartups } from '@/data/defaultProjects';
import { getLocalizedEdition, type Edition } from '@/data/types';
import { SponsoredEditionPopup } from '@/components/game/popups';
import { useEditions } from '@/hooks';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useTranslation } from '@/i18n';
import { buildShareMessage } from '@/services/multiplayer/inviteLink';
import { InviteContactModal } from '@/components/game/InviteContactModal';
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
// Grille d'éditions 2 colonnes dans la popup (Modal size="lg" : maxWidth 500 / width 95%, body padding SPACING[5]).
const EDITION_TILE_GAP = 12;
const editionModalBodyWidth = Math.min(500, screenWidth * 0.95) - SPACING[5] * 2;
const editionTileWidth = (editionModalBodyWidth - EDITION_TILE_GAP) / 2;

export default function CreateRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const params = useLocalSearchParams<{
    challenge?: string;
    roomId?: string;
    code?: string;
    isHost?: string;
    quickMatch?: string;
    // Contexte PROGRAMME (salon d'un parcours).
    programId?: string;
    partnerId?: string;
    contentPackId?: string;
    levelIndex?: string;
  }>();

  const user = useAuthStore((state) => state.user);
  const profile = useUserStore((state) => state.profile);
  const {
    room,
    players,
    isLoading,
    roomClosed,
    createRoom,
    leaveRoom,
    setStartupSelection,
    startGame,
  } = useMultiplayer(user?.id ?? null);

  const isWaitingRoom = !!params.roomId;
  const isQuickMatch = params.quickMatch === 'true';
  // Salon PROGRAMME : l'édition est imposée par le contenu partenaire, l'hôte ne la choisit pas.
  // Parcours NORMAL (« Nouvelle partie ») : l'hôte choisit librement l'édition, comme en local.
  const isProgramRoom = !!params.programId;
  const [showLobby, setShowLobby] = useState(isWaitingRoom);
  const [showStartupModal, setShowStartupModal] = useState(false);
  const [showEditionModal, setShowEditionModal] = useState(false);
  const [showInviteContact, setShowInviteContact] = useState(false);
  const isGuest = user?.isGuest ?? true;

  // Helper function to format room code
  const formatRoomCode = (code: string) => {
    if (code.length >= 8) {
      return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    }
    return code;
  };

  // Form states
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<string>('4');
  // Édition choisie par l'hôte (parcours normal). Pré-remplie via params.challenge sinon 'classic'.
  const [selectedEdition, setSelectedEdition] = useState(params.challenge || 'classic');
  // Édition sponsorisée en attente de confirmation (popup « JOUER »).
  // Le modal de sélection est fermé AVANT d'ouvrir ce popup : jamais deux
  // modales natives empilées (bug Android : taps avalés).
  const [sponsorEdition, setSponsorEdition] = useState<Edition | null>(null);
  // Liste réactive : se met à jour dès que les éditions Firestore sont chargées.
  const editionList = useEditions();
  const selectedEditionData = useMemo(
    () => editionList.find((e) => e.id === selectedEdition),
    [editionList, selectedEdition]
  );
  // Mise choisie, en Ptw (0 = sans mise). Convertie en FCFA pour la room.
  const [stakePtw, setStakePtw] = useState<number>(0);

  // Solde misable du joueur = somme des valorisations de ses startups (FCFA).
  const stakableBalanceFcfa = useMemo(
    () => getStakableBalanceFcfa(profile?.startups),
    [profile?.startups]
  );
  const stakeFcfa = stakePtwToFcfa(stakePtw);
  const canAfford = canAffordStake(profile?.startups, stakeFcfa);
  const playersCountNum = parseInt(maxPlayers, 10);
  const potFcfa = stakeFcfa > 0 && playersCountNum >= 2 ? stakeFcfa * playersCountNum : 0;

  // Waiting room states
  const [roomCode, setRoomCode] = useState(params.code ? formatRoomCode(params.code) : '');
  const [currentRoomId, setCurrentRoomId] = useState(params.roomId || '');

  const playersList = useMemo(() => {
    return Object.entries(players).map(([playerId, player]) => ({
      ...player,
      playerId,
    }));
  }, [players]);

  // Présentation « VS » des joueurs de la salle d'attente
  const versusPlayers = useMemo<VersusPlayer[]>(
    () =>
      playersList.map((p) => ({
        name: p.displayName ?? p.name ?? 'Joueur',
        color: p.color,
        isAI: false,
        startupName: p.startupName ?? null,
      })),
    [playersList]
  );

  const allReady = useMemo(() => {
    if (playersList.length < 2) return false;
    return playersList.every((p) => p.isReady || p.isHost);
  }, [playersList]);

  // Edition et projets
  const edition = room?.edition ?? selectedEdition;
  const defaultProjects = useMemo(
    () => getDefaultProjectsForEdition(edition),
    [edition]
  );
  const userStartups = useMemo(
    () => getMatchingUserStartups(profile?.startups ?? [], edition),
    [profile?.startups, edition]
  );

  // Le joueur courant (host)
  const myPlayer = useMemo(
    () => (user?.id ? players[user.id] : null),
    [players, user?.id]
  );
  const hasSelectedStartup = !!myPlayer?.startupId;
  const startupModalAutoOpenedRef = useRef(false);

  const handleStartupSelected = useCallback(async (startupId: string, startupName: string, isDefault: boolean, sector: string) => {
    setShowStartupModal(false);
    await setStartupSelection(startupId, startupName, isDefault, sector);
  }, [setStartupSelection]);

  // Ouvre automatiquement le choix de projet dès que le joueur est dans le salon sans projet.
  useEffect(() => {
    if (startupModalAutoOpenedRef.current) return;
    if (showLobby && myPlayer && !hasSelectedStartup) {
      startupModalAutoOpenedRef.current = true;
      setShowStartupModal(true);
    }
  }, [showLobby, myPlayer, hasSelectedStartup]);

  // Listen for game start (room status change to 'playing')
  useEffect(() => {
    if (room?.status === 'playing' && room.gameId) {
      router.replace({
        pathname: '/(game)/game-preparation',
        params: { gameId: room.gameId, roomId: currentRoomId, mode: 'online' },
      });
    }
  }, [room?.status, room?.gameId, currentRoomId, router]);

  // Salon dissous par l'hôte : éjecter les joueurs non-hôtes
  useEffect(() => {
    if (roomClosed && params.isHost !== 'true') {
      Alert.alert(
        t('game.roomClosed'),
        t('game.hostLeftRoom'),
        [{ text: 'OK', onPress: () => router.replace('/(game)/online-hub') }]
      );
    }
  }, [roomClosed, params.isHost, router]);

  // Auto-start pour le match rapide :
  // En quick match, tous les joueurs ont déjà sélectionné leur startup avant la queue
  // (transmise via ticket). On attend juste que la room soit pleine (= maxPlayers atteint)
  // ET que tous aient leur startup, puis on lance automatiquement côté host.
  useEffect(() => {
    if (!isQuickMatch) return undefined;
    if (params.isHost !== 'true') return undefined; // seul le host lance
    if (!room) return undefined;

    const expectedPlayers = room.maxPlayers ?? room.gameSettings?.maxPlayers ?? 2;
    const allPresent = playersList.length >= expectedPlayers;
    const allHaveStartup = playersList.every((p) => !!p.startupId);

    if (allPresent && allHaveStartup) {
      const timer = setTimeout(() => {
        handleStartGame();
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuickMatch, params.isHost, room?.maxPlayers, playersList.length, playersList.map((p) => p.startupId).join('|')]);

  const handleBack = useCallback(() => {
    if (showLobby) {
      // In lobby: confirm leave
      Alert.alert(
        t('game.leaveRoom'),
        t('game.leaveRoomConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('game.leave'),
            style: 'destructive',
            onPress: async () => {
              await leaveRoom();
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [showLobby, leaveRoom, router]);

  const handleCreateRoom = useCallback(async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('game.mustBeLoggedIn'));
      return;
    }

    const playersCount = parseInt(maxPlayers, 10);
    if (isNaN(playersCount) || playersCount < 2 || playersCount > 4) {
      Alert.alert(t('common.error'), t('game.playersCountRange'));
      return;
    }

    if (!roomName.trim()) {
      Alert.alert(t('common.error'), t('game.enterRoomName'));
      return;
    }

    // Vérifications liées à la mise
    if (stakeFcfa > 0) {
      if (isGuest) {
        Alert.alert(t('game.stakeImpossible'), t('game.guestCannotStake'));
        return;
      }
      if (!canAfford) {
        Alert.alert(
          t('game.insufficientBalance'),
          t('game.insufficientBalanceDescDev', { balance: formatPtwRaw(stakableBalanceFcfa) })
        );
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await createRoom({
      edition: selectedEdition,
      maxPlayers: playersCount as 2 | 3 | 4,
      hostName: user.displayName ?? 'Hote',
      roomName: roomName.trim(),
      betAmount: stakeFcfa,
      // Salon PROGRAMME : porte le contexte pour que tous chargent le même contenu.
      ...(params.programId && params.partnerId
        ? {
            program: {
              programId: params.programId,
              partnerId: params.partnerId,
              contentPackId: params.contentPackId || undefined,
              levelIndex: params.levelIndex ? parseInt(params.levelIndex, 10) : 0,
            },
          }
        : {}),
    });

    if (result) {
      setRoomCode(formatRoomCode(result.code));
      setCurrentRoomId(result.roomId);
      setShowLobby(true);
    }
  }, [user, selectedEdition, maxPlayers, roomName, stakeFcfa, isGuest, canAfford, stakableBalanceFcfa, createRoom]);

  const handleCopyCode = useCallback(async () => {
    if (roomCode) {
      const codeWithoutDash = roomCode.replace('-', '');
      await Clipboard.setStringAsync(codeWithoutDash);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('game.copied'), t('game.codeCopied'));
    }
  }, [roomCode]);

  const handleShareCode = useCallback(async () => {
    if (roomCode) {
      try {
        const codeWithoutDash = roomCode.replace('-', '');
        await Share.share({
          message: buildShareMessage(codeWithoutDash),
        });
      } catch {
        // Share cancelled
      }
    }
  }, [roomCode]);

  const handleStartGame = useCallback(async () => {
    if (!allReady && playersList.length >= 2) {
      Alert.alert(t('game.warning'), t('game.allPlayersMustBeReady'));
      return;
    }

    if (playersList.length < 2) {
      Alert.alert(t('game.warning'), t('game.minTwoPlayers'));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const gameId = await startGame();

    if (gameId) {
      router.replace({
        pathname: '/(game)/game-preparation',
        params: { gameId, roomId: currentRoomId, mode: 'online' },
      });
    }
  }, [allReady, playersList.length, startGame, router, currentRoomId]);

  // Configuration form
  if (!showLobby) {
    return (
      <View style={styles.container}>
        <RadialBackground />

        {/* Fixed Header avec bouton retour */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: SPACING[4],
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titre centré */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.configTitle}>{t('game.roomConfig')}</Text>
          </Animated.View>

          {/* Carte centrale avec configuration — pas d'animation Reanimated ici :
              sur Android, le wrapper Animated.View peut empêcher l'InputMethodManager
              de remonter le clavier sur tap répété (focus retenu, keyboard reste caché). */}
          <View>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(0, 0, 0, 0.35)"
              boxWidth={contentWidth}
              style={{ marginTop: SPACING[5] }}
            >
              <View style={styles.configCard}>
                {/* Choix de l'édition (= secteur) — parcours NORMAL uniquement.
                    En salon programme, l'édition vient du contenu partenaire (non modifiable).
                    Bouton compact qui ouvre une popup (la grille inline cassait le design). */}
                {!isProgramRoom && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{t('game.editionChoice')}</Text>
                    <Pressable
                      style={styles.editionSelectBtn}
                      onPress={() => setShowEditionModal(true)}
                    >
                      <View style={styles.editionSelectIconWrap}>
                        <EditionTileIcon
                          editionId={selectedEditionData?.id ?? 'classic'}
                          editionName={selectedEditionData?.name ?? 'Classic'}
                          size={24}
                          color="#FFBC40"
                        />
                      </View>
                      <Text style={styles.editionSelectText} numberOfLines={1}>
                        {(selectedEditionData?.name ?? 'Classic').replace(/^Édition\s+/i, '')}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                  </View>
                )}

                {/* Nom du Salon — TextInput nu, bord en CSS natif (pas de SVG par-dessus
                    sinon Android n'attache pas l'EditText à l'InputMethodManager). */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('game.roomName')}</Text>
                  <View style={styles.inputBorderShell}>
                    <TextInput
                      value={roomName}
                      onChangeText={setRoomName}
                      placeholder={t('game.roomNamePlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={styles.configInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Nombre de joueur */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('game.numberOfPlayersSingular')}</Text>
                  <View style={styles.inputBorderShell}>
                    <TextInput
                      value={maxPlayers}
                      onChangeText={setMaxPlayers}
                      placeholder="2-4"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={styles.configInput}
                      keyboardType="number-pad"
                      maxLength={1}
                    />
                  </View>
                </View>

                {/* Mise (Ptw) */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t('game.stakePerPlayer')}</Text>
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
                            {opt === 0 ? t('game.stakeNone') : `${opt} Ptw`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {isGuest ? (
                    <Text style={styles.stakeHint}>{t('game.guestsPlayNoStake')}</Text>
                  ) : stakePtw > 0 ? (
                    <Text style={styles.stakeHint}>
                      {potFcfa > 0
                        ? t('game.balanceAndPot', { balance: formatPtwRaw(stakableBalanceFcfa), pot: formatPtwRaw(potFcfa) })
                        : t('game.balanceOnly', { balance: formatPtwRaw(stakableBalanceFcfa) })}
                    </Text>
                  ) : (
                    <Text style={styles.stakeHint}>
                      {t('game.stakeValorisationHint')}
                    </Text>
                  )}
                </View>
              </View>
            </DynamicGradientBorder>
          </View>
        </ScrollView>

        {/* Bottom button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
          <GameButton
            variant="yellow"
            fullWidth
            title={isLoading ? t('game.creating') : t('game.createRoomCta')}
            loading={isLoading}
            onPress={handleCreateRoom}
            disabled={!roomName.trim() || !maxPlayers}
          />
        </View>

        {/* Popup de choix d'édition — grille 2 colonnes (déplacée hors du formulaire). */}
        <Modal
          visible={showEditionModal}
          onClose={() => setShowEditionModal(false)}
          title={t('game.editionChoice')}
          size="lg"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editionModalGrid}
          >
            {editionList.map((edition) => {
              const isSelected = selectedEdition === edition.id;
              const loc = getLocalizedEdition(edition, language);
              return (
                <Pressable
                  key={edition.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (edition.sponsor?.enabled && edition.sponsor.imageUrl) {
                      // Édition sponsorisée → fermer ce modal puis afficher le popup sponsor
                      setShowEditionModal(false);
                      setSponsorEdition(edition);
                    } else {
                      setSelectedEdition(edition.id);
                      setShowEditionModal(false);
                    }
                  }}
                  style={styles.editionGridItem}
                >
                  <DynamicGradientBorder
                    borderRadius={16}
                    fill={isSelected ? 'rgba(255, 188, 64, 0.12)' : 'rgba(0, 0, 0, 0.35)'}
                    boxWidth={editionTileWidth}
                    style={{ width: editionTileWidth }}
                  >
                    <View style={styles.editionTileInner}>
                      {isSelected ? (
                        <View style={styles.editionTileCheckBadge}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                      <View style={styles.editionTileIconWrap}>
                        <EditionTileIcon
                          editionId={edition.id}
                          editionName={edition.name}
                          size={34}
                          color={isSelected ? '#FFBC40' : '#71808E'}
                        />
                      </View>
                      <Text
                        style={[styles.editionTileName, isSelected && styles.editionTileNameSelected]}
                        numberOfLines={2}
                      >
                        {loc.name.replace(/^Édition\s+/i, '')}
                      </Text>
                      <Text
                        style={[styles.editionTileDesc, isSelected && styles.editionTileDescSelected]}
                        numberOfLines={3}
                      >
                        {loc.description || t('game.customEdition')}
                      </Text>
                    </View>
                  </DynamicGradientBorder>
                </Pressable>
              );
            })}
          </ScrollView>
        </Modal>

        {/* Popup édition sponsorisée : « JOUER » valide le choix */}
        {sponsorEdition?.sponsor ? (
          <SponsoredEditionPopup
            visible
            editionName={getLocalizedEdition(sponsorEdition, language).name.replace(/^Édition\s+/i, '')}
            sponsor={sponsorEdition.sponsor}
            onPlay={() => {
              setSelectedEdition(sponsorEdition.id);
              setSponsorEdition(null);
            }}
            onDismiss={() => setSponsorEdition(null)}
          />
        ) : null}
      </View>
    );
  }

  // Waiting room (lobby avec joueurs)
  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>{roomName || t('game.room')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code — design system: fill rgba(0,0,0,0.35) */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
          >
            <View style={styles.codeSection}>
              <Text style={styles.codeLabel}>{t('game.roomCode')}</Text>
              <Text style={styles.codeText}>{roomCode}</Text>
              <View style={styles.codeActions}>
                <Pressable onPress={handleCopyCode} style={styles.codeAction}>
                  <Ionicons name="copy-outline" size={18} color="#FFBC40" />
                  <Text style={styles.codeActionText}>{t('game.copy')}</Text>
                </Pressable>
                <Pressable onPress={handleShareCode} style={styles.codeAction}>
                  <Ionicons name="share-outline" size={18} color="#FFBC40" />
                  <Text style={styles.codeActionText}>{t('game.share')}</Text>
                </Pressable>
                {!isGuest && (
                  <Pressable
                    onPress={() => setShowInviteContact(true)}
                    style={styles.codeAction}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#FFBC40" />
                    <Text style={styles.codeActionText}>{t('game.invite')}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* Bandeau mise (si la room a une mise) */}
        {room?.stake && room.stake > 0 ? (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.stakeBannerWrapper}>
            <DynamicGradientBorder borderRadius={16} fill="rgba(255,188,64,0.10)" boxWidth={contentWidth}>
              <View style={styles.stakeBanner}>
                <Ionicons name="cash-outline" size={20} color="#FFBC40" />
                <Text style={styles.stakeBannerText}>
                  {t('game.stakeBanner', { stake: formatPtwRaw(room.stake), pot: formatPtwRaw(room.stake * playersList.length) })}
                </Text>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        ) : null}

        {/* Liste des joueurs — même design que local-setup (CONFIGURATION DES JOUEURS) */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.lobbySectionWrapper}>
          <DynamicGradientBorder
            borderRadius={20}
            fill="rgba(0, 0, 0, 0.35)"
            boxWidth={contentWidth}
            style={styles.lobbyPlayersBlock}
          >
            <Text style={styles.lobbySectionTitle}>
              {t('game.playersCount', { count: playersList.length, max: maxPlayers })}
            </Text>
            {playersList.length >= 2 ? (
              // Présentation VS dès qu'au moins 2 joueurs sont dans le salon
              <VersusBoard players={versusPlayers} />
            ) : playersList.length === 1 ? (
              // Un seul joueur (hôte) : on l'affiche + on attend les adversaires
              <View style={styles.playersList}>
                {playersList.map((player, index) => (
                  <Animated.View
                    key={player.playerId}
                    entering={FadeIn.delay(280 + index * 80).duration(400)}
                    style={styles.playerCardWrapper}
                  >
                    <DynamicGradientBorder
                      borderRadius={14}
                      fill="rgba(0, 0, 0, 0.35)"
                      boxWidth={contentWidth - 24}
                      style={styles.lobbyPlayerCardBorder}
                    >
                      <View style={styles.lobbyPlayerCard}>
                        <View style={styles.lobbyPlayerAvatar}>
                          <Avatar
                            name={player.displayName ?? player.name ?? 'Joueur'}
                            playerColor={player.color}
                            size="sm"
                          />
                        </View>
                        <View style={styles.lobbyPlayerInfo}>
                          <Text style={styles.lobbyPlayerName} numberOfLines={1}>
                            {player.displayName ?? player.name ?? 'Joueur'}
                          </Text>
                          {player.startupName ? (
                            <Text style={styles.lobbyStartupName} numberOfLines={1}>
                              {player.startupName}
                            </Text>
                          ) : (
                            <Text style={styles.lobbyPlayerStatus}>
                              {player.isHost ? t('game.host') : player.isReady ? t('game.ready') : t('game.waitingStatus')}
                            </Text>
                          )}
                        </View>
                        <View style={[
                          styles.lobbyReadyBadge,
                          (player.isReady || player.isHost) && styles.lobbyReadyBadgeActive,
                        ]}>
                          <Ionicons
                            name={player.isReady || player.isHost ? 'checkmark' : 'time'}
                            size={14}
                            color={player.isReady || player.isHost ? '#4CAF50' : 'rgba(255,255,255,0.5)'}
                          />
                        </View>
                      </View>
                    </DynamicGradientBorder>
                  </Animated.View>
                ))}
                <View style={styles.emptyPlayers}>
                  <Ionicons name="hourglass-outline" size={20} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.emptyText}>{t('game.waitingOtherPlayers')}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyPlayers}>
                <Ionicons name="hourglass-outline" size={24} color="rgba(255,255,255,0.3)" />
                <Text style={styles.emptyText}>{t('game.waitingForPlayers')}</Text>
              </View>
            )}
          </DynamicGradientBorder>
        </Animated.View>

        {/* Startup Selection Button for host */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.startupBtnWrapper}>
          <Pressable
            style={[styles.startupSelectBtn, hasSelectedStartup && styles.startupSelectBtnDone]}
            onPress={() => setShowStartupModal(true)}
          >
            <Ionicons
              name={hasSelectedStartup ? 'checkmark-circle' : 'rocket-outline'}
              size={20}
              color={hasSelectedStartup ? '#4CAF50' : '#FFBC40'}
            />
            <Text style={[styles.startupSelectText, hasSelectedStartup && styles.startupSelectTextDone]}>
              {hasSelectedStartup ? myPlayer?.startupName ?? t('game.projectChosen') : t('game.chooseMyProject')}
            </Text>
            {!hasSelectedStartup && (
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Startup Selection Modal — non-fermable tant qu'aucun projet n'est choisi */}
      <StartupSelectionModal
        visible={showStartupModal}
        edition={edition}
        userStartups={userStartups}
        defaultProjects={defaultProjects}
        playerName={user?.displayName}
        onSelect={handleStartupSelected}
        onClose={() => {
          if (hasSelectedStartup) setShowStartupModal(false);
        }}
      />

      <InviteContactModal
        visible={showInviteContact}
        onClose={() => setShowInviteContact(false)}
        roomId={currentRoomId}
        roomCode={roomCode.replace('-', '')}
      />

      {/* Bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}>
        <GameButton
          variant="yellow"
          fullWidth
          title={isLoading ? t('common.loading') : t('game.startGameCta')}
          loading={isLoading}
          disabled={playersList.length < 2 || !hasSelectedStartup}
          onPress={handleStartGame}
        />
        {!hasSelectedStartup && (
          <Text style={styles.waitingText}>{t('game.chooseProjectBeforeStart')}</Text>
        )}
        {playersList.length < 2 && (
          <Text style={styles.waitingText}>{t('game.minTwoPlayersRequired')}</Text>
        )}
        {playersList.length >= 2 && !allReady && hasSelectedStartup && (
          <Text style={styles.waitingText}>{t('game.waitingAllReady')}</Text>
        )}
      </View>
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
  configTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  configCard: {
    padding: SPACING[5],
    gap: SPACING[5],
  },
  fieldGroup: {
    gap: SPACING[2],
  },
  fieldLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Bouton compact « édition choisie » (ouvre la popup) — même esprit que le bouton projet.
  editionSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editionSelectIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editionSelectText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Grille d'éditions dans la popup — même présentation que local-setup (2 colonnes).
  editionModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: SPACING[2],
  },
  editionGridItem: {
    width: editionTileWidth,
    marginBottom: EDITION_TILE_GAP,
  },
  editionTileInner: {
    position: 'relative',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[4],
    paddingTop: SPACING[5],
    minHeight: 172,
    alignItems: 'center',
  },
  editionTileCheckBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFBC40',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  editionTileIconWrap: {
    marginBottom: SPACING[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  editionTileName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#7F8E9E',
    textAlign: 'center',
    marginBottom: SPACING[2],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  editionTileNameSelected: {
    color: '#FFBC40',
  },
  editionTileDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#7F8E9E',
    textAlign: 'center',
    lineHeight: 16,
  },
  editionTileDescSelected: {
    color: '#FFBC40',
  },
  // Bord arrondi en CSS natif RN (pas de SVG over-input → Android touch direct).
  inputBorderShell: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  configInput: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    minHeight: Platform.OS === 'android' ? 28 : undefined,
    padding: 0,
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
    marginTop: SPACING[1],
  },
  label: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING[2],
    marginTop: SPACING[5],
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: 'white',
    padding: SPACING[4],
  },
  optionCard: {
    paddingVertical: SPACING[3],
    alignItems: 'center',
  },
  optionText: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: 'white',
  },
  betText: {
    fontFamily: FONTS.title,
    fontSize: 15,
    color: 'white',
  },
  editionCard: {
    padding: SPACING[3],
    alignItems: 'center',
    width: 100,
  },
  editionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  editionName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'white',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
  },
  codeSection: {
    alignItems: 'center',
    padding: SPACING[5],
    minWidth: 280,
    alignSelf: 'stretch',
    marginHorizontal: -SPACING[4],
  },
  codeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: SPACING[2],
  },
  codeText: {
    fontFamily: FONTS.title,
    fontSize: 32,
    color: '#FFBC40',
    letterSpacing: 4,
  },
  codeActions: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginTop: SPACING[3],
  },
  codeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: 20,
    gap: SPACING[1],
  },
  codeActionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  stakeBannerWrapper: {
    marginTop: SPACING[4],
  },
  stakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    padding: SPACING[4],
    width: '100%',
  },
  stakeBannerText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  // Salle d'attente — même design que local-setup (liste joueurs)
  lobbySectionWrapper: {
    marginTop: SPACING[5],
  },
  lobbyPlayersBlock: {
    width: '100%',
    overflow: 'hidden',
    padding: SPACING[3],
  },
  lobbySectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    marginBottom: SPACING[4],
  },
  playersList: {
    gap: 0,
  },
  playerCardWrapper: {
    marginBottom: 8,
  },
  lobbyPlayerCardBorder: {
    width: '100%',
    overflow: 'hidden',
  },
  lobbyPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  lobbyPlayerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  lobbyPlayerInfo: {
    flex: 1,
  },
  lobbyPlayerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  lobbyPlayerStatus: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  lobbyStartupName: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#FFBC40',
    marginTop: 2,
  },
  lobbyReadyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lobbyReadyBadgeActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  emptyPlayers: {
    alignItems: 'center',
    padding: SPACING[5],
    gap: SPACING[2],
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  startupBtnWrapper: {
    marginTop: SPACING[4],
  },
  startupSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.25)',
    borderRadius: 14,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  startupSelectBtnDone: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  startupSelectText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#FFBC40',
  },
  startupSelectTextDone: {
    color: '#4CAF50',
  },
  waitingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
});
