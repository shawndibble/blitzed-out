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
