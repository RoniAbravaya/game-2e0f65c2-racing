import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { LEVELS } from '../config/levels';

const { width, height } = Dimensions.get('window');

interface MenuScreenProps {
  onStartGame: (level: number) => void;
  onOpenShop: () => void;
}

export default function MenuScreen({ onStartGame, onOpenShop }: MenuScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>SPACE RACER</Text>
          <Text style={styles.subtitle}>Navigate through the cosmos</Text>
        </View>

        {/* Level Selection */}
        <View style={styles.levelsContainer}>
          <Text style={styles.sectionTitle}>Select Level</Text>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.levelButton,
                { backgroundColor: getLevelColor(level.difficulty) }
              ]}
              onPress={() => onStartGame(level.id)}
            >
              <Text style={styles.levelButtonText}>
                Level {level.id}: {level.name}
              </Text>
              <Text style={styles.levelDifficulty}>
                {level.difficulty.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shop Button */}
        <TouchableOpacity
          style={styles.shopButton}
          onPress={onOpenShop}
        >
          <Text style={styles.shopButtonText}>🛒 SHOP</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Controls:</Text>
          <Text style={styles.instructionText}>• Tap left/right sides to turn</Text>
          <Text style={styles.instructionText}>• Hold both sides to boost</Text>
          <Text style={styles.instructionText}>• Release all to brake</Text>
          <Text style={styles.instructionText}>• Avoid asteroids, collect coins!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getLevelColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#4CAF50';
    case 'medium': return '#FF9800';
    case 'hard': return '#F44336';
    default: return '#2196F3';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: '#0099FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 8,
  },
  levelsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  levelButton: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  levelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelDifficulty: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  shopButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 30,
  },
  shopButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 5,
  },
});