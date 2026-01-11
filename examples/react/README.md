# Thready React Example

A comprehensive React example demonstrating the usage of Thready for multi-threaded computation in web applications.

## Features Demonstrated

- **Fibonacci Calculator**: Calculate large Fibonacci numbers without blocking the UI
- **Prime Number Finder**: Find prime numbers using the Sieve of Eratosthenes algorithm
- **Image Processing**: Process image data with transferable objects for zero-copy performance
- **Parallel Execution**: Run multiple tasks simultaneously using the thread pool
- **Real-time Statistics**: Monitor thread pool activity and performance

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Running the Example

```bash
# Start the development server
npm run dev
```

The application will open at `http://localhost:3000`

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
react/
├── src/
│   ├── thready-js/
│   │   ├── thready.config.js    # Thready configuration
│   │   └── thready.worker.js    # Web Worker implementation
│   ├── App.jsx                  # Main application component
│   ├── App.css                  # Application styles
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── vite.config.js              # Vite configuration
└── package.json                # Project dependencies
```

## How It Works

### 1. Worker Configuration

The `thready.config.js` file initializes Thready with a Web Worker:

```javascript
import thready from 'thready-js';

thready.init({
  maxWorkers: 4,
  worker: () => new Worker(
    new URL('./thready.worker.js', import.meta.url),
    { type: 'module' }
  ),
});

export default thready;
```

### 2. Worker Implementation

The `thready.worker.js` file handles different task types:

```javascript
self.onmessage = function(event) {
  const { id, taskType, payload } = event.data;
  
  switch (taskType) {
    case 'fibonacci':
      result = fibonacci(payload);
      break;
    // ... other tasks
  }
  
  self.postMessage({ id, type: 'result', payload: result });
};
```

### 3. Using Thready in React

```javascript
import thready from './thready-js/thready.config';

function App() {
  const calculateFibonacci = async () => {
    const result = await thready.execute('fibonacci', 30);
    console.log(result);
  };
  
  // ... rest of the component
}
```

## Key Concepts

### Thread Pool Management

Thready automatically manages a pool of Web Workers, reusing them for multiple tasks:

- Workers are created on-demand up to `maxWorkers`
- Idle workers are reused for new tasks
- Tasks are queued when all workers are busy
- Get pool statistics with `thready.getPoolStats()`

### Transferable Objects

For large data like images or buffers, use transferable objects for zero-copy transfer:

```javascript
const result = await thready.execute(
  'processImage',
  { data: imageData.buffer, width, height },
  [imageData.buffer] // Transfer ownership
);
```

### Parallel Execution

Execute multiple tasks simultaneously:

```javascript
const promises = [
  thready.execute('fibonacci', 25),
  thready.execute('fibonacci', 30),
  thready.execute('findPrimes', 5000),
];

const results = await Promise.all(promises);
```

## Performance Benefits

- **Non-blocking UI**: Heavy computations run in background threads
- **Parallel Processing**: Multiple tasks execute simultaneously
- **Efficient Resource Usage**: Worker pool prevents thread overhead
- **Zero-copy Transfer**: Transferable objects avoid data copying

## Customization

### Adding New Task Types

1. Add a new case in `thready.worker.js`:

```javascript
case 'myTask':
  result = myTaskFunction(payload);
  break;
```

2. Implement your function:

```javascript
function myTaskFunction(data) {
  // Your computation here
  return result;
}
```

3. Use it in your React component:

```javascript
const result = await thready.execute('myTask', data);
```

## Learn More

- [Thready Documentation](../../README.md)
- [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

## License

ISC
