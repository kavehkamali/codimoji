import { CONFIG } from './config.js';

let canvas = null;
let ctx = null;
let playerPos = { x: 0, y: 0 };
let targetPos = { x: 0, y: 0 };
let gameMap = [];
let animationFrameId = null;
let isAnimating = false;
let animationStart = null;
let animationProgress = 0;
let images = {};

export function initializeGame() {
  if (typeof window !== 'undefined') {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    if (ctx) window.ctx = ctx;
    
    images = {};
    const imageLoadPromises = Object.entries(CONFIG.IMAGE_PATHS).map(([key, path]) => {
      return new Promise((resolve, reject) => {
        images[key] = new Image();
        images[key].onload = resolve;
        images[key].onerror = () => reject(new Error(`Failed to load ${path}`));
        images[key].src = path;
      });
    });
    
    return Promise.all(imageLoadPromises).catch((error) => {
      console.error('Image loading failed:', error);
      // Set up fallback - just resolve without images
      images = {};
      return Promise.resolve();
    });
  }
  return Promise.resolve();
}

export function generateMap() {
  gameMap = Array(CONFIG.GRID_SIZE).fill().map(() => Array(CONFIG.GRID_SIZE).fill(0));
  let goalX, goalY;
  do {
    goalX = Math.floor(Math.random() * CONFIG.GRID_SIZE);
    goalY = Math.floor(Math.random() * CONFIG.GRID_SIZE);
  } while (goalX === 0 && goalY === 0);
  gameMap[goalY][goalX] = 3;

  for (let i = 0; i < CONFIG.MIN_WALLS; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * CONFIG.GRID_SIZE);
      y = Math.floor(Math.random() * CONFIG.GRID_SIZE);
    } while (gameMap[y][x] !== 0);
    gameMap[y][x] = 1;
  }

  for (let i = 0; i < CONFIG.MIN_WATER; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * CONFIG.GRID_SIZE);
      y = Math.floor(Math.random() * CONFIG.GRID_SIZE);
    } while (gameMap[y][x] !== 0);
    gameMap[y][x] = 2;
  }

  window.gameMap = gameMap; // Ensure global access
  return gameMap;
}

export function calculateScale() {
  if (typeof window !== 'undefined') {
    // Try to find the game panel - check both old and new layouts
    let gamePanel = document.getElementById('rightPanel') || 
                   document.querySelector('.game-panel .panel-content') ||
                   document.querySelector('.panel-content');
    
    if (gamePanel) {
      const panelRect = gamePanel.getBoundingClientRect();
      const scaleWidth = panelRect.width / CONFIG.GRID_SIZE;
      const scaleHeight = panelRect.height / CONFIG.GRID_SIZE;
      const newScale = Math.min(scaleWidth, scaleHeight, 50); // Cap at 50px per tile
      
      // Normalize player position if scale changes significantly
      if (!calculateScale.cache || Math.abs(newScale - calculateScale.cache) > 0.1) {
        const oldScale = calculateScale.cache || 1;
        playerPos = { 
          x: Math.round(playerPos.x * oldScale / newScale), 
          y: Math.round(playerPos.y * oldScale / newScale) 
        };
        targetPos = { ...playerPos };
        calculateScale.cache = newScale;
      }
      return Math.max(newScale, 10); // Minimum scale
    }
  }
  return 20; // Default fallback
}
calculateScale.cache = null;

