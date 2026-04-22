import { memo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInUp,
  FadeInDown,
  interpolateColor,
} from 'react-native-reanimated';
import { Path, LinearGradient, RadialGradient, Stop, G, Rect, Mask } from 'react-native-svg';
import { PopupHeader } from './PopupHeader';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal } from '@/components/ui/Modal';
import { GameButton } from '@/components/ui/GameButton';
import { COLORS } from '@/styles/colors';
import { FONTS, FONT_SIZES } from '@/styles/typography';
import { SPACING, BORDER_RADIUS, SHADOWS } from '@/styles/spacing';
import { useSettingsStore } from '@/stores';
import { useSound, usePlaySoundOnOpen } from '@/hooks/useSound';
import type { QuizEvent } from '@/types';
import { crashLog } from '@/utils/gameLog';

// ─── Defs propres à l'icône Quiz ────────────────────────────────────────────

const QUIZ_ICON_DEFS = (
  <>
    <LinearGradient id="quiz_icon_lg" x1="32" y1="19.5215" x2="51.4675" y2="75.3427" gradientUnits="userSpaceOnUse">
      <Stop stopColor="#1F91D0" />
      <Stop offset="1" stopColor="#0958A5" />
    </LinearGradient>
  </>
);

// ─── Icône "?" (paths) ────────────────────────────────────────────────────────

