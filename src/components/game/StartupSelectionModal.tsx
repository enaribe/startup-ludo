import { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GamePopup, GAME_POPUP_WIDTH } from '@/components/ui/GamePopup';
import { GameButton } from '@/components/ui/GameButton';
import { DynamicGradientBorder } from '@/components/ui/GradientBorder';
import { RocketIcon } from '@/components/icons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import { useTranslation } from '@/i18n';
import type { Startup } from '@/types';
import type { DefaultProject } from '@/data/defaultProjects';

const { height: windowHeight } = Dimensions.get('window');
/** Hauteur max de la liste : plus d'items visibles sans scroll (écran × ~40 %, plafonné) */
const SCROLL_LIST_MAX_HEIGHT = Math.min(windowHeight * 0.38, 320);

// Largeur disponible à l'intérieur du GamePopup (padding horizontal 20 × 2)
const CARD_ROW_WIDTH = GAME_POPUP_WIDTH - 40;

const SELECTED_GRADIENT = [
  { offset: '0%',   color: '#FFBC40', opacity: 0.6 },
  { offset: '40%',  color: '#FFD97A', opacity: 1   },
  { offset: '100%', color: '#FFBC40', opacity: 0.6 },
];

interface StartupSelectionModalProps {
  visible: boolean;
  /** Edition en cours pour filtrer les projets */
  edition?: string;
  /** Startups de l'utilisateur deja filtrees par secteur (peut etre vide) */
  userStartups: Startup[];
  /** Projets par defaut pour cette edition */
  defaultProjects: DefaultProject[];
  /** Nom du joueur qui choisit (optionnel, pour le titre) */
  playerName?: string;
  onSelect: (startupId: string, startupName: string, isDefault: boolean, sector: string) => void;
  onClose: () => void;
}

export const StartupSelectionModal = memo(function StartupSelectionModal({
  visible,
  userStartups,
  defaultProjects,
  playerName,
  onSelect,
  onClose,
}: StartupSelectionModalProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;

    const userStartup = userStartups.find((s) => s.id === selectedId);
    if (userStartup) {
      onSelect(userStartup.id, userStartup.name, false, userStartup.sector);
      setSelectedId(null);
      return;
    }

    const defaultProject = defaultProjects.find((p) => p.id === selectedId);
    if (defaultProject) {
      onSelect(defaultProject.id, defaultProject.name, true, defaultProject.sector);
      setSelectedId(null);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <GamePopup
      visible={visible}
      onRequestClose={handleClose}
      showCloseButton
      closeOnBackdrop
      header={playerName ?? undefined}
      title={t('startupSelect.title')}
      footer={
        <GameButton
          title={t('startupSelect.confirm')}
          onPress={handleConfirm}
          variant="yellow"
          fullWidth
          disabled={!selectedId}
        />
      }
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Startups de l'utilisateur */}
        {userStartups.length > 0 && (
          <View style={styles.section}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {userStartups.map((startup, index) => (
                <Animated.View key={startup.id} entering={FadeIn.delay(index * 80)}>
                  <Pressable onPress={() => setSelectedId(startup.id)}>
                    <DynamicGradientBorder
                      borderRadius={BORDER_RADIUS.xl}
                      fill="rgba(0,0,0,0.35)"
                      boxWidth={130}
                      borderWidth={selectedId === startup.id ? 1.5 : 1}
                      gradientColors={selectedId === startup.id ? SELECTED_GRADIENT : undefined}
                    >
                      <View style={styles.projectCardSquare}>
                        <View style={styles.projectIconWrapSquare}>
                          <RocketIcon
                            color={selectedId === startup.id ? COLORS.primary : '#1F91D0'}
                            size={42}
                            withShadow={false}
                          />
                        </View>
                        <Text
                          style={[
                            styles.projectNameSquare,
                            selectedId === startup.id && styles.projectNameSquareSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {startup.name}
                        </Text>
                        <Text style={styles.projectSectorSquare} numberOfLines={1}>
                          {startup.sector}
                        </Text>
                      </View>
                    </DynamicGradientBorder>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Projets par défaut */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{t('startupSelect.defaultCompany')}</Text>
            <View style={styles.sectionLabelLine} />
          </View>
          {defaultProjects.map((project, index) => (
            <Animated.View
              key={project.id}
              entering={FadeIn.delay((userStartups.length + index) * 80)}
              style={styles.cardWrapper}
            >
              <Pressable onPress={() => setSelectedId(project.id)}>
                <DynamicGradientBorder
                  borderRadius={BORDER_RADIUS.lg}
                  fill="rgba(0,0,0,0.35)"
                  boxWidth={CARD_ROW_WIDTH}
                  borderWidth={selectedId === project.id ? 1.5 : 1}
                  gradientColors={selectedId === project.id ? SELECTED_GRADIENT : undefined}
                >
                  <View style={styles.projectCardRow}>
                    <View style={styles.projectIconWrapRow}>
                      <RocketIcon
                        color={selectedId === project.id ? COLORS.primary : '#1F91D0'}
                        size={32}
                        withShadow={false}
                      />
                    </View>
                    <View style={styles.projectInfoRow}>
                      <Text
                        style={[
                          styles.projectNameRow,
                          selectedId === project.id && styles.projectNameRowSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {project.name}
                      </Text>
                      <Text style={styles.projectSectorRow} numberOfLines={1}>
                        {project.sector}
                      </Text>
                    </View>
                  </View>
                </DynamicGradientBorder>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </GamePopup>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    maxHeight: SCROLL_LIST_MAX_HEIGHT,
    width: '100%',
  },
  content: {
    paddingBottom: SPACING[2],
  },
  section: {
    width: '100%',
    marginBottom: SPACING[4],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING[3],
    gap: SPACING[3],
  },
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sectionLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  horizontalScrollContent: {
    gap: SPACING[3],
    paddingBottom: SPACING[2],
    justifyContent: 'center',
    flexGrow: 1,
  },
  cardWrapper: {
    marginBottom: SPACING[2],
  },
  projectCardSquare: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[3],
  },
  projectIconWrapSquare: {
    marginBottom: SPACING[2],
  },
  projectNameSquare: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xs,
    color: '#1F91D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  projectNameSquareSelected: {
    color: COLORS.primary,
  },
  projectSectorSquare: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  projectCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: CARD_ROW_WIDTH,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  projectIconWrapRow: {
    marginRight: SPACING[4],
  },
  projectInfoRow: {
    flex: 1,
  },
  projectNameRow: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#1F91D0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  projectNameRowSelected: {
    color: COLORS.primary,
  },
  projectSectorRow: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
