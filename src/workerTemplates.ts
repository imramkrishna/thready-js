import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const browserWorkerTemplate = `// Thready Browser Worker
self.onmessage = function(event) {
  const { id, taskType, payload } = event.data;
  
  try {
    let result;
    
    // Add your custom task handlers here
    switch (taskType) {
      case 'example':
        result = payload * 2;
        break;
      default:
        throw new Error(\`Unknown task type: \${taskType}\`);
    }
    
    self.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    self.postMessage({ id, type: 'error', payload: error.message });
  }
};
`;

const nodeWorkerTemplate = `// Thready Node.js Worker
import { parentPort } from 'worker_threads';

if (!parentPort) {
  throw new Error('This script must be run as a worker thread');
}

parentPort.on('message', (message) => {
  const { id, taskType, payload } = message;
  
  try {
    let result;
    
    // Add your custom task handlers here
    switch (taskType) {
      case 'example':
        result = payload * 2;
        break;
      default:
        throw new Error(\`Unknown task type: \${taskType}\`);
    }
    
    parentPort.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    parentPort.postMessage({ id, type: 'error', payload: error.message });
  }
});
`;

const configTemplate = `// Thready Configuration
export default {
  maxWorkers: 4,
  workerPath: './thready.worker.js',
};
`;

export function init() {
  const cwd = process.cwd();
  
  // Create thready.config.js
  const configPath = join(cwd, 'thready.config.js');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, configTemplate);
    console.log('✓ Created thready.config.js');
  } else {
    console.log('⚠ thready.config.js already exists, skipping...');
  }
  
  // Create browser worker
  const browserWorkerPath = join(cwd, 'thready.worker.js');
  if (!existsSync(browserWorkerPath)) {
    writeFileSync(browserWorkerPath, browserWorkerTemplate);
    console.log('✓ Created thready.worker.js (browser)');
  }
  
  // Create node worker
  const nodeWorkerPath = join(cwd, 'thready.worker.mjs');
  if (!existsSync(nodeWorkerPath)) {
    writeFileSync(nodeWorkerPath, nodeWorkerTemplate);
    console.log('✓ Created thready.worker.mjs (node)');
  }
  
  console.log('\n🎉 Thready initialized successfully!');
  console.log('\nNext steps:');
  console.log('  1. Edit thready.config.js to configure your thread pool');
  console.log('  2. Add your task handlers in the worker files');
  console.log('  3. Import and use: import { threadPool } from "thready"\n');
}