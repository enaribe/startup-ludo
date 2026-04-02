import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';

import { DynamicGradientBorder } from './GradientBorder';
import { Modal } from './Modal';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONT_SIZES, FONTS } from '@/styles/typography';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 36;
const PAGE_WIDTH = CARD_WIDTH - SPACING[5] * 2;

export interface InfoSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  headerIcon: keyof typeof Ionicons.glyphMap;
  description: string;
  sections: InfoSection[];
}

export function InfoModal({ visible, onClose, title, headerIcon, description, sections }: InfoModalProps) {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.centered}>
        <DynamicGradientBorder borderRadius={24} fill="#0A1929" boxWidth={CARD_WIDTH}>
          <View style={styles.card}>
            {/* Close */}
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>

            {/* Header */}
            <View style={styles.header}>
              <Ionicons name={headerIcon} size={40} color="#FFBC40" />
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Swipeable sections */}
            <View style={styles.swipeContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                style={{ width: PAGE_WIDTH, alignSelf: 'center' }}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const w = e.nativeEvent.layoutMeasurement.width;
                  if (w > 0) setPageIndex(Math.round(x / w));
                }}
              >
                {sections.map((section, i) => (
                  <View key={i} style={[styles.page, { width: PAGE_WIDTH }]}>
                    <View style={styles.sectionIconRow}>
                      <View style={styles.sectionIconBadge}>
                        <Ionicons name={section.icon} size={22} color={COLORS.primary} />
                      </View>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>
                    <Text style={styles.sectionBody}>{section.body}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Dots */}
              <View style={styles.dots}>
                {sections.map((_, i) => (
                  <View key={i} style={[styles.dot, i === pageIndex && styles.dotActive]} />
                ))}
              </View>
            </View>
          </View>
        </DynamicGradientBorder>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: CARD_WIDTH,
    padding: SPACING[5],
    position: 'relative',
    gap: SPACING[4],
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING[3],
    right: SPACING[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[2],
  },
  title: {
    fontFamily: FONTS.title,
    fontSize: 24,
    color: COLORS.white,
    textAlign: 'center',
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[5],
  },
  page: {
    gap: SPACING[3],
    minHeight: 110,
  },
  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  sectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 145, 208, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: 16,
    color: COLORS.primary,
    flex: 1,
  },
  sectionBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING[4],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
