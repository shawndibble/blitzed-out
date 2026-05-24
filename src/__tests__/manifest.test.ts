import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('site.webmanifest', () => {
  it('includes required installability fields', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(__dirname, '../../public/site.webmanifest'), 'utf-8')
    );

    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons[0].sizes).toBe('192x192');
    expect(manifest.icons[1].sizes).toBe('512x512');
  });
});
