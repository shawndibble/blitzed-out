export interface TokenInsertion {
  text: string;
  caret: number;
  /** True when the token was dropped because the result would exceed maxLength. */
  clamped: boolean;
}

// A trailing space would only get in the way in front of these.
const NO_TRAILING_SPACE_BEFORE = /^[\s.,!?;:)\]}'"]/;
// Nor would a leading space right after an opener.
const NO_LEADING_SPACE_AFTER = /[\s([{]$/;

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max);

/**
 * Splice a placeholder token into an action string at the caret/selection,
 * adding surrounding spaces only where the author would have typed them.
 * A null selection means "caret position unknown" — append to the end.
 * Offsets are clamped because the caller's cached selection can predate an
 * external draft change (loading a tile for edit, Clear).
 */
export function insertPlaceholderToken(
  text: string,
  selectionStart: number | null,
  selectionEnd: number | null,
  token: string,
  maxLength: number
): TokenInsertion {
  const rawStart = selectionStart ?? text.length;
  const rawEnd = selectionEnd ?? rawStart;
  const start = clamp(Math.min(rawStart, rawEnd), text.length);
  const end = clamp(Math.max(rawStart, rawEnd), text.length);

  const before = text.slice(0, start);
  const after = text.slice(end);

  const leading = before.length > 0 && !NO_LEADING_SPACE_AFTER.test(before) ? ' ' : '';
  const trailing = after.length > 0 && !NO_TRAILING_SPACE_BEFORE.test(after) ? ' ' : '';
  const insertion = `${leading}${token}${trailing}`;

  const next = `${before}${insertion}${after}`;
  if (next.length > maxLength) return { text, caret: end, clamped: true };

  return { text: next, caret: start + insertion.length, clamped: false };
}