export function drawBoard(scale) {
  if (!ctx || !canvas) {
    console.warn('drawBoard skipped: ctx or canvas not initialized');
    return;
  }
  
  if (!gameMap || gameMap.length === 0) {
    console.warn('drawBoard skipped: gameMap not initialized');
    return;
  }

  const tileSize = scale || calculateScale();
  const boardSize = CONFIG.GRID_SIZE * tileSize;
  
  // Ensure canvas is properly sized
  if (canvas.width !== boardSize || canvas.height !== boardSize) {
    canvas.width = boardSize;
    canvas.height = boardSize;
    canvas.style.width = `${boardSize}px`;
    canvas.style.height = `${boardSize}px`;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw with images if available, otherwise use colors
  const hasImages = Object.keys(images).length > 0 && 
                   images.grass && images.grass.complete;

  if (hasImages) {
    // First pass: Draw grass background everywhere
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        if (images.grass) {
          ctx.drawImage(images.grass, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Second pass: Draw overlays
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        const tile = gameMap[y]?.[x] || 0;
        let overlayImage = null;
        
        switch (tile) {
          case 1: // Wall
            overlayImage = images.wall;
            break;
          case 2: // Water
            overlayImage = images.water;
            break;
          case 3: // Goal
            overlayImage = images.goal;
            break;
        }
        
        if (overlayImage && overlayImage.complete) {
          ctx.drawImage(overlayImage, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Draw player at current position (no animation in static redraw)
    const currentPlayerPos = window.playerPos || playerPos;
    
    if (images.character && images.character.complete) {
      ctx.drawImage(images.character, 
        currentPlayerPos.x * tileSize + 2, 
        currentPlayerPos.y * tileSize + 2, 
        tileSize - 4, 
        tileSize - 4
      );
    } else {
      // Fallback player
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(
        currentPlayerPos.x * tileSize + 2, 
        currentPlayerPos.y * tileSize + 2, 
        tileSize - 4, 
        tileSize - 4
      );
    }
  } else {
    // Fallback to colored rectangles
    drawBoardFallback();
  }
}

export function drawBoardFallback() {
  if (!ctx || !canvas || !gameMap) {
    console.warn('drawBoardFallback skipped: missing ctx, canvas, or gameMap');
    return;
  }
  
  const tileSize = Math.min(canvas.width, canvas.height) / CONFIG.GRID_SIZE;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw tiles with colors
  const colors = {
    0: '#10b981', // Grass - green
    1: '#6b7280', // Wall - gray
    2: '#3b82f6', // Water - blue
    3: '#f59e0b', // Goal - yellow
  };
  
  for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
      const tile = gameMap[y]?.[x] || 0;
      ctx.fillStyle = colors[tile] || colors[0];
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      
      // Add border for clarity
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
  
  // Draw player at current position
  const currentPlayerPos = window.playerPos || playerPos;
  
  ctx.fillStyle = '#ef4444'; // Red player
  ctx.fillRect(
    currentPlayerPos.x * tileSize + 2, 
    currentPlayerPos.y * tileSize + 2, 
    tileSize - 4, 
    tileSize - 4
  );
}

function lerp(start, end, t) {
  return start + t * (end - start);
}

export function animate(timestamp) {
  if (!ctx) return;
  if (!animationStart) animationStart = timestamp;
  animationProgress = Math.min((timestamp - animationStart) / CONFIG.ANIMATION_DURATION, 1);
  
  const scale = calculateScale();
  drawBoard(scale);
  
  if (animationProgress < 1 && isAnimating) {
    animationFrameId = requestAnimationFrame(animate);
  } else {
    playerPos = { ...targetPos };
    window.playerPos = playerPos; // Update global position
    isAnimating = false;
    animationStart = null;
    animationProgress = 0;
    drawBoard(scale);
  }
}

export function setPlayerPos(pos) {
  playerPos = { ...pos };
  targetPos = { ...pos }; // Keep target in sync for static positioning
  window.playerPos = playerPos; // Global access
}

export function setTargetPos(pos) {
  targetPos = { ...pos };
  window.targetPos = targetPos; // Global access
}

export function startAnimation() {
  isAnimating = true;
  animationFrameId = requestAnimationFrame(animate);
}

export function stopAnimation() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  isAnimating = false;
  animationStart = null;
  animationProgress = 0;
}

export function isOutOfBounds(pos) {
  return pos.x < 0 || pos.x >= CONFIG.GRID_SIZE || pos.y < 0 || pos.y >= CONFIG.GRID_SIZE;
}

export function isCollision(pos) {
  const tile = gameMap[pos.y]?.[pos.x];
  return tile === 1 || tile === 2;
}

export function isGoal(pos) {
  return gameMap[pos.y]?.[pos.x] === 3;
}

export function getGameMap() {
  return gameMap;
}

export function setGameMap(newMap) {
  gameMap = newMap;
  window.gameMap = newMap; // Global access
  if (ctx) {
    const scale = calculateScale();
    drawBoard(scale);
  }
}

// Enhanced redraw function for external use
export function redrawGame() {
  if (ctx && gameMap.length > 0) {
    const scale = calculateScale();
    drawBoard(scale);
  }
}