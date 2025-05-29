import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';

// Types des sons disponibles
export type SoundType = 
  | 'diceRoll'
  | 'pawnMove'
  | 'pawnCapture'
  | 'tokenGain'
  | 'tokenLoss'
  | 'gameWin'
  | 'eventPositive'
  | 'eventNegative'
  | 'quizCorrect'
  | 'quizWrong'
  | 'duelSuccess'
  | 'duelFail'
  | 'buttonClick';

interface SoundConfig {
  file: any; // Pour les require()
  volume?: number;
  rate?: number;
}

// Configuration des sons
const SOUND_CONFIG: Record<SoundType, SoundConfig> = {
  diceRoll: {
    file: require('../../assets/sounds/dice-roll.mp3'),
    volume: 0.7,
    rate: 1.0,
  },
  pawnMove: {
    file: require('../../assets/sounds/pawn-move.mp3'),
    volume: 0.5,
    rate: 1.2,
  },
  pawnCapture: {
    file: require('../../assets/sounds/pawn-capture.mp3'),
    volume: 0.8,
    rate: 1.0,
  },
  tokenGain: {
    file: require('../../assets/sounds/token-gain.mp3'),
    volume: 0.6,
    rate: 1.0,
  },
  tokenLoss: {
    file: require('../../assets/sounds/token-loss.mp3'),
    volume: 0.6,
    rate: 1.0,
  },
  gameWin: {
    file: require('../../assets/sounds/game-win.mp3'),
    volume: 0.9,
    rate: 1.0,
  },
  eventPositive: {
    file: require('../../assets/sounds/event-positive.mp3'),
    volume: 0.7,
    rate: 1.0,
  },
  eventNegative: {
    file: require('../../assets/sounds/event-negative.mp3'),
    volume: 0.7,
    rate: 1.0,
  },
  quizCorrect: {
    file: require('../../assets/sounds/quiz-correct.mp3'),
    volume: 0.8,
    rate: 1.0,
  },
  quizWrong: {
    file: require('../../assets/sounds/quiz-wrong.mp3'),
    volume: 0.8,
    rate: 1.0,
  },
  duelSuccess: {
    file: require('../../assets/sounds/duel-success.mp3'),
    volume: 0.8,
    rate: 1.0,
  },
  duelFail: {
    file: require('../../assets/sounds/duel-fail.mp3'),
    volume: 0.8,
    rate: 1.0,
  },
  buttonClick: {
    file: require('../../assets/sounds/button-click.mp3'),
    volume: 0.4,
    rate: 1.0,
  },
};

const useSound = () => {
  const soundObjectsRef = useRef<Record<string, Audio.Sound>>({});
  const enabledRef = useRef(true);

  // Charger tous les sons au démarrage
  useEffect(() => {
    const loadSounds = async () => {
      try {
        // Configurer l'audio pour le jeu
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Charger chaque son
        for (const [soundType, config] of Object.entries(SOUND_CONFIG)) {
          try {
            const { sound } = await Audio.Sound.createAsync(config.file);
            await sound.setVolumeAsync(config.volume || 0.5);
            await sound.setRateAsync(config.rate || 1.0, true);
            soundObjectsRef.current[soundType] = sound;
          } catch (error) {
            console.warn(`Erreur lors du chargement du son ${soundType}:`, error);
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la configuration audio:', error);
      }
    };

    loadSounds();

    // Nettoyer les sons lors du démontage
    return () => {
      Object.values(soundObjectsRef.current).forEach(sound => {
        sound.unloadAsync().catch(console.warn);
      });
    };
  }, []);

  // Jouer un son
  const playSound = async (soundType: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const sound = soundObjectsRef.current[soundType];
      if (sound) {
        // Arrêter le son s'il est déjà en cours
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      }
    } catch (error) {
      console.warn(`Erreur lors de la lecture du son ${soundType}:`, error);
    }
  };

  // Activer/Désactiver les sons
  const toggleSound = () => {
    enabledRef.current = !enabledRef.current;
    return enabledRef.current;
  };

  const setSoundEnabled = (enabled: boolean) => {
    enabledRef.current = enabled;
  };

  const isSoundEnabled = () => enabledRef.current;

  return {
    playSound,
    toggleSound,
    setSoundEnabled,
    isSoundEnabled,
  };
};

export default useSound; 