import React, { useState } from 'react';
import CodeEditor from '../components/Editor/CodeEditor';
import ExecutionControls from '../components/Controls/ExecutionControls';
import CallStack from '../components/Visualizer/CallStack';
import ScopeChain from '../components/Visualizer/ScopeChain';
import MemoryHeap from '../components/Visualizer/MemoryHeap';
import EventLoop from '../components/Visualizer/EventLoop';
import ConsoleOutput from '../components/Console/ConsoleOutput';
import ExamplesModal from '../components/Examples/ExamplesModal';

import { useExecutionLoop } from '../hooks/useExecutionLoop';

const Visualizer: React.FC = () => {
  useExecutionLoop();
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200 overflow-hidden">
      <ExamplesModal isOpen={isExamplesOpen} onClose={() => setIsExamplesOpen(false)} />
      
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">JS</div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            JS Execution Visualizer
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsExamplesOpen(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Examples
          </button>
          <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</a>
          <div className="w-px h-4 bg-gray-700"></div>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Settings</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* Left Column: Editor & Console */}
        <div className="flex flex-col w-5/12 gap-2 min-w-[400px]">
          <div className="flex-1 flex flex-col min-h-0 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="flex-1 min-h-0 relative">
              <CodeEditor />
            </div>
            <ExecutionControls />
          </div>
          <div className="h-1/3 min-h-[150px]">
            <ConsoleOutput />
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="flex flex-col w-7/12 gap-2 min-w-[500px]">
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
            <CallStack />
            <ScopeChain />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
            <MemoryHeap />
            <EventLoop />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Visualizer;
