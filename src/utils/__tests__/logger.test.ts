/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * `logger` reads MODE at import time, so each case re-imports under a stubbed
 * environment. Production is the interesting mode — dev logs unconditionally.
 */
async function loadProductionLogger() {
  vi.resetModules();
  vi.stubEnv('MODE', 'production');
  return (await import('../logger')).logger;
}

function setSearch(search: string) {
  window.history.replaceState({}, '', `/room${search}`);
}

describe('logger in production', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setSearch('');
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetModules();
    window.localStorage.clear();
  });

  test('stays silent by default', async () => {
    const logger = await loadProductionLogger();

    logger.warn('something happened');

    expect(warn).not.toHaveBeenCalled();
  });

  test('logs when the debug query flag is set', async () => {
    setSearch('?debug=1');
    const logger = await loadProductionLogger();

    logger.warn('something happened');

    expect(warn).toHaveBeenCalledWith('something happened');
  });

  // Only the documented value opts in. A denylist of "off" values would make
  // `?debug=0` — the obvious way to disable it — enable it instead, and would
  // let any typo turn logging on.
  test.each(['?debug=0', '?debug=true', '?debug=yes', '?debug='])(
    'stays silent for %s',
    async (search) => {
      setSearch(search);
      const logger = await loadProductionLogger();

      logger.warn('something happened');

      expect(warn).not.toHaveBeenCalled();
    }
  );

  test('logs when the flag is persisted in localStorage', async () => {
    window.localStorage.setItem('debug', 'true');
    const logger = await loadProductionLogger();

    logger.warn('something happened');

    expect(warn).toHaveBeenCalled();
  });

  test('survives a localStorage that throws', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('access denied');
    });
    const logger = await loadProductionLogger();

    expect(() => logger.warn('something happened')).not.toThrow();
    expect(warn).not.toHaveBeenCalled();

    getItem.mockRestore();
  });
});
