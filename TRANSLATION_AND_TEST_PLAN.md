# Translation and Test Implementation Plan

## Overview

This document provides a comprehensive plan for updating internationalization (i18n) and creating test coverage for the new Custom Groups functionality in the Blitzed Out application.

## Project Context

- **Application**: React 19.1.0 + TypeScript adult game application
- **State Management**: Zustand stores with Dexie (IndexedDB) persistence
- **I18n System**: i18next with support for en, es, fr languages
- **Testing**: Vitest with React Testing Library
- **Current Status**: Application working correctly, but has hardcoded strings and missing test coverage

## Recent Changes Added

### New Components

- `src/components/CustomGroupSelector/index.tsx` - Selector for custom groups
- `src/components/IntensitySelector/index.tsx` - Intensity level selector
- `src/views/CustomGroupDialog/index.tsx` - Dialog for managing custom groups

### New Services

- `src/services/validationService.ts` - Validation logic for custom groups
- `src/services/migrationService.ts` - Data migration utilities
- `src/services/dataCompletenessChecker.ts` - Data validation utilities
- `src/services/dexieActionImport.ts` - Enhanced import functionality

### New Stores/Types

- `src/stores/customGroups.ts` - Custom groups data management
- `src/types/customGroups.ts` - Type definitions for custom groups
- `src/hooks/useUnifiedActionList.ts` - Unified action management

### Enhanced Features

- `src/views/CustomTileDialog/ImportExport/enhancedImportExport.ts` - Enhanced import/export

## Phase Breakdown

### Phase 1: Master Plan Creation ✓

- [x] Create this master plan document
- [ ] Create PHASE_PROGRESS.md for tracking
- [ ] Create HARDCODED_STRINGS_AUDIT.md with complete string inventory

### Phase 2: Translation Keys Addition

**Objective**: Add missing translation keys without changing any component code

#### 2.1 Missing Translation Keys Identified

Based on analysis of new components, these keys need to be added:

**CustomGroups Section:**

```json
"customGroups": {
  "manageCustomGroups": "Manage Custom Groups",
  "createNewGroupsDescription": "Create new groups or manage existing custom groups",
  "existingGroups": "Existing Groups",
  "editGroup": "Edit Group",
  "createNew": "Create New",
  "loadingGroups": "Loading groups...",
  "noCustomGroupsFound": "No custom groups found. Create your first group using the \"Create New\" tab.",
  "groupInformation": "Group Information",
  "groupLabel": "Group Label",
  "groupType": "Group Type",
  "intensityLabels": "Intensity Labels",
  "quickStart": "Quick Start",
  "chooseTemplate": "Choose Template",
  "selectTemplateDescription": "Select a template to populate the labels below",
  "customizeIntensityDescription": "Customize the labels for each intensity level. Values are automatically assigned as 1, 2, 3, etc.",
  "addIntensityLevel": "Add Intensity Level",
  "updateGroup": "Update Group",
  "createGroup": "Create Group",
  "saving": "Saving...",
  "groupTypeHelp": "Determines when this group appears in the Setup Wizard",
  "noGroupsAvailable": "No groups available for {{locale}}/{{gameMode}}",
  "selectGroupFirst": "Select a group first",
  "loadingIntensities": "Loading intensities...",
  "noIntensitiesAvailable": "No intensities available for \"{{groupName}}\"",
  "deleteGroupConfirm": "Are you sure you want to delete this group? This action cannot be undone.",
  "deleteGroupWithTilesConfirm": "Are you sure you want to delete this group? This will also delete {{count}} associated custom tiles. This action cannot be undone.",
  "intensityLevelsCount": "{{count}} intensity levels",
  "customTilesCount": "{{count}} custom tiles",
  "levelLabel": "Level {{level}} Label"
}
```

**Intensity Labels Section:**

```json
"intensityLabels": {
  "beginner": "Beginner",
  "intermediate": "Intermediate",
  "advanced": "Advanced",
  "light": "Light",
  "medium": "Medium",
  "intense": "Intense",
  "extreme": "Extreme",
  "veryLight": "Very Light",
  "veryIntense": "Very Intense"
}
```

**Group Types Section:**

```json
"groupTypes": {
  "solo": "Solo - Appears in online mode",
  "foreplay": "Foreplay - Appears in local mode (before intimate actions)",
  "sex": "Sex - Appears in local mode (intimate actions)",
  "consumption": "Consumption - Appears in all modes (drinks, substances, etc.)",
  "selectType": "Select a type..."
}
```

#### 2.2 Files to Update

- `src/locales/en/translation.json` - Add English keys
- `src/locales/es/translation.json` - Add Spanish translations
- `src/locales/fr/translation.json` - Add French translations

### Phase 3: Component Updates

**Objective**: Replace hardcoded strings with t() calls, one component at a time

