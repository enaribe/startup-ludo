import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LudoDice from './LudoDice';

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
  tokens: number; // Nombre de jetons du joueur
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
  tokens,
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
      <View style={styles.tokensRow}>
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Jetons:</Text>
          <View style={[
            styles.tokenBadge, 
            tokens < 0 ? styles.tokenBadgeNegative : {}
          ]}>
            <Text style={[
              styles.tokenNumber,
              tokens < 0 ? styles.tokenNumberNegative : {}
            ]}>
              {tokens}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          {tokens >= 7 ? (
            <Text style={styles.statusReady}>✓ Prêt pour la finale</Text>
          ) : (
            <Text style={styles.statusNotReady}>
              Besoin de {Math.max(0, 7 - tokens)} jeton(s)
              {tokens < 0 ? ` (actuellement ${tokens})` : ''}
            </Text>
          )}
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
  tokensRow: {
    flexDirection: 'column',
    gap: 4,
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  tokenBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  tokenBadgeNegative: {
    backgroundColor: '#FF6B6B',
  },
  tokenNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenNumberNegative: {
    color: '#fff',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusReady: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  statusNotReady: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
  },
});

export default PlayerCard; 