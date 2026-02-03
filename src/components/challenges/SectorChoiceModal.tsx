/**
 * Modal choix de secteur (Niveau 1 complété)
 */

import { memo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import type { ChallengeSector } from '@/types/challenge';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';
import { COLORS } from '@/styles/colors';
import { useSettingsStore } from '@/stores';

const { width: screenWidth } = Dimensions.get('window');

interface SectorChoiceModalProps {
  visible: boolean;
  sectors: ChallengeSector[];
  onSelect: (sectorId: string) => void;
  onClose: () => void;
  challengeName?: string;
}

export const SectorChoiceModal = memo(function SectorChoiceModal({
  visible,
  sectors,
  onSelect,
  onClose,
}: SectorChoiceModalProps) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'select' | 'confirm'>('select');

  const handleClose = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(null);
    setPhase('select');
    onClose();
  };

  const handleValidate = () => {
    if (phase === 'select') {
      if (!selectedId) return;
      if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setPhase('confirm');
    } else {
      if (selectedId) {
        if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect(selectedId);
        handleClose();
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View
          entering={SlideInUp.duration(300).springify().damping(20)}
          style={styles.container}
        >
          <DynamicGradientBorder
            borderRadius={24}
            fill="rgba(10, 25, 41, 0.95)"
            boxWidth={screenWidth - 36}
          >
            <View style={styles.inner}>
              <Pressable onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>NIVEAU 1 COMPLÈTE</Text>
              </View>
              <Text style={styles.title}>Choisissez votre secteur</Text>
              {phase === 'select' ? (
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                  {sectors.map((sector, index) => (
                    <Animated.View
                      key={sector.id}
                      entering={FadeInDown.delay(200 + index * 100).duration(300).springify()}
                    >
                      <Pressable
                        onPress={() => {
                          setSelectedId(sector.id);
                          if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[
                          styles.sectorCard,
                          selectedId === sector.id && styles.sectorCardSelected,
                        ]}
                      >
                        <View style={[styles.sectorIcon, { backgroundColor: sector.color + '40' }]}>
                          <Ionicons name={sector.iconName as keyof typeof Ionicons.glyphMap} size={24} color={sector.color} />
                        </View>
                        <View style={styles.sectorInfo}>
                          <Text style={styles.sectorName}>{sector.name}</Text>
                          <Text style={styles.sectorDesc}>{sector.description}</Text>
                          <View style={styles.homeNames}>
                            {sector.homeNames.map((h, i) => (
                              <Text key={i} style={styles.homeTag}>{h}</Text>
                            ))}
                          </View>
                        </View>
                        <View style={[styles.radio, selectedId === sector.id && styles.radioSelected]}>
                          {selectedId === sector.id && (
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                          )}
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </ScrollView>
              ) : (
                <Animated.View entering={ZoomIn.duration(200).springify()} style={styles.confirmBlock}>
                  {selectedId && (() => {
                    const s = sectors.find((x) => x.id === selectedId)!;
                    return (
                      <>
                        <View style={[styles.confirmIcon, { backgroundColor: s.color + '40' }]}>
                          <Ionicons name={s.iconName as keyof typeof Ionicons.glyphMap} size={40} color={s.color} />
                        </View>
                        <Text style={styles.confirmName}>{s.name}</Text>
                        <Text style={styles.confirmWarning}>Ce choix est définitif.</Text>
                      </>
                    );
                  })()}
                </Animated.View>
              )}
              <View style={styles.actions}>
                {phase === 'confirm' && (
                  <GameButton
                    variant="blue"
                    title="MODIFIER MON CHOIX"
                    onPress={() => setPhase('select')}
                    fullWidth
                    style={styles.actionBtn}
                  />
                )}
                <GameButton
                  variant={phase === 'confirm' ? 'green' : 'yellow'}
                  title={phase === 'confirm' ? 'CONFIRMER' : selectedId ? 'VALIDER MON CHOIX' : 'Sélectionnez un secteur'}
                  onPress={handleValidate}
                  fullWidth
                  disabled={phase === 'select' && !selectedId}
                />
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  container: { width: '100%', maxHeight: '85%' },
  inner: { padding: SPACING[5], paddingTop: SPACING[6] },
  closeBtn: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.success + '30',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: 8,
    marginBottom: SPACING[3],
  },
  badgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING[4],
  },
  scroll: { maxHeight: 280, marginBottom: SPACING[4] },
  sectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[3],
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginBottom: SPACING[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sectorCardSelected: { borderColor: COLORS.primary },
  sectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING[3],
  },
  sectorInfo: { flex: 1 },
  sectorName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  sectorDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  homeNames: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  homeTag: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textMuted,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  confirmBlock: { alignItems: 'center', marginBottom: SPACING[5] },
  confirmIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING[3],
  },
  confirmName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  confirmWarning: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
  },
  actions: { gap: SPACING[2] },
  actionBtn: { marginBottom: 0 },
});
