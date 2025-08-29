import { describe, it, expect } from 'vitest';
import {
  generateGroupContentHash,
  generateTileContentHash,
  generateDisabledDefaultContentHash,
  validateContentHash,
} from '../contentHashing';

// Mock data for testing
const mockGroup = {
  name: 'Test Group',
  gameMode: 'online',
  type: 'solo' as const,
  intensities: [
    { id: 'id1', value: 0, label: 'Mild', isDefault: false },
    { id: 'id2', value: 1, label: 'Medium', isDefault: false },
  ],
};

const mockTile = {
  action: 'Test action',
  intensity: 0,
  tags: ['test', 'custom'],
};

describe('Content Hashing', () => {
  describe('generateGroupContentHash', () => {
    it('should generate consistent hashes for identical groups', async () => {
      const hash1 = await generateGroupContentHash(mockGroup);
      const hash2 = await generateGroupContentHash(mockGroup);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^sha256-[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different groups', async () => {
      const group1 = { ...mockGroup };
      const group2 = { ...mockGroup, name: 'Different Group' };

      const hash1 = await generateGroupContentHash(group1);
      const hash2 = await generateGroupContentHash(group2);

      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash regardless of intensity order', async () => {
      const group1 = {
        ...mockGroup,
        intensities: [
          { id: 'id2', value: 1, label: 'Medium', isDefault: false },
          { id: 'id1', value: 0, label: 'Mild', isDefault: false },
        ],
      };
      const group2 = {
        ...mockGroup,
        intensities: [
          { id: 'id1', value: 0, label: 'Mild', isDefault: false },
          { id: 'id2', value: 1, label: 'Medium', isDefault: false },
        ],
      };

      const hash1 = await generateGroupContentHash(group1);
      const hash2 = await generateGroupContentHash(group2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateTileContentHash', () => {
    it('should generate consistent hashes for identical tiles', async () => {
      const hash1 = await generateTileContentHash(mockTile, 'Test Group');
      const hash2 = await generateTileContentHash(mockTile, 'Test Group');

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^sha256-[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different tiles', async () => {
      const tile1 = { ...mockTile };
      const tile2 = { ...mockTile, action: 'Different action' };

      const hash1 = await generateTileContentHash(tile1, 'Test Group');
      const hash2 = await generateTileContentHash(tile2, 'Test Group');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash regardless of tag order', async () => {
      const tile1 = { ...mockTile, tags: ['custom', 'test'] };
      const tile2 = { ...mockTile, tags: ['test', 'custom'] };

      const hash1 = await generateTileContentHash(tile1, 'Test Group');
      const hash2 = await generateTileContentHash(tile2, 'Test Group');

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateDisabledDefaultContentHash', () => {
    it('should generate consistent hashes for identical disabled defaults', async () => {
      const hash1 = await generateDisabledDefaultContentHash(
        'Test action',
        'Test Group',
        0,
        'online'
      );
      const hash2 = await generateDisabledDefaultContentHash(
        'Test action',
        'Test Group',
        0,
        'online'
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^sha256-[a-f0-9]{64}$/);
    });

    it('should generate different hashes for different disabled defaults', async () => {
      const hash1 = await generateDisabledDefaultContentHash(
        'Test action',
        'Test Group',
        0,
        'online'
      );
      const hash2 = await generateDisabledDefaultContentHash(
        'Different action',
        'Test Group',
        0,
        'online'
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateContentHash', () => {
    it('should validate group hashes correctly', async () => {
      const hash = await generateGroupContentHash(mockGroup);
      const isValid = await validateContentHash(mockGroup, hash, 'group');

      expect(isValid).toBe(true);
    });

    it('should validate tile hashes correctly', async () => {
      const tileWithGroupName = { ...mockTile, groupName: 'Test Group' };
      const hash = await generateTileContentHash(mockTile, 'Test Group');
      const isValid = await validateContentHash(tileWithGroupName, hash, 'tile');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid hashes', async () => {
      const hash = 'sha256-invalid';
      const isValid = await validateContentHash(mockGroup, hash, 'group');

      expect(isValid).toBe(false);
    });

    it('should return false for tiles without groupName', async () => {
      const hash = await generateTileContentHash(mockTile, 'Test Group');
      const isValid = await validateContentHash(mockTile, hash, 'tile');

      expect(isValid).toBe(false);
    });
  });
});
