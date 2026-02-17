import * as acorn from "acorn";
import {
  VisualizationState,
  CallFrame,
  Scope,
  MemoryObject,
  Variable,
  ConsoleMessage,
  ExecutionStep,
  EventLoopState,
  Task,
} from "../types";
import { v4 as uuidv4 } from "uuid";

export class Interpreter {
  private code: string;
  private ast: any;
  private state: VisualizationState;
  private steps: ExecutionStep[] = [];
  private stepCount: number = 0;

  constructor(code: string) {
    this.code = code;
    this.ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
    this.state = {
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

    // Initialize Global Scope
    this.createScope("global", "Global");
  }

  public execute(): ExecutionStep[] {
    try {
      this.stepCount = 0;
      this.steps = [];
      this.visit(this.ast);
      this.runEventLoop();
    } catch (error) {
      console.error("Execution error:", error);
      this.addConsoleMessage("error", [String(error)]);
    }
    return this.steps;
  }

  private runEventLoop() {
    let loopLimit = 100; // Prevent infinite loops in visualization
    while (
      (this.state.eventLoop.microtaskQueue.length > 0 ||
        this.state.eventLoop.callbackQueue.length > 0) &&
      loopLimit > 0
    ) {
      loopLimit--;

      // Process all microtasks
      while (this.state.eventLoop.microtaskQueue.length > 0) {
        const task = this.state.eventLoop.microtaskQueue.shift()!;
        this.executeTask(task);
      }

      // Process ONE macrotask
      if (this.state.eventLoop.callbackQueue.length > 0) {
        const task = this.state.eventLoop.callbackQueue.shift()!;
        this.executeTask(task);
      }
    }
  }

  private executeTask(task: Task) {
    this.createSnapshot(
      (task.callback as any).loc.start.line,
      `Executing ${task.type} task: ${task.description}`,
    );

    // We need to handle closure here properly in a real engine,
    // but for this visualizer we'll use the current scope chain (which is global usually at this point)
    // or we should have captured the scope when task was created.

    const body = (task.callback as any).body;
    if (body.type === "BlockStatement") {
      this.visitBlock(body.body, true);
    } else {
      this.visit(body);
    }
  }

  private createSnapshot(line: number, description: string): void {
    this.stepCount++;
    this.state.executionStep = this.stepCount;

    // Deep copy state for snapshot
    // Use a custom clone function to handle circular references and avoid DataCloneError
    const snapshot: VisualizationState = this.cloneState(this.state);

    this.steps.push({
      step: this.stepCount,
      line,
      column: 0,
      snapshot,
      description,
    });
  }

  private cloneState(state: VisualizationState): VisualizationState {
    const seen = new WeakMap();

    const clone = (obj: any): any => {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      if (seen.has(obj)) {
        return seen.get(obj);
      }

      if (Array.isArray(obj)) {
        const arr: any[] = [];
        seen.set(obj, arr);
        for (let i = 0; i < obj.length; i++) {
          arr[i] = clone(obj[i]);
        }
        return arr;
      }

      const res: any = {};
      seen.set(obj, res);
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          res[key] = clone(obj[key]);
        }
      }
      return res;
    };

