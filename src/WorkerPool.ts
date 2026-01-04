import type { WorkerMessage, WorkerResponse, Task, WorkerPoolConfig } from './types.js';

// ============================================================================
// WORKER SCRIPT (worker.ts)
// This runs in a separate thread - keep it framework-agnostic
// ============================================================================
// Worker message types
// ============================================================================
// WORKER POOL MANAGER (main thread)
// ============================================================================

// Import necessary types from the types definition file.
// WorkerMessage: Structure of messages sent to workers.
// WorkerResponse: Structure of messages received from workers.
// Task: Represents a unit of work to be executed.
// WorkerPoolConfig: Configuration options for the pool.
// ============================================================================
// WORKER POOL CORE IMPLEMENTATION
// ============================================================================

/**
 * WorkerPool Class
 * 
 * Manages a pool of Web Workers to execute tasks in parallel.
 * This class handles worker creation, task queueing, load balancing,
 * and lifecycle management (creation, termination, error handling).
 * 
 * It implements a mechanism to reuse workers efficiently rather than
 * creating a new thread for every task, which would be resource-intensive.
 */
export class WorkerPool {
  // Array to hold references to all worker instances created by this pool.
  private workers: Worker[] = [];

  // Array to hold references to workers that are currently idle and ready for a task.
  private availableWorkers: Worker[] = [];

  // Queue to hold tasks that are waiting for a worker to become available.
  private taskQueue: Task[] = [];

  // Map to track currently executing tasks, keyed by their unique Task ID.
  private activeTasks: Map<string, Task> = new Map();

  // Map to link a specific Worker instance to the Task ID it is currently working on.
  // This is essential for error handling and cleanup.
  private workerTaskMap: Map<Worker, string> = new Map();

  // The maximum number of concurrent workers allowed.
  private maxWorkers: number;

  // The path to the worker script or a factory function that returns a Worker.
  private workerScript: string | (() => Worker);

  /**
   * Constructor for the WorkerPool.
   * 
   * @param config - Configuration object containing settings like maxWorkers and script path.
   */
  constructor(config: WorkerPoolConfig) {
    // Determine the maximum number of workers.
    // Priority: Config value -> Hardware concurrency (CPU cores) -> Default to 4.
    this.maxWorkers = config.maxWorkers || navigator.hardwareConcurrency || 4;

    // Store the worker script source (path or factory function).
    this.workerScript = config.workerScript;

    // Initialize the pool by creating the workers.
    this.initialize();
  }

  /**
   * Initializes the pool by creating the specified number of workers.
   */
  private initialize(): void {
    // Loop from 0 to maxWorkers to create the initial pool.
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Creates a new Worker instance and sets up its event listeners.
   * 
   * @returns The created Worker instance.
   */
  private createWorker(): Worker {
    let worker: Worker;

    // Check if the script source is a factory function.
    if (typeof this.workerScript === 'function') {
      // If it's a function, call it to get the Worker instance.
      // This is useful for environments like Vite or Webpack with specific worker loaders.
      worker = this.workerScript();
    } else {
      // If it's a string, treat it as a file path and instantiate a standard Worker.
      worker = new Worker(this.workerScript);
    }

    // Set up the 'onmessage' event handler to receive results from the worker.
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(worker, event.data);
    };

    // Set up the 'onerror' event handler to catch any unhandled errors in the worker.
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.handleWorkerError(worker, error);
    };

    // Add the new worker to the master list of workers.
    this.workers.push(worker);

    // Immediately verify the worker is available for work and add it to the available pool.
    this.availableWorkers.push(worker);

