// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { get, push, ref, set } from 'firebase/database';

const PROJECT_ID = 'demo-blitzed';
const UID = 'user-123';
const OTHER_UID = 'user-456';
const ROOM = 'PUBLIC';

let testEnv: RulesTestEnvironment;

/** RTDB instance authenticated as the given uid. */
function dbAs(uid: string) {
  return testEnv.authenticatedContext(uid).database();
}

/** RTDB instance with no auth token — a signed-out visitor. */
function dbAnon() {
  return testEnv.unauthenticatedContext().database();
}

/** Presence node shape written by firebaseSignaling.setPresent(). */
const validPresence = () => ({
  joinedAt: Date.now(),
  lastSeen: Date.now(),
  status: 'online',
});

/** Top-level presence record written by roomPresence.setUserPresence(). */
const validUserPresence = () => ({
  displayName: 'Someone',
  isAnonymous: true,
  room: ROOM,
  joinedAt: Date.now(),
  lastSeen: Date.now(),
});

/** Signal payload shape written by firebaseSignaling.sendOffer/sendAnswer. */
const validOffer = (from: string) => ({
  type: 'offer',
  sdp: 'v=0',
  from,
  timestamp: Date.now(),
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: { rules: readFileSync('database.rules.json', 'utf8') },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
});

// If this suite runs against an emulator that never loaded database.rules.json,
// every deny-assertion below passes for the wrong reason. Root is default-deny,
// so an unauthenticated root read failing is proof the ruleset is live.
describe('ruleset is loaded (canary)', () => {
  it('denies an unauthenticated read of the root', async () => {
    await assertFails(get(ref(dbAnon(), '/')));
  });

  it('denies an authenticated read of the root', async () => {
    await assertFails(get(ref(dbAs(UID), '/')));
  });

  it('denies writes to an unmapped top-level path', async () => {
    await assertFails(set(ref(dbAs(UID), 'anything-else/x'), { a: 1 }));
    await assertFails(set(ref(dbAnon(), 'anything-else/x'), { a: 1 }));
  });
});

describe('users (top-level presence)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `users/${OTHER_UID}`), validUserPresence());
    });
  });

  // ⚠ ASSERTS AS WRITTEN, NOT AS DESIRED: `users/.read` is the literal `true`,
  // so display names, current room and lastSeen are world-readable. Tracked in
  // docs/engineering/security.md § RTDB "Key weaknesses" #1.
  it('allows an unauthenticated read of the whole presence tree', async () => {
    await assertSucceeds(get(ref(dbAnon(), 'users')));
  });

  it("allows any user to read another user's presence record", async () => {
    await assertSucceeds(get(ref(dbAs(UID), `users/${OTHER_UID}`)));
  });

  it('lets a user write their own presence record', async () => {
    await assertSucceeds(set(ref(dbAs(UID), `users/${UID}`), validUserPresence()));
  });

  it("denies writing another user's presence record", async () => {
    await assertFails(set(ref(dbAs(UID), `users/${OTHER_UID}`), validUserPresence()));
  });

  it('denies an unauthenticated presence write', async () => {
    await assertFails(set(ref(dbAnon(), `users/${UID}`), validUserPresence()));
  });

  it('denies a presence record missing a required child', async () => {
    const { room: _room, ...withoutRoom } = validUserPresence();
    await assertFails(set(ref(dbAs(UID), `users/${UID}`), withoutRoom));
  });

  it('denies a presence record with a mistyped child', async () => {
    await assertFails(
      set(ref(dbAs(UID), `users/${UID}`), { ...validUserPresence(), isAnonymous: 'yes' })
    );
  });

  it('lets the owner refresh lastSeen on its own', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `users/${UID}`), validUserPresence());
    });
    await assertSucceeds(set(ref(dbAs(UID), `users/${UID}/lastSeen`), Date.now()));
  });

  it('denies a non-numeric lastSeen', async () => {
    await assertFails(set(ref(dbAs(UID), `users/${UID}/lastSeen`), 'now'));
  });

  it("denies refreshing another user's lastSeen", async () => {
    await assertFails(set(ref(dbAs(UID), `users/${OTHER_UID}/lastSeen`), Date.now()));
  });

  it('lets the owner delete their own presence record', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `users/${UID}`), validUserPresence());
    });
    await assertSucceeds(set(ref(dbAs(UID), `users/${UID}`), null));
  });
});

