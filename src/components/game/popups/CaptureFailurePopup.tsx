import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { G, Path, Text as SvgText } from 'react-native-svg';

import { GameButton } from '@/components/ui/GameButton';
import { Modal } from '@/components/ui/Modal';
import { OutlinedText } from '@/components/ui/OutlinedText';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';

import { PopupHeader } from './PopupHeader';

// ─── Icône smiley triste (header) — SVG Figma ────────────────────────────────
const SAD_ICON = (
  <G translateX={17} translateY={23}>
    <Path
      d="M19 0.5C29.2173 0.5 37.5 8.78273 37.5 19C37.5 29.2173 29.2173 37.5 19 37.5C8.78273 37.5 0.5 29.2173 0.5 19C0.5 8.78273 8.78273 0.5 19 0.5ZM19 22.7754C15.6826 22.7754 13.3645 23.8934 11.8604 25.0967C11.1206 25.6885 10.5945 26.2865 10.2461 26.751C10.1179 26.9219 10.0141 27.0769 9.93066 27.207L9.90137 27.1924L9.68066 27.6338L9.67969 27.6357C9.6794 27.6362 9.67937 27.6374 9.67871 27.6387C9.20327 28.5896 9.58821 29.7462 10.5391 30.2217C11.4807 30.6925 12.6225 30.3185 13.1064 29.3877L13.1074 29.3887L13.1094 29.3848C13.1122 29.3797 13.1222 29.3631 13.1387 29.3359C13.1721 29.2809 13.2336 29.185 13.3262 29.0615C13.5121 28.8136 13.8173 28.4615 14.2646 28.1035C15.1354 27.4069 16.6176 26.625 19 26.625C21.3824 26.625 22.8646 27.4069 23.7354 28.1035C24.1827 28.4615 24.4879 28.8136 24.6738 29.0615C24.7664 29.185 24.8279 29.2809 24.8613 29.3359L24.8906 29.3848L24.8926 29.3887V29.3877C25.3764 30.3188 26.5191 30.6926 27.4609 30.2217C28.3985 29.7528 28.785 28.6228 28.3398 27.6797C28.3347 27.6665 28.3302 27.656 28.3271 27.6494C28.3258 27.6465 28.323 27.6421 28.3223 27.6406L28.3213 27.6377L28.3203 27.6357L28.0986 27.1924L28.0684 27.207C27.985 27.077 27.882 26.9217 27.7539 26.751C27.4055 26.2865 26.8794 25.6885 26.1396 25.0967C24.6355 23.8934 22.3174 22.7754 19 22.7754ZM12.3496 10.9004C10.4996 10.9006 9 12.4 9 14.25C9 16.1 10.4996 17.5994 12.3496 17.5996C14.1998 17.5996 15.7002 16.1002 15.7002 14.25C15.7002 12.3998 14.1998 10.9004 12.3496 10.9004ZM25.6504 10.9004C23.8002 10.9004 22.2998 12.3998 22.2998 14.25C22.2998 16.1002 23.8002 17.5996 25.6504 17.5996C27.5004 17.5994 29 16.1 29 14.25C29 12.4 27.5004 10.9006 25.6504 10.9004Z"
      fill="white"
      stroke="#AF2121"
    />
  </G>
);

// Label "RETOUR AU BERCAIL" dans le header
const ECHEC_LABEL = (
  <SvgText
    x="65"
    y="50"
    fill="white"
    fontSize="18"
    fontFamily="LuckiestGuy_400Regular"
    letterSpacing="1"
  >
    RETOUR AU BERCAIL
  </SvgText>
);

// Décoration droite (dés)
const DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.15" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.15" />
  </>
);

function EchecHeader() {
  return (
    <PopupHeader
      color="#F35145"
      icon={SAD_ICON}
      label={ECHEC_LABEL}
      decorRight={DECOR_RIGHT}
    />
  );
}

// ─── Scénarios narratifs ─────────────────────────────────────────────────────
interface FailureScenario {
  title: string;
  description: string;
}

