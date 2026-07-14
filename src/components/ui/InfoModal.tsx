/**
 * InfoModal — Popup d'information par onglet (Accueil, Portfolio, Classement)
 *
 * Utilise GamePopup sans spinningShape.
 * Icônes SVG fournies par variante.
 * OutlinedText pour le titre principal.
 * Sections affichées une par une via ScrollView horizontal paginé + dots.
 */

import { Ionicons } from '@expo/vector-icons';
import { memo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GameButton } from './GameButton';
import { GamePopup, GAME_POPUP_WIDTH } from './GamePopup';
import { OutlinedText } from './OutlinedText';
import { useTranslation } from '@/i18n';
import { COLORS } from '@/styles/colors';
import { SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InfoSection {
  icon: string;
  title: string;
  body: string;
}

export type InfoModalVariant = 'accueil' | 'portfolio' | 'classement';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  variant: InfoModalVariant;
  description: string;
  sections: InfoSection[];
  // Compat legacy (ignorés)
  title?: string;
  headerIcon?: string;
}

// ─── Icône Accueil 47×44 ─────────────────────────────────────────────────────

function AccueilIcon() {
  return (
    <Svg width={47} height={44} viewBox="0 0 47 44" fill="none">
      <Path
        d="M17.8379 2.4375C21.1471 -0.145393 25.8529 -0.145394 29.1621 2.4375L43.1055 13.3203C45.46 15.1581 46.7184 18.0153 46.4688 20.9385L44.8682 39.6826C44.6848 41.8299 42.84 43.5 40.6045 43.5H31.3232C28.3874 43.4998 26.3494 40.7035 27.2637 38.0264L27.8682 36.2578C29.0068 32.9252 26.4594 29.5146 22.9023 29.5146C19.3455 29.5149 16.7989 32.9253 17.9375 36.2578L18.542 38.0264C19.4562 40.7035 17.4182 43.4997 14.4824 43.5H6.39551C4.15998 43.5 2.31524 41.8299 2.13184 39.6826L0.53125 20.9385C0.281617 18.0153 1.53996 15.1581 3.89453 13.3203L17.8379 2.4375Z"
        fill="#1F91D0"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Icône Portfolio 48×50 ────────────────────────────────────────────────────

function PortfolioIcon() {
  return (
    <Svg width={48} height={50} viewBox="0 0 48 50" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33.8815 9.92308C35.7343 9.92308 35.7343 9.92053 35.7343 9.92053L35.7343 9.91781L35.7343 9.91181L35.7342 9.89767L35.7336 9.86093C35.733 9.83274 35.7319 9.79718 35.7301 9.75474C35.7264 9.66992 35.7195 9.55719 35.7067 9.42048C35.6811 9.14774 35.6317 8.77551 35.5358 8.33636C35.345 7.46294 34.9623 6.28995 34.1879 5.10845C32.5671 2.63545 29.4805 0.5 24 0.5C18.5195 0.5 15.4329 2.63545 13.8121 5.10845C13.0377 6.28995 12.655 7.46294 12.4642 8.33636C12.3683 8.77551 12.3189 9.14774 12.2933 9.42048C12.2805 9.55719 12.2736 9.66992 12.2699 9.75474C12.2681 9.79718 12.267 9.83274 12.2664 9.86093L12.2658 9.89767L12.2657 9.91181L12.2657 9.91781L12.2657 9.92053C12.2657 9.92053 12.2657 9.92308 14.1185 9.92308H8.7786C4.73227 9.92308 1.27901 12.8987 0.613795 16.9585C-0.120673 21.4411 2.77442 25.7076 7.15526 26.5988L22.0621 29.6314C23.3414 29.8917 24.6586 29.8917 25.9379 29.6314L40.8447 26.5988C45.2256 25.7076 48.1207 21.4411 47.3862 16.9585C46.721 12.8987 43.2677 9.92308 39.2214 9.92308H33.8815ZM32.0282 9.92308H15.9718C15.9729 9.89748 15.9757 9.84727 15.9822 9.77784C15.9953 9.63833 16.0231 9.42162 16.0815 9.15403C16.1995 8.61399 16.4344 7.90237 16.8953 7.19925C17.7448 5.90302 19.599 4.26923 24 4.26923C28.401 4.26923 30.2552 5.90302 31.1047 7.19925C31.5656 7.90237 31.8005 8.61399 31.9185 9.15403C31.9769 9.42162 32.0047 9.63833 32.0178 9.77784C32.0243 9.84727 32.0271 9.89748 32.0282 9.92308Z"
        fill="#1F91D0"
      />
      <Path
        d="M2.92235 33.9917C2.48815 30.9001 5.272 28.3462 8.25059 29.1037L20.7438 32.2806C21.5686 32.4904 22.1472 33.2442 22.1472 34.109V37.5641C22.1472 38.6049 22.9767 39.4487 24 39.4487C25.0233 39.4487 25.8528 38.6049 25.8528 37.5641V34.109C25.8528 33.2442 26.4314 32.4904 27.2562 32.2806L39.7494 29.1037C42.728 28.3462 45.5118 30.9001 45.0776 33.9917L44.3388 39.2521C43.513 45.1323 38.562 49.5 32.7225 49.5H15.2775C9.43794 49.5 4.48699 45.1323 3.66115 39.2521L2.92235 33.9917Z"
        fill="#1F91D0"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33.8815 9.92308C35.7343 9.92308 35.7343 9.92053 35.7343 9.92053L35.7343 9.91781L35.7343 9.91181L35.7342 9.89767L35.7336 9.86093C35.733 9.83274 35.7319 9.79718 35.7301 9.75474C35.7264 9.66992 35.7195 9.55719 35.7067 9.42048C35.6811 9.14774 35.6317 8.77551 35.5358 8.33636C35.345 7.46294 34.9623 6.28995 34.1879 5.10845C32.5671 2.63545 29.4805 0.5 24 0.5C18.5195 0.5 15.4329 2.63545 13.8121 5.10845C13.0377 6.28995 12.655 7.46294 12.4642 8.33636C12.3683 8.77551 12.3189 9.14774 12.2933 9.42048C12.2805 9.55719 12.2736 9.66992 12.2699 9.75474C12.2681 9.79718 12.267 9.83274 12.2664 9.86093L12.2658 9.89767L12.2657 9.91181L12.2657 9.91781L12.2657 9.92053C12.2657 9.92053 12.2657 9.92308 14.1185 9.92308H8.7786C4.73227 9.92308 1.27901 12.8987 0.613795 16.9585C-0.120673 21.4411 2.77442 25.7076 7.15526 26.5988L22.0621 29.6314C23.3414 29.8917 24.6586 29.8917 25.9379 29.6314L40.8447 26.5988C45.2256 25.7076 48.1207 21.4411 47.3862 16.9585C46.721 12.8987 43.2677 9.92308 39.2214 9.92308H33.8815ZM32.0282 9.92308H15.9718C15.9729 9.89748 15.9757 9.84727 15.9822 9.77784C15.9953 9.63833 16.0231 9.42162 16.0815 9.15403C16.1995 8.61399 16.4344 7.90237 16.8953 7.19925C17.7448 5.90302 19.599 4.26923 24 4.26923C28.401 4.26923 30.2552 5.90302 31.1047 7.19925C31.5656 7.90237 31.8005 8.61399 31.9185 9.15403C31.9769 9.42162 32.0047 9.63833 32.0178 9.77784C32.0243 9.84727 32.0271 9.89748 32.0282 9.92308Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.92235 33.9917C2.48815 30.9001 5.272 28.3462 8.25059 29.1037L20.7438 32.2806C21.5686 32.4904 22.1472 33.2442 22.1472 34.109V37.5641C22.1472 38.6049 22.9767 39.4487 24 39.4487C25.0233 39.4487 25.8528 38.6049 25.8528 37.5641V34.109C25.8528 33.2442 26.4314 32.4904 27.2562 32.2806L39.7494 29.1037C42.728 28.3462 45.5118 30.9001 45.0776 33.9917L44.3388 39.2521C43.513 45.1323 38.562 49.5 32.7225 49.5H15.2775C9.43794 49.5 4.48699 45.1323 3.66115 39.2521L2.92235 33.9917Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Icône Classement 78×75 — filter drop shadow omis (non supporté natif) ───

function ClassementIcon() {
  return (
    <Svg width={65} height={62} viewBox="0 0 78 75" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28.5351 10.798C28.4924 10.798 28.4467 10.7977 28.3983 10.7975C27.9351 10.795 27.2294 10.7911 26.58 10.992C25.4249 11.3492 24.4736 12.1862 23.969 13.2563L18.0433 13.2563C17.6064 13.2562 17.1282 13.2561 16.7108 13.2938C16.225 13.3377 15.6278 13.4449 15.017 13.7736C14.1933 14.2169 13.4985 14.9701 13.1287 15.8206C12.6837 16.8442 12.7972 17.9234 12.8683 18.5999C12.8752 18.6657 12.8817 18.7278 12.8873 18.7856C13.966 29.9882 20.9799 39.0853 31.7492 41.8611C32.7725 42.981 33.8671 43.9403 35.0169 44.7477C35.5857 45.1471 36.1959 45.4271 36.8151 45.6099C36.8004 45.7551 36.784 45.9032 36.7658 46.0534C36.585 47.5408 36.2519 48.947 35.7554 49.9001C34.7387 49.9656 33.6931 50.0925 32.7034 50.3386C30.6079 50.8597 28.466 51.9927 27.3961 54.4444L27.3749 54.4927C27.2765 54.7173 27.1246 55.0635 27.0397 55.4376C26.9307 55.918 26.9385 56.3742 27.0294 56.8486C27.1295 57.3705 27.3862 57.8385 27.5947 58.1507C27.8031 58.4629 28.1376 58.8804 28.5843 59.1773C29.5311 59.8065 30.5541 59.8005 31.3071 59.7961H31.3081C31.3686 59.7957 31.4274 59.7954 31.4842 59.7954H46.1171C46.1742 59.7954 46.2334 59.7957 46.2942 59.7961C47.0472 59.8005 48.0703 59.8065 49.017 59.1773C49.4637 58.8804 49.7982 58.4629 50.0066 58.1507C50.2151 57.8385 50.4719 57.3705 50.5719 56.8486C50.6629 56.3742 50.6706 55.918 50.5616 55.4376C50.4767 55.0635 50.3249 54.7173 50.2264 54.4927L50.2052 54.4444C49.1353 51.9927 46.9934 50.8597 44.8979 50.3386C43.9082 50.0925 42.8626 49.9656 41.8459 49.9001C41.3495 48.947 41.0163 47.5408 40.8356 46.0534C40.8173 45.9032 40.8009 45.7551 40.7862 45.61C41.4054 45.4271 42.0157 45.1471 42.5845 44.7477C43.7408 43.9357 44.8413 42.9702 45.8696 41.8421C56.6232 39.0508 63.637 30.0014 64.7145 18.7851C64.7201 18.7273 64.7266 18.6652 64.7335 18.5993C64.8045 17.9227 64.9177 16.8434 64.4726 15.82C64.1027 14.9696 63.408 14.2167 62.5843 13.7735C61.9736 13.4448 61.3764 13.3377 60.8906 13.2938C60.4732 13.2561 59.995 13.2562 59.5581 13.2563L53.6324 13.2563C53.1278 12.1862 52.1765 11.3492 51.0214 10.992C50.372 10.7911 49.6663 10.795 49.2031 10.7975C49.1547 10.7977 49.109 10.798 49.0663 10.798H28.5351ZM18.1163 18.1561H23.6971C24.0935 24.8497 25.3149 30.2701 27.1648 34.5752C21.9187 31.1858 18.5142 25.382 17.8344 18.3225L17.8185 18.1563C17.9083 18.1561 18.0067 18.1561 18.1163 18.1561ZM50.4454 34.5545C52.2904 30.2527 53.5086 24.839 53.9043 18.1561H59.4851C59.5948 18.1561 59.6933 18.1561 59.7833 18.1563L59.7673 18.3231C59.089 25.3839 55.6892 31.1683 50.4454 34.5545Z"
        fill="#1F91D0"
      />
      <Path
        d="M49.2012 10.3975C49.6574 10.395 50.4231 10.3878 51.1396 10.6094C52.3191 10.9741 53.3032 11.7958 53.8779 12.8564H59.5576C59.9902 12.8563 60.488 12.8559 60.9268 12.8955C61.4417 12.942 62.0977 13.0574 62.7734 13.4209C63.6754 13.9063 64.4338 14.7267 64.8398 15.6602C65.3321 16.7919 65.201 17.9717 65.1309 18.6406C65.1239 18.7068 65.1177 18.7675 65.1123 18.8232C64.0243 30.1488 56.9527 39.3263 46.083 42.1982C45.0586 43.3098 43.965 44.2672 42.8145 45.0752C42.3062 45.4321 41.7671 45.6973 41.2197 45.8887C41.2242 45.9272 41.2277 45.966 41.2324 46.0049C41.3986 47.372 41.6955 48.6338 42.1084 49.5195C43.0655 49.59 44.0514 49.7158 44.9941 49.9502C47.1546 50.4874 49.4335 51.6747 50.5723 54.2842H50.5713L50.5928 54.332L50.7734 54.7676C50.8392 54.942 50.9049 55.1406 50.9521 55.3486C51.0752 55.8907 51.0645 56.4038 50.9648 56.9238C50.8506 57.5199 50.5616 58.0394 50.3389 58.373C50.1159 58.7069 49.7467 59.1728 49.2383 59.5107C48.1785 60.215 47.0382 60.2007 46.292 60.1963C46.2309 60.1959 46.1729 60.1953 46.1172 60.1953H31.4844C31.4289 60.1953 31.3713 60.1959 31.3105 60.1963H31.3066V60.1953C30.5605 60.1997 29.4218 60.2141 28.3633 59.5107C27.8547 59.1727 27.4847 58.707 27.2617 58.373C27.039 58.0394 26.751 57.5199 26.6367 56.9238C26.537 56.4038 26.5264 55.8907 26.6494 55.3486C26.7439 54.9327 26.9113 54.5543 27.0088 54.332L27.0293 54.2842L27.1396 54.0439C28.3105 51.6015 30.5136 50.4707 32.6064 49.9502C33.5491 49.7158 34.5352 49.59 35.4922 49.5195C35.9051 48.6338 36.203 47.3722 36.3691 46.0049C36.3739 45.9661 36.3764 45.9272 36.3809 45.8887C35.8338 45.6974 35.2951 45.4319 34.7871 45.0752C33.6429 44.2717 32.5547 43.3206 31.5352 42.2168C20.6495 39.3594 13.5784 30.1348 12.4893 18.8242C12.4839 18.7685 12.4777 18.7079 12.4707 18.6416C12.4004 17.9729 12.2696 16.7932 12.7617 15.6611C13.1676 14.7276 13.9251 13.9064 14.8271 13.4209C15.5031 13.0571 16.1597 12.9421 16.6748 12.8955C17.1135 12.8559 17.6106 12.8563 18.043 12.8564H23.7236C24.2984 11.7959 25.2825 10.9741 26.4619 10.6094C27.1785 10.3878 27.9442 10.395 28.4004 10.3975C28.449 10.3977 28.4937 10.3984 28.5352 10.3984H49.0664C49.1078 10.3984 49.1526 10.3977 49.2012 10.3975ZM18.2617 18.5557C18.9374 24.8798 21.8407 30.1341 26.29 33.4756C24.7371 29.4224 23.7043 24.4845 23.3232 18.5557H18.2617ZM54.2783 18.5557C53.8978 24.4757 52.8665 29.4072 51.3174 33.457C55.7657 30.1203 58.6656 24.8815 59.3398 18.5557H54.2783Z"
        stroke="white"
        strokeWidth={0.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Config par variante ──────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<
  InfoModalVariant,
  { titleKey: string; outlineColor: string }
> = {
  accueil:    { titleKey: 'infoModal.home',      outlineColor: '#1F91D0' },
  portfolio:  { titleKey: 'infoModal.portfolio', outlineColor: '#1F91D0' },
  classement: { titleKey: 'infoModal.ranking',   outlineColor: '#1F91D0' },
};

function VariantIcon({ variant }: { variant: InfoModalVariant }) {
  if (variant === 'accueil') return <AccueilIcon />;
  if (variant === 'portfolio') return <PortfolioIcon />;
  return <ClassementIcon />;
}

// ─── Carrousel de sections ────────────────────────────────────────────────────

const SLIDE_WIDTH = GAME_POPUP_WIDTH - SPACING[5] * 2;

function SectionsCarousel({ sections }: { sections: InfoSection[] }) {
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.carouselWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        style={{ width: SLIDE_WIDTH }}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          if (SLIDE_WIDTH > 0) setPageIndex(Math.round(x / SLIDE_WIDTH));
        }}
      >
        {sections.map((section, i) => (
          <View key={i} style={[styles.slide, { width: SLIDE_WIDTH }]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name={section.icon as keyof typeof Ionicons.glyphMap}
                size={16}
                color="#1F91D0"
              />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>

      {sections.length > 1 && (
        <View style={styles.dots}>
          {sections.map((_, i) => (
            <View key={i} style={[styles.dot, i === pageIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export const InfoModal = memo(function InfoModal({
  visible,
  onClose,
  variant = 'accueil',
  description,
  sections,
}: InfoModalProps) {
  const { t } = useTranslation();
  const config = VARIANT_CONFIG[variant];

  return (
    <GamePopup
      visible={visible}
      onRequestClose={onClose}
      header={t('infoModal.header')}
      icon={<VariantIcon variant={variant} />}
      title={
        <OutlinedText
          text={t(config.titleKey)}
          outlineColor={config.outlineColor}
          outlineWidth={2}
          style={styles.title}
        />
      }
      footer={
        <GameButton
          variant="yellow"
          fullWidth
          title={t('infoModal.close')}
          onPress={onClose}
        />
      }
    >
      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Sections — une à la fois, swipeable */}
      <SectionsCarousel sections={sections} />
    </GamePopup>
  );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  title: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING[4],
  },
  carouselWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  slide: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
    minHeight: 100,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: '#1F91D0',
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  sectionBody: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'left',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[2],
    marginTop: SPACING[3],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1F91D0',
  },
});
