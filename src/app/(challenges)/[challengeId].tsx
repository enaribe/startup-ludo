/**
 * Challenge Detail Screen - Écran "Infos programme"
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { memo, useCallback, useId, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Defs,
  FeBlend,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EnrollmentFormModal } from '@/components/challenges';
import { SectorActivityIcon } from '@/components/icons';
import { DynamicGradientBorder, GameButton, RadialBackground } from '@/components/ui';
import { ALL_CHALLENGES } from '@/data/challenges';
import { useAuthStore, useChallengeStore } from '@/stores';
import { COLORS } from '@/styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '@/styles/spacing';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import type { ChallengeLevel, ChallengeSector, EnrollmentFormData } from '@/types/challenge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHALLENGE_DETAIL_H_PAD = SPACING[4] * 2;
const CHALLENGE_DETAIL_CONTENT_W = SCREEN_WIDTH - CHALLENGE_DETAIL_H_PAD;
const CHALLENGE_DETAIL_LEVEL_CARD_W = (CHALLENGE_DETAIL_CONTENT_W - SPACING[3]) / 2;

const CARD_FILL = 'rgba(0, 0, 0, 0.2)';

// ===== COMPOSANTS INTERNES =====

/** Icônes parcours (SVG) : Découverte + Démarrage = boussole, Idéation = ampoule, Réussite = trophée */
type LevelParcoursIconVariant = 'compass' | 'ideation' | 'trophy';

function getLevelParcoursIconVariant(level: ChallengeLevel): LevelParcoursIconVariant {
  const n = level.name.trim().toLowerCase();
  if (n.includes('idéat') || n.includes('ideat')) return 'ideation';
  if (n.includes('réuss') || n.includes('reuss')) return 'trophy';
  return 'compass';
}

const CompassParcoursIcon = memo(function CompassParcoursIcon() {
  return (
    <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
      <Path
        d="M21.595 12.8523C21.937 12.7383 22.2624 13.0636 22.1484 13.4057L20.0319 19.7552C19.9883 19.8858 19.8858 19.9883 19.7552 20.0319L13.4057 22.1484C13.0636 22.2624 12.7383 21.937 12.8523 21.595L14.9688 15.2455C15.0123 15.1148 15.1148 15.0123 15.2455 14.9688L21.595 12.8523Z"
        fill="#1F91D0"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.5 35C27.165 35 35 27.165 35 17.5C35 7.83502 27.165 0 17.5 0C7.83502 0 0 7.83502 0 17.5C0 27.165 7.83502 35 17.5 35ZM24.6387 14.2358C25.4367 11.8416 23.159 9.56392 20.7649 10.362L14.4154 12.4785C13.5009 12.7833 12.7833 13.5009 12.4785 14.4154L10.362 20.7649C9.56392 23.159 11.8416 25.4367 14.2358 24.6387L20.5853 22.5222C21.4997 22.2173 22.2173 21.4997 22.5222 20.5853L24.6387 14.2358Z"
        fill="#1F91D0"
      />
    </Svg>
  );
});

