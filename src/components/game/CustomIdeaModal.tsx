/**
 * CustomIdeaModal - Modal pour créer une idée personnalisée en mode multijoueur
 *
 * Flow:
 * 1. Si édition multi-secteurs → Choix du secteur
 * 2. Choix de la cible (TARGET_CARDS)
 * 3. Choix de la mission (MISSION_CARDS)
 * 4. Animation de génération
 * 5. Prévisualisation de l'idée générée
 * 6. Validation
 */

import { memo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Modal as RNModal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  SlideInUp,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder } from '@/components/ui';
import { GameButton } from '@/components/ui/GameButton';
import { generateStartupIdea } from '@/utils/startupNameGenerator';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';
import { TARGET_CARDS, MISSION_CARDS, SECTOR_CARDS } from '@/constants/ideation';
import type { TargetCard, MissionCard } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

interface CustomIdeaModalProps {
  visible: boolean;
  /** Secteurs de l'édition en cours */
  editionSectors: string[];
  onConfirm: (
    sector: string,
    target: TargetCard,
    mission: MissionCard,
    generatedIdea: { name: string; description: string; pitch: string }
  ) => void;
  onClose: () => void;
}

type Step = 'sector' | 'target' | 'mission' | 'generating' | 'preview';

export const CustomIdeaModal = memo(function CustomIdeaModal({
  visible,
  editionSectors,
  onConfirm,
  onClose,
}: CustomIdeaModalProps) {
  const [step, setStep] = useState<Step>('sector');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<TargetCard | null>(null);
  const [selectedMission, setSelectedMission] = useState<MissionCard | null>(null);
  const [generatedName, setGeneratedName] = useState<string>('');
  const [generatedDescription, setGeneratedDescription] = useState<string>('');
  const [generatedPitch, setGeneratedPitch] = useState<string>('');

  // Animation values
  const iconScale = useSharedValue(1);

  // Si un seul secteur, auto-sélectionner et passer à la cible
  useEffect(() => {
    if (visible && editionSectors.length === 1) {
      setSelectedSector(editionSectors[0]!);
      setStep('target');
    } else if (visible) {
      setStep('sector');
    }
  }, [visible, editionSectors]);

  // Reset quand on ferme
  useEffect(() => {
    if (!visible) {
      setStep('sector');
      setSelectedSector(null);
      setSelectedTarget(null);
      setSelectedMission(null);
      setGeneratedName('');
      setGeneratedDescription('');
      setGeneratedPitch('');
    }
  }, [visible]);

  // Animation de génération
  useEffect(() => {
    if (step === 'generating') {
      // Simple pulse animation
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Simulate generation (1.5 seconds)
      const timer = setTimeout(() => {
        setStep('preview');
      }, 1500);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [step, iconScale]);

  // Secteurs disponibles filtrés par l'édition
  const availableSectors = SECTOR_CARDS.filter((s) => editionSectors.includes(s.id));

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSector(sectorId);
  };

  const handleTargetSelect = (target: TargetCard) => {
    setSelectedTarget(target);
  };

  const handleMissionSelect = (mission: MissionCard) => {
    setSelectedMission(mission);
  };

  const handleNextFromSector = () => {
    if (selectedSector) {
      setStep('target');
    }
  };

  const handleNextFromTarget = () => {
    if (selectedTarget) {
      setStep('mission');
    }
  };

  const handleConfirmMission = () => {
    if (selectedSector && selectedTarget && selectedMission) {
      // Trouver les titres complets
      const sectorCard = SECTOR_CARDS.find((s) => s.id === selectedSector);

      // Générer l'idée complète avec IA
      const idea = generateStartupIdea(
        selectedSector,
        sectorCard?.title || selectedSector,
        selectedTarget.title,
        selectedTarget.category,
        selectedMission.title,
        selectedMission.category
      );

      setGeneratedName(idea.name);
      setGeneratedDescription(idea.description);
      setGeneratedPitch(idea.pitch);

      // Passer à l'écran de génération
      setStep('generating');
    }
  };

  const handleFinalConfirm = () => {
    if (selectedSector && selectedTarget && selectedMission) {
      // Passer l'idée générée au parent
      onConfirm(selectedSector, selectedTarget, selectedMission, {
        name: generatedName,
        description: generatedDescription,
        pitch: generatedPitch,
      });
      // Reset
      setStep('sector');
      setSelectedSector(null);
      setSelectedTarget(null);
      setSelectedMission(null);
      setGeneratedName('');
      setGeneratedDescription('');
      setGeneratedPitch('');
    }
  };

  const handleBack = () => {
    if (step === 'preview' || step === 'generating') {
      setStep('mission');
      setSelectedMission(null);
      setGeneratedName('');
      setGeneratedDescription('');
      setGeneratedPitch('');
    } else if (step === 'mission') {
      setStep('target');
      setSelectedMission(null);
    } else if (step === 'target' && editionSectors.length > 1) {
      setStep('sector');
      setSelectedTarget(null);
    } else {
      onClose();
    }
  };

  const getRarityColor = (rarity: 'common' | 'rare' | 'legendary') => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'rare':
        return '#9B59B6';
      default:
        return '#95A5A6';
    }
  };

  const renderStepIndicator = () => {
    // Ne pas afficher l'indicateur sur les écrans generating et preview
    if (step === 'generating' || step === 'preview') return null;

    const steps: Step[] = editionSectors.length > 1 ? ['sector', 'target', 'mission'] : ['target', 'mission'];
    const currentIndex = steps.indexOf(step);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((s, index) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, index <= currentIndex && styles.stepCircleActive]}>
              <Text style={[styles.stepNumber, index <= currentIndex && styles.stepNumberActive]}>
                {index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>
    );
  };

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
    ],
  }));

  return (
    <RNModal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBack} />

        <Animated.View entering={SlideInUp.duration(280).springify().damping(32)} style={styles.container}>
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.95)"
            boxWidth={screenWidth - 32}
          >
            <View style={styles.inner}>
              {/* Close/Back button */}
              <Pressable onPress={handleBack} style={styles.closeButton}>
                <Ionicons name={step === 'sector' || (step === 'target' && editionSectors.length === 1) ? 'close' : 'arrow-back'} size={22} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Header Icon + Title */}
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="bulb" size={40} color={COLORS.events.quiz} />
                </View>
                <Text style={styles.title}>CRÉER UNE IDÉE</Text>
              </View>

              {renderStepIndicator()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP: Secteur */}
          {step === 'sector' && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Choisis un Secteur</Text>
              {availableSectors.map((sector, index) => (
                <Animated.View key={sector.id} entering={FadeIn.delay(index * 80)}>
                  <Pressable
                    onPress={() => handleSectorSelect(sector.id)}
                    style={styles.cardWrapper}
                  >
                    <View
                      style={[
                        styles.itemCard,
                        selectedSector === sector.id && styles.itemCardSelected,
                      ]}
                    >
                      <View style={styles.itemIconWrap}>
                        <Ionicons name="briefcase" size={20} color={COLORS.events.quiz} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{sector.title}</Text>
                        <View style={styles.rarityBadge}>
                          <View style={[styles.rarityDot, { backgroundColor: getRarityColor(sector.rarity) }]} />
                          <Text style={styles.rarityText}>{sector.rarity}</Text>
                        </View>
                      </View>
                      {selectedSector === sector.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
              </View>
            </>
          )}

          {/* STEP: Cible */}
          {step === 'target' && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Choisis ta Cible</Text>
              {TARGET_CARDS.map((target, index) => (
                <Animated.View key={target.id} entering={FadeIn.delay(index * 50)}>
                  <Pressable
                    onPress={() => handleTargetSelect(target)}
                    style={styles.cardWrapper}
                  >
                    <View
                      style={[
                        styles.itemCard,
                        selectedTarget?.id === target.id && styles.itemCardSelected,
                      ]}
                    >
                      <View style={styles.itemIconWrap}>
                        <Ionicons name="people" size={20} color={COLORS.events.quiz} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{target.title}</Text>
                        <View style={styles.rarityBadge}>
                          <View style={[styles.rarityDot, { backgroundColor: getRarityColor(target.rarity) }]} />
                          <Text style={styles.rarityText}>{target.category}</Text>
                        </View>
                      </View>
                      {selectedTarget?.id === target.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
              </View>
            </>
          )}

          {/* STEP: Mission */}
          {step === 'mission' && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Choisis ta Mission</Text>
              {MISSION_CARDS.map((mission, index) => (
                <Animated.View key={mission.id} entering={FadeIn.delay(index * 50)}>
                  <Pressable
                    onPress={() => handleMissionSelect(mission)}
                    style={styles.cardWrapper}
                  >
                    <View
                      style={[
                        styles.itemCard,
                        selectedMission?.id === mission.id && styles.itemCardSelected,
                      ]}
                    >
                      <View style={styles.itemIconWrap}>
                        <Ionicons name="rocket" size={20} color={COLORS.events.quiz} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{mission.title}</Text>
                        <View style={styles.rarityBadge}>
                          <View style={[styles.rarityDot, { backgroundColor: getRarityColor(mission.rarity) }]} />
                          <Text style={styles.rarityText}>{mission.category}</Text>
                        </View>
                      </View>
                      {selectedMission?.id === mission.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name="checkmark" size={14} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
              </View>
            </>
          )}

          {/* STEP: Generating */}
          {step === 'generating' && (
            <View style={styles.generatingContainer}>
              <Animated.View style={[styles.generatingIcon, iconAnimStyle]}>
                <Ionicons name="bulb" size={64} color={COLORS.events.quiz} />
              </Animated.View>
              <Text style={styles.generatingTitle}>Génération en cours...</Text>
              <Text style={styles.generatingText}>
                Création de votre startup innovante
              </Text>
            </View>
          )}

          {/* STEP: Preview */}
          {step === 'preview' && (
            <View style={styles.previewContainer}>
              <View style={styles.previewIconCircle}>
                <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
              </View>
              <Text style={styles.previewTitle}>VOTRE IDÉE</Text>
              <View style={styles.previewNameBox}>
                <Text style={styles.previewName}>{generatedName}</Text>
              </View>
              <View style={styles.previewPitchBox}>
                <Text style={styles.previewPitch}>{generatedPitch}</Text>
              </View>
              <View style={styles.previewDescBox}>
                <Text style={styles.previewDescLabel}>Description complète</Text>
                <Text style={styles.previewDesc}>{generatedDescription}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
        {step !== 'generating' && (
          <View style={styles.buttonWrapper}>
            {step === 'sector' && (
              <GameButton
                title="Suivant"
                onPress={handleNextFromSector}
                variant="yellow"
                fullWidth
                disabled={!selectedSector}
              />
            )}
            {step === 'target' && (
              <GameButton
                title="Suivant"
                onPress={handleNextFromTarget}
                variant="yellow"
                fullWidth
                disabled={!selectedTarget}
              />
            )}
            {step === 'mission' && (
              <GameButton
                title="Générer"
                onPress={handleConfirmMission}
                variant="yellow"
                fullWidth
                disabled={!selectedMission}
              />
            )}
            {step === 'preview' && (
              <GameButton
                title="Valider"
                onPress={handleFinalConfirm}
                variant="green"
                fullWidth
              />
            )}
          </View>
        )}
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[2],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepCircleActive: {
    backgroundColor: COLORS.events.quiz,
    borderColor: COLORS.events.quiz,
  },
  stepNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: SPACING[3],
  },
  scrollView: {
    flexGrow: 0,
    maxHeight: 400,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING[3],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemCardSelected: {
    borderColor: COLORS.events.quiz,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  itemIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rarityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rarityText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'capitalize',
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
  // Generating screen styles
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING[8],
    paddingHorizontal: SPACING[4],
  },
  generatingIcon: {
    marginBottom: SPACING[4],
  },
  generatingTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: SPACING[2],
  },
  generatingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Preview screen styles
  previewContainer: {
    alignItems: 'center',
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
  previewIconCircle: {
    marginBottom: SPACING[4],
  },
  previewTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: SPACING[4],
  },
  previewNameBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.25)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[3],
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.4)',
  },
  previewName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  previewPitchBox: {
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[3],
    borderWidth: 1,
    borderColor: 'rgba(255, 188, 64, 0.3)',
  },
  previewPitch: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: '#FFBC40',
    textAlign: 'center',
    lineHeight: 22,
  },
  previewDescBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewDescLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  previewDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
