# Gender-Inclusive System - UX Design & Implementation

## 🚨 Critical Issues from Initial Implementation

### Issue 1: Context-Specific Anatomy
**Problem**: `{hole}` placeholder doesn't respect anatomical context.

**Example**:
- Butt Play action: "Finger your {hole}"
- Female player: "Finger your pussy" ❌ WRONG - should be "ass"
- Male player: "Finger your hole" ✓ Correct

**Root Cause**: Placeholders are gender-aware but not context-aware.

**Solution**: Action-group-level anatomy filtering or context tags

---

### Issue 2: Anatomy-Specific Action Groups
**Problem**: Some action groups are anatomy-specific and shouldn't use generic placeholders.

**Examples**:
- "Clit Training" - female anatomy only
- "Cock Worship" - male anatomy only
- "Butt Play" - universal (all genders have an anus)

**Current Behavior**:
- Male player gets "Clit Training" → {genital} → "dick" ❌ Nonsensical
- Female player gets "Bating" (male-focused) → confusing actions

**Solution**: Gender-based action group filtering

---

### Issue 3: Missing UX
**Problem**: No design for how users actually interact with the gender system.

**Questions**:
- When do players set their gender?
- How is it presented?
- What's the default behavior?
- How do custom tile creators use placeholders?

---

## 🎨 Revised UX Design

### Design Principles
1. **Simple by default**: Gender is optional, defaults work for everyone
2. **Privacy-first**: Clear messaging that it's only for action personalization
3. **Discoverable**: Users learn about the feature naturally
4. **Non-blocking**: Never prevent gameplay due to missing gender
5. **Expandable**: Power users can access advanced features

---

## 📱 User Flow: Gender Selection

### Flow 1: Local Multiplayer Setup

**Current Flow**:
```
Add Player → Name → Role (dom/sub/vers) → Sound → Done
```

**New Flow**:
```
Add Player → Name → Role → Gender (Optional) → Sound → Done
```

**UI Mockup**:

```
┌─────────────────────────────────────────┐
│ Add Player 1                            │
├─────────────────────────────────────────┤
│                                         │
│ Name                                    │
│ ┌─────────────────────────────────────┐│
│ │ Jessica                             ││
│ └─────────────────────────────────────┘│
│                                         │
│ Role                                    │
│ ┌───────┐ ┌───────┐ ┌───────┐         │
│ │  Dom  │ │● Sub  │ │ Vers  │         │
│ └───────┘ └───────┘ └───────┘         │
│                                         │
│ Gender (Optional) ℹ️                    │
│ ┌───────────────────────────────────┐  │
│ │ Used to personalize action text   │  │
│ └───────────────────────────────────┘  │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │  Male  │ │●Female │ │Non-bin │      │
│ └────────┘ └────────┘ └────────┘      │
│ ┌───────────────────┐                  │
│ │ Prefer not to say │                  │
│ └───────────────────┘                  │
│                                         │
│ [Skip]                    [Next Step →]│
└─────────────────────────────────────────┘
```

**Info Tooltip (ℹ️)**:
> **Why gender?**
> This helps us show actions that match your anatomy. For example:
> - "Touch your chest" → "Touch your breasts" (if female)
> - Completely optional and private
> - You can skip this or select "Prefer not to say"

**Default**: If skipped → "Prefer not to say" → neutral terms used

---

### Flow 2: Online/Solo Mode Setup

**When**: First time building game OR in Settings

**Location**: Settings → Player Profile → Gender (Optional)

**UI Mockup**:

```
┌─────────────────────────────────────────┐
│ Player Profile                          │
├─────────────────────────────────────────┤
│                                         │
│ Display Name                            │
│ ┌─────────────────────────────────────┐│
│ │ Mike                                ││
│ └─────────────────────────────────────┘│
│                                         │
│ Role                                    │
│ ┌───────┐ ┌───────┐ ┌───────┐         │
│ │● Dom  │ │  Sub  │ │ Vers  │         │
│ └───────┘ └───────┘ └───────┘         │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Personalization (Optional)          ││
│ │                                     ││
│ │ Gender                              ││
│ │ ┌─────────────────────────────────┐││
│ │ │ Male                        ▼   │││
│ │ └─────────────────────────────────┘││
│ │                                     ││
│ │ This personalizes action text to   ││
│ │ match your anatomy. Only stored    ││
│ │ locally, never shared publicly.    ││
│ └─────────────────────────────────────┘│
│                                         │
│                         [Save Changes] │
└─────────────────────────────────────────┘
```

---

## 🎯 Action Group Filtering

### Revised Strategy: Anatomy Compatibility

**Problem**: Not all action groups work for all anatomies.

**Solution**: Add `anatomyRequirement` to action groups.

```typescript
interface CustomGroupBase {
  name: string;
  label: string;
  type: GroupType;
  anatomyRequirement?: AnatomyRequirement; // NEW
  // ...
}

type AnatomyRequirement =
  | 'any'           // Works for anyone
  | 'penis'         // Requires penis (male, some non-binary)
  | 'vulva'         // Requires vulva/vagina (female, some non-binary)
  | 'anus'          // Everyone has one
  | 'breasts';      // Requires breasts (female, some male/non-binary)
```

**Examples**:

| Action Group | Anatomy Requirement | Available To |
|-------------|---------------------|--------------|
| Kissing | `any` | Everyone |
| Butt Play | `anus` (any) | Everyone |
| Clit Training | `vulva` | Female, opt-in non-binary |
| Cock Worship | `penis` | Male, opt-in non-binary |
| Bating | `penis` | Male, opt-in non-binary |
| Breast Play | `breasts` | Female, opt-in non-binary, some males |

**UI Impact**:

