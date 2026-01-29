import { memo, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GradientBorderProps {
  children: React.ReactNode;
  style?: object;
  boxHeight: number;
  boxWidth?: number;
  borderRadius?: number;
  fill?: string;
}

// Bordure gradient fixe (hauteur connue)
export const GradientBorder = memo(function GradientBorder({
  children,
  style,
  boxHeight,
  boxWidth = SCREEN_WIDTH - 36,
  borderRadius = 20,
  fill = 'transparent',
}: GradientBorderProps) {
  const borderW = 1;
  const gradientId = `grad_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View style={[{ position: 'relative', height: boxHeight, borderRadius, overflow: 'hidden' }, style]}>
      <Svg
        width={boxWidth}
        height={boxHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#9A9A9A" stopOpacity="0.3" />
            <Stop offset="25%" stopColor="#707070" stopOpacity="0.2" />
            <Stop offset="50%" stopColor="#B0B0B0" stopOpacity="0.35" />
            <Stop offset="75%" stopColor="#606060" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Rect
          x={borderW / 2}
          y={borderW / 2}
          width={boxWidth - borderW}
          height={boxHeight - borderW}
          rx={borderRadius}
          ry={borderRadius}
          fill={fill}
          stroke={`url(#${gradientId})`}
          strokeWidth={borderW}
        />
      </Svg>
      {children}
    </View>
  );
});

interface DynamicGradientBorderProps {
  children: React.ReactNode;
  style?: object;
  boxWidth?: number;
  borderRadius?: number;
  fill?: string;
}

// Bordure gradient dynamique (hauteur auto via onLayout)
export const DynamicGradientBorder = memo(function DynamicGradientBorder({
  children,
  style,
  boxWidth = SCREEN_WIDTH - 36,
  borderRadius = 20,
  fill = 'transparent',
}: DynamicGradientBorderProps) {
  const [boxHeight, setBoxHeight] = useState(0);
  const borderW = 1;
  const gradientId = `grad_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <View
      style={[{ position: 'relative', borderRadius, overflow: 'hidden' }, style]}
      onLayout={(e) => setBoxHeight(e.nativeEvent.layout.height)}
    >
      {boxHeight > 0 && (
        <Svg
          width={boxWidth}
          height={boxHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#9A9A9A" stopOpacity="0.3" />
              <Stop offset="25%" stopColor="#707070" stopOpacity="0.2" />
              <Stop offset="50%" stopColor="#B0B0B0" stopOpacity="0.35" />
              <Stop offset="75%" stopColor="#606060" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#9A9A9A" stopOpacity="0.3" />
            </LinearGradient>
          </Defs>
          <Rect
            x={borderW / 2}
            y={borderW / 2}
            width={boxWidth - borderW}
            height={boxHeight - borderW}
            rx={borderRadius}
            ry={borderRadius}
            fill={fill}
            stroke={`url(#${gradientId})`}
            strokeWidth={borderW}
          />
        </Svg>
      )}
      {children}
    </View>
  );
});
