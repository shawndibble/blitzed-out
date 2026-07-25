/**
 * Owner of the `user-data/{uid}` Firestore document.
 *
 * That document is one ~1 MiB blob holding every account-scoped section (tiles,
 * groups, default-group extensions, disabled defaults, boards, settings). This
 * module is the only place that knows its field names and its encoding quirks:
 * the dual legacy/V2 disabled-defaults fields, the caps that keep the blob
 * bounded, and which sections may be written as empty. Everything above it works
 * in the app's own vocabulary and reads/writes the snapshot once per cycle.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/app';
import { getTiles } from '@/stores/customTiles';
import { getCustomGroups } from '@/stores/customGroups';
import { getAllDisabledRecords } from '@/stores/disabledDefaults';
import { getBoards } from '@/stores/gameBoard';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  collectGroupExtensionRecords,
  type GroupExtensionRecord,
} from './customGroupExtensionsSync';
import type { CustomGroupPull } from '@/types/customGroups';
import type { CustomTilePull, DisabledDefault } from '@/types/customTiles';
import type { DBGameBoard } from '@/types/gameBoard';

// Old clients read a flat `disabledDefaults` array (no tombstones) and skip it
// entirely when it exceeds 100, so we best-effort cap the legacy field there.
const LEGACY_DISABLED_CAP = 100;
// The full record set (incl. tombstones) shares the single ~1 MiB `user-data`
// doc with tiles/groups/boards/settings, so it must stay bounded. Genuine usage
// is small; exceeding this signals corruption — drop loudly, never silently.
const DISABLED_V2_MAX = 1000;

/**
 * A section left `undefined` is one the document does not carry — callers must
 * distinguish "absent" (never synced from this account) from "present but
 * empty" (deliberately emptied), because only the latter may overwrite local
 * content.
 */
export interface RemoteUserData {
  customTiles?: CustomTilePull[];
  customGroups?: CustomGroupPull[];
  groupExtensions?: GroupExtensionRecord[];
  /** V2 records; a legacy-only document is up-converted here. */
  disabledDefaults?: DisabledDefault[];
  gameBoards?: DBGameBoard[];
  settings?: Record<string, unknown>;
}

/** Everything this device would publish, in one snapshot. */
export interface LocalUserData {
  customTiles: CustomTilePull[];
  customGroups: CustomGroupPull[];
  groupExtensions: GroupExtensionRecord[];
  disabledDefaults: DisabledDefault[];
  gameBoards: DBGameBoard[];
  settings: Record<string, unknown>;
}

interface LegacyDisabled {
  group_id?: string;
  intensity: number;
  action: string;
}

/**
 * Up-convert the pre-tombstone array. No timestamp exists in that shape, so
 * stamp 1: any genuine V2 edit outranks it, while a first-time import still
 * applies over the never-seen local default (-1).
 */
function legacyToRecords(legacy: LegacyDisabled[]): DisabledDefault[] {
  return legacy
    .filter((t) => t && typeof t.action === 'string')
    .map((t) => ({
      key: `${t.group_id}|${t.intensity}|${t.action}`,
      group_id: t.group_id,
      intensity: t.intensity,
      action: t.action,
      active: true,
      updatedAt: 1,
    }));
}

function userDoc(uid: string) {
  return doc(db, 'user-data', uid);
}

/** Decode the cloud snapshot. `null` means the account has no document yet. */
export async function readRemoteUserData(uid: string): Promise<RemoteUserData | null> {
  const snapshot = await getDoc(userDoc(uid));
  if (!snapshot.exists()) return null;
  return decodeRemoteUserData(snapshot.data());
}

/**
 * The document's field names stop here. Exported for tests and for the
 * real-time listener, which already holds a snapshot's data.
 */
