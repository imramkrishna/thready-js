// Thready Browser Worker for React Example
self.onmessage = function(event) {
  const { id, taskType, payload, transferables } = event.data;
  
  try {
    let result;
    
    // Add your custom task handlers here
    switch (taskType) {
      case 'fibonacci':
        result = fibonacci(payload);
        break;
        
      case 'findPrimes':
        result = findPrimes(payload);
        break;
        
      case 'processImage':
        result = processImage(payload);
        break;
        
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
    
    // Send result back to main thread
    if (result && result.buffer instanceof ArrayBuffer) {
      // If result contains transferable objects, transfer them
      self.postMessage(
        { id, type: 'result', payload: result },
        [result.buffer]
      );
    } else {
      self.postMessage({ id, type: 'result', payload: result });
    }
  } catch (error) {
    self.postMessage({ id, type: 'error', payload: error.message });
  }
};

// Calculate Fibonacci number recursively
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Find all prime numbers up to n using Sieve of Eratosthenes
function findPrimes(n) {
  if (n < 2) return [];
  
  const primes = [];
  const isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;
  
  for (let i = 2; i <= n; i++) {
    if (isPrime[i]) {
      primes.push(i);
      // Mark multiples as non-prime
      for (let j = i * i; j <= n; j += i) {
        isPrime[j] = false;
      }
    }
  }
  
  return primes;
}

// Process image data (example: convert to grayscale)
function processImage({ data, width, height }) {
  const imageData = new Uint8ClampedArray(data);
  
  // Convert to grayscale
  for (let i = 0; i < imageData.length; i += 4) {
    const gray = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
    imageData[i] = gray;     // R
    imageData[i + 1] = gray; // G
    imageData[i + 2] = gray; // B
    // imageData[i + 3] is alpha, keep unchanged
  }
  
  // Return with transferable buffer
  return {
    data: imageData.buffer,
    width,
    height
  };
}
