/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from 'vitest';
import db from '@/stores/store';

describe('Database Migration to Version 5', () => {
  test('Database should have correct structure and tables defined', () => {
    // Test that database instance exists
    expect(db).toBeDefined();
    expect(db.name).toBe('blitzedOut');

    // Test existing tables still exist
    expect(db.customTiles).toBeDefined();
    expect(db.gameBoard).toBeDefined();
    expect(db.customGroups).toBeDefined();

    // Test new local player tables are defined
    expect(db.localPlayerSessions).toBeDefined();
    expect(db.localPlayerMoves).toBeDefined();
    expect(db.localPlayerStats).toBeDefined();
  });

  test('Database schema should include all expected table schemas', () => {
    // Check that the new tables have the expected names
    const tableNames = db.tables.map((table) => table.name);

    expect(tableNames).toContain('customTiles');
    expect(tableNames).toContain('gameBoard');
    expect(tableNames).toContain('customGroups');
    expect(tableNames).toContain('localPlayerSessions');
    expect(tableNames).toContain('localPlayerMoves');
    expect(tableNames).toContain('localPlayerStats');
  });

  test('Local player session schema should have correct indexes', () => {
    const sessionTable = db.localPlayerSessions;
    expect(sessionTable.schema.name).toBe('localPlayerSessions');

    // Check that primary key and indexes are set up
    expect(sessionTable.schema.primKey.name).toBe('id');
    expect(sessionTable.schema.primKey.auto).toBe(true);
  });

  test('Local player moves schema should have correct indexes', () => {
    const moveTable = db.localPlayerMoves;
    expect(moveTable.schema.name).toBe('localPlayerMoves');
    expect(moveTable.schema.primKey.name).toBe('id');
    expect(moveTable.schema.primKey.auto).toBe(true);
  });

  test('Local player stats schema should have correct indexes', () => {
    const statsTable = db.localPlayerStats;
    expect(statsTable.schema.name).toBe('localPlayerStats');
    expect(statsTable.schema.primKey.name).toBe('id');
    expect(statsTable.schema.primKey.auto).toBe(true);
  });

  test('Database middleware should include new tables', () => {
    // The sync middleware should be configured to include the new tables
    // This test verifies the table names are correct for sync
    const expectedTables = [
      'customTiles',
      'gameBoard',
      'customGroups',
      'localPlayerSessions',
      'localPlayerMoves',
      'localPlayerStats',
    ];

    // We can't directly test the middleware config, but we can ensure
    // the tables exist and are properly named
    expectedTables.forEach((tableName) => {
      const table = db.table(tableName);
      expect(table).toBeDefined();
      expect(table.name).toBe(tableName);
    });
  });
});
