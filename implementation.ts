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