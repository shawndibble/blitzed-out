# Anatomy Placeholder Implementation Plan

## Overview
This document outlines the comprehensive plan for implementing gender-inclusive anatomy placeholders across the entire application, supporting all 5 languages (EN, ES, FR, ZH, HI) and both local/online multiplayer modes.

## Design Principles
1. **Backward Compatibility**: Existing actions without anatomy placeholders continue to work
2. **Privacy First**: Gender is optional (`prefer-not-say` default)
3. **Inclusive by Default**: Support male, female, non-binary, and neutral options
4. **No Breaking Changes**: All existing tests must pass
5. **Comprehensive Testing**: Cover all gender combinations × all game modes

---

## 1. Anatomy Placeholder System

### 1.1 New Placeholders

| Placeholder | Male | Female | Non-Binary | Prefer Not Say |
|------------|------|--------|------------|----------------|
| `{genital}` | penis/dick/cock | clit/pussy | genitals | genitals |
| `{hole}` | hole/ass | pussy/hole | hole | hole |
| `{chest}` | chest/pecs | breasts/chest | chest | chest |
| `{pronoun_subject}` | he | she | they | they |
| `{pronoun_object}` | him | her | them | them |
| `{pronoun_possessive}` | his | her | their | their |
| `{pronoun_reflexive}` | himself | herself | themselves | themselves |

### 1.2 Context-Aware Terminology

Some placeholders use **context-aware** replacement based on the action:
- `{genital}` in intimate contexts → "dick" / "pussy" / "genitals"
- `{genital}` in medical/neutral contexts → "penis" / "vagina" / "genitals"

For simplicity in v1, we'll use consistent informal terms unless specified otherwise.

### 1.3 Locale-Specific Mappings

Each language has its own anatomy mapping:

**Spanish (ES)**:
- `{genital}`: pene/polla (male), clítoris/vagina (female), genitales (neutral)
- `{hole}`: agujero/culo (male), vagina/agujero (female), agujero (neutral)
- `{chest}`: pecho (male), pechos/senos (female), pecho (neutral)

**French (FR)**:
- `{genital}`: pénis/bite (male), clitoris/chatte (female), organes génitaux (neutral)
- `{hole}`: trou/cul (male), chatte/trou (female), trou (neutral)
- `{chest}`: torse/pectoraux (male), seins/poitrine (female), torse (neutral)

**Chinese (ZH)**:
- `{genital}`: 阴茎/鸡巴 (male), 阴蒂/阴道 (female), 生殖器 (neutral)
- `{hole}`: 洞/肛门 (male), 阴道/洞 (female), 洞 (neutral)
- `{chest}`: 胸部/胸肌 (male), 乳房/胸部 (female), 胸部 (neutral)

**Hindi (HI)**:
- `{genital}`: लिंग (male), भगशेफ/योनि (female), जननांग (neutral)
- `{hole}`: छेद/गुदा (male), योनि/छेद (female), छेद (neutral)
- `{chest}`: छाती (male), स्तन/छाती (female), छाती (neutral)

---

## 2. Type System Updates

### 2.1 Player Gender Type

```typescript
// src/types/localPlayers.ts

/**
 * Player gender options for anatomy placeholder replacement
 */
export type PlayerGender = 'male' | 'female' | 'non-binary' | 'prefer-not-say';

/**
 * Anatomy placeholder type for content filtering
 */
export type AnatomyPlaceholder =
  | 'genital'
  | 'hole'
  | 'chest'
  | 'pronoun_subject'
  | 'pronoun_object'
  | 'pronoun_possessive'
  | 'pronoun_reflexive';
```

### 2.2 LocalPlayer Interface Update

```typescript
export interface LocalPlayer {
  id: string;
  name: string;
  gender: PlayerGender;  // NEW
  role: PlayerRole;
  order: number;
  isActive: boolean;
  deviceId: string;
  location: number;
  isFinished: boolean;
  sound?: string;
}
```

### 2.3 Online Player Interface Update

```typescript
// src/types/player.ts

export interface Player {
  uid: string;
  displayName: string;
  photoURL?: string;
  gender?: PlayerGender;  // NEW - optional for backward compatibility
  isSelf: boolean;
  isFinished: boolean;
}
```

---

## 3. Anatomy Mapping Service

### 3.1 Service Structure

