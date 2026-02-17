import { useEffect, useRef } from 'react';
import { useVisualizationStore } from '../store/visualizationStore';

export const useExecutionLoop = () => {
  const { isPlaying, executionSpeed, nextStep, isExecuting } = useVisualizationStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying && isExecuting) {
      intervalRef.current = setInterval(() => {
        nextStep();
      }, executionSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isExecuting, executionSpeed, nextStep]);
};
