import { describe, expect, it } from 'vitest';
import { buildReturnToRoomUrl } from '../returnToRoomUrl';

describe('buildReturnToRoomUrl', () => {
  it('returns a plain room URL when there is no resumeStep to carry back', () => {
    expect(buildReturnToRoomUrl('ABCDE', null)).toBe('/ABCDE');
  });

  it('carries resumeStep back so the wizard resumes where it left off', () => {
    expect(buildReturnToRoomUrl('ABCDE', '3')).toBe('/ABCDE?resumeStep=3');
  });
});