```typescript
// src/services/anatomyPlaceholderService.ts

export interface AnatomyMapping {
  genital: string;
  hole: string;
  chest: string;
  pronoun_subject: string;
  pronoun_object: string;
  pronoun_possessive: string;
  pronoun_reflexive: string;
}

export interface LocaleAnatomyMappings {
  male: AnatomyMapping;
  female: AnatomyMapping;
  'non-binary': AnatomyMapping;
  'prefer-not-say': AnatomyMapping;
}
```

### 3.2 Mapping Data Structure

Stored in: `src/locales/{locale}/anatomy-mappings.json`

Example: `src/locales/en/anatomy-mappings.json`
```json
{
  "male": {
    "genital": "dick",
    "hole": "hole",
    "chest": "chest",
    "pronoun_subject": "he",
    "pronoun_object": "him",
    "pronoun_possessive": "his",
    "pronoun_reflexive": "himself"
  },
  "female": {
    "genital": "pussy",
    "hole": "pussy",
    "chest": "breasts",
    "pronoun_subject": "she",
    "pronoun_object": "her",
    "pronoun_possessive": "her",
    "pronoun_reflexive": "herself"
  },
  "non-binary": {
    "genital": "genitals",
    "hole": "hole",
    "chest": "chest",
    "pronoun_subject": "they",
    "pronoun_object": "them",
    "pronoun_possessive": "their",
    "pronoun_reflexive": "themselves"
  },
  "prefer-not-say": {
    "genital": "genitals",
    "hole": "hole",
    "chest": "chest",
    "pronoun_subject": "they",
    "pronoun_object": "them",
    "pronoun_possessive": "their",
    "pronoun_reflexive": "themselves"
  }
}
```

---

## 4. Action String Replacement Updates

### 4.1 Processing Order

1. Replace role placeholders (`{player}`, `{dom}`, `{sub}`) → player names
2. Replace anatomy placeholders based on player's gender
3. Replace pronoun placeholders based on player's gender
4. Capitalize first letters after periods

### 4.2 Edge Cases

**Multi-player actions with different genders:**
```
Original: "{dom} rubs their {genital} against {sub}'s {hole}."

With Mike (male, dom) and Jessica (female, sub):
Result: "Mike rubs his dick against Jessica's pussy."

With Jessica (female, dom) and Mike (male, sub):
Result: "Jessica rubs her strapon against Mike's hole."
```

**Challenge**: How do we handle female dom with `{genital}` placeholder?

**Solution Options**:
1. **Strapon assumption**: Female + dom role + `{genital}` → "strapon"
2. **Alternative phrasing**: Use `{genital_or_toy}` → "strapon" / "dick" / "toy"
3. **Action variants**: Separate actions for different anatomies

**Decision for v1**: Use strapon for female dom in penetrative contexts.

### 4.3 Implementation

Update `src/services/actionStringReplacement.ts`:

```typescript
function replaceAnatomyPlaceholders(
  action: string,
  gender: PlayerGender,
  locale: string,
  role?: PlayerRole
): string {
  const mappings = getAnatomyMappings(locale, gender);

  let result = action;

  // Special case: female dom with {genital} in penetrative context
  if (gender === 'female' && role === 'dom' && result.includes('{genital}')) {
    result = result.replace(/{genital}/g, 'strapon');
  } else {
    // Standard anatomy replacements
    result = result.replace(/{genital}/g, mappings.genital);
  }

  result = result.replace(/{hole}/g, mappings.hole);
  result = result.replace(/{chest}/g, mappings.chest);
  result = result.replace(/{pronoun_subject}/g, mappings.pronoun_subject);
  result = result.replace(/{pronoun_object}/g, mappings.pronoun_object);
  result = result.replace(/{pronoun_possessive}/g, mappings.pronoun_possessive);
  result = result.replace(/{pronoun_reflexive}/g, mappings.pronoun_reflexive);

  return result;
}
```

---

## 5. Action JSON File Updates

### 5.1 Priority Groups (Require Updates)

**High Priority** (Most anatomy-specific):
1. ✏️ `buttPlay.json` - ~90% need updates
2. ✏️ `bating.json` - ~100% male-specific
3. ✏️ `clitTraining.json` - ~100% female-specific
4. ✏️ `throatTraining.json` - ~60% need updates
5. ✏️ `titTorture.json` - ~80% need updates
6. ✏️ `bodyWorship.json` - ~40% need updates

