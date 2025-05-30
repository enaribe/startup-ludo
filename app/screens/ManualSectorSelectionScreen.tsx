import React from 'react';
import {
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface ManualSectorSelectionScreenProps {
  onSelectEdition: (selectedEdition: string) => void;
  onBack: () => void;
}

const ManualSectorSelectionScreen: React.FC<ManualSectorSelectionScreenProps> = ({ 
  onSelectEdition, 
  onBack 
}) => {
  const editions = [
    {
      name: 'Agri',
      icon: '🌾',
      title: 'Agriculture',
      description: 'Développez votre exploitation agricole et maîtrisez les chaînes de valeur alimentaires'
    },
    {
      name: 'Santé & Bien-être',
      icon: '⚕️',
      title: 'Santé & Bien-être',
      description: 'Innovez dans les services de santé et le bien-être pour améliorer la qualité de vie'
    },
    {
      name: 'Éducation',
      icon: '🎓',
      title: 'Éducation',
      description: 'Révolutionnez l\'apprentissage avec des solutions éducatives innovantes'
    },
    {
      name: 'Tourisme & Hôtellerie',
      icon: '🏨',
      title: 'Tourisme & Hôtellerie',
      description: 'Créez des expériences touristiques uniques et développez l\'hospitalité'
    },
    {
      name: 'Industries Culturelles & Créatives',
      icon: '🎨',
      title: 'Industries Créatives',
      description: 'Explorez les arts, la culture et les médias pour créer de la valeur artistique'
    }
  ];

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
        <Text style={styles.titleText}>🎯 Choisissez votre secteur</Text>
        <Text style={styles.subtitleText}>Sélectionnez le domaine dans lequel vous voulez créer votre entreprise</Text>
      </View>
      
      {/* Liste des éditions */}
      <ScrollView 
        style={styles.editionsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.editionsContent}
      >
        {editions.map((edition, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.editionCard}
            onPress={() => onSelectEdition(edition.name)}
            activeOpacity={0.8}
          >
            <View style={styles.cardGlow} />
            <View style={styles.editionHeader}>
              <View style={styles.editionIconContainer}>
                <Text style={styles.editionIcon}>{edition.icon}</Text>
              </View>
              <View style={styles.editionInfo}>
                <Text style={styles.editionTitle}>{edition.title}</Text>
                <Text style={styles.editionDescription}>{edition.description}</Text>
              </View>
            </View>
            <View style={styles.selectArrow}>
              <Text style={styles.selectArrowText}>▶</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Indication en bas */}
      <View style={styles.bottomHint}>
        <Text style={styles.hintText}>💡 Chaque secteur propose des défis et opportunités uniques</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 15,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Overlay pour améliorer la lisibilité
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
  titleContainer: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 25,
    zIndex: 1,
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF', // Blanc au lieu de doré
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  editionsContainer: {
    flex: 1,
    zIndex: 1,
  },
  editionsContent: {
    paddingBottom: 100,
  },
  editionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Couleur transparente uniforme
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Bordure transparente
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Glow plus subtil
  },
  editionHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  editionIcon: {
    fontSize: 32,
  },
  editionInfo: {
    flex: 1,
  },
  editionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  editionDescription: {
    fontSize: 15,
    color: '#F8F9FA',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectArrow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  selectArrowText: {
    fontSize: 20,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1,
  },
  hintText: {
    fontSize: 15,
    color: '#FFFFFF', // Blanc au lieu de doré
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default ManualSectorSelectionScreen; 