const QUIZ_ICON = (
  <>
    <Path d="M43.4102 51.3682C44.1555 51.3682 44.86 51.5159 45.5205 51.8125C46.176 52.1069 46.7467 52.5059 47.2314 53.0088C47.7352 53.497 48.1338 54.0809 48.4277 54.7578C48.7225 55.4367 48.8701 56.1506 48.8701 56.8984C48.8701 57.6627 48.7233 58.3777 48.4277 59.041C48.1343 59.6994 47.7358 60.2719 47.2344 60.7588L47.2354 60.7598C46.7497 61.2645 46.177 61.6553 45.5195 61.9336C44.859 62.2302 44.1555 62.3789 43.4102 62.3789C42.6486 62.3789 41.9363 62.2314 41.2754 61.9346V61.9336C40.6184 61.6554 40.0379 61.2644 39.5361 60.7607C39.0508 60.2734 38.6617 59.6996 38.3682 59.041L38.3662 59.0381C38.0883 58.3755 37.9502 57.6615 37.9502 56.8984C37.9502 56.1519 38.089 55.439 38.3662 54.7607L38.3672 54.7578C38.6606 54.082 39.05 53.4988 39.5361 53.0107C40.0381 52.5069 40.6184 52.1076 41.2754 51.8125C41.9363 51.5157 42.6486 51.3682 43.4102 51.3682ZM43.5117 22.8887C45.5991 22.8887 47.5699 23.1786 49.4229 23.7588C51.2934 24.3392 52.9289 25.1936 54.3271 26.3232C55.7267 27.454 56.8358 28.8507 57.6543 30.5107L57.8037 30.8223C58.5251 32.3963 58.8837 34.1855 58.8838 36.1865C58.8838 37.8062 58.6552 39.1254 58.1875 40.1338L58.1865 40.1348C57.7238 41.1152 57.1303 41.9272 56.4053 42.5684C55.6867 43.2038 54.8827 43.7362 53.9941 44.165C53.1219 44.586 52.2666 45.0495 51.4277 45.5547H51.4268C50.6127 46.0383 49.8556 46.6397 49.1562 47.3584C48.486 48.0647 47.9653 49.0232 47.5996 50.2412L47.5674 50.3477H38.7686L38.7598 50.208C38.6411 48.4049 38.7416 46.8895 39.0674 45.667C39.3907 44.4371 39.8266 43.4135 40.3779 42.6006L40.3789 42.5996C40.943 41.7761 41.5696 41.1117 42.2598 40.6094L42.7764 40.2402C43.118 40.0038 43.4537 39.7864 43.7832 39.5879L44.2734 39.3047C44.9274 38.9344 45.4965 38.5811 45.9805 38.2461L45.9824 38.2451C46.465 37.9221 46.7878 37.5228 46.9609 37.0488L46.9619 37.0469C47.0424 36.8392 47.0811 36.6066 47.0752 36.3477L47.0547 36.0791C47.0083 35.7062 46.8456 35.3518 46.5586 35.0156L46.5557 35.0117C46.2903 34.6828 45.8766 34.3998 45.3018 34.1689L45.2969 34.167C44.7498 33.9247 44.0226 33.7989 43.1074 33.7988C42.5097 33.7988 41.7916 33.8568 40.9531 33.9746L40.9502 33.9756C40.1317 34.0762 39.2698 34.2441 38.3652 34.4795H38.3633C37.4593 34.6979 36.5633 34.9753 35.6758 35.3115L35.6738 35.3125C34.805 35.6312 34.0212 35.9994 33.3223 36.417L33.1221 36.5371L33.0967 36.3057L31.9834 26.3555L31.9727 26.2598L32.0557 26.21C32.5262 25.9291 33.0394 25.6434 33.5947 25.3535L34.1641 25.0625C34.7639 24.7551 35.4063 24.4768 36.0908 24.2275L36.79 23.9873C37.7411 23.6636 38.7758 23.4003 39.8936 23.1963C41.0161 22.9914 42.2227 22.8887 43.5117 22.8887Z" fill="#0958A5" stroke="#0958A5" strokeWidth="0.3" />
    <Path d="M43.2773 50.3291C44.0227 50.3291 44.7272 50.4768 45.3877 50.7734C46.0432 51.0679 46.6139 51.4668 47.0986 51.9697C47.6024 52.4579 48.001 53.0419 48.2949 53.7188C48.5897 54.3977 48.7373 55.1116 48.7373 55.8594C48.7373 56.6236 48.5905 57.3387 48.2949 58.002C48.0015 58.6603 47.603 59.2329 47.1016 59.7197L47.1025 59.7207C46.6169 60.2255 46.0442 60.6162 45.3867 60.8945C44.7262 61.1911 44.0226 61.3398 43.2773 61.3398C42.5157 61.3398 41.8035 61.1923 41.1426 60.8955V60.8945C40.4856 60.6163 39.9051 60.2253 39.4033 59.7217C38.918 59.2344 38.5289 58.6606 38.2354 58.002L38.2334 57.999C37.9555 57.3365 37.8174 56.6224 37.8174 55.8594C37.8174 55.1128 37.9562 54.3999 38.2334 53.7217L38.2344 53.7188C38.5278 53.043 38.9171 52.4597 39.4033 51.9717C39.9053 51.4678 40.4856 51.0685 41.1426 50.7734C41.8035 50.4766 42.5157 50.3291 43.2773 50.3291ZM43.3789 21.8496C45.4663 21.8496 47.4371 22.1395 49.29 22.7197C51.1606 23.3001 52.7961 24.1545 54.1943 25.2842C55.5939 26.415 56.703 27.8116 57.5215 29.4717L57.6709 29.7832C58.3923 31.3572 58.7509 33.1464 58.751 35.1475C58.751 36.7671 58.5224 38.0863 58.0547 39.0947L58.0537 39.0957C57.591 40.0761 56.9975 40.8882 56.2725 41.5293C55.5539 42.1648 54.7499 42.6972 53.8613 43.126C52.9891 43.5469 52.1338 44.0104 51.2949 44.5156H51.2939C50.4799 44.9992 49.7228 45.6006 49.0234 46.3193C48.3532 47.0256 47.8325 47.9841 47.4668 49.2021L47.4346 49.3086H38.6357L38.627 49.1689C38.5083 47.3658 38.6087 45.8504 38.9346 44.6279C39.2579 43.3981 39.6938 42.3745 40.2451 41.5615L40.2461 41.5605C40.8102 40.737 41.4368 40.0726 42.127 39.5703L42.6436 39.2012C42.9852 38.9647 43.3209 38.7473 43.6504 38.5488L44.1406 38.2656C44.7946 37.8953 45.3637 37.5421 45.8477 37.207L45.8496 37.2061C46.3322 36.883 46.655 36.4837 46.8281 36.0098L46.8291 36.0078C46.9095 35.8002 46.9483 35.5675 46.9424 35.3086L46.9219 35.04C46.8754 34.6672 46.7127 34.3127 46.4258 33.9766L46.4229 33.9727C46.1575 33.6437 45.7438 33.3607 45.1689 33.1299L45.1641 33.1279C44.617 32.8857 43.8898 32.7598 42.9746 32.7598C42.3769 32.7598 41.6588 32.8177 40.8203 32.9355L40.8174 32.9365C39.9989 33.0372 39.1369 33.205 38.2324 33.4404H38.2305C37.3265 33.6589 36.4305 33.9363 35.543 34.2725L35.541 34.2734C34.6722 34.5921 33.8884 34.9603 33.1895 35.3779L32.9893 35.498L32.9639 35.2666L31.8506 25.3164L31.8398 25.2207L31.9229 25.1709C32.3934 24.89 32.9065 24.6043 33.4619 24.3145L34.0312 24.0234C34.6311 23.716 35.2735 23.4378 35.958 23.1885L36.6572 22.9482C37.6083 22.6245 38.643 22.3612 39.7607 22.1572C40.8833 21.9524 42.0899 21.8496 43.3789 21.8496Z" fill="url(#quiz_icon_lg)" stroke="#123761" strokeWidth="0.3" />
    <Path d="M42.4824 22.5305C46.0205 22.0062 54.0139 23.1596 57.683 30.919" stroke="white" strokeOpacity="0.6" strokeWidth="0.3" strokeLinecap="round" />
  </>
);

