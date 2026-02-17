import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, StepForward, ArrowDownToLine } from 'lucide-react';
import { useVisualizationStore } from '../../store/visualizationStore';

const ExecutionControls: React.FC = () => {
  const { 
    isPlaying, 
    isExecuting, 
    isInitializing,
    startExecution, 
    pauseExecution, 
    resumeExecution,
    nextStep, 
    prevStep, 
    reset,
    executionSpeed,
    setSpeed
  } = useVisualizationStore();

  const handlePlayPause = () => {
    if (isInitializing) return;
    
    if (isPlaying) {
      pauseExecution();
    } else {
      if (isExecuting) {
        resumeExecution();
      } else {
        startExecution();
      }
    }
  };

  const handleNextStep = () => {
    if (isInitializing) return;

    if (!isExecuting) {
      startExecution(true);
    } else {
      nextStep();
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
      <div className="flex items-center space-x-2">
        <button
          onClick={reset}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
        
        <div className="h-6 w-px bg-gray-700 mx-2" />
        
        <button
          onClick={prevStep}
          disabled={!isExecuting}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous Step"
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-700 rounded transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>

        <button
          onClick={handleNextStep}
          disabled={isPlaying || isInitializing}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next Step"
        >
          <SkipForward size={18} />
        </button>

        {/* Placeholder for Step Into/Over if we implement distinct logic */}
        {/* <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
          <ArrowDownToLine size={18} />
        </button> */}
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-xs text-gray-400">Speed: {executionSpeed}ms</span>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={executionSpeed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ExecutionControls;