const IdeationParcoursIcon = memo(function IdeationParcoursIcon() {
  return (
    <Svg width={35} height={35} viewBox="0 0 35 35" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.9989 5.30464C34.9664 2.37254 32.6713 0.0582726 29.7415 0.00321138C25.8764 -0.0694253 20.3883 1.07434 14.3188 5.04785C13.7769 4.76831 13.1644 4.60265 12.5402 4.52441C11.5059 4.39477 10.3244 4.48796 9.08259 4.7978C6.61157 5.4143 3.77833 6.91787 1.14277 9.51569C0.55912 9.98425 0.146714 10.68 0.0317527 11.4249C-0.0958931 12.252 0.147807 13.2136 1.00928 13.8519C1.80058 14.4381 2.88239 14.5754 4.08401 14.4264L4.15663 14.4171C3.54036 15.3311 3.11259 16.2444 3.10245 17.1286C3.09678 17.6226 3.22237 18.1019 3.5018 18.5227C3.7736 18.932 4.1407 19.2108 4.50546 19.4011C5.1982 19.7625 6.05082 19.8905 6.82534 19.943C7.87235 20.0139 9.17419 19.9574 10.3801 19.9051C10.9384 19.8809 11.4763 19.8576 11.9588 19.8482C12.7771 19.8323 13.47 19.8513 14.0079 19.9328C14.5723 20.0184 14.7414 20.1427 14.7515 20.1501C14.7587 20.1601 14.881 20.3294 14.9622 20.8951C15.0395 21.434 15.0532 22.1274 15.031 22.9462C15.0179 23.4289 14.9905 23.9669 14.962 24.5255C14.9005 25.7317 14.8341 27.0339 14.8969 28.0822C14.9434 28.8576 15.0647 29.7117 15.4206 30.4077C15.6079 30.7741 15.8837 31.1436 16.2906 31.4187C16.709 31.7016 17.187 31.8309 17.6808 31.829C18.5748 31.8256 19.5019 31.3947 20.4309 30.7734C20.425 30.8138 20.4194 30.8538 20.4142 30.8934C20.256 32.0947 20.3849 33.1782 20.9647 33.9745C21.5959 34.8415 22.555 35.0927 23.3825 34.9713C24.1277 34.862 24.8262 34.4547 25.2989 33.8743C27.9152 31.257 29.4395 28.4335 30.0745 25.9657C30.3937 24.7254 30.4959 23.5439 30.3743 22.5079C30.2993 21.8687 30.1328 21.241 29.8462 20.6877C33.856 14.6519 35.0418 9.17548 34.9989 5.30464ZM9.72143 7.36177C10.3636 7.20155 10.9447 7.12463 11.4501 7.11204C10.1445 8.13801 8.82106 9.29897 7.48902 10.6096C5.79945 11.3637 4.5889 11.7011 3.75919 11.804C3.11713 11.8836 2.79408 11.8133 2.65959 11.7648C2.6868 11.6959 2.73941 11.6182 2.80366 11.5703C2.85362 11.5331 2.90088 11.4924 2.9451 11.4485C5.29216 9.11825 7.73691 7.85689 9.72143 7.36177ZM23.0323 31.2386C23.1415 30.4092 23.488 29.2004 24.2545 27.5156C25.5745 26.1928 26.7448 24.8774 27.7801 23.5789C27.7636 24.0845 27.6823 24.6654 27.5172 25.3067C27.0072 27.2887 25.7279 29.7253 23.3813 32.056C23.3371 32.0999 23.2961 32.1468 23.2585 32.1965C23.2101 32.2605 23.132 32.3125 23.063 32.3392C23.0156 32.2043 22.9478 31.8805 23.0323 31.2386ZM23.1864 11.773C24.5561 13.1542 26.7855 13.1628 28.1657 11.7921C29.546 10.4215 29.5546 8.1907 28.1849 6.8095C26.8151 5.4283 24.5858 5.41973 23.2055 6.79036C21.8253 8.16099 21.8167 10.3918 23.1864 11.773Z"
        fill="#1F91D0"
      />
      <Path
        d="M9.94462 20.7767C12.233 20.7855 14.0809 22.6489 14.0721 24.9388C14.0649 26.8085 12.8081 28.4421 11.0036 28.9271L8.72833 29.5387C6.63802 30.1005 4.72937 28.1759 5.30688 26.0885L5.93548 23.8166C6.43403 22.0146 8.07614 20.7695 9.94462 20.7767Z"
        fill="#1F91D0"
      />
    </Svg>
  );
});

