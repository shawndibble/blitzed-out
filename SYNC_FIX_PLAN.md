# Sync Service Bug Fix - Comprehensive Plan

## 🚨 **Problem Statement**

When users log into their account, all actions disappear from the application. This is caused by the sync service aggressively deleting data that should be preserved.

### **Root Cause Analysis**

1. **Current Broken Flow:**
   - Login triggers `syncDataFromFirebase()`
   - **Line 231**: `await deleteAllCustomGroups()` - Deletes ALL groups including default groups (`isDefault: true`)
   - **Line 195**: `await deleteAllCustomTiles()` - Deletes ALL custom tiles (`isCustom: 1`)
   - Only restores user-created content from Firebase
   - **Result**: All default content is permanently lost

2. **What Gets Lost:**
   - ❌ **Default groups** (`isDefault: true`) - These contain all the built-in action categories
   - ❌ **Default actions that user disabled** (`isCustom: 0, isEnabled: 0`) - User preferences lost
   - ❌ **All default tiles** (`isCustom: 0`) - The actual game actions

3. **Why Users See "No Actions":**
   - Default groups deleted → No action categories available
   - Default actions deleted → No actions to select
   - Only custom content restored → Most users have minimal custom content

## 🎯 **Solution Strategy**

### **Core Principle: Surgical Sync, Not Nuclear Delete**

Instead of "delete everything and restore from Firebase", we need "sync only what should be synced".

### **Data Classification**

| Data Type                                       | Should Sync? | Rationale               |
| ----------------------------------------------- | ------------ | ----------------------- |
| Custom tiles (`isCustom: 1`)                    | ✅ Yes       | User-created content    |
| Custom groups (`isDefault: false`)              | ✅ Yes       | User-created groups     |
| Disabled defaults (`isCustom: 0, isEnabled: 0`) | ✅ Yes       | User preferences        |
| Default groups (`isDefault: true`)              | ❌ No        | App data, not user data |
| Default tiles (`isCustom: 0, isEnabled: 1`)     | ❌ No        | App data, not user data |
| Game boards                                     | ✅ Yes       | User-created boards     |
| Settings                                        | ✅ Yes       | User preferences        |

## 🔧 **Implementation Plan**

### **Phase 1: Fix Upload Functions**

#### **1.1 Update `syncCustomTilesToFirebase()`**

```typescript
// BEFORE: Only sync custom tiles
const customTiles = await getTiles({ isCustom: 1 });

// AFTER: Sync custom tiles AND disabled defaults
const customTiles = await getTiles({ isCustom: 1 });
const disabledDefaults = await getTiles({ isCustom: 0, isEnabled: 0 });

await setDoc(
  doc(db, 'user-data', user.uid),
  {
    customTiles,
    disabledDefaults, // NEW: Include user's disabled default actions
    lastUpdated: new Date(),
  },
  { merge: true }
);
```

#### **1.2 Update `syncCustomGroupsToFirebase()`**

```typescript
// BEFORE: Sync ALL groups (including defaults)
const customGroups = await getCustomGroups();

// AFTER: Sync only user-created groups
const customGroups = await getCustomGroups({ isDefault: false });
```

### **Phase 2: Fix Download Functions**

#### **2.1 Completely Rewrite `syncDataFromFirebase()`**

**Current Problematic Logic:**

```typescript
// BROKEN: Nuclear delete approach
await deleteAllCustomGroups(); // Deletes default groups!
await deleteAllCustomTiles(); // Deletes everything!
```

**New Surgical Logic:**

```typescript
// 1. Only clear user-created custom groups (preserve defaults)
await clearUserCustomGroups(); // isDefault: false only

// 2. Only clear custom tiles (preserve defaults)
await deleteAllCustomTiles(); // isCustom: 1 only

// 3. Reset disabled defaults to enabled (will be re-disabled from Firebase)
await resetDisabledDefaults();

// 4. Restore custom content from Firebase
// 5. Restore disabled defaults from Firebase
```

#### **2.2 New Helper Functions Needed**

```typescript
// Clear only user-created custom groups (NOT default groups)
async function clearUserCustomGroups(): Promise<boolean>;

// Reset disabled defaults back to enabled state before restoring from Firebase
async function resetDisabledDefaults(): Promise<boolean>;

// Apply disabled defaults from Firebase to existing default tiles
async function applyDisabledDefaults(disabledDefaults: CustomTilePull[]): Promise<boolean>;
```

### **Phase 3: Data Migration Strategy**

#### **3.1 Backward Compatibility**

- Handle existing Firebase data that doesn't have `disabledDefaults` field
- Gracefully handle users who have both old and new data formats
- Ensure no data loss during transition

