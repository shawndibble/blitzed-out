import { afterEach, describe, expect, it, vi } from 'vitest';

import { stripImageMetadata } from '@/services/imageProcessing';

// Minimal controllable Image stand-in: setting `src` fires onload/onerror.
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 10;
  naturalHeight = 10;
  width = 10;
  height = 10;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

class MockImageError {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

function stubCanvas(
  toDataURL: () => string,
  getContext: () => unknown = () => ({ drawImage: vi.fn() })
) {
  const canvas = { width: 0, height: 0, getContext, toDataURL } as unknown as HTMLCanvasElement;
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') return canvas;
    return document.createElement(tag);
  });
  return canvas;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('stripImageMetadata', () => {
  it('passes unsupported formats (gif) through untouched without re-encoding', async () => {
    const createElement = vi.spyOn(document, 'createElement');
    const result = await stripImageMetadata('GIFDATA', 'gif');
    expect(result).toBe('GIFDATA');
    expect(createElement).not.toHaveBeenCalledWith('canvas');
  });

  it('returns the original data when base64 is empty', async () => {
    expect(await stripImageMetadata('', 'jpeg')).toBe('');
  });

  it('re-encodes a supported image and returns the stripped base64 payload', async () => {
    vi.stubGlobal('Image', MockImage);
    stubCanvas(() => 'data:image/jpeg;base64,STRIPPED');

    const result = await stripImageMetadata('ORIGINALWITHEXIF', 'jpeg');
    expect(result).toBe('STRIPPED');
  });

  it('falls back to the original data when the image fails to load', async () => {
    vi.stubGlobal('Image', MockImageError);
    const result = await stripImageMetadata('ORIGINAL', 'png');
    expect(result).toBe('ORIGINAL');
  });

  it('falls back to the original data when no 2D context is available', async () => {
    vi.stubGlobal('Image', MockImage);
    stubCanvas(
      () => 'data:image/jpeg;base64,SHOULDNOTBEUSED',
      () => null
    );

    const result = await stripImageMetadata('ORIGINAL', 'jpeg');
    expect(result).toBe('ORIGINAL');
  });
});
