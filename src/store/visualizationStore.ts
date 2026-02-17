import { create } from "zustand";
import {
  VisualizationState,
  ExecutionStep,
  CallFrame,
  Scope,
  MemoryObject,
  Variable,
  ConsoleMessage,
} from "../types";

interface VisualizationStore extends VisualizationState {
  code: string;
  steps: ExecutionStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  isInitializing: boolean;

  setCode: (code: string) => void;
  setSteps: (steps: ExecutionStep[]) => void;
  startExecution: (startPaused?: boolean) => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  stopExecution: () => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (stepIndex: number) => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
  addConsoleMessage: (message: ConsoleMessage) => void;
  clearConsole: () => void;
}

const initialState: VisualizationState = {
  executionStep: 0,
  callStack: [],
  scopeChain: [],
  memoryHeap: [],
  eventLoop: {
    callStack: [],
    callbackQueue: [],
    microtaskQueue: [],
  },
  variables: [],
  consoleOutput: [],
  isExecuting: false,
  executionSpeed: 1000,
};

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  ...initialState,
  isInitializing: false,
  code: `// JavaScript Execution Visualizer
// Click 'Play' to start visualization

function calculateSum(a, b) {
  let result = a + b;
  return result;
}

const x = 10;
const y = 20;
const sum = calculateSum(x, y);

console.log("Sum is:", sum);`,
  steps: [],
  currentStepIndex: -1,
  isPlaying: false,

  setCode: (code) => set({ code }),

  setSteps: (steps) => set({ steps, currentStepIndex: -1 }),

  startExecution: async (startPaused = false) => {
    const { code, isInitializing } = get();
    if (isInitializing) return;

    set({ isInitializing: true });

    try {
      const { Interpreter } = await import("../utils/Interpreter");
      const interpreter = new Interpreter(code);
      const steps = interpreter.execute();

      if (steps.length === 0) {
        throw new Error(
          "No execution steps generated. Code might be empty or invalid.",
        );
      }

      const firstStepSnapshot = steps[0]?.snapshot;
      // Extract the state we want to apply, ignoring control flags from snapshot
      // but keeping the snapshot data (callStack, scopeChain, etc.)
      const snapshotState = firstStepSnapshot
        ? ({ ...firstStepSnapshot } as any)
        : {};

      // Remove properties that might conflict or are not needed from snapshot
      delete snapshotState.isPlaying;
      delete snapshotState.isExecuting;
      delete snapshotState.executionSpeed;

      set({
        steps,
        currentStepIndex: 0,
        // Apply snapshot state (memory, stack, etc)
        ...snapshotState,
        // Explicitly set control flags
        isPlaying: !startPaused,
        isExecuting: true,
        isInitializing: false,
      });

      // Log success for debugging
      set((state) => ({
        consoleOutput: [
          ...state.consoleOutput,
          {
            id: "system-start",
            type: "info",
            content: [`Execution started. Steps generated: ${steps.length}`],
            timestamp: Date.now(),
          },
        ],
      }));
    } catch (error) {
      console.error("Failed to execute code:", error);
      set({
        isInitializing: false,
        consoleOutput: [
          {
            id: "error",
            type: "error",
            content: ["Failed to parse/execute code: " + String(error)],
            timestamp: Date.now(),
          },
        ],
      });
    }
  },

  pauseExecution: () => set({ isPlaying: false }),
  resumeExecution: () => set({ isPlaying: true }),

  stopExecution: () =>
    set({
      isPlaying: false,
      isExecuting: false,
      currentStepIndex: -1,
      ...initialState,
    }),

  nextStep: () => {
    const { currentStepIndex, steps, isPlaying, isExecuting, executionSpeed } =
      get();
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const step = steps[nextIndex];
      // Restore snapshot but preserve control flags
      const stepSnapshot = { ...step.snapshot } as any;
      delete stepSnapshot.isPlaying;
      delete stepSnapshot.isExecuting;
      delete stepSnapshot.executionSpeed;

      set({
        currentStepIndex: nextIndex,
        ...stepSnapshot,
        // Ensure control flags are preserved
        isPlaying,
        isExecuting,
        executionSpeed,
      });
    } else {
      set({ isPlaying: false });
    }
  },

  prevStep: () => {
    const { currentStepIndex, steps, isPlaying, isExecuting, executionSpeed } =
      get();
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const step = steps[prevIndex];
      const stepSnapshot = { ...step.snapshot } as any;
      delete stepSnapshot.isPlaying;
      delete stepSnapshot.isExecuting;
      delete stepSnapshot.executionSpeed;

      set({
        currentStepIndex: prevIndex,
        ...stepSnapshot,
        isPlaying,
        isExecuting,
        executionSpeed,
      });
    } else if (currentStepIndex === 0) {
      set({
        currentStepIndex: -1,
        ...initialState,
        code: get().code,
        steps: get().steps,
        // Preserve control flags if needed, though usually resetting goes to start
        isExecuting,
        executionSpeed,
      });
    }
  },

  jumpToStep: (stepIndex) => {
    const { steps, isPlaying, isExecuting, executionSpeed } = get();
    if (stepIndex >= -1 && stepIndex < steps.length) {
      if (stepIndex === -1) {
        set({
          currentStepIndex: -1,
          ...initialState,
          code: get().code,
          steps: get().steps,
          isExecuting,
          executionSpeed,
        });
      } else {
        const step = steps[stepIndex];
        const stepSnapshot = { ...step.snapshot } as any;
        delete stepSnapshot.isPlaying;
        delete stepSnapshot.isExecuting;
        delete stepSnapshot.executionSpeed;

        set({
          currentStepIndex: stepIndex,
          ...stepSnapshot,
          isPlaying,
          isExecuting,
          executionSpeed,
        });
      }
    }
  },

  setSpeed: (speed) => set({ executionSpeed: speed }),

  reset: () =>
    set({
      ...initialState,
      code: get().code,
      steps: [],
      currentStepIndex: -1,
    }),

  addConsoleMessage: (message) =>
    set((state) => ({
      consoleOutput: [...state.consoleOutput, message],
    })),

  clearConsole: () => set({ consoleOutput: [] }),
}));
