import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EventConfig {
  title: string;
  description: string;
  content?: string;
  options?: string[] | null;
  correctAnswer?: number;
  category?: string;
  color: string;
  icon?: string;
}

interface EventPopupProps {
  visible: boolean;
  eventType: 'quiz' | 'financement' | 'duel' | 'opportunite' | 'challenge' | null;
  tokenChange: number;
  eventData: any; // Les vraies données de l'événement depuis le JSON
  pendingQuizTokens: number; // Jetons en attente pour les quiz
  onClose: () => void;
  onQuizAnswer?: (selectedIndex: number) => void; // Fonction pour les réponses de quiz
}

const EventPopup: React.FC<EventPopupProps> = ({ 
  visible, 
  eventType, 
  tokenChange, 
  eventData, 
  pendingQuizTokens,
  onClose, 
  onQuizAnswer 
}) => {
  if (!eventType) return null;

  const getEventConfig = (type: string, data: any): EventConfig => {
    const baseConfig = {
      quiz: {
        title: '📚 Quiz',
        color: '#4A90E2',
        icon: '🧠'
      },
      financement: {
        title: '💰 Financement',
        color: '#50C878',
        icon: '💰'
      },
      duel: {
        title: '⚔️ Duel',
        color: '#FF6B6B',
        icon: '⚔️'
      },
      opportunite: {
        title: '🚀 Opportunité',
        color: '#FFB347',
        icon: '🚀'
      },
      challenge: {
        title: '⚡ Challenge',
        color: '#9B59B6',
        icon: '⚡'
      }
    }[type];

    if (!baseConfig) {
      return {
        title: 'Événement',
        description: '',
        content: '',
        options: null,
        color: '#ccc'
      };
    }

    // Utiliser les vraies données si disponibles
    if (data) {
      return {
        ...baseConfig,
        title: baseConfig.title,
        description: data.title || data.question || 'Événement du secteur Santé & Bien-être',
        content: data.description || data.content || '',
        options: type === 'quiz' ? (data.options || null) : null, // Options seulement pour les quiz
        correctAnswer: data.correctAnswer,
        category: data.category
      };
    }

    // Fallback si pas de données
    return {
      ...baseConfig,
      description: `Événement ${type} - Aucune donnée disponible`,
      content: '',
      options: null
    };
  };

  const config = getEventConfig(eventType, eventData);

  const getTokenMessage = () => {
    if (eventType === 'quiz' && pendingQuizTokens > 0) {
      return `🎯 Répondez correctement pour gagner ${pendingQuizTokens} jeton${pendingQuizTokens > 1 ? 's' : ''} !`;
    }
    
    if (tokenChange > 0) {
      return `🪙 Vous gagnez ${tokenChange} jeton${tokenChange > 1 ? 's' : ''} !`;
    } else if (tokenChange < 0) {
      return `💸 Vous perdez ${Math.abs(tokenChange)} jeton${Math.abs(tokenChange) > 1 ? 's' : ''} !`;
    } else {
      return `😐 Aucun jeton gagné ou perdu cette fois.`;
    }
  };

  const getTokenContainerStyle = () => {
    if (eventType === 'quiz' && pendingQuizTokens > 0) {
      return { backgroundColor: '#87CEEB' }; // Bleu clair pour quiz en attente
    }
    
    if (tokenChange > 0) {
      return { backgroundColor: '#90EE90' }; // Vert clair pour gain
    } else if (tokenChange < 0) {
      return { backgroundColor: '#FFB6C1' }; // Rouge clair pour perte
    } else {
      return { backgroundColor: '#D3D3D3' }; // Gris pour neutre
    }
  };

  const handleQuizOptionPress = (index: number) => {
    if (eventType === 'quiz' && onQuizAnswer) {
      onQuizAnswer(index);
      // Fermer le popup après avoir répondu
      setTimeout(() => {
        onClose();
      }, 1500); // Laisser le temps de voir le résultat
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.popup, { borderColor: config.color }]}>
          <View style={[styles.header, { backgroundColor: config.color }]}>
            <Text style={styles.title}>{config.title}</Text>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.description}>{config.description}</Text>
            
            {config.content && (
              <Text style={styles.eventContent}>{config.content}</Text>
            )}
            
            {config.category && (
              <Text style={styles.category}>Catégorie: {config.category}</Text>
            )}
            
            <View style={[styles.tokensContainer, getTokenContainerStyle()]}>
              <Text style={styles.tokensText}>
                {getTokenMessage()}
              </Text>
            </View>
            
            {config.options && (
              <View style={styles.optionsContainer}>
                {config.options.map((option: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton, 
                      { borderColor: config.color },
                      config.correctAnswer === index ? { backgroundColor: `${config.color}20` } : {}
                    ]}
                    onPress={eventType === 'quiz' ? () => handleQuizOptionPress(index) : undefined}
                    disabled={eventType !== 'quiz'}
                  >
                    <Text style={[styles.optionText, { color: config.color }]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: config.color }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>
              {eventType === 'quiz' ? 'Continuer' : 'Continuer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 3,
    minWidth: 300,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  header: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  eventContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
    color: '#666',
  },
  tokensContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  tokensText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    margin: 15,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventPopup; 