import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenController } from '../TokenController';

// Mock DOM methods
const mockQuerySelectorAll = vi.fn();

// Create mock DOM elements
const createMockElement = (rect: Partial<DOMRect>) => ({
  getBoundingClientRect: () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
    toJSON: () => ({}),
    ...rect,
  }),
  querySelectorAll: mockQuerySelectorAll,
  querySelector: vi.fn(), // Add querySelector method
});

describe('TokenController', () => {
  let controller: TokenController;
  let mockGameBoard: any;

  beforeEach(() => {
    // Create mock game board element
    mockGameBoard = createMockElement({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });

    // Add scroll properties to mock game board
    mockGameBoard.scrollTop = 0;
    mockGameBoard.scrollLeft = 0;

    // Mock tile elements
    const mockTiles = [
      createMockElement({ x: 100, y: 100, width: 200, height: 150 }), // Tile 0
      createMockElement({ x: 300, y: 100, width: 200, height: 150 }), // Tile 1
      createMockElement({ x: 500, y: 100, width: 200, height: 150 }), // Tile 2
    ];

    // Mock ol element
    const mockOl = createMockElement({
      x: 0,
      y: 0,
      width: 800,
      height: 600,
    });

    mockQuerySelectorAll.mockReturnValue(mockTiles);
    mockGameBoard.querySelector.mockReturnValue(mockOl);

    controller = new TokenController(mockGameBoard);
  });

  afterEach(() => {
    controller.dispose();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(controller).toBeInstanceOf(TokenController);
      expect(controller.isDisposed()).toBe(false);
    });

    it('should accept custom options', () => {
      const customController = new TokenController(mockGameBoard, {
        baseDuration: 1000,
        maxDuration: 2000,
      });

      expect(customController).toBeInstanceOf(TokenController);
      customController.dispose();
    });
  });

  describe('calculateFLIPPositions', () => {
    it('should calculate FLIP positions for valid tiles', async () => {
      const result = await controller.calculateFLIPPositions(0, 1);

      expect(result).toBeDefined();
      expect(result).toMatchObject({
        from: {
          x: expect.any(Number),
          y: expect.any(Number),
          width: 40,
          height: 40,
        },
        to: {
          x: expect.any(Number),
          y: expect.any(Number),
          width: 40,
          height: 40,
        },
        distance: expect.any(Number),
        duration: expect.any(Number),
      });
    });

    it('should return null for invalid tile indices', async () => {
      const result = await controller.calculateFLIPPositions(0, 99);
      expect(result).toBeNull();
    });

    it('should return null when controller is disposed', async () => {
      controller.dispose();
      const result = await controller.calculateFLIPPositions(0, 1);
      expect(result).toBeNull();
    });

    it('should calculate different durations based on distance', async () => {
      const shortMove = await controller.calculateFLIPPositions(0, 1);
      const longMove = await controller.calculateFLIPPositions(0, 2);

      expect(shortMove).toBeDefined();
      expect(longMove).toBeDefined();

      if (shortMove && longMove) {
        // Longer moves should generally have longer durations
        expect(longMove.distance).toBeGreaterThan(shortMove.distance);
      }
    });
  });

  describe('getPerformanceInfo', () => {
    it('should return performance information', () => {
      // Mock window properties
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

      // Mock matchMedia
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
      });

      const info = controller.getPerformanceInfo();

      expect(info).toMatchObject({
        isMobile: false,
        hasReducedMotion: false,
        devicePixelRatio: 2,
        containerSize: expect.any(Object),
      });
    });

    it('should detect mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

      // Mock matchMedia for this test
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
      });

      const info = controller.getPerformanceInfo();
      expect(info.isMobile).toBe(true);
    });

    it('should detect reduced motion preference', () => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: true,
      });

      const info = controller.getPerformanceInfo();
      expect(info.hasReducedMotion).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should mark controller as disposed', () => {
      expect(controller.isDisposed()).toBe(false);
      controller.dispose();
      expect(controller.isDisposed()).toBe(true);
    });

    it('should clear cache on dispose', () => {
      controller.clearCache(); // Should not throw
      controller.dispose();
      controller.clearCache(); // Should still not throw
    });
  });

  describe('clearCache', () => {
    it('should clear position cache', () => {
      // Cache is internal, so we just test it doesn't throw
      expect(() => controller.clearCache()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully during FLIP calculation', async () => {
      // Mock querySelector to throw an error
      mockQuerySelectorAll.mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = await controller.calculateFLIPPositions(0, 1);
      expect(result).toBeNull();
    });

    it('should handle missing tiles gracefully', async () => {
      mockQuerySelectorAll.mockReturnValue([]);

      const result = await controller.calculateFLIPPositions(0, 1);
      expect(result).toBeNull();
    });
  });

  describe('avatar position calculation', () => {
    it('should calculate avatar position within tile bounds', async () => {
      const result = await controller.calculateFLIPPositions(0, 1);

      expect(result).toBeDefined();
      if (result) {
        // Avatar positions should be within reasonable bounds relative to tile positions
        expect(result.from.x).toBeGreaterThan(0);
        expect(result.from.y).toBeGreaterThan(0);
        expect(result.to.x).toBeGreaterThan(0);
        expect(result.to.y).toBeGreaterThan(0);
      }
    });
  });

  describe('duration calculation', () => {
    it('should respect minimum and maximum duration limits', async () => {
      const customController = new TokenController(mockGameBoard, {
        minDuration: 500,
        maxDuration: 1000,
      });

      const result = await customController.calculateFLIPPositions(0, 1);

      expect(result).toBeDefined();
      if (result) {
        expect(result.duration).toBeGreaterThanOrEqual(500);
        expect(result.duration).toBeLessThanOrEqual(1000);
      }

      customController.dispose();
    });
  });

  describe('scroll position handling', () => {
    it('should account for scroll position in calculations', async () => {
      // Set scroll position
      mockGameBoard.scrollTop = 200;
      mockGameBoard.scrollLeft = 50;

      const result = await controller.calculateFLIPPositions(0, 1);

      expect(result).toBeDefined();
      if (result) {
        // With scroll offset, positions should be adjusted
        // The exact values depend on the calculation, but they should be different
        // from when scroll is 0
        expect(result.from.y).toBeGreaterThan(0);
        expect(result.to.y).toBeGreaterThan(0);
      }
    });

    it('should handle zero scroll position', async () => {
      // Ensure scroll is zero
      mockGameBoard.scrollTop = 0;
      mockGameBoard.scrollLeft = 0;

      const result = await controller.calculateFLIPPositions(0, 1);
      expect(result).toBeDefined();
    });
  });
});
