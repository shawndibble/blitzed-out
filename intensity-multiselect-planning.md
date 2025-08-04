# Intensity Multi-Select Planning Document

## Overview

Planning document for changing intensity level selection from single-select (with implied lower levels) to true multi-select where users can pick specific intensity levels independently.

## Current System Analysis ✅

**Current Behavior:**

- `ActionEntry` stores single `level: number` (max intensity)
- UI shows checkboxes for all levels ≤ selected (visual cumulative effect)
- Game building includes all tiles from levels 1 through selected max level
- Works in Setup Wizard (`ActionsStep`) and App Settings (`BoardSettingsV2`)

**Current Data Flow:**

```
Setup Wizard → ActionEntry{level: 3} → buildGame.ts → includes tiles from levels 1,2,3
```

**Key Files Analyzed:**

- `/src/components/IntensitySelector/index.tsx` - Custom group intensity selector
- `/src/views/GameSettingsWizard/ActionsStep/index.tsx` - Wizard step implementation
- `/src/components/GameForm/IncrementalSelect/index.tsx` - Current intensity UI component
- `/src/services/buildGame.ts` - Game building logic with intensity calculations
- `/src/types/index.ts` - ActionEntry data structure

## Proposed Changes

**New Behavior:**

- Users can select specific intensity levels independently
- Example: Select levels 1 and 3, skip level 2
- Example: Select levels 3 and 4, skip levels 1 and 2
- "None" option should deselect all levels

## Key Planning Insights

### 1. UX Design Approach (from UX Designer Agent)

**Updated UI Approach: Keep Existing Dropdown with Multi-Select**

Based on user feedback, maintain the existing dropdown interface but make it multi-select:

```tsx
// Keep existing Select component structure, just enable multiple selection
<FormControl margin="normal" fullWidth>
  <InputLabel id={labelId}>{label}</InputLabel>
  <Select
    labelId={labelId}
    id={option}
    label={label}
    multiple
    value={selectedLevels}
    onChange={handleMultiSelectChange}
    renderValue={(selected) => selected.map((level) => actionKeys[level]).join(', ')}
  >
    {Object.keys(actionData?.actions || {}).map((optionVal, index) => (
      <MenuItem key={index} value={index}>
        <Checkbox checked={selectedLevels.includes(index)} />
        <ListItemText primary={optionVal} />
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

**Key Benefits:**

- Preserves existing UI patterns users are familiar with
- Keeps actual intensity level text labels (e.g., "Mild", "Moderate", "Intense")
- Minimal visual change - just adds checkboxes and multi-select capability
- Uses Material-UI's built-in multi-select functionality
- Maintains the same dropdown interface users expect

### 2. Technical Architecture Strategy (from System Architect Agent)

**Simplified Data Model Change**

```typescript
// Updated ActionEntry type - clean implementation
export interface ActionEntry {
  type: string;
  levels: number[]; // Replace single level with array
  variation?: string;
}
```

**No Migration Strategy Needed:**

- Direct replacement of `level: number` with `levels: number[]`
- Users with invalid data will use setup wizard or app settings to reconfigure
- Remove all old `level` field code
- Clean implementation without backward compatibility overhead

## Board Splitting Logic

**How buildGame.ts will distribute intensity levels across the board:**

```typescript
// Current logic: calculateIntensity() determines target intensity based on board position
// New logic: check if calculated intensity exists in user's selected levels

