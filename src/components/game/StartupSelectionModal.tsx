import { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder, Modal } from '@/components/ui';
import { GameButton } from '@/components/ui/GameButton';
import { CustomIdeaModal } from './CustomIdeaModal';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import type { Startup, TargetCard, MissionCard } from '@/types';
import type { DefaultProject } from '@/data/defaultProjects';
import { formatFCFARaw } from '@/utils/currency';

const { width: screenWidth, height: windowHeight } = Dimensions.get('window');
/** Hauteur max de la liste : plus d’items visibles sans scroll (écran × ~40 %, plafonné) */
const SCROLL_LIST_MAX_HEIGHT = Math.min(windowHeight * 0.4, 340);

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
    <>
      <Modal visible={visible} onClose={handleClose} closeOnBackdrop showCloseButton={false} bareContent>
        <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
          <DynamicGradientBorder
            borderRadius={24}
            fill="#0A1929"
            boxWidth={screenWidth - 36}
          >
            <View style={styles.inner}>
              {/* Close button */}
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Header Icon + Title */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="rocket-outline" size={26} color={COLORS.events.quiz} />
                </View>
                <Text style={styles.title}>IDEATION</Text>
                {playerName && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {playerName}, choisis ton projet !
                  </Text>
                )}
              </View>

              {/* Bouton Ajouter une idée - EN HAUT */}
              <Animated.View entering={FadeIn.delay(100)}>
                <Pressable onPress={() => setShowCustomIdeaModal(true)} style={styles.addIdeaButton}>
                  <Ionicons name="add-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.addIdeaButtonText}>Nouvelle idée</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
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
                        <Ionicons name="briefcase" size={16} color={COLORS.events.quiz} />
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
                          {formatFCFARaw(startup.valorisation ?? 0)}
                        </Text>
                      </View>
                      {selectedId === startup.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={12} color={COLORS.white} />
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
                      <Ionicons name="bulb-outline" size={16} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectName} numberOfLines={1}>
                        {project.name}
                      </Text>
                      <Text style={styles.projectDesc} numberOfLines={1}>
                        {project.description}
                      </Text>
                    </View>
                    {selectedId === project.id && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={COLORS.white} />
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
                  size="sm"
                  disabled={!selectedId}
                />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Modal>

      <CustomIdeaModal
        visible={showCustomIdeaModal}
        editionSectors={editionSectors}
        onConfirm={handleCustomIdeaConfirm}
        onClose={() => setShowCustomIdeaModal(false)}
      />
    </>
  );
});

const styles = StyleSheet.create({
  /** Modal plus compacte pour limiter le scroll */
  card: {
    width: '92%',
    maxWidth: 380,
    maxHeight: '72%',
  },
  inner: {
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
  },
  closeButton: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
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
    marginBottom: SPACING[2],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    letterSpacing: 1.5,
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
  addIdeaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
    gap: SPACING[2],
  },
  addIdeaButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[2],
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
    marginBottom: SPACING[2],
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  cardWrapper: {
    marginBottom: SPACING[1],
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  projectCardSelected: {
    borderColor: COLORS.events.quiz,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  projectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[2],
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
    marginTop: 1,
    lineHeight: 14,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.events.quiz,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING[1],
  },
  buttonWrapper: {
    paddingTop: SPACING[2],
  },
});
