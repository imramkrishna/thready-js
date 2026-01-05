// Thready Configuration
import thready from 'thready-js';
import { Worker } from 'worker_threads';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize thready with your configuration
thready.init({
  maxWorkers: 4,
  worker: () => new Worker(join(__dirname, './thready.worker.mjs'), { type: 'module' }),
});

// Export for use in your application
export default thready;