function buildTileForPosition(
  boardPosition: number,
  totalTiles: number,
  selectedLevels: number[], // e.g., [1, 3, 4]
  maxIntensity: number
): number {
  // Step 1: Calculate target intensity based on board position (existing logic)
  const calculatedIntensity = calculateIntensity(totalTiles, maxIntensity, boardPosition);

  // Step 2: Check if calculated intensity is in user's selection
  if (selectedLevels.includes(calculatedIntensity)) {
    return calculatedIntensity;
  }

  // Step 3: Fallback - find closest available level
  const closest = selectedLevels.reduce((prev, curr) =>
    Math.abs(curr - calculatedIntensity) < Math.abs(prev - calculatedIntensity) ? curr : prev
  );

  return closest;
}
```

**Board Progression Examples:**

- **User selects [1, 2, 3, 4] (all levels)**: Works exactly like current system
- **User selects [1, 3]**:
  - First half of board gets level 1 tiles
  - Second half gets level 3 tiles
  - No level 2 tiles appear anywhere
- **User selects [2, 4]**:
  - First half gets level 2 tiles (calculated level 1 → closest available is 2)
  - Second half gets level 4 tiles
- **User selects [3] only**:
  - Entire board uses level 3 tiles (like current single-level selection)

**Key Point**: The existing `calculateIntensity()` function determines the _intended_ intensity for each board position. New logic just checks "is this intended level available in user's selection?" and finds closest match if not.

### 3. Critical Impact Areas

**Data Model Changes:**

- `ActionEntry` type gets new `levels?: number[]` field
- Maintain existing `level?: number` for backward compatibility
- Add migration utilities and validation logic

**UI Component Updates:**

- Complete refactor of `IncrementalSelect` → new multi-select component
- Update `IntensitySelector` for custom groups
- Form handling changes in `ActionsStep` and `BoardSettingsV2`
- New validation logic for empty/invalid selections

**Game Building Logic:**

- Update `buildGame.ts` to handle specific intensity arrays vs ranges
- Fallback logic when no tiles available at selected levels
- Performance optimization with caching strategy
- Handle edge cases (empty arrays, non-contiguous selections)

**Data Migration:**

- Convert existing user settings from single level to level arrays
- Firebase sync compatibility during transition
- Dexie (IndexedDB) migration for local storage
- Cross-device sync considerations

## Implementation Recommendations

### Simplified Implementation Plan

**Single Phase Implementation:**

1. **Data Model Update**
   - Change `ActionEntry.level: number` → `ActionEntry.levels: number[]`
   - Remove all old level-related code
   - Update TypeScript interfaces

2. **UI Component Development**
   - Update existing `IncrementalSelect` component to support multi-select
   - Add Material-UI `multiple` prop and checkbox rendering
   - Preserve existing intensity level text labels and dropdown interface

3. **Game Building Logic Update**
   - Update `buildGame.ts` to handle `levels` arrays
   - Maintain current board progression logic (see Board Splitting Logic below)
   - Ensure intensity selector only shows available levels

4. **Testing & Deployment**
   - Comprehensive testing of new selection behavior
   - Deploy as single release (no feature flags needed)
   - Users with invalid data will reconfigure via setup wizard

## Strategic Questions & Decisions ✅

### Scope & Timeline

1. **Timeline expectations?** ✅ No specific timeline pressure
2. **Phased rollout?** ✅ Roll out all at once, no feature flags needed
3. **Priority level?** ✅ Not blocking other features

### User Experience Decisions

4. **Default migration behavior?** ✅ No migration needed - users will go through setup wizard again if needed
5. **"None" selection UX?** ✅ Separate "None/Clear" action to clear all selections
6. **Validation rules?** ✅ Empty selections are fine, treated as "none" (current behavior)

### Technical Decisions

7. **Backward compatibility duration?** ✅ No backward compatibility needed - delete old unused code
8. **Performance tolerance?** ✅ No performance constraints
9. **Feature flag preferences?** ✅ No feature flags needed - direct implementation

### Business Logic Questions

10. **Game balance concerns?** ✅ Maintain current progression logic:
    - 1 level: covers whole board
    - 2 levels: lower=first half, higher=second half
    - 3 levels: divide board into thirds
    - 4 levels: divide board into quarters
11. **Edge case handling?** ✅ If no tiles exist for a level, don't show that level in selector (current behavior)

## Testing Strategy (Simplified)

### Essential Testing

- **Basic multi-select**: Can select/deselect individual levels
- **Board generation**: Verify intensity distribution works with level arrays
- **Clear functionality**: "Clear All" button works correctly
- **Integration**: Works in setup wizard and app settings

### Key Test Cases

- Select all levels [1,2,3,4] → should work like current system
- Select non-contiguous [1,3] → verify board splits correctly (first half = level 1, second half = level 3)
- Select single level [2] → entire board uses level 2
- Empty selection [] → treated as "none" (current behavior)

## Risk Assessment

**Low Risk (Simplified Approach):**

- UI component development (well-defined chip-based patterns)
- Game building logic changes (maintains current progression)
- No data migration or backward compatibility complexity
- Single-phase deployment without feature flags

**Mitigation Strategies:**

- Comprehensive testing of board progression logic
- Clear user messaging about reconfiguring settings if needed
- Thorough testing of non-contiguous level selections

## Success Metrics

- **Technical**: Clean implementation without migration complexity, maintained game building performance
- **User Experience**: Intuitive multi-select interface, maintained board progression logic
- **Business**: Enhanced user control over intensity selection, maintained game balance

## Next Steps

1. **Update ActionEntry data model** - Change `level: number` to `levels: number[]`
2. **Update existing IncrementalSelect** to support multi-select with Material-UI dropdown interface
3. **Update game building logic** to handle intensity arrays while maintaining board progression
4. **Remove old level-related code** from components and services
5. **Implement comprehensive testing** for multi-select behavior and board generation

---

_Generated from planning session with UX Designer and System Architect agents_
_Date: 2025-08-04_
