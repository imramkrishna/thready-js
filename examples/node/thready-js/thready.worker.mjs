// Thready Node.js Worker
import { parentPort } from 'worker_threads';

if (!parentPort) {
  throw new Error('This script must be run as a worker thread');
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
parentPort.on('message', (message) => {
  const { id, taskType, payload } = message;
  
  try {
    let result;
    
    // Add your custom task handlers here
    switch (taskType) {
      case 'factorial':
        result = factorial(payload);
        break;
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
    
    parentPort.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    parentPort.postMessage({ id, type: 'error', payload: error.message });
  }
});
