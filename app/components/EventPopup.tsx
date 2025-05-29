import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Import du type PlayerColor
type PlayerColor = 'yellow' | 'blue' | 'red' | 'green';

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
  // Props pour les duels
  duelPlayers?: [PlayerColor, PlayerColor] | null; // Les deux joueurs du duel en cours
  duelVoters?: [PlayerColor, PlayerColor] | null; // Les deux joueurs qui votent pour le duel
  duelVotes?: { [key in PlayerColor]?: 'accept' | 'refuse' | null }; // Votes des joueurs
  onDuelVote?: (player: PlayerColor, vote: 'accept' | 'refuse') => void; // Fonction pour voter
  quizAnswerSelected?: boolean; // Pour savoir si le joueur a choisi une réponse au quiz
}

const EventPopup: React.FC<EventPopupProps> = ({ 
  visible, 
  eventType, 
  tokenChange, 
  eventData, 
  pendingQuizTokens,
  onClose, 
  onQuizAnswer,
  duelPlayers,
  duelVoters,
  duelVotes,
  onDuelVote,
  quizAnswerSelected
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
          {/* Vote du premier juge - EN HAUT */}
          {eventType === 'duel' && duelVoters && duelVotes && (
            <View style={styles.topVoteSection}>
              <View style={styles.judgeVoteContainer}>
                <Text style={styles.judgeName}>
                  {duelVoters[0].toUpperCase()} (Juge)
                </Text>
                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.acceptButton,
                      duelVotes[duelVoters[0]] === 'accept' ? styles.selectedVote : {}
                    ]}
                    onPress={() => onDuelVote && onDuelVote(duelVoters[0], 'accept')}
                    disabled={duelVotes[duelVoters[0]] !== undefined}
                  >
                    <Text style={styles.voteButtonText}>✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.refuseButton,
                      duelVotes[duelVoters[0]] === 'refuse' ? styles.selectedVote : {}
                    ]}
                    onPress={() => onDuelVote && onDuelVote(duelVoters[0], 'refuse')}
                    disabled={duelVotes[duelVoters[0]] !== undefined}
                  >
                    <Text style={styles.voteButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.header, { backgroundColor: config.color }]}>
            <Text style={styles.title}>{config.title}</Text>
          </View>
          
          <View style={styles.content}>
            {/* Informations du duel */}
            {eventType === 'duel' && duelPlayers && (
              <Text style={styles.duelInfo}>
                Duel entre {duelPlayers[0].toUpperCase()} et {duelPlayers[1].toUpperCase()}
              </Text>
            )}

            <Text style={styles.description}>{config.description}</Text>
            
            {config.content && (
              <Text style={styles.eventContent}>{config.content}</Text>
            )}
            
            {config.category && (
              <Text style={styles.category}>Catégorie: {config.category}</Text>
            )}
            
            {/* Résultat du duel */}
            {eventType === 'duel' && duelVotes && Object.keys(duelVotes).length === 2 && (
              <View style={styles.duelResultContainer}>
                <Text style={styles.duelResult}>
                  {(() => {
                    const votes = Object.values(duelVotes);
                    const acceptCount = votes.filter(v => v === 'accept').length;
                    if (acceptCount === 2) {
                      return '🎉 Duel réussi ! Les duellistes gagnent des jetons !';
                    } else if (acceptCount === 0) {
                      return '💸 Duel échoué ! Les duellistes perdent des jetons !';
                    } else {
                      return '😐 Résultat mitigé ! Les duellistes ne reçoivent rien.';
                    }
                  })()}
                </Text>
              </View>
            )}

            {/* Affichage normal des jetons pour les autres événements */}
            {eventType !== 'duel' && (
              <View style={[styles.tokensContainer, getTokenContainerStyle()]}>
                <Text style={styles.tokensText}>
                  {getTokenMessage()}
                </Text>
              </View>
            )}
            
            {config.options && (
              <View style={styles.optionsContainer}>
                {config.options.map((option: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton, 
                      { borderColor: config.color }
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
          
          {/* Vote du deuxième juge - EN BAS */}
          {eventType === 'duel' && duelVoters && duelVotes && (
            <View style={styles.bottomVoteSection}>
              <View style={styles.judgeVoteContainer}>
                <Text style={styles.judgeName}>
                  {duelVoters[1].toUpperCase()} (Juge)
                </Text>
                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.acceptButton,
                      duelVotes[duelVoters[1]] === 'accept' ? styles.selectedVote : {}
                    ]}
                    onPress={() => onDuelVote && onDuelVote(duelVoters[1], 'accept')}
                    disabled={duelVotes[duelVoters[1]] !== undefined}
                  >
                    <Text style={styles.voteButtonText}>✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.voteButton,
                      styles.refuseButton,
                      duelVotes[duelVoters[1]] === 'refuse' ? styles.selectedVote : {}
                    ]}
                    onPress={() => onDuelVote && onDuelVote(duelVoters[1], 'refuse')}
                    disabled={duelVotes[duelVoters[1]] !== undefined}
                  >
                    <Text style={styles.voteButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Bouton de fermeture seulement si ce n'est pas un duel en cours */}
          {!(eventType === 'duel' && duelVotes && Object.keys(duelVotes).length < 2) && (
            <TouchableOpacity 
              style={[
                styles.closeButton, 
                { backgroundColor: config.color },
                // Désactiver le bouton pour les quiz sans réponse sélectionnée
                (eventType === 'quiz' && !quizAnswerSelected) ? styles.disabledButton : {}
              ]}
              onPress={onClose}
              disabled={eventType === 'quiz' && !quizAnswerSelected}
            >
              <Text style={[
                styles.closeButtonText,
                (eventType === 'quiz' && !quizAnswerSelected) ? styles.disabledButtonText : {}
              ]}>
                {eventType === 'quiz' ? 
                  (!quizAnswerSelected ? 'Choisissez une réponse' : 'Continuer') : 
                  'Continuer'
                }
              </Text>
            </TouchableOpacity>
          )}
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
  topVoteSection: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f8ff',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  bottomVoteSection: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#fff8f0',
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  judgeVoteContainer: {
    padding: 15,
    alignItems: 'center',
  },
  judgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  duelInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  voteButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#90EE90',
    borderColor: '#32CD32',
  },
  refuseButton: {
    backgroundColor: '#FFB6C1',
    borderColor: '#FF69B4',
  },
  selectedVote: {
    borderColor: '#000',
    borderWidth: 3,
  },
  voteButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  duelResultContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#E6F3FF',
    borderRadius: 8,
  },
  duelResult: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default EventPopup; 