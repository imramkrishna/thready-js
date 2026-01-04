# 🚀 Quick Start Guide - Thready

> **Important:** Thready only manages the worker pool. You must create your own worker script with your custom logic.

## Install

```bash
npm install thready
```

## 3-Step Setup

### Step 1: Create Your Worker File

**You must create your own worker script.** Here's an example:

Create `worker.js` in your project:

```javascript
self.onmessage = (event) => {
  const { id, taskType, payload } = event.data;
  
  try {
    let result;
    
    if (taskType === 'fibonacci') {
      result = fibonacci(payload);
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
```

### Step 2: Initialize Thread Pool

```javascript
import { threadPool } from 'thready';

threadPool.init({
  maxWorkers: 4,
  worker: './worker.js' // Path to YOUR worker script
});
```

### Step 3: Execute Tasks

```javascript
async function calculate() {
  const result = await threadPool.execute('fibonacci', 40);
  console.log('Result:', result);
}

calculate();
```

## Common Use Cases

### Parallel Processing

```javascript
const tasks = [30, 32, 34, 36, 38].map(n => 
  threadPool.execute('fibonacci', n)
);
const results = await Promise.all(tasks);
```

### With React

```jsx
import { threadPool } from 'thready';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    threadPool.init({ maxWorkers: 4, worker: '/worker.js' });
    return () => threadPool.shutdown();
  }, []);
  
  const handleClick = async () => {
    const result = await threadPool.execute('fibonacci', 40);
    console.log(result);
  };
  
  return <button onClick={handleClick}>Calculate</button>;
}
```

### With Vite

```javascript
threadPool.init({
  worker: () => new Worker(
    new URL('./worker.js', import.meta.url),
    { type: 'module' }
  )
});
```

## API

```javascript
// Initialize with your worker
threadPool.init({ maxWorkers: 4, worker: './your-worker.js' });

// Execute task
await threadPool.execute(taskType, payload, transferables?);

// Get statistics
const stats = threadPool.getStats();

// Cleanup
threadPool.shutdown();
```

## Need More?

See [README.md](README.md) for full documentation.

Happy threading! 🧵
