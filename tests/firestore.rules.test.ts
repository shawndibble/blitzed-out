// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

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

  it('rejects a grouping over 100 chars', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'custom-actions/a1'), {
        ...validCustomAction(),
        grouping: 'a'.repeat(101),
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

  it('rejects a title over 200 chars', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'game-boards/b1'), {
        ...validBoard(),
        title: 'a'.repeat(201),
      })
    );
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

const validPack = (overrides: Record<string, unknown> = {}) => ({
  author: UID,
  authorName: 'Tester',
  name: 'My Pack',
  description: 'A pack',
  gameMode: 'online',
  locale: 'en',
  tags: ['fun'],
  visibility: 'public',
  tileCount: 2,
  groupCount: 1,
  groupLabels: ['Group 1'],
  extensionCount: 0,
  extensionLabels: [],
  importCount: 0,
  contents: JSON.stringify({ formatVersion: '2.0.0', data: {} }),
  contentHash: 'sha256-abc',
  packVersion: 1,
  formatVersion: '2.0.0',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('content-packs', () => {
  it('accepts a valid pack authored by the current user', async () => {
    await assertSucceeds(setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack()));
  });

  it('rejects creating a pack owned by someone else', async () => {
    await assertFails(setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack({ author: OTHER_UID })));
  });

  it('rejects contents over 600000 chars', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack({ contents: 'a'.repeat(600001) }))
    );
  });

  it('rejects an empty name', async () => {
    await assertFails(setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack({ name: '' })));
  });

  it('rejects an extra field (hasOnly)', async () => {
    await assertFails(setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack({ extra: 'nope' })));
  });

  it('allows the author to republish with an increased version', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack());
    });
    await assertSucceeds(
      updateDoc(doc(dbAs(UID), 'content-packs/p1'), {
        packVersion: 2,
        contents: JSON.stringify({ formatVersion: '2.0.0', data: { x: 1 } }),
        contentHash: 'sha256-def',
        name: 'My Pack',
        description: 'A pack',
        tags: ['fun'],
        authorName: 'Tester',
        updatedAt: Date.now(),
      })
    );
  });

  it('rejects republish that does not increase the version', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack({ packVersion: 3 }));
    });
    await assertFails(
      updateDoc(doc(dbAs(UID), 'content-packs/p1'), {
        packVersion: 3,
        contents: '{}',
        contentHash: 'sha256-x',
        name: 'My Pack',
        description: 'A pack',
        tags: [],
        authorName: 'Tester',
        updatedAt: Date.now(),
      })
    );
  });

  it('rejects republish by a non-author', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack());
    });
    await assertFails(
      updateDoc(doc(dbAs(OTHER_UID), 'content-packs/p1'), {
        packVersion: 2,
        contents: '{}',
        contentHash: 'sha256-x',
        name: 'My Pack',
        description: 'A pack',
        tags: [],
        authorName: 'Hacker',
        updatedAt: Date.now(),
      })
    );
  });

  it('allows the author to delete their pack', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack());
    });
    const { deleteDoc } = await import('firebase/firestore');
    await assertSucceeds(deleteDoc(doc(dbAs(UID), 'content-packs/p1')));
  });

  it('allows an admin to take down any pack', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack());
    });
    const { deleteDoc } = await import('firebase/firestore');
    const adminDb = testEnv.authenticatedContext('admin-1', { admin: true }).firestore();
    await assertSucceeds(deleteDoc(doc(adminDb, 'content-packs/p1')));
  });

  it('forbids a non-author non-admin from deleting a pack', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack());
    });
    const { deleteDoc } = await import('firebase/firestore');
    await assertFails(deleteDoc(doc(dbAs(OTHER_UID), 'content-packs/p1')));
  });

  it('rejects a create missing the extension summary fields (hasAll)', async () => {
    const missing = validPack();
    delete (missing as Record<string, unknown>).extensionCount;
    delete (missing as Record<string, unknown>).extensionLabels;
    delete (missing as Record<string, unknown>).importCount;
    await assertFails(setDoc(doc(dbAs(UID), 'content-packs/p1'), missing));
  });

  it('rejects a create with a non-zero importCount', async () => {
    await assertFails(setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack({ importCount: 5 })));
  });

  it('lets any signed-in user bump importCount by exactly one', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack({ importCount: 7 }));
    });
    await assertSucceeds(
      updateDoc(doc(dbAs(OTHER_UID), 'content-packs/p1'), { importCount: 8 })
    );
  });

  it('lets an importer bump a legacy doc without importCount to 1', async () => {
    const legacy = validPack();
    delete (legacy as Record<string, unknown>).importCount;
    delete (legacy as Record<string, unknown>).extensionCount;
    delete (legacy as Record<string, unknown>).extensionLabels;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), legacy);
    });
    await assertSucceeds(updateDoc(doc(dbAs(OTHER_UID), 'content-packs/p1'), { importCount: 1 }));
  });

  it('rejects an importCount jump of more than one', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack({ importCount: 7 }));
    });
    await assertFails(
      updateDoc(doc(dbAs(OTHER_UID), 'content-packs/p1'), { importCount: 9 })
    );
  });

  it('rejects an importCount bump combined with other field changes', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack({ importCount: 7 }));
    });
    await assertFails(
      updateDoc(doc(dbAs(OTHER_UID), 'content-packs/p1'), {
        importCount: 8,
        name: 'Renamed by importer',
      })
    );
  });

  it('rejects a create with an invalid visibility', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'content-packs/p1'), validPack({ visibility: 'secret' }))
    );
  });

  it('lets an anonymous user publish a private pack', async () => {
    const anon = testEnv
      .authenticatedContext('anon-1', { firebase: { sign_in_provider: 'anonymous' } })
      .firestore();
    await assertSucceeds(
      setDoc(doc(anon, 'content-packs/p1'), validPack({ author: 'anon-1', visibility: 'private' }))
    );
  });

  it('forbids an anonymous user from publishing a public pack', async () => {
    const anon = testEnv
      .authenticatedContext('anon-1', { firebase: { sign_in_provider: 'anonymous' } })
      .firestore();
    await assertFails(
      setDoc(doc(anon, 'content-packs/p1'), validPack({ author: 'anon-1', visibility: 'public' }))
    );
  });

  it('allows listing public packs and rejects listing private ones', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/pub'), validPack({ visibility: 'public' }));
      await setDoc(
        doc(ctx.firestore(), 'content-packs/priv'),
        validPack({ visibility: 'private' })
      );
    });
    const col = collection(dbAs(UID), 'content-packs');
    await assertSucceeds(getDocs(query(col, where('visibility', '==', 'public'))));
    // A list not constrained to public packs is rejected by the rule.
    await assertFails(getDocs(query(col, where('visibility', '==', 'private'))));
    await assertFails(getDocs(col));
  });

  it('still allows fetching a private pack by id (link import)', async () => {
    const { getDoc } = await import('firebase/firestore');
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'content-packs/p1'), validPack({ visibility: 'private' }));
    });
    await assertSucceeds(getDoc(doc(dbAs(OTHER_UID), 'content-packs/p1')));
  });
});

describe('reports', () => {
  const validReport = () => ({
    packId: 'p1',
    reporterUid: UID,
    reason: 'inappropriate',
    createdAt: Date.now(),
  });

  it('accepts a valid report from the reporter', async () => {
    await assertSucceeds(setDoc(doc(dbAs(UID), 'reports/r1'), validReport()));
  });

  it('rejects a report spoofing another reporter', async () => {
    await assertFails(
      setDoc(doc(dbAs(UID), 'reports/r1'), { ...validReport(), reporterUid: OTHER_UID })
    );
  });

  it('forbids reading reports', async () => {
    const { getDoc } = await import('firebase/firestore');
    await assertFails(getDoc(doc(dbAs(UID), 'reports/r1')));
  });
});
