#!/usr/bin/env node

/**
 * Validation script for locale bundle files
 * Checks for proper placeholder usage and common translation issues
 */

const fs = require('fs');
const path = require('path');

// Valid placeholders that are allowed in locale files
const VALID_PLACEHOLDERS = new Set([
  '{dom}', // Dominant player
  '{sub}', // Submissive player
  '{player}', // Generic player
  '{anotherPlayer}', // Another player
]);

// Anatomy tokens are read from their single source of truth so a new token
// never needs a second edit here. See CLAUDE.md - ANATOMY_PLACEHOLDERS.
function readAnatomyTokens() {
  const src = fs.readFileSync(path.resolve(__dirname, '../src/types/localPlayers.ts'), 'utf8');
  const block = src.match(/export const ANATOMY_PLACEHOLDERS = \[([^\]]*)\]/);
  if (!block) {
    throw new Error('Could not read ANATOMY_PLACEHOLDERS from src/types/localPlayers.ts');
  }
  const tokens = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (tokens.length === 0) {
    throw new Error('ANATOMY_PLACEHOLDERS is empty in src/types/localPlayers.ts');
  }
  return tokens;
}

const ANATOMY_TOKENS = readAnatomyTokens();
// Targets mirror anatomyPlaceholderService.ts's resolver regex.
const ANATOMY_TARGETS = ['dom', 'sub', 'other', 'self'];
const ANATOMY_PLACEHOLDER_RE = new RegExp(
  `^\\{(${ANATOMY_TOKENS.join('|')})(?:\\|(${ANATOMY_TARGETS.join('|')}))?\\}$`
);

// Common invalid placeholders to catch
const INVALID_PATTERNS = new Set([
  '{todos los subs}', // Spanish: invalid placeholder
  '{tous les subs}', // French: invalid placeholder
  '{all subs}', // English: invalid placeholder
  '{others}', // Generic: should be more specific
  '{everyone}', // Generic: should be more specific
]);

// Directory to search for bundle files
const LOCALES_DIR = path.resolve(__dirname, '../src/locales');

let hasErrors = false;

/**
 * Check if a string contains valid placeholders only
 * @param {string} text - Text to check
 * @returns {object} - Validation result
 */
function validatePlaceholders(text) {
  const errors = [];
  const warnings = [];

  // i18next interpolation ({{count}}) is resolved by i18next, not by our
  // placeholder pass, and its double braces confuse the single-brace scan.
  const scannable = text.replace(/\{\{[^}]*\}\}/g, '');

  const placeholderMatches = scannable.match(/\{[^}]+\}/g) || [];

  placeholderMatches.forEach((placeholder) => {
    if (!VALID_PLACEHOLDERS.has(placeholder) && !ANATOMY_PLACEHOLDER_RE.test(placeholder)) {
      errors.push(`Invalid placeholder: ${placeholder}`);
    }
  });

  // Check for known invalid patterns
  for (const pattern of INVALID_PATTERNS) {
    if (text.includes(pattern)) {
      errors.push(`Found invalid pattern: ${pattern}`);
    }
  }

  // Check for common translation issues
  if (text.includes('dock sucker')) {
    errors.push('Found typo: "dock sucker" should be "cock sucker"');
  }

  return { errors, warnings };
}

/**
 * Recursively validate all actions in a bundle object
 * @param {object} obj - Object to validate
 * @param {string} path - Current path for error reporting
 * @returns {array} - Array of validation errors
 */
function validateBundleObject(obj, currentPath = '') {
  const errors = [];

  if (typeof obj === 'string') {
    const validation = validatePlaceholders(obj);
    validation.errors.forEach((error) => {
      errors.push(`${currentPath}: ${error} in "${obj}"`);
    });
    return errors;
  }

  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      errors.push(...validateBundleObject(obj[key], newPath));
    });
  }

  return errors;
}

/**
 * Validate a single bundle file
 * @param {string} filePath - Path to the bundle file
 */
function validateBundleFile(filePath) {
  console.log(`\nValidating ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
      console.log(`⚠️  Warning: BOM detected and removed from ${filePath}`);
    }

    const bundle = JSON.parse(content);

    const errors = validateBundleObject(bundle, path.basename(filePath));

    if (errors.length === 0) {
      console.log('✅ No placeholder errors found');
    } else {
      console.log(`❌ Found ${errors.length} error(s):`);
      errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
      hasErrors = true;
    }
  } catch (err) {
    console.error(`❌ Error reading/parsing ${filePath}: ${err.message}`);
    hasErrors = true;
  }
}

/**
 * Find bundle files recursively
 * @param {string} dir - Directory to search
 * @returns {array} - Array of bundle file paths
 */
function findBundleFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findBundleFiles(fullPath));
    } else if (
      item.endsWith('-bundle.json') ||
      (item.endsWith('.json') && !item.includes('translation'))
    ) {
      files.push(fullPath);
    }
  });

  return files;
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Validating locale bundle placeholders...\n');

  // Find all bundle files in src/locales
  const localesDir = LOCALES_DIR;
  const bundleFiles = findBundleFiles(localesDir);

  if (bundleFiles.length === 0) {
    console.log('⚠️  No bundle files found!');
    process.exit(1);
  }

  console.log(`Found ${bundleFiles.length} bundle file(s) to validate:`);
  bundleFiles.forEach((file) => console.log(`  - ${file}`));

  // Validate each file
  bundleFiles.forEach(validateBundleFile);

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Validation FAILED - Please fix the errors above');
    process.exit(1);
  } else {
    console.log('✅ All validations PASSED');
    console.log('📋 Checked for:');
    console.log('   - Valid placeholders: {dom}, {sub}, {player}, {anotherPlayer}');
    console.log(
      `   - Anatomy placeholders: ${ANATOMY_TOKENS.map((t) => `{${t}}`).join(', ')} (optional |${ANATOMY_TARGETS.join('/')})`
    );
    console.log('   - Invalid placeholder patterns');
    console.log('   - Common typos and translation issues');
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = { validatePlaceholders, validateBundleObject };
