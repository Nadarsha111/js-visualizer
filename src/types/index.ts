export interface VisualizationState {
  executionStep: number;
  callStack: CallFrame[];
  scopeChain: Scope[];
  memoryHeap: MemoryObject[];
  eventLoop: EventLoopState;
  variables: Variable[];
  consoleOutput: ConsoleMessage[];
  isExecuting: boolean;
  executionSpeed: number;
}

export interface CallFrame {
  id: string;
  functionName: string;
  fileName?: string;
  lineNumber: number;
  columnNumber?: number;
  arguments: any[];
  localVariables: Record<string, any>;
  scopeId: string;
  thisObject: any;
}

export interface Scope {
  id: string;
  type: "global" | "function" | "block" | "module";
  name?: string;
  variables: Record<string, any>;
  parentId?: string;
  startLine?: number;
  endLine?: number;
}

export interface MemoryObject {
  id: string;
  type: string;
  value: any;
  references: number;
}

export interface Variable {
  name: string;
  value: any;
  type: string;
  scopeId: string;
  isConst: boolean;
  isLet: boolean;
}

export interface ConsoleMessage {
  id: string;
  type: "log" | "error" | "warn" | "info";
  content: any[];
  timestamp: number;
}

export interface EventLoopState {
  callStack: CallFrame[];
  callbackQueue: Task[];
  microtaskQueue: Task[];
  currentlyExecuting?: Task;
}

export interface Task {
  id: string;
  type: "macro" | "micro";
  description: string;
  callback: any;
  createdAt: number;
}

export interface ExecutionStep {
  step: number;
  line: number;
  column: number;
  snapshot: VisualizationState;
  description: string;
}
