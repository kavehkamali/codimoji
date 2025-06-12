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

  // Calculate optimal canvas size to always fit the container
  const calculateCanvasSize = () => {
    if (!containerRef.current) return 300;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Get available space with minimal margins
    const availableWidth = containerRect.width - 16; // Reduced margin from 32 to 16
    const availableHeight = containerRect.height - 40; // Reduced margin from 80 to 40
    
    // Always use the smaller dimension to ensure it fits, but NO MAXIMUM LIMIT
    const size = Math.min(availableWidth, availableHeight);
    
    // Ensure minimum size but allow UNLIMITED maximum
    const finalSize = Math.max(150, size); // Reduced minimum from 200 to 150
    
    console.log(`Container: ${containerRect.width}x${containerRect.height}, Canvas: ${finalSize}x${finalSize}`);
    return finalSize;
  };

  // Drawing function with images and layered rendering
  const drawGameWithImages = (canvas, map, gameImages, currentPlayerPos) => {
    if (!canvas || !map) return;
    
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const tileSize = size / 12; // 12x12 grid
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // LAYER 1: Draw grass background on ALL tiles
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        if (gameImages.grass) {
          ctx.drawImage(gameImages.grass, x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
    
    // LAYER 2: Draw overlays (walls, water, goals) on top of grass
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
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
    
    if (gameImages.character && gameImages.character.complete) {
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
    const size = canvas.width;
    const tileSize = size / 12; // 12x12 grid
    
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
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
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

  // Resize canvas to fit container - ALWAYS RESIZE
  const resizeCanvas = (canvas) => {
    if (!canvas || !containerRef.current) return;
    
    const size = calculateCanvasSize();
    
    // ALWAYS resize, no matter how big
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    
    console.log(`Canvas resized to: ${size}x${size}`);
    
    // Redraw after resize
    if (currentMap) {
      const currentPlayerPos = window.playerPos || { x: 0, y: 0 };
      if (usesFallback || Object.keys(images).length === 0) {
        drawGameFallback(canvas, currentMap, currentPlayerPos);
      } else {
        drawGameWithImages(canvas, currentMap, images, currentPlayerPos);
      }
    }
  };

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
        canvas.style.margin = '0 auto';

        // Size the canvas to fit container
        const size = calculateCanvasSize();
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

        return () => {
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

  // Set up resize observer to detect ANY size changes (including splitter movement)
  useEffect(() => {
    if (!gameCanvas || !containerRef.current) return;

    // Use ResizeObserver for more reliable resize detection
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        console.log('Container size changed, resizing canvas...');
        resizeCanvas(gameCanvas);
      }
    });

    resizeObserver.observe(containerRef.current);

    // Also listen to window resize as backup
    const handleWindowResize = () => {
      setTimeout(() => resizeCanvas(gameCanvas), 100);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [gameCanvas]);

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

  // Handle code reset (player position reset, keep map)
  useEffect(() => {
    if (!mounted) return;

    const handleCodeReset = () => {
      console.log('Handling code reset (keeping current map)...');
      // Just reset player position, keep the current map
      setPlayerPos({ x: 0, y: 0 });
      setPlayerPosition({ x: 0, y: 0 });
      setTargetPos({ x: 0, y: 0 });
      
      if (gameCanvas && currentMap) {
        if (usesFallback || Object.keys(images).length === 0) {
          drawGameFallback(gameCanvas, currentMap, { x: 0, y: 0 });
        } else {
          drawGameWithImages(gameCanvas, currentMap, images, { x: 0, y: 0 });
        }
      }
    };

    window.addEventListener('codeReset', handleCodeReset);
    return () => window.removeEventListener('codeReset', handleCodeReset);
  }, [mounted, gameCanvas, currentMap, images, usesFallback]);

  // Handle interpreter reset (reset map too)
  useEffect(() => {
    if (!mounted) return;

    const handleInterpreterReset = () => {
      console.log('Handling interpreter reset (generating new map)...');
      generateNewMap();
    };

    window.addEventListener('interpreterReset', handleInterpreterReset);
    return () => window.removeEventListener('interpreterReset', handleInterpreterReset);
  }, [mounted, gameCanvas, images, usesFallback]);

  // Don't render on server
  if (!mounted) {
    return null;
  }

  return (
    <div className="panel game-panel">
      <div className="panel-header">
        <span>Game World (12x12)</span>
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
          minHeight: '200px', // Reduced from 300px
          position: 'relative',
          height: '100%',
          padding: '8px' // Reduced padding
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