const SuccessParcoursIcon = memo(function SuccessParcoursIcon() {
  const uid = useId().replace(/:/g, '_');
  const filterId = `f_${uid}`;
  const gradId = `g_${uid}`;

  return (
    <Svg width={35} height={34} viewBox="0 0 60 58" fill="none">
      <Defs>
        <LinearGradient id={gradId} x1="30" y1="10.5" x2="30" y2="43.5" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#DFDFDF" />
          <Stop offset="1" stopColor="#A9A9A9" />
        </LinearGradient>
        <Filter id={filterId} x="0" y="0" width="60" height="58" filterUnits="userSpaceOnUse">
          <FeFlood floodOpacity="0" result="BackgroundImageFix" />
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dy="2" />
          <FeGaussianBlur stdDeviation="6" />
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </Filter>
      </Defs>
      <G filter={`url(#${filterId})`}>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23.0904 10.5008C23.0617 10.5008 23.0309 10.5006 22.9983 10.5004C22.6866 10.4987 22.2116 10.4961 21.7745 10.6314C20.997 10.872 20.3567 11.4356 20.0171 12.1564L16.0286 12.1564C15.7345 12.1563 15.4127 12.1562 15.1318 12.1816C14.8047 12.2112 14.4028 12.2834 13.9917 12.5047C13.4373 12.8033 12.9696 13.3105 12.7207 13.8833C12.4212 14.5727 12.4976 15.2995 12.5454 15.7551C12.5501 15.7994 12.5545 15.8412 12.5582 15.8802C13.2843 23.4248 18.0052 29.5514 25.2537 31.4208C25.9425 32.175 26.6792 32.8211 27.4532 33.3649C27.836 33.6338 28.2467 33.8224 28.6635 33.9455C28.6536 34.0433 28.6426 34.143 28.6303 34.2442C28.5086 35.2459 28.2844 36.193 27.9502 36.8348C27.2659 36.8789 26.5622 36.9644 25.896 37.1301C24.4856 37.4811 23.0439 38.2441 22.3238 39.8953L22.3095 39.9278C22.2432 40.079 22.141 40.3122 22.0839 40.5642C22.0105 40.8877 22.0157 41.1949 22.077 41.5144C22.1443 41.8659 22.3171 42.1811 22.4574 42.3913C22.5977 42.6016 22.8229 42.8828 23.1235 43.0827C23.7608 43.5065 24.4494 43.5025 24.9562 43.4995H24.9569C24.9976 43.4992 25.0371 43.499 25.0754 43.499H34.9244C34.9629 43.499 35.0027 43.4992 35.0437 43.4995C35.5505 43.5025 36.2391 43.5065 36.8763 43.0827C37.177 42.8828 37.4021 42.6016 37.5424 42.3913C37.6827 42.1811 37.8555 41.8659 37.9229 41.5144C37.9841 41.1949 37.9893 40.8877 37.9159 40.5642C37.8588 40.3122 37.7566 40.079 37.6903 39.9278L37.6761 39.8953C36.9559 38.2441 35.5143 37.4811 34.1038 37.1301C33.4377 36.9644 32.7339 36.8789 32.0496 36.8348C31.7155 36.193 31.4912 35.2459 31.3696 34.2442C31.3573 34.143 31.3462 34.0433 31.3363 33.9455C31.7531 33.8224 32.1639 33.6338 32.5467 33.3649C33.325 32.818 34.0657 32.1677 34.7578 31.408C41.9959 29.5282 46.7167 23.4336 47.4419 15.8799C47.4457 15.8409 47.4501 15.7991 47.4547 15.7547C47.5025 15.299 47.5787 14.5721 47.2791 13.8829C47.0301 13.3102 46.5625 12.8031 46.0081 12.5046C45.5971 12.2833 45.1951 12.2111 44.8681 12.1816C44.5872 12.1562 44.2654 12.1563 43.9713 12.1564L39.9828 12.1564C39.6432 11.4356 39.0029 10.872 38.2254 10.6314C37.7883 10.4961 37.3133 10.4987 37.0016 10.5004C36.969 10.5006 36.9382 10.5008 36.9095 10.5008H23.0904ZM16.0778 15.4562H19.8341C20.1008 19.9642 20.923 23.6146 22.1681 26.514C18.6371 24.2313 16.3455 20.3226 15.888 15.5683L15.8773 15.4564C15.9378 15.4562 16.004 15.4562 16.0778 15.4562ZM37.8378 26.5C39.0795 23.6029 39.8995 19.957 40.1658 15.4562H43.9221C43.996 15.4562 44.0623 15.4562 44.1228 15.4564L44.1121 15.5687C43.6555 20.3239 41.3672 24.2195 37.8378 26.5Z"
          fill="#1F91D0"
        />
        <Path
          d="M37 10.25C37.3073 10.2483 37.8198 10.2444 38.2988 10.3926C39.0915 10.6379 39.753 11.1916 40.1367 11.9062H43.9717C44.2629 11.9062 44.5965 11.906 44.8906 11.9326C45.2359 11.9638 45.6751 12.0409 46.127 12.2842C46.7303 12.609 47.2373 13.1586 47.5088 13.7832C47.8378 14.5402 47.7504 15.3305 47.7031 15.7812C47.6985 15.8255 47.694 15.8659 47.6904 15.9033C46.9587 23.5251 42.2019 29.6994 34.8916 31.6299C34.2018 32.3795 33.4653 33.0249 32.6904 33.5693C32.3454 33.8118 31.9783 33.9885 31.6064 34.1172C31.6101 34.1493 31.6142 34.1815 31.6182 34.2139C31.7307 35.1403 31.9313 35.9969 32.2129 36.5967C32.8602 36.6439 33.5269 36.7292 34.1641 36.8877C35.615 37.2487 37.1421 38.0454 37.9053 39.7949L37.9189 39.8271C37.9846 39.977 38.0971 40.2306 38.1602 40.5088C38.2423 40.8709 38.2346 41.2135 38.168 41.5615C38.0917 41.9593 37.8992 42.3066 37.75 42.5303C37.6006 42.7541 37.3539 43.0654 37.0146 43.291C36.3067 43.7618 35.5446 43.752 35.042 43.749H24.9561V43.748C24.4535 43.751 23.6925 43.7612 22.9854 43.291C22.646 43.0653 22.3984 42.7541 22.249 42.5303C22.0998 42.3066 21.9073 41.9593 21.8311 41.5615C21.7644 41.2135 21.7577 40.8709 21.8398 40.5088C21.9029 40.2306 22.0144 39.977 22.0801 39.8271L22.0947 39.7949L22.2461 39.4785C23.0479 37.9477 24.4755 37.2262 25.8359 36.8877C26.4728 36.7292 27.1391 36.6439 27.7861 36.5967C28.0678 35.9969 28.2693 35.1404 28.3818 34.2139C28.3858 34.1815 28.3889 34.1492 28.3926 34.1172C28.021 33.9886 27.6543 33.8116 27.3096 33.5693C26.5389 33.0278 25.8057 32.387 25.1191 31.6426C17.7983 29.7219 13.0421 23.516 12.3096 15.9043C12.306 15.8667 12.3016 15.8258 12.2969 15.7812C12.2495 15.3305 12.1622 14.5404 12.4912 13.7832C12.7627 13.1586 13.2698 12.6091 13.873 12.2842C14.3249 12.0409 14.7641 11.9638 15.1094 11.9326C15.4036 11.906 15.7371 11.9062 16.0283 11.9062H19.8633C20.2469 11.1917 20.9077 10.6379 21.7002 10.3926C22.1794 10.2443 22.6926 10.2483 23 10.25C23.0326 10.2502 23.063 10.251 23.0908 10.251H36.9092C36.9371 10.251 36.9674 10.2502 37 10.25ZM16.1543 15.7061C16.608 20.0048 18.5865 23.5735 21.6211 25.8291C20.5617 23.0858 19.858 19.736 19.6006 15.7061H16.1543ZM40.3994 15.7061C40.1424 19.73 39.4395 23.0755 38.3828 25.8164C41.4167 23.564 43.393 20.006 43.8457 15.7061H40.3994Z"
          stroke={`url(#${gradId})`}
          strokeWidth={0.5}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
});

const LevelParcoursIcon = memo(function LevelParcoursIcon({ level }: { level: ChallengeLevel }) {
  const variant = getLevelParcoursIconVariant(level);
  if (variant === 'ideation') return <IdeationParcoursIcon />;
  if (variant === 'trophy') return <SuccessParcoursIcon />;
  return <CompassParcoursIcon />;
});

const DELIVERABLE_LABELS: Record<string, string> = {
  sector_choice: 'Choix du secteur d\'activité',
  pitch: 'Fiche Pitch du projet',
  business_plan_simple: 'Business Plan Simplifié',
  business_plan_full: 'Business Plan Complet + Certificat',
  custom: 'Livrable',
};

interface LevelCardProps {
  level: ChallengeLevel;
  index: number;
  isActive: boolean;
}

const LevelCard = memo(function LevelCard({ level, index, isActive }: LevelCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).duration(400).springify()}
      style={[styles.levelCard, { width: CHALLENGE_DETAIL_LEVEL_CARD_W }]}
    >
      <DynamicGradientBorder
        borderRadius={15}
        fill={CARD_FILL}
        boxWidth={CHALLENGE_DETAIL_LEVEL_CARD_W}
      >
        <View style={styles.levelCardInner}>
          <View style={styles.levelIconRow}>
            <LevelParcoursIcon level={level} />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelNumber}>NIVEAU {level.number}</Text>
            <Text style={styles.levelName}>{level.name}</Text>
            <Text style={styles.levelPosture}>{level.posture}</Text>
            <View style={styles.levelXpRow}>
              <Ionicons name="star" size={8} color={COLORS.primary} />
              <Text style={styles.levelXpText}>{level.xpRequired.toLocaleString()} XP</Text>
            </View>
          </View>
          <Text style={[styles.levelStatus, isActive && styles.levelStatusActive]}>
            {isActive ? 'En cours' : `${level.subLevels.length} sous niveaux`}
          </Text>
        </View>
      </DynamicGradientBorder>
    </Animated.View>
  );
});

