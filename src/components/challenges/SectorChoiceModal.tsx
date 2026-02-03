/**
 * SectorChoiceModal - Choix de secteur (Niveau 1 complété)
 */

import { memo, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { DynamicGradientBorder, GameButton } from '@/components/ui';
import type { ChallengeSector } from '@/types/challenge';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING } from '@/styles/spacing';

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!visible) return null;

  const handleValidate = () => {
    if (selectedId) {
      onSelect(selectedId);
      setSelectedId(null);
      onClose();
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(300).springify().damping(20)} style={styles.container}>
          <DynamicGradientBorder borderRadius={24} fill="rgba(10,25,41,0.95)" boxWidth={screenWidth - 36}>
            <View style={styles.inner}>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
              <Text style={styles.badge}>NIVEAU 1 COMPLÈTE</Text>
              <Text style={styles.title}>Choisissez votre secteur</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {sectors.map((sector, index) => (
                  <Animated.View key={sector.id} entering={FadeInDown.delay(200 + index * 80).duration(300)}>
                    <Pressable
                      onPress={() => setSelectedId(sector.id)}
                      style={[styles.sectorCard, selectedId === sector.id && styles.sectorCardSelected]}
                    >
                      <View style={[styles.sectorIcon, { backgroundColor: sector.color + '40' }]}>
                        <Ionicons name={sector.iconName as keyof typeof Ionicons.glyphMap} size={24} color={sector.color} />
                      </View>
                      <View style={styles.sectorInfo}>
                        <Text style={styles.sectorName}>{sector.name}</Text>
                        <Text style={styles.sectorDesc}>{sector.description}</Text>
                      </View>
                      <View style={[styles.radio, selectedId === sector.id && { backgroundColor: COLORS.primary }]}>
                        {selectedId === sector.id && <Ionicons name="checkmark" size={14} color="#FFF" />}
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
              <GameButton variant="yellow" title="VALIDER MON CHOIX" onPress={handleValidate} fullWidth disabled={!selectedId} />
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  container: { width: '100%', maxHeight: '85%' },
  inner: { padding: SPACING[5], paddingTop: SPACING[6] },
  closeBtn: { position: 'absolute', top: SPACING[3], right: SPACING[3], width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  badge: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.xs, color: COLORS.success, marginBottom: SPACING[2] },
  title: { fontFamily: FONTS.title, fontSize: FONT_SIZES.xl, color: COLORS.text, marginBottom: SPACING[4] },
  scroll: { maxHeight: 280, marginBottom: SPACING[4] },
  sectorCard: { flexDirection: 'row', alignItems: 'center', padding: SPACING[3], backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: SPACING[2], borderWidth: 2, borderColor: 'transparent' },
  sectorCardSelected: { borderColor: COLORS.primary },
  sectorIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING[3] },
  sectorInfo: { flex: 1 },
  sectorName: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZES.base, color: COLORS.text },
  sectorDesc: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
});
