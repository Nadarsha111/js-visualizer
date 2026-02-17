
export const formatValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `[Array(${value.length})]`;
    // Check if it's a function object stored as object
    if (value.type === 'function' && value.body) return `[Function: ${value.name}]`;
    
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Circular Object]';
    }
  }
  return String(value);
};

export const safeStringify = (value: any, space?: number): string => {
  const cache = new Set();
  return JSON.stringify(
    value,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          // Circular reference found
          return '[Circular]';
        }
        cache.add(value);
      }
      return value;
    },
    space
  );
};
