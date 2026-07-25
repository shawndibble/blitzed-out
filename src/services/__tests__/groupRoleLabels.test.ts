import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getGroupRoleLabels, resetGroupRoleLabelCache } from '../groupRoleLabels';

describe('getGroupRoleLabels', () => {
  beforeEach(() => {
    resetGroupRoleLabelCache();
  });

  const bundle = {
    buttPlay: { label: 'Butt Play', type: 'sex', dom: 'Top', sub: 'Bottom' },
    throatTraining: { label: 'Throat', type: 'sex', dom: 'Receive Oral', sub: 'Give Oral' },
    kissing: { label: 'Kissing', type: 'foreplay' },
    alcohol: { label: 'Alcohol', type: 'consumption' },
  };

  it('returns the bespoke wording for groups that define it', async () => {
    const labels = await getGroupRoleLabels('en', 'local', async () => bundle);

    expect(labels.buttPlay).toEqual({ dom: 'Top', sub: 'Bottom' });
    expect(labels.throatTraining).toEqual({ dom: 'Receive Oral', sub: 'Give Oral' });
  });

  it('omits groups with no wording, so callers fall back to generic labels', async () => {
    const labels = await getGroupRoleLabels('en', 'local', async () => bundle);

    expect(labels.kissing).toBeUndefined();
    expect(labels.alcohol).toBeUndefined();
  });

  it('keeps a half-defined pair rather than discarding it', async () => {
    const labels = await getGroupRoleLabels('en', 'local', async () => ({
      lopsided: { dom: 'Giver' },
    }));

    expect(labels.lopsided).toEqual({ dom: 'Giver' });
  });

  it('ignores non-string wording', async () => {
    const labels = await getGroupRoleLabels('en', 'local', async () => ({
      bad: { dom: 42, sub: null },
    }));

    expect(labels.bad).toBeUndefined();
  });

  it('memoizes per locale and game mode', async () => {
    const load = vi.fn(async () => bundle);

    await getGroupRoleLabels('en', 'local', load);
    await getGroupRoleLabels('en', 'local', load);
    expect(load).toHaveBeenCalledTimes(1);

    await getGroupRoleLabels('en', 'online', load);
    await getGroupRoleLabels('es', 'local', load);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('degrades to generic wording when the bundle cannot be read', async () => {
    // A missing bundle must not take the settings page down with it.
    const labels = await getGroupRoleLabels('en', 'local', async () => {
      throw new Error('no such bundle');
    });

    expect(labels).toEqual({});
  });

  it('tolerates a malformed bundle', async () => {
    expect(
      await getGroupRoleLabels(
        'en',
        'local',
        async () => null as unknown as Record<string, unknown>
      )
    ).toEqual({});
  });
});
