import { memo } from 'react';
import Svg, { Path } from 'react-native-svg';

interface ForumPlayLeafIconProps {
  width?: number;
  height?: number;
}

/** Double feuille verte (décor bouton « Touchez pour jouer » mode forum) */
export const ForumPlayLeafIcon = memo(function ForumPlayLeafIcon({
  width = 33,
  height = 18,
}: ForumPlayLeafIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 33 18" fill="none" accessibilityRole="image">
      <Path
        d="M16.1142 16.1133C16.1142 16.1133 2.73812 16.1133 1.11414 1.11328C1.11414 1.11328 16.1142 1.11328 16.1142 16.1133Z"
        fill="#4CAF50"
        stroke="#1C6B3B"
        strokeWidth={2}
        strokeMiterlimit={10}
      />
      <Path
        d="M16.5162 16.1133C16.5162 16.1133 16.5162 2.73726 31.5163 1.11328C31.5163 1.11328 31.5163 16.1133 16.5162 16.1133Z"
        fill="#4CAF50"
        stroke="#1C6B3B"
        strokeWidth={2}
        strokeMiterlimit={10}
      />
    </Svg>
  );
});
