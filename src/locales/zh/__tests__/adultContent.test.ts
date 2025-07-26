import { describe, it, expect } from 'vitest';

describe('Mandarin Adult Content', () => {
  it('should have valid JSON structure for local kissing content', async () => {
    const kissingContent = await import('../local/kissing.json');

    expect(kissingContent.default).toHaveProperty('label');
    expect(kissingContent.default).toHaveProperty('type');
    expect(kissingContent.default).toHaveProperty('actions');
    expect(kissingContent.default.label).toBe('接吻');
    expect(kissingContent.default.type).toBe('foreplay');
  });

  it('should have valid JSON structure for local alcohol content', async () => {
    const alcoholContent = await import('../local/alcohol.json');

    expect(alcoholContent.default).toHaveProperty('label');
    expect(alcoholContent.default).toHaveProperty('type');
    expect(alcoholContent.default).toHaveProperty('actions');
    expect(alcoholContent.default.label).toBe('酒精');
    expect(alcoholContent.default.type).toBe('consumption');
  });

  it('should have valid JSON structure for online alcohol content', async () => {
    const onlineAlcoholContent = await import('../online/alcohol.json');

    expect(onlineAlcoholContent.default).toHaveProperty('label');
    expect(onlineAlcoholContent.default).toHaveProperty('type');
    expect(onlineAlcoholContent.default).toHaveProperty('actions');
    expect(onlineAlcoholContent.default.label).toBe('酒精');
    expect(onlineAlcoholContent.default.type).toBe('consumption');
  });

  it('should have valid JSON structure for new local categories', async () => {
    const spankingContent = await import('../local/spanking.json');
    const humiliationContent = await import('../local/humiliation.json');
    const vapingContent = await import('../local/vaping.json');
    const ticklingContent = await import('../local/tickling.json');
    const footPlayContent = await import('../local/footPlay.json');

    expect(spankingContent.default.label).toBe('拍打');
    expect(humiliationContent.default.label).toBe('羞辱');
    expect(vapingContent.default.label).toBe('电子烟');
    expect(ticklingContent.default.label).toBe('挠痒');
    expect(footPlayContent.default.label).toBe('足部游戏');
  });

  it('should have valid JSON structure for new online categories', async () => {
    const onlineBatingContent = await import('../online/bating.json');

    expect(onlineBatingContent.default).toHaveProperty('label');
    expect(onlineBatingContent.default).toHaveProperty('type');
    expect(onlineBatingContent.default).toHaveProperty('actions');
    expect(onlineBatingContent.default.label).toBe('自我愉悦');
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

  it('should have culturally appropriate Mandarin translations', async () => {
    const kissingContent = await import('../local/kissing.json');
    const bondageContent = await import('../local/bondage.json');

    // Check that content uses appropriate Chinese characters
    expect(kissingContent.default.label).toMatch(/[\u4e00-\u9fff]/);
    expect(bondageContent.default.label).toBe('束缚');

    // Check that actions contain Chinese characters
    const lightKisses = kissingContent.default.actions['轻吻'];
    expect(lightKisses).toBeDefined();
    expect(lightKisses.length).toBeGreaterThan(0);
    expect(lightKisses[0]).toMatch(/[\u4e00-\u9fff]/);
  });

  it('should maintain placeholder variables in translations', async () => {
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
});
