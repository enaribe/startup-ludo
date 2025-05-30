import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface RandomCardScreenProps {
  onStartGame: (selectedEdition: string) => void;
}

// Liste des éditions disponibles
const editions = [
  'Agri',
  'Santé & Bien-être',
  'Éducation',
  'Tourisme & Hôtellerie',
  'Industries Culturelles & Créatives'
];

const RandomCardScreen: React.FC<RandomCardScreenProps> = ({ onStartGame }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<string | null>(null);
  const [showFinalCard, setShowFinalCard] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Fonction pour obtenir l'icône et les détails de l'édition
  const getEditionDetails = (edition: string) => {
    const details: { [key: string]: { icon: string; description: string } } = {
      'Agri': {
        icon: '🌾',
        description: 'Découvrez l\'univers de l\'agriculture moderne et de l\'innovation agro-alimentaire avec des défis réalistes et des opportunités inspirées du terrain sénégalais.'
      },
      'Santé & Bien-être': {
        icon: '⚕️',
        description: 'Explorez le secteur de la santé et du bien-être, des soins traditionnels aux innovations HealthTech, en passant par la télémédecine et la médecine préventive.'
      },
      'Éducation': {
        icon: '🎓',
        description: 'Plongez dans l\'écosystème éducatif moderne, de l\'apprentissage numérique aux formations professionnelles, en passant par l\'innovation pédagogique.'
      },
      'Tourisme & Hôtellerie': {
        icon: '🏨',
        description: 'Découvrez les opportunités du secteur touristique et hôtelier, du tourisme culturel au développement durable, en passant par l\'hospitalité moderne.'
      },
      'Industries Culturelles & Créatives': {
        icon: '🎨',
        description: 'Explorez l\'univers créatif et culturel, des arts traditionnels aux nouvelles technologies créatives, en passant par l\'économie créative moderne.'
      }
    };
    
    return details[edition] || { icon: '🔮', description: 'Édition d\'innovation entrepreneuriale' };
  };

  const handleCardPress = () => {
    if (isAnimating || selectedEdition) return;
    
    setIsAnimating(true);
    
    // Sélectionne une édition aléatoire
    const randomEdition = editions[Math.floor(Math.random() * editions.length)];
    setSelectedEdition(randomEdition);
    
    // Animation de retournement de carte
    Animated.sequence([
      // Rotation vers 90 degrés (carte se plie)
      Animated.timing(flipAnimation.current, {
        toValue: 0.5,
        duration: 400,
        useNativeDriver: true,
      }),
      // Rotation vers 180 degrés (carte se déplie avec nouveau contenu)
      Animated.timing(flipAnimation.current, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsAnimating(false);
      
      // Passe directement à la carte finale après l'animation
      timeoutRef.current = setTimeout(() => {
        setShowFinalCard(true);
      }, 500);
    });
  };

  // Interpolation pour l'effet de retournement
  const frontInterpolate = flipAnimation.current.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });

  const backInterpolate = flipAnimation.current.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '270deg', '360deg'],
  });

  const frontOpacity = flipAnimation.current.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 0, 0, 1],
  });

  const backOpacity = flipAnimation.current.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 1, 1, 0],
  });

  const editionDetails = selectedEdition ? getEditionDetails(selectedEdition) : null;

  // Si on affiche la carte finale détaillée
  if (showFinalCard && selectedEdition && editionDetails) {
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
        
        {/* Carte édition révélée finale */}
        <View style={styles.finalCardContainer}>
          <View style={styles.finalSectorCard}>
            {/* En-tête de la carte */}
            <View style={styles.finalCardHeader}>
              <Text style={styles.finalCardHeaderText}>
                Votre édition de jeu
              </Text>
            </View>
            
            {/* Contenu principal de la carte */}
            <View style={styles.finalCardContent}>
              {/* Icône de l'édition */}
              <View style={styles.finalSectorIcon}>
                <Text style={styles.finalIconText}>{editionDetails.icon}</Text>
              </View>
              
              {/* Titre de l'édition */}
              <Text style={styles.finalSectorTitle}>
                {selectedEdition}
              </Text>
              
              {/* Description */}
              <Text style={styles.finalSectorDescription}>
                {editionDetails.description}
              </Text>
              
              {/* Call-to-Action pour lancer le jeu */}
              <TouchableOpacity style={styles.startGameButton} onPress={() => onStartGame(selectedEdition)}>
                <View style={styles.startGameButtonInner}>
                  <Text style={styles.startGameButtonText}>COMMENCER LE JEU !</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }

  // Écran principal avec animation de carte
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
      
      {/* Instruction pour l'utilisateur */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {!selectedEdition ? 'Touchez la carte pour découvrir votre édition !' : 'Édition révélée !'}
        </Text>
      </View>
      
      {/* Zone de la carte avec animation de retournement */}
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.cardTouchable} 
          onPress={handleCardPress}
          disabled={isAnimating || selectedEdition !== null}
          activeOpacity={0.9}
        >
          {/* Face arrière de la carte */}
          <Animated.View 
            style={[
              styles.cardFace,

              styles.cardBack,
              {
                transform: [{ rotateY: backInterpolate }],
                opacity: backOpacity,
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>Carte édition</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.mysteryIcon}>
                <Text style={styles.mysteryIconText}>❓</Text>
              </View>
              <Text style={styles.mysteryText}>Édition mystère</Text>
              <Text style={styles.tapHint}>Touchez pour révéler</Text>
            </View>
          </Animated.View>

          {/* Face avant de la carte (révélée) */}
          <Animated.View 
            style={[
              styles.cardFace,
              styles.cardFront,
              {
                transform: [{ rotateY: frontInterpolate }],
                opacity: frontOpacity,
              }
            ]}
          >
            {/* Image d'aide en arrière-plan centré */}
            <Image 
              source={require('../../assets/images/aide.png')}
              style={styles.aideImage}
              resizeMode="contain"
            />
            
            {/* Contenu simple en attente de la carte finale */}
            {selectedEdition && editionDetails && (
              <View style={styles.cardContent}>
                <View style={styles.sectorIcon}>
                  <Text style={styles.sectorIconText}>
                    {editionDetails.icon}
                  </Text>
                </View>
                <Text style={styles.loadingFinalText}>Préparation...</Text>
              </View>
            )}
          </Animated.View>
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
  instructionContainer: {
    position: 'absolute',
    top: height * 0.15,
    left: 30,
    right: 30,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: 'Albert Sans',
    fontWeight: '600',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardContainer: {
    position: 'absolute',
    top: height * 0.25,
    left: 50,
    right: 50,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 25,
    overflow: 'hidden',
    // Effet d'ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  cardBack: {
    backgroundColor: '#263238',
    borderWidth: 2,
    borderColor: '#6B8D9E',
  },
  cardFront: {
    backgroundColor: '#263238',
    borderWidth: 2,
    borderColor: '#204395',
  },
  cardHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: '#204395',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    // Effet backdrop blur
    backdropFilter: 'blur(8px)',
  },
  cardHeaderText: {
    fontFamily: 'PoetsenOne',
    fontSize: 20,
    color: '#204395',
    textAlign: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  mysteryIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(107, 141, 158, 0.3)',
    borderWidth: 3,
    borderColor: '#6B8D9E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  mysteryIconText: {
    fontSize: 40,
    textAlign: 'center',
  },
  mysteryText: {
    fontFamily: 'Albert Sans',
    fontWeight: '800',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  tapHint: {
    fontFamily: 'Albert Sans',
    fontWeight: '400',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 175, 1, 0.3)',
    borderWidth: 3,
    borderColor: '#FFAF01',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  sectorIconText: {
    fontSize: 40,
    textAlign: 'center',
  },
  sectorTitle: {
    fontFamily: 'Albert Sans',
    fontWeight: '800',
    fontSize: 24,
    color: '#204395',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 29,
  },
  finalCardContainer: {
    position: 'absolute',
    top: 180,
    left: 50,
    right: 50,
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalSectorCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#204395',
    overflow: 'hidden',
    // Effet d'ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  finalCardHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: '#204395',
    paddingVertical: 14,
    paddingHorizontal: 55,
    alignItems: 'center',
    // Effet backdrop blur
    backdropFilter: 'blur(8px)',
  },
  finalCardHeaderText: {
    fontFamily: 'PoetsenOne',
    fontSize: 20,
    color: '#204395',
    textAlign: 'center',
  },
  finalCardContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalSectorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: '#FFAF01',
    // Effet d'ombre
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  finalIconText: {
    fontSize: 40,
    textAlign: 'center',
  },
  finalSectorTitle: {
    fontFamily: 'Albert Sans',
    fontWeight: '800',
    fontSize: 24,
    color: '#204395',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 29,
  },
  finalSectorDescription: {
    fontFamily: 'Albert Sans',
    fontWeight: '400',
    fontSize: 15,
    color: '#204395',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  startGameButton: {
    width: '100%',
    height: 55,
  },
  startGameButtonInner: {
    flex: 1,
    backgroundColor: '#1A7CB2',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#204395',
    justifyContent: 'center',
    alignItems: 'center',
    // Effet d'animation et d'ombre
    shadowColor: '#21EEEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  startGameButtonText: {
    fontFamily: 'PoetsenOne',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  aideImage: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: '20%',
    left: '25%',
    zIndex: 0,
  },
  loadingFinalText: {
    fontFamily: 'Albert Sans',
    fontWeight: '400',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default RandomCardScreen; 