import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useVisualizationStore } from '../../store/visualizationStore';

interface CodeEditorProps {
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ readOnly = false }) => {
  const { code, setCode, currentStepIndex, steps } = useVisualizationStore();
  const editorRef = React.useRef<any>(null);
  const decorationsRef = React.useRef<string[]>([]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  // Effect to highlight the current line of execution
  React.useEffect(() => {
    if (editorRef.current && currentStepIndex >= 0 && steps[currentStepIndex]) {
      const step = steps[currentStepIndex];
      const line = step.line;
      
      if (line > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: {
                startLineNumber: line,
                startColumn: 1,
                endLineNumber: line,
                endColumn: 1
              },
              options: {
                isWholeLine: true,
                className: 'bg-yellow-500/30 border-l-4 border-yellow-500',
                glyphMarginClassName: 'bg-yellow-500 w-2 h-2 rounded-full ml-1'
              }
            }
          ]
        );
        
        // Reveal the line
        editorRef.current.revealLineInCenter(line);
      }
    } else if (editorRef.current) {
      // Clear decorations if no step is active
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentStepIndex, steps]);

  return (
    <div className="h-full w-full border border-gray-700 rounded-lg overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', monospace",
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
