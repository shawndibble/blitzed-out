import { describe, it, expect } from 'vitest';

describe('Character Encoding Validation', () => {
  describe('Mandarin Character Encoding', () => {
    it('should properly encode Traditional Chinese characters', async () => {
      const kissing = await import('../zh/local/kissing.json');
      const alcohol = await import('../zh/local/alcohol.json');

      // Check that Chinese characters are properly encoded
      expect(kissing.default.label).toBe('接吻');
      expect(alcohol.default.label).toBe('酒精');

      // Verify character encoding range (CJK Unified Ideographs)
      expect(kissing.default.label).toMatch(/[\u4e00-\u9fff]/);
      expect(alcohol.default.label).toMatch(/[\u4e00-\u9fff]/);
    });

    it('should maintain placeholder variables in Chinese text', async () => {
      const kissing = await import('../zh/local/kissing.json');
      const actions = Object.values(kissing.default.actions).flat() as string[];

      const actionsWithPlaceholders = actions.filter(
        (action) => action.includes('{dom}') || action.includes('{sub}')
      );

      expect(actionsWithPlaceholders.length).toBeGreaterThan(0);

      // Verify Chinese characters work correctly with placeholders
      actionsWithPlaceholders.forEach((action) => {
        expect(action).toMatch(/\{(dom|sub)\}/);
        // Should contain both Chinese characters and English placeholders
        expect(action).toMatch(/[\u4e00-\u9fff]/);
      });
    });
  });

  describe('Hindi Character Encoding', () => {
    it('should properly encode Devanagari script', async () => {
      const kissing = await import('../hi/local/kissing.json');
      const alcohol = await import('../hi/local/alcohol.json');

      // Check that Devanagari characters are properly encoded
      expect(kissing.default.label).toBe('चुंबन');
      expect(alcohol.default.label).toBe('मदिरा');

      // Verify Devanagari encoding range
      expect(kissing.default.label).toMatch(/[\u0900-\u097F]/);
      expect(alcohol.default.label).toMatch(/[\u0900-\u097F]/);
    });

    it('should maintain placeholder variables in Devanagari text', async () => {
      const kissing = await import('../hi/local/kissing.json');
      const actions = Object.values(kissing.default.actions).flat() as string[];

      const actionsWithPlaceholders = actions.filter(
        (action) => action.includes('{dom}') || action.includes('{sub}')
      );

      expect(actionsWithPlaceholders.length).toBeGreaterThan(0);

      // Verify Devanagari characters work correctly with placeholders
      actionsWithPlaceholders.forEach((action) => {
        expect(action).toMatch(/\{(dom|sub)\}/);
        // Should contain both Devanagari characters and English placeholders
        expect(action).toMatch(/[\u0900-\u097F]/);
      });
    });

    it('should handle Indian-specific terminology correctly', async () => {
      const alcohol = await import('../hi/local/alcohol.json');
      const actions = Object.values(alcohol.default.actions).flat() as string[];

      // Check for culturally appropriate Indian drinking terms
      const hasIndianTerms = actions.some(
        (action) => action.includes('पेग') || action.includes('घूंट')
      );

      expect(hasIndianTerms).toBe(true);
    });
  });

  describe('Cross-Language Consistency', () => {
    it('should maintain consistent structure across all languages', async () => {
      const enKissing = await import('../en/local/kissing.json');
      const zhKissing = await import('../zh/local/kissing.json');
      const hiKissing = await import('../hi/local/kissing.json');

      // All should have the same basic structure
      expect(zhKissing.default).toHaveProperty('label');
      expect(zhKissing.default).toHaveProperty('type');
      expect(zhKissing.default).toHaveProperty('actions');

      expect(hiKissing.default).toHaveProperty('label');
      expect(hiKissing.default).toHaveProperty('type');
      expect(hiKissing.default).toHaveProperty('actions');

      // Type should be consistent
      expect(zhKissing.default.type).toBe(enKissing.default.type);
      expect(hiKissing.default.type).toBe(enKissing.default.type);
    });

    it('should maintain UTF-8 encoding integrity', async () => {
      const zhSpanking = await import('../zh/local/spanking.json');
      const hiTickling = await import('../hi/local/tickling.json');

      // Test complex characters don't get corrupted
      expect(zhSpanking.default.label).toBe('拍打');
      expect(hiTickling.default.label).toBe('गुदगुदी');

      // Verify no encoding artifacts (question marks, replacement characters)
      expect(zhSpanking.default.label).not.toMatch(/[?�]/);
      expect(hiTickling.default.label).not.toMatch(/[?�]/);
    });
  });

  describe('JSON Structure Validation', () => {
    it('should handle complex nested structures with Unicode', async () => {
      const zhHumiliation = await import('../zh/local/humiliation.json');
      const hiFootPlay = await import('../hi/local/footPlay.json');

      // Verify nested action categories work with Unicode
      const zhCategories = Object.keys(zhHumiliation.default.actions);
      const hiCategories = Object.keys(hiFootPlay.default.actions);

      expect(zhCategories.length).toBeGreaterThan(1);
      expect(hiCategories.length).toBeGreaterThan(1);

      // Categories should contain appropriate scripts
      const zhNonEmptyCategories = zhCategories.filter((cat) => cat !== '__NONE__');
      const hiNonEmptyCategories = hiCategories.filter((cat) => cat !== '__NONE__');

      expect(zhNonEmptyCategories.some((cat) => /[\u4e00-\u9fff]/.test(cat))).toBe(true);
      expect(hiNonEmptyCategories.some((cat) => /[\u0900-\u097F]/.test(cat))).toBe(true);
    });
  });
});