// ─── Defs du label QUIZ (Mask pour le contour) ───────────────────────────────

const QUIZ_LABEL_PATH = 'M88.3574 41.3516C88.3574 42.3411 88.1719 43.2852 87.8008 44.1836C87.4362 45.082 86.8861 45.8698 86.1504 46.5469L87.498 48.1484L83.9238 50.4531L83.084 48.1484C82.8366 48.2005 82.5859 48.2396 82.332 48.2656C82.0846 48.2917 81.834 48.3047 81.5801 48.3047C80.9551 48.3047 80.3561 48.2266 79.7832 48.0703C79.2103 47.9141 78.6732 47.696 78.1719 47.416C77.6706 47.1296 77.2148 46.7845 76.8047 46.3809C76.3945 45.9772 76.0397 45.528 75.7402 45.0332C75.4473 44.5384 75.2194 44.0046 75.0566 43.4316C74.9004 42.8522 74.8223 42.25 74.8223 41.625C74.8223 41.0065 74.8971 40.4076 75.0469 39.8281C75.2031 39.2422 75.4212 38.6921 75.7012 38.1777C75.9876 37.6634 76.3294 37.1947 76.7266 36.7715C77.1302 36.3418 77.5794 35.974 78.0742 35.668C78.569 35.3555 79.1029 35.1146 79.6758 34.9453C80.2487 34.776 80.8509 34.6914 81.4824 34.6914C82.4915 34.6914 83.416 34.8444 84.2559 35.1504C85.1022 35.4564 85.8281 35.8958 86.4336 36.4688C87.0391 37.0417 87.5111 37.7415 87.8496 38.5684C88.1882 39.3887 88.3574 40.3164 88.3574 41.3516ZM83.6113 41.625C83.6113 41.3255 83.5658 41.0358 83.4746 40.7559C83.39 40.4694 83.263 40.2188 83.0938 40.0039C82.9245 39.7826 82.7129 39.6068 82.459 39.4766C82.2051 39.3464 81.9121 39.2812 81.5801 39.2812C81.2546 39.2812 80.9616 39.3398 80.7012 39.457C80.4408 39.5677 80.2161 39.724 80.0273 39.9258C79.8451 40.1276 79.7018 40.3652 79.5977 40.6387C79.5 40.9121 79.4512 41.2083 79.4512 41.5273C79.4512 41.8268 79.4935 42.123 79.5781 42.416C79.6693 42.7025 79.7995 42.9629 79.9688 43.1973C80.138 43.4251 80.3496 43.6107 80.6035 43.7539C80.8574 43.8971 81.1504 43.9688 81.4824 43.9688C81.8014 43.9688 82.0911 43.9069 82.3516 43.7832C82.6185 43.653 82.8431 43.4805 83.0254 43.2656C83.2142 43.0508 83.3574 42.8034 83.4551 42.5234C83.5592 42.237 83.6113 41.9375 83.6113 41.625ZM101.101 34.8672C100.808 37.1589 100.558 39.4408 100.349 41.7129C100.141 43.9785 99.9423 46.2604 99.7535 48.5586L95.7496 48.8516L95.9254 47.3477C95.7952 47.4974 95.6422 47.6276 95.4664 47.7383C95.2971 47.849 95.1148 47.9401 94.9195 48.0117C94.7242 48.0768 94.5224 48.1257 94.3141 48.1582C94.1057 48.1842 93.9072 48.194 93.7184 48.1875C93.2757 48.181 92.859 48.0964 92.4684 47.9336C92.0777 47.7643 91.7197 47.543 91.3941 47.2695C91.0686 46.9896 90.7757 46.6673 90.5152 46.3027C90.2548 45.9316 90.0335 45.5443 89.8512 45.1406C89.6754 44.7305 89.5387 44.3138 89.441 43.8906C89.3499 43.4674 89.3043 43.0573 89.3043 42.6602C89.3043 42.0742 89.3141 41.4688 89.3336 40.8438C89.3596 40.2122 89.402 39.5807 89.4605 38.9492C89.5191 38.3177 89.594 37.6927 89.6852 37.0742C89.7828 36.4557 89.9033 35.8633 90.0465 35.2969C90.8408 35.3359 91.6383 35.3717 92.4391 35.4043C93.2398 35.4368 94.0374 35.4466 94.8316 35.4336C94.6819 36 94.5322 36.5697 94.3824 37.1426C94.2392 37.709 94.109 38.2819 93.9918 38.8613C93.8746 39.4342 93.7802 40.0104 93.7086 40.5898C93.637 41.1693 93.6012 41.7552 93.6012 42.3477C93.6012 42.4844 93.6077 42.6797 93.6207 42.9336C93.6337 43.1875 93.6663 43.4382 93.7184 43.6855C93.777 43.9329 93.8616 44.151 93.9723 44.3398C94.0895 44.5221 94.2522 44.6133 94.4605 44.6133C94.7079 44.6133 94.9293 44.5091 95.1246 44.3008C95.3199 44.0859 95.4924 43.7995 95.6422 43.4414C95.7919 43.0833 95.9189 42.6699 96.023 42.2012C96.1337 41.7324 96.2249 41.2441 96.2965 40.7363C96.3746 40.222 96.4365 39.7044 96.482 39.1836C96.5276 38.6628 96.5602 38.1745 96.5797 37.7188C96.6057 37.2565 96.622 36.8431 96.6285 36.4785C96.6415 36.1139 96.648 35.8307 96.648 35.6289C96.648 35.4987 96.6448 35.3717 96.6383 35.248C96.6318 35.1243 96.622 34.9974 96.609 34.8672C97.0322 34.8802 97.4521 34.89 97.8687 34.8965C98.2854 34.903 98.7053 34.9062 99.1285 34.9062C99.454 34.9062 99.7796 34.9062 100.105 34.9062C100.437 34.8997 100.769 34.8867 101.101 34.8672ZM107.185 34.8672L106.501 48.168L102.38 48.3828L101.989 35.1406L107.185 34.8672ZM117.546 38.2852L113.073 43.9297H117.194L117.331 48.0703L108.62 48.4219L108.229 44.5938L113.327 38.3438L108.268 38.6953L108.229 34.7695H117.37L117.546 38.2852Z';

