# Import/Export Design Document

## Overview

This document outlines the design for a robust import/export system that prevents ID collisions and ensures data portability between different installations of the application.

## Current State Analysis

### What Currently Syncs to Firebase

Based on `syncService.ts`, the following data is synchronized:

1. **Custom Tiles** (`syncCustomTilesToFirebase`):
   - User-created custom tiles (`isCustom: 1`)
   - Disabled default tiles (`isCustom: 0, isEnabled: 0`)

2. **Custom Groups** (`syncCustomGroupsToFirebase`):
   - User-created custom groups (`isDefault: false`)

3. **Game Boards** and **Settings**

### Current Issues with Export

- Uses internal database IDs which can cause collisions when importing to different installations
- No content-based deduplication strategy
- Format is not designed for cross-installation portability

## Export Design

### Export Data Structure

The export will use a **content-based identification system** instead of database IDs:

```json
{
  "formatVersion": "2.0.0",
  "exportedAt": "2025-01-29T12:00:00.000Z",
  "locale": "en",
  "gameMode": "online",
  "data": {
    "customGroups": [
      {
        "name": "My Custom Group",
        "label": "My Custom Group Label",
        "gameMode": "online",
        "type": "action",
        "intensities": [
          {
            "value": 0,
            "label": "Mild"
          }
        ],
        "isDefault": false,
        "locale": "en",
        "contentHash": "sha256-of-normalized-content"
      }
    ],
    "customTiles": [
      {
        "action": "Take a shot",
        "groupName": "My Custom Group",
        "intensity": 0,
        "tags": ["drinking", "custom"],
        "gameMode": "online",
        "isCustom": true,
        "isEnabled": true,
        "contentHash": "sha256-of-normalized-content"
      }
    ],
    "disabledDefaultTiles": [
      {
        "action": "Default action that was disabled",
        "groupName": "Truth or Dare",
        "intensity": 1,
        "gameMode": "online",
        "contentHash": "sha256-of-original-content"
      }
    ]
  }
}
```

### Content Hash Strategy

Each item gets a `contentHash` based on its normalized content:

- For **Groups**: Hash of `name + gameMode + type + JSON.stringify(intensities.map(i => ({value: i.value, label: i.label})))`
- For **Tiles**: Hash of `action + groupName + intensity + gameMode + JSON.stringify(tags)`
- For **Disabled Defaults**: Hash of `action + groupName + intensity + gameMode`

This allows us to identify identical content regardless of database IDs.

#### Missing ContentHash Handling

**When contentHash is missing** (manual/external data creation):

1. **Calculate on Import**: Generate contentHash during import process
2. **Fallback Matching**: Use content-based comparison without hash
3. **Legacy Support**: Support older export formats without contentHash

**Process for Missing Hash**:

```typescript
function handleMissingHash(item: ImportItem): string {
  // Generate hash during import
  const calculatedHash = generateContentHash(item);

  // Check if content matches existing items
  const existingMatch = findExistingByContent(item);

  return calculatedHash;
}
```

### Export Scope Options

1. **All Data**: Everything (custom groups, custom tiles, disabled defaults)
2. **Custom Only**: Only user-created content (groups + tiles)
3. **Single Group**: One specific group and its tiles
4. **Disabled Defaults Only**: Just the disabled default tiles

## Import Design

### Import Strategy: Content-First Matching

The import process will use a **content-first, ID-agnostic** approach:

```typescript
interface ImportOptions {
  mergeStrategy: 'skip' | 'overwrite' | 'rename';
  validateContent: boolean;
  preserveDisabledDefaults: boolean;
}
```

### Import Process Flow

#### Phase 1: Content Analysis

1. Calculate content hashes for all incoming items
2. Calculate content hashes for all existing items
3. Identify matches, conflicts, and new items

#### Phase 2: Conflict Resolution

Based on `mergeStrategy`:

- **Skip**: Keep existing items, ignore duplicates
- **Overwrite**: Replace existing items with imported versions
- **Rename**: Add suffix to imported items that conflict (e.g., "My Group (imported)")

#### Phase 3: Dependency Resolution

1. **Groups First**: Import/update all groups before tiles
2. **Group Name Mapping**: Create mapping table for group names
3. **Tile Processing**: Process tiles with updated group references

#### Phase 4: Database Operations

1. Insert new groups with fresh database IDs
2. Insert new tiles with fresh database IDs and correct group references
3. Update existing items if using 'overwrite' strategy

### Collision Handling Examples

#### Scenario 1: Same Content, Different ID

```
Existing: {id: 5, name: "Truth Questions", ...}
Imported: {name: "Truth Questions", ...} (same content hash)
Result: Skip import (they're identical)
```

#### Scenario 2: Same Name, Different Content

```
Existing: {id: 5, name: "Truth Questions", intensities: [0,1]}
Imported: {name: "Truth Questions", intensities: [0,1,2]}
Result: Based on strategy:
- Skip: Keep existing
- Overwrite: Update existing with new content
- Rename: Create "Truth Questions (imported)"
```

