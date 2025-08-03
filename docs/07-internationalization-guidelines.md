# Internationalization (i18n) Guidelines

## Overview

This project supports **5 languages** with translation files managed through i18next. All translation changes must be applied consistently across all supported languages.

## Supported Languages

### Translation Files Location: `src/locales/`

- **English (en)**: `src/locales/en/translation.json` - Primary/source language
- **Spanish (es)**: `src/locales/es/translation.json`
- **French (fr)**: `src/locales/fr/translation.json`
- **Chinese (zh)**: `src/locales/zh/translation.json`
- **Hindi (hi)**: `src/locales/hi/translation.json`

## Translation Workflow

### CRITICAL RULE
**When updating any translation text, ALWAYS update all 5 language files.**

### Search for Translation Keys
```bash
# Find translation keys across all language files
grep -r "keyName" src/locales/*/translation.json

# Find translation content across all language files
grep -r "specific text" src/locales/*/translation.json

# List all translation files
ls src/locales/*/translation.json

# Search for specific translation keys with line numbers
grep -n "keyName" src/locales/*/translation.json
```

## File Structure

All translation files follow the same JSON structure with identical keys. Example:
```json
{
  "yesNaked": "Sex: We are naked.",
  "noNaked": "Foreplay: We are still clothed.",
  "pickActions": "Pick your actions (max 4)",
  "actionsLabel": "Actions"
}
```

## Translation Guidelines

### Consistency Requirements
- **Maintain consistent tone**: Use inclusive language ("we are" vs "I am")
- **Preserve formatting**: Keep punctuation, colons, and structure consistent
- **Key structure**: All language files must have identical JSON key structure
- **Validation**: Test changes in different languages to ensure UI layout works

### Cultural Adaptation
- **Cultural sensitivity**: Adapt content appropriately for each culture while maintaining meaning
- **Context preservation**: Maintain the intent and context of the original English text
- **Regional considerations**: Consider cultural norms and sensitivities for each language

### Language-Specific Notes

#### Spanish (es)
- Use inclusive plural forms when possible
- Consider formal vs informal address based on context

#### French (fr)
- Pay attention to gender agreement in adjectives
- Use appropriate formal/informal forms

#### Chinese (zh)
- Traditional Chinese characters are used
- Context may require different translations for the same English term

#### Hindi (hi)
- Use Devanagari script
- Consider formal vs informal address patterns

## Development Workflow

### Adding New Translation Keys
1. Add the key to English (`en/translation.json`) first
2. Add equivalent translations to all other language files
3. Test the UI in multiple languages to verify layout
4. Verify no keys are missing across all files

### Modifying Existing Translations
1. Identify the translation key using search commands
2. Update the English version first
3. Update all other language files with appropriate translations
4. Test UI layout across different languages

### Quality Assurance
- Use `npm run type-check` to verify no TypeScript errors
- Test the application in each language to verify:
  - Text displays correctly
  - UI layout remains functional
  - No text overflow or truncation issues
  - Cultural appropriateness of content

## Technical Implementation

### i18next Configuration
- Configuration located in `src/i18n.ts`
- Default language: English (en)
- Fallback language: English (en)
- Detection order: localStorage, browser language, default

### Usage in Components
```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('myTranslationKey')}</h1>
    </div>
  );
};
```

### Migration System
- Smart language file migration via `src/context/migration.tsx`
- Handles translation updates and version migrations
- Ensures consistency across language switches