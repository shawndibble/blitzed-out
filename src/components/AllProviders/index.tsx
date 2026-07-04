import { useEffect } from 'react';
import { ProvidersProps } from '@/types/app';
import { initContentReadiness } from '@/services/migration/contentReadiness';
import { ScheduleProvider } from '@/context/schedule';
import { ThemeProvider } from '@/context/theme';
import MuiProviders from '@/components/MuiProviders';
import ReloadPrompt from '@/components/ReloadPrompt';

/**
 * Consolidated providers component to reduce Suspense boundary nesting
 * This helps fix iOS Safari module loading issues by reducing import waterfalls
 */
export default function AllProviders({ children }: ProvidersProps) {
  // Content seeding starts here: AllProviders mounts only after auth resolves,
  // preserving the auth → seeding order of the old MigrationProvider.
  useEffect(() => initContentReadiness(), []);

  return (
    <ThemeProvider>
      <ScheduleProvider>
        <MuiProviders>
          {children}
          <ReloadPrompt />
        </MuiProviders>
      </ScheduleProvider>
    </ThemeProvider>
  );
}