interface SectorCardProps {
  sector: ChallengeSector;
  index: number;
}

const SectorCard = memo(function SectorCard({ sector, index }: SectorCardProps) {
  const [innerW, setInnerW] = useState(0);
  const onSectorLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0) setInnerW((prev) => (prev === w ? prev : w));
  }, []);

  return (
    <Animated.View
      entering={FadeInDown.delay(500 + index * 80).duration(400).springify()}
      style={styles.sectorCard}
    >
      <View style={styles.sectorCardMeasure} onLayout={onSectorLayout}>
        {innerW > 0 ? (
          <DynamicGradientBorder borderRadius={15} fill={CARD_FILL} boxWidth={innerW}>
            <View style={styles.sectorCardInner}>
              <SectorActivityIcon size={34} />
              <Text style={styles.sectorName} numberOfLines={2}>{sector.name}</Text>
            </View>
          </DynamicGradientBorder>
        ) : (
          <View style={styles.sectorCardInner}>
            <SectorActivityIcon size={34} />
            <Text style={styles.sectorName} numberOfLines={2}>{sector.name}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

interface DeliverableRowProps {
  label: string;
  isEarned: boolean;
  index: number;
}

const DeliverableRow = memo(function DeliverableRow({ label, isEarned, index }: DeliverableRowProps) {
  return (
    <Animated.View entering={FadeInDown.delay(700 + index * 80).duration(400)}>
      <DynamicGradientBorder
        borderRadius={15}
        fill={CARD_FILL}
        boxWidth={CHALLENGE_DETAIL_CONTENT_W}
      >
        <View style={styles.deliverableRow}>
          <View style={styles.deliverableLeft}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} style={styles.deliverableIcon} />
            <Text style={styles.deliverableLabel} numberOfLines={1}>{label}</Text>
          </View>
          <DynamicGradientBorder
            borderRadius={BORDER_RADIUS.sm}
            fill="rgba(0, 0, 0, 0.1)"
            boxWidth={64}
            style={styles.deliverableBadgeWrap}
          >
            <View style={styles.deliverableBadge}>
              <Text style={[styles.deliverableBadgeText, isEarned && styles.deliverableBadgeEarned]}>
                {isEarned ? 'Gagné' : 'A gagner'}
              </Text>
            </View>
          </DynamicGradientBorder>
        </View>
      </DynamicGradientBorder>
    </Animated.View>
  );
});

// ===== ÉCRAN PRINCIPAL =====

export default function ChallengeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId: string }>();
  const insets = useSafeAreaInsets();

  const user = useAuthStore((state) => state.user);
  const challenges = useChallengeStore((state) => state.challenges);
  const enrollments = useChallengeStore((state) => state.enrollments);
  const enrollInChallenge = useChallengeStore((state) => state.enrollInChallenge);
  const unenrollFromChallenge = useChallengeStore((state) => state.unenrollFromChallenge);

  const challenge = useMemo(() => {
    const storeChallenge = challenges.find((c) => c.id === params.challengeId);
    if (storeChallenge) return storeChallenge;
    return ALL_CHALLENGES.find((c) => c.id === params.challengeId);
  }, [challenges, params.challengeId]);

  const enrollment = useMemo(
    () => enrollments.find((e) => e.challengeId === params.challengeId),
    [enrollments, params.challengeId]
  );

  const isEnrolled = !!enrollment;

  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEnrollPress = useCallback(() => {
    if (!challenge) return;
    if (isEnrolled) {
      router.push({
        pathname: '/(challenges)/challenge-hub',
        params: { challengeId: challenge.id },
      });
    } else {
      setShowEnrollForm(true);
    }
  }, [challenge, isEnrolled, router]);

  const handleFormSubmit = useCallback((formData: EnrollmentFormData) => {
    if (!challenge) return;
    const userId = user?.id || 'guest_user';
    enrollInChallenge(challenge.id, userId, formData);
    setShowEnrollForm(false);
    router.push({
      pathname: '/(challenges)/challenge-hub',
      params: { challengeId: challenge.id },
    });
  }, [challenge, user, enrollInChallenge, router]);

  const handleUnenrollPress = useCallback(() => {
    if (!challenge || !enrollment) return;
    Alert.alert(
      'Se désinscrire',
      `Veux-tu vraiment quitter le programme « ${challenge.name} » ? Ta progression (XP, niveaux et livrables de ce programme) sera définitivement perdue.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se désinscrire',
          style: 'destructive',
          onPress: () => {
            unenrollFromChallenge(enrollment.id);
            router.back();
          },
        },
      ]
    );
  }, [challenge, enrollment, unenrollFromChallenge, router]);

  if (!challenge) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <RadialBackground />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>Programme non trouvé</Text>
          <GameButton title="Retour" variant="yellow" onPress={handleBack} />
        </View>
      </View>
    );
  }

  const totalSteps = challenge.levels.reduce((acc, l) => acc + l.subLevels.length, 0);

  // Determine earned deliverables from enrollment
  const earnedDeliverableTypes = new Set<string>();
  if (enrollment?.deliverables.sectorChoice) earnedDeliverableTypes.add('sector_choice');
  if (enrollment?.deliverables.pitch) earnedDeliverableTypes.add('pitch');
  if (enrollment?.deliverables.businessPlanSimple) earnedDeliverableTypes.add('business_plan_simple');
  if (enrollment?.deliverables.businessPlanFull) earnedDeliverableTypes.add('business_plan_full');

  return (
    <View style={styles.container}>
      <RadialBackground />

      {/* Header */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[styles.header, { paddingTop: insets.top + SPACING[2] }]}
      >
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Infos programme</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* === BANNIÈRE === */}
        <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.bannerContainer}>
          <View style={styles.bannerCard}>
            <Image
              source={{ uri: challenge.bannerUrl || challenge.logoUrl }}
              style={styles.bannerImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* === TITRE + DESCRIPTION === */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.titleSection}>
          <Text style={styles.challengeName}>{challenge.name}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
        </Animated.View>

        {/* === STATS BAR === */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsBarOuter}>
          <DynamicGradientBorder
            borderRadius={15}
            fill={CARD_FILL}
            boxWidth={CHALLENGE_DETAIL_CONTENT_W}
          >
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{challenge.totalLevels}</Text>
                <Text style={styles.statLabel}>Niveaux</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalSteps || challenge.totalLevels * 4}</Text>
                <Text style={styles.statLabel}>Etapes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{challenge.sectors.length}</Text>
                <Text style={styles.statLabel}>Secteurs</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>1</Text>
                <Text style={styles.statLabel}>Certificat</Text>
              </View>
            </View>
          </DynamicGradientBorder>
        </Animated.View>

        {/* === NIVEAUX === */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Text style={styles.sectionTitle}>Étape du parcours</Text>
        </Animated.View>

        <View style={styles.levelsGrid}>
          {challenge.levels.map((level, index) => (
            <LevelCard
              key={level.id}
              level={level}
              index={index}
              isActive={enrollment ? enrollment.currentLevel === level.number : false}
            />
          ))}
        </View>

        {/* === SECTEURS === */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={styles.sectionTitle}>Secteurs d'activités</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.sectorsRow}>
          {challenge.sectors.map((sector, index) => (
            <SectorCard key={sector.id} sector={sector} index={index} />
          ))}
        </Animated.View>

        {/* === LIVRABLES === */}
        <Animated.View entering={FadeInDown.delay(650).duration(400)}>
          <Text style={styles.sectionTitle}>Livrables</Text>
        </Animated.View>

        <View style={styles.deliverablesContainer}>
          {challenge.levels.map((level, index) => (
            <DeliverableRow
              key={level.id}
              label={DELIVERABLE_LABELS[level.deliverableType] || 'Livrable'}
              isEarned={earnedDeliverableTypes.has(level.deliverableType)}
              index={index}
            />
          ))}
        </View>

        {/* === NOTE XP === */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.xpNote}>
          <Ionicons name="information-circle" size={22} color={COLORS.primary} />
          <Text style={styles.xpNoteText}>
            Les XP gagnés seront comptabilisés dans ta progression Challenge
          </Text>
        </Animated.View>
      </ScrollView>

      {/* === BOUTON FIXE === */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(500)}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING[4] }]}
      >
        <GameButton
          title={isEnrolled ? 'Lancer la partie' : 'Rejoindre ce programme'}
          variant="yellow"
          fullWidth
          onPress={handleEnrollPress}
        />
        {isEnrolled && (
          <Pressable
            onPress={handleUnenrollPress}
            style={styles.unenrollButton}
            hitSlop={SPACING[2]}
          >
            <Ionicons name="exit-outline" size={16} color={COLORS.error} />
            <Text style={styles.unenrollButtonText}>Se désinscrire</Text>
          </Pressable>
        )}
      </Animated.View>

      <EnrollmentFormModal
        visible={showEnrollForm}
        challengeName={challenge.name}
        onSubmit={handleFormSubmit}
        onClose={() => setShowEnrollForm(false)}
      />
    </View>
  );
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    textAlign: 'center',
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
  },

  // Bannière
  bannerContainer: {
    marginBottom: SPACING[2],
  },
  bannerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    overflow: 'hidden',
    height: 110,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },

  // Titre
  titleSection: {
    alignItems: 'center',
    paddingVertical: SPACING[5],
    gap: SPACING[3],
  },
  challengeName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES['4xl'],
    color: COLORS.white,
    textAlign: 'center',
  },
  challengeDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * 1.6,
  },

  // Stats bar
  statsBarOuter: {
    marginBottom: SPACING[6],
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING[4],
  },
  statItem: {
    alignItems: 'center',
    gap: SPACING[2],
    flex: 1,
  },
  statValue: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
  },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Section title
  sectionTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.base,
    color: COLORS.white,
    marginBottom: SPACING[3],
    marginTop: SPACING[2],
  },

  // Levels grid
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
    marginBottom: SPACING[6],
  },
  levelCard: {
    width: CHALLENGE_DETAIL_LEVEL_CARD_W,
    minHeight: 194,
    ...SHADOWS.md,
  },
  levelCardInner: {
    padding: SPACING[4],
    justifyContent: 'space-between',
    minHeight: 194,
  },
  levelIconRow: {
    marginBottom: SPACING[3],
  },
  levelInfo: {
    gap: SPACING[2],
    flex: 1,
  },
  levelNumber: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: '#71808E',
  },
  levelName: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  levelPosture: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: '#71808E',
  },
  levelXpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  levelXpText: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },
  levelStatus: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.xs,
    color: '#7F8E9E',
    marginTop: SPACING[2],
  },
  levelStatusActive: {
    color: COLORS.primary,
  },

  // Sectors
  sectorsRow: {
    flexDirection: 'row',
    gap: SPACING[3],
    marginBottom: SPACING[6],
    flexWrap: 'wrap',
  },
  sectorCard: {
    flex: 1,
    minWidth: 90,
    maxWidth: 120,
  },
  sectorCardMeasure: {
    width: '100%',
  },
  sectorCardInner: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[5],
    paddingHorizontal: SPACING[3],
  },
  sectorName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: 'center',
  },

  // Deliverables
  deliverablesContainer: {
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    minHeight: 65,
  },
  deliverableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING[3],
  },
  deliverableIcon: {
    width: 20,
  },
  deliverableLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#7F8E9E',
    flex: 1,
  },
  deliverableBadgeWrap: {
    width: 64,
  },
  deliverableBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    minWidth: 56,
    alignItems: 'center',
  },
  deliverableBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 8,
    color: COLORS.textMuted,
  },
  deliverableBadgeEarned: {
    color: COLORS.primary,
  },

  // XP Note
  xpNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    backgroundColor: 'rgba(255, 188, 64, 0.06)',
    borderRadius: 15,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    marginBottom: SPACING[4],
  },
  xpNoteText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    flex: 1,
    lineHeight: FONT_SIZES.xs * 1.6,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
  },
  unenrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    marginTop: SPACING[2],
  },
  unenrollButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[6],
    gap: SPACING[4],
  },
  errorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
});
