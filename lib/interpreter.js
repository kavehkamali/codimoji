import { CONFIG } from './config.js';
import { generateMap, setPlayerPos, setTargetPos, isOutOfBounds, isCollision, isGoal, getGameMap, setGameMap } from './game.js';

let codeInput = null;
let consoleElement = null;
let variables = {};
let isExecuting = false;
let shouldStop = false;

export function initializeInterpreter() {
  if (typeof window !== 'undefined') {
    codeInput = document.getElementById('codeInput');
    consoleElement = document.getElementById('console');
    window.gameMap = window.gameMap || getGameMap();

    // Handle code reset (doesn't reset map) - triggered by Restart button
    window.addEventListener('codeReset', () => {
      variables = {};
      isExecuting = false;
      shouldStop = false;
      setPlayerPos({ x: 0, y: 0 });
      setTargetPos({ x: 0, y: 0 });
      window.playerDead = false;
      if (window.setPlayerDead) window.setPlayerDead(false);
      
      // Clear line highlight
      const highlight = document.getElementById('lineHighlight');
      if (highlight) {
        highlight.style.display = 'none';
      }
      
      // Redraw current map with reset player position
      if (window.redrawGame) {
        window.redrawGame();
      }
    });

    // Handle interpreter reset (resets map too) - triggered by New Map button
    window.addEventListener('interpreterReset', () => {
      variables = {};
      isExecuting = false;
      shouldStop = false;
      setPlayerPos({ x: 0, y: 0 });
      setTargetPos({ x: 0, y: 0 });
      window.playerDead = false;
      if (window.setPlayerDead) window.setPlayerDead(false);
      
      // Clear line highlight
      const highlight = document.getElementById('lineHighlight');
      if (highlight) {
        highlight.style.display = 'none';
      }
      
      const savedMaps = JSON.parse(localStorage.getItem(`maps_${window.user?.username || 'default'}`) || '{}');
      if (Object.keys(savedMaps).length > 0) {
        setGameMap(savedMaps[Object.keys(savedMaps)[0]]);
      } else {
        generateMap();
      }
      
      if (window.redrawGame) {
        window.redrawGame();
      }
    });

    window.addEventListener('stopExecution', () => {
      shouldStop = true;
      isExecuting = false;
      clearLineHighlight();
      window.dispatchEvent(new Event('executionEnd'));
    });
  }
}

export function initInterpreter() {
  const savedMaps = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem(`maps_${window.user?.username || 'default'}`) || '{}') : {};
  
  if (Object.keys(savedMaps).length > 0) {
    setGameMap(savedMaps[Object.keys(savedMaps)[0]]);
  } else {
    generateMap();
  }
}

function highlightLine(lineIndex) {
  const highlight = document.getElementById('lineHighlight');
  const codeInput = document.getElementById('codeInput');
  
  if (highlight && codeInput) {
    const lines = codeInput.value.split('\n');
    const filteredLines = lines.filter(line => line.trim()); // Only non-empty lines
    const originalLineIndex = getOriginalLineIndex(lines, lineIndex);
    
    if (originalLineIndex >= 0 && originalLineIndex < lines.length) {
      const lineHeight = 18; // Updated to match CSS line height
      const topOffset = originalLineIndex * lineHeight;
      
      // Set the highlight position and content
      highlight.style.top = `${12 + topOffset}px`; // 12px padding
      highlight.style.display = 'block';
      highlight.textContent = lines[originalLineIndex]; // Show the actual line text
      
      // Make the highlight fully opaque yellow with black text
      highlight.style.background = 'rgba(255, 235, 59, 0.9)';
      highlight.style.color = '#000000';
      highlight.style.fontWeight = 'bold';
    }
  }
}

function getOriginalLineIndex(allLines, filteredIndex) {
  let currentFilteredIndex = 0;
  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].trim()) {
      if (currentFilteredIndex === filteredIndex) {
        return i;
      }
      currentFilteredIndex++;
    }
  }
  return -1;
}

function clearLineHighlight() {
  const highlight = document.getElementById('lineHighlight');
  if (highlight) {
    highlight.style.display = 'none';
  }
}