const FAILURE_SCENARIOS: FailureScenario[] = [
  {
    title: 'FAILLITE',
    description: "Ta trésorerie est à sec. Les banques ont coupé les vivres et les fournisseurs réclament leur dû. Retour à la case départ.",
  },
  {
    title: 'LIQUIDATION JUDICIAIRE',
    description: "Le tribunal de commerce a prononcé la liquidation. Les actifs sont vendus, les équipes dispersées. Il faut tout recommencer.",
  },
  {
    title: 'CESSATION DE PAIEMENT',
    description: "Impossible de payer les salaires ce mois-ci. L'aventure s'arrête brutalement et tu repars de zéro.",
  },
  {
    title: 'PIVOT RATÉ',
    description: "Ton changement de stratégie n'a pas convaincu le marché. Les clients sont partis, les investisseurs aussi. Retour au point de départ.",
  },
  {
    title: "RUPTURE D'ASSOCIÉS",
    description: "Ton co-fondateur est parti avec la moitié de l'équipe. L'entreprise n'a pas survécu à la rupture.",
  },
  {
    title: 'MARCHÉ INEXISTANT',
    description: "Tu as construit un produit dont personne ne veut. Le marché n'était qu'une illusion. Il faut repartir de zéro.",
  },
  {
    title: 'BURN-OUT DU FONDATEUR',
    description: "Épuisé, tu dois mettre l'entreprise en pause. Le temps que tu récupères, il faut tout reconstruire.",
  },
  {
    title: 'ATTAQUE CONCURRENTIELLE',
    description: "Un géant du secteur a copié ton produit et écrasé ton marché. Ton entreprise ne s'en remet pas.",
  },
  {
    title: 'PERTE DU CLIENT CLÉ',
    description: "Ton plus gros client a résilié son contrat. Sans lui, la structure ne tient plus. Retour au départ.",
  },
  {
    title: 'LEVÉE DE FONDS RATÉE',
    description: "Aucun investisseur n'a voulu suivre ce round. Les liquidités sont épuisées, l'aventure s'arrête.",
  },
];

function pickRandomScenario(seed?: number): FailureScenario {
  const index = seed != null
    ? seed % FAILURE_SCENARIOS.length
    : Math.floor(Math.random() * FAILURE_SCENARIOS.length);
  return FAILURE_SCENARIOS[index] ?? FAILURE_SCENARIOS[0]!;
}

// ─── Popup principal ─────────────────────────────────────────────────────────
interface CaptureFailurePopupProps {
  visible: boolean;
  /** Seed optionnel pour synchroniser le même scénario entre joueurs (online) */
  seed?: number;
  onContinue: () => void;
}

export const CaptureFailurePopup = memo(function CaptureFailurePopup({
  visible,
  seed,
  onContinue,
}: CaptureFailurePopupProps) {
  const scenario = useMemo(() => pickRandomScenario(seed), [seed, visible]);

  return (
    <Modal visible={visible} onClose={onContinue} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        <EchecHeader />

        <View style={styles.body}>
          {/* Titre du scénario en rouge */}
          <OutlinedText
            text={scenario.title}
            style={styles.scenarioTitle}
            outlineColor="#AF2121"
            outlineWidth={1}
          />

          {/* Description */}
          <View style={styles.descriptionBox}>
            <Text style={styles.description}>{scenario.description}</Text>
          </View>

          {/* Bouton RECOMMENCER */}
          <View style={styles.buttonWrap}>
            <GameButton
              title="RECOMMENCER"
              variant="yellow"
              fullWidth
              onPress={onContinue}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS['3xl'],
    maxWidth: 360,
    width: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  body: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[5],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  scenarioTitle: {
    fontFamily: FONTS.title,
    fontSize: 22,
    color: '#F35145',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING[4],
  },
  descriptionBox: {
    backgroundColor: '#F4F8FC',
    borderRadius: 12,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[5],
  },
  description: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#1B314A',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonWrap: {
    width: '100%',
  },
});
