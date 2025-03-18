export interface WindowCast {
  __castApiInitialized?: boolean;
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  chrome?: {
    cast?: {
      AutoJoinPolicy?: {
        ORIGIN_SCOPED: string;
      };
    };
  };
  cast?: {
    framework?: {
      CastContext: {
        getInstance: () => {
          getCurrentSession: () => any;
          setOptions: (options: { receiverApplicationId: string; autoJoinPolicy?: string }) => void;
          addEventListener: (
            eventType: string,
            listener: (event: { sessionState: string }) => void
          ) => void;
          requestSession: () => Promise<void>;
        };
      };
      CastContextEventType: {
        SESSION_STATE_CHANGED: string;
      };
      SessionState: {
        SESSION_STARTED: string;
        SESSION_RESUMED: string;
        SESSION_ENDED: string;
      };
      CastReceiverContext?: {
        getInstance: () => any;
      };
    };
  };
}

// Extend the global Window interface
declare global {
  interface Window extends WindowCast {}
}

// This empty export makes this file a module
export {};
