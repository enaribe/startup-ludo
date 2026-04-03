import { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import { DynamicGradientBorder, Modal } from '@/components/ui';
import { GameButton } from '@/components/ui/GameButton';
import { RocketIcon } from '@/components/icons';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import type { Startup } from '@/types';
import type { DefaultProject } from '@/data/defaultProjects';

const { width: screenWidth, height: windowHeight } = Dimensions.get('window');
/** Hauteur max de la liste : plus d’items visibles sans scroll (écran × ~40 %, plafonné) */
const SCROLL_LIST_MAX_HEIGHT = Math.min(windowHeight * 0.45, 400);

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

// Texte avec contour (stroke) simulé par empilement de Text décalés
const OutlinedText = memo(function OutlinedText({
  text,
  style,
  outlineColor,
  outlineWidth = 2,
}: {
  text: string;
  style: object;
  outlineColor: string;
  outlineWidth?: number;
}) {
  const offsets = [
    { x: -outlineWidth, y: -outlineWidth },
    { x: 0, y: -outlineWidth },
    { x: outlineWidth, y: -outlineWidth },
    { x: outlineWidth, y: 0 },
    { x: outlineWidth, y: outlineWidth },
    { x: 0, y: outlineWidth },
    { x: -outlineWidth, y: outlineWidth },
    { x: -outlineWidth, y: 0 },
  ];
  return (
    <View>
      {offsets.map((offset, i) => (
        <Text
          key={i}
          style={[style, { color: outlineColor, position: 'absolute', left: offset.x, top: offset.y }]}
          numberOfLines={1}
        >
          {text}
        </Text>
      ))}
      <Text style={[style, { color: '#FFFFFF' }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
});

export const StartupSelectionModal = memo(function StartupSelectionModal({
  visible,
  userStartups,
  defaultProjects,
  playerName,
  onSelect,
  onClose,
}: StartupSelectionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;

    // Check user startups first
    const userStartup = userStartups.find((s) => s.id === selectedId);
    if (userStartup) {
      onSelect(userStartup.id, userStartup.name, false, userStartup.sector);
      setSelectedId(null);
      return;
    }

    // Then default projects
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
    <>
      <Modal visible={visible} onClose={handleClose} closeOnBackdrop showCloseButton={false} bareContent>
        <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
          <DynamicGradientBorder
            borderRadius={24}
            fill="#0A1929"
            boxWidth={screenWidth - 36}
          >
            <View style={styles.inner}>
              {/* Header Title */}
              <View style={styles.header}>
                <OutlinedText
                  text="CHOISISSEZ VOTRE STARTUP"
                  style={styles.title}
                  outlineColor="#1F91D0"
                  outlineWidth={1.5}
                />
                {playerName && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {playerName}
                  </Text>
                )}
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
          {/* User's own startups */}
          {userStartups.length > 0 ? (
            <View style={styles.section}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollContent}>
                {userStartups.map((startup, index) => (
                  <Animated.View key={startup.id} entering={FadeIn.delay(index * 80)}>
                    <Pressable
                      onPress={() => setSelectedId(startup.id)}
                      style={styles.cardWrapper}
                    >
                      <View
                        style={[
                          styles.projectCardSquare,
                          selectedId === startup.id && styles.projectCardSquareSelected,
                        ]}
                      >
                        <View style={styles.projectIconWrapSquare}>
                          <RocketIcon
                            color={selectedId === startup.id ? COLORS.primary : '#7F8E9E'}
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
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Default projects */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>
                Startup par défaut
              </Text>
              <View style={styles.sectionLabelLine} />
            </View>
            {defaultProjects.map((project, index) => (
              <Animated.View
                key={project.id}
                entering={FadeIn.delay((userStartups.length + index) * 80)}
              >
                <Pressable
                  onPress={() => setSelectedId(project.id)}
                  style={styles.cardWrapper}
                >
                  <View
                    style={[
                      styles.projectCardRow,
                      selectedId === project.id && styles.projectCardRowSelected,
                    ]}
                  >
                    <View style={styles.projectIconWrapRow}>
                      <RocketIcon 
                        color={selectedId === project.id ? COLORS.primary : "#7F8E9E"} 
                        size={32} 
                        withShadow={false} 
                      />
                    </View>
                    <View style={styles.projectInfoRow}>
                      <Text 
                        style={[
                          styles.projectNameRow,
                          selectedId === project.id && styles.projectNameRowSelected
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
                </Pressable>
              </Animated.View>
            ))}
          </View>
              </ScrollView>

              {/* Confirm button */}
              <View style={styles.buttonWrapper}>
                <GameButton
                  title="CONFIRMER"
                  onPress={handleConfirm}
                  variant="yellow"
                  fullWidth
                  disabled={!selectedId}
                />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  /** Modal plus compacte pour limiter le scroll */
  card: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  inner: {
    width: screenWidth - 36,
    padding: SPACING[5],
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING[4],
    marginTop: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: SPACING[1],
    paddingHorizontal: SPACING[2],
  },
  scrollView: {
    flexGrow: 0,
    maxHeight: SCROLL_LIST_MAX_HEIGHT,
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
  },
  cardWrapper: {
    marginBottom: SPACING[2],
  },
  projectCardSquare: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING[3],
  },
  projectCardSquareSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 188, 64, 0.05)',
  },
  projectIconWrapSquare: {
    marginBottom: SPACING[2],
  },
  projectNameSquare: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xs,
    color: '#7F8E9E',
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  projectCardRowSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 188, 64, 0.05)',
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
    color: '#7F8E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  projectNameRowSelected: {
    color: '#FFFFFF',
  },
  projectSectorRow: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buttonWrapper: {
    paddingTop: SPACING[3],
  },
});
