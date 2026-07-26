/**
 * Private room codes.
 *
 * The alphabet excludes 0, O and I so a code read aloud or typed from a
 * screenshot can't land in the wrong room. Four surfaces used to declare this generator
 * verbatim — the wizard's topology and finish steps, the settings page and its
 * room section — which is four places for the alphabet to drift.
 */
import { customAlphabet } from 'nanoid';

/** Omits 0, O and I — the glyphs users confuse when reading a code aloud or
 * retyping it from a screenshot. 1 stays: it is unambiguous without an I. */
const ROOM_CODE_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 5;

const nanoid = customAlphabet(ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH);

/** A fresh private-room code. */
export function generateRoomCode(): string {
  return nanoid();
}
