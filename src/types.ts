export interface WorkerMessage {
  id: string;
  type: 'task' | 'init' | 'terminate';
  payload: any;
  taskType?: string;
}

export interface WorkerResponse {
  id: string;
  type: 'result' | 'error' | 'progress';
  payload: any;
}
export interface Task<T = any> {
  id: string;
  type: string;
  payload: any;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  transferables?: Transferable[] | undefined;
}

/**
 * Configuration for the WorkerPool.
 * 
 * IMPORTANT: You must provide your own worker implementation.
 * Thready does not include any built-in worker scripts.
 */
export interface WorkerPoolConfig {
  /**
   * Maximum number of worker threads to create.
   * Defaults to navigator.hardwareConcurrency (CPU cores) or 4.
   */
  maxWorkers?: number;
  
  /**
   * YOUR worker implementation - either:
   * - A string path to your worker script file
   * - A factory function that returns a Worker instance
   * 
   * Examples:
   * - Path: './my-worker.js'
   * - Vite: () => new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
   * - Webpack: () => new Worker(new URL('./worker.js', import.meta.url))
   */
  worker: string | (() => Worker);
}