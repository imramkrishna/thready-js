// Basic Usage Example for Thready in Node.js
// Run this with: node examples/basic-usage.js

import { threadPool } from 'thready';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize the thread pool with your Node.js worker
// Note: For ESM Node.js, use a factory function
threadPool.init({
  maxWorkers: 1,
  worker: () => new Worker(join(__dirname, 'worker-node.mjs')),
});

async function runExamples() {
  console.log('🧵 Thready - Basic Usage Examples (Node.js)\n');

  try {
    // Example 1: Calculate Factorial
    console.log('1. Calculating Factorial(5)...');
    const startFib = Date.now();
    const fibResult = await threadPool.execute("factorial", 60);
    console.log(`   Result: ${fibResult}`);
    console.log(`   Time: ${Date.now() - startFib}ms\n`);

    // Example 2: Check if number is prime
    console.log('2. Checking if 104729 is prime...');
    const startPrime = Date.now();
    const primeResult = await threadPool.execute('primeCheck', 10472912414343);
    console.log(`   Result: ${primeResult ? 'Prime' : 'Not Prime'}`);
    console.log(`   Time: ${Date.now() - startPrime}ms\n`);

    // Example 3: Process array
    console.log('3. Processing array of numbers...');
    const startArray = Date.now();
    const arrayResult = await threadPool.execute('processArray', [1, 2, 3, 4, 5,4,5,2,3,5,2,3,5,3,23,53,53,53,53,5,32,5,3]);
    console.log(`   Result: [${arrayResult}]`);
    console.log(`   Time: ${Date.now() - startArray}ms\n`);

    // Example 4: Parallel execution
    console.log('4. Running 3 tasks in parallel...');
    const startParallel = Date.now();
    const parallelTasks = [
      threadPool.execute('factorial', 60),
      threadPool.execute('primeCheck', 104729),
      threadPool.execute('processArray', [1, 2, 3, 4, 5,4,5,2,3,5,2,3,5,3,23,53,53,53,53,5,32,5,3]),
    ];
    const results = await Promise.all(parallelTasks);
    console.log(`   All tasks completed!`);
    console.log(`   Results: ${JSON.stringify(results)}`);
    console.log(`   Time: ${Date.now() - startParallel}ms\n`);

    // Example 5: Check pool statistics
    console.log('5. Pool Statistics:');
    const stats = threadPool.getStats();
    console.log(`   Total Workers: ${stats.totalWorkers}`);
    console.log(`   Available Workers: ${stats.availableWorkers}`);
    console.log(`   Active Tasks: ${stats.activeTasks}`);
    console.log(`   Queued Tasks: ${stats.queuedTasks}\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cleanup
    console.log('Shutting down thread pool...');
    threadPool.shutdown();
    console.log('Done! ✅');
  }
}

runExamples();