const QUIZ_LABEL_DEFS = (
  <Mask id="quiz_label_mask" maskUnits="userSpaceOnUse" x="73.7344" y="33.6172" width="45" height="19">
    <Rect fill="white" x="73.7344" y="33.6172" width="45" height="19" />
    <Path d={QUIZ_LABEL_PATH} />
  </Mask>
);

const QUIZ_LABEL = (
  <>
    <Path d={QUIZ_LABEL_PATH} fill="white" />
    <Path d={QUIZ_LABEL_PATH} fill="#0E699C" mask="url(#quiz_label_mask)" />
  </>
);

// ─── Décos droite Quiz (losange + dés) ───────────────────────────────────────

const QUIZ_DECOR_RIGHT = (
  <>
    <Path fillRule="evenodd" clipRule="evenodd" d="M298.767 19.2242L292.25 25.668C289.25 28.6336 289.25 33.4419 292.25 36.4075L298.767 42.8513C301.767 45.8169 306.63 45.8169 309.629 42.8513L316.147 36.4075C319.146 33.4419 319.146 28.6336 316.147 25.668L309.629 19.2242C306.63 16.2586 301.767 16.2586 298.767 19.2242ZM301.928 21.6475C300.679 22.8832 300.679 24.8866 301.928 26.1223C303.178 27.358 305.205 27.358 306.454 26.1223L306.467 26.1094C307.717 24.8737 307.717 22.8703 306.467 21.6346C305.218 20.3989 303.191 20.3989 301.941 21.6346L301.928 21.6475ZM294.687 33.2815C293.437 32.0459 293.437 30.0424 294.687 28.8067L294.7 28.7938C295.95 27.5582 297.976 27.5582 299.226 28.7938C300.476 30.0295 300.476 32.033 299.226 33.2687L299.213 33.2815C297.963 34.5172 295.937 34.5172 294.687 33.2815ZM301.928 35.9668C300.679 37.2024 300.679 39.2059 301.928 40.4416C303.178 41.6773 305.205 41.6773 306.454 40.4416L306.467 40.4287C307.717 39.193 307.717 37.1896 306.467 35.9539C305.218 34.7182 303.191 34.7182 301.941 35.9539L301.928 35.9668ZM309.17 33.2815C307.92 32.0459 307.92 30.0424 309.17 28.8067L309.183 28.7939C310.433 27.5582 312.459 27.5582 313.709 28.7939C314.959 30.0295 314.959 32.033 313.709 33.2687L313.696 33.2815C312.446 34.5172 310.42 34.5172 309.17 33.2815Z" fill="black" fillOpacity="0.1" />
    <Path fillRule="evenodd" clipRule="evenodd" d="M312.421 49.2932V58.406C312.421 62.6 315.86 66 320.102 66H329.319C333.561 66 337 62.6 337 58.406V49.2932C337 45.0991 333.561 41.6992 329.319 41.6992H320.102C315.86 41.6992 312.421 45.0991 312.421 49.2932ZM316.39 48.7961C316.39 50.5436 317.823 51.9602 319.59 51.9602C321.358 51.9602 322.791 50.5436 322.791 48.7961V48.7778C322.791 47.0303 321.358 45.6137 319.59 45.6137C317.823 45.6137 316.39 47.0303 316.39 48.7778V48.7961ZM329.831 62.086C328.064 62.086 326.631 60.6694 326.631 58.9219V58.9036C326.631 57.1561 328.064 55.7395 329.831 55.7395C331.599 55.7395 333.032 57.1561 333.032 58.9036V58.9219C333.032 60.6694 331.599 62.086 329.831 62.086Z" fill="black" fillOpacity="0.1" />
  </>
);

