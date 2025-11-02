import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryOnCursorError } from '../dbRecovery';

// Mock database interface
const createMockDb = () => ({
  isOpen: vi.fn(() => true),
  open: vi.fn(),
  close: vi.fn(),
});

// Mock user agent
const mockUserAgent = (userAgent: string) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
};

describe('retryOnCursorError', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let mockLogger: (message: string, error?: Error) => void;

  beforeEach(() => {
    mockDb = createMockDb();
    mockLogger = vi.fn();
    // Default to non-Safari browser
    mockUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful operations', () => {
    it('should return result when operation succeeds on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryOnCursorError(mockDb, operation, mockLogger);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockDb.close).not.toHaveBeenCalled();
      expect(mockDb.open).not.toHaveBeenCalled();
    });

    it('should open database if not open before operation', async () => {
      mockDb.isOpen.mockReturnValue(false);
      const operation = vi.fn().mockResolvedValue('success');

      await retryOnCursorError(mockDb, operation, mockLogger);

      expect(mockDb.open).toHaveBeenCalledOnce();
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('cursor error recovery', () => {
    it('should recover from cursor errors by reopening database', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('cursor operation failed'))
        .mockResolvedValueOnce('success after retry');

      const result = await retryOnCursorError(mockDb, operation, mockLogger);

      expect(result).toBe('success after retry');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockDb.close).toHaveBeenCalledOnce();
      expect(mockDb.open).toHaveBeenCalledOnce();
      expect(mockLogger).toHaveBeenCalledWith('Attempting database recovery for cursor error');
      expect(mockLogger).toHaveBeenCalledWith('Database reopened successfully, retrying operation');
    });

    it('should throw if cursor error recovery fails', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('cursor operation failed'))
        .mockRejectedValueOnce(new Error('retry failed'));

      await expect(retryOnCursorError(mockDb, operation, mockLogger)).rejects.toThrow(
        'cursor operation failed'
      );

      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockDb.close).toHaveBeenCalledOnce();
      expect(mockDb.open).toHaveBeenCalledOnce();
    });
  });

  describe('Safari connection recovery', () => {
    beforeEach(() => {
      // Mock Safari user agent
      mockUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      );
    });

    it('should recover from Safari connection lost errors with delays', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Connection to Indexed Database server lost'))
        .mockResolvedValueOnce('success after safari recovery');

      // Mock setTimeout to track delays
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 123 as any;
      });

      const result = await retryOnCursorError(mockDb, operation, mockLogger);

      expect(result).toBe('success after safari recovery');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockDb.close).toHaveBeenCalledOnce();
      expect(mockDb.open).toHaveBeenCalledOnce();
      expect(mockLogger).toHaveBeenCalledWith('Attempting Safari IndexedDB connection recovery');
      expect(mockLogger).toHaveBeenCalledWith(
        'Safari IndexedDB connection recovered, retrying operation'
      );

      // Should have delays for Safari stability
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 50);

      setTimeoutSpy.mockRestore();
    });

    it('should recover from Safari key range lookup errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error looking up record in object store by key range'))
        .mockResolvedValueOnce('success after safari recovery');

      const result = await retryOnCursorError(mockDb, operation, mockLogger);

      expect(result).toBe('success after safari recovery');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(mockLogger).toHaveBeenCalledWith('Attempting Safari IndexedDB connection recovery');
    });

    it('should not apply Safari recovery on non-Safari browsers', async () => {
      // Switch back to Chrome user agent
      mockUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Connection to Indexed Database server lost'));

      await expect(retryOnCursorError(mockDb, operation, mockLogger)).rejects.toThrow(
        'Connection to Indexed Database server lost'
      );

      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockDb.close).not.toHaveBeenCalled();
      expect(mockDb.open).not.toHaveBeenCalled();
    });
  });

  describe('strategy priority', () => {
    beforeEach(() => {
      // Mock Safari user agent
      mockUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      );
    });

    it('should prioritize Safari strategy over cursor strategy for Safari connection errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('cursor: Connection to Indexed Database server lost'))
        .mockResolvedValueOnce('success');

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 123 as any;
      });

      await retryOnCursorError(mockDb, operation, mockLogger);

      // Should use Safari strategy (with delays) not cursor strategy
      expect(mockLogger).toHaveBeenCalledWith('Attempting Safari IndexedDB connection recovery');
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2); // Safari delays

      setTimeoutSpy.mockRestore();
    });
  });

  describe('unsupported database operations', () => {
    it('should handle databases without close/open methods for cursor errors', async () => {
      const dbWithoutMethods = {};
      const operation = vi.fn().mockRejectedValue(new Error('cursor error'));

      await expect(retryOnCursorError(dbWithoutMethods, operation, mockLogger)).rejects.toThrow(
        'cursor error'
      );

      expect(mockLogger).toHaveBeenCalledWith('Database does not support close/open operations');
    });

    it('should handle databases without close/open methods for Safari errors', async () => {
      mockUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
      );

      const dbWithoutMethods = {};
      const operation = vi
        .fn()
        .mockRejectedValue(new Error('Connection to Indexed Database server lost'));

      await expect(retryOnCursorError(dbWithoutMethods, operation, mockLogger)).rejects.toThrow(
        'Connection to Indexed Database server lost'
      );

      expect(mockLogger).toHaveBeenCalledWith('Database does not support close/open operations');
    });
  });

  describe('unrecoverable errors', () => {
    it('should re-throw non-recoverable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Some other database error'));

      await expect(retryOnCursorError(mockDb, operation, mockLogger)).rejects.toThrow(
        'Some other database error'
      );

      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockDb.close).not.toHaveBeenCalled();
      expect(mockDb.open).not.toHaveBeenCalled();
    });
  });

  describe('default logger', () => {
    it('should use console.error as default logger', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const operation = vi.fn().mockRejectedValue(new Error('test error'));

      await expect(retryOnCursorError(mockDb, operation)).rejects.toThrow('test error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Database operation failed: test error',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
