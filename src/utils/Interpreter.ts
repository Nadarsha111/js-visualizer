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

        // After macrotask, check microtasks again!
        while (this.state.eventLoop.microtaskQueue.length > 0) {
          const microTask = this.state.eventLoop.microtaskQueue.shift()!;
          this.executeTask(microTask);
        }
      }
    }
  }

  private executeTask(task: Task) {
    // If callback is a function (internal helper), execute it directly
    if (typeof task.callback === "function") {
      this.createSnapshot(
        0,
        `Executing ${task.type} task: ${task.description}`,
      );
      task.callback();
      return;
    }

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
      case "IfStatement":
        return this.visitIfStatement(node);
      case "ForStatement":
        return this.visitForStatement(node);
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
      case "AssignmentExpression":
        return this.visitAssignmentExpression(node);
      case "UpdateExpression":
        return this.visitUpdateExpression(node);
      case "FunctionDeclaration":
        return this.visitFunctionDeclaration(node);
      case "BlockStatement":
        return this.visitBlock(node.body, true);
      case "ArrowFunctionExpression":
        return node; // Return the node itself to be used as callback
      case "FunctionExpression":
        return node;
      case "ArrayExpression":
        return node.elements.map((el: any) => this.visit(el));
      case "MemberExpression":
        return this.visitMemberExpression(node);
      case "LogicalExpression":
        return this.visitLogicalExpression(node);
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
      case "===":
        return left === right;
      case "!==":
        return left !== right;
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      default:
        return undefined;
    }
  }

  private visitForStatement(node: any) {
    if (node.init) {
      if (node.init.type === "VariableDeclaration") {
        this.visitVariableDeclaration(node.init);
      } else {
        this.visit(node.init);
      }
    }

    while (true) {
      if (node.test) {
        const testResult = this.visit(node.test);
        if (!testResult) break;
      }

      this.visit(node.body);

      if (node.update) {
        this.visit(node.update);
      }
    }
  }

  private visitIfStatement(node: any) {
    const testResult = this.visit(node.test);

    if (testResult) {
      this.createSnapshot(node.loc.start.line, "If condition true");
      return this.visit(node.consequent);
    } else if (node.alternate) {
      this.createSnapshot(node.loc.start.line, "If condition false");
      return this.visit(node.alternate);
    }

    return undefined;
  }

  private visitLogicalExpression(node: any) {
    switch (node.operator) {
      case "||": {
        const left = this.visit(node.left);
        if (left) return left;
        return this.visit(node.right);
      }
      case "&&": {
        const left = this.visit(node.left);
        if (!left) return left;
        return this.visit(node.right);
      }
      default:
        return undefined;
    }
  }

  private visitMemberExpression(node: any) {
    const obj = this.visit(node.object);
    if (node.computed) {
      const prop = this.visit(node.property);
      return obj[prop];
    }
    const propName = node.property.name;
    return obj[propName];
  }

  private assignToPattern(target: any, value: any) {
    if (target.type === "Identifier") {
      try {
        this.updateVariable(target.name, value);
      } catch {
        this.addVariable(target.name, value, "let");
      }
      return;
    }

    if (target.type === "MemberExpression") {
      const obj = this.visit(target.object);
      const prop = target.computed
        ? this.visit(target.property)
        : target.property.name;
      obj[prop] = value;
      return;
    }
  }

  private visitAssignmentExpression(node: any) {
    if (node.operator !== "=") {
      return undefined;
    }

    if (node.left.type === "ArrayPattern") {
      const rightVal = this.visit(node.right);
      if (!Array.isArray(rightVal)) {
        return undefined;
      }
      node.left.elements.forEach((el: any, index: number) => {
        if (!el) return;
        this.assignToPattern(el, rightVal[index]);
      });
      return rightVal;
    }

    const value = this.visit(node.right);
    this.assignToPattern(node.left, value);
    return value;
  }

  private visitUpdateExpression(node: any) {
    const isIncrement = node.operator === "++";
    const isDecrement = node.operator === "--";
    if (!isIncrement && !isDecrement) {
      return undefined;
    }

    let oldValue;
    let newValue;

    if (node.argument.type === "Identifier") {
      oldValue = this.getVariable(node.argument.name);
      newValue = isIncrement ? oldValue + 1 : oldValue - 1;
      this.updateVariable(node.argument.name, newValue);
    } else if (node.argument.type === "MemberExpression") {
      const obj = this.visit(node.argument.object);
      const prop = node.argument.computed
        ? this.visit(node.argument.property)
        : node.argument.property.name;
      oldValue = obj[prop];
      newValue = isIncrement ? oldValue + 1 : oldValue - 1;
      obj[prop] = newValue;
    } else {
      return undefined;
    }

    return node.prefix ? newValue : oldValue;
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

    // Handle Promise.all
    if (
      node.callee.type === "MemberExpression" &&
      node.callee.object.name === "Promise" &&
      node.callee.property.name === "all"
    ) {
      const args = node.arguments.map((arg: any) => this.visit(arg));
      return this.handlePromiseAll(args[0]);
    }

    // Handle Promise.race
    if (
      node.callee.type === "MemberExpression" &&
      node.callee.object.name === "Promise" &&
      node.callee.property.name === "race"
    ) {
      const args = node.arguments.map((arg: any) => this.visit(arg));
      // Simple race implementation: first one to resolve wins
      // We can reuse handlePromiseAll logic but resolve on first completion
      // For now, let's just use handlePromiseRace placeholder
      return this.handlePromiseRace(args[0]);
    }

    // Handle .then()
    if (
      node.callee.type === "MemberExpression" &&
      node.callee.property.name === "then"
    ) {
      const obj = this.visit(node.callee.object);
      if (obj && obj.__type === "Promise") {
        return this.handlePromiseThen(obj, node.arguments[0]);
      }
    }

    // Handle setTimeout
    if (
      node.callee.type === "Identifier" &&
      node.callee.name === "setTimeout"
    ) {
      const callbackNode = node.arguments[0];
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

    // Handle fetch
    if (node.callee.type === "Identifier" && node.callee.name === "fetch") {
      const url = this.visit(node.arguments[0]);
      return this.handleFetch(url);
    }

    let funcName = "";
    let func;

    if (node.callee.type === "Identifier") {
      funcName = node.callee.name;
      func = this.getVariable(funcName);
    } else {
      // It might be a MemberExpression or other expression that returns a function
      func = this.visit(node.callee);
      funcName = func?.name || "anonymous";
    }

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

  // Helper to create a promise object
  private createPromise() {
    return {
      __type: "Promise",
      id: uuidv4(),
      state: "pending",
      value: undefined,
      handlers: [] as any[],
    };
  }

  // Helper to resolve a promise
  private resolvePromise(promise: any, value: any) {
    if (promise.state !== "pending") return;
    promise.state = "fulfilled";
    promise.value = value;

    // Queue microtasks for handlers
    promise.handlers.forEach((handler: any) => {
      this.state.eventLoop.microtaskQueue.push({
        id: uuidv4(),
        type: "micro",
        description: "Promise reaction",
        callback: () => {
          handler(value);
        },
        createdAt: Date.now(),
      });
    });
    promise.handlers = [];
  }

  private handleFetch(url: string) {
    const promise = this.createPromise();

    // Schedule macro task for network response
    this.state.eventLoop.callbackQueue.push({
      id: uuidv4(),
      type: "macro",
      description: `Fetch response from ${url}`,
      callback: () => {
        this.resolvePromise(promise, { status: 200, url });
      },
      createdAt: Date.now(),
    });

    return promise;
  }

  private handlePromiseAll(promises: any[]) {
    const resultPromise = this.createPromise();
    if (!Array.isArray(promises) || promises.length === 0) {
      this.resolvePromise(resultPromise, []);
      return resultPromise;
    }

    const results = new Array(promises.length);
    let completed = 0;

    promises.forEach((p, index) => {
      if (p && p.__type === "Promise") {
        if (p.state === "fulfilled") {
          results[index] = p.value;
          completed++;
        } else {
          p.handlers.push((val: any) => {
            results[index] = val;
            completed++;
            if (completed === promises.length) {
              this.resolvePromise(resultPromise, results);
            }
          });
        }
      } else {
        results[index] = p;
        completed++;
      }
    });

    if (completed === promises.length) {
      this.resolvePromise(resultPromise, results);
    }

    return resultPromise;
  }

  private handlePromiseRace(promises: any[]) {
    const resultPromise = this.createPromise();
    if (!Array.isArray(promises) || promises.length === 0) {
      // Promise.race([]) stays pending forever
      return resultPromise;
    }

    promises.forEach((p) => {
      if (p && p.__type === "Promise") {
        if (p.state === "fulfilled") {
          this.resolvePromise(resultPromise, p.value);
        } else {
          p.handlers.push((val: any) => {
            this.resolvePromise(resultPromise, val);
          });
        }
      } else {
        this.resolvePromise(resultPromise, p);
      }
    });

    return resultPromise;
  }

  private handlePromiseThen(promise: any, onFulfilledNode: any) {
    const nextPromise = this.createPromise();

    const handler = (val: any) => {
      if (onFulfilledNode) {
        // Create a scope and execute the function
        let func = onFulfilledNode;
        if (onFulfilledNode.type === "Identifier") {
          func = this.getVariable(onFulfilledNode.name);
        } else if (onFulfilledNode.type === "MemberExpression") {
          // Not supported in this simple version
          func = undefined;
        }

        if (
          func &&
          (func.type === "function" ||
            func.type === "FunctionExpression" ||
            func.type === "ArrowFunctionExpression")
        ) {
          this.createSnapshot(0, "Executing .then callback");

          // Determine function name
          const funcName = func.name || func.id?.name || "anonymous";

          // Push Stack
          const frame: CallFrame = {
            id: uuidv4(),
            functionName: funcName,
            lineNumber: 0,
            arguments: [val],
            localVariables: {},
            scopeId: uuidv4(),
            thisObject: {},
          };
          this.state.callStack.push(frame);

          // Create Scope
          this.createScope("function", funcName);

          // Bind arg
          const paramName = func.params?.[0]?.name;
          if (paramName) {
            this.addVariable(paramName, val, "let");
          }

          // Visit body
          const result = this.visit(func.body);

          // Pop
          this.popScope();
          this.state.callStack.pop();

          this.resolvePromise(nextPromise, result);
        } else {
          this.resolvePromise(nextPromise, val);
        }
      } else {
        this.resolvePromise(nextPromise, val);
      }
    };

    if (promise.state === "fulfilled") {
      this.state.eventLoop.microtaskQueue.push({
        id: uuidv4(),
        type: "micro",
        description: "Promise.then callback",
        callback: () => handler(promise.value),
        createdAt: Date.now(),
      });
    } else {
      promise.handlers.push(handler);
    }

    return nextPromise;
  }
}
