import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

interface GameHeaderProps {
  onMenuPress: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ onMenuPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onMenuPress}>
        <Image 
          source={require('../../assets/images/burger.png')} 
          style={styles.menuIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <Image 
        source={require('../../assets/images/aide.png')} 
        style={styles.helpIcon}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    zIndex: 100,
  },
  menuIcon: {
    width: 40,
    height: 40,
  },
  helpIcon: {
    width: 40,
    height: 40,
  },
});

export default GameHeader; 