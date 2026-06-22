import { describe, expect, it } from 'vitest';

import { SubmitCoreInput, SubmitCoreMessages, submitCustomTileCore } from '../submitCustomTileCore';

const messages: SubmitCoreMessages = {
  allFieldsRequired: 'All fields are required',
  actionExists: 'That action already exists',
};

function baseInput(overrides: Partial<SubmitCoreInput> = {}): SubmitCoreInput {
  return {
    gameMode: 'online',
    selectedGroupId: 'group-1',
    intensity: '2',
    action: 'Do the thing to {sub}',
    tags: ['custom'],
    pendingTag: '',
    validationMessage: '',
    updateTileId: null,
    tileExists: () => false,
    ...overrides,
  };
}

describe('submitCustomTileCore', () => {
  it('proceeds with a well-formed new tile', () => {
    const result = submitCustomTileCore(baseInput(), messages);
    expect(result.kind).toBe('proceed');
    if (result.kind !== 'proceed') return;
    expect(result.isUpdate).toBe(false);
    expect(result.data).toEqual({
      group_id: 'group-1',
      intensity: 2,
      action: 'Do the thing to {sub}',
      tags: ['custom'],
      isCustom: 1,
    });
  });

  it('appends the pending (un-Entered) tag so it is not lost', () => {
    const result = submitCustomTileCore(
      baseInput({ tags: ['custom'], pendingTag: '  spicy  ' }),
      messages
    );
    expect(result.kind).toBe('proceed');
    if (result.kind !== 'proceed') return;
    expect(result.tags).toEqual(['custom', 'spicy']);
    expect(result.data.tags).toEqual(['custom', 'spicy']);
  });

  it('ignores a blank pending tag', () => {
    const result = submitCustomTileCore(baseInput({ pendingTag: '   ' }), messages);
    expect(result.kind).toBe('proceed');
    if (result.kind !== 'proceed') return;
    expect(result.tags).toEqual(['custom']);
  });

  it.each([
    ['gameMode', { gameMode: '' }],
    ['selectedGroupId', { selectedGroupId: undefined }],
    ['intensity', { intensity: '' }],
    ['action', { action: '' }],
  ])('errors when %s is missing', (_field, overrides) => {
    const result = submitCustomTileCore(baseInput(overrides as Partial<SubmitCoreInput>), messages);
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toEqual({ message: messages.allFieldsRequired, type: 'error' });
  });

  it('surfaces an existing debounced validation message before anything else', () => {
    const result = submitCustomTileCore(baseInput({ validationMessage: 'Too long' }), messages);
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toEqual({ message: 'Too long', type: 'error' });
  });

  it('blocks a duplicate on create', () => {
    const result = submitCustomTileCore(
      baseInput({
        tileExists: (gid, intensity, action) =>
          gid === 'group-1' && intensity === '2' && action.includes('thing'),
      }),
      messages
    );
    expect(result.kind).toBe('error');
    if (result.kind !== 'error') return;
    expect(result.message).toEqual({ message: messages.actionExists, type: 'error' });
  });

  it('does NOT run the dedup check when editing an existing tile', () => {
    const result = submitCustomTileCore(
      baseInput({ updateTileId: 42, tileExists: () => true }),
      messages
    );
    expect(result.kind).toBe('proceed');
    if (result.kind !== 'proceed') return;
    expect(result.isUpdate).toBe(true);
  });
});