describe('video-calls/$roomId (no ancestor read grant)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.database();
      await set(ref(db, `video-calls/${ROOM}/users/${OTHER_UID}`), validPresence());
      await set(ref(db, `video-calls/${ROOM}/offers/${OTHER_UID}/sig1`), validOffer(UID));
    });
  });

  // Regression guard for the 2026-08 fix: `video-calls/$roomId` used to carry
  // `.read: auth != null`, and RTDB read grants cascade downward and cannot be
  // revoked by a stricter rule on a child — so every room's signalling traffic
  // was readable by any signed-in user. If a read grant reappears on the room
  // node, this test is the only thing that catches it.
  it('denies reading a room node even when authenticated', async () => {
    await assertFails(get(ref(dbAs(UID), `video-calls/${ROOM}`)));
  });

  it('denies reading the whole video-calls tree', async () => {
    await assertFails(get(ref(dbAs(UID), 'video-calls')));
  });

  it('denies reading a room node unauthenticated', async () => {
    await assertFails(get(ref(dbAnon(), `video-calls/${ROOM}`)));
  });

  it('denies reading the offers fan-out node (no per-target scope above it)', async () => {
    await assertFails(get(ref(dbAs(UID), `video-calls/${ROOM}/offers`)));
  });
});

describe('video-calls roster (users)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `video-calls/${ROOM}/users/${OTHER_UID}`), validPresence());
    });
  });

  // videoCallStore subscribes to the whole `users` node to build the roster, so
  // every participant needs list access.
  it('lets an authenticated user read the roster', async () => {
    await assertSucceeds(get(ref(dbAs(UID), `video-calls/${ROOM}/users`)));
  });

  // ⚠ ASSERTS AS WRITTEN, NOT AS DESIRED: read is `auth != null`, with no
  // membership check — a signed-in user who never joined can enumerate any
  // room's participants (and, via functions' cleanup shape, their timestamps).
  it('lets an authenticated non-participant read any room roster', async () => {
    // Seeded, so this proves enumeration of real participants rather than a
    // successful read of an empty path.
    await testEnv.withSecurityRulesDisabled((context) =>
      set(ref(context.database(), `video-calls/OTHER-ROOM/users/${OTHER_UID}`), validPresence())
    );

    const snapshot = await assertSucceeds(
      get(ref(dbAs('stranger'), 'video-calls/OTHER-ROOM/users'))
    );
    expect(Object.keys(snapshot.val())).toEqual([OTHER_UID]);
  });

  it('denies an unauthenticated roster read', async () => {
    await assertFails(get(ref(dbAnon(), `video-calls/${ROOM}/users`)));
  });

  it('lets a user claim their own roster slot', async () => {
    await assertSucceeds(set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}`), validPresence()));
  });

  it("denies claiming another user's roster slot", async () => {
    await assertFails(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${OTHER_UID}`), validPresence())
    );
  });

  it('denies an unauthenticated roster claim', async () => {
    await assertFails(set(ref(dbAnon(), `video-calls/${ROOM}/users/${UID}`), validPresence()));
  });

  it('denies a roster slot missing status', async () => {
    await assertFails(set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}`), { joinedAt: 1 }));
  });

  it('denies a roster slot missing joinedAt', async () => {
    await assertFails(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}`), { status: 'online' })
    );
  });

  it('denies a roster slot with a non-numeric joinedAt', async () => {
    await assertFails(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}`), {
        ...validPresence(),
        joinedAt: 'now',
      })
    );
  });

  it('denies a joinedAt more than a minute in the future', async () => {
    await assertFails(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}`), {
        ...validPresence(),
        joinedAt: Date.now() + 5 * 60 * 1000,
      })
    );
  });

  it('lets a user release their own roster slot', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `video-calls/${ROOM}/users/${UID}`), validPresence());
    });
    await assertSucceeds(set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}`), null));
  });

  // `.validate` cascades down, never up: `$userId/.validate` requires
  // hasChildren(['joinedAt','status']) but is not evaluated for a write aimed at
  // a child, so a lone `lastSeen` is accepted by the rules. (Whether the roster
  // then keeps such a node is `liveRoster()`'s business, not the ruleset's.)
  it('allows a lastSeen-only heartbeat — ancestor .validate does not apply', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `video-calls/${ROOM}/users/${UID}`), validPresence());
    });
    await assertSucceeds(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}/lastSeen`), Date.now())
    );
  });

  it('denies a lastSeen more than a minute in the future', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `video-calls/${ROOM}/users/${UID}`), validPresence());
    });
    await assertFails(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${UID}/lastSeen`), Date.now() + 5 * 60 * 1000)
    );
  });

  it("denies writing another user's lastSeen", async () => {
    await assertFails(
      set(ref(dbAs(UID), `video-calls/${ROOM}/users/${OTHER_UID}/lastSeen`), Date.now())
    );
  });
});

describe.each(['offers', 'answers', 'ice-candidates'] as const)('video-calls %s', (node) => {
  const inbox = (uid: string) => `video-calls/${ROOM}/${node}/${uid}`;

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await set(ref(ctx.database(), `${inbox(UID)}/sig1`), validOffer(OTHER_UID));
    });
  });

  it('lets the addressee read their own inbox', async () => {
    await assertSucceeds(get(ref(dbAs(UID), inbox(UID))));
  });

  it("denies reading another user's inbox", async () => {
    await assertFails(get(ref(dbAs(OTHER_UID), inbox(UID))));
  });

  it('denies an unauthenticated inbox read', async () => {
    await assertFails(get(ref(dbAnon(), inbox(UID))));
  });

  it('lets a sender push a signal stamped with their own uid', async () => {
    await assertSucceeds(push(ref(dbAs(OTHER_UID), inbox(UID)), validOffer(OTHER_UID)));
  });

  it('denies a signal spoofing another sender in `from`', async () => {
    await assertFails(push(ref(dbAs(OTHER_UID), inbox(UID)), validOffer('someone-else')));
  });

  it('denies a signal with no `from`', async () => {
    const { from: _from, ...withoutFrom } = validOffer(OTHER_UID);
    await assertFails(push(ref(dbAs(OTHER_UID), inbox(UID)), withoutFrom));
  });

  it('denies an unauthenticated signal push', async () => {
    await assertFails(push(ref(dbAnon(), inbox(UID)), validOffer(OTHER_UID)));
  });

  // `.validate` cascades downward, so overwriting the whole inbox is still held
  // to the per-signal `from` check.
  it('denies overwriting an inbox with a spoofed signal underneath', async () => {
    await assertFails(set(ref(dbAs(OTHER_UID), inbox(UID)), { sig2: validOffer('someone-else') }));
  });

  it('lets a sender overwrite an inbox with correctly stamped signals', async () => {
    await assertSucceeds(set(ref(dbAs(OTHER_UID), inbox(UID)), { sig2: validOffer(OTHER_UID) }));
  });

  // The addressee deletes each signal after processing it (firebaseSignaling
  // clears offers/answers 5s after handling, candidates after 30s).
  it('lets the addressee delete a processed signal', async () => {
    await assertSucceeds(set(ref(dbAs(UID), `${inbox(UID)}/sig1`), null));
  });

  // ⚠ ASSERTS AS WRITTEN, NOT AS DESIRED: `.write` is `auth != null` and a
  // delete has no newData for `.validate` to reject, so any signed-in user can
  // wipe any room's signalling queues. See the report.
  it("lets an unrelated authenticated user delete someone else's whole inbox", async () => {
    await assertSucceeds(set(ref(dbAs('stranger'), inbox(UID)), null));
  });

  it('denies an unauthenticated delete', async () => {
    await assertFails(set(ref(dbAnon(), `${inbox(UID)}/sig1`), null));
  });
});

describe('rules file shape', () => {
  it('keeps the top-level default deny', () => {
    const rules = JSON.parse(readFileSync('database.rules.json', 'utf8'));
    expect(rules.rules['.read']).toBe(false);
    expect(rules.rules['.write']).toBe(false);
  });

  it('grants no read on the room node itself', () => {
    const rules = JSON.parse(readFileSync('database.rules.json', 'utf8'));
    expect(rules.rules['video-calls'].$roomId['.read']).toBeUndefined();
  });
});
