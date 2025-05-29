import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface SoundToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ isEnabled, onToggle }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, isEnabled ? styles.enabled : styles.disabled]}
      onPress={onToggle}
    >
      <Text style={styles.text}>
        {isEnabled ? '🔊' : '🔇'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  enabled: {
    backgroundColor: '#4CAF50',
  },
  disabled: {
    backgroundColor: '#757575',
  },
  text: {
    fontSize: 24,
  },
});

export default SoundToggle; 