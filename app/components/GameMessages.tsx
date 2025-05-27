import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GameMessagesProps {
  message: string | null;
  gameFinished: boolean;
  onResetGame: () => void;
}

const GameMessages: React.FC<GameMessagesProps> = ({ 
  message, 
  gameFinished, 
  onResetGame
}) => {
  return (
    <>
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
      
      {gameFinished && (
        <View style={styles.winnerContainer}>
          <Text style={styles.winnerText}>
            🎉 Partie terminée ! 🎉
          </Text>
          <TouchableOpacity style={styles.newGameButton} onPress={onResetGame}>
            <Text style={styles.newGameButtonText}>Nouvelle partie</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  messageText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  winnerContainer: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    transform: [{ translateY: -50 }],
  },
  winnerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  newGameButton: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    padding: 12,
  },
  newGameButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameMessages; 