export function decodeRemoteUserData(data: Record<string, any> | undefined): RemoteUserData {
  const raw = data ?? {};
  const hasV2 = raw.disabledDefaultsV2 !== undefined;
  const hasLegacy = raw.disabledDefaults !== undefined;

  return {
    customTiles:
      raw.customTiles === undefined ? undefined : ((raw.customTiles || []) as CustomTilePull[]),
    customGroups:
      raw.customGroups === undefined ? undefined : ((raw.customGroups || []) as CustomGroupPull[]),
    groupExtensions:
      raw.customGroupExtensions === undefined
        ? undefined
        : ((raw.customGroupExtensions || []) as GroupExtensionRecord[]),
    disabledDefaults:
      !hasV2 && !hasLegacy
        ? undefined
        : Array.isArray(raw.disabledDefaultsV2)
          ? (raw.disabledDefaultsV2 as DisabledDefault[])
          : legacyToRecords((raw.disabledDefaults ?? []) as LegacyDisabled[]),
    gameBoards:
      raw.gameBoards === undefined ? undefined : ((raw.gameBoards || []) as DBGameBoard[]),
    settings:
      raw.settings === undefined ? undefined : ((raw.settings || {}) as Record<string, unknown>),
  };
}

/** Snapshot everything this device would publish, from Dexie and the store. */
export async function collectLocalUserData(): Promise<LocalUserData> {
  const [customTiles, customGroups, groupExtensions, disabledDefaults, gameBoards] =
    await Promise.all([
      getTiles({ isCustom: 1 }),
      getCustomGroups({ isDefault: false }),
      collectGroupExtensionRecords(),
      getAllDisabledRecords(),
      getBoards(),
    ]);

  const { settings } = useSettingsStore.getState();
  // localPlayers is device-local by design, and Firestore rejects undefined.
  const { localPlayers: _localPlayers, ...shareable } = settings;
  const cleanSettings = Object.fromEntries(
    Object.entries(shareable).filter(([, value]) => value !== undefined)
  );

  return {
    customTiles: customTiles as CustomTilePull[],
    customGroups,
    groupExtensions,
    disabledDefaults,
    gameBoards,
    settings: cleanSettings,
  };
}

function extensionKey(record: GroupExtensionRecord): string {
  return JSON.stringify([record.groupName, record.locale, record.gameMode]);
}

/**
 * Publish the snapshot in a single merge write.
 *
 * `remote`, when the caller already holds the cloud snapshot, keeps extension
 * records for groups this device has not seeded (a locale it never loaded, or an
 * older app version). `CustomGroupExtensionsSync` skips those on pull expecting
 * them to survive in the cloud until the group exists, and a blind local
 * snapshot would delete them.
 */
export async function writeRemoteUserData(
  uid: string,
  local: LocalUserData,
  remote?: RemoteUserData | null
): Promise<void> {
  let records = local.disabledDefaults;
  if (records.length > DISABLED_V2_MAX) {
    const dropped = records.length - DISABLED_V2_MAX;
    console.warn(
      `⚠️ ${records.length} disabled-default records exceeds the ${DISABLED_V2_MAX} cap; ` +
        `dropping ${dropped} from sync. This likely indicates corrupted local data.`
    );
    records = records.slice(0, DISABLED_V2_MAX);
  }

  const legacyActive = records
    .filter((r) => r.active)
    .map((r) => ({ group_id: r.group_id, intensity: r.intensity, action: r.action }));
  if (legacyActive.length > LEGACY_DISABLED_CAP) {
    legacyActive.splice(LEGACY_DISABLED_CAP);
  }

  const knownExtensions = new Set(local.groupExtensions.map(extensionKey));
  const groupExtensions = [
    ...local.groupExtensions,
    ...(remote?.groupExtensions ?? []).filter(
      (record) => record && !knownExtensions.has(extensionKey(record))
    ),
  ];

  await setDoc(
    userDoc(uid),
    {
      customTiles: local.customTiles,
      customGroups: local.customGroups,
      customGroupExtensions: groupExtensions,
      disabledDefaults: legacyActive,
      disabledDefaultsV2: records,
      // A device with no boards must not blank another device's — an empty
      // local list means "nothing to contribute", not "delete what is there".
      ...(local.gameBoards.length > 0 ? { gameBoards: local.gameBoards } : {}),
      settings: local.settings,
      lastUpdated: new Date(),
    },
    { merge: true }
  );
}
