import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../lib/config';
import { drawBoard, calculateScale, setGameMap } from '../lib/game';

export default function MapEditor({ user }) {
  const canvasRef = useRef(null);
  const [map, setMap] = useState(Array(CONFIG.GRID_SIZE).fill().map(() => Array(CONFIG.GRID_SIZE).fill(0)));
  const [brush, setBrush] = useState(0); // 0: grass, 1: wall, 2: water, 3: goal

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    window.ctx = ctx; // Expose for drawing

    const handleMouseMove = (e) => {
      if (e.buttons === 1) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / CONFIG.GRID_SIZE));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / CONFIG.GRID_SIZE));
        if (x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE) {
          const newMap = [...map];
          newMap[y][x] = brush;
          setMap(newMap);
          setGameMap(newMap); // Update global gameMap
          drawBoard(calculateScale());
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseMove);
    };
  }, [map, brush]);

  const saveMap = () => {
    if (user) {
      const mapName = prompt('Enter map name:');
      if (mapName) {
        const savedMaps = JSON.parse(localStorage.getItem(`maps_${user.username}`) || '{}');
        savedMaps[mapName] = map;
        localStorage.setItem(`maps_${user.username}`, JSON.stringify(savedMaps));
      }
    }
  };

  return (
    <div className="editorContainer">
      <canvas id="gameCanvas" ref={canvasRef} className="gameCanvas"></canvas>
      <div className="brushPanel">
        <button onClick={() => setBrush(0)} className="brushButton">Grass</button>
        <button onClick={() => setBrush(1)} className="brushButton">Wall</button>
        <button onClick={() => setBrush(2)} className="brushButton">Water</button>
        <button onClick={() => setBrush(3)} className="brushButton">Goal</button>
        <button onClick={saveMap} className="brushButton">Save Map</button>
      </div>
    </div>
  );
}