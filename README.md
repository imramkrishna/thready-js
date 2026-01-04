# 🧵 Thready

A lightweight, type-safe thread pool implementation for JavaScript and TypeScript that enables true multithreading using Web Workers.

> **Note:** Thready is a worker pool manager only. You provide your own worker script with your custom logic.

[![npm version](https://img.shields.io/npm/v/thready.svg)](https://www.npmjs.com/package/thready)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Features

- ✨ **Simple API** - Easy to use singleton pattern for quick integration
- 🔄 **Worker Pooling** - Efficiently reuses worker threads instead of creating new ones
- 📦 **Zero Dependencies** - No external dependencies, just pure JavaScript
- 💪 **TypeScript Support** - Full type definitions included
- ⚡ **Performance** - Supports transferable objects for zero-copy data transfer
- 🎯 **Smart Queue Management** - Automatically manages task queuing and load balancing
- 🔍 **Statistics** - Built-in monitoring of pool state and performance
- 🎨 **Bring Your Own Worker** - You write the worker logic, we handle the pooling

## Installation

```bash
npm install thready
```

or with yarn:

```bash
yarn add thready
```

## Quick Start

### 1. Create Your Worker Script

**Important:** You must create your own worker script. Thready doesn't include any built-in worker logic - it only manages the worker pool.

Create a worker script that handles your specific tasks:

```javascript
// worker.js
self.onmessage = (event) => {
  const { id, taskType, payload } = event.data;

  try {
    let result;
    
    switch (taskType) {
      case 'fibonacci':
        result = fibonacci(payload);
        break;
      case 'processData':
        result = processData(payload);
        break;
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }

    self.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    self.postMessage({ id, type: 'error', payload: error.message });
  }
};

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function processData(data) {
  // Your heavy computation here
  return data.map(x => x * 2);
}
```

### 2. Initialize and Use the Thread Pool

```javascript
import { threadPool } from 'thready';

// Initialize the pool once at app startup with YOUR worker script
threadPool.init({
  maxWorkers: 4, // Optional: defaults to CPU cores
  worker: './worker.js' // Path to YOUR worker script
});

// Execute tasks anywhere in your application
async function calculate() {
  try {
    const result = await threadPool.execute('fibonacci', 40);
    console.log('Result:', result);
  } catch (error) {
    console.error('Task failed:', error);
  }
}

// Don't forget to cleanup on shutdown
process.on('SIGINT', () => {
  threadPool.shutdown();
  process.exit(0);
});
```

## Advanced Usage

### Using with Vite or Webpack

When using module bundlers, you can pass a worker factory function:

```javascript
import { threadPool } from 'thready';

// Vite
threadPool.init({
  worker: () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
});

// Webpack 5
threadPool.init({
  worker: () => new Worker(new URL('./worker.js', import.meta.url))
});
```

### Transferable Objects (Zero-Copy)

For better performance with large data, use transferables:

```javascript
async function processImage(imageData) {
  const buffer = imageData.buffer;
  
  // Transfer ownership of the buffer (zero-copy)
  const result = await threadPool.execute(
    'processImage',
    buffer,
    [buffer] // Transferables array
  );
  
  return result;
}
```

### Using WorkerPool Directly

For more control, you can use the `WorkerPool` class directly:

```javascript
import { WorkerPool } from 'thready';

const pool = new WorkerPool({
  maxWorkers: 8,
  worker: './worker.js' // Your worker implementation
});

const result = await pool.run('taskType', payload);

// Get statistics
const stats = pool.getStats();
console.log(stats);
// {
//   totalWorkers: 8,
//   availableWorkers: 6,
//   activeTasks: 2,
//   queuedTasks: 0
// }

// Cleanup
pool.terminate();
```

### Monitoring Pool Statistics

```javascript
import { threadPool } from 'thready';

const stats = threadPool.getStats();
console.log('Pool status:', stats);
// {
//   totalWorkers: 4,
//   availableWorkers: 2,
//   activeTasks: 2,
//   queuedTasks: 5
// }
```

## Framework Examples

### React

```jsx
import { threadPool } from 'thready';
import { useEffect, useState } from 'react';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize on mount with your worker
    threadPool.init({
      maxWorkers: 4,
      worker: '/worker.js' // Your worker script in public folder
    });

    // Cleanup on unmount
    return () => threadPool.shutdown();
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await threadPool.execute('fibonacci', 40);
      setResult(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={loading}>
        {loading ? 'Calculating...' : 'Calculate Fibonacci'}
      </button>
      {result && <p>Result: {result}</p>}
    </div>
  );
}
```

### Node.js with Worker Threads

For Node.js environments, use worker_threads:

```javascript
// worker.mjs
import { parentPort } from 'worker_threads';

parentPort.on('message', (message) => {
  const { id, taskType, payload } = message;
  
  try {
    let result;
    // Process your task
    result = processTask(taskType, payload);
    
    parentPort.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    parentPort.postMessage({ id, type: 'error', payload: error.message });
  }
});
```

## API Reference

### `threadPool`

The singleton instance for managing workers globally.

#### Methods

- **`init(config: WorkerPoolConfig): void`**
  
  Initializes the thread pool with your worker implementation. Must be called before executing tasks.
  
  - `config.maxWorkers` (optional): Maximum number of workers (defaults to CPU cores)
  - `config.worker`: Path to YOUR worker script or factory function that returns a Worker

- **`execute<T>(taskType: string, payload: any, transferables?: Transferable[]): Promise<T>`**
  
  Executes a task on the thread pool.
  
  - `taskType`: Identifier for the type of work
  - `payload`: Data to be processed
  - `transferables` (optional): Array of transferable objects
  - Returns: Promise resolving to the result

- **`getStats(): object | null`**
  
  Returns current pool statistics or null if not initialized.

- **`shutdown(): void`**
  
  Terminates all workers and releases resources.

### `WorkerPool`

The underlying pool implementation for direct usage.

#### Constructor

```typescript
new WorkerPool(config: WorkerPoolConfig)
```

#### Methods

- **`run<T>(taskType: string, payload: any, transferables?: Transferable[]): Promise<T>`**
- **`getStats(): object`**
- **`terminate(): void`**

## TypeScript

Full TypeScript support with exported types:

```typescript
import { 
  threadPool, 
  WorkerPool,
  type WorkerPoolConfig,
  type WorkerMessage,
  type WorkerResponse,
  type Task
} from 'thready';

// Custom typed execution
interface CalculationResult {
  value: number;
  duration: number;
}

const result = await threadPool.execute<CalculationResult>('calculate', { n: 100 });
```

## Best Practices

1. **Write Your Own Worker**: Create a worker script tailored to your specific needs
2. **Initialize Once**: Call `threadPool.init()` only once at application startup
3. **Keep Workers Pure**: Worker scripts should be framework-agnostic and focused
4. **Cleanup**: Always call `shutdown()` when your application closes
5. **Transferables**: Use transferables for large data (ArrayBuffers, ImageData) to avoid copying
6. **Error Handling**: Always wrap `execute()` calls in try-catch blocks
7. **Task Granularity**: Break large tasks into smaller chunks for better load balancing

## Performance Tips

- Use transferables for data > 1MB
- Initialize the pool with `maxWorkers` matching your typical workload
- Monitor stats to tune pool size
- Reuse the same worker script for multiple task types
- Avoid creating new pools frequently

## Browser Support

Works in all modern browsers that support Web Workers:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge (all versions)

## License

ISC © Ram Krishna Yadav

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Issues

Found a bug or have a feature request? [Open an issue](https://github.com/imramkrishna/Thready/issues)

## Links

- [GitHub Repository](https://github.com/imramkrishna/Thready)
- [npm Package](https://www.npmjs.com/package/thready)
