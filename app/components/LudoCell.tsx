import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import LudoPawn from './LudoPawn';

interface Cell {
  id: string;
  row: number;
  col: number;
  type: 'home' | 'center' | 'path' | 'empty';
  color: string;
  isStart?: boolean;
  isSafe?: boolean;
}

interface LudoCellProps {
  cell: Cell;
  cellSize: number;
  currentPlayer: 'yellow' | 'blue' | 'green' | 'red';
  showPawn?: boolean;
  onPress?: () => void;
}

const homeColors: Record<string, string> = {
  yellow: '#FFE44D',
  blue: '#7B9EF3',
  green: '#90EE90',
  red: '#FF7F7F',
};
const pathColors: Record<string, string> = {
  yellow: '#FFFACD',
  blue: '#B0C4DE',
  green: '#90EE90',
  red: '#FFC0CB',
  safe: '#90EE90',
  neutral: '#fff',
  center: '#FFD700',
  empty: '#F5F5F5',
};

const LudoCell: React.FC<LudoCellProps> = ({ cell, cellSize, currentPlayer, showPawn, onPress }) => {
  if (cell.type === 'empty') return null;

  const cellLeft = cell.col * cellSize;
  const cellTop = cell.row * cellSize;

  // Style de base
  let cellStyle: any = {
    left: cellLeft,
    top: cellTop,
    width: cellSize,
    height: cellSize,
    position: 'absolute' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 0.5,
    borderColor: '#333',
    backgroundColor: pathColors.neutral,
  };

  // Maison (grande case)
  if (cell.type === 'home') {
    const isCurrent = cell.color === currentPlayer;
    const glowColors: Record<string, string> = {
      yellow: '#fff7c0',
      blue: '#c0d8ff',
      green: '#c0ffc0',
      red: '#ffc0c0',
    };
    cellStyle = {
      ...cellStyle,
      width: cellSize * 6,
      height: cellSize * 6,
      backgroundColor: homeColors[cell.color],
      overflow: 'hidden',
      zIndex: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      opacity: isCurrent ? 1 : 0.9,
      borderColor: isCurrent ? glowColors[cell.color] : '#333',
      borderWidth: isCurrent ? 6 : 1,
      ...(isCurrent
        ? {
            shadowColor: glowColors[cell.color],
            shadowOpacity: 0.9,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 0 },
            elevation: 16,
          }
        : {}),
    };
    const content = (
      <View key={cell.id} style={cellStyle}>
        {showPawn && <LudoPawn color={cell.color as any} size={cellSize * 0.8} />}
      </View>
    );
    return onPress ? (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>
    ) : content;
  }

  // Centre (grande case 3x3)
  if (cell.type === 'center') {
    const cellStyleCenter = {
      left: cell.col * cellSize,
      top: cell.row * cellSize,
      width: cellSize * 3,
      height: cellSize * 3,
      position: 'absolute' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: pathColors.center,
      borderWidth: 1,
      borderColor: '#333',
      zIndex: 20,
    };
    return (
      <View key={cell.id} style={cellStyleCenter}>
        <Text style={{ fontSize: cellSize * 1.5, fontWeight: 'bold', color: '#2c3e50' }}>★</Text>
      </View>
    );
  }

  // Chemin
  if (cell.type === 'path') {
    let bg = pathColors[cell.color] || pathColors.neutral;
    let symbol = '';
    if (cell.isStart) symbol = '●';
    if (cell.isSafe) symbol = '△';
    const content = (
      <View key={cell.id} style={{ ...cellStyle, backgroundColor: bg }}>
        {symbol ? (
          <Text style={{ fontSize: cellSize * 0.5, fontWeight: 'bold', color: '#2c3e50' }}>{symbol}</Text>
        ) : null}
        {showPawn && <LudoPawn color={currentPlayer} size={cellSize * 0.8} />}
      </View>
    );
    return onPress ? (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>
    ) : content;
  }

  return null;
};

export default LudoCell; 