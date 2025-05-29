import React from 'react';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

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
      {/* Motif décoratif radial */}
      <View style={styles.decorativePattern}>
        <View style={styles.radialPattern} />
      </View>
      
     
      
      {/* Conteneur des cartes de sélection */}
      <View style={styles.selectionContainer}>
        
        {/* Carte 1 Joueur */}
        <TouchableOpacity 
          style={styles.playerCard} 
          onPress={() => onStartGame(1)}
        >
          <View style={styles.cardBackground}>
            <Text style={styles.playerCardText}>Ordinateur</Text>
          </View>
        </TouchableOpacity>
        
        {/* Carte 2 Joueurs */}
        <TouchableOpacity 
          style={styles.playerCard} 
          onPress={() => onStartGame(2)}
        >
          <View style={styles.cardBackground}>
            <Text style={styles.playerCardText}>2 joueurs</Text>
          </View>
        </TouchableOpacity>
        
        {/* Carte 3 Joueurs */}
        <TouchableOpacity 
          style={styles.playerCard} 
          onPress={() => onStartGame(3)}
        >
          <View style={styles.cardBackground}>
            <Text style={styles.playerCardText}>3 joueurs</Text>
          </View>
        </TouchableOpacity>
        
        {/* Carte 4 Joueurs */}
        <TouchableOpacity 
          style={styles.playerCard} 
          onPress={() => onStartGame(4)}
        >
          <View style={styles.cardBackground}>
            <Text style={styles.playerCardText}>4 joueurs</Text>
          </View>
        </TouchableOpacity>
        
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativePattern: {
    position: 'absolute',
    left: -353,
    top: -124,
    width: 1096,
    height: 1091,
    overflow: 'hidden',
  },
  radialPattern: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 548,
    borderWidth: 1,
    borderColor: 'rgba(107, 141, 158, 0.3)',
    opacity: 0.6,
  },
  gameImageContainer: {
    position: 'absolute',
    left: width * 0.05,
    top: height * 0.05,
    width: width * 0.9,
    height: height * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  selectionContainer: {
    position: 'absolute',
    top: height * 0.37,
    left: 10,
    right: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  playerCard: {
    width: (width - 30) / 2, // Deux cartes par ligne avec gap de 10px
    height: 120,
    marginBottom: 10,
  },
  cardBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // Effet glassmorphism
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playerCardText: {
    fontFamily: 'PoetsenOne',
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 29,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default PlayerSelectionScreen; 