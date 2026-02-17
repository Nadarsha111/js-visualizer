import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '../../store/visualizationStore';

const EventLoop: React.FC = () => {
  const { eventLoop, isPlaying } = useVisualizationStore();
  const { callbackQueue, microtaskQueue, currentlyExecuting } = eventLoop;

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-semibold text-gray-200">
        Event Loop
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        
        {/* Microtask Queue */}
        <div className="border border-yellow-500/30 bg-yellow-900/10 rounded p-2">
          <div className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider">Microtask Queue</div>
          <div className="flex flex-col gap-2 min-h-[40px]">
            <AnimatePresence>
              {microtaskQueue.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-yellow-900/40 border border-yellow-700 rounded p-2 text-xs text-yellow-100 font-mono"
                >
                  {task.description}
                </motion.div>
              ))}
            </AnimatePresence>
            {microtaskQueue.length === 0 && (
              <div className="text-center text-gray-600 text-xs italic py-2">Empty</div>
            )}
          </div>
        </div>

        {/* Callback Queue */}
        <div className="border border-green-500/30 bg-green-900/10 rounded p-2">
          <div className="text-xs font-bold text-green-500 mb-2 uppercase tracking-wider">Callback Queue (Task Queue)</div>
          <div className="flex flex-col gap-2 min-h-[40px]">
            <AnimatePresence>
              {callbackQueue.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-green-900/40 border border-green-700 rounded p-2 text-xs text-green-100 font-mono"
                >
                  {task.description}
                </motion.div>
              ))}
            </AnimatePresence>
            {callbackQueue.length === 0 && (
              <div className="text-center text-gray-600 text-xs italic py-2">Empty</div>
            )}
          </div>
        </div>

        {/* Loop Status */}
        <div className="mt-auto flex items-center justify-center p-2">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: isPlaying ? 2 : 0, repeat: Infinity, ease: "linear" }}
            className={`w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-gray-700 border-l-gray-700 ${!isPlaying ? 'opacity-50' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};

export default EventLoop;