When selecting actions, incompatible groups are:
1. **Hidden** (simple mode), OR
2. **Grayed out with explanation** (advanced mode)

```
Action Selection
┌─────────────────────────────────────────┐
│ Available Actions                       │
├─────────────────────────────────────────┤
│ ✓ Foreplay (Universal)                  │
│ ✓ Kissing (Universal)                   │
│ ✓ Butt Play (Universal)                 │
│ ✓ Clit Training (Female)                │
│ ✓ Breast Play (Female)                  │
│ ⊘ Cock Worship (Requires male anatomy)  │ ← Grayed out for female player
│ ⊘ Bating (Requires male anatomy)        │ ← Grayed out
│                                         │
│ [Show incompatible actions] ☐           │ ← Toggle for advanced users
└─────────────────────────────────────────┘
```

---

## 🛠️ Custom Tiles UX

### Problem: How do custom tile creators use placeholders?

### Solution: Placeholder Helper

**Location**: Manage Game Tiles → Add/Edit Tile

**UI Mockup**:

```
┌─────────────────────────────────────────────────────┐
│ Add Custom Action                                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Action Group                                        │
│ ┌─────────────────────────────────────┐             │
│ │ Kissing                         ▼   │             │
│ └─────────────────────────────────────┘             │
│                                                     │
│ Intensity                                           │
│ ┌───────┐ ┌───────┐ ┌───────┐                      │
│ │ Light │ │●Medium│ │Intense│                      │
│ └───────┘ └───────┘ └───────┘                      │
│                                                     │
│ Action Text                                         │
│ ┌─────────────────────────────────────────────────┐│
│ │ {dom} kisses {sub} on the {chest}.              ││
│ │                                                 ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ [Insert Placeholder ▼]                              │
│ ┌─────────────────────────────────────────────────┐│
│ │ 📝 Available Placeholders                       ││
│ │                                                 ││
│ │ Role Placeholders:                              ││
│ │  {player}  - Current player                     ││
│ │  {dom}     - A dominant player                  ││
│ │  {sub}     - A submissive player                ││
│ │                                                 ││
│ │ Anatomy Placeholders (gender-aware):            ││
│ │  {genital} - dick/pussy/genitals                ││
│ │  {hole}    - hole/pussy/hole                    ││
│ │  {chest}   - chest/breasts/chest                ││
│ │                                                 ││
│ │ Pronouns (gender-aware):                        ││
│ │  {pronoun_subject}     - he/she/they            ││
│ │  {pronoun_possessive}  - his/her/their          ││
│ │                                                 ││
│ │ [See full list & examples →]                    ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ Preview                                             │
│ ┌─────────────────────────────────────────────────┐│
│ │ Mike (male, dom):                               ││
│ │ "Mike kisses Jessica on the chest."             ││
│ │                                                 ││
│ │ Jessica (female, sub):                          ││
│ │ "Mike kisses Jessica on the breasts."           ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│                             [Cancel]  [Save Action] │
└─────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Placeholder dropdown**: Click to insert
2. **Inline help**: Shows what each placeholder does
3. **Live preview**: See how it looks for different genders
4. **Expandable**: Full documentation link for power users

---

### Advanced: Placeholder Picker

**For power users**, clicking a placeholder opens a detail view:

```
┌─────────────────────────────────────────┐
│ {genital} Placeholder                   │
├─────────────────────────────────────────┤
│                                         │
│ What it does:                           │
│ Adapts to player's anatomy              │
│                                         │
│ Male     → dick, cock, penis            │
│ Female   → pussy, clit, vagina          │
│ Non-bin  → genitals                     │
│                                         │
│ Example:                                │
│ "Touch your {genital}"                  │
│ → "Touch your dick" (male)              │
│ → "Touch your pussy" (female)           │
│                                         │
│ Best for: Solo actions, self-touch      │
│                                         │
│               [Insert]  [Learn More →]  │
└─────────────────────────────────────────┘
```

---

## 🔧 Revised Implementation Plan

### Phase 1: Fix Core Issues ✅ (Current PR)
- [x] Anatomy placeholder service
- [x] Type definitions
- [x] Test suite
- [ ] Fix butt play context issue
- [ ] Add anatomy requirement filtering

### Phase 2: Action Group Filtering (Next PR)
- [ ] Add `anatomyRequirement` field to CustomGroup type
- [ ] Update action group JSON files with requirements
- [ ] Implement filtering logic in buildGame service
- [ ] Hide incompatible groups in action selection UI

### Phase 3: Gender Selection UI (Next PR)
- [ ] Add gender selector to LocalPlayerSetup
- [ ] Add gender selector to Settings → Player Profile
- [ ] Add info tooltips explaining the feature
- [ ] Add skip/optional handling

### Phase 4: Custom Tiles UX (Next PR)
- [ ] Add placeholder helper to Add/Edit Tile screen
- [ ] Implement placeholder dropdown/picker
- [ ] Add live preview with different genders
- [ ] Add "See examples" link to documentation

### Phase 5: Context-Aware Placeholders (Future)
- [ ] Investigate context tags (e.g., `{hole:anal}` vs `{hole:vaginal}`)
- [ ] OR: Create separate placeholders (`{anal_hole}`, `{vagina}`)
- [ ] Update action files accordingly

---

## 🎯 Immediate Next Steps

Would you like me to:

1. **Fix the butt play issue** - Make `{hole}` context-aware or rename to `{anal_hole}` in butt play actions
2. **Add anatomy requirements** - Filter out incompatible action groups (e.g., hide "Clit Training" from male players)
3. **Build the gender selector UI** - Start with LocalPlayerSetup component
4. **All of the above** - Continue comprehensive implementation

What would you like me to prioritize?
