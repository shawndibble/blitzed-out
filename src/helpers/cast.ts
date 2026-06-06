import { ActionCard } from '@/types/cast';
import { Message } from '@/types/Message';

/** Custom Cast message namespace shared by the Sender and the Receiver shell. */
export const CAST_NAMESPACE = 'urn:x-cast:com.blitzedout.app';

export interface CastLoadMessage {
  type: 'LOAD';
  url: string;
}

export interface CastEnvironmentInputs {
  userAgent: string;
  search: string;
  hasReceiverContext: boolean;
}

/** Platform-agnostic Cast view URL for a Room. This is the seam every TV path loads. */
export function buildCastUrl(origin: string, room: string): string {
  return `${origin.replace(/\/$/, '')}/${room}/cast`;
}

/** Sender → Receiver instruction telling the TV which Cast view URL to render. */
export function buildLoadMessage(url: string): CastLoadMessage {
  return { type: 'LOAD', url };
}

/**
 * Parse a structured action Message into the card the Cast view displays.
 * Expected text shape: line 0 is the roll, then `Type: ...` and `Activity: ...`.
 */
export function parseActionCard(lastAction: Message): ActionCard {
  const { text, displayName } = lastAction;
  if (!displayName) return {};

  const splitText = text?.split('\n');
  const [typeString, activityString] = splitText?.slice(1) || [];
  const type = typeString?.split(':')[1]?.trim();
  const activity = activityString?.split(':')[1]?.trim();

  return { displayName, type, activity };
}

/** Whether the current page is rendering inside a TV/cast receiver rather than a normal browser. */
export function detectCastEnvironment({
  userAgent,
  search,
  hasReceiverContext,
}: CastEnvironmentInputs): boolean {
  const isChromecastAgent = userAgent.includes('CrKey') || userAgent.includes('TV');
  return (
    hasReceiverContext ||
    isChromecastAgent ||
    search.includes('chromecast') ||
    search.includes('receiver')
  );
}
