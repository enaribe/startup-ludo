import React from 'react';
import { Text } from 'react-native';

interface LudoPawnProps {
  color: 'yellow' | 'blue' | 'green' | 'red';
  size: number;
}

const pawnEmojis: Record<string, string> = {
  yellow: '🟡',
  blue: '🔵',
  green: '🟢',
  red: '🔴',
};

const LudoPawn: React.FC<LudoPawnProps> = ({ color, size }) => {
  return (
    <Text style={{ fontSize: size, textAlign: 'center' }}>{pawnEmojis[color]}</Text>
  );
};

export default LudoPawn; 