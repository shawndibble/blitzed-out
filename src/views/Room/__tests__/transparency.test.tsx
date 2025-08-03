import { describe, it, expect } from 'vitest';

// Helper function to test the transparency logic
function getActualBackground(
  background: string | undefined,
  roomBackground: string | undefined
): string | null {
  if (background === 'useRoomBackground') {
    return roomBackground || null;
  }
  return background || null;
}

function getTransparencyValues(background: string | undefined, roomBackground: string | undefined) {
  const actualBackground = getActualBackground(background, roomBackground);

  const isGameBoardTransparent = !['color'].includes(actualBackground || '');
  const isMessageListTransparent = !!(
    actualBackground && !['color', 'gray'].includes(actualBackground)
  );

  return {
    actualBackground,
    isGameBoardTransparent,
    isMessageListTransparent,
  };
}

describe('Room transparency logic', () => {
  describe('getActualBackground helper', () => {
    it('returns background value when not useRoomBackground', () => {
      expect(getActualBackground('color', 'gray')).toBe('color');
      expect(getActualBackground('gray', 'color')).toBe('gray');
      expect(getActualBackground('custom', 'color')).toBe('custom');
      expect(getActualBackground('https://example.com/bg.jpg', 'gray')).toBe(
        'https://example.com/bg.jpg'
      );
    });

    it('returns roomBackground when background is useRoomBackground', () => {
      expect(getActualBackground('useRoomBackground', 'color')).toBe('color');
      expect(getActualBackground('useRoomBackground', 'gray')).toBe('gray');
      expect(getActualBackground('useRoomBackground', 'custom')).toBe('custom');
      expect(getActualBackground('useRoomBackground', 'https://example.com/bg.jpg')).toBe(
        'https://example.com/bg.jpg'
      );
    });

    it('returns null for undefined/empty values', () => {
      expect(getActualBackground(undefined, 'color')).toBe(null);
      expect(getActualBackground('', 'color')).toBe(null);
      expect(getActualBackground('useRoomBackground', undefined)).toBe(null);
      expect(getActualBackground('useRoomBackground', '')).toBe(null);
      expect(getActualBackground(undefined, undefined)).toBe(null);
    });
  });

  describe('Game board transparency', () => {
    it('is opaque (not transparent) only for color backgrounds', () => {
      // Color backgrounds - game board should be opaque
      expect(getTransparencyValues('color', undefined).isGameBoardTransparent).toBe(false);
      expect(getTransparencyValues('useRoomBackground', 'color').isGameBoardTransparent).toBe(
        false
      );

      // Gray backgrounds - game board should be transparent
      expect(getTransparencyValues('gray', undefined).isGameBoardTransparent).toBe(true);
      expect(getTransparencyValues('useRoomBackground', 'gray').isGameBoardTransparent).toBe(true);

      // Custom backgrounds - game board should be transparent
      expect(getTransparencyValues('custom', undefined).isGameBoardTransparent).toBe(true);
      expect(
        getTransparencyValues('https://example.com/bg.jpg', undefined).isGameBoardTransparent
      ).toBe(true);
      expect(getTransparencyValues('useRoomBackground', 'custom').isGameBoardTransparent).toBe(
        true
      );
      expect(
        getTransparencyValues('useRoomBackground', 'https://example.com/bg.jpg')
          .isGameBoardTransparent
      ).toBe(true);

      // No background - game board should be transparent
      expect(getTransparencyValues(undefined, undefined).isGameBoardTransparent).toBe(true);
      expect(getTransparencyValues('', undefined).isGameBoardTransparent).toBe(true);
      expect(getTransparencyValues('useRoomBackground', undefined).isGameBoardTransparent).toBe(
        true
      );
    });
  });

  describe('Message list transparency', () => {
    it('is opaque (not transparent) for color and gray backgrounds', () => {
      // Color backgrounds - message list should be opaque
      expect(getTransparencyValues('color', undefined).isMessageListTransparent).toBe(false);
      expect(getTransparencyValues('useRoomBackground', 'color').isMessageListTransparent).toBe(
        false
      );

      // Gray backgrounds - message list should be opaque
      expect(getTransparencyValues('gray', undefined).isMessageListTransparent).toBe(false);
      expect(getTransparencyValues('useRoomBackground', 'gray').isMessageListTransparent).toBe(
        false
      );
    });

    it('is transparent for custom backgrounds', () => {
      // Custom backgrounds - message list should be transparent
      expect(getTransparencyValues('custom', undefined).isMessageListTransparent).toBe(true);
      expect(
        getTransparencyValues('https://example.com/bg.jpg', undefined).isMessageListTransparent
      ).toBe(true);
      expect(getTransparencyValues('useRoomBackground', 'custom').isMessageListTransparent).toBe(
        true
      );
      expect(
        getTransparencyValues('useRoomBackground', 'https://example.com/bg.jpg')
          .isMessageListTransparent
      ).toBe(true);
    });

    it('is opaque (not transparent) when no background is set', () => {
      // No background - message list should be opaque
      expect(getTransparencyValues(undefined, undefined).isMessageListTransparent).toBe(false);
      expect(getTransparencyValues('', undefined).isMessageListTransparent).toBe(false);
      expect(getTransparencyValues('useRoomBackground', undefined).isMessageListTransparent).toBe(
        false
      );
      expect(getTransparencyValues('useRoomBackground', '').isMessageListTransparent).toBe(false);
    });
  });

  describe('Combined scenarios', () => {
    it('handles "None - Color Tiles" selection correctly', () => {
      const result = getTransparencyValues('color', undefined);

      expect(result.actualBackground).toBe('color');
      expect(result.isGameBoardTransparent).toBe(false); // Game board opaque (colorful)
      expect(result.isMessageListTransparent).toBe(false); // Message list opaque
    });

    it('handles "None - Gray Tiles" selection correctly', () => {
      const result = getTransparencyValues('gray', undefined);

      expect(result.actualBackground).toBe('gray');
      expect(result.isGameBoardTransparent).toBe(true); // Game board transparent (shows gray)
      expect(result.isMessageListTransparent).toBe(false); // Message list opaque
    });

    it('handles custom image background correctly', () => {
      const result = getTransparencyValues('https://example.com/background.jpg', undefined);

      expect(result.actualBackground).toBe('https://example.com/background.jpg');
      expect(result.isGameBoardTransparent).toBe(true); // Game board transparent
      expect(result.isMessageListTransparent).toBe(true); // Message list transparent
    });

    it('handles room background scenarios correctly', () => {
      // Room set to color, app using room background
      const colorRoom = getTransparencyValues('useRoomBackground', 'color');
      expect(colorRoom.actualBackground).toBe('color');
      expect(colorRoom.isGameBoardTransparent).toBe(false); // Game board opaque
      expect(colorRoom.isMessageListTransparent).toBe(false); // Message list opaque

      // Room set to gray, app using room background
      const grayRoom = getTransparencyValues('useRoomBackground', 'gray');
      expect(grayRoom.actualBackground).toBe('gray');
      expect(grayRoom.isGameBoardTransparent).toBe(true); // Game board transparent
      expect(grayRoom.isMessageListTransparent).toBe(false); // Message list opaque

      // Room set to custom, app using room background
      const customRoom = getTransparencyValues(
        'useRoomBackground',
        'https://example.com/room-bg.jpg'
      );
      expect(customRoom.actualBackground).toBe('https://example.com/room-bg.jpg');
      expect(customRoom.isGameBoardTransparent).toBe(true); // Game board transparent
      expect(customRoom.isMessageListTransparent).toBe(true); // Message list transparent
    });

    it('handles edge cases correctly', () => {
      // Empty strings
      const emptyStrings = getTransparencyValues('', '');
      expect(emptyStrings.actualBackground).toBe(null);
      expect(emptyStrings.isGameBoardTransparent).toBe(true);
      expect(emptyStrings.isMessageListTransparent).toBe(false);

      // Mixed empty and valid values
      const mixedEmpty = getTransparencyValues('useRoomBackground', '');
      expect(mixedEmpty.actualBackground).toBe(null);
      expect(mixedEmpty.isGameBoardTransparent).toBe(true);
      expect(mixedEmpty.isMessageListTransparent).toBe(false);
    });
  });

  describe('User experience scenarios', () => {
    it('ensures colorful game tiles are visible with color background', () => {
      const result = getTransparencyValues('color', undefined);
      // User selects "None - Color Tiles" and expects colorful, opaque game board
      expect(result.isGameBoardTransparent).toBe(false);
    });

    it('ensures gray game tiles show through with gray background', () => {
      const result = getTransparencyValues('gray', undefined);
      // User selects "None - Gray Tiles" and expects gray background to show through
      expect(result.isGameBoardTransparent).toBe(true);
    });

    it('ensures message list readability is maintained', () => {
      // Message list should only be transparent with custom backgrounds
      expect(getTransparencyValues('color', undefined).isMessageListTransparent).toBe(false);
      expect(getTransparencyValues('gray', undefined).isMessageListTransparent).toBe(false);
      expect(
        getTransparencyValues('https://example.com/bg.jpg', undefined).isMessageListTransparent
      ).toBe(true);
    });
  });
});
