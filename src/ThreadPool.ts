import type { WorkerMessage, WorkerResponse, Task, WorkerPoolConfig } from './types.js';
import { WorkerPool } from './WorkerPool.js';


/**
 * ThreadPool Class
 * 
 * Acts as a Singleton wrapper around the WorkerPool.
 * This provides a simplified, global access point for the application to
 * interact with the worker threads without managing instance references manually.
 * 
 * IMPORTANT: You must provide your own worker script implementation.
 * Thready does not include any built-in worker logic.
 * 
 * Usage:
 * 1. Create your own worker script that handles your tasks
 * 2. Initialize once at app startup: `threadPool.init({ worker: './your-worker.js' })`
 * 3. Execute tasks anywhere: `await threadPool.execute(...)`
 * 4. Cleanup on app shutdown: `threadPool.shutdown()`
 */
class ThreadPool {
  // Internal reference to the actual WorkerPool instance.
  // It is null until init() is called.
  private pool: WorkerPool | null = null;

  // Flag to track initialization status and prevent double-init.
  private initialized = false;

  /**
   * Initializes the thread pool with your worker implementation.
   * This must be called before executing any tasks.
   * 
   * @param config - Configuration with your worker implementation (path or factory function).
   */
  public init(config: WorkerPoolConfig): void {
    // Prevent multiple initializations, which could leak resources.
    if (this.initialized) {
      console.warn('ThreadPool already initialized');
      return;
    }

    // Create the WorkerPool instance.
    this.pool = new WorkerPool(config);
    this.initialized = true;
  }

  /**
   * Executes a task on the thread pool.
   * This is a proxy method that forwards the request to the underlying WorkerPool.
   * 
   * @template T - The expected return type of the task.
   * @param taskType - Identify the operation to run in the worker.
   * @param payload - Data to be processed.
   * @param transferables - Optional array of buffers to transfer ownership.
   * @returns Promise resolving to the result.
   * @throws Error if the pool hasn't been initialized.
   */
  public async execute<T = any>(
    taskType: string,
    payload: any,
    transferables?: Transferable[]
  ): Promise<T> {
    // Safety check ensuring init() was called.
    if (!this.pool) {
      throw new Error('ThreadPool not initialized. Call init() first.');
    }

    // Delegate execution to the WorkerPool instance.
    return this.pool.run<T>(taskType, payload, transferables);
  }

  /**
   * Retrieves statistics from the underlying pool.
   * Returns null if pool is not initialized.
   */
  public getStats() {
    return this.pool?.getStats() || null;
  }

  /**
   * Shuts down the thread pool and releases all resources.
   * Should be called when the application is closing or unmounting.
   */
  public shutdown(): void {
    if (this.pool) {
      // Terminate all workers.
      this.pool.terminate();

      // Clear references to allow garbage collection.
      this.pool = null;
      this.initialized = false;
    }
  }
}

// Export a single instance of the ThreadPool class.
// This enforces the Singleton pattern across the application.
export const threadPool = new ThreadPool();