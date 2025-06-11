// lib/useLayout.js
import { useEffect, useState, useCallback } from 'react';

export function useLayout() {
  const [dimensions, setDimensions] = useState({
    commandWidth: 180,
    leftWidth: 250,
    rightWidth: 400,
    mapWidth: 200
  });

  const calculateLayout = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const container = document.querySelector('.columns-container');
    if (!container) return;
    
    // Get actual container width (excluding scrollbars)
    const containerWidth = container.clientWidth; // clientWidth excludes scrollbars
    const splitterWidth = 10; // 2 splitters * 5px each
    
    console.log('Container client width:', containerWidth);
    
    // Minimum widths
    const minCommand = 150;
    const minLeft = 180;
    const minRight = 200;
    const minMap = 150;
    
    let commandWidth = Math.max(minCommand, Math.min(200, containerWidth * 0.15));
    let leftWidth = Math.max(minLeft, Math.min(300, containerWidth * 0.25));
    let mapWidth = Math.max(minMap, Math.min(250, containerWidth * 0.2));
    let rightWidth = containerWidth - commandWidth - leftWidth - mapWidth - splitterWidth;
    
    // Ensure right panel isn't too small
    if (rightWidth < minRight) {
      // Reduce other panels proportionally
      const totalOthers = commandWidth + leftWidth + mapWidth;
      const availableForOthers = containerWidth - minRight - splitterWidth;
      const scale = availableForOthers / totalOthers;
      
      commandWidth = Math.floor(commandWidth * scale);
      leftWidth = Math.floor(leftWidth * scale);
      mapWidth = Math.floor(mapWidth * scale);
      rightWidth = containerWidth - commandWidth - leftWidth - mapWidth - splitterWidth;
    }
    
    const newDimensions = {
      commandWidth: Math.floor(commandWidth),
      leftWidth: Math.floor(leftWidth),
      rightWidth: Math.floor(rightWidth),
      mapWidth: Math.floor(mapWidth)
    };
    
    console.log('Calculated dimensions:', newDimensions);
    setDimensions(newDimensions);
    
    return newDimensions;
  }, []);

  const applyLayout = useCallback((dims = dimensions) => {
    const commandPanel = document.getElementById('commandPanel');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const mapPanel = document.getElementById('mapPanel');
    
    if (commandPanel) {
      commandPanel.style.width = dims.commandWidth + 'px';
      commandPanel.style.minWidth = dims.commandWidth + 'px';
      commandPanel.style.maxWidth = dims.commandWidth + 'px';
      commandPanel.style.flexShrink = '0';
    }
    
    if (leftPanel) {
      leftPanel.style.width = dims.leftWidth + 'px';
      leftPanel.style.minWidth = dims.leftWidth + 'px';
      leftPanel.style.maxWidth = dims.leftWidth + 'px';
      leftPanel.style.flexShrink = '0';
    }
    
    if (rightPanel) {
      rightPanel.style.width = dims.rightWidth + 'px';
      rightPanel.style.minWidth = dims.rightWidth + 'px';
      rightPanel.style.maxWidth = dims.rightWidth + 'px';
      rightPanel.style.flex = 'none';
    }
    
    if (mapPanel) {
      mapPanel.style.width = dims.mapWidth + 'px';
      mapPanel.style.minWidth = dims.mapWidth + 'px';
      mapPanel.style.maxWidth = dims.mapWidth + 'px';
      mapPanel.style.flexShrink = '0';
    }
  }, [dimensions]);

  const updateDimensions = useCallback((newDims) => {
    setDimensions(newDims);
    applyLayout(newDims);
  }, [applyLayout]);

  useEffect(() => {
    const handleResize = () => {
      const newDims = calculateLayout();
      if (newDims) {
        applyLayout(newDims);
      }
    };

    // Initial layout
    setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateLayout, applyLayout]);

  return {
    dimensions,
    updateDimensions,
    applyLayout,
    calculateLayout
  };
}