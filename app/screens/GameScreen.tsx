import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  AppState,
  Alert
} from 'react-native';
import { getLevelById } from '../config/levels';

const { width, height } = Dimensions.get('window');

interface GameScreenProps {
  levelId: number;
  onLevelComplete: () => void;
  onGameOver: () => void;
  onExit: () => void;
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'asteroid' | 'coin';
}

interface PlayerShip {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  rotation: number;
}

export default function GameScreen({ levelId, onLevelComplete, onGameOver, onExit }: GameScreenProps) {
  const level = getLevelById(levelId);
  
  // Game state
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [player, setPlayer] = useState<PlayerShip>({
    x: width / 2 - 25,
    y: height - 150,
    width: 50,
    height: 60,
    speed: 0,
    rotation: 0
  });
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameRunning, setGameRunning] = useState(true);
  
  // Controls
  const [leftPressed, setLeftPressed] = useState(false);
  const [rightPressed, setRightPressed] = useState(false);
  const [boosting, setBoosting] = useState(false);
  
  // Refs for game loop
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const spawnTimerRef = useRef<NodeJS.Timeout>();
  const objectIdCounter = useRef(0);
  
  // Game settings based on level
  const gameSettings = {
    baseSpeed: level.difficulty === 'easy' ? 3 : level.difficulty === 'medium' ? 4 : 5,
    spawnRate: level.difficulty === 'easy' ? 2000 : level.difficulty === 'medium' ? 1500 : 1000,
    asteroidChance: level.difficulty === 'easy' ? 0.7 : level.difficulty === 'medium' ? 0.8 : 0.9,
    targetDistance: level.targetScore * 10
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsPaused(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Initialize game
  useEffect(() => {
    if (gameRunning && !isPaused) {
      startGameLoop();
      startSpawning();
    } else {
      stopGameLoop();
      stopSpawning();
    }

    return () => {
      stopGameLoop();
      stopSpawning();
    };
  }, [gameRunning, isPaused]);

  // Check win condition
  useEffect(() => {
    if (distance >= gameSettings.targetDistance && gameRunning) {
      setGameRunning(false);
      setTimeout(() => {
        Alert.alert('Level Complete!', `Distance: ${distance}m\nCoins: ${coins}\nScore: ${score}`, [
          { text: 'Continue', onPress: onLevelComplete }
        ]);
      }, 100);
    }
  }, [distance, gameSettings.targetDistance, gameRunning]);

  // Check game over condition
  useEffect(() => {
    if (lives <= 0 && gameRunning) {
      setGameRunning(false);
      setTimeout(() => {
        Alert.alert('Game Over!', `Final Score: ${score}\nDistance: ${distance}m`, [
          { text: 'Try Again', onPress: onGameOver }
        ]);
      }, 100);
    }
  }, [lives, gameRunning]);

  const startGameLoop = () => {
    gameLoopRef.current = setInterval(() => {
      updateGame();
    }, 16); // ~60 FPS
  };

  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  };

  const startSpawning = () => {
    spawnTimerRef.current = setInterval(() => {
      spawnObject();
    }, gameSettings.spawnRate);
  };

  const stopSpawning = () => {
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
    }
  };

  const spawnObject = () => {
    const isAsteroid = Math.random() < gameSettings.asteroidChance;
    const newObject: GameObject = {
      id: `obj_${objectIdCounter.current++}`,
      x: Math.random() * (width - 40),
      y: -50,
      width: isAsteroid ? 60 : 30,
      height: isAsteroid ? 60 : 30,
      type: isAsteroid ? 'asteroid' : 'coin'
    };

    setGameObjects(prev => [...prev, newObject]);
  };

  const updateGame = () => {
    // Update player movement
    setPlayer(prev => {
      let newX = prev.x;
      let newSpeed = prev.speed;
      let newRotation = prev.rotation;

      // Handle controls
      if (leftPressed && rightPressed) {
        // Boost mode
        setBoosting(true);
        newSpeed = Math.min(newSpeed + 0.3, 8);
      } else if (leftPressed) {
        newX = Math.max(0, prev.x - 5);
        newRotation = -15;
        setBoosting(false);
      } else if (rightPressed) {
        newX = Math.min(width - prev.width, prev.x + 5);
        newRotation = 15;
        setBoosting(false);
      } else {
        // Brake
        newSpeed = Math.max(newSpeed - 0.2, gameSettings.baseSpeed);
        newRotation = 0;
        setBoosting(false);
      }

      return {
        ...prev,
        x: newX,
        speed: newSpeed,
        rotation: newRotation
      };
    });

    // Update game objects
    setGameObjects(prev => {
      const updated = prev.map(obj => ({
        ...obj,
        y: obj.y + gameSettings.baseSpeed + player.speed
      })).filter(obj => obj.y < height + 50);

      return updated;
    });

    // Update distance and score
    setDistance(prev => prev + 1);
    setScore(prev => prev + 1);

    // Check collisions
    checkCollisions();
  };

  const checkCollisions = () => {
    setGameObjects(prevObjects => {
      const remaining: GameObject[] = [];
      let coinsCollected = 0;
      let hitAsteroid = false;

      prevObjects.forEach(obj => {
        const collision = checkCollision(player, obj);
        
        if (collision) {
          if (obj.type === 'coin') {
            coinsCollected++;
            setScore(prev => prev + 50);
          } else if (obj.type === 'asteroid') {
            hitAsteroid = true;
          }
        } else {
          remaining.push(obj);
        }
      });

      if (coinsCollected > 0) {
        setCoins(prev => prev + coinsCollected);
      }

      if (hitAsteroid) {
        setLives(prev => prev - 1);
      }

      return remaining;
    });
  };

  const checkCollision = (player: PlayerShip, obj: GameObject): boolean => {
    return (
      player.x < obj.x + obj.width &&
      player.x + player.width > obj.x &&
      player.y < obj.y + obj.height &&
      player.y + player.height > obj.y
    );
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Touch controls
  const leftPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setLeftPressed(true),
    onPanResponderRelease: () => setLeftPressed(false),
    onPanResponderTerminate: () => setLeftPressed(false),
  });

  const rightPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setRightPressed(true),
    onPanResponderRelease: () => setRightPressed(false),
    onPanResponderTerminate: () => setRightPressed(false),
  });

  if (isPaused) {
    return (
      <View style={styles.pauseContainer}>
        <Text style={styles.pauseTitle}>PAUSED</Text>
        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.pauseButtonText}>Resume</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pauseButton} onPress={onExit}>
          <Text style={styles.pauseButtonText}>Exit to Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Game Area */}
      <View style={styles.gameArea}>
        {/* Stars background effect */}
        <View style={styles.starsContainer}>
          {Array.from({ length: 20 }, (_, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  opacity: Math.random() * 0.8 + 0.2
                }
              ]}
            />
          ))}
        </View>

        {/* Player Ship */}
        <View
          style={[
            styles.player,
            {
              left: player.x,
              top: player.y,
              transform: [{ rotate: `${player.rotation}deg` }],
              backgroundColor: boosting ? '#00FF00' : '#0099FF'
            }
          ]}
        >
          <View style={styles.playerCore} />
          {boosting && <View style={styles.boostEffect} />}
        </View>

        {/* Game Objects */}
        {gameObjects.map(obj => (
          <View
            key={obj.id}
            style={[
              obj.type === 'asteroid' ? styles.asteroid : styles.coin,
              {
                left: obj.x,
                top: obj.y,
                width: obj.width,
                height: obj.height
              }
            ]}
          />
        ))}
      </View>

      {/* HUD */}
      <View style={styles.hud}>
        <View style={styles.hudTop}>
          <Text style={styles.hudText}>Level {levelId}: {level.name}</Text>
          <TouchableOpacity onPress={togglePause}>
            <Text style={styles.pauseIcon}>⏸️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.hudStats}>
          <Text style={styles.hudText}>Lives: {lives}</Text>
          <Text style={styles.hudText}>Score: {score}</Text>
          <Text style={styles.hudText}>Coins: {coins}</Text>
          <Text style={styles.hudText}>Distance: {distance}m / {gameSettings.targetDistance}m</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <View
          style={[styles.controlButton, styles.leftControl, leftPressed && styles.controlPressed]}
          {...leftPanResponder.panHandlers}
        >
          <Text style={styles.controlText}>◀</Text>
        </View>
        <View
          style={[styles.controlButton, styles.rightControl, rightPressed && styles.controlPressed]}
          {...rightPanResponder.panHandlers}
        >
          <Text style={styles.controlText}>▶</Text>
        </View>
      </View>

      {/* Boost indicator */}
      {boosting && (
        <View style={styles.boostIndicator}>
          <Text style={styles.boostText}>BOOST!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000011',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  player: {
    position: 'absolute',
    width: 50,
    height: 60,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCore: {
    width: 30,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  boostEffect: {
    position: 'absolute',
    bottom: -20,
    width: 20,
    height: 30,
    backgroundColor: '#FF4444',
    borderRadius: 10,
  },
  asteroid: {
    position: 'absolute',
    backgroundColor: '#8B4513',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#A0522D',
  },
  coin: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFA500',
  },
  hud: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  hudTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hudStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  hudText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pauseIcon: {
    fontSize: 24,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 120,
  },
  controlButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 10,
    borderRadius: 10,
  },
  leftControl: {
    marginRight: 5,
  },
  rightControl: {
    marginLeft: 5,
  },
  controlPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  boostIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  boostText: {
    color: '#00FF00',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  pauseContainer: {
    flex: 1,
    backgroundColor: '#000011',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  pauseButton: {
    backgroundColor: '#0099FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 20,
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});