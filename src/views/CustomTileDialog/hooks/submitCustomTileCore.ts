import { CustomTile, SubmitMessage } from '@/types/customTiles';

/**
 * Inputs to the submit decision — everything the pure core needs, with zero
 * external imports. The impure hook builds this bundle (normalizing
 * placeholders, resolving the selected group, etc.) and feeds it in.
 */
export interface SubmitCoreInput {
  gameMode: string;
  /** Resolved group id, or undefined when no group is selected. */
  selectedGroupId?: string;
  intensity: string;
  /** Action text, already normalized to canonical placeholders. */
  action: string;
  /** Committed tags from the draft. */
  tags: string[];
  /** Pending, un-committed text still in the tag input (may be empty). */
  pendingTag: string;
  /** Current debounced validation message (non-empty blocks submission). */
  validationMessage: string;
  /** Edit-target tile id; null when creating a new tile. */
  updateTileId: number | null;
  /**
   * Existence check for create-mode dedup. Returns true when an identical tile
   * already exists for the group/intensity/action tuple.
   */
  tileExists: (groupId: string, intensity: string | number, action: string) => boolean;
}

/** Localized error strings — passed in so the core needs no i18next. */
export interface SubmitCoreMessages {
  allFieldsRequired: string;
  actionExists: string;
}

export type SubmitCoreResult =
  | { kind: 'error'; message: SubmitMessage }
  | { kind: 'proceed'; data: CustomTile; tags: string[]; isUpdate: boolean };

/**
 * Pure pre-validation decision for submitting a custom tile.
 *
 * Mirrors the original AddCustomTile.submitNewTile gating exactly:
 * append any pending tag, require all fields, surface the debounced
 * validation message, and dedup on create. The async group-validation and
 * persistence stay in the hook; this core decides whether to proceed and with
 * what payload.
 */
export function submitCustomTileCore(
  input: SubmitCoreInput,
  messages: SubmitCoreMessages
): SubmitCoreResult {
  const { gameMode, selectedGroupId, intensity, action, validationMessage, updateTileId } = input;

  // Append the pending (typed-but-not-Entered) tag so it isn't silently lost.
  const tags = [...input.tags];
  const trimmedPending = input.pendingTag.trim();
  if (trimmedPending) {
    tags.push(trimmedPending);
  }

  if (!gameMode || !selectedGroupId || !intensity || !action) {
    return { kind: 'error', message: { message: messages.allFieldsRequired, type: 'error' } };
  }

  if (validationMessage) {
    return { kind: 'error', message: { message: validationMessage, type: 'error' } };
  }

  if (updateTileId == null && input.tileExists(selectedGroupId, intensity, action)) {
    return { kind: 'error', message: { message: messages.actionExists, type: 'error' } };
  }

  const data: CustomTile = {
    group_id: selectedGroupId,
    intensity: Number(intensity),
    action,
    tags,
    isCustom: 1,
  };

  return { kind: 'proceed', data, tags, isUpdate: updateTileId !== null };
}
