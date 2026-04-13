import { memo, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  FeBlend,
  FeColorMatrix,
  FeFlood,
  FeGaussianBlur,
  FeOffset,
  Filter,
  G,
  Path,
} from 'react-native-svg';

export type ForumLeaderboardRank = 1 | 2 | 3;

interface ForumLeaderboardRankTrophyIconProps {
  /** Largeur du SVG (hauteur dérivée du viewBox 48×46) */
  size?: number;
  rank: ForumLeaderboardRank;
}

/**
 * Trophée vert (classement forum) — sans chiffre superposé (asset seul, comme le design).
 */
export const ForumLeaderboardRankTrophyIcon = memo(function ForumLeaderboardRankTrophyIcon({
  size = 48,
  rank,
}: ForumLeaderboardRankTrophyIconProps) {
  const filterId = useId().replace(/:/g, '_');
  const w = size;
  const h = (size * 46) / 48;

  return (
    <View style={[styles.wrap, { width: w, height: h }]} accessibilityLabel={`Rang ${rank}`}>
      <Svg width={w} height={h} viewBox="0 0 48 46" fill="none" accessibilityRole="image">
        <Defs>
          <Filter id={filterId} x="0" y="0" width="48" height="46" filterUnits="userSpaceOnUse">
            <FeFlood floodOpacity={0} result="BackgroundImageFix" />
            <FeColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <FeOffset dy={2} />
            <FeGaussianBlur stdDeviation={4} />
            <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
            <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
            <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
          </Filter>
        </Defs>
        <G filter={`url(#${filterId})`}>
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17.6827 6.00069C17.6564 6.00069 17.6282 6.00053 17.5985 6.00037C17.3134 5.99883 16.8791 5.99648 16.4795 6.11944C15.7687 6.33817 15.1833 6.85059 14.8728 7.50579L11.2262 7.50579C10.9573 7.50571 10.663 7.50563 10.4062 7.52872C10.1072 7.5556 9.73967 7.62125 9.36385 7.82248C8.85692 8.09391 8.42937 8.55503 8.20182 9.07572C7.92796 9.70242 7.99777 10.3632 8.04153 10.7773C8.04579 10.8177 8.04981 10.8557 8.05323 10.8911C8.71704 17.7498 13.0333 23.3194 19.6605 25.0189C20.2903 25.7046 20.9639 26.2919 21.6715 26.7862C22.0215 27.0308 22.397 27.2022 22.7781 27.3141C22.769 27.403 22.7589 27.4936 22.7477 27.5856C22.6364 28.4963 22.4314 29.3572 22.1259 29.9407C21.5003 29.9808 20.8568 30.0585 20.2478 30.2092C18.9582 30.5283 17.6401 31.2219 16.9817 32.723L16.9687 32.7525C16.9081 32.89 16.8147 33.102 16.7624 33.3311C16.6953 33.6252 16.7001 33.9045 16.7561 34.1949C16.8177 34.5145 16.9756 34.801 17.1039 34.9921C17.2322 35.1833 17.438 35.4389 17.7129 35.6206C18.2956 36.0059 18.9251 36.0022 19.3885 35.9995C19.4257 35.9993 19.4625 35.9991 19.4975 35.9991H28.5023C28.5375 35.9991 28.5739 35.9993 28.6114 35.9995C29.0747 36.0022 29.7043 36.0059 30.2869 35.6206C30.5618 35.4389 30.7676 35.1833 30.8959 34.9921C31.0242 34.801 31.1822 34.5145 31.2438 34.1949C31.2997 33.9045 31.3045 33.6252 31.2374 33.3311C31.1852 33.102 31.0917 32.89 31.0311 32.7525L31.0181 32.723C30.3597 31.2219 29.0416 30.5283 27.7521 30.2092C27.143 30.0585 26.4996 29.9808 25.8739 29.9407C25.5684 29.3572 25.3634 28.4963 25.2522 27.5856C25.2409 27.4937 25.2309 27.403 25.2218 27.3141C25.6028 27.2022 25.9784 27.0308 26.3284 26.7862C27.04 26.2891 27.7172 25.6979 28.35 25.0073C34.9677 23.2983 39.2838 17.7579 39.9469 10.8908C39.9503 10.8554 39.9543 10.8174 39.9586 10.777C40.0023 10.3628 40.0719 9.70194 39.798 9.07536C39.5704 8.55474 39.1429 8.09377 38.636 7.8224C38.2602 7.6212 37.8927 7.55558 37.5937 7.52871C37.3369 7.50563 37.0426 7.50571 36.7737 7.50579L33.1271 7.50579C32.8166 6.85059 32.2312 6.33817 31.5204 6.11944C31.1208 5.99648 30.6865 5.99883 30.4014 6.00037C30.3717 6.00053 30.3435 6.00069 30.3172 6.00069H17.6827ZM11.2711 10.5056H14.7054C14.9493 14.6038 15.701 17.9224 16.8394 20.5582C13.611 18.483 11.5159 14.9297 11.0976 10.6075L11.0878 10.5058C11.1431 10.5056 11.2036 10.5056 11.2711 10.5056ZM31.1659 20.5455C32.3013 17.9117 33.0509 14.5972 33.2945 10.5056H36.7288C36.7963 10.5056 36.857 10.5056 36.9123 10.5058L36.9025 10.6079C36.4851 14.9308 34.3929 18.4723 31.1659 20.5455Z"
            fill="#4CAF50"
          />
        </G>
        <Path
          d="M26 12.111L25.7026 20L23.4667 19.889L23.5897 14.6408L22.7692 15.251L22 13.3537L23.6718 12L26 12.111Z"
          fill="#0D5525"
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
