import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress] = useState(new Animated.Value(0));
  const [logoOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animation du logo qui apparaît
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animation de la barre de progression
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      // Délai avant de finir le splash screen
      setTimeout(() => {
        onFinish();
      }, 500);
    });
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Arrière-plan avec motif décoratif */}
      <LinearGradient
        colors={['#095A93', '#204395']}
        style={styles.background}
        start={{ x: 0.5, y: 0.42 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Motif de fond décoratif */}
      <View style={styles.decorativePattern} />
      
      {/* Logo central */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <View style={styles.ludoLogo}>
          <Image 
            source={require('../../assets/images/ludo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Startup Ludo</Text>
      </Animated.View>
      
      {/* Barre de progression */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: width * 1.5,
    height: height * 1.5,
    left: -width * 0.25,
    top: -height * 0.25,
    borderRadius: width * 0.75,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 120,
  },
  ludoLogo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  boardSection: {
    flex: 1,
    flexDirection: 'row',
  },
  colorSection: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
    width: width * 0.8,
  },
  progressBackground: {
    width: '100%',
    height: 20,
    backgroundColor: 'rgba(249, 204, 62, 0.3)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#F4AB0E',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8FEA4E',
    borderRadius: 50,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FAE592',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SplashScreen; 