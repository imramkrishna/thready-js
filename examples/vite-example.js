// Vite Example for Thready
// Shows how to use Thready with Vite's worker handling

import { threadPool } from 'thready';

// Initialize with Vite's worker syntax and YOUR worker
threadPool.init({
  maxWorkers: 4,
  worker: () =>
    new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    }),
});

async function runCalculations() {
  console.log('Running calculations with Vite + Thready...');

  try {
    // Execute some tasks
    const fib = await threadPool.execute('fibonacci', 35);
    console.log('Fibonacci(35):', fib);

    const prime = await threadPool.execute('primeCheck', 104729);
    console.log('Is 104729 prime?', prime);

    // Parallel execution
    const results = await Promise.all([
      threadPool.execute('fibonacci', 30),
      threadPool.execute('fibonacci', 32),
      threadPool.execute('fibonacci', 34),
    ]);
    console.log('Parallel results:', results);

    // Show stats
    console.log('Pool stats:', threadPool.getStats());
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run on page load
runCalculations();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  threadPool.shutdown();
});

export { threadPool };
