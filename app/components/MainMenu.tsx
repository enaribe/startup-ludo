import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface MainMenuProps {
  onStartGame: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
  return (
    <View style={styles.container}>
      {/* Arrière-plan avec dégradé exact du Figma */}
      <LinearGradient
        colors={['#095A93', '#204395']}
        style={styles.background}
        start={{ x: 0.5, y: 0.418 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Motif décoratif radial */}
      <View style={styles.decorativePattern}>
        <View style={styles.radialPattern} />
      </View>
      
      {/* Image principale du jeu - Design Figma */}
      <View style={styles.gameImageContainer}>
        <Image 
          source={require('../../assets/images/main-game-image.png')}
          style={styles.gameImage}
          resizeMode="contain"
        />
      </View>
      
      {/* Bouton Jouer avec design exact du Figma */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.playButton} onPress={onStartGame}>
          {/* Arrière-plan principal bleu */}
          <View style={styles.playButtonBackground}>
            {/* Conteneur avec dégradé interne */}
            <LinearGradient
              colors={['rgba(196, 196, 196, 0.00)', 'rgba(227, 225, 225, 0.41)']}
              style={styles.playButtonGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <Text style={styles.playButtonText}>Jouer</Text>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#095A93',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
    left: 1.84,
    top: 76,
    width: 386,
    height: 446,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 163, // 844 - 604 - 77 = 163 (height - y - buttonHeight)
    left: 67.28,
    right: 67.28,
    alignItems: 'center',
  },
  playButton: {
    width: 255.44,
    height: 77,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.63 },
    shadowOpacity: 0.25,
    shadowRadius: 1.63,
  },
  playButtonBackground: {
    flex: 1,
    backgroundColor: '#1A7CB2',
    borderRadius: 9.78,
    padding: 2,
  },
  playButtonGradient: {
    flex: 1,
    borderRadius: 7.74,
    borderWidth: 0.41,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderRadius: 7.74,
  },
  playButtonText: {
    fontSize: 23.22,
    fontWeight: '400',
    color: '#FFFFFF',
    letterSpacing: -0.46, // -2% de 23.22
    textAlign: 'center',
    lineHeight: 27.3, // 0.316em
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0.41, height: 0.41 },
    textShadowRadius: 0.41,
    zIndex: 10,
  },
});

export default MainMenu; 