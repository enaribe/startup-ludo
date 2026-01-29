import { memo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface RadialBackgroundProps {
  centerColor?: string;
  edgeColor?: string;
  radius?: string;
}

export const RadialBackground = memo(function RadialBackground({
  centerColor = '#0F3A6B',
  edgeColor = '#081A2A',
  radius = '80%',
}: RadialBackgroundProps) {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <RadialGradient id="radialBg" cx="50%" cy="50%" r={radius}>
          <Stop offset="0%" stopColor={centerColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={edgeColor} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#radialBg)" />
    </Svg>
  );
});
