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

export interface WorkerPoolConfig {
  maxWorkers?: number;
  workerScript: string | (() => Worker);
}