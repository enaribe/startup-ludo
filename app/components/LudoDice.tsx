import React from 'react';
import { TouchableOpacity, View } from 'react-native';

interface LudoDiceProps {
  value: number;
  rolling: boolean;
  onRoll: () => void;
  size?: number;
}

const diceDots = [
  [],
  [[1, 1]],
  [[0, 0], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 0], [0, 2], [2, 0], [2, 2]],
  [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
];

const LudoDice: React.FC<LudoDiceProps> = ({ value, rolling, onRoll, size = 60 }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => !rolling && onRoll()}
      disabled={rolling}
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{
        width: size,
        height: size,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#333',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
      }}>
        {[0, 1, 2].map(row =>
          <View key={row} style={{ flexDirection: 'row', flex: 1, width: '100%' }}>
            {[0, 1, 2].map(col => {
              const isDot = diceDots[value]?.some(([r, c]) => r === row && c === col);
              return (
                <View
                  key={col}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDot ? (
                    <View style={{
                      width: size * 0.16,
                      height: size * 0.16,
                      borderRadius: size * 0.08,
                      backgroundColor: '#222',
                    }} />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default LudoDice; 