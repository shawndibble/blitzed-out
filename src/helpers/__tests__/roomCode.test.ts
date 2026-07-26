import { describe, expect, it } from 'vitest';
import { ROOM_CODE_LENGTH, generateRoomCode } from '../roomCode';

describe('generateRoomCode', () => {
  it('produces a five-character code', () => {
    expect(generateRoomCode()).toHaveLength(ROOM_CODE_LENGTH);
  });

  it('never emits the characters users mistype when sharing a code', () => {
    // The alphabet omits 0, O and I; it keeps 1, which is unambiguous without
    // an I beside it. Pinned so the exclusion set can't quietly change.
    const codes = Array.from({ length: 200 }, () => generateRoomCode()).join('');
    expect(codes).not.toMatch(/[0OI]/);
    expect(codes).toMatch(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZ]+$/);
  });

  it('does not repeat itself across draws', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(45);
  });
});