**Medium Priority**:
7. ✏️ `breathPlay.json` - ~20% need updates
8. ✏️ `humiliation.json` - ~30% need updates (pronouns)
9. ✏️ `pissPlay.json` - ~50% need updates

**Low Priority** (Already neutral):
- ✅ `kissing.json`
- ✅ `spanking.json`
- ✅ `bondage.json`
- ✅ `alcohol.json`
- ✅ `vaping.json`
- ✅ `stripping.json`
- ✅ `tickling.json`
- ✅ `confessions.json`
- ✅ `electric.json`
- ✅ `footPlay.json`
- ✅ `gasMask.json`
- ✅ `poppers.json`
- ✅ `ballBusting.json` (already niche)

### 5.2 Example Conversions

**Before** (`buttPlay.json`):
```json
"{dom} rubs their dick around {sub}'s hole."
```

**After**:
```json
"{dom} rubs their {genital} around {sub}'s {hole}."
```

**Before** (`bating.json`):
```json
"Apply lube to your dick."
```

**After**:
```json
"Apply lube to your {genital}."
```

**Before** (`clitTraining.json`):
```json
"{sub} traces circles around {dom}'s clit with their finger."
```

**After**:
```json
"{sub} traces circles around {dom}'s {genital} with their finger."
```

---

## 6. UI Updates

### 6.1 Manage Game Tiles - Placeholder Help

Add help section to `src/components/CustomTiles/index.tsx`:

```typescript
<Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
  <Typography variant="h6">{t('customTiles.placeholderHelp.title')}</Typography>
  <Typography variant="body2" sx={{ mt: 1 }}>
    {t('customTiles.placeholderHelp.description')}
  </Typography>

  <Typography variant="subtitle2" sx={{ mt: 2 }}>
    {t('customTiles.placeholderHelp.rolePlaceholders')}
  </Typography>
  <ul>
    <li><code>{'{player}'}</code> - {t('customTiles.placeholderHelp.player')}</li>
    <li><code>{'{dom}'}</code> - {t('customTiles.placeholderHelp.dom')}</li>
    <li><code>{'{sub}'}</code> - {t('customTiles.placeholderHelp.sub')}</li>
  </ul>

  <Typography variant="subtitle2" sx={{ mt: 2 }}>
    {t('customTiles.placeholderHelp.anatomyPlaceholders')}
  </Typography>
  <ul>
    <li><code>{'{genital}'}</code> - {t('customTiles.placeholderHelp.genital')}</li>
    <li><code>{'{hole}'}</code> - {t('customTiles.placeholderHelp.hole')}</li>
    <li><code>{'{chest}'}</code> - {t('customTiles.placeholderHelp.chest')}</li>
  </ul>

  <Accordion>
    <AccordionSummary>{t('customTiles.placeholderHelp.examples')}</AccordionSummary>
    <AccordionDetails>
      <Typography variant="body2">
        "{'{dom} kisses {sub} on the {chest}.'}"
        <br />→ "Mike kisses Jessica on the breasts."
      </Typography>
    </AccordionDetails>
  </Accordion>
</Box>
```

### 6.2 Translation Keys

Add to `src/locales/en/translation.json`:

```json
{
  "customTiles": {
    "placeholderHelp": {
      "title": "Available Placeholders",
      "description": "Use placeholders to create gender-inclusive actions that adapt to each player.",
      "rolePlaceholders": "Role Placeholders",
      "anatomyPlaceholders": "Anatomy Placeholders (Gender-Aware)",
      "player": "The current player's name",
      "dom": "A dominant/switch player's name",
      "sub": "A submissive/switch player's name",
      "genital": "Adapts to player gender (dick/pussy/genitals)",
      "hole": "Adapts to player gender (hole/pussy/hole)",
      "chest": "Adapts to player gender (chest/breasts/chest)",
      "examples": "See Examples"
    }
  },
  "player": {
    "gender": {
      "label": "Gender (Optional)",
      "description": "Used only for action text adaptation",
      "male": "Male",
      "female": "Female",
      "nonBinary": "Non-binary",
      "preferNotSay": "Prefer not to say"
    }
  }
}
```

---

## 7. Testing Strategy

### 7.1 New Test Files

**Create**:
- `src/services/__tests__/anatomyPlaceholderService.test.ts`
- `src/services/__tests__/actionStringReplacement.test.ts` (currently missing!)

### 7.2 Test Coverage

