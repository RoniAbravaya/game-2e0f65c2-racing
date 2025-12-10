import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuScreen from './screens/MenuScreen';
import GameScreen from './screens/GameScreen';
import ShopScreen from './screens/ShopScreen';

type Screen = 'menu' | 'game' | 'shop';

interface GameState {
  coins: number;
  highScores: { [levelId: number]: number };
  unlockedLevels: number[];
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>({
    coins: 0,
    highScores: {},
    unlockedLevels: [1]
  });

  // Load game state from storage
  useEffect(() => {
    loadGameState();
  }, []);

  const loadGameState = async () => {
    try {
      const saved = await AsyncStorage.getItem('spaceRacingGameState');
      if (saved) {
        setGameState(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading game state:', error);
    }
  };

  const saveGameState = async (newState: GameState) => {
    try {
      await AsyncStorage.setItem('spaceRacingGameState', JSON.stringify(newState));
      setGameState(newState);
    } catch (error) {
      console.log('Error saving game state:', error);
    }
  };

  const handleStartGame = (level: number) => {
    setCurrentLevelId(level);
    setCurrentScreen('game');
  };

  const handleOpenShop = () => {
    setCurrentScreen('shop');
  };

  const handleLevelComplete = () => {
    // Award coins and unlock next level
    const coinsEarned = currentLevelId * 10;
    const nextLevel = currentLevelId + 1;
    
    const newState = {
      ...gameState,
      coins: gameState.coins + coinsEarned,
      unlockedLevels: gameState.unlockedLevels.includes(nextLevel) 
        ? gameState.unlockedLevels 
        : [...gameState.unlockedLevels, nextLevel]
    };
    
    saveGameState(newState);
    setCurrentScreen('menu');
  };

  const handleGameOver = () => {
    setCurrentScreen('menu');
  };

  const handleExit = () => {
    setCurrentScreen('menu');
  };

  const handleCloseShop = () => {
    setCurrentScreen('menu');
  };

  return (
    <>
      <StatusBar style="light" />
      {currentScreen === 'menu' && (
        <MenuScreen
          onStartGame={handleStartGame}
          onOpenShop={handleOpenShop}
        />
      )}
      {currentScreen === 'game' && (
        <GameScreen
          levelId={currentLevelId}
          onLevelComplete={handleLevelComplete}
          onGameOver={handleGameOver}
          onExit={handleExit}
        />
      )}
      {currentScreen === 'shop' && (
        <ShopScreen
          onClose={handleCloseShop}
        />
      )}
    </>
  );
}