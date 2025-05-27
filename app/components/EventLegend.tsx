import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EventLegend: React.FC = () => {
  const events = [
    { type: 'quiz', symbol: '?', color: '#4A90E2', label: 'Quiz' },
    { type: 'financement', symbol: '$', color: '#50C878', label: 'Financement' },
    { type: 'duel', symbol: '⚔', color: '#FF6B6B', label: 'Duel' },
    { type: 'evenement', symbol: '★', color: '#FFB347', label: 'Événement' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Événements</Text>
      {events.map((event) => (
        <View key={event.type} style={styles.legendItem}>
          <View style={[styles.symbolContainer, { backgroundColor: event.color }]}>
            <Text style={styles.symbol}>{event.symbol}</Text>
          </View>
          <Text style={styles.label}>{event.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    zIndex: 1000,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  symbolContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  symbol: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: '#333',
  },
});

export default EventLegend; 