    return clone(state);
  }

  private createScope(type: Scope["type"], name?: string, parentId?: string) {
    const scope: Scope = {
      id: uuidv4(),
      type,
      name,
      variables: {},
      parentId,
    };
    this.state.scopeChain.unshift(scope);
    return scope;
  }

  private popScope() {
    this.state.scopeChain.shift();
  }

  private addVariable(name: string, value: any, kind: "var" | "let" | "const") {
    const currentScope = this.state.scopeChain[0];
    if (currentScope) {
      currentScope.variables[name] = value;
      this.state.variables.push({
        name,
        value,
        type: typeof value,
        scopeId: currentScope.id,
        isConst: kind === "const",
        isLet: kind === "let",
      });
    }
  }

  private updateVariable(name: string, value: any) {
    for (const scope of this.state.scopeChain) {
      if (name in scope.variables) {
        scope.variables[name] = value;
        return;
      }
    }
    throw new Error(`Variable '${name}' is not defined`);
  }

  private getVariable(name: string): any {
    for (const scope of this.state.scopeChain) {
      if (name in scope.variables) {
        return scope.variables[name];
      }
    }
    throw new Error(`Variable '${name}' is not defined`);
  }

  private addConsoleMessage(type: ConsoleMessage["type"], content: any[]) {
    const message: ConsoleMessage = {
      id: uuidv4(),
      type,
      content,
      timestamp: Date.now(),
    };
    this.state.consoleOutput.push(message);
  }

  private visit(node: any): any {
    if (!node) return;

    switch (node.type) {
      case "Program":
        return this.visitBlock(node.body);
      case "VariableDeclaration":
        return this.visitVariableDeclaration(node);
      case "ExpressionStatement":
        this.createSnapshot(node.loc.start.line, "Executing expression");
        return this.visit(node.expression);
      case "CallExpression":
        return this.visitCallExpression(node);
      case "Literal":
        return node.value;
      case "Identifier":
        return this.getVariable(node.name);
      case "BinaryExpression":
        return this.visitBinaryExpression(node);
      case "FunctionDeclaration":
        return this.visitFunctionDeclaration(node);
      case "BlockStatement":
        return this.visitBlock(node.body, true);
      case "ArrowFunctionExpression":
        return node; // Return the node itself to be used as callback
      case "FunctionExpression":
        return node;
      case "ReturnStatement":
        this.createSnapshot(node.loc.start.line, "Returning value");
        return this.visit(node.argument);
      default:
        console.warn(`Unsupported node type: ${node.type}`);
        return undefined;
    }
  }

  private visitBlock(body: any[], createNewScope = false) {
    if (createNewScope) {
      this.createScope("block");
    }

    let result;
    for (const statement of body) {
      result = this.visit(statement);
    }

    if (createNewScope) {
      this.popScope();
    }
    return result;
  }

  private visitVariableDeclaration(node: any) {
    this.createSnapshot(node.loc.start.line, "Declaring variable");
    for (const declaration of node.declarations) {
      const name = declaration.id.name;
      const value = declaration.init ? this.visit(declaration.init) : undefined;
      this.addVariable(name, value, node.kind);
    }
  }

  private visitBinaryExpression(node: any) {
    const left = this.visit(node.left);
    const right = this.visit(node.right);
    switch (node.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      default:
        return undefined;
    }
  }

  private visitFunctionDeclaration(node: any) {
    this.createSnapshot(
      node.loc.start.line,
      `Declaring function ${node.id.name}`,
    );
    const func = {
      type: "function",
      name: node.id.name,
      params: node.params.map((p: any) => p.name),
      body: node.body,
      closure: [...this.state.scopeChain],
    };
    this.addVariable(node.id.name, func, "var");
  }

  private visitCallExpression(node: any) {
    this.createSnapshot(node.loc.start.line, "Function call");

    // Handle console.log
    if (
      node.callee.type === "MemberExpression" &&
      node.callee.object.name === "console" &&
      node.callee.property.name === "log"
    ) {
      const args = node.arguments.map((arg: any) => this.visit(arg));
      this.addConsoleMessage("log", args);
      return;
    }

    // Handle setTimeout
    if (node.callee.name === "setTimeout") {
      const callbackNode = node.arguments[0];
      // const delay = node.arguments[1]?.value || 0; // We ignore delay for visualization steps ordering usually, or handle it?
      // In this simple visualizer, we just push to callbackQueue.

      const task: Task = {
        id: uuidv4(),
        type: "macro",
        description: "setTimeout callback",
        callback: callbackNode,
        createdAt: Date.now(),
      };

      this.state.eventLoop.callbackQueue.push(task);
      this.createSnapshot(node.loc.start.line, "Scheduled setTimeout");
      return;
    }

    const funcName = node.callee.name;
    const func = this.getVariable(funcName);

    if (func && func.type === "function") {
      const args = node.arguments.map((arg: any) => this.visit(arg));

      // Push Call Stack
      const frame: CallFrame = {
        id: uuidv4(),
        functionName: funcName,
        lineNumber: node.loc.start.line,
        arguments: args,
        localVariables: {},
        scopeId: uuidv4(),
        thisObject: {},
      };
      this.state.callStack.push(frame);

      // Create Function Scope
      this.createScope("function", funcName);

      // Bind arguments
      func.params.forEach((param: string, index: number) => {
        this.addVariable(param, args[index], "let");
      });

      // Execute body
      const result = this.visit(func.body);

      // Pop Call Stack and Scope
      this.popScope();
      this.state.callStack.pop();

      return result;
    }
  }
}