#### Scenario 3: Tile References Non-Existent Group

```
Imported Tile: {action: "...", groupName: "Missing Group"}
Result:
- Create placeholder group OR
- Skip tile with warning OR
- Prompt user for group mapping
```

## Implementation Plan

### New Files/Functions Needed

1. **Content Hashing**:

   ```typescript
   function generateContentHash(item: Group | Tile): string;
   function normalizeForHashing(item: any): string;
   ```

2. **Export Functions**:

   ```typescript
   async function exportAllData(options: ExportOptions): Promise<string>;
   async function exportCustomData(): Promise<string>;
   async function exportSingleGroup(groupName: string): Promise<string>;
   ```

3. **Import Functions**:

   ```typescript
   async function importData(jsonData: string, options: ImportOptions): Promise<ImportResult>;
   async function analyzeImportConflicts(data: ImportData): Promise<ConflictAnalysis>;
   async function resolveConflicts(
     conflicts: ConflictAnalysis,
     strategy: MergeStrategy
   ): Promise<ResolvedData>;
   ```

4. **Validation**:
   ```typescript
   function validateExportFormat(data: any): boolean;
   function validateImportData(data: ImportData): ValidationResult;
   ```

### Database Schema Considerations

No changes needed to existing schema. The import process will:

- Generate new auto-increment IDs for all imported items
- Maintain referential integrity through content-based matching
- Preserve existing data structure

## User Experience

### Export Flow

1. User selects export scope (All/Custom/Single Group/Disabled Only)
2. System generates JSON export
3. User copies to clipboard or downloads file

### Import Flow

1. User pastes JSON or uploads file
2. System analyzes for conflicts and shows preview
3. User selects merge strategy if conflicts detected
4. System imports with progress feedback
5. System shows summary of imported items

### Error Handling

- Invalid JSON format → Clear error message
- Missing required fields → Specific validation errors
- Group reference errors → Options to create/skip/map
- Duplicate content → Merge strategy selection

## Migration from Current System

The new system will:

1. **Maintain backward compatibility** with existing export formats
2. **Auto-detect format version** and handle appropriately
3. **Provide migration path** for users with existing exports

## Edge Cases & External Data

### Manual/External Data Creation

**Scenario**: Someone manually creates JSON data or modifies exported data

**Handling Strategy**:

1. **Missing contentHash Field**:

   ```typescript
   // During import validation
   function validateAndNormalizeImportData(data: any): ImportData {
     return {
       ...data,
       customGroups: data.customGroups?.map((group) => ({
         ...group,
         contentHash: group.contentHash || generateContentHash(group),
       })),
       customTiles: data.customTiles?.map((tile) => ({
         ...tile,
         contentHash: tile.contentHash || generateContentHash(tile),
       })),
     };
   }
   ```

2. **Invalid contentHash**:

   ```typescript
   function verifyContentHash(item: ImportItem): boolean {
     const calculatedHash = generateContentHash(item);
     return item.contentHash === calculatedHash;
   }

   // If hash doesn't match, recalculate and use calculated version
   ```

3. **Malformed Data**:
   - **Missing required fields**: Reject with specific error message
   - **Invalid field types**: Attempt type coercion with warnings
   - **Unknown fields**: Ignore with warnings

### Format Flexibility

**Support Multiple Input Formats**:

1. **Official Export Format**: Full JSON with contentHash
2. **Legacy Format**: Older exports without contentHash
3. **Simplified Format**: Minimal JSON for manual creation
4. **Mixed Format**: Some items with hash, some without

**Auto-Detection Logic**:

```typescript
function detectImportFormat(data: string): 'official' | 'legacy' | 'manual' | 'mixed' {
  const parsed = JSON.parse(data);

  if (parsed.formatVersion) return 'official';
  if (parsed.customString) return 'legacy'; // Old format

  const hasHashes = someItemsHaveContentHash(parsed);
  const missingHashes = someItemsMissingContentHash(parsed);

  if (hasHashes && missingHashes) return 'mixed';
  if (hasHashes) return 'official';
  return 'manual';
}
```

## Testing Strategy

1. **Unit Tests**: Content hashing, conflict detection, validation
2. **Integration Tests**: Full import/export cycles
3. **Edge Cases**:
   - Missing contentHash fields
   - Invalid/corrupted hashes
   - Malformed JSON data
   - Mixed format imports
   - Manual data creation
   - Circular references
   - Large datasets
4. **Cross-Installation**: Export from one install, import to fresh install
5. **External Data**: Hand-crafted JSON imports

## Security Considerations

1. **Content Validation**: Sanitize all imported text content
2. **Size Limits**: Prevent extremely large imports
3. **Rate Limiting**: Prevent rapid import/export abuse
4. **Content Hashing**: Use secure hash function to prevent collisions

## Performance Considerations

1. **Streaming**: Handle large exports without memory issues
2. **Batch Operations**: Use database transactions for imports
3. **Progress Feedback**: Show progress for large operations
4. **Caching**: Cache content hashes during analysis phase
