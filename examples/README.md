# Examples

> ⚠️ **Important Note:** These are just examples to show you how to use Thready.
> 
> **Thready does NOT include any worker scripts.** You must create your own worker implementation based on your needs.

## What's Here

- **`worker.js`** - Example worker showing how to structure your worker
- **`basic-usage.js`** - Simple example of using Thready
- **`react-example.jsx`** - React integration example
- **`vite-example.js`** - Vite bundler integration example

## How to Use These Examples

1. **Copy the worker.js structure** and modify it for your use case
2. **Adapt the initialization code** to point to YOUR worker script
3. **Customize the task types** to match what your worker handles

## Your Worker Script

Your worker script should:

- Listen for messages: `self.onmessage = (event) => { ... }`
- Extract task info: `const { id, taskType, payload } = event.data`
- Process the task based on `taskType`
- Send results back: `self.postMessage({ id, type: 'result', payload: result })`
- Handle errors: `self.postMessage({ id, type: 'error', payload: error.message })`

## Example Structure

```javascript
// YOUR-worker.js
self.onmessage = (event) => {
  const { id, taskType, payload } = event.data;
  
  try {
    let result;
    
    switch (taskType) {
      case 'yourTask':
        result = yourFunction(payload);
        break;
      default:
        throw new Error(`Unknown task: ${taskType}`);
    }
    
    self.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    self.postMessage({ id, type: 'error', payload: error.message });
  }
};

function yourFunction(data) {
  // Your logic here
  return processedData;
}
```

## Running Examples

```bash
# Basic usage example
node examples/basic-usage.js

# For React/Vite examples, integrate them into your project
```

Remember: **Thready manages the worker pool. You provide the worker logic!** 🧵
