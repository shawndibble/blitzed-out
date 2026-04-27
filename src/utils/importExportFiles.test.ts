import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadTextFile, readTextFile } from './importExportFiles';

describe('importExportFiles', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads text content as a file', () => {
    const click = vi.fn();
    const anchor = {
      href: '',
      download: '',
      click,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    downloadTextFile('{"ok":true}', 'export.json', 'application/json');

    expect(createElement).toHaveBeenCalledWith('a');
    expect(anchor.download).toBe('export.json');
    expect(anchor.href).toBe('blob:test');
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalledWith(anchor);
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('reads text content from a selected file', async () => {
    const file = new File(['{"ok":true}'], 'import.json', { type: 'application/json' });

    await expect(readTextFile(file)).resolves.toBe('{"ok":true}');
  });
});
