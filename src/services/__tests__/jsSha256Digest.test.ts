import { sha256 } from 'js-sha256';
import { describe, expect, it } from 'vitest';

// Board checksums (firebase/boards.ts) and pack contentHash (contentPacks.ts) are
// persisted, so a digest change silently invalidates every stored value. Pin the
// output through Vite's resolver — the browser entry, not the Node CJS build.
// Both values were confirmed byte-identical on js-sha256 0.11.1 and 1.0.0.
describe('js-sha256 digest stability', () => {
  it('produces the pinned digest for a known input', () => {
    expect(sha256('blitzed-out')).toBe(
      'b3be3ed62b8e1a3b412138f7f46605dc4ae1fa2d88989ca7a901b96f6569f619'
    );
  });

  it('produces the pinned digest for multi-byte content', () => {
    expect(sha256('{"action":"tëst 🔥"}')).toBe(
      'b87201866be02d8c901842ccfd18fe9288fe3a158314cca402d407a8e2d3e6d7'
    );
  });
});
