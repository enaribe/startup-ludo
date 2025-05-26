import React from 'react';
import { Animated, Image } from 'react-native';

interface LudoPawnProps {
  color: 'yellow' | 'blue' | 'green' | 'red';
  size: number;
  animatedPosition: Animated.ValueXY;
}

const pawnImages: Record<string, any> = {
  yellow: require('../../assets/images/yellowpawn.png'),
  blue: require('../../assets/images/bluepawn.png'),
  green: require('../../assets/images/greenpawn.png'),
  red: require('../../assets/images/redpawn.png'),
};

const LudoPawn: React.FC<LudoPawnProps> = ({ color, size, animatedPosition }) => {
  return (
    <Animated.View style={[{ position: 'absolute' }, animatedPosition.getLayout()]}> 
      <Image 
        source={pawnImages[color]} 
        style={{ width: size, height: size }} 
        resizeMode="contain"
      />
    </Animated.View>
  );
};

export default LudoPawn; 