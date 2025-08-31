#!/usr/bin/env node

/**
 * Bundle Translation Generator
 *
 * Combines individual game mode JSON files into consolidated bundles
 * to reduce chunk count from ~210 files to ~10 files.
 *
 * Structure:
 * - Input: src/locales/{lang}/{gameMode}/{groupName}.json
 * - Output: src/locales/{lang}/{gameMode}-bundle.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'];
const GAME_MODES = ['local', 'online'];

/**
 * Read all JSON files in a directory and return as an object
 */
function bundleGameModeFiles(languageDir, gameMode) {
  const gameModeDir = path.join(languageDir, gameMode);

  if (!fs.existsSync(gameModeDir)) {
    console.warn(`Directory not found: ${gameModeDir}`);
    return {};
  }

  const bundle = {};
  const files = fs.readdirSync(gameModeDir).filter((file) => file.endsWith('.json'));

  files.forEach((file) => {
    const filePath = path.join(gameModeDir, file);
    const groupName = path.basename(file, '.json');

    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      bundle[groupName] = content;
    } catch {
      // Skip files with errors
    }
  });

  return bundle;
}

/**
 * Generate bundles for all languages and game modes
 */
function generateBundles() {
  LANGUAGES.forEach((language) => {
    const languageDir = path.join(LOCALES_DIR, language);

    if (!fs.existsSync(languageDir)) {
      return;
    }

    GAME_MODES.forEach((gameMode) => {
      const bundle = bundleGameModeFiles(languageDir, gameMode);
      const bundleCount = Object.keys(bundle).length;

      if (bundleCount > 0) {
        const bundlePath = path.join(languageDir, `${gameMode}-bundle.json`);
        fs.writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));
      }
    });
  });
}

// Run the bundling
generateBundles();

export { generateBundles };
