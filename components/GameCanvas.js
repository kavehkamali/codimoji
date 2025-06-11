import { useEffect, useRef, useState } from 'react';
import { generateMap, setPlayerPos, setTargetPos } from '../lib/game';

export default function GameCanvas() {
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [gameCanvas, setGameCanvas] = useState(null);
  const [currentMap, setCurrentMap] = useState(null);
  const [images, setImages] = useState({});
  const [usesFallback, setUsesFallback] = useState(false);
  const [playerPos, setPlayerPosition] = useState({ x: 0, y: 0 });

  // Mount detection
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load images
  const loadImages = async () => {
    const imageNames = ['grass', 'wall', 'water', 'goal', 'character'];
    const loadedImages = {};
    
    try {
      console.log('Loading images...');
      
      for (const name of imageNames) {
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            loadedImages[name] = img;
            console.log(`✓ ${name}.png loaded`);
            resolve();
          };
          img.onerror = () => {
            console.warn(`✗ Failed to load ${name}.png`);
            reject(new Error(`Failed to load ${name}.png`));
          };
          img.src = `/images/${name}.png`;
        });
      }

      setImages(loadedImages);
      console.log('All images loaded successfully');
      return loadedImages;
    } catch (error) {
      console.warn('Image loading failed, using fallback:', error);
      setUsesFallback(true);
      return null;
    }
  };

  // Drawing function with images and layered rendering
  const drawGameWithImages = (canvas, map, gameImages, currentPlayerPos) => {
    if (!canvas || !map) return;
    
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const tileSize = size / 15; // 15x15 grid
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // LAYER 1: Draw grass background on ALL tiles
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (gameImages.grass) {
          ctx.drawImage(gameImages.grass, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    
    // LAYER 2: Draw overlays (walls, water, goals) on top of grass
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const tile = map[y]?.[x] || 0;
        let overlayImage = null;
        
        switch (tile) {
          case 1: // Wall
            overlayImage = gameImages.wall;
            break;
          case 2: // Water
            overlayImage = gameImages.water;
            break;
          case 3: // Goal
            overlayImage = gameImages.goal;
            break;
          // case 0 is grass - already drawn in layer 1
        }
        
        if (overlayImage) {
          ctx.drawImage(overlayImage, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    
    // LAYER 3: Draw player character on top of everything
    const playerX = currentPlayerPos.x * tileSize;
    const playerY = currentPlayerPos.y * tileSize;
    
    if (gameImages.character) {
      ctx.drawImage(gameImages.character, playerX + 2, playerY + 2, tileSize - 4, tileSize - 4);
    } else {
      // Fallback player
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(playerX + 2, playerY + 2, tileSize - 4, tileSize - 4);
    }
  };

  // Fallback drawing function with colors
  const drawGameFallback = (canvas, map, currentPlayerPos) => {
    if (!canvas || !map) return;
    
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvas.width, canvas.height);
    const tileSize = size / 15;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Colors
    const colors = {
      0: '#10b981', // Grass - green
      1: '#6b7280', // Wall - gray
      2: '#3b82f6', // Water - blue
      3: '#f59e0b', // Goal - yellow
    };
    
    // Draw tiles
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        const tile = map[y]?.[x] || 0;
        ctx.fillStyle = colors[tile];
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        
        // Add border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
    
    // Draw player at current position
    const playerX = currentPlayerPos.x * tileSize;
    const playerY = currentPlayerPos.y * tileSize;
    
    ctx.fillStyle = '#ef4444'; // Red player
    ctx.fillRect(playerX + 2, playerY + 2, tileSize - 4, tileSize - 4);
  };

  const generateNewMap = () => {
    try {
      console.log('Generating new map...');
      const newMap = generateMap();
      setCurrentMap(newMap);
      window.gameMap = newMap;
      setPlayerPos({ x: 0, y: 0 });
      setPlayerPosition({ x: 0, y: 0 });
      setTargetPos({ x: 0, y: 0 });
      
      if (gameCanvas) {
        if (usesFallback || Object.keys(images).length === 0) {
          drawGameFallback(gameCanvas, newMap, { x: 0, y: 0 });
        } else {
          drawGameWithImages(gameCanvas, newMap, images, { x: 0, y: 0 });
        }
      }
      console.log('New map generated successfully');
    } catch (err) {
      console.error('Failed to generate map:', err);
    }
  };

  // Set up redraw function on window
  useEffect(() => {
    if (gameCanvas && currentMap) {
      window.redrawGame = () => {
        const currentPlayerPos = window.playerPos || { x: 0, y: 0 };
        setPlayerPosition(currentPlayerPos);
        
        if (usesFallback || Object.keys(images).length === 0) {
          drawGameFallback(gameCanvas, currentMap, currentPlayerPos);
        } else {
          drawGameWithImages(gameCanvas, currentMap, images, currentPlayerPos);
        }
      };
    }
  }, [gameCanvas, currentMap, images, usesFallback]);

  // Create and set up canvas
  useEffect(() => {
    if (!mounted) return;

    const initGame = async () => {
      try {
        console.log('Setting up canvas and loading images...');
        
        const container = containerRef.current;
        if (!container) {
          console.error('Container not found');
          setIsLoading(false);
          return;
        }

        // Load images first
        const gameImages = await loadImages();

        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.id = 'gameCanvas';
        canvas.style.border = '2px solid #333333';
        canvas.style.borderRadius = '6px';
        canvas.style.background = '#0f0f0f';
        canvas.style.display = 'block';

        // Size the canvas
        const rect = container.getBoundingClientRect();
        const size = Math.min(rect.width - 24, rect.height - 80, 400);
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        console.log(`Canvas created and sized to: ${size}x${size}`);

        // Set up global context
        const ctx = canvas.getContext('2d');
        window.ctx = ctx;

        // Generate initial map
        const initialMap = generateMap();
        setCurrentMap(initialMap);
        window.gameMap = initialMap;
        const initialPlayerPos = { x: 0, y: 0 };
        setPlayerPos(initialPlayerPos);
        setPlayerPosition(initialPlayerPos);
        setTargetPos({ x: 0, y: 0 });

        // Draw initial game
        if (gameImages && !usesFallback) {
          drawGameWithImages(canvas, initialMap, gameImages, initialPlayerPos);
        } else {
          drawGameFallback(canvas, initialMap, initialPlayerPos);
        }

        // Store canvas reference
        setGameCanvas(canvas);

        // Add canvas to container
        container.appendChild(canvas);

        console.log('Game setup complete');
        setIsLoading(false);

        // Set up resize handler
        const handleResize = () => {
          const rect = container.getBoundingClientRect();
          const size = Math.min(rect.width - 24, rect.height - 80, 400);
          
          canvas.width = size;
          canvas.height = size;
          canvas.style.width = `${size}px`;
          canvas.style.height = `${size}px`;
          
          if (currentMap) {
            const currentPlayerPos = window.playerPos || { x: 0, y: 0 };
            if (usesFallback || Object.keys(images).length === 0) {
              drawGameFallback(canvas, currentMap, currentPlayerPos);
            } else {
              drawGameWithImages(canvas, currentMap, images, currentPlayerPos);
            }
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        };

      } catch (error) {
        console.error('Game setup failed:', error);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initGame, 200);
    return () => clearTimeout(timer);
  }, [mounted]);

  // Update drawing when map, images, or player position changes
  useEffect(() => {
    if (gameCanvas && currentMap) {
      if (usesFallback || Object.keys(images).length === 0) {
        drawGameFallback(gameCanvas, currentMap, playerPos);
      } else {
        drawGameWithImages(gameCanvas, currentMap, images, playerPos);
      }
    }
  }, [gameCanvas, currentMap, images, usesFallback, playerPos]);

  // Handle interpreter reset
  useEffect(() => {
    if (!mounted) return;

    const handleReset = () => {
      console.log('Handling game reset...');
      generateNewMap();
    };

    window.addEventListener('interpreterReset', handleReset);
    return () => window.removeEventListener('interpreterReset', handleReset);
  }, [mounted, gameCanvas, images, usesFallback]);

  // Don't render on server
  if (!mounted) {
    return null;
  }

  return (
    <div className="panel game-panel">
      <div className="panel-header">
        <span>Game World</span>
        {!isLoading && gameCanvas && (
          <button 
            onClick={generateNewMap}
            style={{ 
              marginLeft: 'auto', 
              padding: '4px 8px', 
              fontSize: '11px',
              background: '#0ea5e9',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
            title="Generate new random map"
          >
            🎲 New Map
          </button>
        )}
      </div>
      <div 
        className="panel-content" 
        ref={containerRef}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column',
          minHeight: '300px',
          position: 'relative'
        }}
      >
        {isLoading ? (
          <div style={{ color: '#a0a0a0' }}>Loading game and images...</div>
        ) : !gameCanvas ? (
          <div style={{ color: '#ef4444' }}>Failed to create canvas</div>
        ) : (
          usesFallback && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '11px', 
              color: '#a0a0a0',
              textAlign: 'center'
            }}>
              Using fallback graphics<br />
              (Images not found in /public/images/)
            </div>
          )
        )}
      </div>
    </div>
  );
}