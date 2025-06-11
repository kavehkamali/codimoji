export default function CommandPanel() {
  const commands = [
    { id: 'move_right', label: 'Move Right', hasNumber: true },
    { id: 'move_left', label: 'Move Left', hasNumber: true },
    { id: 'move_up', label: 'Move Up', hasNumber: true },
    { id: 'move_down', label: 'Move Down', hasNumber: true },
    { id: 'turn_left', label: 'Turn Left', hasNumber: false },
    { id: 'turn_right', label: 'Turn Right', hasNumber: false },
  ];

  const handleCommand = (command) => {
    // Add command with parentheses to the code editor
    const codeInput = document.getElementById('codeInput');
    if (codeInput) {
      const currentValue = codeInput.value;
      
      // Always add empty parentheses - user will fill in the number if needed
      const newCommand = `${command.id}()\n`;
      codeInput.value = currentValue + newCommand;
      console.log(`Added command: ${newCommand.trim()}`);
      
      // Trigger input event to update any listeners
      const event = new Event('input', { bubbles: true });
      codeInput.dispatchEvent(event);
      
      // Focus the code input
      codeInput.focus();
    }
  };

  return (
    <div className="panel command-panel">
      <div className="panel-header">Commands</div>
      <div className="panel-content">
        <div className="command-list">
          {commands.map((command) => (
            <button
              key={command.id}
              className="command-item"
              onClick={() => handleCommand(command)}
              title={`Add ${command.id}() to code`}
            >
              {command.label}
            </button>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '8px', 
          fontSize: '11px', 
          color: '#a0a0a0',
          borderTop: '1px solid #333',
          lineHeight: '1.4'
        }}>
          <strong>Usage:</strong><br />
          • Click commands to add them with empty ()<br />
          • Fill in numbers: move_right(3)<br />
          • Use variables: x = 5, move_right(x)<br />
          • Default is 1 step if empty: move_right()
        </div>
      </div>
    </div>
  );
}