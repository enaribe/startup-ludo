import React from 'react';
import { Animated, Text } from 'react-native';

interface LudoPawnProps {
  color: 'yellow' | 'blue' | 'green' | 'red';
  size: number;
  animatedPosition: Animated.ValueXY;
}

const pawnEmojis: Record<string, string> = {
  yellow: '🟡',
  blue: '🔵',
  green: '🟢',
  red: '🔴',
};

const LudoPawn: React.FC<LudoPawnProps> = ({ color, size, animatedPosition }) => {
  return (
    <Animated.View style={[{ position: 'absolute' }, animatedPosition.getLayout()]}> 
      <Text style={{ fontSize: size, textAlign: 'center' }}>{pawnEmojis[color]}</Text>
    </Animated.View>
  );
};

export default LudoPawn; 