**Unit Tests** (`anatomyPlaceholderService.test.ts`):
```typescript
describe('anatomyPlaceholderService', () => {
  describe('getAnatomyMappings', () => {
    it('returns correct mappings for male gender in EN', () => {
      const mappings = getAnatomyMappings('en', 'male');
      expect(mappings.genital).toBe('dick');
      expect(mappings.chest).toBe('chest');
    });

    it('returns correct mappings for female gender in ES', () => {
      const mappings = getAnatomyMappings('es', 'female');
      expect(mappings.genital).toBe('clítoris');
    });

    it('returns neutral mappings for prefer-not-say', () => {
      const mappings = getAnatomyMappings('en', 'prefer-not-say');
      expect(mappings.genital).toBe('genitals');
      expect(mappings.pronoun_subject).toBe('they');
    });
  });
});
```

**Integration Tests** (`actionStringReplacement.test.ts`):
```typescript
describe('actionStringReplacement with anatomy placeholders', () => {
  describe('local multiplayer mode', () => {
    it('replaces anatomy placeholders for male player', () => {
      const players: LocalPlayer[] = [
        { id: '1', name: 'Mike', gender: 'male', role: 'dom', ... },
        { id: '2', name: 'Jessica', gender: 'female', role: 'sub', ... }
      ];

      const result = actionStringReplacement(
        '{dom} rubs their {genital} against {sub}\'s {hole}.',
        'dom',
        'Mike',
        players,
        false
      );

      expect(result).toBe('Mike rubs his dick against Jessica\'s pussy.');
    });

    it('handles female dom with strapon logic', () => {
      const players: LocalPlayer[] = [
        { id: '1', name: 'Jessica', gender: 'female', role: 'dom', ... },
        { id: '2', name: 'Mike', gender: 'male', role: 'sub', ... }
      ];

      const result = actionStringReplacement(
        '{dom} penetrates {sub} with their {genital}.',
        'dom',
        'Jessica',
        players,
        false
      );

      expect(result).toBe('Jessica penetrates Mike with her strapon.');
    });

    it('handles non-binary player', () => {
      const players: LocalPlayer[] = [
        { id: '1', name: 'Alex', gender: 'non-binary', role: 'vers', ... }
      ];

      const result = actionStringReplacement(
        '{player} touches their {genital}.',
        'vers',
        'Alex',
        players,
        false
      );

      expect(result).toBe('Alex touches their genitals.');
    });
  });

  describe('online multiplayer mode', () => {
    it('replaces anatomy placeholders based on current player gender', () => {
      const result = actionStringReplacement(
        'Touch your {genital} for 30 seconds.',
        'sub',
        'Mike',
        undefined, // no localPlayers
        false,
        'male' // gender parameter
      );

      expect(result).toBe('Touch your dick for 30 seconds.');
    });
  });

  describe('edge cases', () => {
    it('handles missing gender gracefully', () => {
      const result = actionStringReplacement(
        '{player} touches their {genital}.',
        'sub',
        'Unknown',
        undefined,
        false,
        undefined // no gender
      );

      expect(result).toBe('Unknown touches their genitals.');
    });
  });
});
```

### 7.3 Update Existing Test Mocks

Files to update:
- ✏️ `src/views/Room/GameBoard/__tests__/GameBoard.test.tsx`
- ✏️ `src/views/Room/GameBoard/__tests__/index.test.tsx`
- ✏️ `src/hooks/__tests__/usePlayerMove.test.tsx`

Add anatomy placeholder replacement to mocks:
```typescript
vi.mocked(actionStringReplacement).mockImplementation(
  (description, role, displayName, localPlayers, useGenericPlaceholders, gender) => {
    if (!description) return '';

    let result = description;

    // Role placeholders
    if (useGenericPlaceholders) {
      result = result
        .replace(/{player}/g, 'the current player')
        .replace(/{dom}/g, 'a dominant')
        .replace(/{sub}/g, 'a submissive');
    } else {
      result = result
        .replace(/{player}/g, displayName || '')
        .replace(/{(sub|dom)}/g, displayName || '');
    }

    // Anatomy placeholders
    const anatomyMap = {
      male: { genital: 'dick', hole: 'hole', chest: 'chest' },
      female: { genital: 'pussy', hole: 'pussy', chest: 'breasts' },
      'non-binary': { genital: 'genitals', hole: 'hole', chest: 'chest' }
    };

    const mapping = anatomyMap[gender || 'non-binary'];
    result = result
      .replace(/{genital}/g, mapping.genital)
      .replace(/{hole}/g, mapping.hole)
      .replace(/{chest}/g, mapping.chest);

    return result;
  }
);
```

