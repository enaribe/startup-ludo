/**
 * HelpScreen — Aide & Support (FAQ).
 *
 * Design aligné sur les autres écrans (profil, statistiques, succès) :
 * header fixe #0A1929 arrondi, cartes DynamicGradientBorder fond rgba(0,0,0,0.35).
 */
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { RadialBackground, DynamicGradientBorder } from '@/components/ui';
import { useSettingsStore } from '@/stores';
import { useTranslation } from '@/i18n';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth - SPACING[4] * 2;

/** Lien du groupe communauté WhatsApp (identique à l'écran Profil). */
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/HMOY7uJBbNd4O64gysmitZ';

type FAQCategory = 'gameplay' | 'startup' | 'online' | 'challenges' | 'account';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

/** Métadonnées des FAQ — le texte (question/réponse) est résolu via i18n au rendu. */
const FAQ_META: { id: string; category: FAQCategory }[] = [
  // ─── Gameplay ───
  { id: 'faq1', category: 'gameplay' },
  { id: 'faq2', category: 'gameplay' },
  { id: 'faq3', category: 'gameplay' },
  { id: 'faq4', category: 'gameplay' },
  { id: 'faq5', category: 'gameplay' },
  // ─── Entreprises ───
  { id: 'faq6', category: 'startup' },
  { id: 'faq7', category: 'startup' },
  { id: 'faq8', category: 'startup' },
  // ─── Multijoueur en ligne ───
  { id: 'faq9', category: 'online' },
  { id: 'faq10', category: 'online' },
  { id: 'faq11', category: 'online' },
  // ─── Programmes & challenges ───
  { id: 'faq12', category: 'challenges' },
  { id: 'faq13', category: 'challenges' },
  // ─── Compte ───
  { id: 'faq14', category: 'account' },
  { id: 'faq15', category: 'account' },
  { id: 'faq16', category: 'account' },
  { id: 'faq17', category: 'account' },
];

const CATEGORIES: { id: 'all' | FAQCategory; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'all', labelKey: 'help.all', icon: 'apps' },
  { id: 'gameplay', labelKey: 'help.gameplay', icon: 'game-controller' },
  { id: 'startup', labelKey: 'help.startups', icon: 'rocket' },
  { id: 'online', labelKey: 'help.online', icon: 'people' },
  { id: 'challenges', labelKey: 'help.programs', icon: 'trophy' },
  { id: 'account', labelKey: 'help.account', icon: 'person' },
];

interface AccordionItemProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

function AccordionItem({ item, isExpanded, onToggle, index }: AccordionItemProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const rotation = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 200 });
  contentHeight.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value,
    maxHeight: contentHeight.value * 260,
  }));

  const handlePress = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
    onToggle();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(350)}
      style={styles.accordionWrapper}
    >
      <DynamicGradientBorder borderRadius={14} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
        <Pressable onPress={handlePress} style={styles.accordionInner}>
          <View style={styles.accordionHeader}>
            <Text style={styles.question}>{item.question}</Text>
            <Animated.View style={iconStyle}>
              <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.answerWrap, contentStyle]}>
            <Text style={styles.answer}>{item.answer}</Text>
          </Animated.View>
        </Pressable>
      </DynamicGradientBorder>
    </Animated.View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCategorySelect = (categoryId: 'all' | FAQCategory) => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setSelectedCategory(categoryId);
    setExpandedId(null);
  };

  const faqItems: FAQItem[] = FAQ_META.map((meta) => ({
    id: meta.id,
    category: meta.category,
    question: t(`help.${meta.id}.q`),
    answer: t(`help.${meta.id}.a`),
  }));

  const filteredFAQ =
    selectedCategory === 'all'
      ? faqItems
      : faqItems.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header fixe */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('help.headerTitle')}</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: insets.bottom + SPACING[8],
          paddingHorizontal: SPACING[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Text style={styles.intro}>{t('help.subtitle')}</Text>
        </Animated.View>

        {/* Filtres par catégorie */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                >
                  <Ionicons
                    name={category.icon}
                    size={15}
                    color={active ? '#0C243E' : 'rgba(255,255,255,0.6)'}
                  />
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                    {t(category.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Liste FAQ */}
        {filteredFAQ.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            index={index}
          />
        ))}

        {/* Contact — groupe WhatsApp */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.contactWrapper}
        >
          <DynamicGradientBorder borderRadius={16} fill="rgba(0,0,0,0.35)" boxWidth={contentWidth}>
            <View style={styles.contactCard}>
              <Ionicons name="chatbubbles" size={32} color={COLORS.primary} />
              <Text style={styles.contactTitle}>{t('help.contact')}</Text>
              <Text style={styles.contactBody}>
                {t('help.contactBody')}
              </Text>
              <Pressable
                style={styles.whatsappBtn}
                onPress={() => Linking.openURL(WHATSAPP_GROUP_URL)}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#0C243E" />
                <Text style={styles.whatsappBtnText}>{t('help.joinCommunity')}</Text>
              </Pressable>
            </View>
          </DynamicGradientBorder>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C243E',
  },

  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: '#0A1929',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtnPlaceholder: { width: 40, height: 40 },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  intro: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: SPACING[3],
  },

  // Filtres
  categoryRow: {
    gap: SPACING[2],
    paddingBottom: SPACING[4],
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  categoryTextActive: {
    color: '#0C243E',
  },

  // Accordéon FAQ
  accordionWrapper: {
    marginBottom: SPACING[2],
  },
  accordionInner: {
    padding: SPACING[3],
    width: '100%',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING[2],
  },
  question: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
  },
  answerWrap: {
    overflow: 'hidden',
  },
  answer: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
    marginTop: SPACING[3],
  },

  // Contact
  contactWrapper: {
    marginTop: SPACING[4],
  },
  contactCard: {
    alignItems: 'center',
    padding: SPACING[4],
    width: '100%',
    gap: SPACING[2],
  },
  contactTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    textAlign: 'center',
  },
  contactBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: 14,
    marginTop: SPACING[2],
  },
  whatsappBtnText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: '#0C243E',
    letterSpacing: 0.5,
  },
});
