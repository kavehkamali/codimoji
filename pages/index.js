import { useEffect, useRef } from 'react';
import CommandPanel from '../components/CommandPanel';
import CodeEditor from '../components/CodeEditor';
import GameCanvas from '../components/GameCanvas';
import Splitter from '../components/Splitter';
import TopBar from '../components/TopBar';
import MapLibrary from '../components/MapLibrary';
import { initInterpreter } from '../lib/interpreter';
import Login from '../components/Login';
import Signup from '../components/Signup';

export default function Home({ user, login, signup, logout }) {
  const workspaceRef = useRef(null);

  useEffect(() => {
    if (user) {
      initInterpreter();
    }
  }, [user]);

  useEffect(() => {
    // Ensure layout fits viewport
    const ensureLayoutFits = () => {
      if (workspaceRef.current) {
        const workspace = workspaceRef.current;
        const viewportWidth = window.innerWidth;
        const panels = workspace.querySelectorAll('.panel');
        const splitters = workspace.querySelectorAll('.splitter');
        
        let totalFixedWidth = 0;
        panels.forEach(panel => {
          if (!panel.classList.contains('game-panel')) {
            totalFixedWidth += panel.getBoundingClientRect().width;
          }
        });
        
        splitters.forEach(splitter => {
          totalFixedWidth += splitter.getBoundingClientRect().width;
        });
        
        // If total width exceeds viewport, reduce map panel width
        if (totalFixedWidth > viewportWidth * 0.95) {
          const mapPanel = workspace.querySelector('.map-panel');
          if (mapPanel) {
            const newWidth = Math.max(180, viewportWidth * 0.95 - totalFixedWidth + mapPanel.getBoundingClientRect().width);
            mapPanel.style.width = `${newWidth}px`;
            mapPanel.style.minWidth = `${newWidth}px`;
            mapPanel.style.maxWidth = `${newWidth}px`;
          }
        }
      }
    };

    if (user) {
      setTimeout(ensureLayoutFits, 100);
      window.addEventListener('resize', ensureLayoutFits);
      
      return () => window.removeEventListener('resize', ensureLayoutFits);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="auth-container">
        <Login login={login} />
        <Signup signup={signup} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <TopBar user={user} logout={logout} />
      <div className="workspace" ref={workspaceRef}>
        <CommandPanel />
        <Splitter id="splitter1" />
        <CodeEditor />
        <Splitter id="splitter2" />
        <GameCanvas />
        <Splitter id="splitter3" />
        <MapLibrary user={user} />
      </div>
    </div>
  );
}