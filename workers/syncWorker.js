/**
 * Sync Worker - Handles heavy synchronization operations off the main thread
 * Prevents blocking the UI during intensive data processing
 */

// Worker message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch(type) {
      case 'SYNC_CUSTOM_TILES': {
        const tileResult = processTileSync(data);
        self.postMessage({ type: 'SYNC_COMPLETE', result: tileResult, id });
        break;
      }
        
      case 'PROCESS_MIGRATION': {
        const migrationResult = processMigration(data);
        self.postMessage({ type: 'MIGRATION_COMPLETE', result: migrationResult, id });
        break;
      }
        
      case 'BULK_IMPORT': {
        const importResult = processBulkImport(data);
        self.postMessage({ type: 'IMPORT_COMPLETE', result: importResult, id });
        break;
      }
        
      case 'DATA_RECOVERY': {
        const recoveryResult = processDataRecovery(data);
        self.postMessage({ type: 'RECOVERY_COMPLETE', result: recoveryResult, id });
        break;
      }
        
      case 'HEAVY_COMPUTATION': {
        const computationResult = processHeavyComputation(data);
        self.postMessage({ type: 'COMPUTATION_COMPLETE', result: computationResult, id });
        break;
      }
        
      default:
        self.postMessage({ 
          type: 'ERROR', 
          error: `Unknown task type: ${type}`, 
          id 
        });
    }
  } catch (error) {
    self.postMessage({ 
      type: 'ERROR', 
      error: error.message, 
      stack: error.stack,
      id 
    });
  }
};

/**
 * Process tile synchronization operations
 */
function processTileSync(data) {
  const { tiles, options } = data;
  const results = [];
  
  // Batch process tiles to avoid blocking
  const batchSize = options?.batchSize || 50;
  
  for (let i = 0; i < tiles.length; i += batchSize) {
    const batch = tiles.slice(i, i + batchSize);
    
    batch.forEach(tile => {
      // Process each tile synchronization
      const processed = {
        id: tile.id,
        action: tile.action,
        processed: true,
        timestamp: Date.now(),
        // Add any processing logic here
      };
      results.push(processed);
    });
    
    // Report progress for large datasets
    if (tiles.length > 100) {
      const progress = Math.min((i + batchSize) / tiles.length, 1);
      self.postMessage({ 
        type: 'PROGRESS', 
        progress: Math.round(progress * 100),
        message: `Processing tiles: ${Math.round(progress * 100)}%`
      });
    }
  }
  
  return {
    processed: results.length,
    tiles: results,
    timestamp: Date.now()
  };
}

/**
 * Process migration operations
 */
function processMigration(data) {
  const { sourceLanguage, targetLanguage, migrationData } = data;
  
  // Process migration in chunks to prevent blocking
  const processedData = migrationData.map(item => ({
    ...item,
    migrated: true,
    sourceLanguage,
    targetLanguage,
    timestamp: Date.now()
  }));
  
  return {
    success: true,
    processedItems: processedData.length,
    data: processedData,
    migration: {
      from: sourceLanguage,
      to: targetLanguage,
      completedAt: Date.now()
    }
  };
}

/**
 * Process bulk import operations
 */
function processBulkImport(data) {
  const { importType, items } = data;
  const processed = [];
  const errors = [];
  
  items.forEach((item, index) => {
    try {
      // Validate and process each import item
      const processedItem = {
        ...item,
        imported: true,
        index,
        timestamp: Date.now()
      };
      processed.push(processedItem);
    } catch (error) {
      errors.push({
        index,
        item,
        error: error.message
      });
    }
  });
  
  return {
    importType,
    processed: processed.length,
    errors: errors.length,
    items: processed,
    failedItems: errors,
    timestamp: Date.now()
  };
}

/**
 * Process data recovery operations
 */
function processDataRecovery(data) {
  const { corruptedData, recoveryOptions } = data;
  const recovered = [];
  
  corruptedData.forEach(item => {
    // Attempt to recover each data item
    try {
      const recoveredItem = {
        ...item,
        recovered: true,
        recoveryMethod: recoveryOptions.method || 'default',
        timestamp: Date.now()
      };
      recovered.push(recoveredItem);
    } catch (error) {
      // Log recovery failures but continue processing
      recovered.push({
        ...item,
        recovered: false,
        error: error.message,
        timestamp: Date.now()
      });
    }
  });
  
  return {
    totalItems: corruptedData.length,
    recovered: recovered.filter(item => item.recovered).length,
    failed: recovered.filter(item => !item.recovered).length,
    items: recovered,
    timestamp: Date.now()
  };
}

/**
 * Process heavy computational operations
 */
function processHeavyComputation(data) {
  const { computationType, dataset } = data;
  
  switch (computationType) {
    case 'SORT_LARGE_DATASET': {
      return {
        result: dataset.sort((a, b) => a.timestamp - b.timestamp),
        computationType,
        itemsProcessed: dataset.length,
        timestamp: Date.now()
      };
    }
      
    case 'FILTER_COMPLEX': {
      const filtered = dataset.filter(item => {
        // Complex filtering logic that would block main thread
        return item.active && item.lastUsed > (Date.now() - 30 * 24 * 60 * 60 * 1000);
      });
      return {
        result: filtered,
        computationType,
        originalCount: dataset.length,
        filteredCount: filtered.length,
        timestamp: Date.now()
      };
    }
      
    case 'AGGREGATE_DATA': {
      const aggregated = dataset.reduce((acc, item) => {
        const key = item.category || 'uncategorized';
        if (!acc[key]) {
          acc[key] = { count: 0, items: [] };
        }
        acc[key].count++;
        acc[key].items.push(item);
        return acc;
      }, {});
      return {
        result: aggregated,
        computationType,
        categories: Object.keys(aggregated).length,
        totalItems: dataset.length,
        timestamp: Date.now()
      };
    }
      
    default:
      throw new Error(`Unknown computation type: ${computationType}`);
  }
}

// Error handling
self.onerror = function(error) {
  self.postMessage({
    type: 'ERROR',
    error: error.message,
    filename: error.filename,
    lineno: error.lineno,
    timestamp: Date.now()
  });
};