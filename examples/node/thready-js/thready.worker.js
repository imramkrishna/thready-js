// Thready Browser Worker
self.onmessage = function(event) {
  const { id, taskType, payload } = event.data;
  
  try {
    let result;
    
    // Add your custom task handlers here
    switch (taskType) {
      case 'example':
        result = payload * 2;
        break;
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
    
    self.postMessage({ id, type: 'result', payload: result });
  } catch (error) {
    self.postMessage({ id, type: 'error', payload: error.message });
  }
};
