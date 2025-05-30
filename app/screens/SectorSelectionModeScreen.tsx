import React from 'react';
import {
    Dimensions,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SectorSelectionModeScreenProps {
  onSelectMode: (mode: 'random' | 'manual') => void;
  onBack: () => void;
}

const SectorSelectionModeScreen: React.FC<SectorSelectionModeScreenProps> = ({ onSelectMode, onBack }) => {
  return (
    <ImageBackground 
      source={require('../../assets/images/bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      {/* Overlay semi-transparent pour améliorer la lisibilité */}
      <View style={styles.overlay} />
      
      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonIcon}>←</Text>
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
      
      {/* Titre principal */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Choisir l'édition</Text>
        <Text style={styles.subtitleText}>Comment voulez-vous découvrir votre secteur d'entrepreneuriat ?</Text>
      </View>
      
      {/* Options de sélection */}
      <View style={styles.optionsContainer}>
        {/* Mode aléatoire */}
        <TouchableOpacity 
          style={[styles.modeButton, styles.randomModeButton]}
          onPress={() => onSelectMode('random')}
          activeOpacity={0.8}
        >
          <View style={styles.modeIconContainer}>
            <Text style={styles.modeIcon}>🎲</Text>
          </View>
          <Text style={styles.modeTitle}>Mode Surprise</Text>
          <Text style={styles.modeDescription}>
            Laissez le hasard décider !{'\n'}Touchez la carte mystère pour{'\n'}découvrir votre secteur
          </Text>
          <View style={styles.buttonAccent} />
        </TouchableOpacity>
        
        {/* Mode manuel */}
        <TouchableOpacity 
          style={[styles.modeButton, styles.manualModeButton]}
          onPress={() => onSelectMode('manual')}
          activeOpacity={0.8}
        >
          <View style={styles.modeIconContainer}>
            <Text style={styles.modeIcon}>🎯</Text>
          </View>
          <Text style={styles.modeTitle}>Mode Expert</Text>
          <Text style={styles.modeDescription}>
            Prenez le contrôle !{'\n'}Choisissez directement le secteur{'\n'}qui vous passionne
          </Text>
          <View style={styles.buttonAccent} />
        </TouchableOpacity>
      </View>
      
      {/* Indication en bas */}
      <View style={styles.bottomHint}>
        <Text style={styles.hintText}>💡 Chaque secteur offre des défis et opportunités uniques</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Overlay léger pour améliorer la lisibilité
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 1,
  },
  titleText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF', // Blanc au lieu de doré
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  optionsContainer: {
    flexDirection: 'column', // Changé de 'row' à 'column'
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 80, // Ajouter un padding en bas pour éviter le chevauchement
    zIndex: 1,
  },
  modeButton: {
    width: '85%', // Largeur fixe pour les boutons
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Couleur transparente uniforme
    borderRadius: 25,
    padding: 20, // Réduire le padding pour économiser l'espace
    marginVertical: 12, // Réduire l'espacement vertical
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Bordure transparente
    position: 'relative',
    overflow: 'hidden',
  },
  randomModeButton: {
    // Style supplémentaire si nécessaire (actuellement vide)
  },
  manualModeButton: {
    // Style supplémentaire si nécessaire (actuellement vide)
  },
  modeIconContainer: {
    width: 80, // Réduire légèrement la taille
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15, // Réduire la marge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modeIcon: {
    fontSize: 40, // Réduire légèrement la taille
  },
  modeTitle: {
    fontSize: 20, // Réduire légèrement la taille
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12, // Réduire la marge
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  modeDescription: {
    fontSize: 14, // Réduire légèrement la taille
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20, // Ajuster la hauteur de ligne
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  buttonAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Glow plus subtil
  },
  bottomHint: {
    position: 'absolute',
    bottom: 30, // Garder la même position
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  hintText: {
    fontSize: 16,
    color: '#FFFFFF', // Blanc au lieu de doré
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Couleur transparente
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Bordure transparente
  },
  backButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SectorSelectionModeScreen; 