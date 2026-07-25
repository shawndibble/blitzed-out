import { describe, it, expect } from 'vitest';
import { createDeterministicGroupId } from '@/services/deterministicGroupId';

/**
 * Pins the exact output of createDeterministicGroupId. This value is a Dexie
 * customGroups primary key and syncs to Firebase — any drift in the hash
 * algorithm or format orphans every existing default group/tile on every
 * device. Do not "improve" the algorithm without a data migration plan.
 */
describe('createDeterministicGroupId', () => {
  it('produces a stable id for a short group name', () => {
    expect(createDeterministicGroupId('bating', 'en', 'online')).toBe(
      'default_en_online_bating_54b75bb1'
    );
  });

  it('produces a stable id for a multi-word group name', () => {
    expect(createDeterministicGroupId('body worship', 'es', 'local')).toBe(
      'default_es_local_body worship_665ad293'
    );
  });

  it('produces a stable id for another locale/gameMode/name combination', () => {
    expect(createDeterministicGroupId('clit training', 'zh', 'online')).toBe(
      'default_zh_online_clit training_7e06a021'
    );
  });

  it('produces a stable id for a fifth combination', () => {
    expect(createDeterministicGroupId('confessions', 'hi', 'online')).toBe(
      'default_hi_online_confessions_5e7ecdee'
    );
  });

  it('truncates to 50 characters for a long group name (slice boundary)', () => {
    const id = createDeterministicGroupId(
      'would-you-rather-extremely-long-group-name-for-testing-slice-truncation',
      'fr',
      'local'
    );
    expect(id).toBe('default_fr_local_would-you-rather-extremely-long-g');
    expect(id.length).toBe(50);
  });

  it('is deterministic across repeated calls with the same inputs', () => {
    const a = createDeterministicGroupId('penetrative-tag-check', 'en', 'local');
    const b = createDeterministicGroupId('penetrative-tag-check', 'en', 'local');
    expect(a).toBe(b);
  });
});
