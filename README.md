# JavaScript Execution Visualizer

A powerful educational tool for visualizing JavaScript code execution at the engine level. Built with React, TypeScript, and Vite.

## Features

- **Real-time Visualization**: Watch the Call Stack, Scope Chain, and Memory Heap update as your code runs.
- **Event Loop Visualization**: Understand how the Event Loop handles Microtasks and Macrotasks (Callbacks).
- **Step-by-Step Execution**: Control execution with Play, Pause, Next Step, and Previous Step buttons.
- **Interactive Code Editor**: Write and edit JavaScript code with syntax highlighting (powered by Monaco Editor).
- **Console Output**: See `console.log` output in real-time.
- **Variable Inspector**: Inspect variable values in different scopes.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: TailwindCSS, HeadlessUI, Lucide React
- **State Management**: Zustand
- **Editor**: Monaco Editor
- **Parsing**: Acorn
- **Animation**: Framer Motion

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open in Browser**:
    Navigate to `http://localhost:5173`

## How it Works

The application uses a custom JavaScript interpreter (built on top of `acorn` parser) to execute code step-by-step.
- **Parsing**: Code is parsed into an AST (Abstract Syntax Tree).
- **Interpretation**: The AST is traversed, and for each significant operation (variable declaration, function call, etc.), a "snapshot" of the state is recorded.
- **Visualization**: The React frontend renders these snapshots, allowing you to time-travel through the execution.

## Supported Features

- Variable declarations (`var`, `let`, `const`)
- Function declarations and calls
- Closures and Scope Chain
- `setTimeout` (Event Loop demonstration)
- `console.log`
- Basic arithmetic and logic operations

## License

MIT
