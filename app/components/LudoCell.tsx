import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface Cell {
  id: string;
  row: number;
  col: number;
  type: 'home' | 'center' | 'path' | 'empty';
  color: string;
  isStart?: boolean;
  homeNumber?: number;
  eventType?: 'quiz' | 'financement' | 'duel' | 'evenement';
}

interface LudoCellProps {
  cell: Cell;
  cellSize: number;
  pions: Array<'yellow' | 'blue' | 'red' | 'green'>;
  currentPlayer: 'yellow' | 'blue' | 'green' | 'red';
  onPress?: () => void;
}

const homeColors: Record<string, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#F35145',
};
const pathColors: Record<string, string> = {
  yellow: '#FFBC40',
  blue: '#1F91D0',
  green: '#4CAF50',
  red: '#F35145',
  safe: '#90EE90',
  neutral: '#fff',
  center: '#FFD700',
  empty: '#F5F5F5',
};

const LudoCell: React.FC<LudoCellProps> = ({ cell, cellSize, pions, currentPlayer, onPress }) => {
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
    borderWidth: 0.3,
    borderColor: '#DEE4E8',
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
      borderColor: isCurrent ? glowColors[cell.color] : '#DEE4E8',
      borderWidth: isCurrent ? 0.5 : 0.5,
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
        {/* Pions supprimés ici */}
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
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: '#DEE4E8',
      zIndex: 20,
    };
    return (
      <View key={cell.id} style={cellStyleCenter}>
        <Image
          source={require('../../assets/images/Vector.png')}
          style={{ width: cellSize * 2, height: cellSize * 2 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Chemin
      if (cell.type === 'path') {
      let bg = pathColors[cell.color] || pathColors.neutral;
      let symbol = '';
      if (cell.isStart) symbol = '';
    
    // Couleurs des cercles pour les chemins vers home
    const homeCircleColors: Record<string, string> = {
      yellow: '#EDA420',
      green: '#46A24A', 
      red: '#E6433C',
      blue: '#1C82BB',
    };
    
    // Couleurs et symboles pour les événements
    const eventColors: Record<string, string> = {
      quiz: '#4A90E2',      // Bleu
      financement: '#50C878', // Vert
      duel: '#FF6B6B',      // Rouge
      evenement: '#FFB347',  // Orange
    };
    
    const eventSymbols: Record<string, string> = {
      quiz: '?',
      financement: '$',
      duel: '⚔',
      evenement: '★',
    };
    
    const content = (
      <View key={cell.id} style={{ ...cellStyle, backgroundColor: bg }}>
        {cell.homeNumber ? (
          <View style={{
            width: cellSize * 0.7,
            height: cellSize * 0.7,
            borderRadius: cellSize * 0.35,
            backgroundColor: homeCircleColors[cell.color] || '#ccc',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: cellSize * 0.4, fontWeight: 'bold', color: '#fff' }}>
              {cell.homeNumber}
            </Text>
          </View>
        ) : cell.eventType ? (
          <View style={{
            width: cellSize * 0.6,
            height: cellSize * 0.6,
            borderRadius: cellSize * 0.3,
            backgroundColor: eventColors[cell.eventType],
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#fff',
          }}>
            <Text style={{ 
              fontSize: cellSize * 0.25, 
              fontWeight: 'bold', 
              color: '#fff',
              textAlign: 'center'
            }}>
              {eventSymbols[cell.eventType]}
            </Text>
          </View>
        ) : symbol ? (
          <Text style={{ fontSize: cellSize * 0.5, fontWeight: 'bold', color: '#2c3e50' }}>{symbol}</Text>
        ) : null}
        {/* Pions supprimés ici */}
      </View>
    );
    return onPress ? (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>{content}</TouchableOpacity>
    ) : content;
  }

  return null;
};

export default LudoCell; 