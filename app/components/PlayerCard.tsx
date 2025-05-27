import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LudoDice from './LudoDice';
import Icon1 from './icons/Icon1';
import Icon2 from './icons/Icon2';
import Icon3 from './icons/Icon3';
import Icon4 from './icons/Icon4';

interface PlayerCardProps {
  color: 'yellow' | 'blue' | 'red' | 'green';
  playerName: string;
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  isCurrentPlayer: boolean;
  isFinished: boolean;
  finishedPosition?: number;
  diceValue: number;
  rolling: boolean;
  isAnimating: boolean;
  onRollDice: () => void;
  isComputerPlayer?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  color,
  playerName,
  position,
  isCurrentPlayer,
  isFinished,
  finishedPosition,
  diceValue,
  rolling,
  isAnimating,
  onRollDice,
  isComputerPlayer = false,
}) => {
  const colorMap = {
    yellow: '#EDA420',
    blue: '#1C82BB',
    green: '#46A24A',
    red: '#E6433C',
  };

  const positionStyles = {
    topLeft: styles.topLeft,
    topRight: styles.topRight,
    bottomLeft: styles.bottomLeft,
    bottomRight: styles.bottomRight,
  };

  return (
    <View style={[styles.playerCard, positionStyles[position]]}>
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <View style={styles.playerAvatar}>
            {isFinished && finishedPosition && (
              <Text style={styles.positionText}>
                {finishedPosition}
              </Text>
            )}
          </View>
          <Text style={styles.playerName}>{playerName}</Text>
        </View>
        {isCurrentPlayer && !isFinished && (
          <LudoDice 
            value={diceValue} 
            rolling={rolling || isAnimating} 
            onRoll={onRollDice} 
            size={40}
            disabled={isComputerPlayer}
          />
        )}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon1 size={20} color={colorMap[color]} />
          <Text style={styles.statNumber}>3</Text>
        </View>
        <View style={styles.statItem}>
          <Icon2 size={20} color={colorMap[color]} />
          <Text style={styles.statNumber}>3</Text>
        </View>
        <View style={styles.statItem}>
          <Icon3 size={20} color={colorMap[color]} />
          <Text style={styles.statNumber}>1</Text>
        </View>
        <View style={styles.statItem}>
          <Icon4 size={20} color={colorMap[color]} />
          <Text style={styles.statNumber}>1</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  playerCard: {
    position: 'absolute',
    width: 190,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  topLeft: {
    top: '12%',
    left: '2%',
  },
  topRight: {
    top: '12%',
    right: '2%',
  },
  bottomLeft: {
    bottom: '12%',
    left: '2%',
  },
  bottomRight: {
    bottom: '12%',
    right: '2%',
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  playerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 3,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  statNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 1,
  },
});

export default PlayerCard; 