#### **3.2 Firebase Document Structure**

```typescript
// NEW Firebase document structure
interface UserData {
  customTiles: CustomTilePull[]; // User-created tiles (isCustom: 1)
  disabledDefaults: CustomTilePull[]; // User-disabled defaults (isCustom: 0, isEnabled: 0)
  customGroups: CustomGroupPull[]; // User-created groups (isDefault: false)
  gameBoards: GameBoard[]; // User-created boards
  settings: Partial<Settings>; // User preferences
  lastUpdated: Date;
}
```

### **Phase 4: Testing Strategy**

#### **4.1 Unit Tests**

- Test upload functions sync correct data
- Test download functions preserve default content
- Test edge cases (empty data, corrupted data)
- Test backward compatibility

#### **4.2 Integration Tests**

- Test complete login workflow
- Test user disables action → logs out → logs in → action still disabled
- Test user creates custom content → sync works correctly
- Test mixed scenarios (custom + disabled defaults)

#### **4.3 Manual Testing Scenarios**

1. **Fresh User**: New account should have all defaults enabled
2. **Existing User**: Login should preserve all customizations
3. **Power User**: Many custom groups/tiles should sync correctly
4. **Edge Cases**: Empty Firebase data, corrupted data

## 🚦 **Implementation Steps**

### **Step 1: Create Helper Functions**

- `clearUserCustomGroups()` - Remove only user-created groups
- `resetDisabledDefaults()` - Reset disabled tiles to enabled
- `applyDisabledDefaults()` - Apply Firebase disabled state to local tiles

### **Step 2: Update Upload Functions**

- Modify `syncCustomTilesToFirebase()` to include disabled defaults
- Modify `syncCustomGroupsToFirebase()` to exclude default groups

### **Step 3: Rewrite Download Function**

- Replace nuclear delete with surgical approach
- Preserve all default content
- Only modify what needs to be synced

### **Step 4: Add Comprehensive Tests**

- Unit tests for all functions
- Integration tests for login workflow
- Edge case testing

### **Step 5: Gradual Rollout**

- Feature flag for new sync logic
- Parallel testing with old logic
- Monitor for any data loss issues

## ⚠️ **Risk Mitigation**

### **Critical Risks**

1. **Data Loss**: Users losing their customizations during transition
2. **Migration Failure**: Sync failing and leaving app in broken state
3. **Performance**: Sync taking too long with surgical approach

### **Mitigation Strategies**

1. **Extensive Testing**: Comprehensive test suite before deployment
2. **Backup Strategy**: Users can export their data before upgrade
3. **Rollback Plan**: Ability to revert to old sync logic if needed
4. **Monitoring**: Track sync success/failure rates post-deployment

## 📊 **Success Criteria**

### **Primary Goals**

- ✅ Users retain all actions after login
- ✅ User customizations (disabled actions) are preserved
- ✅ Custom content continues to sync correctly
- ✅ No data loss for existing users

### **Secondary Goals**

- ✅ Improved sync performance (surgical vs nuclear)
- ✅ Better error handling and recovery
- ✅ Comprehensive test coverage
- ✅ Clear documentation for future maintenance

## 🔄 **Rollout Plan**

### **Phase A: Development & Testing**

1. Implement helper functions
2. Update sync functions
3. Create comprehensive test suite
4. Internal testing

### **Phase B: Staging Deployment**

1. Deploy to staging environment
2. Test with sample user data
3. Performance testing
4. Edge case validation

### **Phase C: Production Rollout**

1. Feature flag deployment (small percentage)
2. Monitor metrics and error rates
3. Gradual rollout to all users
4. Post-deployment monitoring

## 📝 **Technical Specifications**

### **File Changes Required**

- `src/services/syncService.ts` - Main sync logic
- `src/services/__tests__/syncService.test.ts` - Comprehensive tests
- `src/stores/customTiles.ts` - Helper functions if needed
- `src/stores/customGroups.ts` - Helper functions if needed

### **Database Schema Changes**

- Firebase documents will include new `disabledDefaults` field
- No Dexie schema changes required (using existing fields)

### **Performance Considerations**

- Surgical approach may be slightly slower but more reliable
- Batch operations where possible
- Implement proper error handling and timeouts

---

## 🚀 **Next Steps**

1. **Review this plan** with stakeholders
2. **Implement helper functions** first
3. **Update upload functions** with new logic
4. **Rewrite download function** with surgical approach
5. **Create comprehensive tests** for all scenarios
6. **Deploy with careful monitoring**

This plan ensures we fix the critical data loss bug while maintaining backward compatibility and preventing future issues.
