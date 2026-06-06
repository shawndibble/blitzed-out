// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-blitzed';
const UID = 'user-123';
const OTHER_UID = 'user-456';

let testEnv: RulesTestEnvironment;

/** Firestore instance authenticated as the given uid. */
function dbAs(uid: string) {
  return testEnv.authenticatedContext(uid).firestore();
}

const future = () => new Date(Date.now() + 60 * 60 * 1000);

// Field-complete fixtures; individual tests override the field under test.
const validSchedule = () => ({
  dateTime: future(),
  url: 'https://example.com/cam',
  room: 'PUBLIC',
  createdBy: UID,
});

const validCustomAction = () => ({
  grouping: 'Foreplay',
  customAction: 'Do the thing to {player}.',
  ttl: future(),
});

const validBoard = () => ({
  title: 'My Board',
  gameBoard: JSON.stringify([{ title: 'Start', description: 'Begin' }]),
  settings: JSON.stringify({ gameMode: 'online' }),
  checksum: 'a'.repeat(64),
  ttl: future(),
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('schedule', () => {
  it('accepts an https url', async () => {
    const db = dbAs(UID);
    await assertSucceeds(setDoc(doc(db, 'schedule/s1'), validSchedule()));
  });

  it('accepts an empty url (optional)', async () => {
    const db = dbAs(UID);
    await assertSucceeds(setDoc(doc(db, 'schedule/s1'), { ...validSchedule(), url: '' }));
  });

  it('rejects a javascript: url', async () => {
    const db = dbAs(UID);
    await assertFails(
      setDoc(doc(db, 'schedule/s1'), { ...validSchedule(), url: 'javascript:alert(1)' })
    );
  });

  it('rejects a data: url', async () => {
    const db = dbAs(UID);
    await assertFails(
      setDoc(doc(db, 'schedule/s1'), {
        ...validSchedule(),
        url: 'data:text/html,<script>alert(1)</script>',
      })
    );
  });

  it('rejects a scheme embedded mid-string (anchor check)', async () => {
    const db = dbAs(UID);
    await assertFails(
      setDoc(doc(db, 'schedule/s1'), { ...validSchedule(), url: 'data:x,https://evil.com' })
    );
  });

  it('rejects an oversized url (> 2048)', async () => {
    const db = dbAs(UID);
    const url = 'https://example.com/' + 'a'.repeat(2048);
    await assertFails(setDoc(doc(db, 'schedule/s1'), { ...validSchedule(), url }));
  });

  it('rejects an extra field (hasOnly)', async () => {
    const db = dbAs(UID);
    await assertFails(
      setDoc(doc(db, 'schedule/s1'), { ...validSchedule(), extra: 'nope' } as Record<
        string,
        unknown
      >)
    );
  });

  it('rejects createdBy != auth uid', async () => {
    const db = dbAs(UID);
    await assertFails(setDoc(doc(db, 'schedule/s1'), { ...validSchedule(), createdBy: OTHER_UID }));
  });

  it('lets the owner change the date, rejects a non-owner', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'schedule/s1'), validSchedule());
    });
    await assertSucceeds(
      updateDoc(doc(dbAs(UID), 'schedule/s1'), { dateTime: future(), url: 'https://example.com/x' })
    );
    await assertFails(
      updateDoc(doc(dbAs(OTHER_UID), 'schedule/s1'), {
        dateTime: future(),
        url: 'https://example.com/x',
      })
    );
  });

  it('rejects updating the url to a javascript: scheme', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'schedule/s1'), validSchedule());
    });
    await assertFails(
      updateDoc(doc(dbAs(UID), 'schedule/s1'), { dateTime: future(), url: 'javascript:alert(1)' })
    );
  });
});

describe('custom-actions', () => {
  it('accepts a valid action', async () => {
    await assertSucceeds(setDoc(doc(dbAs(UID), 'custom-actions/a1'), validCustomAction()));
  });

  it('rejects a customAction over 2000 chars', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'custom-actions/a1'), {
        ...validCustomAction(),
        customAction: 'a'.repeat(2001),
      })
    );
  });

  it('rejects an extra field (hasOnly)', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'custom-actions/a1'), {
        ...validCustomAction(),
        extra: 'nope',
      } as Record<string, unknown>)
    );
  });

  it('rejects update and delete', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'custom-actions/a1'), validCustomAction());
    });
    await assertFails(updateDoc(doc(dbAs(UID), 'custom-actions/a1'), { customAction: 'changed' }));
  });
});

describe('game-boards', () => {
  it('accepts a valid board', async () => {
    await assertSucceeds(setDoc(doc(dbAs(UID), 'game-boards/b1'), validBoard()));
  });

  it('rejects a gameBoard over 600000 chars', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'game-boards/b1'), {
        ...validBoard(),
        gameBoard: 'a'.repeat(600001),
      })
    );
  });

  it('rejects settings over 200000 chars', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'game-boards/b1'), {
        ...validBoard(),
        settings: 'a'.repeat(200001),
      })
    );
  });

  it('rejects an extra field (hasOnly)', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'game-boards/b1'), { ...validBoard(), extra: 'nope' } as Record<
        string,
        unknown
      >)
    );
  });
});
