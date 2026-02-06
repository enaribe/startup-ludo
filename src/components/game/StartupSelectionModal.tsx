import { memo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { GameButton } from '@/components/ui/GameButton';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import type { Startup } from '@/types';
import type { DefaultProject } from '@/data/defaultProjects';

interface StartupSelectionModalProps {
  visible: boolean;
  /** Edition en cours pour filtrer les projets */
  edition: string;
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
    <Modal
      visible={visible}
      onClose={handleClose}
      closeOnBackdrop={false}
      showCloseButton={false}
      bareContent
    >
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="rocket-outline" size={36} color={COLORS.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>IDEATION</Text>

          {playerName && (
            <Text style={styles.subtitle}>{playerName}, choisis ton projet !</Text>
          )}

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
                        <Ionicons name="briefcase" size={20} color={COLORS.primary} />
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
                      <Ionicons name="bulb-outline" size={20} color="#8E99A4" />
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
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 380,
    width: '94%',
    maxHeight: '85%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  scrollView: {
    flexGrow: 0,
  },
  content: {
    paddingTop: SPACING[5],
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[2],
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[3],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING[1],
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: SPACING[4],
  },
  section: {
    width: '100%',
    marginBottom: SPACING[3],
  },
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#8E99A4',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
  },
  cardWrapper: {
    marginBottom: SPACING[2],
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING[3],
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  projectCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 188, 64, 0.08)',
  },
  projectIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  defaultIconWrap: {
    backgroundColor: 'rgba(142, 153, 164, 0.12)',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#2C3E50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectSector: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  projectDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: '#8E99A4',
    marginTop: 2,
    lineHeight: 16,
  },
  valorBadge: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
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
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING[2],
  },
  buttonWrapper: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[5],
    paddingTop: SPACING[2],
  },
});
