import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlayerSelectionScreenProps {
  onStartGame: (players: 1 | 2 | 3 | 4) => void;
}

const PlayerSelectionScreen: React.FC<PlayerSelectionScreenProps> = ({ onStartGame }) => {
  return (
    <ImageBackground 
      source={require('../../assets/images/bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.selectionContainer}>
        <Text style={styles.selectionTitle}>Choisissez le nombre de joueurs</Text>
        
        <View style={styles.playersButtonContainer}>
          <TouchableOpacity 
            style={styles.playerButton} 
            onPress={() => onStartGame(1)}
          >
            <Text style={styles.playerButtonText}>1 Joueur</Text>
            <Text style={styles.playerButtonSubtext}>Vous vs Ordinateur</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playerButton} 
            onPress={() => onStartGame(2)}
          >
            <Text style={styles.playerButtonText}>2 Joueurs</Text>
            <Text style={styles.playerButtonSubtext}>Jaune vs Rouge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playerButton} 
            onPress={() => onStartGame(3)}
          >
            <Text style={styles.playerButtonText}>3 Joueurs</Text>
            <Text style={styles.playerButtonSubtext}>Jaune, Bleu, Rouge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playerButton} 
            onPress={() => onStartGame(4)}
          >
            <Text style={styles.playerButtonText}>4 Joueurs</Text>
            <Text style={styles.playerButtonSubtext}>Tous les joueurs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 50,
  },
  playersButtonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  playerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playerButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#185893',
    marginBottom: 5,
  },
  playerButtonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PlayerSelectionScreen; 