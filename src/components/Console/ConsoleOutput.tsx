import React from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { Trash2 } from 'lucide-react';

const ConsoleOutput: React.FC = () => {
  const { consoleOutput, clearConsole } = useVisualizationStore();
  const consoleRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/10 border-red-900/20';
      case 'warn': return 'text-yellow-400 bg-yellow-900/10 border-yellow-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/10 border-blue-900/20';
      default: return 'text-gray-300 border-transparent';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden font-mono text-sm">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="font-semibold text-gray-200">Console</span>
        <button 
          onClick={clearConsole}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="Clear Console"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div 
        ref={consoleRef}
        className="flex-1 p-2 overflow-y-auto space-y-1"
      >
        {consoleOutput.map((msg) => (
          <div 
            key={msg.id} 
            className={`p-1 pl-2 border-l-2 ${getMessageColor(msg.type)} flex`}
          >
            {msg.type === 'error' && <span className="mr-2 text-red-500">❌</span>}
            {msg.type === 'warn' && <span className="mr-2 text-yellow-500">⚠️</span>}
            <div className="whitespace-pre-wrap break-all">
              {msg.content.map((item, i) => (
                <span key={i} className="mr-2">
                  {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                </span>
              ))}
            </div>
          </div>
        ))}
        {consoleOutput.length === 0 && (
          <div className="text-gray-600 italic px-2 pt-2">
            // Console output will appear here...
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsoleOutput;