    return worker;
  }

  /**
   * Handles messages sent back from a worker.
   * 
   * @param worker - The worker instance that sent the message.
   * @param response - The data payload received from the worker.
   */
  private handleWorkerMessage(worker: Worker, response: WorkerResponse): void {
    const taskId = response.id;

    // Retrieve the task associated with this ID from the active tasks map.
    const task = this.activeTasks.get(taskId);

    // If no task is found (e.g., cancelled or already handled), exit early.
    if (!task) return;

    // Check the type of response from the worker.
    if (response.type === 'result') {
      // If successful, resolve the task's promise with the payload.
      task.resolve(response.payload);

      // Cleanup: Remove the task from tracking maps.
      this.activeTasks.delete(taskId);
      this.workerTaskMap.delete(worker);

      // Return the worker to the pool to handle the next task.
      this.returnWorkerToPool(worker);
    } else if (response.type === 'error') {
      // If the worker reported an error, reject the task's promise.
      task.reject(new Error(response.payload));

      // Cleanup: Remove the task from tracking maps.
      this.activeTasks.delete(taskId);
      this.workerTaskMap.delete(worker);

      // Return the worker to the pool (assuming the error didn't kill the worker).
      this.returnWorkerToPool(worker);
    }
  }

  /**
   * Handles low-level errors emitted by the worker (e.g., script load failure, syntax error).
   * 
   * @param worker - The worker that encountered the error.
   * @param error - The error event object.
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    // Find the task currently assigned to this worker.
    const taskId = this.workerTaskMap.get(worker);

    // If there was an active task, we must reject it so the caller isn't left hanging.
    if (taskId) {
      const task = this.activeTasks.get(taskId);
      if (task) {
        task.reject(new Error(error.message));
        this.activeTasks.delete(taskId);
      }
    }

    // Since the worker is in an error state, we remove it from our tracking arrays.
    // Find index in main workers array.
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }

    // Find index in available workers array (unlikely to be here if it was working, but good safety).
    const availIndex = this.availableWorkers.indexOf(worker);
    if (availIndex > -1) {
      this.availableWorkers.splice(availIndex, 1);
    }

    // Terminate the physical worker thread to clean up resources.
    worker.terminate();

    // Replace the dead worker with a fresh one to maintain pool size.
    this.createWorker();
  }

  /**
   * Returns a worker to the available pool and triggers queue processing.
   * 
   * @param worker - The worker to release.
   */
  private returnWorkerToPool(worker: Worker): void {
    // Add the worker back to the available list.
    this.availableWorkers.push(worker);

    // Check if there are queued tasks that this now-free worker can handle.
    this.processQueue();
  }

  /**
   * Processes the task queue.
   * Assigns waiting tasks to available workers.
   */
  private processQueue(): void {
    // Continue loop as long as we have both tasks in the queue AND workers available.
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      // Dequeue the next task (FIFO).
      const task = this.taskQueue.shift()!;

      // Get the next available worker.
      const worker = this.availableWorkers.shift()!;

      // Assign the task to the worker.
      this.executeTask(worker, task);
    }
  }

  /**
   * Sends a task to a specific worker for execution.
   * 
   * @param worker - The selected worker instance.
   * @param task - The task object to execute.
   */
  private executeTask(worker: Worker, task: Task): void {
    // Mark the task as active.
    this.activeTasks.set(task.id, task);

    // Map the worker to this task ID.
    this.workerTaskMap.set(worker, task.id);

    // Construct the message payload to send to the worker.
    const message: WorkerMessage = {
      id: task.id,
      type: 'task',
      taskType: task.type,
      payload: task.payload
    };

    // Send the message to the worker.
    // If transferables are provided (e.g., ArrayBuffers), use the zero-copy transfer format.
    if (task.transferables && task.transferables.length > 0) {
      worker.postMessage(message, task.transferables);
    } else {
      worker.postMessage(message);
    }
  }

  /**
   * Public API to run a task on the thread pool.
   * 
   * @template T - The expected return type of the task.
   * @param taskType - A string identifier for the type of work to perform (handled by the worker script).
   * @param payload - The data needed to perform the task.
   * @param transferables - Optional list of objects to transfer ownership of (for performance).
   * @returns A Promise that resolves with the result T.
   */
  public async run<T = any>(
    taskType: string,
    payload: any,
    transferables?: Transferable[]
  ): Promise<T> {
    // Return a new Promise that will be handled by the worker callback.
    return new Promise((resolve, reject) => {
      // Create the internal Task object.
      const task: Task<T> = {
        id: `task_${Date.now()}_${Math.random()}`, // Generate a unique ID.
        type: taskType,
        payload,
        resolve, // Store the resolve function to call later.
        reject,  // Store the reject function to call on error.
        ...(transferables !== undefined && { transferables }) // Conditionally add transferables.
      };

      // If a worker is immediately available, execute the task now.
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        this.executeTask(worker, task);
      } else {
        // Otherwise, put the task in the queue to be picked up later.
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Retrieves current statistics about the pool.
   * Useful for monitoring and debugging.
   */
  public getStats() {
    return {
      totalWorkers: this.workers.length,      // Total pool size.
      availableWorkers: this.availableWorkers.length, // Idle workers.
      activeTasks: this.activeTasks.size,    // Tasks currently running.
      queuedTasks: this.taskQueue.length     // Tasks waiting for a worker.
    };
  }

  /**
   * Terminates the entire pool.
   * Kills all workers and clears all queues.
   */
  public terminate(): void {
    // Forcefully terminate every worker thread.
    this.workers.forEach(worker => worker.terminate());

    // Clear the arrays and maps.
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.activeTasks.clear();
    this.workerTaskMap.clear();
  }
}



// ============================================================================
// USAGE EXAMPLES FOR DIFFERENT FRAMEWORKS
// ============================================================================

// EXAMPLE 1: Vanilla JavaScript
/*
import { threadPool } from './threadPool';

// Initialize with worker script path
threadPool.init({
  maxWorkers: 4,
  workerScript: './worker.js'
});

// Execute tasks
async function heavyCalculation() {
  const result = await threadPool.execute('fibonacci', 40);
  console.log('Fibonacci result:', result);
}

// With transferables (zero-copy)
async function processImageData(imageData) {
  const pixels = imageData.data;
  const result = await threadPool.execute(
    'processImage',
    pixels,
    [pixels.buffer] // Transfer ownership
  );
  console.log('Processed pixels:', result);
}
*/

// EXAMPLE 2: React
/*
import { threadPool } from './threadPool';
import { useEffect, useState } from 'react';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize on mount
    threadPool.init({
      maxWorkers: 4,
      workerScript: '/worker.js'
    });

    // Cleanup on unmount
    return () => threadPool.shutdown();
  }, []);

  const handleHeavyTask = async () => {
    setLoading(true);
    try {
      const data = await threadPool.execute('processLargeArray',
        Array.from({ length: 1000000 }, (_, i) => i)
      );
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleHeavyTask} disabled={loading}>
        Run Heavy Task
      </button>
      {loading && <p>Processing...</p>}
      {result && <p>Result length: {result.length}</p>}
    </div>
  );
}
*/

// EXAMPLE 3: Vue 3
/*
import { threadPool } from './threadPool';
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  setup() {
    const result = ref(null);
    const loading = ref(false);

    onMounted(() => {
      threadPool.init({
        maxWorkers: 4,
        workerScript: '/worker.js'
      });
    });

    onUnmounted(() => {
      threadPool.shutdown();
    });

    const runTask = async () => {
      loading.value = true;
      try {
        result.value = await threadPool.execute('fibonacci', 35);
      } finally {
        loading.value = false;
      }
    };

    return { result, loading, runTask };
  }
};
*/

// EXAMPLE 4: Angular
/*
import { threadPool } from './threadPool';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="runTask()" [disabled]="loading">Run Task</button>
    <p *ngIf="loading">Processing...</p>
    <p *ngIf="result">Result: {{ result }}</p>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  result: any = null;
  loading = false;

  ngOnInit() {
    threadPool.init({
      maxWorkers: 4,
      workerScript: './worker.js'
    });
  }

  ngOnDestroy() {
    threadPool.shutdown();
  }

  async runTask() {
    this.loading = true;
    try {
      this.result = await threadPool.execute('fibonacci', 35);
    } finally {
      this.loading = false;
    }
  }
}
*/

// EXAMPLE 5: Svelte
/*
<script>
  import { threadPool } from './threadPool';
  import { onMount, onDestroy } from 'svelte';
  
  let result = null;
  let loading = false;

  onMount(() => {
    threadPool.init({
      maxWorkers: 4,
      workerScript: '/worker.js'
    });
  });

  onDestroy(() => {
    threadPool.shutdown();
  });

  async function runTask() {
    loading = true;
    try {
      result = await threadPool.execute('fibonacci', 35);
    } finally {
      loading = false;
    }
  }
</script>

<button on:click={runTask} disabled={loading}>Run Task</button>
{#if loading}<p>Processing...</p>{/if}
{#if result}<p>Result: {result}</p>{/if}
*/