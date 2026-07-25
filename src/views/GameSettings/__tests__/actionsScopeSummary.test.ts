import { describe, expect, it } from 'vitest';
import { buildActionsScopeSummary } from '../actionsScopeSummary';

const t = (key: string, options?: Record<string, unknown>): string =>
  options ? `${key}(${JSON.stringify(options)})` : key;

describe('buildActionsScopeSummary', () => {
  it('uses the solo scope key when isSoloActionsScope is true', () => {
    expect(buildActionsScopeSummary(t, 3, true)).toBe(
      'enabledCount({"count":3}) · actionsScopeSolo'
    );
  });

  it('uses the group scope key when isSoloActionsScope is false', () => {
    expect(buildActionsScopeSummary(t, 0, false)).toBe(
      'enabledCount({"count":0}) · actionsScopeGroup'
    );
  });
});
