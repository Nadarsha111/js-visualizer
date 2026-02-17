import React from 'react';
import { X, Play } from 'lucide-react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { EXAMPLES } from '../../constants/examples';

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExamplesModal: React.FC<ExamplesModalProps> = ({ isOpen, onClose }) => {
  const { setCode, stopExecution } = useVisualizationStore();

  if (!isOpen) return null;

  const handleLoadExample = (code: string) => {
    stopExecution();
    setCode(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Examples Gallery</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 grid gap-4">
          {EXAMPLES.map((example) => (
            <div 
              key={example.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors group cursor-pointer"
              onClick={() => handleLoadExample(example.code)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {example.title}
                </h3>
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={16} fill="currentColor" />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                {example.description}
              </p>
              <div className="bg-gray-950 p-3 rounded text-xs font-mono text-gray-300 overflow-hidden line-clamp-3 opacity-60">
                {example.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamplesModal;
