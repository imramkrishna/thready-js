// Main exports for the Thready package
export { threadPool } from './ThreadPool.js';
export { WorkerPool } from './WorkerPool.js';
export type {
  WorkerMessage, 
  WorkerResponse, 
  Task, 
  WorkerPoolConfig
} from './types.js';