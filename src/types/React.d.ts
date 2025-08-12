import React from 'react';

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Element extends React.ReactElement<any, any> {}
  }

  interface Window {
    // Cast API globals
    __castApiInitialized: boolean;
    __castScriptLoading: boolean;
    __onGCastApiAvailable: (isAvailable: boolean) => void;

    // Google Cast API types
    cast?: {
      framework?: {
        CastContext: {
          getInstance: () => any;
        };
        CastReceiverContext?: any;
        CastContextEventType: {
          SESSION_STATE_CHANGED: string;
        };
        SessionState: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
          SESSION_ENDED: string;
        };
      };
    };

    chrome?: {
      cast?: {
        AutoJoinPolicy?: {
          ORIGIN_SCOPED: string;
        };
      };
    };
  }
}

export {};
