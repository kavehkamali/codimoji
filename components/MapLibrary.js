import { useEffect, useState, useRef } from 'react';
import { drawBoard, calculateScale } from '../lib/game';

export default function MapLibrary({ user }) {
  const [maps, setMaps] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user && isClient && typeof window !== 'undefined') {
      // Get maps from editor (different key than game maps)
      const editorMaps = JSON.parse(localStorage.getItem(`editor_maps_${user.username}`) || '{}');
      const mapList = Object.entries(editorMaps).map(([name, map]) => ({ name, map }));
      setMaps(mapList);
    }
  }, [user, isClient]);

  const selectMap = (map) => {
    try {
      // Load map into game
      window.gameMap = map;
      window.playerPos = { x: 0, y: 0 };
      window.targetPos = { x: 0, y: 0 };
      
      // Try to redraw using the existing game system
      if (window.ctx && typeof drawBoard === 'function' && typeof calculateScale === 'function') {
        const scale = calculateScale();
        drawBoard(scale);
        console.log('Map loaded using game system');
      } else {
        // Fallback direct canvas drawing
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
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
              const tile = map[y][x] || 0;
              ctx.fillStyle = colors[tile];
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
              
              // Add border
              ctx.strokeStyle = '#333333';
              ctx.lineWidth = 1;
              ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
          }
          
          // Draw player at (0,0)
          ctx.fillStyle = '#ef4444'; // Red player
          ctx.fillRect(2, 2, tileSize - 4, tileSize - 4);
          
          console.log('Map loaded using fallback rendering');
        }
      }
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  };

  // Don't render content on server side to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className="panel map-panel">
        <div className="panel-header">Map Library</div>
        <div className="panel-content">
          <div style={{ color: '#a0a0a0', textAlign: 'center' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel map-panel">
      <div className="panel-header">Map Library</div>
      <div className="panel-content">
        <div className="map-library">
          <div className="mb-4">
            <div style={{ 
              fontSize: '12px', 
              color: '#a0a0a0', 
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              Maps created in Editor
            </div>
          </div>
          
          <div className="map-thumbnails">
            {maps.map((map, index) => (
              <MapThumbnail
                key={`${map.name}-${index}`}
                map={map}
                onSelect={() => selectMap(map.map)}
              />
            ))}
          </div>
          
          {maps.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: '#a0a0a0', 
              marginTop: '32px',
              fontSize: '13px'
            }}>
              No maps found.<br />
              Create maps in the Editor<br />
              to see them here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MapThumbnail({ map, onSelect }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && map.map) {
      renderThumbnail(canvasRef.current, map.map);
    }
  }, [map.map]);

  return (
    <div 
      className="map-thumbnail" 
      onClick={onSelect}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        background: '#1a1a1a',
        border: '1px solid #333333',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#0ea5e9';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#333333';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <canvas
        ref={canvasRef}
        width="64"
        height="64"
        style={{ 
          width: '64px', 
          height: '64px',
          borderRadius: '4px',
          border: '1px solid #333333'
        }}
      />
      <div style={{ 
        fontSize: '11px', 
        textAlign: 'center', 
        fontWeight: '500',
        color: '#ffffff',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {map.name}
      </div>
    </div>
  );
}

function renderThumbnail(canvas, map) {
  if (!canvas || !map) return;

  const ctx = canvas.getContext('2d');
  const tileSize = 64 / 15; // 15x15 grid in 64px canvas

  // Clear canvas
  ctx.clearRect(0, 0, 64, 64);

  // Colors for different tile types
  const colors = {
    0: '#10b981', // Grass - green
    1: '#6b7280', // Wall - gray
    2: '#3b82f6', // Water - blue
    3: '#f59e0b', // Goal - yellow
  };

  for (let y = 0; y < 15 && y < map.length; y++) {
    for (let x = 0; x < 15 && x < map[y].length; x++) {
      const tile = map[y][x];
      ctx.fillStyle = colors[tile] || colors[0];
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
}