---

## 8. Migration Strategy

### 8.1 Database Migration

No database migration needed! Anatomy placeholders are applied at **render time**, not storage time.

### 8.2 Existing Custom Actions

Users' custom actions continue to work:
- Old actions without anatomy placeholders → work as-is
- Old actions with hardcoded anatomy → still work, just not gender-adaptive
- New actions can use anatomy placeholders → gender-adaptive

### 8.3 Default Actions Update

All default actions in `src/locales/*/` will be updated to use anatomy placeholders where appropriate.

---

## 9. Implementation Checklist

### Phase 1: Foundation (Types & Services)
- [x] Add `PlayerGender` type
- [ ] Update `LocalPlayer` interface
- [ ] Update `Player` interface
- [ ] Create `anatomyPlaceholderService.ts`
- [ ] Create anatomy mapping JSON files (×5 languages)
- [ ] Update `actionStringReplacement.ts`

### Phase 2: Action File Updates
- [ ] Update EN action files (×9 priority files)
- [ ] Update ES action files (×9 priority files)
- [ ] Update FR action files (×9 priority files)
- [ ] Update ZH action files (×9 priority files)
- [ ] Update HI action files (×9 priority files)

### Phase 3: UI Updates
- [ ] Add gender selector to LocalPlayerSetup
- [ ] Add gender selector to online player setup
- [ ] Add placeholder help to Manage Game Tiles
- [ ] Update all translation.json files (×5 languages)

### Phase 4: Testing
- [ ] Create `anatomyPlaceholderService.test.ts`
- [ ] Create `actionStringReplacement.test.ts`
- [ ] Update existing test mocks (×3 files)
- [ ] Run full test suite
- [ ] Manual testing: local multiplayer (all gender combos)
- [ ] Manual testing: online multiplayer (all gender combos)

### Phase 5: Documentation & Deployment
- [ ] Update CLAUDE.md with anatomy placeholder info
- [ ] Create migration guide for custom action creators
- [ ] Commit and push to feature branch
- [ ] Create comprehensive PR

---

## 10. Expected Outcomes

### User Experience
- ✅ Actions adapt naturally to player genders
- ✅ Inclusive for all gender identities
- ✅ No breaking changes for existing users
- ✅ Clear documentation for custom action creators

### Technical
- ✅ All 1,500+ default actions updated across 5 languages
- ✅ 100% test coverage for anatomy replacement logic
- ✅ Zero regressions in existing functionality
- ✅ Performance: <1ms overhead per action replacement

### Metrics
- **Files Modified**: ~60 action JSON files (×5 languages = 300 files)
- **New Files**: 10 (anatomy mappings + tests)
- **Test Coverage**: +200 new test cases
- **Lines of Code**: +1,500 LOC (mostly JSON translations)

---

## 11. Future Enhancements (Post-v1)

1. **Custom Anatomy Preferences**: Allow players to choose specific terminology
2. **Toy Integration**: `{toy}` placeholder for strapon/dildo/toy
3. **Context-Aware Formality**: Medical vs casual terminology
4. **Action Variants**: Multiple phrasings for the same action
5. **AI-Assisted Translation**: Auto-translate anatomy placeholders
6. **Accessibility**: Screen reader optimizations for placeholders

---

## Timeline Estimate

- **Phase 1** (Foundation): 4 hours
- **Phase 2** (Action Updates): 12 hours (2-3 hours per language)
- **Phase 3** (UI): 3 hours
- **Phase 4** (Testing): 4 hours
- **Phase 5** (Docs & PR): 2 hours

**Total**: ~25 hours of development work

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Translation errors | Medium | High | Native speaker review for each language |
| Test failures | Low | Medium | Comprehensive test suite before PR |
| Performance degradation | Low | Low | Benchmark replacement function |
| User confusion | Medium | Medium | Clear UI documentation + help tooltips |
| Breaking existing actions | Low | High | Backward compatibility testing |

---

## Success Criteria

- [ ] All tests pass (existing + new)
- [ ] No performance regression (benchmark: <1ms per replacement)
- [ ] All 5 languages have complete anatomy mappings
- [ ] UI clearly explains placeholders
- [ ] PR approved by maintainers
- [ ] Zero breaking changes for existing users
- [ ] Documentation complete and clear

---

**Document Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: Ready for Implementation
