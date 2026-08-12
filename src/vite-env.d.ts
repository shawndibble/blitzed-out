/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
// Node's ambient types (`NodeJS.Timeout`, and `process`/`fs`/`path`/`global` in
// tests). This project has no explicit `@types/node` entry and TypeScript is not
// auto-including it, so until `simple-peer` was removed the whole program picked
// these up through `@types/simple-peer`'s own reference directive — by accident.
/// <reference types="node" />

// Extend the existing Vite ImportMetaEnv with our custom environment variables
interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_SENTRY_DSN?: string;

  // Firebase environment variables
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
}
