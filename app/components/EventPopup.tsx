import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EventPopupProps {
  visible: boolean;
  eventType: 'quiz' | 'financement' | 'duel' | 'evenement' | null;
  onClose: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ visible, eventType, onClose }) => {
  if (!eventType) return null;

  const getEventConfig = (type: string) => {
    switch (type) {
      case 'quiz':
        return {
          title: '📚 Quiz',
          description: 'Répondez correctement à la question pour continuer !',
          content: 'Question : Quelle est la capitale de la France ?',
          options: ['A) Lyon', 'B) Paris', 'C) Marseille', 'D) Toulouse'],
          color: '#4A90E2'
        };
      case 'financement':
        return {
          title: '💰 Financement',
          description: 'Vous avez obtenu un financement !',
          content: 'Félicitations ! Vous recevez 1000€ pour développer votre startup.',
          options: null,
          color: '#50C878'
        };
      case 'duel':
        return {
          title: '⚔️ Duel',
          description: 'Affrontez un autre joueur !',
          content: 'Choisissez votre stratégie pour ce duel entrepreneurial.',
          options: ['Négociation', 'Innovation', 'Marketing', 'Finance'],
          color: '#FF6B6B'
        };
      case 'evenement':
        return {
          title: '⭐ Événement',
          description: 'Un événement spécial se produit !',
          content: 'Vous participez à un salon de l\'entrepreneuriat. Nouvelle opportunité !',
          options: null,
          color: '#FFB347'
        };
      default:
        return {
          title: 'Événement',
          description: '',
          content: '',
          options: null,
          color: '#ccc'
        };
    }
  };

  const config = getEventConfig(eventType);

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
            <Text style={styles.eventContent}>{config.content}</Text>
            
            {config.options && (
              <View style={styles.optionsContainer}>
                {config.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.optionButton, { borderColor: config.color }]}
                    onPress={onClose}
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
              {eventType === 'quiz' ? 'Répondre' : 'Continuer'}
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