import { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Modal as RNModal } from 'react-native';
import Animated, { SlideInUp, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder } from '@/components/ui';
import { GameButton } from '@/components/ui/GameButton';
import { CustomIdeaModal } from './CustomIdeaModal';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import type { Startup, TargetCard, MissionCard } from '@/types';
import type { DefaultProject } from '@/data/defaultProjects';

const { width: screenWidth } = Dimensions.get('window');

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCustomIdeaModal, setShowCustomIdeaModal] = useState(false);

  // Extraire les secteurs de l'édition depuis les projets par défaut
  const editionSectors = Array.from(new Set(defaultProjects.map((p) => p.sector)));

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

  const handleCustomIdeaConfirm = (
    sector: string,
    _target: TargetCard,
    _mission: MissionCard,
    generatedIdea: { name: string; description: string; pitch: string }
  ) => {
    // Créer un ID temporaire pour cette idée personnalisée
    const customId = `custom_${Date.now()}`;

    // Appeler onSelect avec les infos de la startup personnalisée
    // Utiliser l'idée déjà générée dans CustomIdeaModal
    onSelect(customId, generatedIdea.name, false, sector);

    // Fermer les modales
    setShowCustomIdeaModal(false);
    setSelectedId(null);
  };

  return (
    <RNModal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View entering={SlideInUp.duration(280).springify().damping(32)} style={styles.container}>
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.95)"
            boxWidth={screenWidth - 32}
          >
            <View style={styles.inner}>
              {/* Close button */}
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Header Icon + Title */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="rocket-outline" size={40} color={COLORS.events.quiz} />
                </View>
                <Text style={styles.title}>IDEATION</Text>
                {playerName && (
                  <Text style={styles.subtitle}>{playerName}, choisis ton projet !</Text>
                )}
              </View>

              {/* Bouton Ajouter une idée - EN HAUT */}
              <Animated.View entering={FadeIn.delay(100)}>
                <Pressable onPress={() => setShowCustomIdeaModal(true)} style={styles.addIdeaButton}>
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.addIdeaButtonText}>Créer une nouvelle idée</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                </Pressable>
              </Animated.View>

              <View style={styles.divider} />

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
          {/* User's own startups */}
          {userStartups.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Mes Projets</Text>
              {userStartups.map((startup, index) => (
                <Animated.View key={startup.id} entering={FadeIn.delay(index * 80)}>
                  <Pressable
                    onPress={() => setSelectedId(startup.id)}
                    style={styles.cardWrapper}
                  >
                    <View
                      style={[
                        styles.projectCard,
                        selectedId === startup.id && styles.projectCardSelected,
                      ]}
                    >
                      <View style={styles.projectIconWrap}>
                        <Ionicons name="briefcase" size={20} color={COLORS.events.quiz} />
                      </View>
                      <View style={styles.projectInfo}>
                        <Text style={styles.projectName} numberOfLines={1}>
                          {startup.name}
                        </Text>
                        <Text style={styles.projectSector} numberOfLines={1}>
                          {startup.sector}
                        </Text>
                      </View>
                      <View style={styles.valorBadge}>
                        <Text style={styles.valorText}>
                          {Math.round((startup.valorisation ?? 0) / 1000)}k
                        </Text>
                      </View>
                      {selectedId === startup.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Default projects */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {userStartups.length > 0 ? 'Projets par Defaut' : 'Choisis un Projet'}
            </Text>
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
                      styles.projectCard,
                      selectedId === project.id && styles.projectCardSelected,
                    ]}
                  >
                    <View style={[styles.projectIconWrap, styles.defaultIconWrap]}>
                      <Ionicons name="bulb-outline" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectName} numberOfLines={1}>
                        {project.name}
                      </Text>
                      <Text style={styles.projectDesc} numberOfLines={2}>
                        {project.description}
                      </Text>
                    </View>
                    {selectedId === project.id && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={14} color={COLORS.white} />
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
              </ScrollView>

              {/* Confirm button */}
              <View style={styles.buttonWrapper}>
                <GameButton
                  title="Confirmer"
                  onPress={handleConfirm}
                  variant="yellow"
                  fullWidth
                  disabled={!selectedId}
                />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>

      {/* Custom Idea Modal */}
      <CustomIdeaModal
        visible={showCustomIdeaModal}
        editionSectors={editionSectors}
        onConfirm={handleCustomIdeaConfirm}
        onClose={() => setShowCustomIdeaModal(false)}
      />
    </RNModal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth - 32,
    maxHeight: '85%',
  },
  inner: {
    paddingVertical: SPACING[5],
    paddingHorizontal: SPACING[4],
  },
  closeButton: {
    position: 'absolute',
    top: SPACING[4],
    right: SPACING[4],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  addIdeaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    gap: SPACING[2],
  },
  addIdeaButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[4],
  },
  scrollView: {
    flexGrow: 0,
    maxHeight: 350,
  },
  content: {
    paddingBottom: SPACING[2],
  },
  section: {
    width: '100%',
    marginBottom: SPACING[3],
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: SPACING[3],
    textAlign: 'center',
  },
  cardWrapper: {
    marginBottom: SPACING[2],
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[3],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  projectCardSelected: {
    borderColor: COLORS.events.quiz,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  projectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  defaultIconWrap: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectSector: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  projectDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
    lineHeight: 16,
  },
  valorBadge: {
    backgroundColor: 'rgba(255, 188, 64, 0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 2,
    paddingHorizontal: SPACING[2],
    marginLeft: SPACING[2],
  },
  valorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.events.quiz,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING[2],
  },
  buttonWrapper: {
    paddingTop: SPACING[4],
  },
});
