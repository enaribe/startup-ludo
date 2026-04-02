import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PortfolioIcon, RocketIcon } from '@/components/icons';
import {
  DynamicGradientBorder,
  FAB,
  GameButton,
  InfoModal,
  Modal,
  RadialBackground,
} from '@/components/ui';
import type { InfoSection } from '@/components/ui';
import { deleteStartup } from '@/services/firebase/firestore';
import { useAuthStore, useUserStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Startup } from '@/types';
import { formatFCFARaw } from '@/utils/currency';

const { width: screenWidth } = Dimensions.get('window');
const POPUP_CARD_INNER_W = screenWidth - 36 - SPACING[5] * 2;
const POPUP_DETAIL_PAGE_W = POPUP_CARD_INNER_W - 40;

function formatValorisationPopup(value: number): string {
  return formatFCFARaw(value);
}

function formatDateDDMMYYYY(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const SECTOR_PILL_RADIUS = BORDER_RADIUS.lg;

const sectorPillStyles = StyleSheet.create({
  inner: {
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  text: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
});

const StartupSectorPill = memo(function StartupSectorPill({ label }: { label: string }) {
  const [measuredWidth, setMeasuredWidth] = useState(0);

  useEffect(() => {
    setMeasuredWidth(0);
  }, [label]);

  const inner = (
    <View style={sectorPillStyles.inner}>
      <Text style={sectorPillStyles.text}>{label}</Text>
    </View>
  );

  if (measuredWidth <= 0) {
    return (
      <View
        style={{ alignSelf: 'flex-start' }}
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout;
          if (width > 0) {
            setMeasuredWidth(width);
          }
        }}
      >
        {inner}
      </View>
    );
  }

  return (
    <DynamicGradientBorder
      boxWidth={measuredWidth}
      borderRadius={SECTOR_PILL_RADIUS}
      fill="rgba(0, 0, 0, 0.35)"
      style={{ alignSelf: 'flex-start' }}
    >
      {inner}
    </DynamicGradientBorder>
  );
});

