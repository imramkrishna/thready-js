// Thready Configuration for React/Browser
import thready from 'thready-js';

// Initialize thready with browser worker configuration
thready.init({
  maxWorkers: 4, // Create a pool of 4 workers
  worker: () => new Worker(
    new URL('./thready.worker.js', import.meta.url),
    { type: 'module' }
  ),
});

// Export for use in your React application
export default thready;
