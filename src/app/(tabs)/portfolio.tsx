import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PortfolioIcon, RocketIcon } from '@/components/icons';
import {
  DynamicGradientBorder,
  FAB,
  GameButton,
  InfoModal,
  RadialBackground,
} from '@/components/ui';
import { GamePopup, GamePopupGradientBorder } from '@/components/ui/GamePopup';
import type { InfoSection } from '@/components/ui';
import { deleteStartup } from '@/services/firebase/firestore';
import { useAuthStore, useUserStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { Startup } from '@/types';
import { formatFCFARaw } from '@/utils/currency';


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
  const [detailCardH, setDetailCardH] = useState(0);
  const [detailCardW, setDetailCardW] = useState(0);
  const valorisationStr = formatValorisationPopup(startup.valorisation ?? 0);
  const createdAtStr = formatDateDDMMYYYY(startup.createdAt);
  const descriptionRaw = startup.description?.trim() ?? '';
  const descriptionDisplay = descriptionRaw.length > 0 ? descriptionRaw : 'Aucune description pour le moment.';

  return (
    <GamePopup
      visible
      onRequestClose={onClose}
      icon={<RocketIcon color="#1F91D0" size={72} withShadow={false} />}
      spinningShape
      title={startup.name}
      footer={
        <View style={popupStyles.actionsRow}>
          {onDelete != null && (
            <Pressable style={popupStyles.deleteBtn} onPress={onDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={22} color="#7F8E9E" />
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <GameButton title="FERMER" variant="blue" fullWidth onPress={onClose} />
          </View>
        </View>
      }
    >
      {/* Stats : Valorisation | Niveau */}
      <View
        style={popupStyles.statsBlock}
        onLayout={(e) => setDetailCardW(e.nativeEvent.layout.width)}
      >
        {detailCardW > 0 && (
          <GamePopupGradientBorder
            width={detailCardW}
            height={58}
            borderRadius={14}
            gradientId="startup_stats_border"
          />
        )}
        <View style={popupStyles.statsRow}>
          <View style={popupStyles.statCol}>
            <Text style={popupStyles.statValue} numberOfLines={1} ellipsizeMode="tail">
              {valorisationStr}
            </Text>
            <Text style={popupStyles.statLabel}>Valorisation</Text>
          </View>
          <View style={popupStyles.statSeparator} />
          <View style={popupStyles.statCol}>
            <Text style={popupStyles.statValue} numberOfLines={1}>NIV. {startup.level}</Text>
            <Text style={popupStyles.statLabel}>Niveau</Text>
          </View>
        </View>
      </View>

      {/* Zone swipe : Description | Informations */}
      <View
        style={popupStyles.detailCard}
        onLayout={(e) => {
          setDetailCardH(e.nativeEvent.layout.height);
        }}
      >
        {detailCardW > 0 && detailCardH > 0 && (
          <GamePopupGradientBorder
            width={detailCardW}
            height={detailCardH}
            borderRadius={14}
            gradientId="startup_detail_border"
          />
        )}
        {/* ScrollView horizontal limité à la largeur du card */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          style={detailCardW > 0 ? { width: detailCardW } : undefined}
          onMomentumScrollEnd={(e) => {
            const pageW = e.nativeEvent.layoutMeasurement.width;
            const x = e.nativeEvent.contentOffset.x;
            if (pageW > 0) setDetailPageIndex(Math.round(x / pageW));
          }}
        >
          {/* Page 1 — Description */}
          <View style={[popupStyles.detailPage, detailCardW > 0 && { width: detailCardW }]}>
            <Text style={popupStyles.detailPageTitle}>Description</Text>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={popupStyles.detailScroll}>
              <Text style={popupStyles.detailDescText}>{descriptionDisplay}</Text>
            </ScrollView>
          </View>

          {/* Page 2 — Informations */}
          <View style={[popupStyles.detailPage, detailCardW > 0 && { width: detailCardW }]}>
            <Text style={popupStyles.detailPageTitle}>Informations</Text>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={popupStyles.detailScroll}>
              <View style={popupStyles.infoList}>
                {[
                  { icon: 'people', label: 'Cible', value: startup.targetCard?.title ?? 'Non définie' },
                  { icon: 'flag', label: 'Mission', value: startup.missionCard?.title ?? 'Non définie' },
                  { icon: 'business', label: 'Secteur', value: startup.sector },
                  { icon: 'calendar', label: 'Créée le', value: createdAtStr },
                  { icon: 'diamond', label: 'Tokens investis', value: startup.tokensInvested.toLocaleString() },
                  ...(startup.creatorName ? [{ icon: 'person', label: 'Créateur', value: startup.creatorName }] : []),
                ].map((row) => (
                  <View key={row.label} style={popupStyles.infoRow}>
                    <View style={popupStyles.infoLeft}>
                      <Ionicons name={row.icon as any} size={14} color="#7F8E9E" />
                      <Text style={popupStyles.infoLabel}>{row.label}</Text>
                    </View>
                    <Text style={popupStyles.infoValue} numberOfLines={2}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Dots pagination */}
        <View style={popupStyles.dots}>
          {[0, 1].map((i) => (
            <View key={i} style={[popupStyles.dot, detailPageIndex === i && popupStyles.dotActive]} />
          ))}
        </View>
      </View>
    </GamePopup>
  );
}

const popupStyles = StyleSheet.create({
  // Stats block (Valorisation | Niveau)
  statsBlock: {
    position: 'relative',
    marginBottom: SPACING[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    height: 58,
    paddingHorizontal: SPACING[4],
  },
  statCol: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statSeparator: {
    alignSelf: 'center',
    width: StyleSheet.hairlineWidth,
    height: 22,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    maxWidth: '100%',
  },
  statLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },

  // Detail swipeable card
  detailCard: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: SPACING[4],
    minHeight: 200,
  },
  detailPage: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[2],
    minHeight: 200,
  },
  detailPageTitle: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  detailScroll: {
    maxHeight: 180,
  },
  detailDescText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
  },

  // Info list (page Informations)
  infoList: {
    gap: 10,
    paddingBottom: SPACING[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  infoLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#7F8E9E',
  },
  infoValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: COLORS.white,
    textAlign: 'right',
    flex: 1,
  },

  // Pagination dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING[2],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Footer actions
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
    title: 'ENTREPRISES',
    body: `Tu peux créer jusqu'à ${MAX_STARTUPS} entreprises. Chaque entreprise est définie par un secteur, une cible et une mission.`,
  },
  {
    icon: 'trending-up',
    title: 'VALORISATION',
    body: "La valorisation augmente chaque fois que ton entreprise lève des fonds lors d'une partie. Elle représente la valeur totale de ton entreprise.",
  },
  {
    icon: 'bar-chart',
    title: 'NIVEAU',
    body: "Le niveau de ton entreprise progresse avec les levées de fonds. Un niveau élevé reflète une entreprise mature et bien financée.",
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
  const totalValorisation = startups.reduce((sum, s) => sum + (s.valorisation ?? 0), 0);
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
            <Text style={styles.emptyTitle}>Aucune entreprise</Text>
            <Text style={styles.emptyDesc}>
              Crée ta première entreprise en jouant et en gagnant des jetons !
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
                            {startup.description || `Entreprise innovante dans le secteur ${startup.sector}`}
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
                            {formatValorisation(startup.valorisation ?? 0)}
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
        variant="portfolio"
        description="Ton portfolio regroupe toutes les entreprises que tu as créées et développées en jouant."
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
