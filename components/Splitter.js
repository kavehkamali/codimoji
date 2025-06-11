import { useEffect, useRef } from 'react';

export default function Splitter({ id }) {
  const splitterRef = useRef(null);

  useEffect(() => {
    const splitter = splitterRef.current;
    if (!splitter) return;

    let isDragging = false;
    let startX = 0;
    let startWidths = {};

    const handleMouseDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      e.preventDefault();

      // Get all panels
      const workspace = document.querySelector('.workspace');
      const panels = Array.from(workspace.children).filter(child => 
        child.classList.contains('panel')
      );

      // Store initial widths
      startWidths = {};
      panels.forEach((panel, index) => {
        startWidths[index] = panel.getBoundingClientRect().width;
      });

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const workspace = document.querySelector('.workspace');
      const children = Array.from(workspace.children);
      const splitterIndex = children.indexOf(splitter);

      // Find adjacent panels
      let leftPanel = null;
      let rightPanel = null;

      for (let i = splitterIndex - 1; i >= 0; i--) {
        if (children[i].classList.contains('panel')) {
          leftPanel = children[i];
          break;
        }
      }

      for (let i = splitterIndex + 1; i < children.length; i++) {
        if (children[i].classList.contains('panel')) {
          rightPanel = children[i];
          break;
        }
      }

      if (!leftPanel || !rightPanel) return;

      const leftIndex = Array.from(workspace.children).filter(child => 
        child.classList.contains('panel')
      ).indexOf(leftPanel);
      
      const rightIndex = Array.from(workspace.children).filter(child => 
        child.classList.contains('panel')
      ).indexOf(rightPanel);

      // Calculate new widths
      const minWidth = 150;
      let newLeftWidth = startWidths[leftIndex] + deltaX;
      let newRightWidth = startWidths[rightIndex] - deltaX;

      // Apply constraints
      if (newLeftWidth < minWidth) {
        newLeftWidth = minWidth;
        newRightWidth = startWidths[leftIndex] + startWidths[rightIndex] - minWidth;
      }
      if (newRightWidth < minWidth) {
        newRightWidth = minWidth;
        newLeftWidth = startWidths[leftIndex] + startWidths[rightIndex] - minWidth;
      }

      // Apply new widths
      leftPanel.style.width = `${newLeftWidth}px`;
      leftPanel.style.minWidth = `${newLeftWidth}px`;
      leftPanel.style.maxWidth = `${newLeftWidth}px`;
      
      rightPanel.style.width = `${newRightWidth}px`;
      rightPanel.style.minWidth = `${newRightWidth}px`;
      rightPanel.style.maxWidth = `${newRightWidth}px`;

      // Trigger resize event for canvas
      window.dispatchEvent(new Event('resize'));
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    splitter.addEventListener('mousedown', handleMouseDown);

    return () => {
      splitter.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [id]);

  return <div ref={splitterRef} id={id} className="splitter" />;
}