import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { useUserStore, useAuthStore } from '@/stores';
import { deleteStartup } from '@/services/firebase/firestore';
import { PortfolioIcon } from '@/components/icons';
import {
  RadialBackground,
  DynamicGradientBorder,
  FilterChips,
  Tag,
  StatCard,
  ScreenHeader,
  FAB,
  GameButton,
} from '@/components/ui';
import type { Startup } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

function formatValorisationPopup(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
  if (value >= 1000) return `${Math.round(value / 1000)}K€`;
  return `${value}€`;
}

function formatDateDDMMYYYY(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function StartupDetailPopup({
  startup,
  onClose,
  onDelete,
}: {
  startup: Startup;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const valorisationStr = formatValorisationPopup(startup.valorisation ?? startup.tokensInvested ?? 0);
  const createdAtStr = formatDateDDMMYYYY(startup.createdAt);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={popupStyles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <View style={popupStyles.backdropInner} />
        </Animated.View>
        <Pressable onPress={(e) => e.stopPropagation()} style={popupStyles.centered}>
          <Animated.View entering={SlideInUp.duration(100).springify().damping(32)}>
            <DynamicGradientBorder
              borderRadius={24}
              fill="rgba(10, 25, 41, 0.95)"
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
                    <PortfolioIcon color="#FFBC40" size={36} />
                  </View>
                  <Text style={popupStyles.startupName}>{startup.name.toUpperCase()}</Text>
                  {startup.description ? (
                    <Text style={popupStyles.startupDesc}>{startup.description}</Text>
                  ) : null}
                </View>

                <View style={popupStyles.divider} />

                {/* 2. Tableau stats : Valorisation | Niveau */}
                <View style={popupStyles.statsRow}>
                  <View style={popupStyles.statCol}>
                    <Text style={popupStyles.statValue}>{valorisationStr}</Text>
                    <Text style={popupStyles.statLabel}>Valorisation</Text>
                  </View>
                  <View style={popupStyles.statSeparator} />
                  <View style={popupStyles.statCol}>
                    <Text style={popupStyles.statValue}>{startup.level}</Text>
                    <Text style={popupStyles.statLabel}>Niveau</Text>
                  </View>
                </View>

                <View style={popupStyles.divider} />

                {/* 3. Detail lines (Cible, Mission, Secteur, etc.) */}
                <View style={popupStyles.detailBlock}>
                  <View style={popupStyles.detailRow}>
                    <View style={popupStyles.detailLeft}>
                      <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                      <Text style={popupStyles.detailLabel}>Cible</Text>
                    </View>
                    <Text style={popupStyles.detailValue}>
                      {startup.targetCard?.title ?? 'Non définie'}
                    </Text>
                  </View>
                  <View style={popupStyles.detailSeparator} />
                  <View style={popupStyles.detailRow}>
                    <View style={popupStyles.detailLeft}>
                      <Ionicons name="flag" size={14} color={COLORS.textSecondary} />
                      <Text style={popupStyles.detailLabel}>Mission</Text>
                    </View>
                    <Text style={popupStyles.detailValue}>
                      {startup.missionCard?.title ?? 'Non définie'}
                    </Text>
                  </View>
                  <View style={popupStyles.detailSeparator} />
                  <View style={popupStyles.detailRow}>
                    <View style={popupStyles.detailLeft}>
                      <Ionicons name="business" size={14} color={COLORS.textSecondary} />
                      <Text style={popupStyles.detailLabel}>Secteur</Text>
                    </View>
                    <Text style={[popupStyles.detailValue, popupStyles.detailValueWrap]} numberOfLines={3}>
                      {startup.sector}
                    </Text>
                  </View>
                  <View style={popupStyles.detailSeparator} />
                  <View style={popupStyles.detailRow}>
                    <View style={popupStyles.detailLeft}>
                      <Ionicons name="calendar" size={14} color={COLORS.textSecondary} />
                      <Text style={popupStyles.detailLabel}>Créée le</Text>
                    </View>
                    <Text style={popupStyles.detailValue}>{createdAtStr}</Text>
                  </View>
                  <View style={popupStyles.detailSeparator} />
                  <View style={popupStyles.detailRow}>
                    <View style={popupStyles.detailLeft}>
                      <Ionicons name="diamond" size={14} color={COLORS.textSecondary} />
                      <Text style={popupStyles.detailLabel}>Tokens investis</Text>
                    </View>
                    <Text style={popupStyles.detailValue}>
                      {startup.tokensInvested.toLocaleString()}
                    </Text>
                  </View>
                  {startup.creatorName ? (
                    <>
                      <View style={popupStyles.detailSeparator} />
                      <View style={popupStyles.detailRow}>
                        <View style={popupStyles.detailLeft}>
                          <Ionicons name="person" size={14} color={COLORS.textSecondary} />
                          <Text style={popupStyles.detailLabel}>Créateur</Text>
                        </View>
                        <Text style={popupStyles.detailValue}>{startup.creatorName}</Text>
                      </View>
                    </>
                  ) : null}
                </View>

                <View style={popupStyles.divider} />

                {/* 4. Actions */}
                <View style={popupStyles.actions}>
                  {onDelete != null && (
                    <GameButton
                      title="SUPPRIMER L'ENTREPRISE"
                      variant="yellow"
                      fullWidth
                      onPress={onDelete}
                    />
                  )}
                  <GameButton title="FERMER" variant="blue" fullWidth onPress={onClose} />
                </View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const popupStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  centered: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    padding: SPACING[5],
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
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
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  startupName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    textAlign: 'center',
  },
  startupDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  detailBlock: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING[2],
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  detailLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  detailValueWrap: {
    flex: 1,
    marginLeft: SPACING[2],
    textAlign: 'right',
  },
  detailSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actions: {
    gap: SPACING[3],
  },
});

const FILTERS = [
  { id: 'all', label: 'TOUT' },
  { id: 'edtech', label: 'ED TECH' },
  { id: 'greentech', label: 'GREEN TECH' },
  { id: 'fintech', label: 'FINTECH' },
  { id: 'healthtech', label: 'HEALTH' },
];

const MAX_STARTUPS = 3;

// Header height: safeArea + title(~36) + margin(20) + statsRow(~90) + paddingBottom(16)
const HEADER_CONTENT_HEIGHT = 182;

export default function PortfolioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((state) => state.profile);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);

  const startups = profile?.startups ?? [];
  const totalValorisation = startups.reduce((sum, s) => sum + s.tokensInvested, 0);
  const canAddStartup = startups.length < MAX_STARTUPS;

  const filteredStartups = startups.filter((s) => {
    if (activeFilter === 'all') return true;
    return s.sector.toLowerCase().includes(activeFilter.replace('tech', ''));
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateStartup = () => {
    if (canAddStartup) {
      router.push('/(startup)/ideation');
    }
  };

  const formatValorisation = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M€`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K€`;
    return `${value}€`;
  };

  const headerTopPadding = insets.top + 10;
  const headerHeight = headerTopPadding + HEADER_CONTENT_HEIGHT;

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Fixed Header with background */}
      <View style={[styles.fixedHeader, { paddingTop: headerTopPadding }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ScreenHeader
            title="MON PORTFOLIO"
            subtitle={`${startups.length} entreprise${startups.length !== 1 ? 's' : ''}`}
            rightElement={
              <Pressable style={styles.settingsBtn}>
                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            }
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
          <StatCard
            value={formatValorisation(totalValorisation)}
            label="Valorisation Totale"
          />
          <StatCard
            value={`${startups.length} / ${MAX_STARTUPS}`}
            label="Entreprises"
          />
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
        {/* Filtres */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <FilterChips
            filters={FILTERS}
            activeId={activeFilter}
            onSelect={setActiveFilter}
          />
        </Animated.View>

        {/* Liste des Startups */}
        {filteredStartups.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.emptyContainer}>
            <PortfolioIcon color="rgba(255,255,255,0.2)" size={64} />
            <Text style={styles.emptyTitle}>Aucune startup</Text>
            <Text style={styles.emptyDesc}>
              {activeFilter === 'all'
                ? 'Crée ta première startup en jouant et en gagnant des jetons !'
                : 'Aucune startup dans cette catégorie'}
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ gap: 14 }}>
            {filteredStartups.map((startup, index) => (
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
                        <View style={styles.startupIcon}>
                          <PortfolioIcon color="#71808E" size={28} />
                        </View>
                        <View style={styles.startupInfo}>
                          <Text style={styles.startupName}>{startup.name}</Text>
                          <Text style={styles.startupDesc} numberOfLines={2}>
                            {startup.description || `Startup innovante dans le secteur ${startup.sector}`}
                          </Text>
                        </View>
                      </View>

                      {/* Tags */}
                      <View style={styles.tagsRow}>
                        <Tag label={startup.sector} />
                        <Text style={styles.dateText}>
                          Crée il y'a {Math.floor((Date.now() - startup.createdAt) / (1000 * 60 * 60 * 24 * 7))} semaine{Math.floor((Date.now() - startup.createdAt) / (1000 * 60 * 60 * 24 * 7)) !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      {/* Footer stats */}
                      <View style={styles.startupFooter}>
                        <View style={styles.footerStat}>
                          <Text style={styles.footerStatValue}>
                            {formatValorisation(startup.tokensInvested)}
                          </Text>
                          <Text style={styles.footerStatLabel}>Valorisation</Text>
                        </View>
                        <View style={styles.footerStat}>
                          <Text style={styles.footerStatValueGreen}>Niv. {startup.level}</Text>
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
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
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
    padding: 16,
  },
  startupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    fontSize: 18,
    color: '#FFBC40',
    marginBottom: 4,
  },
  startupDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dateText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },
  startupFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  footerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  footerStatValue: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#FFBC40',
  },
  footerStatValueGreen: {
    fontFamily: FONTS.title,
    fontSize: 14,
    color: '#4CAF50',
  },
  footerStatLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
});
