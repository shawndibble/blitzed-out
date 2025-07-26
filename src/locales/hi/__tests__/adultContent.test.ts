import { describe, it, expect } from 'vitest';

describe('Hindi Adult Content', () => {
  it('should have valid JSON structure for local kissing content', async () => {
    const kissingContent = await import('../local/kissing.json');

    expect(kissingContent.default).toHaveProperty('label');
    expect(kissingContent.default).toHaveProperty('type');
    expect(kissingContent.default).toHaveProperty('actions');
    expect(kissingContent.default.label).toBe('चुंबन');
    expect(kissingContent.default.type).toBe('foreplay');
  });

  it('should have valid JSON structure for local alcohol content', async () => {
    const alcoholContent = await import('../local/alcohol.json');

    expect(alcoholContent.default).toHaveProperty('label');
    expect(alcoholContent.default).toHaveProperty('type');
    expect(alcoholContent.default).toHaveProperty('actions');
    expect(alcoholContent.default.label).toBe('मदिरा');
    expect(alcoholContent.default.type).toBe('consumption');
  });

  it('should have valid JSON structure for online alcohol content', async () => {
    const onlineAlcoholContent = await import('../online/alcohol.json');

    expect(onlineAlcoholContent.default).toHaveProperty('label');
    expect(onlineAlcoholContent.default).toHaveProperty('type');
    expect(onlineAlcoholContent.default).toHaveProperty('actions');
    expect(onlineAlcoholContent.default.label).toBe('मदिरा');
    expect(onlineAlcoholContent.default.type).toBe('consumption');
  });

  it('should have valid JSON structure for bondage content', async () => {
    const bondageContent = await import('../local/bondage.json');

    expect(bondageContent.default).toHaveProperty('label');
    expect(bondageContent.default).toHaveProperty('type');
    expect(bondageContent.default).toHaveProperty('actions');
    expect(bondageContent.default.label).toBe('बंधन');
    expect(bondageContent.default.type).toBe('foreplay');
  });

  it('should have valid JSON structure for spanking content', async () => {
    const spankingContent = await import('../local/spanking.json');

    expect(spankingContent.default).toHaveProperty('label');
    expect(spankingContent.default).toHaveProperty('type');
    expect(spankingContent.default).toHaveProperty('actions');
    expect(spankingContent.default.label).toBe('थपकी');
    expect(spankingContent.default.type).toBe('sex');
  });

  it('should have valid JSON structure for humiliation content', async () => {
    const humiliationContent = await import('../local/humiliation.json');

    expect(humiliationContent.default).toHaveProperty('label');
    expect(humiliationContent.default).toHaveProperty('type');
    expect(humiliationContent.default).toHaveProperty('actions');
    expect(humiliationContent.default.label).toBe('अपमान');
    expect(humiliationContent.default.type).toBe('foreplay');
  });

  it('should have valid JSON structure for vaping content', async () => {
    const vapingContent = await import('../local/vaping.json');

    expect(vapingContent.default).toHaveProperty('label');
    expect(vapingContent.default).toHaveProperty('type');
    expect(vapingContent.default).toHaveProperty('actions');
    expect(vapingContent.default.label).toBe('वेपिंग');
    expect(vapingContent.default.type).toBe('consumption');
  });

  it('should have valid JSON structure for online vaping content', async () => {
    const onlineVapingContent = await import('../online/vaping.json');

    expect(onlineVapingContent.default).toHaveProperty('label');
    expect(onlineVapingContent.default).toHaveProperty('type');
    expect(onlineVapingContent.default).toHaveProperty('actions');
    expect(onlineVapingContent.default.label).toBe('वेपिंग');
    expect(onlineVapingContent.default.type).toBe('consumption');
  });

  it('should have valid JSON structure for new local categories', async () => {
    const ticklingContent = await import('../local/tickling.json');
    const footPlayContent = await import('../local/footPlay.json');

    expect(ticklingContent.default.label).toBe('गुदगुदी');
    expect(footPlayContent.default.label).toBe('पैर खेल');
    expect(ticklingContent.default.type).toBe('foreplay');
    expect(footPlayContent.default.type).toBe('foreplay');
  });

  it('should have valid JSON structure for new online categories', async () => {
    const onlineBatingContent = await import('../online/bating.json');

    expect(onlineBatingContent.default).toHaveProperty('label');
    expect(onlineBatingContent.default).toHaveProperty('type');
    expect(onlineBatingContent.default).toHaveProperty('actions');
    expect(onlineBatingContent.default.label).toBe('स्व-आनंद');
    expect(onlineBatingContent.default.type).toBe('solo');
  });

  it('should have properly formatted action arrays', async () => {
    const kissingContent = await import('../local/kissing.json');

    Object.values(kissingContent.default.actions).forEach((actionArray: any) => {
      expect(Array.isArray(actionArray)).toBe(true);
      actionArray.forEach((action: any) => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have culturally appropriate Hindi translations with Devanagari script', async () => {
    const kissingContent = await import('../local/kissing.json');
    const strippingContent = await import('../local/stripping.json');

    // Check that content uses appropriate Devanagari characters
    expect(kissingContent.default.label).toMatch(/[\u0900-\u097F]/);
    expect(strippingContent.default.label).toBe('कपड़े उतारना');

    // Check that actions contain Devanagari characters
    const gentleKisses = kissingContent.default.actions['कोमल चुंबन'];
    expect(gentleKisses).toBeDefined();
    expect(gentleKisses.length).toBeGreaterThan(0);
    expect(gentleKisses[0]).toMatch(/[\u0900-\u097F]/);
  });

  it('should maintain placeholder variables in Hindi translations', async () => {
    const kissingContent = await import('../local/kissing.json');

    const actions = Object.values(kissingContent.default.actions).flat() as string[];
    const actionsWithPlaceholders = actions.filter(
      (action) => action.includes('{dom}') || action.includes('{sub}')
    );

    expect(actionsWithPlaceholders.length).toBeGreaterThan(0);

    actionsWithPlaceholders.forEach((action) => {
      // Ensure placeholders are preserved exactly
      expect(action).toMatch(/\{(dom|sub)\}/);
    });
  });

  it('should have culturally adapted content for Indian context', async () => {
    const alcoholContent = await import('../local/alcohol.json');

    // Check for culturally appropriate alcohol terminology
    expect(alcoholContent.default.label).toBe('मदिरा'); // More formal/cultural term

    const actions = Object.values(alcoholContent.default.actions).flat() as string[];
    const hasAppropriateTerms = actions.some(
      (action) => action.includes('पेग') || action.includes('घूंट') // Indian-specific drinking terms
    );
    expect(hasAppropriateTerms).toBe(true);
  });
});
