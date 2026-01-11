import { useState, useEffect } from 'react';
import thready from './thready-js/thready.config';
import './App.css';

function App() {
  const [fibonacciInput, setFibonacciInput] = useState(30);
  const [fibonacciResult, setFibonacciResult] = useState(null);
  const [primeInput, setPrimeInput] = useState(10000);
  const [primeResult, setPrimeResult] = useState(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [loading, setLoading] = useState({});
  const [poolStats, setPoolStats] = useState(null);

  useEffect(() => {
    // Update pool stats periodically
    const interval = setInterval(() => {
      const stats = thready.getPoolStats();
      setPoolStats(stats);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const calculateFibonacci = async () => {
    setLoading((prev) => ({ ...prev, fibonacci: true }));
    setFibonacciResult(null);
    
    try {
      const startTime = performance.now();
      const result = await thready.execute('fibonacci', fibonacciInput);
      const endTime = performance.now();
      
      setFibonacciResult({
        value: result,
        time: (endTime - startTime).toFixed(2),
      });
    } catch (error) {
      setFibonacciResult({ error: error.message });
    } finally {
      setLoading((prev) => ({ ...prev, fibonacci: false }));
    }
  };

  const findPrimes = async () => {
    setLoading((prev) => ({ ...prev, primes: true }));
    setPrimeResult(null);
    
    try {
      const startTime = performance.now();
      const result = await thready.execute('findPrimes', primeInput);
      const endTime = performance.now();
      
      setPrimeResult({
        count: result.length,
        primes: result.slice(0, 10).join(', ') + (result.length > 10 ? '...' : ''),
        time: (endTime - startTime).toFixed(2),
      });
    } catch (error) {
      setPrimeResult({ error: error.message });
    } finally {
      setLoading((prev) => ({ ...prev, primes: false }));
    }
  };

  const processImage = async () => {
    setImageProcessing(true);
    
    try {
      // Create a simple image data (100x100 pixels)
      const width = 100;
      const height = 100;
      const imageData = new Uint8ClampedArray(width * height * 4);
      
      // Fill with a gradient
      for (let i = 0; i < imageData.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        
        imageData[i] = x * 2.55;     // R
        imageData[i + 1] = y * 2.55; // G
        imageData[i + 2] = 128;      // B
        imageData[i + 3] = 255;      // A
      }

      const startTime = performance.now();
      const result = await thready.execute(
        'processImage',
        { data: imageData.buffer, width, height },
        [imageData.buffer] // Transfer buffer for zero-copy
      );
      const endTime = performance.now();
      
      alert(`Image processed in ${(endTime - startTime).toFixed(2)}ms\nApplied grayscale filter to ${width}x${height} image`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setImageProcessing(false);
    }
  };

  const runMultipleTasks = async () => {
    setLoading((prev) => ({ ...prev, multiple: true }));
    
    try {
      const startTime = performance.now();
      
      // Execute multiple tasks in parallel
      const promises = [
        thready.execute('fibonacci', 25),
        thready.execute('fibonacci', 30),
        thready.execute('findPrimes', 5000),
        thready.execute('findPrimes', 7500),
      ];
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      alert(
        `Completed 4 tasks in parallel!\n` +
        `Time: ${(endTime - startTime).toFixed(2)}ms\n` +
        `Fibonacci(25): ${results[0]}\n` +
        `Fibonacci(30): ${results[1]}\n` +
        `Primes < 5000: ${results[2].length}\n` +
        `Primes < 7500: ${results[3].length}`
      );
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, multiple: false }));
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🧵 Thready React Example</h1>
        <p>Demonstrating multi-threaded computation in React using Web Workers</p>
      </header>

      <div className="container">
        {/* Pool Stats */}
        {poolStats && (
          <div className="stats-card">
            <h3>Thread Pool Statistics</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-label">Active Workers:</span>
                <span className="stat-value">{poolStats.activeWorkers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Idle Workers:</span>
                <span className="stat-value">{poolStats.idleWorkers}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Queued Tasks:</span>
                <span className="stat-value">{poolStats.queuedTasks}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Executed:</span>
                <span className="stat-value">{poolStats.totalExecuted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fibonacci Calculator */}
        <div className="card">
          <h2>Fibonacci Calculator</h2>
          <p>Calculate Fibonacci numbers using worker threads</p>
          <div className="input-group">
            <label>
              Enter n (1-40):
              <input
                type="number"
                min="1"
                max="40"
                value={fibonacciInput}
                onChange={(e) => setFibonacciInput(Number(e.target.value))}
              />
            </label>
            <button
              onClick={calculateFibonacci}
              disabled={loading.fibonacci}
              className="button"
            >
              {loading.fibonacci ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
          {fibonacciResult && (
            <div className="result">
              {fibonacciResult.error ? (
                <p className="error">Error: {fibonacciResult.error}</p>
              ) : (
                <>
                  <p>
                    <strong>Result:</strong> {fibonacciResult.value}
                  </p>
                  <p className="time">Computed in {fibonacciResult.time}ms</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Prime Numbers Finder */}
        <div className="card">
          <h2>Prime Numbers Finder</h2>
          <p>Find all prime numbers up to a given number</p>
          <div className="input-group">
            <label>
              Find primes up to:
              <input
                type="number"
                min="10"
                max="100000"
                value={primeInput}
                onChange={(e) => setPrimeInput(Number(e.target.value))}
              />
            </label>
            <button
              onClick={findPrimes}
              disabled={loading.primes}
              className="button"
            >
              {loading.primes ? 'Finding...' : 'Find Primes'}
            </button>
          </div>
          {primeResult && (
            <div className="result">
              {primeResult.error ? (
                <p className="error">Error: {primeResult.error}</p>
              ) : (
                <>
                  <p>
                    <strong>Found {primeResult.count} primes</strong>
                  </p>
                  <p className="primes">First few: {primeResult.primes}</p>
                  <p className="time">Computed in {primeResult.time}ms</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Image Processing */}
        <div className="card">
          <h2>Image Processing</h2>
          <p>Process image data with transferable objects (zero-copy)</p>
          <button
            onClick={processImage}
            disabled={imageProcessing}
            className="button"
          >
            {imageProcessing ? 'Processing...' : 'Process Image'}
          </button>
        </div>

        {/* Multiple Tasks */}
        <div className="card">
          <h2>Parallel Execution</h2>
          <p>Run multiple tasks simultaneously using the thread pool</p>
          <button
            onClick={runMultipleTasks}
            disabled={loading.multiple}
            className="button button-primary"
          >
            {loading.multiple ? 'Running...' : 'Run 4 Tasks in Parallel'}
          </button>
        </div>
      </div>

      <footer className="footer">
        <p>
          All computations run in Web Workers, keeping the UI responsive.
          <br />
          Open DevTools Console to see worker activity.
        </p>
      </footer>
    </div>
  );
}

export default App;
