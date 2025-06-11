import { useEffect, useRef, useState } from 'react';
import { runCode, initializeInterpreter } from '../lib/interpreter';

export default function CodeEditor() {
  const codeInputRef = useRef(null);
  const consoleRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    initializeInterpreter();

    const handleRestart = () => {
      if (consoleRef.current) {
        consoleRef.current.innerHTML = '';
      }
      if (codeInputRef.current) {
        codeInputRef.current.value = '';
      }
      setIsRunning(false);
      
      // Clear any line highlights
      const existingHighlight = document.querySelector('.line-highlight');
      if (existingHighlight) {
        existingHighlight.remove();
      }
      
      window.dispatchEvent(new CustomEvent('interpreterReset'));
    };

    // Listen for execution state changes
    const handleExecutionStart = () => setIsRunning(true);
    const handleExecutionEnd = () => setIsRunning(false);

    window.addEventListener('restart', handleRestart);
    window.addEventListener('executionStart', handleExecutionStart);
    window.addEventListener('executionEnd', handleExecutionEnd);

    return () => {
      window.removeEventListener('restart', handleRestart);
      window.removeEventListener('executionStart', handleExecutionStart);
      window.removeEventListener('executionEnd', handleExecutionEnd);
    };
  }, []);

  const handleRun = () => {
    if (isRunning) {
      // Stop execution
      window.dispatchEvent(new Event('stopExecution'));
      setIsRunning(false);
    } else {
      // Start execution
      runCode();
    }
  };

  const handleRestart = () => {
    window.dispatchEvent(new Event('restart'));
  };

  const handleClear = () => {
    if (consoleRef.current) {
      consoleRef.current.innerHTML = '';
    }
  };

  return (
    <div className="panel editor-panel">
      <div className="panel-header">Code Editor</div>
      <div className="panel-content">
        <div style={{ position: 'relative' }}>
          <textarea
            ref={codeInputRef}
            id="codeInput"
            className="code-editor"
            placeholder="// Write your code here
x = 5
move_right(x)
print('Hello World!')"
            style={{ 
              position: 'relative', 
              zIndex: 1,
              height: '300px', // Made 3x taller
              minHeight: '300px',
              resize: 'vertical',
              // Disable spell check and autocorrect
              spellCheck: 'false',
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              // Remove any text decoration
              textDecoration: 'none'
            }}
          />
          {/* Line highlight overlay */}
          <div 
            id="lineHighlight"
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              height: '20px',
              background: 'rgba(251, 191, 36, 0.8)', // More opaque yellow
              color: '#000000', // Black text for better contrast
              borderRadius: '3px',
              display: 'none',
              zIndex: 2, // Above the textarea
              pointerEvents: 'none',
              transition: 'top 0.2s ease',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '14px',
              lineHeight: '20px',
              padding: '0 4px',
              whiteSpace: 'pre',
              overflow: 'hidden'
            }}
          />
        </div>
        
        <div className="editor-controls">
          <button 
            className="control-btn" 
            onClick={handleRun}
            style={{
              background: isRunning ? '#ef4444' : '#10b981'
            }}
          >
            {isRunning ? '⏹ Stop' : '▶ Run'}
          </button>
          <button className="control-btn secondary" onClick={handleRestart}>
            🔄 Restart
          </button>
          <button className="control-btn secondary" onClick={handleClear}>
            🗑 Clear Console
          </button>
        </div>
        
        <div ref={consoleRef} id="console" className="console" />
      </div>
    </div>
  );
}