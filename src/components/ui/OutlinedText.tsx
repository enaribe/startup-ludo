import { memo } from 'react';
import { Text, TextStyle, View } from 'react-native';

interface OutlinedTextProps {
  text: string;
  style: TextStyle | TextStyle[];
  outlineColor: string;
  outlineWidth?: number;
  numberOfLines?: number;
}

export const OutlinedText = memo(function OutlinedText({
  text,
  style,
  outlineColor,
  outlineWidth = 2,
  numberOfLines,
}: OutlinedTextProps) {
  const offsets = [
    { x: -outlineWidth, y: -outlineWidth },
    { x: 0,            y: -outlineWidth },
    { x: outlineWidth,  y: -outlineWidth },
    { x: outlineWidth,  y: 0            },
    { x: outlineWidth,  y: outlineWidth  },
    { x: 0,            y: outlineWidth  },
    { x: -outlineWidth, y: outlineWidth  },
    { x: -outlineWidth, y: 0            },
  ];

  return (
    <View>
      {offsets.map((offset, i) => (
        <Text
          key={i}
          style={[style, { color: outlineColor, position: 'absolute', left: offset.x, top: offset.y }]}
          numberOfLines={numberOfLines}
        >
          {text}
        </Text>
      ))}
      <Text style={[style, { color: '#FFFFFF' }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    </View>
  );
});
