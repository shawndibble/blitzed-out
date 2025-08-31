/**
 * Migration Worker - Handles heavy language migration operations off the main thread
 * Prevents blocking the UI during intensive data processing and file operations
 */

// Worker message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch(type) {
      case 'MIGRATE_LANGUAGE': {
        const result = procesLanguageMigration(data);
        self.postMessage({ type: 'MIGRATION_COMPLETE', result: result, id });
        break;
      }
        
      case 'MIGRATE_ALL_LANGUAGES': {
        const result = processAllLanguagesMigration(data);
        self.postMessage({ type: 'ALL_MIGRATIONS_COMPLETE', result: result, id });
        break;
      }
        
      case 'VALIDATE_MIGRATION': {
        const result = validateMigrationData(data);
        self.postMessage({ type: 'VALIDATION_COMPLETE', result: result, id });
        break;
      }
        
      case 'CLEANUP_DUPLICATES': {
        const result = cleanupDuplicateData(data);
        self.postMessage({ type: 'CLEANUP_COMPLETE', result: result, id });
        break;
      }
        
      default:
        self.postMessage({ 
          type: 'ERROR', 
          error: `Unknown migration task type: ${type}`, 
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
 * Process language migration for a specific locale and game mode
 */
function procesLanguageMigration(data) {
  const { locale, gameMode, actionGroups } = data;
  const results = {
    locale,
    gameMode,
    processedGroups: 0,
    processedTiles: 0,
    groups: [],
    tiles: [],
    errors: [],
    timestamp: Date.now()
  };
  
  try {
    // Process each action group
    for (const groupName of actionGroups) {
      try {
        // Report progress for large operations
        if (actionGroups.length > 10) {
          const progress = Math.round((results.processedGroups / actionGroups.length) * 100);
          self.postMessage({ 
            type: 'PROGRESS', 
            progress: progress,
            message: `Processing ${groupName} for ${locale}/${gameMode}`,
            id: data.id
          });
        }
        
        const groupResult = processActionGroup(groupName, locale, gameMode);
        
        if (groupResult.success) {
          results.groups.push(groupResult.group);
          results.tiles.push(...groupResult.tiles);
          results.processedTiles += groupResult.tiles.length;
          results.processedGroups++;
        } else {
          results.errors.push({
            group: groupName,
            error: groupResult.error
          });
        }
      } catch (error) {
        results.errors.push({
          group: groupName,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      ...results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
}

/**
 * Process all languages migration (background operation)
 */
function processAllLanguagesMigration(data) {
  const { languages, gameModes, actionGroups } = data;
  const results = {
    totalLanguages: languages.length,
    processedLanguages: 0,
    totalGroups: 0,
    processedGroups: 0,
    errors: [],
    timestamp: Date.now()
  };
  
  try {
    for (const locale of languages) {
      for (const gameMode of gameModes) {
        try {
          const migrationResult = procesLanguageMigration({
            locale,
            gameMode,
            actionGroups,
            id: data.id
          });
          
          if (migrationResult.success) {
            results.totalGroups += migrationResult.processedGroups;
            results.processedGroups += migrationResult.processedGroups;
          } else {
            results.errors.push({
              locale,
              gameMode,
              error: migrationResult.error
            });
          }
          
          // Report progress
          const languageProgress = Math.round((results.processedLanguages / results.totalLanguages) * 100);
          self.postMessage({ 
            type: 'PROGRESS', 
            progress: languageProgress,
            message: `Completed ${locale}/${gameMode}`,
            id: data.id
          });
          
        } catch (error) {
          results.errors.push({
            locale,
            gameMode,
            error: error.message
          });
        }
      }
      results.processedLanguages++;
    }
    
    return {
      success: results.errors.length === 0,
      ...results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      ...results
    };
  }
}

/**
 * Process a single action group and convert to custom group + tiles
 */
function processActionGroup(groupName, locale, gameMode) {
  try {
    // Create deterministic ID for consistency
    const deterministicId = createDeterministicId(groupName, locale, gameMode);
    
    // Simulate action file processing (in real implementation, this would import the file)
    const mockActionFile = {
      label: groupName,
      type: 'action',
      actions: {
        'None': [],
        'Light': [`Light ${groupName} action 1`, `Light ${groupName} action 2`],
        'Medium': [`Medium ${groupName} action 1`, `Medium ${groupName} action 2`],
        'Heavy': [`Heavy ${groupName} action 1`, `Heavy ${groupName} action 2`]
      }
    };
    
    const { label, type, actions } = mockActionFile;
    
    // Convert actions to intensities (skip 'None' entry)
    const intensityEntries = Object.entries(actions).slice(1);
    const intensities = intensityEntries.map(([intensityName, actionList], index) => ({
      id: `${groupName}-${index + 1}`,
      label: intensityName,
      value: index + 1,
      isDefault: true,
    }));
    
    // Create custom group
    const customGroup = {
      id: deterministicId,
      name: groupName,
      label,
      intensities,
      type,
      isDefault: true,
      locale,
      gameMode,
    };
    
    // Create custom tiles
    const customTiles = [];
    for (const [intensityName, actionList] of intensityEntries) {
      const intensity = intensities.find(i => i.label === intensityName);
      if (!intensity || !Array.isArray(actionList)) continue;
      
      for (const action of actionList) {
        if (typeof action === 'string' && action.trim()) {
          customTiles.push({
            group_id: deterministicId,
            intensity: intensity.value,
            action: action.trim(),
            tags: ['default'],
            isEnabled: 1,
            isCustom: 0,
          });
        }
      }
    }
    
    return {
      success: true,
      group: customGroup,
      tiles: customTiles
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create deterministic ID for groups
 */
function createDeterministicId(groupName, locale, gameMode) {
  // Simple hash function for deterministic IDs
  const str = `${groupName}-${locale}-${gameMode}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Validate migration data integrity
 */
function validateMigrationData(data) {
  const { groups, tiles, locale, gameMode } = data;
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      groupCount: groups.length,
      tileCount: tiles.length,
      orphanedTiles: 0,
      missingIntensities: 0
    }
  };
  
  try {
    // Create group ID map for validation
    const groupIds = new Set(groups.map(g => g.id));
    
    // Validate tiles reference existing groups
    for (const tile of tiles) {
      if (!groupIds.has(tile.group_id)) {
        validation.stats.orphanedTiles++;
        validation.warnings.push(`Tile references non-existent group: ${tile.group_id}`);
      }
    }
    
    // Validate group intensities
    for (const group of groups) {
      if (!group.intensities || group.intensities.length === 0) {
        validation.stats.missingIntensities++;
        validation.errors.push(`Group ${group.name} has no intensities defined`);
      }
    }
    
    // Fail validation if critical errors found
    validation.isValid = validation.errors.length === 0;
    
    return validation;
  } catch (error) {
    return {
      isValid: false,
      errors: [error.message],
      warnings: [],
      stats: validation.stats
    };
  }
}

/**
 * Cleanup duplicate data
 */
function cleanupDuplicateData(data) {
  const { groups, tiles } = data;
  const cleanup = {
    removedGroups: 0,
    removedTiles: 0,
    uniqueGroups: [],
    uniqueTiles: [],
    duplicates: []
  };
  
  try {
    // Remove duplicate groups by name + locale + gameMode
    const groupKeys = new Set();
    for (const group of groups) {
      const key = `${group.name}-${group.locale}-${group.gameMode}`;
      if (!groupKeys.has(key)) {
        groupKeys.add(key);
        cleanup.uniqueGroups.push(group);
      } else {
        cleanup.removedGroups++;
        cleanup.duplicates.push({ type: 'group', key, id: group.id });
      }
    }
    
    // Remove duplicate tiles by group_id + intensity + action
    const tileKeys = new Set();
    for (const tile of tiles) {
      const key = `${tile.group_id}-${tile.intensity}-${tile.action}`;
      if (!tileKeys.has(key)) {
        tileKeys.add(key);
        cleanup.uniqueTiles.push(tile);
      } else {
        cleanup.removedTiles++;
        cleanup.duplicates.push({ type: 'tile', key, action: tile.action });
      }
    }
    
    return {
      success: true,
      ...cleanup
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      ...cleanup
    };
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