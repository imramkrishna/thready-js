// React Example for Thready
// This shows how to use Thready in a React application

import { threadPool } from 'thready';
import { useEffect, useState } from 'react';

function ThreadyExample() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [input, setInput] = useState(35);

  useEffect(() => {
    // Initialize thread pool on component mount with YOUR worker
    threadPool.init({
      maxWorkers: 4,
      worker: '/worker.js', // Place YOUR worker.js in public folder
    });

    // Cleanup on component unmount
    return () => {
      threadPool.shutdown();
    };
  }, []);

  const handleCalculate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await threadPool.execute('fibonacci', parseInt(input));
      setResult(res);

      // Update stats
      setStats(threadPool.getStats());
    } catch (error) {
      console.error('Calculation failed:', error);
      setResult('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleCalculations = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Run multiple calculations in parallel
      const tasks = [
        threadPool.execute('fibonacci', 30),
        threadPool.execute('fibonacci', 32),
        threadPool.execute('fibonacci', 34),
        threadPool.execute('fibonacci', 36),
      ];

      const results = await Promise.all(tasks);
      setResult(results.join(', '));
      setStats(threadPool.getStats());
    } catch (error) {
      console.error('Calculations failed:', error);
      setResult('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧵 Thready React Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Fibonacci number:{' '}
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleCalculate}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        <button
          onClick={handleMultipleCalculations}
          disabled={loading}
          style={{
            padding: '10px 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Calculating...' : 'Run 4 Parallel Tasks'}
        </button>
      </div>

      {result && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          <strong>Result:</strong> {result}
        </div>
      )}

      {stats && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#e8f4f8',
            borderRadius: '5px',
          }}
        >
          <h3>Pool Statistics:</h3>
          <ul>
            <li>Total Workers: {stats.totalWorkers}</li>
            <li>Available Workers: {stats.availableWorkers}</li>
            <li>Active Tasks: {stats.activeTasks}</li>
            <li>Queued Tasks: {stats.queuedTasks}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default ThreadyExample;
