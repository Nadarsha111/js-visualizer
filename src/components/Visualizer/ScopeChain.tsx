import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisualizationStore } from "../../store/visualizationStore";
import { Scope } from "../../types";
import { formatValue } from "../../utils/format";

const ScopeChain: React.FC = () => {
  const { scopeChain } = useVisualizationStore();

  const getScopeColor = (type: Scope["type"]) => {
    switch (type) {
      case "global":
        return "border-purple-500 bg-purple-900/20";
      case "function":
        return "border-blue-500 bg-blue-900/20";
      case "block":
        return "border-green-500 bg-green-900/20";
      case "module":
        return "border-yellow-500 bg-yellow-900/20";
      default:
        return "border-gray-500 bg-gray-900/20";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-semibold text-gray-200">
        Scope Chain
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
        <AnimatePresence>
          {scopeChain.map((scope) => (
            <motion.div
              key={scope.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className={`p-3 rounded border ${getScopeColor(scope.type)}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm capitalize text-gray-200">
                  {scope.type} Scope
                </span>
                {scope.name && (
                  <span className="text-xs text-gray-400 font-mono">
                    {scope.name}
                  </span>
                )}
              </div>

              {Object.keys(scope.variables).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(scope.variables).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between text-xs font-mono border-b border-gray-700/50 pb-1 last:border-0"
                    >
                      <span className="text-pink-400">{key}:</span>
                      <span
                        className="text-cyan-300 truncate max-w-[120px]"
                        title={String(value)}
                      >
                        {formatValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">No variables</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {scopeChain.length === 0 && (
          <div className="text-center text-gray-500 mt-10 italic">
            No active scope
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopeChain;