function StartupDetailPopup({
  startup,
  onClose,
  onDelete,
}: {
  startup: Startup;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [detailPageIndex, setDetailPageIndex] = useState(0);
  const valorisationStr = formatValorisationPopup(startup.valorisation ?? startup.tokensInvested ?? 0);
  const createdAtStr = formatDateDDMMYYYY(startup.createdAt);
  const descriptionRaw = startup.description?.trim() ?? '';
  const descriptionDisplay =
    descriptionRaw.length > 0
      ? descriptionRaw
      : 'Aucune description pour le moment.';

  return (
    <Modal
      visible
      onClose={onClose}
      onRequestClose={onClose}
      closeOnBackdrop
      showCloseButton={false}
      bareContent
    >
      {/* Aligné QuizPopup / EventPopup / FundingPopup : SlideInUp 280ms, sans spring */}
      <Animated.View entering={SlideInUp.duration(280)} style={popupStyles.centered}>
        <DynamicGradientBorder
          borderRadius={24}
          fill="#0A1929"
          boxWidth={screenWidth - 36}
        >
          <View style={popupStyles.card}>
            <Pressable
              style={popupStyles.closeBtn}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>

            {/* 1. Header */}
            <View style={popupStyles.header}>
              <View style={popupStyles.iconBadge}>
                <RocketIcon color="#1F91D0" size={75} withShadow={false} />
              </View>
              <Text style={popupStyles.startupName}>{startup.name}</Text>
            </View>

            {/* 2. Tableau stats : Valorisation | Niveau */}
            <View style={popupStyles.statsRow}>
              <View style={popupStyles.statColHeader}>
                <Text
                  style={popupStyles.statValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {valorisationStr}
                </Text>
                <Text style={popupStyles.statLabel}>Valorisation</Text>
              </View>
              <View style={popupStyles.statSeparator} />
              <View style={popupStyles.statColHeader}>
                <Text style={popupStyles.statValueNiv} numberOfLines={1}>
                  NIV. {startup.level}
                </Text>
                <Text style={popupStyles.statLabel}>Niveau</Text>
              </View>
            </View>

            {/* 3. Description (swipe) | Informations */}
            <View style={popupStyles.detailCard}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                style={{ width: POPUP_DETAIL_PAGE_W, alignSelf: 'center' }}
                onMomentumScrollEnd={(e) => {
                  const pageW = e.nativeEvent.layoutMeasurement.width;
                  const x = e.nativeEvent.contentOffset.x;
                  if (pageW > 0) {
                    setDetailPageIndex(Math.round(x / pageW));
                  }
                }}
              >
                <View style={[popupStyles.detailSwipePage, { width: POPUP_DETAIL_PAGE_W }]}>
                  <Text style={popupStyles.detailSwipeTitle}>Description</Text>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={popupStyles.detailVerticalScroll}
                    contentContainerStyle={popupStyles.detailVerticalScrollContent}
                  >
                    <Text style={popupStyles.detailDescriptionText}>{descriptionDisplay}</Text>
                  </ScrollView>
                </View>

                <View style={[popupStyles.detailSwipePage, { width: POPUP_DETAIL_PAGE_W }]}>
                  <Text style={popupStyles.detailSwipeTitle}>Informations</Text>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={popupStyles.detailVerticalScroll}
                    contentContainerStyle={popupStyles.detailVerticalScrollContent}
                  >
                    <View style={popupStyles.detailRow}>
                      <View style={popupStyles.detailLeft}>
                        <Ionicons name="people" size={16} color="#7F8E9E" />
                        <Text style={popupStyles.detailLabel}>Cible</Text>
                      </View>
                      <Text style={popupStyles.detailValue}>
                        {startup.targetCard?.title ?? 'Non définie'}
                      </Text>
                    </View>

                    <View style={popupStyles.detailRow}>
                      <View style={popupStyles.detailLeft}>
                        <Ionicons name="flag" size={16} color="#7F8E9E" />
                        <Text style={popupStyles.detailLabel}>Mission</Text>
                      </View>
                      <Text style={popupStyles.detailValue}>
                        {startup.missionCard?.title ?? 'Non définie'}
                      </Text>
                    </View>

                    <View style={popupStyles.detailRow}>
                      <View style={popupStyles.detailLeft}>
                        <Ionicons name="business" size={16} color="#7F8E9E" />
                        <Text style={popupStyles.detailLabel}>Secteur</Text>
                      </View>
                      <Text style={[popupStyles.detailValue, popupStyles.detailValueWrap]} numberOfLines={2}>
                        {startup.sector}
                      </Text>
                    </View>

                    <View style={popupStyles.detailRow}>
                      <View style={popupStyles.detailLeft}>
                        <Ionicons name="calendar" size={16} color="#7F8E9E" />
                        <Text style={popupStyles.detailLabel}>Crée le</Text>
                      </View>
                      <Text style={popupStyles.detailValue}>{createdAtStr}</Text>
                    </View>

                    <View style={popupStyles.detailRow}>
                      <View style={popupStyles.detailLeft}>
                        <Ionicons name="diamond" size={16} color="#7F8E9E" />
                        <Text style={popupStyles.detailLabel}>Tokens investis</Text>
                      </View>
                      <Text style={popupStyles.detailValue}>
                        {startup.tokensInvested.toLocaleString()}
                      </Text>
                    </View>

                    {startup.creatorName ? (
                      <View style={popupStyles.detailRow}>
                        <View style={popupStyles.detailLeft}>
                          <Ionicons name="person" size={16} color="#7F8E9E" />
                          <Text style={popupStyles.detailLabel}>Créateur</Text>
                        </View>
                        <Text style={popupStyles.detailValue}>{startup.creatorName}</Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              </ScrollView>

              <View style={popupStyles.detailPagerDots}>
                <View
                  style={[
                    popupStyles.detailPagerDot,
                    detailPageIndex === 0 && popupStyles.detailPagerDotActive,
                  ]}
                />
                <View
                  style={[
                    popupStyles.detailPagerDot,
                    detailPageIndex === 1 && popupStyles.detailPagerDotActive,
                  ]}
                />
              </View>
            </View>

            {/* 4. Actions */}
            <View style={popupStyles.actionsRow}>
              {onDelete != null && (
                <Pressable style={popupStyles.deleteBtn} onPress={onDelete}>
                  <Ionicons name="trash-outline" size={24} color="#7F8E9E" />
                </Pressable>
              )}
              <View style={{ flex: 1 }}>
                <GameButton title="FERMER" variant="blue" fullWidth onPress={onClose} />
              </View>
            </View>
          </View>
        </DynamicGradientBorder>
      </Animated.View>
    </Modal>
  );
}

const popupStyles = StyleSheet.create({
  centered: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: screenWidth - 36,
    padding: SPACING[5],
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING[4],
    marginTop: SPACING[2],
  },
  iconBadge: {
    marginBottom: SPACING[3],
  },
  startupName: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.white,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: SPACING[5],
  },
  statColHeader: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  statSeparator: {
    alignSelf: 'center',
    width: StyleSheet.hairlineWidth,
    height: 22,
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.primary,
    textAlign: 'center',
    maxWidth: '100%',
  },
  statValueNiv: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: COLORS.primary,
    textAlign: 'center',
    maxWidth: '100%',
  },
  statLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: COLORS.white,
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    paddingVertical: 27,
    paddingHorizontal: 20,
    marginBottom: SPACING[5],
  },
  detailSwipePage: {
    minHeight: 200,
    maxHeight: 300,
  },
  detailSwipeTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  detailVerticalScroll: {
    maxHeight: 260,
  },
  detailVerticalScrollContent: {
    gap: 24,
    paddingBottom: SPACING[2],
  },
  detailDescriptionText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
  },
  detailPagerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING[3],
  },
  detailPagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  detailPagerDotActive: {
    backgroundColor: COLORS.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#7F8E9E',
  },
  detailValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.white,
  },
  detailValueWrap: {
    flex: 1,
    marginLeft: SPACING[4],
    textAlign: 'right',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#7F8E9E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const MAX_STARTUPS = 3;

const PORTFOLIO_INFO_SECTIONS: InfoSection[] = [
  {
    icon: 'rocket',
    title: 'STARTUPS',
    body: `Tu peux créer jusqu'à ${MAX_STARTUPS} startups. Chaque startup est définie par un secteur, une cible et une mission.`,
  },
  {
    icon: 'trending-up',
    title: 'VALORISATION',
    body: "La valorisation augmente chaque fois que ta startup lève des fonds lors d'une partie. Elle représente la valeur totale de ton entreprise.",
  },
  {
    icon: 'bar-chart',
    title: 'NIVEAU',
    body: "Le niveau de ta startup progresse avec les levées de fonds. Un niveau élevé reflète une startup mature et bien financée.",
  },
];

// Header height: safeArea + title + stats + padding (version compacte)
const HEADER_CONTENT_HEIGHT = 132;

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const startups = profile?.startups ?? [];
  const totalValorisation = startups.reduce((sum, s) => sum + s.tokensInvested, 0);
  const canAddStartup = startups.length < MAX_STARTUPS;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateStartup = () => {
    if (canAddStartup) {
      router.push('/(startup)/ideation');
    }
  };

  const formatValorisation = (value: number) => formatFCFARaw(value);

  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + HEADER_CONTENT_HEIGHT;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header with background */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>mon PORTFOLIO</Text>
          <Pressable style={styles.settingsBtn} onPress={() => setShowInfo(true)}>
            <Ionicons name="information-circle-outline" size={24} color="#FFBC40" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.statsRow}>
            <View style={styles.statColHeader}>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatValorisation(totalValorisation)}
              </Text>
              <Text style={styles.statLabel}>Valorisations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColHeader}>
              <Text style={styles.statValue} numberOfLines={1}>
                {startups.length}/{MAX_STARTUPS}
              </Text>
              <Text style={styles.statLabel}>Entreprises</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 16, paddingBottom: 120 },
        ]}
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
        {/* Liste des Startups */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>{startups.length} ENTREPRISES CRÉÉ</Text>
        </Animated.View>
        {startups.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.emptyContainer}>
            <PortfolioIcon color="rgba(255,255,255,0.2)" size={64} />
            <Text style={styles.emptyTitle}>Aucune startup</Text>
            <Text style={styles.emptyDesc}>
              Crée ta première startup en jouant et en gagnant des jetons !
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ gap: 14 }}>
            {startups.map((startup, index) => (
              <Animated.View
                key={startup.id}
                entering={FadeInDown.delay(400 + index * 100).duration(500)}
              >
                <Pressable onPress={() => setSelectedStartup(startup)}>
                  <DynamicGradientBorder
                    borderRadius={16}
                    fill="rgba(0, 0, 0, 0.3)"
                    style={{ width: '100%' }}
                  >
                    <View style={styles.startupCard}>
                      {/* Header */}
                      <View style={styles.startupHeader}>
                        <RocketIcon color="#1F91D0" size={52} withShadow={false} />
                        <View style={styles.startupInfo}>
                          <Text style={styles.startupName}>{startup.name}</Text>
                          <Text style={styles.startupDesc} numberOfLines={2}>
                            {startup.description || `Startup innovante dans le secteur ${startup.sector}`}
                          </Text>
                        </View>
                      </View>

                      {/* Tags */}
                      <View style={styles.tagsRow}>
                        <StartupSectorPill label={startup.sector} />
                        <Text style={styles.dateText}>
                          Crée il y'a {Math.floor((Date.now() - startup.createdAt) / (1000 * 60 * 60 * 24 * 7))} semaine{Math.floor((Date.now() - startup.createdAt) / (1000 * 60 * 60 * 24 * 7)) !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      {/* Footer stats */}
                      <View style={styles.startupFooter}>
                        <View style={styles.footerStatValorisation}>
                          <Text
                            style={styles.footerStatValue}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {formatValorisation(startup.tokensInvested)}
                          </Text>
                          <Text style={styles.footerStatLabel}>Valorisation</Text>
                        </View>
                        <View style={styles.footerDivider} />
                        <View style={styles.footerStatNiveau}>
                          <Text style={styles.footerStatValueGreen} numberOfLines={1}>
                            NIV. {startup.level}
                          </Text>
                          <Text style={styles.footerStatLabel}>Niveau</Text>
                        </View>
                      </View>
                    </View>
                  </DynamicGradientBorder>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Bouton Flottant + */}
      {canAddStartup && (
        <FAB onPress={handleCreateStartup} bottom={insets.bottom + 100} />
      )}

      {/* Popup détail startup */}
      {selectedStartup && (
        <StartupDetailPopup
          startup={selectedStartup}
          onClose={() => setSelectedStartup(null)}
          onDelete={() => {
            Alert.alert(
              "Supprimer l'entreprise",
              `Es-tu sûr de vouloir supprimer "${selectedStartup.name}" ? Cette action est irréversible.`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    const userId = useAuthStore.getState().user?.id;
                    if (!userId) return;
                    try {
                      await deleteStartup(userId, selectedStartup.id);
                      useUserStore.getState().removeStartup(selectedStartup.id);
                      setSelectedStartup(null);
                    } catch (e) {
                      Alert.alert(
                        'Erreur',
                        "Impossible de supprimer l'entreprise. Réessaie plus tard."
                      );
                    }
                  },
                },
              ]
            );
          }}
        />
      )}

      {/* Info Modal */}
      <InfoModal
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title="MON PORTFOLIO"
        headerIcon="briefcase"
        description="Ton portfolio regroupe toutes les startups que tu as créées et développées en jouant."
        sections={PORTFOLIO_INFO_SECTIONS}
      />
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
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[3],
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    color: COLORS.white,
    letterSpacing: 1,
    textShadowColor: '#1F91D0',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(5, 25, 50, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  statColHeader: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: 19,
    color: COLORS.primary,
    textAlign: 'center',
    maxWidth: '100%',
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES['xs'],
    color: COLORS.white,
    textAlign: 'center',
  },
  statDivider: {
    alignSelf: 'center',
    width: StyleSheet.hairlineWidth,
    height: 22,
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: 0,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sectionTitle: {
    marginTop: SPACING[4],
    marginBottom: SPACING[3],
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
  },
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: FONTS.title,
    fontSize: 20,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 16,
  },
  emptyDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  // Startup card
  startupCard: {
    padding: 14,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  startupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  startupInfo: {
    flex: 1,
  },
  startupName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    textShadowColor: '#1F91D0',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
    marginBottom: 4,
  },
  startupDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.35)',
  },
  startupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    marginTop: 0,
  },
  footerStatValorisation: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: SPACING[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  footerStatNiveau: {
    flex: 1,
    minWidth: 0,
    paddingLeft: SPACING[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerDivider: {
    alignSelf: 'center',
    width: StyleSheet.hairlineWidth,
    height: 22,
    flexGrow: 0,
    flexShrink: 0,
    marginHorizontal: 0,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  footerStatValue: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFBC40',
  },
  footerStatValueGreen: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFBC40',
  },
  footerStatLabel: {
    flexShrink: 0,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
});
