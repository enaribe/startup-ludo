import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface GameModeSelectionScreenProps {
  onSelectMode: (mode: 'online' | 'friends' | 'simple') => void;
}

const GameModeSelectionScreen: React.FC<GameModeSelectionScreenProps> = ({ onSelectMode }) => {
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
      
      {/* Image principale du jeu */}
      <View style={styles.gameImageContainer}>
        <Image 
          source={require('../../assets/images/main-game-image.png')}
          style={styles.gameImage}
          resizeMode="contain"
        />
      </View>
      
      {/* Conteneur des boutons de mode */}
      <View style={styles.modesContainer}>
        

         {/* Mode Simple */}
         <TouchableOpacity 
          style={styles.modeButton} 
          onPress={() => onSelectMode('simple')}
        >
          <View style={[styles.modeButtonBackground, { backgroundColor: '#1A7CB2' }]}>
            <LinearGradient
              colors={['#1F91D0', '#219DE1']}
              style={styles.modeButtonGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              {/* Icône dé */}
              <Text style={styles.modeButtonText}>Mode simple</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Mode Online */}
        <TouchableOpacity 
          style={styles.modeButton} 
          onPress={() => onSelectMode('online')}
        >
          <View style={[styles.modeButtonBackground, { backgroundColor: '#CD8F0A' }]}>
            <LinearGradient
              colors={['#FFEC48', '#F19F03']}
              style={styles.modeButtonGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              {/* Icône globe */}
              <Text style={styles.modeButtonText}>Play Online</Text>
            </LinearGradient>
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
    left: -468,
    top: -241,
    width: 1326,
    height: 1326,
    overflow: 'hidden',
  },
  radialPattern: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 663,
    borderWidth: 1,
    borderColor: 'rgba(107, 141, 158, 0.3)',
    opacity: 0.6,
  },
  gameImageContainer: {
    position: 'absolute',
    left: width * 0.05,
    top: height * 0.09,
    width: width * 0.9,
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  modesContainer: {
    position: 'absolute',
    bottom: 80,
    left: 67,
    right: 67,
    gap: 20,
  },
  modeButton: {
    width: 255,
    height: 77,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.63 },
    shadowOpacity: 0.25,
    shadowRadius: 1.63,
  },
  modeButtonBackground: {
    flex: 1,
    borderRadius: 9.78,
    padding: 2,
  },
  modeButtonGradient: {
    flex: 1,
    borderRadius: 7.74,
    borderWidth: 0.41,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  iconContainer: {
    width: 30,
    height: 30,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Icône Globe
  globeIcon: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  globeBase: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  globeLines: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  // Icône Personnes
  peopleIcon: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  person1: {
    width: 10,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  person2: {
    width: 10,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  // Icône Dé
  diceIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  diceFace: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  diceDot1: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 3,
    height: 3,
    backgroundColor: '#1A7CB2',
    borderRadius: 1.5,
  },
  diceDot2: {
    position: 'absolute',
    top: 8.5,
    left: 8.5,
    width: 3,
    height: 3,
    backgroundColor: '#1A7CB2',
    borderRadius: 1.5,
  },
  diceDot3: {
    position: 'absolute',
    top: 13,
    left: 13,
    width: 3,
    height: 3,
    backgroundColor: '#1A7CB2',
    borderRadius: 1.5,
  },
  modeButtonText: {
    flex: 1,
    fontSize: 23.22,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.46,
    textAlign: 'center',
    lineHeight: 27.3,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0.41, height: 0.41 },
    textShadowRadius: 0.41,
  },
});

export default GameModeSelectionScreen; 