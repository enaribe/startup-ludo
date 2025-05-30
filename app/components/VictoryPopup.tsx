import React from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PlayerColor = 'yellow' | 'blue' | 'red' | 'green';

interface VictoryPopupProps {
  visible: boolean;
  winner: PlayerColor | null;
  finalRanking: string;
  isComputerGame: boolean;
  onClose: () => void;
}

const VictoryPopup: React.FC<VictoryPopupProps> = ({ 
  visible, 
  winner,
  finalRanking,
  isComputerGame,
  onClose 
}) => {
  const getWinnerDisplayName = () => {
    if (!winner) return 'Personne';
    
    if (isComputerGame) {
      return winner === 'yellow' ? 'Vous' : "L'ordinateur";
    }
    
    return winner.toUpperCase();
  };

  const getWinnerColor = () => {
    const colors = {
      yellow: '#FFD700',
      blue: '#4A90E2',
      red: '#FF6B6B',
      green: '#50C878'
    };
    return winner ? colors[winner] : '#FFD700';
  };

  const handleTambaliPress = () => {
    Linking.openURL('https://tambali.ai/');
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, { borderColor: getWinnerColor() }]}>
          {/* Header avec couronne */}
          <View style={[styles.header, { backgroundColor: getWinnerColor() }]}>
            <Text style={styles.crown}>👑</Text>
            <Text style={styles.title}>VICTOIRE !</Text>
            <Text style={styles.crown}>👑</Text>
          </View>
          
          <View style={styles.content}>
            {/* Vainqueur */}
            <View style={styles.winnerSection}>
              <Text style={styles.winnerLabel}>🎉 FÉLICITATIONS 🎉</Text>
              <Text style={[styles.winnerName, { color: getWinnerColor() }]}>
                {getWinnerDisplayName()}
              </Text>
              <Text style={styles.winnerTitle}>REMPORTE LA PARTIE !</Text>
            </View>

            {/* Classement final */}
            <View style={styles.rankingSection}>
              <Text style={styles.rankingTitle}>📊 Classement final :</Text>
              <Text style={styles.rankingText}>{finalRanking}</Text>
            </View>

            {/* Message motivationnel */}
            <View style={styles.motivationSection}>
              <Text style={styles.motivationText}>
                🚀 Prêt(e) à transformer cette expérience en succès réel ?
              </Text>
              <Text style={styles.motivationSubtext}>
                Découvrez comment créer votre vraie entreprise !
              </Text>
            </View>

            {/* Boutons d'action */}
            <View style={styles.buttonContainer}>
              {/* Bouton Tambali */}
              <TouchableOpacity 
                style={styles.tambaliButton} 
                onPress={handleTambaliPress}
              >
                <Text style={styles.tambaliButtonText}>
                  🌟 Créer mon entreprise avec Tambali.ai
                </Text>
              </TouchableOpacity>

              {/* Bouton Fermer */}
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    maxWidth: 400,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    gap: 10,
  },
  crown: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  winnerSection: {
    alignItems: 'center',
    gap: 8,
  },
  winnerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  winnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  rankingSection: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    gap: 8,
  },
  rankingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  rankingText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
  },
  motivationSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
  motivationSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  tambaliButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tambaliButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  closeButtonText: {
    color: '#6C757D',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VictoryPopup; 