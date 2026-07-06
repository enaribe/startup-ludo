import { memo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';

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
    { x: 0,             y: -outlineWidth },
    { x: outlineWidth,  y: -outlineWidth },
    { x: outlineWidth,  y: 0             },
    { x: outlineWidth,  y: outlineWidth  },
    { x: 0,             y: outlineWidth  },
    { x: -outlineWidth, y: outlineWidth  },
    { x: -outlineWidth, y: 0             },
  ];

  return (
    <View>
      {/*
        Gabarit INVISIBLE en flux normal : c'est LUI qui donne sa taille au <View>.
        Toutes les couches visibles (contours + remplissage) sont en position absolue
        et calées sur ce même gabarit → alignement parfait sur tous les appareils.
        (Auparavant le remplissage était en flux et les contours en absolu, ce qui
        provoquait un désalignement — le contour apparaissait décalé « en dessous ».)
      */}
      <Text style={[style, { color: 'transparent' }]} numberOfLines={numberOfLines}>
        {text}
      </Text>

      {/* Contours (8 directions) */}
      {offsets.map((offset, i) => (
        <Text
          key={i}
          style={[style, styles.layer, { color: outlineColor, left: offset.x, top: offset.y }]}
          numberOfLines={numberOfLines}
        >
          {text}
        </Text>
      ))}

      {/* Remplissage — également absolu, calé sur le gabarit */}
      <Text style={[style, styles.layer, { color: '#FFFFFF', left: 0, top: 0 }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
  },
});
