import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '../../store/visualizationStore';
import { formatValue } from '../../utils/format';

const CallStack: React.FC = () => {
  const { callStack } = useVisualizationStore();

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-semibold text-gray-200">
        Call Stack
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col-reverse gap-2">
        <AnimatePresence>
          {callStack.map((frame, index) => (
            <motion.div
              key={frame.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded border ${
                index === callStack.length - 1 
                  ? 'bg-blue-900/40 border-blue-500 text-blue-100' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              }`}
            >
              <div className="font-mono font-bold text-sm">
                {frame.functionName}
              </div>
              <div className="text-xs opacity-70 mt-1 font-mono">
                Line: {frame.lineNumber}
              </div>
              {Object.keys(frame.localVariables).length > 0 && (
                <div className="mt-2 text-xs border-t border-gray-600/50 pt-1">
                  <div className="opacity-50 mb-1">Locals:</div>
                  {Object.entries(frame.localVariables).map(([key, value]) => (
                    <div key={key} className="flex justify-between font-mono">
                      <span className="text-yellow-400">{key}:</span>
                      <span className="text-green-300 truncate max-w-[100px]">{formatValue(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {callStack.length === 0 && (
          <div className="text-center text-gray-500 mt-10 italic">
            Stack is empty
          </div>
        )}
      </div>
    </div>
  );
};

export default CallStack;
