import React from 'react';

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Element extends React.ReactElement<any, any> {}
  }
}

// Vite types for import.meta.glob
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly glob: (pattern: string) => Record<string, () => Promise<any>>;
}

export {};
