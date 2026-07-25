import { ActionsMessage, TurnFields } from '@/types/Message';

/** The two translated words the legacy decoder needs to guess kind/finished from raw text. */
export interface LegacyFinishTranslations {
  finishWord: string;
  startWord: string;
}

const LOCATION_LINE = /^#(\d+):\s*(.*)$/;

/**
 * @deprecated Back-compat ONLY, for action messages written before turn
 * fields shipped (see docs/adr or the commit that introduced this file).
 * Reproduces the old ad-hoc string parsing -- including its cross-locale
 * `finish`/`start` substring matching -- so a game already in flight keeps
 * working across the deploy. Every message written after this change carries
 * `turn` directly and never reaches this function. Safe to delete once the
 * 24h message TTL (see services/firebase.ts sendMessage) has fully rolled
 * past this change's ship date (2026-07-25) -- safe to delete after ~2026-08-25.
 */
export function decodeLegacyActionText(
  text: string,
  { finishWord, startWord }: LegacyFinishTranslations
): TurnFields {
  const raw = text ?? '';
  const lines = raw.split(/\r?\n/);
  const locationLineIndex = lines.findIndex((line) => LOCATION_LINE.test(line));
  const locationMatch = lines[locationLineIndex]?.match(LOCATION_LINE);
  const location = locationMatch ? Math.max(0, Number(locationMatch[1]) - 1) : 0;
  const title = locationMatch?.[2]?.trim() ?? '';

  const descriptionLine =
    locationLineIndex >= 0 ? lines[locationLineIndex + 1] : lines[lines.length - 1];
  const colonIndex = descriptionLine?.indexOf(':') ?? -1;
  const description =
    colonIndex >= 0
      ? descriptionLine!.slice(colonIndex + 1).trim()
      : (descriptionLine ?? '').trim();

  return {
    kind: raw.includes(startWord) ? 'restart' : 'normal',
    roll: null,
    location,
    title,
    description,
    finished: raw.includes(finishWord),
  };
}

/** Every consumer's single entry point: prefer the carried fields, fall back to legacy parsing. */
export function getTurnFields(
  message: Pick<ActionsMessage, 'text' | 'turn'>,
  translations: LegacyFinishTranslations
): TurnFields {
  return message.turn ?? decodeLegacyActionText(message.text, translations);
}
