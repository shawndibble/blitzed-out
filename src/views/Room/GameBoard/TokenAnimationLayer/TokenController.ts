export interface FLIPData {
  from: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  to: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  distance: number;
  duration: number;
}

export interface TokenControllerOptions {
  baseDuration?: number;
  maxDuration?: number;
  minDuration?: number;
  easing?: string;
}

export class TokenController {
  private gameBoard: Element;
  private options: Required<TokenControllerOptions>;
  private cache: Map<string, DOMRect> = new Map();
  private disposed = false;

  constructor(gameBoard: Element, options: TokenControllerOptions = {}) {
    this.gameBoard = gameBoard;
    this.options = {
      baseDuration: 800,
      maxDuration: 1200,
      minDuration: 400,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      ...options,
    };
  }

  /**
   * Calculate FLIP (First, Last, Invert, Play) animation data
   * for moving a token between tiles
   */
  async calculateFLIPPositions(
    fromTileIndex: number,
    toTileIndex: number
  ): Promise<FLIPData | null> {
    if (this.disposed) {
      console.warn('TokenController has been disposed');
      return null;
    }

    try {
      // Get tile elements
      const fromTile = this.getTileElement(fromTileIndex);
      const toTile = this.getTileElement(toTileIndex);

      if (!fromTile || !toTile) {
        console.warn(`Unable to find tiles: from=${fromTileIndex}, to=${toTileIndex}`);
        return null;
      }

      // Get the actual content container (ol element) for more accurate positioning
      const contentContainer = this.gameBoard.querySelector('ol');
      const containerRect = contentContainer
        ? contentContainer.getBoundingClientRect()
        : this.gameBoard.getBoundingClientRect();

      const fromRect = this.getRelativeRect(fromTile, containerRect);
      const toRect = this.getRelativeRect(toTile, containerRect);

      // Calculate avatar position within each tile (right side of tile)
      const fromAvatarPos = this.calculateAvatarPosition(fromRect);
      const toAvatarPos = this.calculateAvatarPosition(toRect);

      // Calculate distance for duration adjustment
      const distance = Math.sqrt(
        Math.pow(toAvatarPos.x - fromAvatarPos.x, 2) + Math.pow(toAvatarPos.y - fromAvatarPos.y, 2)
      );

      // Dynamic duration based on distance
      const duration = this.calculateDuration(distance);

      return {
        from: {
          x: fromAvatarPos.x,
          y: fromAvatarPos.y,
          width: 40, // Avatar width
          height: 40, // Avatar height
        },
        to: {
          x: toAvatarPos.x,
          y: toAvatarPos.y,
          width: 40,
          height: 40,
        },
        distance,
        duration,
      };
    } catch (error) {
      console.error('Error calculating FLIP positions:', error);
      return null;
    }
  }

  /**
   * Get tile element by index
   */
  private getTileElement(tileIndex: number): Element | null {
    // GameBoard uses <ol><li> structure, so tiles are li elements
    const tiles = this.gameBoard.querySelectorAll('li');
    return tiles[tileIndex] || null;
  }

  /**
   * Calculate rectangle position relative to container content (not viewport)
   * This gives us the position within the scrollable content area
   */
  private getRelativeRect(element: Element, containerRect: DOMRect): DOMRect {
    const elementRect = element.getBoundingClientRect();

    // Get position relative to the container's content, not its viewport
    // We don't need to add scroll offset here because we want positions
    // relative to the animation layer which moves with the content
    return {
      x: elementRect.x - containerRect.x,
      y: elementRect.y - containerRect.y,
      width: elementRect.width,
      height: elementRect.height,
      top: elementRect.top - containerRect.top,
      right: elementRect.right - containerRect.left,
      bottom: elementRect.bottom - containerRect.top,
      left: elementRect.left - containerRect.left,
      toJSON: elementRect.toJSON,
    } as DOMRect;
  }

  /**
   * Calculate avatar position within a tile
   * Avatars are positioned in the top-right corner via .player-indicator
   */
  private calculateAvatarPosition(tileRect: DOMRect): { x: number; y: number } {
    // Player indicators are positioned absolutely:
    // top: 0.5em, right: 0.5em (from GameTile styles)
    const padding = 8; // 0.5em ≈ 8px

    return {
      x: tileRect.x + tileRect.width - padding - 20, // 20px = half avatar width for centering
      y: tileRect.y + padding + 20, // 20px = half avatar height for centering
    };
  }

  /**
   * Calculate animation duration based on distance
   */
  private calculateDuration(distance: number): number {
    // Base duration for normal distances
    const baseDuration = this.options.baseDuration;

    // Adjust duration based on distance (min 400ms, max 1200ms)
    const distanceFactor = Math.min(distance / 500, 2); // Normalize to 0-2 range
    const calculatedDuration = baseDuration * (0.5 + distanceFactor * 0.5);

    return Math.max(
      this.options.minDuration,
      Math.min(this.options.maxDuration, calculatedDuration)
    );
  }

  /**
   * Get current viewport and screen information for optimizations
   */
  getPerformanceInfo() {
    return {
      isMobile: window.innerWidth <= 768,
      hasReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      devicePixelRatio: window.devicePixelRatio || 1,
      containerSize: this.gameBoard.getBoundingClientRect(),
    };
  }

  /**
   * Clear position cache (call when layout changes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Dispose of the controller and clean up resources
   */
  dispose(): void {
    this.disposed = true;
    this.cache.clear();
  }

  /**
   * Check if controller is disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}
