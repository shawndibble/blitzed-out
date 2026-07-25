import { isPublicRoom } from '@/helpers/strings';
import type { ActionEntry } from '@/types';
import type { GameMode } from '@/types/Settings';

export type DeviceSharing = 'justMe' | 'several';

/** Who else is in the game. Only meaningful when DeviceSharing is 'justMe'. */
export type SessionCompany = 'noOne' | 'strangers' | 'friends';

export interface SetupAnswers {
  device: DeviceSharing;
  company: SessionCompany;
}

/**
 * The persisted topology + room, read back as the two questions the user
 * actually answers. See CONTEXT.md "Setup Questions" for the canonical table.
 *
 * Shared Device reports `friends` for a company it never asks about, so that
 * switching to "just me" keeps the private room and the partnered content the
 * player already had, instead of silently dropping them into solo content.
 */
export function deriveSetupAnswers(gameMode: GameMode | undefined, room: string): SetupAnswers {
  if (gameMode === 'local') return { device: 'several', company: 'friends' };
  if (gameMode === 'online') return { device: 'justMe', company: 'friends' };
  return { device: 'justMe', company: isPublicRoom(room) ? 'strangers' : 'noOne' };
}

/**
 * The inverse: two answers in, topology + room out. Never emits an invalid
 * pairing — PUBLIC is Solo-only, so every other combination resolves to a
 * private room (ADR-0002).
 *
 * `getPrivateRoom` supplies the room to use when one is needed and the current
 * room is public; it is expected to return the visit's existing private code
 * rather than minting a fresh one on every call.
 */
export function resolveSetupAnswers(
  answers: SetupAnswers,
  currentRoom: string,
  getPrivateRoom: () => string
): { gameMode: GameMode; room: string } {
  const privateRoom = (): string =>
    isPublicRoom(currentRoom) || !currentRoom ? getPrivateRoom() : currentRoom.toUpperCase();

  if (answers.device === 'several') return { gameMode: 'local', room: privateRoom() };
  if (answers.company === 'strangers') return { gameMode: 'solo', room: 'PUBLIC' };
  if (answers.company === 'friends') return { gameMode: 'online', room: privateRoom() };
  return { gameMode: 'solo', room: privateRoom() };
}

/**
 * Whether Room & players has anything to offer, so the page can drop the
 * section (and its jump-nav entry) rather than render a heading over nothing.
 *
 * Mirrors what `RoomSection` actually renders: the private-room code card
 * (private, non-local), the roster (local), and player-list updates (online in a
 * private room). Every one of those needs a private room or a local roster, so a
 * public room leaves nothing behind — the room is not yours to configure, there
 * is no roster, and PUBLIC forces real-time presence regardless of the
 * player-list setting. What the public room means is already stated by the
 * company answer that put you there.
 *
 * Keys on the room alone, not the topology. Only Solo may legitimately be in
 * PUBLIC, but `online` + PUBLIC is reachable via a join link and has just as
 * little to show, so the room is the honest predicate.
 */
export function hasRoomSettings(room: string): boolean {
  return !isPublicRoom(room);
}

/** Only the shape `carrySelectedActions` needs from a loaded action catalog. */
interface CatalogGroup {
  type?: string;
  intensities?: Record<number, string>;
}

/**
 * Re-point a selection at a different content catalog.
 *
 * The two content sets share group *keys* with the same label but different
 * types and different action text — `bating` is a `solo` group online and a
 * `sex` group locally (see CONTEXT.md "Colliding group keys"). So flipping
 * participation reinterprets a chosen group rather than invalidating it, and
 * carrying the selection unchanged would silently swap solo tiles for
 * partnered ones. Groups present in the target carry over, retyped to the
 * target's type; groups absent from it are dropped and reported so the caller
 * can say so out loud.
 *
 * Levels are positional indices, and the tiers don't always line up
 * (partnered `clitTraining` inserts "Oral" at position 2), so they carry
 * positionally and clamp to what the target actually offers.
 */
export function carrySelectedActions(
  selected: Record<string, ActionEntry>,
  targetCatalog: Record<string, CatalogGroup>
): { kept: Record<string, ActionEntry>; droppedKeys: string[] } {
  const kept: Record<string, ActionEntry> = {};
  const droppedKeys: string[] = [];

  Object.entries(selected).forEach(([key, entry]) => {
    const group = targetCatalog[key];
    if (!group) {
      droppedKeys.push(key);
      return;
    }

    const available = Object.keys(group.intensities ?? {}).map(Number);
    const maxLevel = available.length ? Math.max(...available) : 0;
    const levels = [...new Set((entry.levels ?? []).map((level) => Math.min(level, maxLevel)))]
      .filter((level) => level > 0)
      .sort((a, b) => a - b);

    kept[key] = { ...entry, type: (group.type as ActionEntry['type']) ?? entry.type, levels };
  });

  return { kept, droppedKeys };
}