#### 3.1 CustomGroupSelector Component

**File**: `src/components/CustomGroupSelector/index.tsx`

**Hardcoded Strings to Replace:**

- Line 59: "Loading groups..." → `{t('customGroups.loadingGroups')}`
- Line 64: "Loading groups..." → `{t('customGroups.loadingGroups')}`
- Line 80: "No groups available for {locale}/{gameMode}" → `{t('customGroups.noGroupsAvailable', {locale, gameMode})}`
- Line 88: "Default" → `{t('default')}`

#### 3.2 IntensitySelector Component

**File**: `src/components/IntensitySelector/index.tsx`

**Hardcoded Strings to Replace:**

- Line 66: "Select a group first" → `{t('customGroups.selectGroupFirst')}`
- Line 76: "Loading intensities..." → `{t('customGroups.loadingIntensities')}`
- Line 81: "Loading intensities..." → `{t('customGroups.loadingIntensities')}`
- Line 96: "No intensities available for &ldquo;{groupName}&rdquo;" → `{t('customGroups.noIntensitiesAvailable', {groupName})}`

#### 3.3 CustomGroupDialog Component

**File**: `src/views/CustomGroupDialog/index.tsx`

**Hardcoded Strings to Replace:**

- Lines 66-68, 142, 335: Default intensity labels → Use `t('intensityLabels.beginner')` etc.
- Line 166: "Level ${intensityLabels.length + 1}" → `t('customGroups.levelLabel', {level: intensityLabels.length + 1})`
- Line 395: "intensity levels" → Use translation key
- Line 404: "custom tiles" → Use translation key
- Line 459: "Group Information" → `t('customGroups.groupInformation')`
- Line 467: Helper text → Use translation key
- Line 479: Helper text → Use translation key
- And many more throughout the file

### Phase 4: Test Creation

**Objective**: Create comprehensive test coverage for new functionality

#### 4.1 CustomGroupDialog Tests

**File**: `src/views/CustomGroupDialog/__tests__/CustomGroupDialog.test.tsx`

**Test Cases:**

- Render dialog correctly
- Create new group workflow
- Edit existing group workflow
- Delete group functionality
- Form validation
- Template selection
- Intensity level management
- Translation key usage

#### 4.2 CustomGroupSelector Tests

**File**: `src/components/CustomGroupSelector/__tests__/CustomGroupSelector.test.tsx`

**Test Cases:**

- Render selector correctly
- Load groups for locale/gameMode
- Filter default vs custom groups
- Handle loading states
- Handle error states
- Translation key usage

#### 4.3 IntensitySelector Tests

**File**: `src/components/IntensitySelector/__tests__/IntensitySelector.test.tsx`

**Test Cases:**

- Render selector correctly
- Load intensities for selected group
- Handle group changes
- Handle loading states
- Handle error states
- Translation key usage

#### 4.4 Service Tests

**validationService Tests**: `src/services/__tests__/validationService.test.ts`
**customGroups Store Tests**: `src/stores/__tests__/customGroups.test.ts`

#### 4.5 Update Existing Tests

- Update `src/hooks/__tests__/useGameBoard.test.ts` for unified action system
- Update `src/services/__tests__/buildGame.test.ts` for custom groups integration

### Phase 5: Comprehensive Quality Assurance

**Objective**: Ensure entire codebase is in perfect working condition

#### 5.1 TypeScript Validation

- Run `npm run type-check`
- Fix any TypeScript errors found
- Ensure 100% TypeScript compliance

#### 5.2 Linting and Code Quality

- Run `npm run lint`
- Fix all linting errors and warnings
- Run `npm run format` for consistent formatting

#### 5.3 Test Suite Validation

- Run `npm test` - fix any failing tests
- Run `npm run test:coverage` - ensure adequate coverage
- Ensure 100% test pass rate

#### 5.4 Build Validation

- Run `npm run build` - fix any build errors
- Verify production build succeeds

#### 5.5 Manual Application Testing

- Test all major user workflows
- Test custom group functionality end-to-end
- Test all three languages (en, es, fr)
- Verify no console errors

## Progress Tracking

Progress will be tracked in `PHASE_PROGRESS.md` with checkboxes and completion dates.

## Rollback Strategy

Each phase is independent and can be rolled back if issues arise:

- Phase 2: Can revert translation.json files
- Phase 3: Can revert individual component changes
- Phase 4: New test files can be removed
- Phase 5: Quality issues indicate where rollback is needed

## Success Criteria

- ✅ All user-facing text properly translated across 3 languages
- ✅ Comprehensive test coverage for all new functionality
- ✅ 100% TypeScript compliance
- ✅ 100% lint compliance
- ✅ 100% test pass rate
- ✅ Production build succeeds
- ✅ Application functions perfectly in all languages
- ✅ No console errors or performance regressions
