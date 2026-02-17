import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisualizationStore } from '../../store/visualizationStore';
import { safeStringify } from '../../utils/format';

const MemoryHeap: React.FC = () => {
  const { memoryHeap } = useVisualizationStore();

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-semibold text-gray-200">
        Memory Heap
      </div>
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
        <AnimatePresence>
          {memoryHeap.map((obj) => (
            <motion.div
              key={obj.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-gray-800 border border-gray-600 rounded p-2 text-xs font-mono relative group hover:border-blue-500 transition-colors"
            >
              <div className="absolute top-1 right-1 text-[10px] text-gray-500 bg-gray-900 px-1 rounded">
                Ref: {obj.references}
              </div>
              <div className="text-purple-400 font-bold mb-1 truncate" title={obj.id}>
                {obj.id.substring(0, 8)}...
              </div>
              <div className="text-gray-300 break-words max-h-20 overflow-hidden">
                {safeStringify(obj.value, 2)}
              </div>
              <div className="text-[10px] text-gray-500 mt-1 capitalize">
                Type: {obj.type}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {memoryHeap.length === 0 && (
          <div className="col-span-full text-center text-gray-500 mt-10 italic">
            Heap is empty
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryHeap;