// ─── Wrapper Quiz qui utilise PopupHeader ────────────────────────────────────

function QuizHeader() {
  return (
    <PopupHeader
      color="#1F91D0"
      iconDefs={QUIZ_ICON_DEFS}
      icon={QUIZ_ICON}
      labelDefs={QUIZ_LABEL_DEFS}
      label={QUIZ_LABEL}
      decorRight={QUIZ_DECOR_RIGHT}
    />
  );
}

interface QuizPopupProps {
  visible: boolean;
  quiz: QuizEvent | null;
  onAnswer: (correct: boolean, reward: number, selectedIndex: number) => void;
  onClose: () => void;
  isSpectator?: boolean;
  spectatorResult?: { ok: boolean; reward: number; selectedIndex?: number };
  /** En mode spectateur (IA joue), callback pour fermer manuellement le popup */
  onSpectatorClose?: () => void;
}


export const QuizPopup = memo(function QuizPopup({
  visible,
  quiz,
  onAnswer,
  onClose,
  isSpectator = false,
  spectatorResult,
  onSpectatorClose,
}: QuizPopupProps) {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const { play: playSound } = useSound();
  usePlaySoundOnOpen(visible && !!quiz, 'popup-open');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showCorrectHighlight, setShowCorrectHighlight] = useState(false);
  const [, setTimeRemaining] = useState(30);

  const timerProgress = useSharedValue(1);
  const resultScale = useSharedValue(0);
  const badgeBounce = useSharedValue(0);

  useEffect(() => {
    crashLog('QuizPopup mount/update', { visible, hasQuiz: !!quiz });
    return () => {
      crashLog('QuizPopup unmount');
    };
  }, [visible, quiz]);

  useEffect(() => {
    if (visible && quiz) {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowCorrectHighlight(false);
      setTimeRemaining(quiz.timeLimit || 30);
      timerProgress.value = 1;
      resultScale.value = 0;
      badgeBounce.value = 0;
    }
  }, [visible, quiz, timerProgress, resultScale, badgeBounce]);

  useEffect(() => {
    if (!visible || hasAnswered || !quiz || isSpectator) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timerProgress.value = withTiming(0, { duration: (quiz.timeLimit || 30) * 1000 });
    return () => clearInterval(interval);
  }, [visible, hasAnswered, quiz, timerProgress, isSpectator]);

  useEffect(() => {
    if (!isSpectator || !spectatorResult || !quiz) return;
    setHasAnswered(true);
    if (spectatorResult.ok) {
      setSelectedAnswer(quiz.correctAnswer);
      setShowCorrectHighlight(true);
    } else {
      setSelectedAnswer(spectatorResult.selectedIndex !== undefined && spectatorResult.selectedIndex >= 0
        ? spectatorResult.selectedIndex
        : -1);
      setShowCorrectHighlight(false);
      setTimeout(() => setShowCorrectHighlight(true), 700);
    }
    resultScale.value = withTiming(1, { duration: 220 });
    badgeBounce.value = withTiming(1, { duration: 220 });
  }, [isSpectator, spectatorResult, quiz, resultScale, badgeBounce]);

  const handleTimeUp = useCallback(() => {
    if (hasAnswered || !quiz) return;
    setHasAnswered(true);
    setShowCorrectHighlight(false);
    setTimeout(() => setShowCorrectHighlight(true), 700);
    resultScale.value = withTiming(1, { duration: 220 });
    badgeBounce.value = withTiming(1, { duration: 220 });
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    playSound('quiz-wrong');
    const delay = quiz.explanation ? 3000 : 1500;
    setTimeout(() => onAnswer(false, quiz.reward, -1), delay);
  }, [hasAnswered, quiz, hapticsEnabled, onAnswer, playSound, resultScale, badgeBounce]);

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (hasAnswered || isSpectator || !quiz) return;
      setSelectedAnswer(index);
      setHasAnswered(true);
      const isCorrect = index === quiz.correctAnswer;
      const reward = quiz.reward;
      if (isCorrect) {
        setShowCorrectHighlight(true);
      } else {
        setShowCorrectHighlight(false);
        setTimeout(() => setShowCorrectHighlight(true), 700);
      }
      resultScale.value = withTiming(1, { duration: 220 });
      badgeBounce.value = withTiming(1, { duration: 220 });
      if (hapticsEnabled) {
        if (isCorrect) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      playSound(isCorrect ? 'quiz-correct' : 'quiz-wrong');
      const delay = quiz.explanation ? 3000 : 1500;
      setTimeout(() => onAnswer(isCorrect, reward, index), delay);
    },
    [hasAnswered, isSpectator, quiz, hapticsEnabled, onAnswer, playSound, resultScale, badgeBounce]
  );

  const timerAnimStyle = useAnimatedStyle(() => {
    'worklet';
    const backgroundColor = interpolateColor(
      timerProgress.value,
      [0, 0.33, 0.66, 1],
      ['#F44336', '#FF9800', '#FFD700', '#4CAF50']
    );
    return {
      width: `${timerProgress.value * 100}%`,
      backgroundColor,
    };
  });

  const resultAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeBounce.value }],
    opacity: badgeBounce.value,
  }));

  const isCorrect =
    isSpectator ? spectatorResult?.ok ?? false : selectedAnswer === quiz?.correctAnswer;

  if (!quiz) return null;

  return (
    <Modal visible={visible} onClose={onClose} closeOnBackdrop={false} showCloseButton={false} bareContent>
      <Animated.View entering={SlideInUp.duration(280)} style={styles.card}>
        {/* En-tête SVG */}
        <QuizHeader />

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isSpectator && (
            <View style={styles.spectatorBanner}>
              <Ionicons name="eye" size={14} color={COLORS.white} />
              <Text style={styles.spectatorText}>L'adversaire répond au quiz...</Text>
            </View>
          )}

          {/* Question dans une box */}
          <View style={styles.questionBox}>
            <Text style={styles.question}>{quiz.question}</Text>
          </View>

          {/* Timer bar - visible seulement avant réponse */}
          {!hasAnswered && (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={COLORS.events.quiz} />
              <View style={styles.timerTrack}>
                <Animated.View style={[styles.timerFill, timerAnimStyle]} />
              </View>
            </View>
          )}

          {/* Options de réponse - structure unique */}
          <View style={styles.options}>
            {quiz.options.map((option, index) => {
              const isCorrectOption = index === quiz.correctAnswer;
              const isSelected = selectedAnswer === index;
              const isSelectedWrong = isSelected && !isCorrectOption;
              const showAsCorrect = hasAnswered && isCorrectOption && showCorrectHighlight;

              // Styles conditionnels
              const pillStyle = !hasAnswered
                ? undefined
                : showAsCorrect
                  ? styles.optionPillCorrect
                  : isSelectedWrong
                    ? styles.optionPillWrong
                    : styles.optionPillDisabled;

              const prefixStyle = !hasAnswered
                ? styles.optionPrefixBadge
                : showAsCorrect
                  ? styles.optionPrefixBadgeCorrect
                  : isSelectedWrong
                    ? styles.optionPrefixBadgeWrong
                    : styles.optionPrefixBadge;

              const showCheckmark = hasAnswered && showAsCorrect;
              const showCross = hasAnswered && isSelectedWrong;

              return (
                <Pressable
                  key={index}
                  onPress={() => handleSelectAnswer(index)}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.optionPill,
                        pressed && !hasAnswered && !isSpectator && styles.optionPillPressed,
                        pillStyle,
                      ]}
                    >
                      <View style={prefixStyle}>
                        {showCheckmark ? (
                          <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        ) : showCross ? (
                          <Ionicons name="close" size={16} color={COLORS.white} />
                        ) : (
                          <Text style={[
                            styles.optionPrefixText,
                            (showAsCorrect || isSelectedWrong) && styles.optionPrefixTextLight
                          ]}>
                            {String.fromCharCode(65 + index)}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          showAsCorrect && styles.optionLabelCorrect,
                          isSelectedWrong && styles.optionLabelWrong,
                        ]}
                        numberOfLines={2}
                      >
                        {option}
                      </Text>
                      {showAsCorrect && isCorrect && (
                        <View style={styles.optionRewardBadge}>
                          <Text style={styles.optionRewardText}>+{quiz.reward}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Résultat - visible après réponse */}
          {hasAnswered && (
            <Animated.View style={[styles.resultWrap, resultAnimStyle]}>
              <Text style={[styles.resultTitle, !isCorrect && styles.resultTitleLoss]}>
                {isCorrect ? 'VOUS GAGNEZ' : 'VOUS PERDEZ'}
              </Text>
              <Animated.View
                style={[
                  styles.badge,
                  isCorrect ? styles.badgeGain : styles.badgeLoss,
                  badgeAnimStyle,
                ]}
              >
                <Text style={styles.badgeText}>
                  {isCorrect ? `+${quiz.reward}` : `-${quiz.reward}`}
                </Text>
              </Animated.View>
            </Animated.View>
          )}

          {/* Explication - visible après réponse, uniquement si disponible */}
          {hasAnswered && quiz.explanation ? (
            <Animated.View style={[styles.explanationWrap, resultAnimStyle]}>
              <View style={styles.explanationBox}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="bulb-outline" size={16} color="#FF9800" />
                  <Text style={styles.explanationTitle}>Explication</Text>
                </View>
                <Text style={styles.explanationText}>{quiz.explanation}</Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Bouton FERMER en mode spectateur — apparaît après la réponse de l'IA */}
          {isSpectator && hasAnswered && onSpectatorClose && (
            <Animated.View entering={FadeInDown.duration(220)} style={styles.spectatorCloseWrap}>
              <GameButton title="FERMER" onPress={onSpectatorClose} variant="blue" fullWidth />
            </Animated.View>
          )}
        </ScrollView>
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
    maxHeight: '92%',
    ...SHADOWS.xl,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 0,
  },
  content: {
    paddingTop: SPACING[4],
    paddingBottom: SPACING[5],
    paddingHorizontal: SPACING[4],
    alignItems: 'center',
  },
  spectatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[3],
    marginBottom: SPACING[4],
  },
  spectatorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  questionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    width: '100%',
    marginBottom: SPACING[3],
  },
  question: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    width: '100%',
    marginBottom: SPACING[3],
  },
  timerTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8EEF4',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  options: {
    width: '100%',
    gap: SPACING[2],
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    minHeight: 48,
    ...SHADOWS.sm,
  },
  optionPillPressed: {
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    transform: [{ scale: 0.98 }],
  },
  optionPillCorrect: {
    backgroundColor: COLORS.success,
  },
  optionPillWrong: {
    backgroundColor: COLORS.error,
  },
  optionPillDisabled: {
    backgroundColor: '#EAEEF2',
    opacity: 0.6,
  },
  optionPrefixBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
    ...SHADOWS.sm,
  },
  optionPrefixBadgeCorrect: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  optionPrefixBadgeWrong: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING[3],
  },
  optionPrefixText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.base,
    color: COLORS.events.quiz,
  },
  optionPrefixTextLight: {
    color: COLORS.white,
  },
  optionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.base,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 22,
  },
  optionLabelCorrect: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  optionLabelWrong: {
    color: COLORS.white,
    fontFamily: FONTS.bodySemiBold,
  },
  optionRewardBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING[2],
    ...SHADOWS.sm,
  },
  optionRewardText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  resultWrap: {
    alignItems: 'center',
    marginTop: SPACING[3],
    paddingTop: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: '#E8EEF4',
    width: '100%',
  },
  resultTitle: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.lg,
    color: COLORS.success,
    marginBottom: SPACING[3],
  },
  resultTitleLoss: {
    color: COLORS.error,
  },
  badge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  badgeGain: {
    backgroundColor: COLORS.success,
    borderColor: '#2E7D32',
  },
  badgeLoss: {
    backgroundColor: COLORS.error,
    borderColor: '#C62828',
  },
  badgeText: {
    fontFamily: FONTS.title,
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
  },
  explanationWrap: {
    width: '100%',
    marginTop: SPACING[3],
  },
  spectatorCloseWrap: {
    width: '100%',
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
  explanationBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: SPACING[1],
  },
  explanationTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: '#E65100',
  },
  explanationText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: '#5D4037',
    lineHeight: 20,
  },
});