export function runCode() {
  if (!codeInput || !consoleElement) return;
  if (isExecuting) return; // Prevent multiple executions
  
  const lines = codeInput.value.split('\n').map(line => line.trim()).filter(line => line);
  if (!lines.length) return;

  isExecuting = true;
  shouldStop = false;
  window.dispatchEvent(new Event('executionStart'));
  
  let index = 0;

  async function executeNextLine() {
    if (shouldStop || index >= lines.length) {
      clearLineHighlight();
      isExecuting = false;
      window.dispatchEvent(new Event('executionEnd'));
      return;
    }

    const line = lines[index];
    highlightLine(index);

    try {
      // Handle variable assignment
      if (line.includes('=') && !line.includes('==')) {
        const [varName, value] = line.split('=').map(s => s.trim());
        if (/^\d+$/.test(value)) {
          variables[varName] = parseInt(value, 10);
        } else if (variables[value]) {
          variables[varName] = variables[value];
        } else {
          throw new Error(`Invalid value for ${varName}`);
        }
        index++;
        const delay = (window.gameSpeed || 0.5) * 1000;
        setTimeout(executeNextLine, delay);
        return;
      }

      // Handle print statement
      if (line.startsWith('print(')) {
        const match = line.match(/print\(['"]([^'"]+)['"]\)/) || line.match(/print\(([\w]+)\)/);
        if (match) {
          if (match[1] && variables[match[1]] !== undefined) {
            logToConsole(variables[match[1]].toString());
          } else {
            logToConsole(match[1] || 'undefined');
          }
        } else {
          throw new Error('Invalid print statement');
        }
        index++;
        const delay = (window.gameSpeed || 0.5) * 1000;
        setTimeout(executeNextLine, delay);
        return;
      }

      // Handle movement commands - FIXED REGEX AND LOGIC
      const match = line.match(/^(move_right|move_left|move_down|move_up)\s*\(\s*(\d+|\w+)?\s*\)$/);
      if (match) {
        const command = match[1];
        let steps = 1; // Default to 1 step
        
        // If there's a parameter, parse it
        if (match[2]) {
          if (variables[match[2]] !== undefined) {
            steps = variables[match[2]];
          } else if (/^\d+$/.test(match[2])) {
            steps = parseInt(match[2], 10);
          }
        }
        
        // Ensure steps is a valid positive number
        if (isNaN(steps) || steps <= 0) steps = 1;

        let dx = 0, dy = 0;
        if (command === 'move_right') dx = 1;
        else if (command === 'move_left') dx = -1;
        else if (command === 'move_down') dy = 1;
        else if (command === 'move_up') dy = -1;

        // Execute movement step by step
        await executeMovement(dx, dy, steps);
        
        if (shouldStop || window.playerDead) {
          clearLineHighlight();
          isExecuting = false;
          window.dispatchEvent(new Event('executionEnd'));
          return;
        }
        
        index++;
        const delay = (window.gameSpeed || 0.5) * 1000;
        setTimeout(executeNextLine, delay);
        return;
      }

      // If no command matched, skip the line
      index++;
      const delay = (window.gameSpeed || 0.5) * 1000;
      setTimeout(executeNextLine, delay);
      
    } catch (error) {
      updateConsole(`Error: ${error.message}`, true);
      clearLineHighlight();
      isExecuting = false;
      window.dispatchEvent(new Event('executionEnd'));
    }
  }

  executeNextLine();
}

async function executeMovement(dx, dy, steps) {
  const currentPos = window.playerPos || { x: 0, y: 0 };
  
  for (let step = 0; step < steps; step++) {
    if (shouldStop || window.playerDead) break;
    
    const newPos = { 
      x: currentPos.x + dx, 
      y: currentPos.y + dy 
    };

    // Check bounds before moving
    if (isOutOfBounds(newPos)) {
      updateConsole(`Status: Out of bounds! Character died.`, true);
      window.playerDead = true;
      if (window.setPlayerDead) window.setPlayerDead(true);
      if (window.redrawGame) window.redrawGame();
      return;
    }

    // Check for collisions before moving
    if (isCollision(newPos)) {
      const tile = window.gameMap[newPos.y][newPos.x];
      const message = tile === 1 ? 'Hit a wall!' : 'Fell in water!';
      updateConsole(`Status: ${message} Character died.`, true);
      window.playerDead = true;
      if (window.setPlayerDead) window.setPlayerDead(true);
      if (window.redrawGame) window.redrawGame();
      return;
    }

    // Move to the new position
    setPlayerPos(newPos);
    currentPos.x = newPos.x;
    currentPos.y = newPos.y;
    
    if (window.redrawGame) window.redrawGame();
    
    // Check for goal after moving
    if (isGoal(newPos)) {
      updateConsole(`Status: Reached the goal! Victory!`, false);
      if (window.redrawGame) window.redrawGame();
      return;
    }
    
    // Wait for movement animation
    const delay = (window.gameSpeed || 0.5) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (shouldStop) break;
  }
  
  // Log successful movement completion for multi-step moves
  if (steps > 1 && !window.playerDead && !shouldStop) {
    updateConsole(`Completed ${steps} step movement.`, false);
  }
}

export function loadMap(map) {
  setGameMap(map);
  if (window.redrawGame) {
    window.redrawGame();
  }
}

function getCollisionMessage(pos) {
  const tile = window.gameMap[pos.y][pos.x];
  return tile === 1 ? 'Hit a wall!' : 'Fell in water!';
}

function logToConsole(message) {
  if (consoleElement) {
    const line = document.createElement('div');
    line.textContent = message;
    line.style.color = '#ffffff';
    consoleElement.appendChild(line);
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }
}

function updateConsole(message, isAlert = false) {
  if (consoleElement) {
    const line = document.createElement('div');
    line.textContent = message;
    if (isAlert) {
      line.style.color = '#ef4444';
      line.style.fontWeight = 'bold';
    } else {
      line.style.color = '#10b981';
      line.style.fontWeight = 'bold';
    }
    consoleElement.appendChild(line);
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }
}