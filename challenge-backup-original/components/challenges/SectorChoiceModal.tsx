/**
 * SectorChoiceModal - Modal de choix de secteur (redesigned)
 *
 * Affiché à la fin du Niveau 1 pour permettre à l'utilisateur
 * de choisir sa spécialisation sectorielle.
 *
 * Design premium:
 * - Grille verticale avec DynamicGradientBorder
 * - Animations staggered (FadeInDown, ZoomIn, springify)
 * - GameButton pour les actions
 * - Confirmation dans un card animé
 */

import { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from 'react-native-reanimated';

import { Modal } from '@/components/ui/Modal';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import type { ChallengeSector } from '@/types/challenge';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS } from '@/styles/spacing';

interface SectorChoiceModalProps {
  visible: boolean;
  sectors: ChallengeSector[];
  onSelect: (sectorId: string) => void;
  onClose: () => void;
  challengeName?: string;
}

// Sector card component
const SectorCard = memo(function SectorCard({
  sector,
  isSelected,
  onPress,
  index,
}: {
  sector: ChallengeSector;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const enterDelay = 200 + index * 100;

  return (
    <Animated.View entering={FadeInDown.delay(enterDelay).duration(400).springify()}>
      <Pressable onPress={onPress}>
        <DynamicGradientBorder
          borderRadius={16}
          fill={isSelected ? `${sector.color}15` : 'rgba(0, 0, 0, 0.3)'}
        >
          <View style={[
            styles.sectorCard,
            isSelected && { borderColor: sector.color, borderWidth: 2 },
          ]}>
            {/* Left: Icon */}
            <Animated.View
              entering={ZoomIn.delay(enterDelay + 100).duration(350)}
              style={[styles.sectorIcon, { backgroundColor: `${sector.color}20` }]}
            >
              <Ionicons
                name={(sector.iconName as keyof typeof Ionicons.glyphMap) || 'leaf-outline'}
                size={28}
                color={sector.color}
              />
            </Animated.View>

            {/* Center: Info */}
            <View style={styles.sectorInfo}>
              <Text style={styles.sectorName}>{sector.name}</Text>
              <Text style={styles.sectorDescription} numberOfLines={2}>
                {sector.description}
              </Text>

              {/* Houses tags */}
              <View style={styles.housesList}>
                {sector.homeNames.map((name, idx) => (
                  <View key={idx} style={[styles.houseTag, { backgroundColor: `${sector.color}18` }]}>
                    <Text style={[styles.houseTagText, { color: sector.color }]}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Right: Radio */}
            <View style={[
              styles.radioOuter,
              isSelected && { borderColor: sector.color },
            ]}>
              {isSelected && (
                <Animated.View
                  entering={ZoomIn.duration(250)}
                  style={[styles.radioInner, { backgroundColor: sector.color }]}
                >
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </Animated.View>
              )}
            </View>
          </View>
        </DynamicGradientBorder>
      </Pressable>
    </Animated.View>
  );
});

export const SectorChoiceModal = memo(function SectorChoiceModal({
  visible,
  sectors,
  onSelect,
  onClose,
  challengeName = 'ce programme',
}: SectorChoiceModalProps) {
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedSector = sectors.find((s) => s.id === selectedSectorId);

  const handleSectorPress = useCallback((sectorId: string) => {
    setSelectedSectorId(sectorId);
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedSectorId) {
      setShowConfirmation(true);
    }
  }, [selectedSectorId]);

  const handleFinalConfirm = useCallback(() => {
    if (selectedSectorId) {
      onSelect(selectedSectorId);
      setShowConfirmation(false);
      setSelectedSectorId(null);
    }
  }, [selectedSectorId, onSelect]);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedSectorId(null);
    setShowConfirmation(false);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      size="full"
      showCloseButton={false}
      closeOnBackdrop={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </Pressable>
        </Animated.View>

        {/* Title section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.titleSection}>
          <Animated.View entering={ZoomIn.delay(150).duration(400)} style={styles.achievementBadge}>
            <Ionicons name="ribbon-outline" size={18} color={COLORS.primary} />
            <Text style={styles.achievementText}>NIVEAU 1 COMPLETE</Text>
          </Animated.View>

          <Text style={styles.title}>Choisissez votre secteur</Text>
          <Text style={styles.subtitle}>
            Cette decision definira votre specialisation pour {challengeName}. Ce choix est definitif.
          </Text>
        </Animated.View>

        {!showConfirmation ? (
          <>
            {/* Sectors list */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {sectors.map((sector, index) => (
                <SectorCard
                  key={sector.id}
                  sector={sector}
                  isSelected={selectedSectorId === sector.id}
                  onPress={() => handleSectorPress(sector.id)}
                  index={index}
                />
              ))}
            </ScrollView>

            {/* Bottom action */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(500).springify()}
              style={styles.bottomAction}
            >
              {selectedSectorId && selectedSector ? (
                <GameButton
                  title="VALIDER MON CHOIX"
                  variant="yellow"
                  fullWidth
                  onPress={handleConfirm}
                />
              ) : (
                <View style={styles.disabledHint}>
                  <Ionicons name="hand-left-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.disabledHintText}>Selectionnez un secteur ci-dessus</Text>
                </View>
              )}
            </Animated.View>
          </>
        ) : (
          /* Confirmation view */
          <Animated.View entering={FadeIn.duration(300)} style={styles.confirmationContainer}>
            <DynamicGradientBorder borderRadius={20} fill="rgba(0, 0, 0, 0.3)">
              <View style={styles.confirmationCard}>
                {/* Large icon */}
                <Animated.View
                  entering={ZoomIn.delay(100).duration(500)}
                  style={[styles.confirmIcon, { backgroundColor: `${selectedSector?.color}20` }]}
                >
                  <Ionicons
                    name={(selectedSector?.iconName as keyof typeof Ionicons.glyphMap) ?? 'leaf-outline'}
                    size={56}
                    color={selectedSector?.color}
                  />
                </Animated.View>

                <Animated.Text
                  entering={FadeInDown.delay(200).duration(300)}
                  style={styles.confirmLabel}
                >
                  Confirmer votre choix ?
                </Animated.Text>

                <Animated.Text
                  entering={FadeInDown.delay(250).duration(300)}
                  style={[styles.confirmSectorName, { color: selectedSector?.color }]}
                >
                  {selectedSector?.name}
                </Animated.Text>

                <Animated.Text
                  entering={FadeInDown.delay(300).duration(300)}
                  style={styles.confirmDescription}
                >
                  Votre parcours et les cartes du jeu seront adaptes au secteur{' '}
                  <Text style={{ color: selectedSector?.color, fontFamily: FONTS.bodySemiBold }}>
                    {selectedSector?.name}
                  </Text>
                  . Ce choix est definitif.
                </Animated.Text>

                {/* Warning */}
                <Animated.View
                  entering={FadeInDown.delay(350).duration(300)}
                  style={styles.warningBox}
                >
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} />
                  <Text style={styles.warningText}>
                    Vous ne pourrez pas changer de secteur par la suite
                  </Text>
                </Animated.View>

                {/* Buttons */}
                <Animated.View
                  entering={FadeInUp.delay(400).duration(400).springify()}
                  style={styles.confirmButtons}
                >
                  <GameButton
                    title="CONFIRMER"
                    variant="green"
                    fullWidth
                    onPress={handleFinalConfirm}
                  />
                  <Pressable style={styles.modifyButton} onPress={handleCancelConfirm}>
                    <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.modifyButtonText}>Modifier mon choix</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </DynamicGradientBorder>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[4],
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 188, 64, 0.15)',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING[3],
  },
  achievementText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },

  // Sectors scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[3],
    paddingBottom: SPACING[4],
  },

  // Sector Card
  sectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sectorIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  sectorInfo: {
    flex: 1,
    marginRight: SPACING[3],
  },
  sectorName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    marginBottom: 2,
  },
  sectorDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING[2],
  },
  housesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  houseTag: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  houseTagText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 9,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom action
  bottomAction: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  disabledHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[4],
  },
  disabledHintText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },

  // Confirmation
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING[4],
  },
  confirmationCard: {
    padding: SPACING[5],
    alignItems: 'center',
  },
  confirmIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING[4],
  },
  confirmLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING[1],
  },
  confirmSectorName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['3xl'],
    marginBottom: SPACING[3],
  },
  confirmDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
    maxWidth: 300,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING[5],
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
  },
  confirmButtons: {
    width: '100%',
    gap: SPACING[3],
    alignItems: 'center',
  },
  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
  },
  modifyButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

export default SectorChoiceModal;
